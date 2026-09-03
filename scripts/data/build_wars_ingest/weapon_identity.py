from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .artifacts import canonical_json_bytes
from .models import Diagnostic, Evidence, digest_bytes


class WeaponIdentityError(RuntimeError):
    def __init__(self, message: str, diagnostics: list[Diagnostic] | None = None) -> None:
        super().__init__(message)
        self.diagnostics = diagnostics or []


@dataclass(frozen=True)
class WeaponIdentityRegistry:
    namespace: str
    path: Path
    payload: dict[str, Any]
    records_by_source_key: dict[str, dict[str, Any]]
    tombstones_by_id: dict[int, dict[str, Any]]
    digest: str


def load_weapon_base_registry(path: Path | None = None) -> WeaponIdentityRegistry:
    return _load_registry(
        path or Path(__file__).with_name("weapon_base_identity_registry.json"),
        namespace="weapon-base",
    )


def load_weapon_mod_registry(path: Path | None = None) -> WeaponIdentityRegistry:
    return _load_registry(
        path or Path(__file__).with_name("weapon_mod_identity_registry.json"),
        namespace="weapon-modifier",
    )


def identity_for_source_key(registry: WeaponIdentityRegistry, source_key: str) -> int | None:
    record = registry.records_by_source_key.get(source_key)
    if record is None:
        return None
    return int(record["id"])


def registry_summary(registry: WeaponIdentityRegistry) -> dict[str, Any]:
    return {
        "namespace": registry.namespace,
        "registryVersion": int(registry.payload["registryVersion"]),
        "recordCount": len(registry.records_by_source_key),
        "tombstoneCount": len(registry.tombstones_by_id),
        "digest": registry.digest,
        "policy": str(registry.payload["policy"]),
    }


def validate_registry_against_source_keys(
    registry: WeaponIdentityRegistry,
    source_keys: list[str],
) -> list[Diagnostic]:
    diagnostics = validate_identity_registry_payload(
        registry.payload,
        namespace=registry.namespace,
        artifact_path=registry.path.as_posix(),
    )
    for source_key in sorted(set(source_keys)):
        if source_key not in registry.records_by_source_key:
            diagnostics.append(
                Diagnostic(
                    code="WEAPON_IDENTITY_SOURCE_KEY_UNREGISTERED",
                    severity="critical",
                    message=f"Accepted EPIC-12 source key is not in the identity registry: {source_key}",
                    category="schema-shape-error",
                    scope_kind="record",
                    record_id=source_key,
                    source_ids=(source_key,),
                    evidence=(Evidence("artifact", registry.path.as_posix(), registry.namespace),),
                    disposition="non-waivable",
                )
            )
    return sorted(diagnostics, key=lambda item: item.stable_key())


