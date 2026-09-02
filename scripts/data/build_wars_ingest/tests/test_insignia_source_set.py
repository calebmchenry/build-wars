from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path
from types import SimpleNamespace

from build_wars_ingest.models import digest_bytes, source_reference
from build_wars_ingest.profiles import EPIC_11_PROFILE_ID, profile_by_id
from build_wars_ingest.insignia_source_set import (
    InsigniaSourceSetError,
    build_source_plan,
    overview_insignia_entries,
    source_plan_digest,
    validate_source_plan,
)

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


def source(title: str, revision_id: int) -> dict[str, object]:
    return source_reference(
        source_id=f"source:gww:epic-11-fixture:{revision_id}",
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
    base = FIXTURE_ROOT / "insignias"
    titles = {
        "Equipment template format": base / "equipment-template-format.wiki",
        "Insignia": base / "insignia.wiki",
        "Effect stacking": base / "effect-stacking.wiki",
    }
    return [
        {"title": title, "content": path.read_text(encoding="utf-8"), "sourceReference": source(title, index)}
        for index, (title, path) in enumerate(titles.items(), start=1)
    ]


class InsigniaSourceSetTests(unittest.TestCase):
    def test_overview_entries_parse_profession_groups_and_bonus_fields(self) -> None:
        text = (FIXTURE_ROOT / "insignias/insignia.wiki").read_text(encoding="utf-8")

        entries = overview_insignia_entries(text)

        self.assertEqual(len(entries), 13)
        self.assertEqual(entries[0]["availability"], "profession-specific")
        self.assertIn("Survivor Insignia", [entry["title"] for entry in entries])
        self.assertEqual(
            next(entry for entry in entries if entry["title"] == "Sentinel's Insignia")["professionName"],
            "Warrior",
        )

    def test_source_plan_is_digest_bound_and_crosswalk_complete(self) -> None:
        profile = profile_by_id(EPIC_11_PROFILE_ID)

        result = build_source_plan(
            profile=profile,
            generated_at="2026-09-01T00:00:00Z",
            source_snapshots=source_snapshots(),
            dependency=dependency(),
        )

        self.assertEqual(result.plan["summary"]["acceptedInsigniaCount"], 13)
        self.assertEqual(result.plan["summary"]["relationshipCount"], 1)
        self.assertEqual(result.plan["summary"]["sourcePlanDigest"], source_plan_digest(result.plan))
        self.assertIn("Survivor Insignia", result.plan["detailPageTitles"])
        self.assertEqual(result.plan["acceptedSeeds"][0]["templateModifierId"], 290)
        validate_source_plan(
            result.plan,
            profile=profile,
            confirm_source_set_digest=result.plan["summary"]["sourceSetDigest"],
        )

    def test_source_plan_matches_possessive_modifier_to_plain_overview_title(self) -> None:
        profile = profile_by_id(EPIC_11_PROFILE_ID)
        snapshots = source_snapshots()
        for snapshot in snapshots:
            if snapshot["title"] == "Equipment template format":
                snapshot["content"] = str(snapshot["content"]).replace("Survivor Insignia", "Survivor's Insignia")

        result = build_source_plan(
            profile=profile,
            generated_at="2026-09-01T00:00:00Z",
            source_snapshots=snapshots,
            dependency=dependency(),
        )

        self.assertEqual([], [finding.code for finding in result.diagnostics])
        self.assertEqual(
            "Survivor Insignia",
            next(seed for seed in result.plan["acceptedSeeds"] if seed["templateModifierId"] == 290)["detailTitle"],
        )

    def test_source_plan_rejects_edits_and_wrong_confirmation_digest(self) -> None:
        profile = profile_by_id(EPIC_11_PROFILE_ID)
        result = build_source_plan(
            profile=profile,
            generated_at="2026-09-01T00:00:00Z",
            source_snapshots=source_snapshots(),
            dependency=dependency(),
        )

        with self.assertRaisesRegex(InsigniaSourceSetError, "confirmation"):
            validate_source_plan(result.plan, profile=profile, confirm_source_set_digest="bad")

        edited = copy.deepcopy(result.plan)
        edited["acceptedSeeds"][0]["requestedTitle"] = "Edited"
        with self.assertRaisesRegex(InsigniaSourceSetError, "digest"):
            validate_source_plan(
                edited,
                profile=profile,
                confirm_source_set_digest=result.plan["summary"]["sourceSetDigest"],
            )


if __name__ == "__main__":
    unittest.main()
