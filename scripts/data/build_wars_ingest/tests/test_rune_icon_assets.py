from copy import deepcopy
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from urllib.request import Request

from build_wars_ingest.artifacts import ArtifactError, atomic_write
from build_wars_ingest.rune_icon_assets import (
    CATALOG, RUNTIME, PROVENANCE, PUBLIC, RuneIconAssetError, CheckedRedirect,
    cache_release, release_records, validate_url, verify_png,
)

ROOT = Path(__file__).resolve().parents[4]
CATALOG_DATA = json.loads((ROOT / CATALOG).read_text())


class RuneIconAssetsTests(unittest.TestCase):
    def test_pinned_identities_and_real_non_square_bytes(self):
        runes, images = release_records(CATALOG_DATA)
        self.assertEqual(len(runes), 126)
        self.assertEqual(len(images), 30)
        self.assertTrue(all(m["height"] != m["width"] for m in images))
        for media in images:
            verify_png((ROOT / PUBLIC / f"{media['remoteSha1']}.png").read_bytes(), media)

    def test_deduplication_and_conflicting_identity(self):
        catalog = deepcopy(CATALOG_DATA)
        self.assertEqual(len({m["iconId"] for m in catalog["runes"] if m["familyKind"] == "attribute"}), 126)
        media_id = next(r["iconId"] for r in catalog["runes"] if r["familyKind"] == "attribute")
        next(m for m in catalog["remoteMedia"] if m["id"] == media_id)["remoteSha1"] = "0" * 40
        with self.assertRaises(RuneIconAssetError):
            release_records(catalog)

    def test_bad_hash_html_and_dimensions(self):
        media = release_records(CATALOG_DATA)[1][0]
        payload = (ROOT / PUBLIC / f"{media['remoteSha1']}.png").read_bytes()
        with self.assertRaisesRegex(RuneIconAssetError, "SHA-1 mismatch"):
            verify_png(payload[:-1] + bytes([payload[-1] ^ 1]), media)
        html = b"<html>access denied</html>"
        with self.assertRaisesRegex(RuneIconAssetError, "not PNG"):
            verify_png(html, {**media, "sizeBytes":len(html), "remoteSha1":hashlib.sha1(html).hexdigest()})
        with self.assertRaisesRegex(RuneIconAssetError, "dimensions"):
            verify_png(payload, {**media, "width":1})

    def test_redirect_host_path_and_traversal_rejection(self):
        urls = ["https://evil.example/Rune.png", "http://wiki.guildwars.com/images/f/fb/Rune_A.png",
                "https://wiki.guildwars.com/images/f/fb/../../Rune_A.png",
                "https://wiki.guildwars.com/images/f/fb/Rune_A.png?x=1",
                "https://wiki.guildwars.com/images/f/fb/%2e%2e/Rune_A.png",
                "https://wiki.guildwars.com@evil.example/images/f/fb/Rune_A.png"]
        handler = CheckedRedirect()
        for url in urls:
            with self.subTest(url=url), self.assertRaises(RuneIconAssetError):
                validate_url(url)
            with self.assertRaises(RuneIconAssetError):
                handler.redirect_request(Request("https://wiki.guildwars.com"), None, 302, "", {}, url)

    def prepare(self, root):
        (root / CATALOG).parent.mkdir(parents=True)
        shutil.copy(ROOT / CATALOG, root / CATALOG)
        shutil.copytree(ROOT / PUBLIC, root / "cache")

    def test_offline_replay_and_local_manifests(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            self.prepare(root)
            summary = cache_release(root, Path("cache"), generated_at="2026-09-14T02:07:00Z")
            self.assertEqual(summary, {"runeCount":126,"uniqueAssetCount":30})
            first = (root / RUNTIME).read_bytes()
            cache_release(root, Path("cache"), generated_at="2026-09-14T02:07:00Z")
            self.assertEqual(first, (root / RUNTIME).read_bytes())
            self.assertNotIn(b"https:", first)
            self.assertEqual(len(list((root / PUBLIC).glob("*.png"))), 30)
            with self.assertRaises(ArtifactError):
                cache_release(root, Path("../outside"))

    def test_publish_failure_restores_both_manifests_and_keeps_last_good_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            self.prepare(root)
            cache_release(root, Path("cache"), generated_at="2026-09-14T02:07:00Z")
            before = {p:(root/p).read_bytes() for p in (RUNTIME,PROVENANCE)}
            images = {p:p.read_bytes() for p in (root/PUBLIC).glob("*.png")}
            def failing_publish(path, payload):
                if path == root / RUNTIME:
                    raise OSError("injected runtime publication failure")
                atomic_write(path,payload)
            with self.assertRaisesRegex(OSError,"injected"):
                cache_release(root,Path("cache"),generated_at="2026-09-14T03:00:00Z",publish=failing_publish)
            for path,payload in before.items(): self.assertEqual(payload,(root/path).read_bytes())
            for path,payload in images.items(): self.assertEqual(payload,path.read_bytes())

    def test_incomplete_or_changed_bytes_never_publish_a_partial_release(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            self.prepare(root)
            next((root/"cache").glob("*.png")).write_bytes(b"bad")
            with self.assertRaises(RuneIconAssetError): cache_release(root,Path("cache"))
            self.assertFalse((root/RUNTIME).exists())
            self.assertFalse((root/PUBLIC).exists())


if __name__ == "__main__":
    unittest.main()
