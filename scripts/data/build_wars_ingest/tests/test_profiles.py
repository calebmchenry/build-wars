from __future__ import annotations

import unittest

from build_wars_ingest.profiles import (
    EPIC_02_PROFILE_ID,
    EPIC_03_PROFILE_ID,
    EPIC_04_PROFILE_ID,
    EPIC_10_PROFILE_ID,
    profile_by_id,
    profile_choices,
)


class ProfileTests(unittest.TestCase):
    def test_epic02_profile_remains_registered(self) -> None:
        profile = profile_by_id(EPIC_02_PROFILE_ID)

        self.assertEqual(profile.id, "guild-wars-wiki")
        self.assertEqual(profile.source_epic, "EPIC-02")
        self.assertIn(EPIC_02_PROFILE_ID, profile_choices())

    def test_epic03_profile_names_locked_pages_caps_and_paths(self) -> None:
        profile = profile_by_id(EPIC_03_PROFILE_ID)

        self.assertEqual(profile.source_epic, "EPIC-03")
        self.assertEqual(profile.generated_relative_path.as_posix(), "epic-03/professions-attributes.catalog.json")
        self.assertIn("Skill template format", profile.source_titles)
        self.assertIn("Attribute point", profile.source_titles)
        self.assertIn("Warrior", profile.detail_titles)
        self.assertLessEqual(len(profile.all_page_titles), profile.page_limit)
        self.assertLessEqual(profile.request_limit, 12)

    def test_epic04_profile_uses_approved_index_and_large_bounded_caps(self) -> None:
        profile = profile_by_id(EPIC_04_PROFILE_ID)

        self.assertEqual(profile.source_epic, "EPIC-04")
        self.assertEqual(profile.generated_relative_path.as_posix(), "epic-04/skills.catalog.json")
        self.assertEqual(profile.source_titles, ("Guild Wars Wiki:Game integration/Skills",))
        self.assertEqual(profile.detail_titles, ())
        self.assertGreaterEqual(profile.page_limit, 3000)
        self.assertGreater(profile.media_title_limit, 0)
        self.assertIn(EPIC_04_PROFILE_ID, profile_choices())

    def test_epic10_profile_uses_bounded_source_authority_and_exact_paths(self) -> None:
        profile = profile_by_id(EPIC_10_PROFILE_ID)

        self.assertEqual(profile.source_epic, "EPIC-10")
        self.assertEqual(profile.generated_relative_path.as_posix(), "epic-10/runes.catalog.json")
        self.assertEqual(profile.qa_relative_path.as_posix(), "epic-10/runes.catalog.qa.json")
        self.assertEqual(profile.source_titles, ("Equipment template format", "Rune", "Attribute bonus"))
        self.assertEqual(profile.detail_titles, ())
        self.assertGreaterEqual(profile.page_limit, 138)
        self.assertGreater(profile.media_title_limit, 0)
        self.assertIn(EPIC_10_PROFILE_ID, profile_choices())


if __name__ == "__main__":
    unittest.main()