def validate_identity_registry_payload(
    payload: dict[str, Any],
    *,
    namespace: str,
    artifact_path: str,
) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    if payload.get("registryVersion") != 1:
        diagnostics.append(_diag("WEAPON_IDENTITY_REGISTRY_VERSION", "Weapon identity registry version must be 1", artifact_path))
    if payload.get("namespace") != namespace:
        diagnostics.append(_diag("WEAPON_IDENTITY_NAMESPACE", f"Weapon identity namespace must be {namespace}", artifact_path))
    records = payload.get("records")
    if not isinstance(records, list) or not records:
        diagnostics.append(_diag("WEAPON_IDENTITY_REGISTRY_EMPTY", "Weapon identity registry must contain records", artifact_path))
        records = []
    tombstones = payload.get("tombstones")
    if not isinstance(tombstones, list):
        diagnostics.append(_diag("WEAPON_IDENTITY_TOMBSTONES_SHAPE", "Weapon identity tombstones must be a list", artifact_path))
        tombstones = []

    ids: list[int] = []
    source_keys: list[str] = []
    variant_keys: list[str] = []
    for record in records:
        if not isinstance(record, dict):
            diagnostics.append(_diag("WEAPON_IDENTITY_RECORD_SHAPE", "Weapon identity record must be an object", artifact_path))
            continue
        record_id = record.get("id")
        source_key = record.get("sourceKey")
        status = record.get("status")
        if not isinstance(record_id, int) or record_id <= 0:
            diagnostics.append(_diag("WEAPON_IDENTITY_ID_INVALID", "Weapon identity id must be a positive integer", artifact_path))
        else:
            ids.append(record_id)
        if not isinstance(source_key, str) or not source_key:
            diagnostics.append(_diag("WEAPON_IDENTITY_SOURCE_KEY_INVALID", "Weapon identity source key must be non-empty", artifact_path))
        else:
            source_keys.append(source_key)
        if status != "active":
            diagnostics.append(_diag("WEAPON_IDENTITY_STATUS_INVALID", "Initial weapon identity records must be active", artifact_path))
        variant = record.get("variantKey")
        if not isinstance(variant, str) or not variant:
            diagnostics.append(_diag("WEAPON_IDENTITY_VARIANT_INVALID", "Weapon identity variant key must be non-empty", artifact_path))
        variant_keys.append(f"{source_key}::{variant}")

    tombstone_ids: list[int] = []
    for tombstone in tombstones:
        if not isinstance(tombstone, dict):
            diagnostics.append(_diag("WEAPON_IDENTITY_TOMBSTONE_SHAPE", "Weapon identity tombstone must be an object", artifact_path))
            continue
        tombstone_id = tombstone.get("id")
        if not isinstance(tombstone_id, int) or tombstone_id <= 0:
            diagnostics.append(_diag("WEAPON_IDENTITY_TOMBSTONE_ID_INVALID", "Weapon tombstone id must be positive", artifact_path))
        else:
            tombstone_ids.append(tombstone_id)
        if not tombstone.get("reason"):
            diagnostics.append(_diag("WEAPON_IDENTITY_TOMBSTONE_REASON_MISSING", "Weapon tombstones require a reason", artifact_path))

    diagnostics.extend(_duplicate_diagnostics(ids, "WEAPON_IDENTITY_DUPLICATE_ID", "id", artifact_path))
    diagnostics.extend(_duplicate_diagnostics(source_keys, "WEAPON_IDENTITY_DUPLICATE_SOURCE_KEY", "sourceKey", artifact_path))
    diagnostics.extend(_duplicate_diagnostics(variant_keys, "WEAPON_IDENTITY_DUPLICATE_VARIANT", "variantKey", artifact_path))
    reused = set(ids).intersection(tombstone_ids)
    for value in sorted(reused):
        diagnostics.append(_diag("WEAPON_IDENTITY_REUSED_TOMBSTONE", f"Active weapon id reuses tombstone {value}", artifact_path))
    return sorted(diagnostics, key=lambda item: item.stable_key())


def _load_registry(path: Path, *, namespace: str) -> WeaponIdentityRegistry:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise WeaponIdentityError(f"Weapon identity registry could not be read: {exc}") from exc
    if not isinstance(payload, dict):
        raise WeaponIdentityError("Weapon identity registry root must be an object")

    diagnostics = validate_identity_registry_payload(payload, namespace=namespace, artifact_path=path.as_posix())
    if any(item.severity in {"critical", "error"} for item in diagnostics):
        raise WeaponIdentityError("Weapon identity registry failed validation", diagnostics)

    records = payload.get("records") if isinstance(payload.get("records"), list) else []
    tombstones = payload.get("tombstones") if isinstance(payload.get("tombstones"), list) else []
    return WeaponIdentityRegistry(
        namespace=namespace,
        path=path,
        payload=payload,
        records_by_source_key={str(record["sourceKey"]): record for record in records if isinstance(record, dict)},
        tombstones_by_id={int(record["id"]): record for record in tombstones if isinstance(record, dict)},
        digest=digest_bytes(canonical_json_bytes(payload)),
    )


def _duplicate_diagnostics(values: list[Any], code: str, label: str, artifact_path: str) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    seen: set[Any] = set()
    duplicates: set[Any] = set()
    for value in values:
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    for value in sorted(duplicates, key=str):
        diagnostics.append(_diag(code, f"Duplicate weapon identity {label}: {value}", artifact_path))
    return diagnostics


def _diag(code: str, message: str, artifact_path: str) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity="critical",
        message=message,
        category="schema-shape-error",
        scope_kind="artifact",
        artifact_path=artifact_path,
        evidence=(Evidence("artifact", artifact_path, None),),
        disposition="non-waivable",
    )
