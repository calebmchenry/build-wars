from __future__ import annotations

import unittest
from pathlib import Path

from build_wars_ingest.attribute_points import extract_attribute_point_rules
from build_wars_ingest.models import source_reference

FIXTURE = Path("test/fixtures/data-ingestion/professions-attributes/attribute-point.wiki")


def source_ref() -> dict[str, object]:
    return source_reference(
        source_id="source:gww:test:attribute-point",
        name="Guild Wars Wiki",
        canonical_url="https://wiki.guildwars.com/wiki/Attribute_point",
        page_id=1,
        page_title="Attribute point",
        revision_id=1,
        source_revision_timestamp="2026-08-31T00:00:00Z",
        retrieved_at="2026-09-01T00:00:00Z",
    )


class AttributePointExtractionTests(unittest.TestCase):
    def test_extracts_rank_costs_level_totals_quest_groups_and_defaults(self) -> None:
        extraction = extract_attribute_point_rules(FIXTURE.read_text(encoding="utf-8"), source_reference=source_ref())
        rules = extraction.rules

        self.assertEqual(extraction.diagnostics, [])
        self.assertEqual(rules["purchasedRankCosts"][0]["purchasedRank"], 0)
        self.assertEqual(rules["purchasedRankCosts"][-1]["cumulativeCost"], 97)
        self.assertEqual(rules["levelPointTotals"][-1]["cumulativeTotal"], 170)
        self.assertEqual(len(rules["questRewards"]), 6)
        self.assertEqual({group["maximumApplicableReward"] for group in rules["questRewardGroups"]}, {30})
        self.assertEqual(rules["maximumApplicableQuestBonus"]["points"], 30)
        self.assertEqual(rules["defaultPveLevel20"]["totalWithoutQuestBonus"], 170)
        self.assertEqual(rules["defaultPveLevel20"]["totalWithMaximumQuestBonus"], 200)
        self.assertIn("runes", rules["defaultPveLevel20"]["deferredContexts"])

    def test_malformed_rank_rows_are_reported(self) -> None:
        wikitext = FIXTURE.read_text(encoding="utf-8").replace("| 12 || 20 || 97", "| 12 || bad || 97")
        extraction = extract_attribute_point_rules(wikitext, source_reference=source_ref())

        self.assertIn("ATTRIBUTE_RANK_COST_MALFORMED", {diagnostic.code for diagnostic in extraction.diagnostics})


if __name__ == "__main__":
    unittest.main()
