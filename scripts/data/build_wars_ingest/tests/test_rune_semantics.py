from __future__ import annotations

import unittest

from build_wars_ingest.rune_semantics import normalize_rune_records


def raw_record(**overrides: object) -> dict[str, object]:
    record = {
        "id": 95,
        "templateModifierId": 95,
        "name": "Rune of Superior Swordsmanship",
        "normalizedName": "rune-of-superior-swordsmanship",
        "wikiUrl": "https://wiki.guildwars.com/wiki/Rune_of_Swordsmanship",
        "pageIdentity": {
            "requestedTitle": "Rune of Superior Swordsmanship",
            "normalizedTitle": "Rune of Superior Swordsmanship",
            "canonicalTitle": "Rune of Swordsmanship",
            "pageId": 1,
            "revisionId": 2,
            "sourceRevisionTimestamp": "2026-08-31T00:00:00Z",
            "redirectedFrom": "Rune of Superior Swordsmanship",
        },
        "familyKey": "attribute:swordsmanship",
        "familyKind": "attribute",
        "familyRank": "superior",
        "rarityTier": "superior",
        "eligibility": "profession-armor",
        "professionId": 1,
        "affectedAttributeId": 20,
        "rawEffects": {"bonus": "+ Swordsmanship (- Health)", "stackable": "n", "rarity": None},
        "iconId": None,
        "provenance": {
            "sourceIds": ["source:gww:rune"],
            "claimIds": ["claim:rune:95:identity"],
            "reviewIds": ["review:epic-10-source-set:2026-09-02"],
            "notes": None,
        },
    }
    record.update(overrides)
    return record


class RuneSemanticsTests(unittest.TestCase):
    def test_attribute_superior_rune_emits_highest_rank_and_summed_penalty(self) -> None:
        result = normalize_rune_records([raw_record()])

        effects = result.records[0]["effects"]

        self.assertEqual(effects[0]["kind"], "attribute-rank")
        self.assertEqual(effects[0]["amount"], 3)
        self.assertEqual(effects[0]["stacking"]["rule"], "highest")
        self.assertEqual(effects[1]["kind"], "maximum-health-delta")
        self.assertEqual(effects[1]["amount"], -75)
        self.assertEqual(effects[1]["stacking"]["rule"], "sum")

    def test_common_runes_have_verified_stackability(self) -> None:
        result = normalize_rune_records(
            [
                raw_record(
                    templateModifierId=158,
                    id=158,
                    name="Rune of Superior Vigor",
                    familyKey="vigor",
                    familyKind="vigor",
                    familyRank="superior",
                    rarityTier="superior",
                    eligibility="universal-armor",
                    professionId=None,
                    affectedAttributeId=None,
                ),
                raw_record(
                    templateModifierId=353,
                    id=353,
                    name="Rune of Vitae",
                    familyKey="vitae",
                    familyKind="vitae",
                    familyRank=None,
                    rarityTier="minor",
                    eligibility="universal-armor",
                    professionId=None,
                    affectedAttributeId=None,
                ),
            ]
        )

        self.assertEqual(result.records[0]["effects"][0]["stacking"]["rule"], "highest")
        self.assertEqual(result.records[1]["effects"][0]["stacking"]["rule"], "sum")

    def test_condition_restoration_is_not_restoration_magic(self) -> None:
        result = normalize_rune_records(
            [
                raw_record(
                    templateModifierId=355,
                    id=355,
                    name="Rune of Restoration",
                    familyKey="condition:restoration",
                    familyKind="condition-reduction",
                    familyRank=None,
                    rarityTier="major",
                    eligibility="universal-armor",
                    professionId=None,
                    affectedAttributeId=None,
                )
            ]
        )

        effect = result.records[0]["effects"][0]

        self.assertEqual(effect["kind"], "condition-duration-reduction")
        self.assertEqual(effect["conditions"], ["bleeding", "crippled"])
        self.assertIsNone(result.records[0]["affectedAttributeId"])


if __name__ == "__main__":
    unittest.main()
