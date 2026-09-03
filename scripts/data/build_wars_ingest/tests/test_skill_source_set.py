from __future__ import annotations

import copy
import unittest
from pathlib import Path

from build_wars_ingest.models import source_reference
from build_wars_ingest.profiles import EPIC_04_PROFESSION_SKILL_LISTS, EPIC_04_PROFILE_ID, profile_by_id
from build_wars_ingest.skill_source_set import (
    SkillSourceSetError,
    build_source_plan,
    pve_only_skill_rows_from_rendered_html,
    profession_skill_rows_from_rendered_html,
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


def fixture_profession_list_snapshots() -> list[dict[str, object]]:
    snapshots: list[dict[str, object]] = []
    for profession_id, slug, title in EPIC_04_PROFESSION_SKILL_LISTS:
        snapshots.append(
            {
                "title": title,
                "content": (FIXTURE_ROOT / f"skills/list-{slug}.html").read_text(encoding="utf-8"),
                "sourceReference": source(title, 100 + profession_id),
                "professionId": profession_id,
            }
        )
    return snapshots


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
            profession_list_snapshots=fixture_profession_list_snapshots(),
            pve_only_list_snapshot={
                "title": "List of PvE-only skills",
                "content": (FIXTURE_ROOT / "skills/list-pve-only.html").read_text(encoding="utf-8"),
                "sourceReference": source("List of PvE-only skills", 6),
            },
        )

        self.assertEqual(result.plan["summary"]["acceptedSeedCount"], 6)
        self.assertEqual([seed["skillId"] for seed in result.plan["acceptedSeeds"]], [1, 2, 3, 4, 5, 6])
        self.assertEqual(result.plan["summary"]["professionSkillRowCount"], 5)
        self.assertEqual(result.plan["summary"]["pveOnlySkillRowCount"], 2)
        self.assertEqual(result.plan["summary"]["rangeSeedCount"], 6)
        self.assertEqual(result.plan["summary"]["rangeOnlySeedCount"], 0)
        self.assertEqual(result.plan["summary"]["sourcePlanDigest"], source_plan_digest(result.plan))
        validate_source_plan(
            result.plan,
            profile=profile,
            confirm_digest=result.plan["summary"]["sourcePlanDigest"],
        )

    def test_profession_lists_are_the_promoted_seed_authority(self) -> None:
        profile = profile_by_id(EPIC_04_PROFILE_ID)
        index_text = (FIXTURE_ROOT / "skills/index.wiki").read_text(encoding="utf-8")
        range_text = (FIXTURE_ROOT / "skills/skills-1-10.wiki").read_text(encoding="utf-8")
        profession_html = """
            <table class="sortable"><tbody>
            <tr data-name=""><th>icon</th><th><a href="/wiki/Healing_Signet" title="Healing Signet">Healing Signet</a></th></tr>
            </tbody></table>
            """

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
            profession_list_snapshots=[
                {
                    "title": "List of warrior skills",
                    "content": profession_html,
                    "sourceReference": source("List of warrior skills", 3),
                    "professionId": 1,
                }
            ],
        )

        self.assertEqual([seed["skillId"] for seed in result.plan["acceptedSeeds"]], [1])
        self.assertEqual(result.plan["summary"]["rangeSeedCount"], 6)
        self.assertEqual(result.plan["summary"]["rangeOnlySeedCount"], 5)
        self.assertEqual(result.plan["acceptedSeeds"][0]["idSourceKind"], "game-integration-range")

    def test_profession_skill_rows_parse_rendered_skill_table_links(self) -> None:
        rows, diagnostics = profession_skill_rows_from_rendered_html(
            """
            <table class="sortable"><tbody>
            <tr data-name=""><th>icon</th><th><a href="/wiki/%22Coward!%22_(PvP)" title="&quot;Coward!&quot; (PvP)">"Coward!" (PvP)</a></th></tr>
            </tbody></table>
            """,
            list_title="List of warrior skills",
            profession_id=1,
            source_reference=source("List of warrior skills", 3),
        )

        self.assertEqual(diagnostics, [])
        self.assertEqual(rows[0]["requestedTitle"], '"Coward!" (PvP)')
        self.assertEqual(rows[0]["name"], '"Coward!" (PvP)')

    def test_pve_only_skill_rows_parse_rendered_skill_table_sections(self) -> None:
        rows, diagnostics = pve_only_skill_rows_from_rendered_html(
            """
            <h3><span class="mw-headline">Asura skills</span><span>[edit]</span></h3>
            <table class="sortable"><tbody>
            <tr data-name="Technobabble"><th>icon</th><th><a href="/wiki/Technobabble" title="Technobabble">Technobabble</a></th></tr>
            </tbody></table>
            """,
            list_title="List of PvE-only skills",
            source_reference=source("List of PvE-only skills", 6),
        )

        self.assertEqual(diagnostics, [])
        self.assertEqual(rows[0]["requestedTitle"], "Technobabble")
        self.assertEqual(rows[0]["pveOnlySection"], "asura-skills")

    def test_profession_list_only_rows_become_supplemental_seeds(self) -> None:
        profile = profile_by_id(EPIC_04_PROFILE_ID)
        index_text = (FIXTURE_ROOT / "skills/index.wiki").read_text(encoding="utf-8")
        range_text = (FIXTURE_ROOT / "skills/skills-1-10.wiki").read_text(encoding="utf-8")
        profession_html = """
            <table class="sortable"><tbody>
            <tr data-name=""><th>icon</th><th><a href="/wiki/%22Coward!%22_(PvP)" title="&quot;Coward!&quot; (PvP)">"Coward!" (PvP)</a></th></tr>
            </tbody></table>
            """
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
            profession_list_snapshots=[
                {
                    "title": "List of warrior skills",
                    "content": profession_html,
                    "sourceReference": source("List of warrior skills", 3),
                    "professionId": 1,
                }
            ],
            supplemental_seed_snapshots=[
                {
                    "title": '"Coward!" (PvP)',
                    "requestedTitle": '"Coward!" (PvP)',
                    "canonicalTitle": '"Coward!" (PvP)',
                    "content": "{{Skill infobox| id = 7 | name = \"Coward!\" (PvP) | profession = Warrior | type = Shout}}",
                    "sourceReference": source('"Coward!" (PvP)', 4),
                }
            ],
        )

        self.assertEqual(result.plan["summary"]["acceptedSeedCount"], 1)
        self.assertEqual(result.plan["summary"]["professionSkillRowCount"], 1)
        self.assertEqual(result.plan["summary"]["rangeSeedCount"], 6)
        self.assertEqual(result.plan["summary"]["rangeOnlySeedCount"], 6)
        self.assertEqual(result.plan["summary"]["supplementalSeedCount"], 1)
        self.assertEqual(result.plan["summary"]["unresolvedProfessionListTitleCount"], 0)
        self.assertEqual(result.plan["acceptedSeeds"][0]["skillId"], 7)
        self.assertEqual(result.plan["acceptedSeeds"][0]["requestedTitle"], '"Coward!" (PvP)')
        self.assertEqual(result.plan["acceptedSeeds"][0]["idSourceKind"], "supplemental-infobox")
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
            profession_list_snapshots=fixture_profession_list_snapshots(),
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
