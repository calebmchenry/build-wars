from __future__ import annotations

import json
import unittest

from build_wars_ingest.skill_icon_assets import build_skill_icon_asset_manifests


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
