from __future__ import annotations

import json
import unittest
from pathlib import Path

from build_wars_ingest.insignia_extractor import extract_insignia_records, icon_titles_from_detail_pages
from build_wars_ingest.models import source_reference

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


def source(title: str, revision_id: int) -> dict[str, object]:
    return source_reference(
        source_id=f"source:gww:epic-11-extractor:{revision_id}",
        name="Guild Wars Wiki",
        canonical_url=f"https://wiki.guildwars.com/wiki/{title.replace(' ', '_')}",
        page_id=revision_id,
        page_title=title,
        revision_id=revision_id,
        source_revision_timestamp="2026-08-31T00:00:00Z",
        retrieved_at="2026-09-01T00:00:00Z",
    )


def detail_page(title: str, modifier_id: int, content_file: str, profession: str | None = None) -> dict[str, object]:
    return {
        "sourceKey": f"equipment-modifier:{modifier_id}",
        "id": modifier_id,
        "variantKey": None,
        "templateModifierId": modifier_id,
        "requestedTitle": title,
        "detailTitle": title,
        "normalizedName": title.lower(),
        "familyKey": title.lower().replace(" insignia", "").replace("'", "").replace(" ", "-"),
        "availability": "common" if profession is None else "profession-specific",
        "professionName": profession,
        "modeAvailability": "both",
        "rawOverviewBonus": None,
        "overviewSourceId": "source:gww:epic-11-overview",
        "mechanicsSourceId": "source:gww:epic-11-mechanics",
        "normalizedTitle": title,
        "canonicalTitle": title,
        "redirectedFrom": None,
        "pageId": 12000 + modifier_id,
        "revisionId": 13000 + modifier_id,
        "sourceRevisionTimestamp": "2026-08-31T00:00:00Z",
        "responseIndex": modifier_id,
        "disambiguationPreamble": None,
        "content": (FIXTURE_ROOT / f"insignias/{content_file}").read_text(encoding="utf-8"),
        "sourceReference": source(title, 13000 + modifier_id),
    }


class InsigniaExtractorTests(unittest.TestCase):
    def test_extracts_raw_records_with_profession_joins_and_icon_metadata(self) -> None:
        profession_catalog = json.loads((FIXTURE_ROOT / "generated/fixture-professions-attributes.catalog.json").read_text(encoding="utf-8"))
        imageinfo = json.loads((FIXTURE_ROOT / "insignias/imageinfo.json").read_text(encoding="utf-8"))

        result = extract_insignia_records(
            detail_pages=[
                detail_page("Survivor Insignia", 290, "survivor-insignia.wiki"),
                detail_page("Sentinel's Insignia", 317, "sentinels-insignia.wiki", "Warrior"),
            ],
            imageinfo_pages=imageinfo["pages"],
            profession_catalog=profession_catalog,
        )

        self.assertEqual([record["id"] for record in result.raw_records], [290, 317])
        self.assertEqual(result.raw_records[0]["iconId"], "remote-media:gww-icon:survivor-insignia")
        self.assertEqual(result.raw_records[1]["professionName"], "Warrior")
        self.assertIn("Strength", [item["name"] for item in result.raw_records[1]["attributeReferences"]])
        self.assertTrue(all(media["cachedBytes"] is False for media in result.remote_media))

    def test_icon_title_collection_is_metadata_only_and_bounded(self) -> None:
        pages = [
            detail_page("Survivor Insignia", 290, "survivor-insignia.wiki"),
            detail_page("Radiant Insignia", 291, "radiant-insignia.wiki"),
        ]

        self.assertEqual(
            icon_titles_from_detail_pages(pages, 1),
            ["File:Fixture Radiant Insignia.png"],
        )


if __name__ == "__main__":
    unittest.main()
