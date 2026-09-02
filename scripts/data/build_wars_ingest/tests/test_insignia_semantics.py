from __future__ import annotations

import copy
import unittest

from build_wars_ingest.insignia_semantics import normalize_insignia_records


def raw_record(insignia_id: int, name: str, bonus: str, profession_id: int | None = None) -> dict[str, object]:
    return {
        "id": insignia_id,
        "sourceKey": f"equipment-modifier:{insignia_id}",
        "variantKey": None,
        "templateModifierId": insignia_id,
        "name": name,
        "normalizedName": name.lower().replace(" ", "-"),
        "wikiUrl": f"https://wiki.guildwars.com/wiki/{name.replace(' ', '_')}",
        "pageIdentity": {
            "requestedTitle": name,
            "normalizedTitle": name,
            "canonicalTitle": name,
            "pageId": insignia_id,
            "revisionId": insignia_id + 1,
            "sourceRevisionTimestamp": "2026-08-31T00:00:00Z",
            "redirectedFrom": None,
        },
        "familyKey": name.lower().replace(" insignia", "").replace("'", "").replace(" ", "-"),
        "availability": "common" if profession_id is None else "profession-specific",
        "professionId": profession_id,
        "modeAvailability": "both",
        "applicableSlots": ["head", "chest", "hands", "legs", "feet"],
        "rawEffects": {"bonus": bonus, "overviewBonus": bonus, "stackable": "n", "campaign": "Core"},
        "attributeReferences": [
            {"id": 10, "name": "Strength"},
            {"id": 31, "name": "Air Magic"},
            {"id": 32, "name": "Earth Magic"},
            {"id": 33, "name": "Fire Magic"},
            {"id": 34, "name": "Water Magic"},
        ],
        "iconId": None,
        "provenance": {
            "sourceIds": ["source:test"],
            "claimIds": [f"claim:{insignia_id}"],
            "reviewIds": ["review:test"],
            "notes": None,
        },
    }


class InsigniaSemanticTests(unittest.TestCase):
    def test_projects_survivor_radiant_and_tormentor_slot_maps(self) -> None:
        result = normalize_insignia_records(
            [
                raw_record(290, "Survivor Insignia", "Health +15 (on chest armor) Health +10 (on leg armor) Health +5 (on other armor)"),
                raw_record(291, "Radiant Insignia", "Energy +3 (on chest armor) Energy +2 (on leg armor) Energy +1 (on other armor)"),
                raw_record(
                    303,
                    "Tormentor's Insignia",
                    "Armor +10 Holy damage you receive increased by 6 (on chest armor) Holy damage you receive increased by 4 (on leg armor) Holy damage you receive increased by 2 (on other armor)",
                    4,
                ),
            ]
        )

        by_name = {record["name"]: record for record in result.records}
        self.assertEqual(by_name["Survivor Insignia"]["effects"][0]["slotOutcomes"]["chest"]["amount"], 15)
        self.assertEqual(by_name["Radiant Insignia"]["effects"][0]["slotOutcomes"]["legs"]["amount"], 2)
        tormentor = by_name["Tormentor's Insignia"]
        self.assertEqual(tormentor["effects"][0]["slotOutcomes"]["hands"]["amount"], 2)
        self.assertEqual(tormentor["effects"][1]["kind"], "armor-rating-delta")
        self.assertEqual(tormentor["effects"][1]["applicationScope"], "armor-piece-local")

    def test_keeps_conditions_note_only_unknown_and_inputs_unchanged(self) -> None:
        raw = [
            raw_record(317, "Sentinel's Insignia", "Armor +20 (Requires 13 Strength, vs. elemental damage)", 1),
            raw_record(302, "Bloodstained Insignia", "Reduces casting time of spells that exploit corpses by 25% (Non-stacking)", 4),
            raw_record(399, "Unknown Insignia", "Source-specific behavior without a schema mapping."),
        ]
        before = copy.deepcopy(raw)

        result = normalize_insignia_records(raw)

        by_name = {record["name"]: record for record in result.records}
        sentinel = by_name["Sentinel's Insignia"]
        self.assertEqual(sentinel["effects"][0]["condition"]["predicate"], "attribute-rank-at-least")
        self.assertEqual(sentinel["effects"][0]["condition"]["attributeId"], 10)
        self.assertEqual(by_name["Bloodstained Insignia"]["effectCompleteness"], "note-only")
        self.assertEqual(by_name["Unknown Insignia"]["effectCompleteness"], "unknown")
        self.assertEqual(raw, before)


if __name__ == "__main__":
    unittest.main()
