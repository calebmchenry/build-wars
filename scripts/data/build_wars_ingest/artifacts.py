from __future__ import annotations

import json
import math
import os
import tempfile
from pathlib import Path
from typing import Any

from .config import GENERATOR_NAME, INGESTION_SCHEMA_VERSION
from .models import Diagnostic, Evidence, digest_bytes, digest_wire


class ArtifactError(RuntimeError):
    def __init__(self, code: str, message: str, diagnostics: list[Diagnostic] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.diagnostics = diagnostics or []


def canonical_json_bytes(value: Any) -> bytes:
    _reject_non_finite(value)
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")


def write_canonical_json(root: Path, relative_path: Path, value: Any) -> tuple[Path, str]:
    path = confined_path(root, relative_path)
    data = canonical_json_bytes(value)
    atomic_write(path, data)
    return path, digest_bytes(data)


def write_generated_artifact(
    *,
    root: Path,
    relative_path: Path,
    value: Any,
    generated_at: str,
    input_snapshot_manifest_paths: list[str],
    source_ids: list[str],
    record_count: int,
    qa_report_path: str | None,
    commit_decision: str = "ignored",
    notes: str | None = None,
) -> tuple[Path, Path, dict[str, Any]]:
    artifact_path, digest = write_canonical_json(root, relative_path, value)
    manifest = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "artifactPath": relative_path.as_posix(),
        "generatedAt": generated_at,
        "generator": GENERATOR_NAME,
        "inputSnapshotManifestPaths": sorted(input_snapshot_manifest_paths),
        "sourceIds": sorted(source_ids),
        "recordCount": record_count,
        "digest": digest_wire(digest),
        "qaReportPath": qa_report_path,
        "commitDecision": commit_decision,
        "notes": notes,
    }
    manifest_path, _ = write_canonical_json(root, relative_path.with_suffix(".manifest.json"), manifest)
    return artifact_path, manifest_path, manifest


def compare_baseline(current: Any, baseline_path: Path | None, *, artifact_path: str) -> list[Diagnostic]:
    if baseline_path is None:
        return [
            Diagnostic(
                code="ARTIFACT_BASELINE_NOT_PROVIDED",
                severity="info",
                message="No artifact baseline was provided for comparison",
                category="generated-data-diff",
                artifact_path=artifact_path,
            )
        ]
    try:
        baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    except OSError as exc:
        return [
            Diagnostic(
                code="ARTIFACT_BASELINE_UNREADABLE",
                severity="warning",
                message=f"Artifact baseline could not be read: {exc}",
                category="generated-data-diff",
                artifact_path=artifact_path,
            )
        ]
    if not isinstance(baseline, dict) or not isinstance(current, dict):
        return [
            Diagnostic(
                code="ARTIFACT_BASELINE_SCHEMA_MISMATCH",
                severity="error",
                message="Artifact baseline and current artifact must both be JSON objects",
                category="schema-shape-error",
                artifact_path=artifact_path,
            )
        ]
    if baseline.get("schemaVersion") != current.get("schemaVersion"):
        return [
            Diagnostic(
                code="ARTIFACT_BASELINE_SCHEMA_MISMATCH",
                severity="error",
                message="Artifact baseline schemaVersion does not match current artifact",
                category="schema-shape-error",
                artifact_path=artifact_path,
            )
        ]
    if canonical_json_bytes(baseline) != canonical_json_bytes(current):
        return [
            Diagnostic(
                code="ARTIFACT_BASELINE_DIFF",
                severity="warning",
                message="Current artifact differs from the provided baseline",
                category="generated-data-diff",
                artifact_path=artifact_path,
            )
        ]
    return []


def classify_baseline_diff(current: Any, baseline: Any | None) -> str:
    if baseline is None:
        return "first-baseline"
    if not isinstance(current, dict) or not isinstance(baseline, dict):
        return "schema"
    if current.get("schemaVersion") != baseline.get("schemaVersion"):
        return "schema"
    if _semantic_projection(current) != _semantic_projection(baseline):
        return "semantic"
    if _provenance_projection(current) != _provenance_projection(baseline):
        return "provenance-only"
    if canonical_json_bytes(current) != canonical_json_bytes(baseline):
        return "formatting-or-order"
    return "unchanged"


def confined_path(root: Path, relative_or_absolute: Path) -> Path:
    resolved_root = root.resolve()
    candidate = relative_or_absolute.resolve() if relative_or_absolute.is_absolute() else (resolved_root / relative_or_absolute).resolve()
    try:
        candidate.relative_to(resolved_root)
    except ValueError as exc:
        raise ArtifactError(
            "artifact-path-escape",
            f"Artifact path escapes output root: {relative_or_absolute}",
            [
                Diagnostic(
                    code="ARTIFACT_PATH_ESCAPE",
                    severity="critical",
                    message="Artifact path escaped the configured root",
                    category="artifact-integrity-mismatch",
                    artifact_path=str(relative_or_absolute),
                    disposition="non-waivable",
                )
            ],
        ) from exc
    return candidate


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    tmp_path = Path(tmp_name)
    try:
        with os.fdopen(fd, "wb") as tmp:
            tmp.write(data)
            tmp.flush()
            os.fsync(tmp.fileno())
        os.replace(tmp_path, path)
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


def _reject_non_finite(value: Any) -> None:
    if isinstance(value, float) and not math.isfinite(value):
        raise ArtifactError(
            "artifact-non-finite-number",
            "Generated artifacts must not contain NaN or infinite numbers",
        )
    if isinstance(value, list):
        for item in value:
            _reject_non_finite(item)
    elif isinstance(value, dict):
        for item in value.values():
            _reject_non_finite(item)


def _semantic_projection(value: Any) -> Any:
    if isinstance(value, list):
        return [_semantic_projection(item) for item in value]
    if isinstance(value, dict):
        return {
            key: _semantic_projection(item)
            for key, item in value.items()
            if key
            not in {
                "generatedAt",
                "retrievedAt",
                "sourceRevisionTimestamp",
                "revisionId",
                "sources",
                "snapshotManifestPaths",
                "provenance",
                "manualReviews",
                "sourceShapeProof",
                "sectionDigests",
                "catalogVersion",
                "digest",
            }
        }
    return value


def _provenance_projection(value: Any) -> Any:
    if isinstance(value, list):
        return [_provenance_projection(item) for item in value]
    if isinstance(value, dict):
        return {
            key: _provenance_projection(item)
            for key, item in value.items()
            if key in {"sources", "snapshotManifestPaths", "provenance", "manualReviews", "sourceShapeProof"}
        } or {key: _provenance_projection(item) for key, item in value.items()}
    return value
