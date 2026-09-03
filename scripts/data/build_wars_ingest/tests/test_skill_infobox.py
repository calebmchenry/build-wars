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

    def test_core_infobox_fields_join_costs_and_description_state(self) -> None:
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
        self.assertEqual(record["costs"]["energy"]["state"], "absent")
        self.assertEqual(record["timings"]["activation"]["value"], 2)
        self.assertEqual(record["description"]["state"], "structured-only")
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
        self.assertEqual(extraction.record["description"]["state"], "unsupported")
        self.assertEqual(extraction.diagnostics[0].code, "SKILL_INFOBOX_MISSING")


if __name__ == "__main__":
    unittest.main()
