from __future__ import annotations

import json
import unittest
from pathlib import Path

from build_wars_ingest.models import source_reference
from build_wars_ingest.skill_infobox import extract_skill_infobox

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


def source_ref() -> dict[str, object]:
    return source_reference(
        source_id="source:gww:skill:1",
        name="Guild Wars Wiki",
        canonical_url="https://wiki.guildwars.com/wiki/Healing_Signet",
        page_id=1,
        page_title="Healing Signet",
        revision_id=1,
        source_revision_timestamp="2026-08-31T00:00:00Z",
        retrieved_at="2026-09-01T00:00:00Z",
    )


def page_identity(title: str) -> dict[str, object]:
    return {
        "requestedTitle": title,
        "normalizedTitle": title,
        "canonicalTitle": title,
        "pageId": 1,
        "revisionId": 1,
        "sourceRevisionTimestamp": "2026-08-31T00:00:00Z",
        "redirectedFrom": None,
    }


class SkillInfoboxTests(unittest.TestCase):
    def setUp(self) -> None:
        self.pa_catalog = json.loads(
            (FIXTURE_ROOT / "generated/fixture-professions-attributes.catalog.json").read_text(
                encoding="utf-8"
            )
        )

    def test_core_infobox_fields_join_costs_and_concise_description(self) -> None:
        text = (FIXTURE_ROOT / "skills/healing-signet.wiki").read_text(encoding="utf-8")

        extraction = extract_skill_infobox(
            skill_id=1,
            template_id=1,
            requested_title="Healing Signet",
            canonical_title="Healing Signet",
            page_identity=page_identity("Healing Signet"),
            wikitext=text,
            source_reference=source_ref(),
            profession_catalog=self.pa_catalog,
            review_id="review:fixture",
        )

        record = extraction.record
        self.assertEqual(record["name"], "Healing Signet")
        self.assertEqual(record["professionId"], 1)
        self.assertEqual(record["attributeId"], 21)
        self.assertEqual(record["typeId"], "signet")
        self.assertEqual(record["costs"]["energy"]["state"], "absent")
        self.assertEqual(record["timings"]["activation"]["value"], 2)
        self.assertEqual(record["description"]["state"], "reviewed-text")
        self.assertEqual(record["description"]["tokens"][0], {"kind": "literal", "value": "Signet."})
        self.assertIn(
            {"kind": "progression-reference", "seriesId": "progression:skill:1:1", "valueSlot": 0},
            record["description"]["tokens"],
        )
        self.assertIn("You gain Health.", record["description"]["searchText"])
        self.assertNotIn("Fixture trainer prose", json.dumps(record))

    def test_title_rank_skill_keeps_null_attribute_and_title_dependency_key(self) -> None:
        text = (FIXTURE_ROOT / "skills/save-yourselves.wiki").read_text(encoding="utf-8")

        extraction = extract_skill_infobox(
            skill_id=3,
            template_id=3,
            requested_title='"Save Yourselves!"',
            canonical_title='"Save Yourselves!"',
            page_identity=page_identity('"Save Yourselves!"'),
            wikitext=text,
            source_reference=source_ref(),
            profession_catalog=self.pa_catalog,
            review_id="review:fixture",
        )

        self.assertIsNone(extraction.record["attributeId"])
        self.assertTrue(extraction.record["classification"]["title"])
        self.assertEqual(extraction.title_key, "allegiance:luxon")
        self.assertEqual(extraction.record["costs"]["adrenaline"]["value"], 8)

    def test_nested_gray_templates_are_unwrapped_from_concise_description(self) -> None:
        text = """{{Skill infobox
| id = 17
| name = Mantra of Resolve
| campaign = Core
| profession = Mesmer
| attribute = Inspiration Magic
| type = Stance
| concise description = Stance. ({{gr|5|20}} seconds.) Prevents interrupts against you. {{gray|Prevention cost: lose {{gr|1|5}} Energy or Mantra of Resolve ends.}} {{grey|Failure cost: lose all Energy.}}
}}"""

        extraction = extract_skill_infobox(
            skill_id=17,
            template_id=17,
            requested_title="Mantra of Resolve",
            canonical_title="Mantra of Resolve",
            page_identity=page_identity("Mantra of Resolve"),
            wikitext=text,
            source_reference=source_ref(),
            profession_catalog=self.pa_catalog,
            review_id="review:fixture",
        )

        description = extraction.record["description"]
        self.assertNotIn("{{gray|", description["searchText"])
        self.assertNotIn("{{grey|", description["searchText"])
        self.assertIn("Prevention cost: lose Energy or Mantra of Resolve ends.", description["searchText"])
        self.assertIn("Failure cost: lose all Energy.", description["searchText"])
        literal_values = [token["value"] for token in description["tokens"] if token["kind"] == "literal"]
        self.assertNotIn("{{gray|Prevention", literal_values)
        self.assertNotIn("{{grey|Failure", literal_values)
        self.assertIn({"kind": "literal", "value": "Prevention", "tone": "muted"}, description["tokens"])
        self.assertIn({"kind": "literal", "value": "Failure", "tone": "muted"}, description["tokens"])
        self.assertEqual(
            [
                token
                for token in description["tokens"]
                if token["kind"] == "progression-reference"
            ],
            [
                {"kind": "progression-reference", "seriesId": "progression:skill:17:1", "valueSlot": 0},
                {
                    "kind": "progression-reference",
                    "seriesId": "progression:skill:17:2",
                    "valueSlot": 0,
                    "tone": "muted",
                },
            ],
        )

    def test_missing_infobox_is_explicitly_unsupported(self) -> None:
        extraction = extract_skill_infobox(
            skill_id=99,
            template_id=99,
            requested_title="Missing",
            canonical_title="Missing",
            page_identity=page_identity("Missing"),
            wikitext="No supported template",
            source_reference=source_ref(),
            profession_catalog=self.pa_catalog,
            review_id="review:fixture",
        )

        self.assertTrue(extraction.record["classification"]["unsupported"])
        self.assertEqual(extraction.record["typeId"], "base-skill")
        self.assertEqual(extraction.record["description"]["state"], "unsupported")
        self.assertEqual(extraction.diagnostics[0].code, "SKILL_INFOBOX_MISSING")

    def test_unknown_skill_type_is_a_blocking_diagnostic(self) -> None:
        text = """{{Skill infobox
| id = 18
| name = Unknown Type Fixture
| campaign = Core
| profession = Mesmer
| attribute = Inspiration Magic
| type = Improvised Action
| concise description = Does something.
}}"""

        extraction = extract_skill_infobox(
            skill_id=18,
            template_id=18,
            requested_title="Unknown Type Fixture",
            canonical_title="Unknown Type Fixture",
            page_identity=page_identity("Unknown Type Fixture"),
            wikitext=text,
            source_reference=source_ref(),
            profession_catalog=self.pa_catalog,
            review_id="review:fixture",
        )

        self.assertEqual(extraction.record["type"], "Improvised Action")
        self.assertEqual(extraction.record["typeId"], "base-skill")
        type_diagnostics = [
            diagnostic for diagnostic in extraction.diagnostics if diagnostic.code == "SKILL_TYPE_UNKNOWN"
        ]
        self.assertEqual(len(type_diagnostics), 1)
        self.assertEqual(type_diagnostics[0].severity, "error")


if __name__ == "__main__":
    unittest.main()
