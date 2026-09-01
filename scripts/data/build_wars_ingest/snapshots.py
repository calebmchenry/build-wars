from __future__ import annotations

import json
import os
import re
import tempfile
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import INGESTION_SCHEMA_VERSION
from .models import Diagnostic, digest_bytes, digest_wire


class SnapshotError(RuntimeError):
    def __init__(self, code: str, message: str, diagnostics: list[Diagnostic] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.diagnostics = diagnostics or []


@dataclass(frozen=True)
class SnapshotIdentity:
    source_family: str
    material_kind: str
    title: str
    page_id: int | str | None = None
    file_title: str | None = None
    revision_id: int | str | None = None

    @property
    def display_title(self) -> str:
        return self.file_title or self.title


@dataclass(frozen=True)
class SnapshotWriteResult:
    artifact_path: Path
    manifest_path: Path
    manifest: dict[str, Any]
    reused_existing: bool


@dataclass(frozen=True)
class LoadedSnapshot:
    payload: bytes
    manifest: dict[str, Any]
    diagnostics: list[Diagnostic]


def safe_slug(value: str, *, digest_len: int = 10) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    asciiish = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", asciiish).strip("-").lower()
    if not slug:
        slug = "item"
    slug = slug[:60].strip("-") or "item"
    return f"{slug}-{digest_bytes(value.encode('utf-8'))[:digest_len]}"


def snapshot_relative_path(identity: SnapshotIdentity, payload: bytes) -> Path:
    family = safe_slug(identity.source_family, digest_len=6)
    kind = safe_slug(identity.material_kind, digest_len=6)
    revision = f"rev-{safe_slug(str(identity.revision_id), digest_len=6)}" if identity.revision_id else "no-revision"
    title = safe_slug(identity.display_title)
    content_digest = digest_bytes(payload)[:16]
    return Path(family) / kind / revision / f"{title}-{content_digest}.json"


def manifest_relative_path(artifact_relative_path: Path) -> Path:
    return artifact_relative_path.with_suffix(".manifest.json")


def canonical_raw_payload(value: bytes | str | dict[str, Any] | list[Any]) -> bytes:
    if isinstance(value, bytes):
        return value
    if isinstance(value, str):
        return value.encode("utf-8")
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")


class SnapshotStore:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()

    def write_snapshot(
        self,
        *,
        identity: SnapshotIdentity,
        payload: bytes | str | dict[str, Any] | list[Any],
        source_reference: dict[str, Any],
        retrieved_at: str,
        source_revision_id: int | str | None,
        source_revision_timestamp: str | None,
        notes: str | None = None,
    ) -> SnapshotWriteResult:
        raw = canonical_raw_payload(payload)
        relative_artifact = snapshot_relative_path(identity, raw)
        relative_manifest = manifest_relative_path(relative_artifact)
        artifact_path = self._child_path(relative_artifact)
        manifest_path = self._child_path(relative_manifest)
        digest = digest_bytes(raw)
        diagnostics = self._revision_diagnostics(
            source_reference=source_reference,
            source_revision_id=source_revision_id,
            source_revision_timestamp=source_revision_timestamp,
            retrieved_at=retrieved_at,
        )
        manifest = {
            "schemaVersion": INGESTION_SCHEMA_VERSION,
            "artifactPath": relative_artifact.as_posix(),
            "sourceReference": source_reference,
            "retrievedAt": retrieved_at,
            "sourceRevisionId": source_revision_id,
            "sourceRevisionTimestamp": source_revision_timestamp,
            "digest": digest_wire(digest),
            "rawPayloadPolicy": "ignored",
            "notes": notes,
        }

        if artifact_path.exists():
            existing = artifact_path.read_bytes()
            if digest_bytes(existing) != digest:
                raise SnapshotError(
                    "snapshot-collision",
                    f"Snapshot identity collision with different content: {relative_artifact.as_posix()}",
                )
            if manifest_path.exists():
                return SnapshotWriteResult(artifact_path, manifest_path, manifest, True)

        self._atomic_write(artifact_path, raw)
        self._atomic_write(
            manifest_path,
            (json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8"),
        )
        if diagnostics:
            raise SnapshotError("snapshot-missing-revision", "Snapshot provenance was incomplete", diagnostics)
        return SnapshotWriteResult(artifact_path, manifest_path, manifest, False)

    def load_snapshot(self, manifest_path: Path) -> LoadedSnapshot:
        path = self._child_path(manifest_path)
        try:
            manifest = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            diagnostic = Diagnostic(
                code="SNAPSHOT_UNREADABLE_MANIFEST",
                severity="critical",
                message=f"Snapshot manifest could not be read: {exc}",
                category="artifact-integrity-mismatch",
                artifact_path=str(manifest_path),
                disposition="non-waivable",
            )
            raise SnapshotError("snapshot-unreadable-manifest", str(exc), [diagnostic]) from exc

        if not isinstance(manifest, dict):
            raise SnapshotError("snapshot-manifest-shape", "Snapshot manifest root was not an object")

        artifact_value = manifest.get("artifactPath")
        if not isinstance(artifact_value, str):
            raise SnapshotError("snapshot-manifest-shape", "Snapshot manifest missing artifactPath")

        artifact_path = self._child_path(Path(artifact_value))
        try:
            payload = artifact_path.read_bytes()
        except OSError as exc:
            diagnostic = Diagnostic(
                code="SNAPSHOT_UNREADABLE_ARTIFACT",
                severity="critical",
                message=f"Snapshot payload could not be read: {exc}",
                category="artifact-integrity-mismatch",
                artifact_path=artifact_value,
                disposition="non-waivable",
            )
            raise SnapshotError("snapshot-unreadable-artifact", str(exc), [diagnostic]) from exc

        diagnostics = self.validate_manifest(manifest, payload)
        if diagnostics:
            raise SnapshotError("snapshot-integrity", "Snapshot manifest failed integrity validation", diagnostics)
        return LoadedSnapshot(payload=payload, manifest=manifest, diagnostics=[])

    def validate_manifest(self, manifest: dict[str, Any], payload: bytes) -> list[Diagnostic]:
        diagnostics: list[Diagnostic] = []
        artifact_path = str(manifest.get("artifactPath", ""))
        digest = manifest.get("digest")
        expected = digest.get("value") if isinstance(digest, dict) else None
        if expected != digest_bytes(payload):
            diagnostics.append(
                Diagnostic(
                    code="SNAPSHOT_DIGEST_MISMATCH",
                    severity="critical",
                    message="Snapshot payload SHA-256 did not match manifest",
                    category="artifact-integrity-mismatch",
                    artifact_path=artifact_path,
                    disposition="non-waivable",
                )
            )
        diagnostics.extend(
            self._revision_diagnostics(
                source_reference=manifest.get("sourceReference") if isinstance(manifest.get("sourceReference"), dict) else {},
                source_revision_id=manifest.get("sourceRevisionId"),
                source_revision_timestamp=manifest.get("sourceRevisionTimestamp"),
                retrieved_at=manifest.get("retrievedAt"),
            )
        )
        return diagnostics

    def _revision_diagnostics(
        self,
        *,
        source_reference: dict[str, Any],
        source_revision_id: int | str | None,
        source_revision_timestamp: str | None,
        retrieved_at: str | None,
    ) -> list[Diagnostic]:
        source_id = str(source_reference.get("id", "source:unknown"))
        diagnostics: list[Diagnostic] = []
        if source_revision_id is None:
            diagnostics.append(
                Diagnostic(
                    code="SNAPSHOT_MISSING_REVISION_ID",
                    severity="error",
                    message="Snapshot is missing a source revision id",
                    category="stale-or-unverified-revision",
                    scope_kind="source",
                    source_ids=(source_id,),
                )
            )
        if not source_revision_timestamp:
            diagnostics.append(
                Diagnostic(
                    code="SNAPSHOT_MISSING_REVISION_TIMESTAMP",
                    severity="error",
                    message="Snapshot is missing a source revision timestamp",
                    category="stale-or-unverified-revision",
                    scope_kind="source",
                    source_ids=(source_id,),
                )
            )
        if not retrieved_at:
            diagnostics.append(
                Diagnostic(
                    code="SNAPSHOT_MISSING_RETRIEVED_AT",
                    severity="error",
                    message="Snapshot is missing a retrieval timestamp",
                    category="stale-or-unverified-revision",
                    scope_kind="source",
                    source_ids=(source_id,),
                )
            )
        return diagnostics

    def _child_path(self, relative_or_absolute: Path) -> Path:
        if relative_or_absolute.is_absolute():
            candidate = relative_or_absolute.resolve()
        else:
            candidate = (self.root / relative_or_absolute).resolve()
        try:
            candidate.relative_to(self.root)
        except ValueError as exc:
            raise SnapshotError("snapshot-path-escape", f"Path escapes snapshot root: {relative_or_absolute}") from exc

        parent = candidate.parent
        if parent.exists():
            real_parent = parent.resolve()
            try:
                real_parent.relative_to(self.root)
            except ValueError as exc:
                raise SnapshotError(
                    "snapshot-symlink-escape",
                    f"Snapshot parent escapes root through symlink: {relative_or_absolute}",
                ) from exc
        return candidate

    def _atomic_write(self, path: Path, data: bytes) -> None:
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
