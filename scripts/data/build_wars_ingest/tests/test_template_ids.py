from __future__ import annotations

import unittest
from pathlib import Path

from build_wars_ingest.models import source_reference
from build_wars_ingest.template_ids import extract_template_crosswalk

FIXTURE = Path("test/fixtures/data-ingestion/professions-attributes/skill-template-format.wiki")


def source_ref() -> dict[str, object]:
    return source_reference(
        source_id="source:gww:test:skill-template-format",
        name="Guild Wars Wiki",
        canonical_url="https://wiki.guildwars.com/wiki/Skill_template_format",
        page_id=1,
        page_title="Skill template format",
        revision_id=1,
        source_revision_timestamp="2026-08-31T00:00:00Z",
        retrieved_at="2026-09-01T00:00:00Z",
    )


class TemplateIdExtractionTests(unittest.TestCase):
    def test_fixture_extracts_sentinel_attribute_zero_and_gaps(self) -> None:
        extraction = extract_template_crosswalk(FIXTURE.read_text(encoding="utf-8"), source_reference=source_ref())
        crosswalk = extraction.crosswalk

        self.assertEqual(extraction.diagnostics, [])
        self.assertEqual(len(crosswalk["professionTemplateIds"]), 11)
        self.assertEqual(len(crosswalk["attributeTemplateIds"]), 42)
        sentinel = crosswalk["professionTemplateIds"][0]
        self.assertEqual(sentinel["templateId"], 0)
        self.assertIsNone(sentinel["catalogId"])
        self.assertEqual(sentinel["status"], "none")
        self.assertEqual(crosswalk["attributeTemplateIds"][0]["name"], "Fast Casting")
        self.assertEqual({item["templateId"] for item in crosswalk["reservedTemplateIds"]}, {26, 27, 28})

    def test_duplicate_and_malformed_rows_are_diagnostics_not_corrections(self) -> None:
        wikitext = """
== Profession index ==
*0 - None
*1 - [[Warrior]]
*1 - [[Warrior Duplicate]]
*bad row
== Attribute index ==
*0 - [[Fast Casting]]
*2 - [[Fast Casting]]
"""
        extraction = extract_template_crosswalk(wikitext, source_reference=source_ref())
        codes = {diagnostic.code for diagnostic in extraction.diagnostics}

        self.assertIn("TEMPLATE_PROFESSION_DUPLICATE_ID", codes)
        self.assertIn("TEMPLATE_PROFESSION_MALFORMED_ROW", codes)
        self.assertIn("TEMPLATE_ATTRIBUTE_DUPLICATE_NAME", codes)


if __name__ == "__main__":
    unittest.main()
