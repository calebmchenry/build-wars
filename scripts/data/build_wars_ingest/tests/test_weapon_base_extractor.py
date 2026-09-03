from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.config import FIXTURE_GENERATED_AT
from build_wars_ingest.pipeline import PipelineOptions, run_pipeline

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class WeaponBaseExtractorTests(unittest.TestCase):
    def test_fixture_bases_extract_tagged_damage_requirements_and_slots(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_weapon_base_extractor_"))
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
            sword = next(record for record in weapons["weaponBases"] if record["name"] == "Sword")
            focus = next(record for record in weapons["weaponBases"] if record["name"] == "Focus")
            staff = next(record for record in weapons["weaponBases"] if record["name"] == "Staff")

            self.assertEqual(sword["damage"]["kind"], "fixed-range")
            self.assertEqual(sword["requirement"]["attributeName"], "Swordsmanship")
            self.assertEqual(sword["templateItems"][0]["templateItemId"], 279)
            self.assertEqual(focus["damage"]["kind"], "not-applicable")
            self.assertEqual([slot["slot"] for slot in staff["allowedModifierSlots"]], ["staff-head", "staff-wrapping", "inscription"])
            self.assertNotIn("mw-parser-output", json.dumps(weapons))
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
