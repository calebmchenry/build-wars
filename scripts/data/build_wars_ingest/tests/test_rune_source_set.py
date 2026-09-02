from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path
from types import SimpleNamespace

from build_wars_ingest.models import digest_bytes, source_reference
from build_wars_ingest.profiles import EPIC_10_PROFILE_ID, profile_by_id
from build_wars_ingest.rune_source_set import (
    RuneSourceSetError,
    armor_rune_inventory_entries,
    build_source_plan,
    modifier_rows_from_equipment_template,
    source_plan_digest,
    validate_source_plan,
)

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


def source(title: str, revision_id: int) -> dict[str, object]:
    return source_reference(
        source_id=f"source:gww:epic-10-fixture:{revision_id}",
        name="Guild Wars Wiki",
        canonical_url=f"https://wiki.guildwars.com/wiki/{title.replace(' ', '_')}",
        page_id=revision_id,
        page_title=title,
        revision_id=revision_id,
        source_revision_timestamp="2026-08-31T00:00:00Z",
        retrieved_at="2026-09-01T00:00:00Z",
    )


def dependency() -> SimpleNamespace:
    catalog_path = FIXTURE_ROOT / "generated/fixture-professions-attributes.catalog.json"
    catalog_bytes = catalog_path.read_bytes()
    return SimpleNamespace(
        catalog=json.loads(catalog_bytes.decode("utf-8")),
        artifact_digest=digest_bytes(catalog_bytes),
        manifest_digest="m" * 64,
        qa_gate="pass",
    )


def source_snapshots() -> list[dict[str, object]]:
    base = FIXTURE_ROOT / "runes"
    titles = {
        "Equipment template format": base / "equipment-template-format.wiki",
        "Rune": base / "rune.wiki",
        "Attribute bonus": base / "attribute-bonus.wiki",
    }
    return [
        {"title": title, "content": path.read_text(encoding="utf-8"), "sourceReference": source(title, index)}
        for index, (title, path) in enumerate(titles.items(), start=1)
    ]


class RuneSourceSetTests(unittest.TestCase):
    def test_modifier_rows_parse_rune_like_candidates_and_exclusions(self) -> None:
        text = (FIXTURE_ROOT / "runes/equipment-template-format.wiki").read_text(encoding="utf-8")

        rows = modifier_rows_from_equipment_template(text)

        self.assertEqual(rows[0]["name"], "Icy Sword Hilt")
        self.assertIn("Rune of Superior Swordsmanship", [row["name"] for row in rows])
        self.assertIn("Survivor Insignia", [row["name"] for row in rows])

    def test_inventory_entries_keep_abstract_rows_and_condition_families(self) -> None:
        text = (FIXTURE_ROOT / "runes/rune.wiki").read_text(encoding="utf-8")

        entries = armor_rune_inventory_entries(text)

        self.assertIn("<Profession> Rune of Superior <Attribute>", [entry["title"] for entry in entries])
        self.assertIn("Rune of Restoration", [entry["title"] for entry in entries])
        self.assertIn("Warrior Rune of Minor Absorption", [entry["title"] for entry in entries])

    def test_source_plan_is_digest_bound_and_separates_restoration_names(self) -> None:
        profile = profile_by_id(EPIC_10_PROFILE_ID)

        result = build_source_plan(
            profile=profile,
            generated_at="2026-09-01T00:00:00Z",
            source_snapshots=source_snapshots(),
            dependency=dependency(),
        )

        self.assertEqual(result.plan["summary"]["acceptedRuneCount"], 18)
        self.assertEqual(result.plan["summary"]["unsupportedCount"], 1)
        self.assertEqual(result.plan["summary"]["exclusionCount"], 3)
        self.assertEqual(result.plan["summary"]["sourcePlanDigest"], source_plan_digest(result.plan))
        family_keys = {seed["requestedTitle"]: seed["familyKey"] for seed in result.plan["acceptedSeeds"]}
        self.assertEqual(family_keys["Rune of Restoration"], "condition:restoration")
        self.assertEqual(family_keys["Rune of Minor Restoration Magic"], "attribute:restoration-magic")
        validate_source_plan(
            result.plan,
            profile=profile,
            confirm_source_set_digest=result.plan["summary"]["sourceSetDigest"],
        )

    def test_source_plan_rejects_edits_and_wrong_confirmation_digest(self) -> None:
        profile = profile_by_id(EPIC_10_PROFILE_ID)
        result = build_source_plan(
            profile=profile,
            generated_at="2026-09-01T00:00:00Z",
            source_snapshots=source_snapshots(),
            dependency=dependency(),
        )

        with self.assertRaisesRegex(RuneSourceSetError, "confirmation"):
            validate_source_plan(result.plan, profile=profile, confirm_source_set_digest="bad")

        edited = copy.deepcopy(result.plan)
        edited["acceptedSeeds"][0]["requestedTitle"] = "Edited"
        with self.assertRaisesRegex(RuneSourceSetError, "digest"):
            validate_source_plan(
                edited,
                profile=profile,
                confirm_source_set_digest=result.plan["summary"]["sourceSetDigest"],
            )


if __name__ == "__main__":
    unittest.main()
