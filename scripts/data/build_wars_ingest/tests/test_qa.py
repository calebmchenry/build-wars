from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.models import Diagnostic, Evidence
from build_wars_ingest.qa import build_report, exit_code_for_report, text_summary, write_report


class QaTests(unittest.TestCase):
    def test_stable_ids_order_and_gate_decisions(self) -> None:
        diagnostics = [
            Diagnostic(
                code="PARSER_UNKNOWN_PARAM",
                severity="warning",
                message="Unknown parameter",
                category="schema-shape-error",
                field_path="/templates/0/params/0",
            ),
            Diagnostic(
                code="SKILL_ID_DUPLICATE_ID",
                severity="critical",
                message="Duplicate id",
                category="schema-shape-error",
                record_id=1,
                evidence=(Evidence("source", "fixture:L1", None),),
            ),
        ]

        first = build_report(
            artifact_path="data/generated/out.json",
            artifact_manifest_path="data/generated/out.manifest.json",
            generated_at="2026-09-01T00:00:00Z",
            source_ids=["source:a"],
            diagnostics=diagnostics,
        )
        second = build_report(
            artifact_path="data/generated/out.json",
            artifact_manifest_path="data/generated/out.manifest.json",
            generated_at="2026-09-01T00:00:00Z",
            source_ids=["source:a"],
            diagnostics=list(reversed(diagnostics)),
        )

        self.assertEqual([item["id"] for item in first["findings"]], [item["id"] for item in second["findings"]])
        self.assertEqual(first["summary"]["criticalCount"], 1)
        self.assertEqual(first["appConsumptionGate"], "blocked")
        self.assertEqual(exit_code_for_report(first), 2)

    def test_invalid_source_missing_provenance_unknown_params_and_icon_ambiguity_are_mapped(self) -> None:
        report = build_report(
            artifact_path="artifact.json",
            artifact_manifest_path=None,
            generated_at="2026-09-01T00:00:00Z",
            source_ids=[],
            diagnostics=[
                Diagnostic("MISSING_PROVENANCE", "error", "missing", category="missing-provenance"),
                Diagnostic("INVALID_SOURCE_REFERENCE", "error", "invalid", category="invalid-source-reference"),
                Diagnostic("PARSER_UNKNOWN_PARAM", "warning", "unknown", category="schema-shape-error"),
                Diagnostic("ICON_DEFAULT_AMBIGUOUS", "warning", "ambiguous", category="missing-icon-metadata"),
            ],
        )

        categories = {finding["category"] for finding in report["findings"]}
        self.assertEqual(
            categories,
            {"missing-provenance", "invalid-source-reference", "schema-shape-error", "missing-icon-metadata"},
        )
        self.assertEqual(report["publicReleaseGate"], "blocked")

    def test_accepted_risk_and_non_waivable_dispositions_are_preserved(self) -> None:
        report = build_report(
            artifact_path="artifact.json",
            artifact_manifest_path=None,
            generated_at="2026-09-01T00:00:00Z",
            source_ids=[],
            diagnostics=[
                Diagnostic(
                    "MANUAL_REVIEW_NOTE",
                    "warning",
                    "accepted",
                    category="manual-override",
                    disposition="accepted-risk",
                ),
                Diagnostic(
                    "SNAPSHOT_DIGEST_MISMATCH",
                    "critical",
                    "digest mismatch",
                    category="artifact-integrity-mismatch",
                    disposition="open",
                ),
            ],
        )

        dispositions = {finding["code"]: finding["disposition"] for finding in report["findings"]}
        self.assertEqual(dispositions["MANUAL_REVIEW_NOTE"], "accepted-risk")
        self.assertEqual(dispositions["SNAPSHOT_DIGEST_MISMATCH"], "non-waivable")
        self.assertEqual(report["publicReleaseGate"], "blocked")

    def test_reports_persist_before_blocking_exit(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_qa_test_"))
        try:
            report = build_report(
                artifact_path="artifact.json",
                artifact_manifest_path=None,
                generated_at="2026-09-01T00:00:00Z",
                source_ids=[],
                diagnostics=[Diagnostic("BLOCK", "critical", "blocked", category="schema-shape-error")],
            )
            json_path, summary_path = write_report(root=tmp, relative_path=Path("qa/report.json"), report=report)

            self.assertEqual(exit_code_for_report(report), 2)
            self.assertTrue(json_path.exists())
            self.assertTrue(summary_path.exists())
            self.assertIn("BLOCK", text_summary(report))
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
