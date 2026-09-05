from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.config import FIXTURE_GENERATED_AT
from build_wars_ingest.pipeline import PipelineOptions, run_pipeline
from build_wars_ingest.skill_catalog import (
    _align_description_progression_tokens,
    semantic_catalog_version,
    validate_skill_catalog,
)

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
            self.assertEqual(catalog["skills"][0]["description"]["state"], "reviewed-text")
            self.assertEqual(catalog["skills"][0]["typeId"], "signet")
            self.assertIn("You gain Health.", catalog["skills"][0]["description"]["searchText"])
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

    def test_catalog_validation_requires_canonical_skill_type_ids(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_skill_catalog_type_id_"))
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
            catalog = json.loads(json.dumps(result.generated))
            catalog["skills"][0]["typeId"] = "Signet"

            diagnostics = validate_skill_catalog(catalog, snapshot_set_digest="fixture")

            self.assertIn("SKILL_TYPE_ID_UNKNOWN", [diagnostic.code for diagnostic in diagnostics])
        finally:
            shutil.rmtree(tmp)

    def test_concise_description_progression_tokens_match_generated_slots(self) -> None:
        record = {
            "description": {
                "tokens": [
                    {"kind": "progression-reference", "seriesId": "progression:skill:316:1", "valueSlot": 0},
                    {"kind": "progression-reference", "seriesId": "progression:skill:316:2", "valueSlot": 0},
                    {"kind": "progression-reference", "seriesId": "progression:skill:316:3", "valueSlot": 0},
                ]
            }
        }
        progression_series = [
            {
                "id": "progression:skill:316:1",
                "valueSlots": [
                    {"index": 0, "label": "Max foes", "unit": None},
                    {"index": 1, "label": "Duration", "unit": None},
                    {"index": 2, "label": "+ Max health", "unit": None},
                ],
                "values": [
                    {"rank": 0, "values": [1, 10, 10]},
                    {"rank": 15, "values": [6, 20, 60]},
                ],
            }
        ]

        _align_description_progression_tokens(
            record,
            progression_series,
            "({{gr|10|20}} seconds.) You have {{gr|10|60}} maximum Health (maximum {{gr|1|6}}).",
        )

        self.assertEqual(
            record["description"]["tokens"],
            [
                {"kind": "progression-reference", "seriesId": "progression:skill:316:1", "valueSlot": 1},
                {"kind": "progression-reference", "seriesId": "progression:skill:316:1", "valueSlot": 2},
                {"kind": "progression-reference", "seriesId": "progression:skill:316:1", "valueSlot": 0},
            ],
        )

    def test_concise_description_progression_alignment_preserves_token_tone(self) -> None:
        record = {
            "description": {
                "tokens": [
                    {
                        "kind": "progression-reference",
                        "seriesId": "progression:skill:17:2",
                        "valueSlot": 0,
                        "tone": "muted",
                    },
                ]
            }
        }
        progression_series = [
            {
                "id": "progression:skill:17:1",
                "valueSlots": [
                    {"index": 0, "label": "Duration", "unit": None},
                    {"index": 1, "label": "Energy", "unit": None},
                ],
                "values": [
                    {"rank": 0, "values": [5, 1]},
                    {"rank": 15, "values": [20, 5]},
                ],
            }
        ]

        _align_description_progression_tokens(
            record,
            progression_series,
            "{{gray|Prevention cost: lose {{gr|1|5}} Energy.}}",
        )

        self.assertEqual(
            record["description"]["tokens"],
            [
                {
                    "kind": "progression-reference",
                    "seriesId": "progression:skill:17:1",
                    "valueSlot": 1,
                    "tone": "muted",
                },
            ],
        )

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
