from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .artifacts import canonical_json_bytes
from .models import Diagnostic, Evidence, digest_bytes


class InsigniaIdentityError(RuntimeError):
    def __init__(self, message: str, diagnostics: list[Diagnostic] | None = None) -> None:
        super().__init__(message)
        self.diagnostics = diagnostics or []


@dataclass(frozen=True)
class InsigniaIdentityRegistry:
    payload: dict[str, Any]
    records_by_source_key: dict[str, dict[str, Any]]
    tombstones_by_id: dict[int, dict[str, Any]]
    digest: str


def load_identity_registry(path: Path | None = None) -> InsigniaIdentityRegistry:
    registry_path = path or Path(__file__).with_name("insignia_identity_registry.json")
    try:
        payload = json.loads(registry_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise InsigniaIdentityError(f"Insignia identity registry could not be read: {exc}") from exc
    if not isinstance(payload, dict):
        raise InsigniaIdentityError("Insignia identity registry root must be an object")

    diagnostics = validate_identity_registry_payload(payload)
    if any(item.severity in {"critical", "error"} for item in diagnostics):
        raise InsigniaIdentityError("Insignia identity registry failed validation", diagnostics)

    records = payload.get("records") if isinstance(payload.get("records"), list) else []
    tombstones = payload.get("tombstones") if isinstance(payload.get("tombstones"), list) else []
    return InsigniaIdentityRegistry(
        payload=payload,
        records_by_source_key={str(record["sourceKey"]): record for record in records if isinstance(record, dict)},
        tombstones_by_id={int(record["id"]): record for record in tombstones if isinstance(record, dict)},
        digest=digest_bytes(canonical_json_bytes(payload)),
    )


def identity_for_source_key(registry: InsigniaIdentityRegistry, source_key: str) -> int | None:
    record = registry.records_by_source_key.get(source_key)
    if record is None:
        return None
    return int(record["id"])


def registry_summary(registry: InsigniaIdentityRegistry) -> dict[str, Any]:
    return {
        "registryVersion": int(registry.payload["registryVersion"]),
        "recordCount": len(registry.records_by_source_key),
        "tombstoneCount": len(registry.tombstones_by_id),
        "digest": registry.digest,
        "policy": str(registry.payload["policy"]),
    }


def validate_registry_against_source_keys(
    registry: InsigniaIdentityRegistry,
    source_keys: list[str],
) -> list[Diagnostic]:
    diagnostics = validate_identity_registry_payload(registry.payload)
    for source_key in sorted(set(source_keys)):
        if source_key not in registry.records_by_source_key:
            diagnostics.append(
                Diagnostic(
                    code="INSIGNIA_IDENTITY_SOURCE_KEY_UNREGISTERED",
                    severity="critical",
                    message=f"Accepted insignia source key is not in the identity registry: {source_key}",
                    category="schema-shape-error",
                    scope_kind="record",
                    record_id=source_key,
                    source_ids=(source_key,),
                    evidence=(Evidence("artifact", "scripts/data/build_wars_ingest/insignia_identity_registry.json", None),),
                    disposition="non-waivable",
                )
            )
    return sorted(diagnostics, key=lambda item: item.stable_key())


def validate_identity_registry_payload(payload: dict[str, Any]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    if payload.get("registryVersion") != 1:
        diagnostics.append(_diag("INSIGNIA_IDENTITY_REGISTRY_VERSION", "Insignia identity registry version must be 1"))
    records = payload.get("records")
    if not isinstance(records, list) or not records:
        diagnostics.append(_diag("INSIGNIA_IDENTITY_REGISTRY_EMPTY", "Insignia identity registry must contain records"))
        records = []
    tombstones = payload.get("tombstones")
    if not isinstance(tombstones, list):
        diagnostics.append(_diag("INSIGNIA_IDENTITY_TOMBSTONES_SHAPE", "Insignia identity tombstones must be a list"))
        tombstones = []

    ids: list[int] = []
    source_keys: list[str] = []
    variant_keys: list[str] = []
    for record in records:
        if not isinstance(record, dict):
            diagnostics.append(_diag("INSIGNIA_IDENTITY_RECORD_SHAPE", "Insignia identity record must be an object"))
            continue
        record_id = record.get("id")
        source_key = record.get("sourceKey")
        status = record.get("status")
        if not isinstance(record_id, int) or record_id <= 0:
            diagnostics.append(_diag("INSIGNIA_IDENTITY_ID_INVALID", "Insignia identity id must be a positive integer"))
        else:
            ids.append(record_id)
        if not isinstance(source_key, str) or not source_key:
            diagnostics.append(_diag("INSIGNIA_IDENTITY_SOURCE_KEY_INVALID", "Insignia source key must be non-empty"))
        else:
            source_keys.append(source_key)
        if status != "active":
            diagnostics.append(_diag("INSIGNIA_IDENTITY_STATUS_INVALID", "Initial insignia registry records must be active"))
        variant = record.get("variantKey")
        if variant is not None and not isinstance(variant, str):
            diagnostics.append(_diag("INSIGNIA_IDENTITY_VARIANT_INVALID", "Insignia variant key must be a string or null"))
        variant_keys.append(f"{source_key}::{variant}")

    tombstone_ids: list[int] = []
    for tombstone in tombstones:
        if not isinstance(tombstone, dict):
            diagnostics.append(_diag("INSIGNIA_IDENTITY_TOMBSTONE_SHAPE", "Insignia tombstone must be an object"))
            continue
        tombstone_id = tombstone.get("id")
        if not isinstance(tombstone_id, int) or tombstone_id <= 0:
            diagnostics.append(_diag("INSIGNIA_IDENTITY_TOMBSTONE_ID_INVALID", "Tombstone id must be positive"))
        else:
            tombstone_ids.append(tombstone_id)
        if not tombstone.get("reason"):
            diagnostics.append(_diag("INSIGNIA_IDENTITY_TOMBSTONE_REASON_MISSING", "Tombstones require a reason"))

    diagnostics.extend(_duplicate_diagnostics(ids, "INSIGNIA_IDENTITY_DUPLICATE_ID", "id"))
    diagnostics.extend(_duplicate_diagnostics(source_keys, "INSIGNIA_IDENTITY_DUPLICATE_SOURCE_KEY", "sourceKey"))
    diagnostics.extend(_duplicate_diagnostics(variant_keys, "INSIGNIA_IDENTITY_DUPLICATE_VARIANT", "variantKey"))
    reused = set(ids).intersection(tombstone_ids)
    for value in sorted(reused):
        diagnostics.append(_diag("INSIGNIA_IDENTITY_REUSED_TOMBSTONE", f"Active insignia id reuses tombstone {value}"))
    return sorted(diagnostics, key=lambda item: item.stable_key())


def _duplicate_diagnostics(values: list[Any], code: str, label: str) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    seen: set[Any] = set()
    duplicates: set[Any] = set()
    for value in values:
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    for value in sorted(duplicates, key=str):
        diagnostics.append(_diag(code, f"Duplicate insignia identity {label}: {value}"))
    return diagnostics


def _diag(code: str, message: str) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity="critical",
        message=message,
        category="schema-shape-error",
        scope_kind="artifact",
        artifact_path="scripts/data/build_wars_ingest/insignia_identity_registry.json",
        evidence=(Evidence("artifact", "scripts/data/build_wars_ingest/insignia_identity_registry.json", None),),
        disposition="non-waivable",
    )
