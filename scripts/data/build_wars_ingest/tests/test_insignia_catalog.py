from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.config import FIXTURE_GENERATED_AT
from build_wars_ingest.insignia_catalog import semantic_catalog_version
from build_wars_ingest.pipeline import PipelineOptions, run_pipeline

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class InsigniaCatalogTests(unittest.TestCase):
    def test_fixture_catalog_contains_runtime_safe_insignia_records(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_insignia_catalog_"))
        try:
            result = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    profile="epic-11-insignias",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            catalog = result.generated

            self.assertEqual(result.exit_code, 0)
            self.assertEqual(catalog["profile"]["id"], "epic-11-insignias")
            self.assertEqual(catalog["sourceSet"]["acceptedInsigniaCount"], 13)
            self.assertEqual(catalog["insignias"][0]["templateModifiers"][0]["templateModifierId"], 290)
            self.assertEqual(catalog["insignias"][0]["effects"][0]["slotOutcomes"]["chest"]["amount"], 15)
            self.assertEqual(catalog["insignias"][1]["effects"][0]["slotOutcomes"]["legs"]["amount"], 2)
            self.assertIn("note-only", {effect["kind"] for item in catalog["insignias"] for effect in item["effects"]})
            self.assertNotIn("Rune Trader", json.dumps(catalog))
            self.assertTrue(all(media["cachedBytes"] is False for media in catalog["remoteMedia"]))
            self.assertEqual(result.qa_report["appConsumptionGate"], "pass")
            self.assertEqual(result.qa_report["publicReleaseGate"], "pass")
        finally:
            shutil.rmtree(tmp)

    def test_catalog_version_changes_only_for_runtime_semantic_mutations(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_insignia_catalog_version_"))
        try:
            result = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    profile="epic-11-insignias",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            base = result.generated
            timestamp_only = json.loads(json.dumps(base))
            timestamp_only["generatedAt"] = "2026-09-02T00:00:00Z"
            semantic = json.loads(json.dumps(base))
            semantic["insignias"][0]["effects"][0]["slotOutcomes"]["head"]["amount"] = 6

            self.assertEqual(semantic_catalog_version(base), semantic_catalog_version(timestamp_only))
            self.assertNotEqual(semantic_catalog_version(base), semantic_catalog_version(semantic))
        finally:
            shutil.rmtree(tmp)

    def test_complete_snapshot_set_replays_offline(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_insignia_catalog_offline_"))
        try:
            fixture = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    profile="epic-11-insignias",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            manifest = json.loads(fixture.manifest_path.read_text(encoding="utf-8"))
            offline = run_pipeline(
                PipelineOptions(
                    mode="offline",
                    profile="epic-11-insignias",
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
