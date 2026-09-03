from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path
from types import SimpleNamespace

from build_wars_ingest.models import digest_bytes, source_reference
from build_wars_ingest.profiles import EPIC_12_PROFILE_ID, profile_by_id
from build_wars_ingest.weapon_source_set import (
    WeaponSourceSetError,
    build_source_plan,
    source_plan_digest,
    validate_source_plan,
    weapon_item_rows_from_equipment_template,
    weapon_modifier_rows_from_equipment_template,
)

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


def source(title: str, revision_id: int) -> dict[str, object]:
    return source_reference(
        source_id=f"source:gww:epic-12-fixture:{revision_id}",
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
    base = FIXTURE_ROOT / "weapons-and-mods"
    titles = {
        "Equipment template format": base / "equipment-template-format.wiki",
        "Weapon": base / "weapon.wiki",
        "Weapon upgrade": base / "weapon-upgrade.wiki",
        "Inscription": base / "inscription.wiki",
    }
    return [
        {"title": title, "content": path.read_text(encoding="utf-8"), "sourceReference": source(title, index)}
        for index, (title, path) in enumerate(titles.items(), start=1)
    ]


class WeaponSourceSetTests(unittest.TestCase):
    def test_equipment_template_fixture_rows_parse_weapon_candidates(self) -> None:
        text = (FIXTURE_ROOT / "weapons-and-mods/equipment-template-format.wiki").read_text(encoding="utf-8")

        item_rows = weapon_item_rows_from_equipment_template(text)
        modifier_rows = weapon_modifier_rows_from_equipment_template(text)

        self.assertEqual(len(item_rows), 11)
        self.assertEqual(next(row for row in item_rows if row["name"] == "Sword")["templateItemId"], 279)
        self.assertEqual(len(modifier_rows), 9)
        self.assertIn(329, {row["templateModifierId"] for row in modifier_rows})

    def test_source_plan_is_digest_bound_and_has_separate_sections(self) -> None:
        profile = profile_by_id(EPIC_12_PROFILE_ID)

        result = build_source_plan(
            profile=profile,
            generated_at="2026-09-01T00:00:00Z",
            source_snapshots=source_snapshots(),
            dependency=dependency(),
        )

        self.assertEqual(result.plan["summary"]["acceptedWeaponBaseCount"], 11)
        self.assertEqual(result.plan["summary"]["acceptedWeaponModifierCount"], 9)
        self.assertEqual(result.plan["summary"]["sourcePlanDigest"], source_plan_digest(result.plan))
        self.assertIn("Sword", result.plan["detailPageTitles"])
        self.assertIn("Staff Head", result.plan["detailPageTitles"])
        self.assertEqual(result.plan["acceptedWeaponBases"][1]["templateItems"][0]["templateItemId"], 279)
        self.assertEqual(result.plan["acceptedWeaponModifiers"][2]["templateModifiers"][0]["templateModifierId"], 329)
        validate_source_plan(
            result.plan,
            profile=profile,
            confirm_source_set_digest=result.plan["summary"]["sourceSetDigest"],
        )

    def test_source_plan_rejects_edits_and_wrong_confirmation_digest(self) -> None:
        profile = profile_by_id(EPIC_12_PROFILE_ID)
        result = build_source_plan(
            profile=profile,
            generated_at="2026-09-01T00:00:00Z",
            source_snapshots=source_snapshots(),
            dependency=dependency(),
        )

        with self.assertRaisesRegex(WeaponSourceSetError, "confirmation"):
            validate_source_plan(result.plan, profile=profile, confirm_source_set_digest="bad")

        edited = copy.deepcopy(result.plan)
        edited["acceptedWeaponBases"][0]["name"] = "Edited"
        with self.assertRaisesRegex(WeaponSourceSetError, "digest"):
            validate_source_plan(
                edited,
                profile=profile,
                confirm_source_set_digest=result.plan["summary"]["sourceSetDigest"],
            )


if __name__ == "__main__":
    unittest.main()
