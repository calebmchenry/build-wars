from __future__ import annotations

import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from build_wars_ingest.models import source_reference
from build_wars_ingest.snapshots import (
    SnapshotError,
    SnapshotIdentity,
    SnapshotStore,
    safe_slug,
    snapshot_relative_path,
)


class SnapshotTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="bw_snapshot_test_"))
        self.store = SnapshotStore(self.tmp)
        self.source = source_reference(
            source_id="source:gww:fixture:1",
            name="Guild Wars Wiki",
            canonical_url="https://wiki.guildwars.com/wiki/Fixture",
            page_id=1,
            page_title="Fixture",
            revision_id=10,
            source_revision_timestamp="2026-08-31T00:00:00Z",
            retrieved_at="2026-09-01T00:00:00Z",
        )

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp)

    def test_safe_slug_handles_non_ascii_and_unsafe_titles(self) -> None:
        slug = safe_slug("../Äther Strike/?")

        self.assertNotIn("..", slug)
        self.assertRegex(slug, r"^[a-z0-9-]+$")

    def test_snapshot_paths_are_stable_and_digest_scoped(self) -> None:
        identity = SnapshotIdentity("guild-wars-wiki", "page", "Äther Strike/?", revision_id=123)

        path_one = snapshot_relative_path(identity, b"payload")
        path_two = snapshot_relative_path(identity, b"payload")
        path_three = snapshot_relative_path(identity, b"changed")

        self.assertEqual(path_one, path_two)
        self.assertNotEqual(path_one, path_three)
        self.assertNotIn("..", path_one.as_posix())

    def test_write_and_load_snapshot_verifies_digest(self) -> None:
        result = self.store.write_snapshot(
            identity=SnapshotIdentity("guild-wars-wiki", "page", "Fixture", page_id=1, revision_id=10),
            payload={"content": "fixture"},
            source_reference=self.source,
            retrieved_at="2026-09-01T00:00:00Z",
            source_revision_id=10,
            source_revision_timestamp="2026-08-31T00:00:00Z",
        )

        loaded = self.store.load_snapshot(result.manifest_path)

        self.assertEqual(json.loads(loaded.payload.decode("utf-8"))["content"], "fixture")
        self.assertEqual(loaded.manifest["rawPayloadPolicy"], "ignored")

    def test_identical_refetch_reuses_existing_snapshot(self) -> None:
        kwargs = {
            "identity": SnapshotIdentity("guild-wars-wiki", "page", "Fixture", page_id=1, revision_id=10),
            "payload": {"content": "fixture"},
            "source_reference": self.source,
            "retrieved_at": "2026-09-01T00:00:00Z",
            "source_revision_id": 10,
            "source_revision_timestamp": "2026-08-31T00:00:00Z",
        }
        first = self.store.write_snapshot(**kwargs)
        second = self.store.write_snapshot(**kwargs)

        self.assertEqual(first.artifact_path, second.artifact_path)
        self.assertTrue(second.reused_existing)

    def test_changed_revision_or_content_creates_new_identity(self) -> None:
        base = self.store.write_snapshot(
            identity=SnapshotIdentity("guild-wars-wiki", "page", "Fixture", page_id=1, revision_id=10),
            payload={"content": "fixture"},
            source_reference=self.source,
            retrieved_at="2026-09-01T00:00:00Z",
            source_revision_id=10,
            source_revision_timestamp="2026-08-31T00:00:00Z",
        )
        changed = self.store.write_snapshot(
            identity=SnapshotIdentity("guild-wars-wiki", "page", "Fixture", page_id=1, revision_id=11),
            payload={"content": "changed"},
            source_reference={**self.source, "revisionId": 11},
            retrieved_at="2026-09-01T00:00:00Z",
            source_revision_id=11,
            source_revision_timestamp="2026-08-31T00:01:00Z",
        )

        self.assertNotEqual(base.artifact_path, changed.artifact_path)

    def test_identity_collision_does_not_overwrite_evidence(self) -> None:
        fixed = Path("fixed/collision.json")
        first = self.store.write_snapshot(
            identity=SnapshotIdentity("guild-wars-wiki", "page", "Fixture", page_id=1, revision_id=10),
            payload=b"first",
            source_reference=self.source,
            retrieved_at="2026-09-01T00:00:00Z",
            source_revision_id=10,
            source_revision_timestamp="2026-08-31T00:00:00Z",
        )
        first.artifact_path.write_bytes(b"first")

        with mock.patch("build_wars_ingest.snapshots.snapshot_relative_path", return_value=fixed):
            (self.tmp / fixed).parent.mkdir(parents=True)
            (self.tmp / fixed).write_bytes(b"original evidence")
            with self.assertRaisesRegex(SnapshotError, "collision"):
                self.store.write_snapshot(
                    identity=SnapshotIdentity("guild-wars-wiki", "page", "Fixture", page_id=1, revision_id=10),
                    payload=b"different evidence",
                    source_reference=self.source,
                    retrieved_at="2026-09-01T00:00:00Z",
                    source_revision_id=10,
                    source_revision_timestamp="2026-08-31T00:00:00Z",
                )

    def test_digest_mismatch_is_non_waivable(self) -> None:
        result = self.store.write_snapshot(
            identity=SnapshotIdentity("guild-wars-wiki", "page", "Fixture", page_id=1, revision_id=10),
            payload=b"before",
            source_reference=self.source,
            retrieved_at="2026-09-01T00:00:00Z",
            source_revision_id=10,
            source_revision_timestamp="2026-08-31T00:00:00Z",
        )
        result.artifact_path.write_bytes(b"after")

        with self.assertRaises(SnapshotError) as caught:
            self.store.load_snapshot(result.manifest_path)

        self.assertEqual(caught.exception.diagnostics[0].code, "SNAPSHOT_DIGEST_MISMATCH")
        self.assertEqual(caught.exception.diagnostics[0].disposition, "non-waivable")

    def test_path_traversal_and_symlink_escapes_are_rejected(self) -> None:
        with self.assertRaisesRegex(SnapshotError, "escapes"):
            self.store.load_snapshot(Path("../outside.manifest.json"))

        outside = Path(tempfile.mkdtemp(prefix="bw_snapshot_outside_"))
        try:
            link = self.tmp / "link"
            link.symlink_to(outside, target_is_directory=True)
            with self.assertRaises(SnapshotError):
                self.store._child_path(Path("link/file.json"))
        finally:
            shutil.rmtree(outside)

    def test_missing_revision_facts_emit_diagnostics_after_write(self) -> None:
        with self.assertRaises(SnapshotError) as caught:
            self.store.write_snapshot(
                identity=SnapshotIdentity("guild-wars-wiki", "page", "Fixture"),
                payload=b"payload",
                source_reference={**self.source, "revisionId": None},
                retrieved_at="2026-09-01T00:00:00Z",
                source_revision_id=None,
                source_revision_timestamp=None,
            )

        self.assertEqual(
            [diagnostic.code for diagnostic in caught.exception.diagnostics],
            ["SNAPSHOT_MISSING_REVISION_ID", "SNAPSHOT_MISSING_REVISION_TIMESTAMP"],
        )

    def test_interrupted_atomic_write_preserves_existing_file(self) -> None:
        target = self.tmp / "atomic.txt"
        target.write_text("old", encoding="utf-8")

        with mock.patch("build_wars_ingest.snapshots.os.replace", side_effect=RuntimeError("stop")):
            with self.assertRaisesRegex(RuntimeError, "stop"):
                self.store._atomic_write(target, b"new")

        self.assertEqual(target.read_text(encoding="utf-8"), "old")
        self.assertEqual(list(self.tmp.glob(".atomic.txt.*.tmp")), [])


if __name__ == "__main__":
    unittest.main()
