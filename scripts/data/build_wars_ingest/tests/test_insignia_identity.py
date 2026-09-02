from __future__ import annotations

import copy
import unittest

from build_wars_ingest.insignia_identity import (
    identity_for_source_key,
    load_identity_registry,
    registry_summary,
    validate_identity_registry_payload,
)


class InsigniaIdentityTests(unittest.TestCase):
    def test_registry_loads_schema_owned_ids_and_digest(self) -> None:
        registry = load_identity_registry()
        summary = registry_summary(registry)

        self.assertEqual(summary["registryVersion"], 1)
        self.assertEqual(summary["recordCount"], 45)
        self.assertEqual(identity_for_source_key(registry, "equipment-modifier:290"), 290)
        self.assertEqual(len(summary["digest"]), 64)

    def test_registry_detects_duplicate_active_ids_and_tombstone_reuse(self) -> None:
        registry = load_identity_registry()
        payload = copy.deepcopy(registry.payload)
        payload["records"][1]["id"] = payload["records"][0]["id"]
        payload["tombstones"].append({"id": payload["records"][0]["id"], "reason": "test"})

        codes = {diagnostic.code for diagnostic in validate_identity_registry_payload(payload)}

        self.assertIn("INSIGNIA_IDENTITY_DUPLICATE_ID", codes)
        self.assertIn("INSIGNIA_IDENTITY_REUSED_TOMBSTONE", codes)


if __name__ == "__main__":
    unittest.main()
