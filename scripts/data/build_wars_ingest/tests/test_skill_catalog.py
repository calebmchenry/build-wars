from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch

from build_wars_ingest.config import FIXTURE_GENERATED_AT
from build_wars_ingest.pipeline import PipelineError, PipelineOptions, run_pipeline
from build_wars_ingest.profiles import profile_by_id
from build_wars_ingest.skill_catalog import (
    Epic03Dependency,
    SkillCatalogAssembly,
    assemble_skill_catalog,
    _align_description_progression_tokens,
    semantic_catalog_version,
    validate_skill_catalog,
)

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class SkillCatalogTests(unittest.TestCase):
    def test_source_ids_cannot_create_unverified_or_npc_playable_copies(self) -> None:
        text = (FIXTURE_ROOT / "skills/healing-signet.wiki").read_text().replace(
            "| id = 1", "| id = 1, 8<!-- npc -->"
        )
        source = {"id": "source:fixture", "retrievedAt": FIXTURE_GENERATED_AT}
        seeds = [{"skillId": i, "templateId": i, "requestedTitle": "Healing Signet", "sourceId": source["id"]} for i in (1, 7, 8)]
        assembled = assemble_skill_catalog(
            profile=profile_by_id("epic-04-skills"), generated_at=FIXTURE_GENERATED_AT,
            source_plan={"acceptedSeeds": seeds, "rangedPages": [], "summary": {
                "sourceSetDigest": "fixture", "sourcePlanDigest": "fixture", "acceptedSeedCount": 3,
                "minimumAcceptedId": 1, "maximumAcceptedId": 8, "numericGapCount": 5,
            }},
            detail_pages=[{**seed, "canonicalTitle": "Healing Signet", "content": text, "sourceReference": source} for seed in seeds],
            imageinfo_pages=[], snapshot_set_digest="fixture",
            dependency=Epic03Dependency(
                catalog=json.loads((FIXTURE_ROOT / "generated/fixture-professions-attributes.catalog.json").read_text()),
                artifact_digest="fixture", manifest_digest="fixture", qa_gate="pass",
            ),
        )
        self.assertEqual([s["id"] for s in assembled.catalog["skills"]], [1])
        self.assertEqual([(d["templateId"], d["kind"]) for d in assembled.catalog["dispositions"]], [(7, "excluded"), (8, "excluded")])
        self.assertFalse(any(d.severity == "critical" for d in assembled.diagnostics))

    def test_identity_qa_blocks_duplicate_names_and_missing_split_relationships(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = run_pipeline(PipelineOptions(
                mode="fixture", profile="epic-04-skills", output_root=Path(tmp),
                fixture_root=FIXTURE_ROOT, generated_at=FIXTURE_GENERATED_AT,
            ))
            duplicate = deepcopy(result.generated)
            duplicate["skills"][1]["name"] = duplicate["skills"][0]["name"]
            duplicate["skills"][1]["normalizedName"] = duplicate["skills"][0]["normalizedName"]
            unlinked = deepcopy(result.generated)
            unlinked["splitGroups"] = []
            faction = deepcopy(result.generated)
            luxon = next(s for s in faction["skills"] if s["name"].endswith(" (Luxon)"))
            luxon["name"] = luxon["name"].replace(" (Luxon)", " (Kurzick)")
            for catalog, code in ((duplicate, "SKILL_CATALOG_DUPLICATE_NAME"), (unlinked, "SKILL_SPLIT_UNRESOLVED"), (faction, "SKILL_FACTION_IDENTITY_MISMATCH")):
                diagnostics = validate_skill_catalog(catalog, snapshot_set_digest="fixture")
                self.assertTrue(any(d.code == code and d.disposition == "non-waivable" for d in diagnostics))

    def test_failed_identity_qa_does_not_replace_promoted_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            options = PipelineOptions(
                mode="fixture", profile="epic-04-skills", output_root=Path(tmp),
                fixture_root=FIXTURE_ROOT, generated_at=FIXTURE_GENERATED_AT,
            )
            fixture = run_pipeline(options)
            paths = (fixture.artifact_path, fixture.manifest_path, fixture.qa_report_path)
            before = [p.read_bytes() for p in paths]
            invalid = deepcopy(fixture.generated)
            invalid["splitGroups"] = []
            assembled = SkillCatalogAssembly(invalid, validate_skill_catalog(invalid, snapshot_set_digest="fixture"))
            with patch("build_wars_ingest.pipeline.assemble_skill_catalog", return_value=assembled):
                with self.assertRaisesRegex(PipelineError, "failed QA"):
                    run_pipeline(options)
            self.assertEqual([p.read_bytes() for p in paths], before)

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
