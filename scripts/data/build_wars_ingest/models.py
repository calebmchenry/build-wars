from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256
from typing import Any, Literal

INGESTION_SCHEMA_VERSION = 1

Severity = Literal["critical", "error", "warning", "info"]
QaCategory = Literal[
    "missing-provenance",
    "stale-or-unverified-revision",
    "ambiguous-source-or-rights",
    "copied-text-without-attribution",
    "invalid-source-reference",
    "manual-override",
    "missing-icon-metadata",
    "generated-data-diff",
    "artifact-integrity-mismatch",
    "schema-shape-error",
    "unexpected-source-family",
    "other",
]
Disposition = Literal["open", "resolved", "excluded", "accepted-risk", "non-waivable"]


@dataclass(frozen=True)
class Evidence:
    kind: Literal["source", "artifact", "review-note", "qa-finding", "ticket"]
    reference: str
    notes: str | None = None

    def to_wire(self) -> dict[str, Any]:
        return {"kind": self.kind, "reference": self.reference, "notes": self.notes}


@dataclass(frozen=True)
class Diagnostic:
    code: str
    severity: Severity
    message: str
    category: QaCategory = "other"
    scope_kind: Literal["artifact", "record", "field", "source", "release"] = "artifact"
    artifact_path: str | None = None
    record_id: str | int | None = None
    field_path: str | None = None
    source_ids: tuple[str, ...] = ()
    evidence: tuple[Evidence, ...] = ()
    disposition: Disposition = "open"

    def scope_wire(self) -> dict[str, Any]:
        return {
            "kind": self.scope_kind,
            "artifactPath": self.artifact_path,
            "recordId": self.record_id,
            "fieldPath": self.field_path,
            "sourceIds": list(self.source_ids),
        }

    def stable_key(self) -> tuple[Any, ...]:
        return (
            self.severity,
            self.code,
            self.scope_kind,
            self.artifact_path or "",
            "" if self.record_id is None else str(self.record_id),
            self.field_path or "",
            self.source_ids,
            tuple((item.kind, item.reference, item.notes or "") for item in self.evidence),
            self.message,
        )


def digest_bytes(data: bytes) -> str:
    return sha256(data).hexdigest()


def digest_wire(value: str, *, algorithm: str = "sha256", notes: str | None = None) -> dict[str, Any]:
    return {"algorithm": algorithm, "value": value, "notes": notes}


def source_reference(
    *,
    source_id: str,
    name: str,
    canonical_url: str | None,
    page_id: int | str | None = None,
    page_title: str | None = None,
    file_id: int | str | None = None,
    file_title: str | None = None,
    revision_id: int | str | None = None,
    source_revision_timestamp: str | None = None,
    retrieved_at: str | None = None,
    material_class: str = "factual-metadata",
    rights_basis: str = "contributor-license-declared",
    use_decision: str = "allowed",
    notes: str | None = None,
) -> dict[str, Any]:
    return {
        "id": source_id,
        "name": name,
        "family": "guild-wars-wiki",
        "canonicalUrl": canonical_url,
        "pageId": page_id,
        "pageTitle": page_title,
        "fileId": file_id,
        "fileTitle": file_title,
        "revisionId": revision_id,
        "sourceRevisionTimestamp": source_revision_timestamp,
        "retrievedAt": retrieved_at,
        "materialClass": material_class,
        "rightsBasis": rights_basis,
        "useDecision": use_decision,
        "license": None,
        "notes": notes,
    }


def provenance_claim(
    *,
    claim_id: str,
    field_path: str,
    source_ids: list[str],
    method: str = "normalized",
    material_class: str = "factual-metadata",
    rights_basis: str = "contributor-license-declared",
    use_decision: str = "allowed",
    transformation_notes: str | None = None,
) -> dict[str, Any]:
    return {
        "id": claim_id,
        "fieldPath": field_path,
        "sourceIds": source_ids,
        "method": method,
        "materialClass": material_class,
        "rightsBasis": rights_basis,
        "useDecision": use_decision,
        "transformationNotes": transformation_notes,
        "reviewIds": [],
    }


def record_provenance(source: dict[str, Any], claims: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "sources": [source],
        "claims": claims,
        "manualOverrides": [],
        "reviews": [],
        "notes": None,
    }


def json_pointer_escape(value: str) -> str:
    return value.replace("~", "~0").replace("/", "~1")


def stable_finding_id(code: str, scope: dict[str, Any], evidence: list[dict[str, Any]]) -> str:
    basis = repr((code, scope, evidence)).encode("utf-8")
    return f"qa:{code.lower()}:{digest_bytes(basis)[:12]}"


@dataclass
class StageResult:
    diagnostics: list[Diagnostic] = field(default_factory=list)

    def extend(self, diagnostics: list[Diagnostic]) -> None:
        self.diagnostics.extend(diagnostics)
