from __future__ import annotations

import unittest

from build_wars_ingest.weapon_semantics import normalize_weapon_mod_records


def raw_record(**overrides: object) -> dict[str, object]:
    record = {
        "id": 1001,
        "sourceKey": "weapon-modifier:test",
        "variantKey": "test",
        "name": "Test Modifier",
        "normalizedName": "test-modifier",
        "wikiUrl": "https://wiki.guildwars.com/wiki/Upgrade_component",
        "pageIdentity": {
            "requestedTitle": "Upgrade component",
            "normalizedTitle": "Upgrade component",
            "canonicalTitle": "Upgrade component",
            "pageId": 1,
            "revisionId": 2,
            "sourceRevisionTimestamp": "2026-08-31T00:00:00Z",
            "redirectedFrom": None,
        },
        "familyKey": "test",
        "family": "weapon-suffix",
        "occupiedSlot": "suffix",
        "applicableWeaponFamilies": ["sword"],
        "applicability": {
            "kind": "specific-families",
            "familyKeys": ["sword"],
            "provenance": {"sourceIds": ["source:gww:test"], "claimIds": ["claim:test"], "reviewIds": [], "notes": None},
        },
        "modeAvailability": "both",
        "templateModifiers": [],
        "rawEffects": [{"kind": "maximum-health-delta", "amount": 30, "unit": "health", "target": "character"}],
        "displayState": "structured-only",
        "iconId": None,
        "provenance": {
            "sourceIds": ["source:gww:test"],
            "claimIds": ["claim:test"],
            "reviewIds": ["review:epic-12-source-set:2026-09-02"],
            "notes": None,
        },
    }
    record.update(overrides)
    return record


class WeaponSemanticsTests(unittest.TestCase):
    def test_numeric_effects_remain_structured(self) -> None:
        result = normalize_weapon_mod_records([raw_record()])

        self.assertEqual(result.records[0]["effects"][0]["kind"], "maximum-health-delta")
        self.assertEqual(result.records[0]["effectCompleteness"], "structured")

    def test_chance_effects_require_closed_probability_and_magnitude(self) -> None:
        result = normalize_weapon_mod_records(
            [
                raw_record(
                    rawEffects=[
                        {
                            "kind": "casting-time-chance",
                            "probabilityPercent": 20,
                            "magnitudePercent": 50,
                            "subject": "spells",
                            "scope": "equipped-weapon",
                        }
                    ]
                )
            ]
        )

        effect = result.records[0]["effects"][0]
        self.assertEqual(effect["kind"], "casting-time-chance")
        self.assertEqual(effect["probabilityPercent"], 20)
        self.assertEqual(result.records[0]["effectCompleteness"], "structured")

    def test_note_only_and_unknown_effects_are_not_forced_into_arithmetic(self) -> None:
        result = normalize_weapon_mod_records(
            [
                raw_record(
                    rawEffects=[
                        {
                            "kind": "note-only",
                            "noteCode": "mastery-effect-deferred",
                            "text": "Chance-based mastery behavior is deferred.",
                        }
                    ]
                ),
                raw_record(id=1002, rawEffects=[{"kind": "unsupported-shape"}]),
            ]
        )

        self.assertEqual(result.records[0]["effectCompleteness"], "note-only")
        self.assertEqual(result.records[1]["effects"][0]["kind"], "unknown")
        self.assertEqual(result.records[1]["effectCompleteness"], "unknown")


if __name__ == "__main__":
    unittest.main()
