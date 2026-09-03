from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.config import FIXTURE_GENERATED_AT
from build_wars_ingest.pipeline import PipelineOptions, run_pipeline
from build_wars_ingest.profiles import EPIC_12_WEAPON_MODS_RELATIVE_PATH
from build_wars_ingest.weapon_catalog import semantic_catalog_version

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class WeaponCatalogTests(unittest.TestCase):
    def test_fixture_catalogs_share_release_set_and_pass_gates(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_weapon_catalog_"))
        try:
            result = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    profile="epic-12-weapons-and-mods",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            weapons = result.generated["weapons"]
            mods = result.generated["weaponMods"]

            self.assertEqual(result.exit_code, 0)
            self.assertEqual(weapons["sourceSet"], mods["sourceSet"])
            self.assertEqual(weapons["releaseSet"], mods["releaseSet"])
            self.assertEqual(weapons["catalogSetDigest"], mods["catalogSetDigest"])
            self.assertEqual(weapons["sourceSet"]["acceptedWeaponBaseCount"], 11)
            self.assertEqual(mods["sourceSet"]["acceptedWeaponModifierCount"], 9)
            self.assertEqual(result.qa_report["appConsumptionGate"], "pass")
            self.assertEqual(result.qa_report["publicReleaseGate"], "pass")
            self.assertTrue((tmp / "data/generated" / EPIC_12_WEAPON_MODS_RELATIVE_PATH).exists())
        finally:
            shutil.rmtree(tmp)

    def test_catalog_version_changes_only_for_runtime_semantic_mutations(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_weapon_catalog_version_"))
        try:
            result = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    profile="epic-12-weapons-and-mods",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            base = result.generated["weapons"]
            timestamp_only = json.loads(json.dumps(base))
            timestamp_only["generatedAt"] = "2026-09-02T00:00:00Z"
            semantic = json.loads(json.dumps(base))
            semantic["weaponBases"][0]["damage"]["maximum"] = 29

            self.assertEqual(
                semantic_catalog_version(base, key="weaponBases", prefix="weapons"),
                semantic_catalog_version(timestamp_only, key="weaponBases", prefix="weapons"),
            )
            self.assertNotEqual(
                semantic_catalog_version(base, key="weaponBases", prefix="weapons"),
                semantic_catalog_version(semantic, key="weaponBases", prefix="weapons"),
            )
        finally:
            shutil.rmtree(tmp)

    def test_complete_snapshot_set_replays_offline(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_weapon_catalog_offline_"))
        try:
            fixture = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    profile="epic-12-weapons-and-mods",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            manifest = json.loads(fixture.manifest_path.read_text(encoding="utf-8"))
            weapon_bytes = fixture.artifact_path.read_bytes()
            mod_bytes = (tmp / "data/generated/epic-12/weapon-mods.catalog.json").read_bytes()
            offline = run_pipeline(
                PipelineOptions(
                    mode="offline",
                    profile="epic-12-weapons-and-mods",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                    snapshot_set_path=tmp / manifest["selectedSnapshotSetManifestPath"],
                )
            )

            self.assertEqual(offline.exit_code, 0)
            self.assertEqual(offline.artifact_path.read_bytes(), weapon_bytes)
            self.assertEqual(
                (tmp / "data/generated/epic-12/weapon-mods.catalog.json").read_bytes(),
                mod_bytes,
            )
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
