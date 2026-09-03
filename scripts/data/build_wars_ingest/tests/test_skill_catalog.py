from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.config import FIXTURE_GENERATED_AT
from build_wars_ingest.pipeline import PipelineOptions, run_pipeline
from build_wars_ingest.skill_catalog import semantic_catalog_version

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class SkillCatalogTests(unittest.TestCase):
    def test_fixture_catalog_contains_runtime_safe_skill_records(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_skill_catalog_"))
        try:
            result = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    profile="epic-04-skills",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            catalog = result.generated

            self.assertEqual(result.exit_code, 0)
            self.assertEqual(catalog["profile"]["id"], "epic-04-skills")
            self.assertEqual(catalog["sourceSet"]["acceptedSeedCount"], 6)
            self.assertEqual([skill["id"] for skill in catalog["skills"]], [1, 2, 3, 4, 5, 6])
            self.assertEqual(catalog["skills"][0]["description"]["state"], "structured-only")
            self.assertEqual(catalog["skills"][0]["costs"]["energy"]["state"], "absent")
            self.assertTrue(catalog["skills"][2]["classification"]["title"])
            self.assertTrue(catalog["remoteMedia"][0]["cachedBytes"] is False)
            self.assertNotIn("Fixture trainer prose", json.dumps(catalog))
            self.assertEqual(result.qa_report["appConsumptionGate"], "pass")
            self.assertEqual(result.qa_report["publicReleaseGate"], "pass")
        finally:
            shutil.rmtree(tmp)

    def test_catalog_version_changes_only_for_semantic_skill_mutations(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_skill_catalog_version_"))
        try:
            result = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    profile="epic-04-skills",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            base = result.generated
            timestamp_only = json.loads(json.dumps(base))
            timestamp_only["generatedAt"] = "2026-09-02T00:00:00Z"
            semantic = json.loads(json.dumps(base))
            semantic["skills"][0]["costs"]["energy"] = {
                "state": "number",
                "value": 5,
                "unit": None,
                "text": "5",
                "source": "5",
            }

            self.assertEqual(semantic_catalog_version(base), semantic_catalog_version(timestamp_only))
            self.assertNotEqual(semantic_catalog_version(base), semantic_catalog_version(semantic))
        finally:
            shutil.rmtree(tmp)

    def test_complete_snapshot_set_replays_offline(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_skill_catalog_offline_"))
        try:
            fixture = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    profile="epic-04-skills",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            manifest = json.loads(fixture.manifest_path.read_text(encoding="utf-8"))
            offline = run_pipeline(
                PipelineOptions(
                    mode="offline",
                    profile="epic-04-skills",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                    snapshot_set_path=tmp / manifest["selectedSnapshotSetManifestPath"],
                )
            )

            self.assertEqual(offline.exit_code, 0)
            self.assertEqual(offline.artifact_path.read_bytes(), fixture.artifact_path.read_bytes())
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
