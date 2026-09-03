from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.config import FIXTURE_GENERATED_AT
from build_wars_ingest.pipeline import PipelineOptions, run_pipeline

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class WeaponModExtractorTests(unittest.TestCase):
    def test_fixture_modifiers_extract_slots_applicability_and_crosswalks(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_weapon_mod_extractor_"))
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
            catalog = result.generated["weaponMods"]
            sundering = next(record for record in catalog["weaponMods"] if record["name"] == "Sundering Weapon Prefix")
            focus = next(record for record in catalog["weaponMods"] if record["name"] == "Focus Core of Aptitude")

            self.assertEqual(sundering["occupiedSlot"], "prefix")
            self.assertEqual(sundering["applicability"]["kind"], "specific-families")
            self.assertEqual(sundering["templateModifiers"][0]["templateModifierId"], 190)
            self.assertEqual(focus["occupiedSlot"], "focus-core")
            self.assertEqual(focus["applicability"]["familyKeys"], ["focus"])
            self.assertEqual(catalog["remoteMedia"], [])
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
