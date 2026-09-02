from __future__ import annotations

import copy
import unittest
from pathlib import Path

from build_wars_ingest.models import source_reference
from build_wars_ingest.profiles import EPIC_04_PROFILE_ID, profile_by_id
from build_wars_ingest.skill_source_set import (
    SkillSourceSetError,
    build_source_plan,
    ranged_titles_from_index,
    source_plan_digest,
    validate_source_plan,
)

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


def source(title: str, revision_id: int) -> dict[str, object]:
    return source_reference(
        source_id=f"source:gww:{revision_id}",
        name="Guild Wars Wiki",
        canonical_url=f"https://wiki.guildwars.com/wiki/{title.replace(' ', '_')}",
        page_id=revision_id,
        page_title=title,
        revision_id=revision_id,
        source_revision_timestamp="2026-08-31T00:00:00Z",
        retrieved_at="2026-09-01T00:00:00Z",
    )


class SkillSourceSetTests(unittest.TestCase):
    def test_index_enumerates_only_ranged_skill_pages(self) -> None:
        text = (FIXTURE_ROOT / "skills/index.wiki").read_text(encoding="utf-8")

        titles, diagnostics = ranged_titles_from_index(text)

        self.assertEqual(titles, ["Guild Wars Wiki:Game integration/Skills/1-10"])
        self.assertEqual(diagnostics, [])

    def test_source_plan_is_digest_bound_and_counts_accepted_seeds(self) -> None:
        profile = profile_by_id(EPIC_04_PROFILE_ID)
        index_text = (FIXTURE_ROOT / "skills/index.wiki").read_text(encoding="utf-8")
        range_text = (FIXTURE_ROOT / "skills/skills-1-10.wiki").read_text(encoding="utf-8")

        result = build_source_plan(
            profile=profile,
            generated_at="2026-09-01T00:00:00Z",
            index_snapshot={
                "title": "Guild Wars Wiki:Game integration/Skills",
                "content": index_text,
                "sourceReference": source("Guild Wars Wiki:Game integration/Skills", 1),
            },
            range_snapshots=[
                {
                    "title": "Guild Wars Wiki:Game integration/Skills/1-10",
                    "content": range_text,
                    "sourceReference": source("Guild Wars Wiki:Game integration/Skills/1-10", 2),
                }
            ],
        )

        self.assertEqual(result.plan["summary"]["acceptedSeedCount"], 5)
        self.assertEqual([seed["skillId"] for seed in result.plan["acceptedSeeds"]], [1, 2, 3, 4, 5])
        self.assertEqual(result.plan["summary"]["sourcePlanDigest"], source_plan_digest(result.plan))
        validate_source_plan(
            result.plan,
            profile=profile,
            confirm_digest=result.plan["summary"]["sourcePlanDigest"],
        )

    def test_source_plan_rejects_edits_and_wrong_confirmation_digest(self) -> None:
        profile = profile_by_id(EPIC_04_PROFILE_ID)
        index_text = (FIXTURE_ROOT / "skills/index.wiki").read_text(encoding="utf-8")
        range_text = (FIXTURE_ROOT / "skills/skills-1-10.wiki").read_text(encoding="utf-8")
        result = build_source_plan(
            profile=profile,
            generated_at="2026-09-01T00:00:00Z",
            index_snapshot={
                "title": "Guild Wars Wiki:Game integration/Skills",
                "content": index_text,
                "sourceReference": source("Guild Wars Wiki:Game integration/Skills", 1),
            },
            range_snapshots=[
                {
                    "title": "Guild Wars Wiki:Game integration/Skills/1-10",
                    "content": range_text,
                    "sourceReference": source("Guild Wars Wiki:Game integration/Skills/1-10", 2),
                }
            ],
        )

        with self.assertRaisesRegex(SkillSourceSetError, "confirmation"):
            validate_source_plan(result.plan, profile=profile, confirm_digest="bad")

        edited = copy.deepcopy(result.plan)
        edited["acceptedSeeds"][0]["requestedTitle"] = "Edited"
        with self.assertRaisesRegex(SkillSourceSetError, "digest"):
            validate_source_plan(
                edited,
                profile=profile,
                confirm_digest=result.plan["summary"]["sourcePlanDigest"],
            )


if __name__ == "__main__":
    unittest.main()
