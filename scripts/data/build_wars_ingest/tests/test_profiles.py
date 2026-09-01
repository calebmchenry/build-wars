from __future__ import annotations

import unittest

from build_wars_ingest.profiles import EPIC_02_PROFILE_ID, EPIC_03_PROFILE_ID, profile_by_id, profile_choices


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


if __name__ == "__main__":
    unittest.main()
