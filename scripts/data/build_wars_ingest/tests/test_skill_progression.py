from __future__ import annotations

import unittest
from pathlib import Path

from build_wars_ingest.skill_progression import extract_skill_progressions, split_evidence_from_title

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class SkillProgressionTests(unittest.TestCase):
    def test_attribute_progression_expands_to_rank_rows(self) -> None:
        text = (FIXTURE_ROOT / "skills/healing-signet.wiki").read_text(encoding="utf-8")

        extraction = extract_skill_progressions(
            skill_id=1,
            wikitext=text,
            source_id="source:gww:skill:1",
            attribute_id=21,
            attribute_name="Tactics",
            title_key=None,
        )

        series = extraction.series[0]
        self.assertEqual(series["dependency"]["kind"], "attribute")
        self.assertEqual(series["values"][0]["values"], [82])
        self.assertEqual(series["values"][15]["values"], [172])

    def test_title_rank_progression_uses_stable_title_key(self) -> None:
        text = (FIXTURE_ROOT / "skills/save-yourselves.wiki").read_text(encoding="utf-8")

        extraction = extract_skill_progressions(
            skill_id=3,
            wikitext=text,
            source_id="source:gww:skill:3",
            attribute_id=None,
            attribute_name="Allegiance rank",
            title_key="title:allegiance-rank",
        )

        self.assertEqual(extraction.series[0]["dependency"]["kind"], "title-rank")
        self.assertEqual(extraction.series[0]["dependency"]["titleKey"], "title:allegiance-rank")
        self.assertEqual(extraction.series[0]["values"][-1]["rank"], 12)

    def test_split_suffix_evidence_is_explicit(self) -> None:
        self.assertEqual(split_evidence_from_title("Training Beacon (PvE)"), ("training beacon", "pve"))
        self.assertEqual(split_evidence_from_title("Training Beacon"), ("training beacon", None))


if __name__ == "__main__":
    unittest.main()
