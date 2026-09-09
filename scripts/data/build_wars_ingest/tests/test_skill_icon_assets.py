from __future__ import annotations

import json
import tempfile
import unittest
from contextlib import redirect_stderr
from io import StringIO
from pathlib import Path

from build_wars_ingest.skill_icon_assets import build_skill_icon_asset_manifests, main


def image_page(title: str, sha1: str, *, mime: str = "image/jpeg") -> dict[str, object]:
    ext = "png" if mime == "image/png" else "jpg"
    return {
        "title": title,
        "pageid": len(title),
        "imageinfo": [
            {
                "url": f"https://wiki.guildwars.com/images/{sha1[:1]}/{sha1[:2]}/{title.removeprefix('File:').replace(' ', '_')}",
                "descriptionurl": f"https://wiki.guildwars.com/wiki/{title.replace(' ', '_')}",
                "mime": mime,
                "width": 64,
                "height": 64,
                "size": 1000,
                "timestamp": "2026-09-03T00:00:00Z",
                "sha1": sha1,
            }
        ],
    }


class SkillIconAssetTests(unittest.TestCase):
    def test_missing_faction_icon_does_not_overwrite_runtime_manifests(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "catalog.json").write_text(json.dumps({"skills": [{"id": 1, "name": "Faction Fixture (Luxon)"}]}))
            (root / "images.json").write_text(json.dumps({"pages": [image_page("File:Faction Fixture (Kurzick).jpg", "a" * 40)]}))
            (root / "runtime.json").write_text("previous runtime")
            (root / "provenance.json").write_text("previous provenance")
            with redirect_stderr(StringIO()):
                result = main([
                    "--root", tmp, "--catalog", "catalog.json", "--imageinfo-json", "images.json",
                    "--runtime-manifest", "runtime.json", "--provenance-manifest", "provenance.json", "--skip-download",
                ])
            self.assertEqual(result, 2)
            self.assertEqual((root / "runtime.json").read_text(), "previous runtime")
            self.assertEqual((root / "provenance.json").read_text(), "previous provenance")

    def test_faction_icons_do_not_use_shared_composite_or_other_faction(self) -> None:
        skills = [
            {"id": index, "name": f"Faction Fixture ({faction})", "iconId": "shared",
             "pageIdentity": {"canonicalTitle": "Faction Fixture"}}
            for index, faction in enumerate(("Kurzick", "Luxon"), start=1)
        ]
        shared = image_page("File:Faction Fixture.jpg", "a" * 40)
        shared["imageinfo"][0]["height"] = 128
        kurzick = image_page("File:Faction Fixture (Kurzick).jpg", "b" * 40)
        luxon = image_page("File:Faction Fixture (Luxon).jpg", "c" * 40)
        catalog = {"skills": skills, "remoteMedia": [{"id": "shared", "fileTitle": shared["title"]}]}
        for pages, expected_count in (([shared, kurzick, luxon], 2), ([shared, kurzick], 1)):
            result = build_skill_icon_asset_manifests(
                catalog=catalog, skills=skills, imageinfo_pages=pages,
                page_images_by_title={"faction fixture": [shared["title"], kurzick["title"]]},
                generated_at="2026-09-08T16:00:00Z",
            )
            runtime = result["runtimeManifest"]
            self.assertEqual(runtime["summary"]["runtimeSkillIconCount"], expected_count)
            self.assertEqual(runtime["assetsBySkillId"]["1"]["src"], "/gww-icons/skills/faction-fixture-kurzick.jpg")
            if expected_count == 2:
                self.assertEqual(runtime["assetsBySkillId"]["2"]["src"], "/gww-icons/skills/faction-fixture-luxon.jpg")
            else:
                self.assertNotIn("2", runtime["assetsBySkillId"])

    def test_composite_images_are_never_accepted_as_square_skill_icons(self) -> None:
        skill = {"id": 1, "name": "Composite Fixture"}
        page = image_page("File:Composite Fixture.jpg", "d" * 40)
        page["imageinfo"][0]["height"] = 128
        result = build_skill_icon_asset_manifests(
            catalog={"skills": [skill]}, skills=[skill], imageinfo_pages=[page],
            generated_at="2026-09-08T16:00:00Z",
        )
        self.assertEqual(result["runtimeManifest"]["assetsBySkillId"], {})

    def test_builds_local_runtime_manifest_and_provenance_from_imageinfo(self) -> None:
        catalog = {
            "catalogVersion": "skills-test",
            "skills": [
                {
                    "id": 1,
                    "name": "Power Block",
                    "iconId": None,
                    "pageIdentity": {"canonicalTitle": "Power Block", "requestedTitle": "Power Block"},
                },
                {
                    "id": 2,
                    "name": "Ambiguous Skill",
                    "iconId": None,
                    "pageIdentity": {
                        "canonicalTitle": "Ambiguous Skill",
                        "requestedTitle": "Ambiguous Skill",
                    },
                },
                {
                    "id": 3,
                    "name": "Custom Icon Skill",
                    "iconId": "remote-media:gww-icon:custom-icon-skill",
                    "pageIdentity": {
                        "canonicalTitle": "Custom Icon Skill",
                        "requestedTitle": "Custom Icon Skill",
                    },
                },
                {
                    "id": 4,
                    "name": "PvP Skill (PvP)",
                    "iconId": None,
                    "pageIdentity": {
                        "canonicalTitle": "PvP Skill (PvP)",
                        "requestedTitle": "PvP Skill (PvP)",
                    },
                },
            ],
            "remoteMedia": [
                {
                    "id": "remote-media:gww-icon:custom-icon-skill",
                    "fileTitle": "File:Custom Source.png",
                }
            ],
        }
        payload = build_skill_icon_asset_manifests(
            catalog=catalog,
            skills=catalog["skills"],
            generated_at="2026-09-03T00:00:00Z",
            imageinfo_pages=[
                image_page("File:Power Block.jpg", "a" * 40),
                image_page("File:Ambiguous Skill.jpg", "b" * 40),
                image_page("File:Ambiguous Skill.png", "c" * 40, mime="image/png"),
                image_page("File:Custom Source.png", "d" * 40, mime="image/png"),
                image_page("File:PvP Skill.jpg", "e" * 40),
            ],
        )

        runtime_manifest = payload["runtimeManifest"]
        provenance_manifest = payload["provenanceManifest"]

        self.assertNotRegex(json.dumps(runtime_manifest), r"https?://")
        self.assertEqual(runtime_manifest["summary"]["runtimeSkillIconCount"], 3)
        self.assertEqual(runtime_manifest["assetsBySkillId"]["1"]["src"], "/gww-icons/skills/power-block.jpg")
        self.assertEqual(runtime_manifest["assetsBySkillId"]["3"]["src"], "/gww-icons/skills/custom-source.png")
        self.assertEqual(runtime_manifest["assetsBySkillId"]["4"]["src"], "/gww-icons/skills/pvp-skill.jpg")
        self.assertEqual(provenance_manifest["summary"]["unresolvedSkillCount"], 1)
        self.assertEqual(provenance_manifest["unresolved"][0]["reason"], "ambiguous-default-candidates")
        self.assertRegex(json.dumps(provenance_manifest), r"https://wiki.guildwars.com/")


if __name__ == "__main__":
    unittest.main()
