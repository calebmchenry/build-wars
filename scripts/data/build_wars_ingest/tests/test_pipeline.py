from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.config import FIXTURE_GENERATED_AT
from build_wars_ingest.pipeline import PipelineOptions, run_pipeline

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")
GOLDEN_ARTIFACT = FIXTURE_ROOT / "generated/fixture-skill-id-map.json"


class PipelineTests(unittest.TestCase):
    def test_fixture_pipeline_runs_without_network_and_writes_expected_outputs(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_pipeline_test_"))
        try:
            result = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )

            self.assertEqual(result.exit_code, 0)
            self.assertEqual(result.record_count, 3)
            self.assertTrue(result.artifact_path.exists())
            self.assertTrue(result.manifest_path.exists())
            self.assertTrue(result.qa_report_path.exists())
            self.assertEqual(result.artifact_path.read_bytes(), GOLDEN_ARTIFACT.read_bytes())
            self.assertEqual(result.generated["parserProof"]["recommendation"], "accept-mwparserfromhell")
            self.assertEqual(result.generated["iconProof"][0]["cachedBytes"], False)
            self.assertTrue((tmp / "data/generated/epic-03/professions-attributes.catalog.json").exists())
            self.assertTrue((tmp / "data/generated/epic-04/skills.catalog.json").exists())
        finally:
            shutil.rmtree(tmp)

    def test_fixture_pipeline_is_byte_identical_on_repeated_fixed_clock_runs(self) -> None:
        first_root = Path(tempfile.mkdtemp(prefix="bw_pipeline_first_"))
        second_root = Path(tempfile.mkdtemp(prefix="bw_pipeline_second_"))
        try:
            first = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    output_root=first_root,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            second = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    output_root=second_root,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )

            self.assertEqual(first.artifact_path.read_bytes(), second.artifact_path.read_bytes())
            self.assertEqual(first.qa_report["summary"], second.qa_report["summary"])
            self.assertEqual(
                (first_root / "data/generated/epic-04/skills.catalog.json").read_bytes(),
                (second_root / "data/generated/epic-04/skills.catalog.json").read_bytes(),
            )
        finally:
            shutil.rmtree(first_root)
            shutil.rmtree(second_root)

    def test_offline_pipeline_replays_existing_snapshots_without_network(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_pipeline_offline_"))
        try:
            run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            offline = run_pipeline(
                PipelineOptions(
                    mode="offline",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )

            self.assertEqual(offline.record_count, 3)
            self.assertTrue(offline.artifact_path.exists())
            self.assertEqual(offline.generated["generationId"], "epic-02-offline")
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
