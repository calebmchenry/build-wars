from __future__ import annotations

import unittest
from pathlib import Path

from build_wars_ingest.source_set_protocol import (
    SourceSetProtocolError,
    confined_child_path,
    digest_canonical_value,
    require_matching_digest,
    require_unique_values,
)


class SourceSetProtocolTests(unittest.TestCase):
    def test_digest_confirmation_and_unique_values_are_deterministic(self) -> None:
        digest = digest_canonical_value({"b": 2, "a": 1})

        require_matching_digest(label="test", actual=digest, expected=digest)
        self.assertEqual(digest, digest_canonical_value({"a": 1, "b": 2}))
        require_unique_values(["a", "b"], label="values")

        with self.assertRaisesRegex(SourceSetProtocolError, "did not match"):
            require_matching_digest(label="test", actual=digest, expected="bad")
        with self.assertRaisesRegex(SourceSetProtocolError, "duplicate"):
            require_unique_values(["a", "a"], label="values")

    def test_confined_child_path_rejects_escaping_paths(self) -> None:
        root = Path("data/source-snapshots")

        self.assertTrue(confined_child_path(root, "child.manifest.json").as_posix().endswith("child.manifest.json"))
        with self.assertRaisesRegex(SourceSetProtocolError, "escapes"):
            confined_child_path(root, "../outside.manifest.json")


if __name__ == "__main__":
    unittest.main()
