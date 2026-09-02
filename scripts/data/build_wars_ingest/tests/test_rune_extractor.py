from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.config import FIXTURE_GENERATED_AT
from build_wars_ingest.pipeline import PipelineOptions, run_pipeline

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class RuneExtractorTests(unittest.TestCase):
    def test_fixture_extraction_joins_profession_attributes_and_icons(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_rune_extract_"))
        try:
            result = run_pipeline(
                PipelineOptions(
                    mode="fixture",
                    profile="epic-10-runes",
                    output_root=tmp,
                    fixture_root=FIXTURE_ROOT,
                    generated_at=FIXTURE_GENERATED_AT,
                )
            )
            catalog = result.generated
            superior_sword = next(rune for rune in catalog["runes"] if rune["name"] == "Rune of Superior Swordsmanship")
            restoration = next(rune for rune in catalog["runes"] if rune["name"] == "Rune of Restoration")

            self.assertEqual(superior_sword["professionId"], 1)
            self.assertEqual(superior_sword["affectedAttributeId"], 20)
            self.assertEqual(superior_sword["pageIdentity"]["canonicalTitle"], "Rune of Swordsmanship")
            self.assertIsNotNone(superior_sword["iconId"])
            self.assertEqual(restoration["familyKind"], "condition-reduction")
            self.assertIsNone(restoration["affectedAttributeId"])
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
