from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.config import FIXTURE_GENERATED_AT
from build_wars_ingest.pipeline import PipelineOptions, run_pipeline

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class ProfessionAttributeCatalogTests(unittest.TestCase):
    def test_fixture_catalog_has_runtime_eligible_shape_and_passes_qa(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_pa_catalog_"))
        try:
            result = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    profile="epic-03-professions-attributes",
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            catalog = result.generated

            self.assertEqual(result.exit_code, 0)
            self.assertEqual(result.record_count, 52)
            self.assertEqual(result.qa_report["appConsumptionGate"], "pass")
            self.assertEqual(catalog["profile"]["id"], "epic-03-professions-attributes")
            self.assertEqual(len(catalog["professions"]), 10)
            self.assertFalse(any(record["templateId"] == 0 for record in catalog["professions"]))
            self.assertEqual(catalog["templateCrosswalk"]["professionTemplateIds"][0]["status"], "none")
            self.assertEqual(catalog["attributePointRules"]["defaultPveLevel20"]["totalWithMaximumQuestBonus"], 200)
            self.assertEqual(len(catalog["sectionDigests"]), 5)
            self.assertEqual(catalog["manualReviews"][1]["id"], "review:epic-03-first-baseline:2026-09-01")
        finally:
            shutil.rmtree(tmp)

    def test_fixture_catalog_is_byte_identical_on_repeated_fixed_clock_runs(self) -> None:
        first_root = Path(tempfile.mkdtemp(prefix="bw_pa_first_"))
        second_root = Path(tempfile.mkdtemp(prefix="bw_pa_second_"))
        try:
            first = run_pipeline(
                PipelineOptions("fixture", first_root, FIXTURE_ROOT, profile="epic-03-professions-attributes")
            )
            second = run_pipeline(
                PipelineOptions("fixture", second_root, FIXTURE_ROOT, profile="epic-03-professions-attributes")
            )

            self.assertEqual(first.artifact_path.read_bytes(), second.artifact_path.read_bytes())
            self.assertEqual(first.qa_report_path.read_bytes(), second.qa_report_path.read_bytes())
        finally:
            shutil.rmtree(first_root)
            shutil.rmtree(second_root)


if __name__ == "__main__":
    unittest.main()
