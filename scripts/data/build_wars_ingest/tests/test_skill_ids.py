from __future__ import annotations

import unittest
from pathlib import Path

from build_wars_ingest.models import source_reference
from build_wars_ingest.skill_ids import SkillIdSource, enumerate_skill_ids

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


def fixture_source() -> SkillIdSource:
    source = source_reference(
        source_id="source:gww:skills:0",
        name="Guild Wars Wiki",
        canonical_url="https://wiki.guildwars.com/wiki/Guild_Wars_Wiki:Game_integration/Skills/0",
        page_id=1,
        page_title="Guild Wars Wiki:Game integration/Skills/0",
        revision_id=10,
        source_revision_timestamp="2026-08-31T00:00:00Z",
        retrieved_at="2026-09-01T00:00:00Z",
    )
    return SkillIdSource(
        source_page="Guild Wars Wiki:Game integration/Skills/0",
        source_url=str(source["canonicalUrl"]),
        source_revision_id=10,
        source_revision_timestamp="2026-08-31T00:00:00Z",
        source_id=str(source["id"]),
        source_reference=source,
    )


class SkillIdTests(unittest.TestCase):
    def test_fixture_maps_sorted_records_with_provenance(self) -> None:
        text = (FIXTURE_ROOT / "skill-ids/game-integration-skills-0.wiki").read_text(encoding="utf-8")

        records, diagnostics = enumerate_skill_ids(text, source=fixture_source())

        self.assertEqual([record["skillId"] for record in records], [1, 2, 4])
        self.assertEqual(records[1]["title"], "Quoted Skill (PvP)")
        self.assertEqual(records[2]["title"], "Special Effect")
        self.assertEqual(records[0]["provenance"]["sources"][0]["id"], "source:gww:skills:0")
        self.assertIn("SKILL_ID_GAP", [diagnostic.code for diagnostic in diagnostics])

    def test_duplicate_id_and_title_are_reported_without_silent_drop(self) -> None:
        text = "\n".join(
            [
                "* [[Game link:Skill 1]] = [[Fixture Flame]]",
                "* [[Game link:Skill 1]] = [[Other Fixture]]",
                "* [[Game link:Skill 2]] = [[Fixture Flame]]",
            ]
        )

        records, diagnostics = enumerate_skill_ids(text, source=fixture_source())

        self.assertEqual([record["skillId"] for record in records], [1, 2])
        self.assertIn("SKILL_ID_DUPLICATE_ID", [diagnostic.code for diagnostic in diagnostics])
        self.assertIn("SKILL_ID_DUPLICATE_TITLE", [diagnostic.code for diagnostic in diagnostics])

    def test_malformed_non_integer_out_of_range_and_missing_target_are_reported(self) -> None:
        text = "\n".join(
            [
                "* [[Game link:Skill abc]] = [[Bad]]",
                "* [[Game link:Skill 999999]] = [[Huge]]",
                "* [[Game link:Skill 3]]",
                "* [[Game link:Skill <bad>]]",
            ]
        )

        records, diagnostics = enumerate_skill_ids(text, source=fixture_source(), max_id=10)

        self.assertEqual(records, [])
        self.assertEqual(
            [diagnostic.code for diagnostic in diagnostics],
            [
                "SKILL_ID_MALFORMED_CANDIDATE",
                "SKILL_ID_MISSING_TARGET",
                "SKILL_ID_NON_INTEGER",
                "SKILL_ID_OUT_OF_RANGE",
            ],
        )

    def test_redirect_ambiguity_and_unexpected_lines_are_preserved(self) -> None:
        text = "\n".join(
            [
                "* [[Unrelated Page]]",
                "* [[Game link:Skill 7]] -> [[Redirect Fixture]] <!-- redirect -->",
            ]
        )

        records, diagnostics = enumerate_skill_ids(text, source=fixture_source(), min_id=7)

        self.assertEqual(records[0]["title"], "Redirect Fixture")
        self.assertIn("SKILL_ID_REDIRECT_AMBIGUITY", [diagnostic.code for diagnostic in diagnostics])
        self.assertIn("SKILL_ID_UNEXPECTED_LINE", [diagnostic.code for diagnostic in diagnostics])


if __name__ == "__main__":
    unittest.main()
