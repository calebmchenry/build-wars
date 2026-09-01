from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any

from .artifacts import write_canonical_json
from .config import GENERATOR_NAME, INGESTION_SCHEMA_VERSION
from .models import Diagnostic, stable_finding_id

SEVERITY_ORDER = {"critical": 0, "error": 1, "warning": 2, "info": 3}
NON_WAIVABLE_CODES = {
    "ARTIFACT_DIGEST_MISMATCH",
    "SNAPSHOT_DIGEST_MISMATCH",
    "SNAPSHOT_UNREADABLE_ARTIFACT",
    "SNAPSHOT_UNREADABLE_MANIFEST",
    "UNKNOWN_COPIED_MATERIAL",
}


def findings_from_diagnostics(diagnostics: list[Diagnostic]) -> list[dict[str, Any]]:
    findings = []
    for diagnostic in sorted(diagnostics, key=lambda item: item.stable_key()):
        evidence = [item.to_wire() for item in diagnostic.evidence]
        scope = diagnostic.scope_wire()
        disposition = diagnostic.disposition
        if diagnostic.code in NON_WAIVABLE_CODES:
            disposition = "non-waivable"
        findings.append(
            {
                "id": stable_finding_id(diagnostic.code, scope, evidence),
                "code": diagnostic.code,
                "category": diagnostic.category,
                "severity": diagnostic.severity,
                "scope": scope,
                "evidence": evidence,
                "disposition": disposition,
                "reviewer": None,
                "reviewedAt": None,
                "rationale": diagnostic.message,
                "followUpTicketIds": [],
                "expiresAt": None,
                "reReviewTrigger": None,
            }
        )
    return findings


def build_report(
    *,
    artifact_path: str,
    artifact_manifest_path: str | None,
    generated_at: str,
    source_ids: list[str],
    diagnostics: list[Diagnostic],
    notes: str | None = None,
) -> dict[str, Any]:
    findings = findings_from_diagnostics(diagnostics)
    summary = _summary(findings)
    app_gate = app_consumption_gate(findings)
    public_gate = public_release_gate(findings)
    return {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "artifactPath": artifact_path,
        "artifactManifestPath": artifact_manifest_path,
        "generatedAt": generated_at,
        "generator": GENERATOR_NAME,
        "sourceIds": sorted(source_ids),
        "findings": findings,
        "summary": summary,
        "appConsumptionGate": app_gate,
        "publicReleaseGate": public_gate,
        "notes": notes,
    }


def write_report(
    *,
    root: Path,
    relative_path: Path,
    report: dict[str, Any],
) -> tuple[Path, Path]:
    json_path, _ = write_canonical_json(root, relative_path, report)
    summary_path = json_path.with_suffix(".summary.txt")
    summary_path.write_text(text_summary(report), encoding="utf-8", newline="\n")
    return json_path, summary_path


def text_summary(report: dict[str, Any]) -> str:
    summary = report["summary"]
    lines = [
        f"QA report: {report['artifactPath']}",
        f"generatedAt: {report['generatedAt']}",
        (
            "findings: "
            f"{summary['findingCount']} total, "
            f"{summary['criticalCount']} critical, "
            f"{summary['errorCount']} error, "
            f"{summary['warningCount']} warning, "
            f"{summary['infoCount']} info"
        ),
        f"appConsumptionGate: {report['appConsumptionGate']}",
        f"publicReleaseGate: {report['publicReleaseGate']}",
    ]
    for finding in report["findings"][:20]:
        lines.append(f"- {finding['severity']} {finding['code']}: {finding['rationale']}")
    if len(report["findings"]) > 20:
        lines.append(f"- {len(report['findings']) - 20} additional findings omitted")
    return "\n".join(lines) + "\n"


def app_consumption_gate(findings: list[dict[str, Any]]) -> str:
    if any(
        finding["severity"] in {"critical", "error"} and finding["disposition"] == "open"
        for finding in findings
    ):
        return "blocked"
    if any(finding["severity"] == "warning" and finding["disposition"] == "open" for finding in findings):
        return "review-required"
    return "pass"


def public_release_gate(findings: list[dict[str, Any]]) -> str:
    if any(finding["disposition"] == "non-waivable" for finding in findings):
        return "blocked"
    if any(finding["severity"] in {"critical", "error"} and finding["disposition"] == "open" for finding in findings):
        return "blocked"
    if any(finding["severity"] == "warning" and finding["disposition"] == "open" for finding in findings):
        return "review-required"
    return "pass"


def exit_code_for_report(report: dict[str, Any]) -> int:
    return 2 if report["appConsumptionGate"] == "blocked" or report["publicReleaseGate"] == "blocked" else 0


def _summary(findings: list[dict[str, Any]]) -> dict[str, int]:
    counts = Counter(finding["severity"] for finding in findings)
    open_blocking = sum(
        1
        for finding in findings
        if finding["disposition"] in {"open", "non-waivable"} and finding["severity"] in {"critical", "error"}
    )
    return {
        "findingCount": len(findings),
        "criticalCount": counts["critical"],
        "errorCount": counts["error"],
        "warningCount": counts["warning"],
        "infoCount": counts["info"],
        "openBlockingCount": open_blocking,
    }
