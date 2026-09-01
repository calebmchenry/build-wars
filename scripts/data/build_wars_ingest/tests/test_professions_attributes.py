from __future__ import annotations

import json
import unittest
from pathlib import Path

from build_wars_ingest.models import source_reference
from build_wars_ingest.professions_attributes import extract_professions_and_attributes
from build_wars_ingest.template_ids import extract_template_crosswalk

BASE = Path("test/fixtures/data-ingestion/professions-attributes")
PROFESSIONS = ("Warrior", "Ranger", "Monk", "Necromancer", "Mesmer", "Elementalist", "Assassin", "Ritualist", "Paragon", "Dervish")


def refs() -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    for index, title in enumerate(("Skill template format", "Profession", "Attribute", "Attribute point"), start=1):
        result[title] = source_reference(
            source_id=f"source:gww:test:{title.casefold().replace(' ', '-')}",
            name="Guild Wars Wiki",
            canonical_url=f"https://wiki.guildwars.com/wiki/{title.replace(' ', '_')}",
            page_id=index,
            page_title=title,
            revision_id=index,
            source_revision_timestamp="2026-08-31T00:00:00Z",
            retrieved_at="2026-09-01T00:00:00Z",
        )
    return result


class ProfessionAttributeExtractionTests(unittest.TestCase):
    def test_extracts_professions_attributes_summaries_and_icon_metadata(self) -> None:
        sources = refs()
        template = extract_template_crosswalk(
            (BASE / "skill-template-format.wiki").read_text(encoding="utf-8"),
            source_reference=sources["Skill template format"],
        )
        imageinfo = json.loads((BASE / "imageinfo.json").read_text(encoding="utf-8"))
        profession_pages = {
            profession: f"{{{{Quotation|game|icon=[[File:{profession}-icon.png|60px]]|Synthetic fixture.}}}}"
            for profession in PROFESSIONS
        }

        extraction = extract_professions_and_attributes(
            profession_wikitext=(BASE / "profession.wiki").read_text(encoding="utf-8"),
            attribute_wikitext=(BASE / "attribute.wiki").read_text(encoding="utf-8"),
            template_crosswalk=template.crosswalk,
            sources_by_title=sources,
            generated_at="2026-09-01T00:00:00Z",
            profession_pages=profession_pages,
            imageinfo_pages=imageinfo["pages"],
        )

        self.assertEqual(extraction.diagnostics, [])
        self.assertEqual(len(extraction.professions), 10)
        self.assertEqual(len(extraction.attributes), 42)
        self.assertEqual(len(extraction.remote_media), 10)
        warrior = next(record for record in extraction.professions if record["name"] == "Warrior")
        self.assertEqual(warrior["primaryAttributeTemplateId"], 17)
        fast_casting = next(record for record in extraction.attributes if record["templateId"] == 0)
        self.assertEqual(fast_casting["name"], "Fast Casting")
        self.assertTrue(fast_casting["isPrimaryOnly"])
        self.assertIn("review:epic-03-primary-effect-summaries", fast_casting["primaryEffectSummary"]["provenance"]["reviewIds"][0])
        self.assertTrue(all(media["cachedBytes"] is False for media in extraction.remote_media))


if __name__ == "__main__":
    unittest.main()
