from __future__ import annotations

import json
import math
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from build_wars_ingest.artifacts import (
    ArtifactError,
    canonical_json_bytes,
    classify_baseline_diff,
    compare_baseline,
    write_canonical_json,
    write_generated_artifact,
)


class ArtifactTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="bw_artifact_test_"))

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp)

    def test_canonical_json_has_key_order_unicode_and_lf(self) -> None:
        data = canonical_json_bytes({"z": "é", "a": 1})

        self.assertEqual(data, '{\n  "a": 1,\n  "z": "é"\n}\n'.encode("utf-8"))

    def test_non_finite_numbers_are_rejected(self) -> None:
        with self.assertRaisesRegex(ArtifactError, "NaN"):
            canonical_json_bytes({"bad": math.nan})

    def test_write_generated_artifact_sorts_inputs_and_records_digest(self) -> None:
        value = {"schemaVersion": 1, "records": [{"id": 2}, {"id": 1}]}

        artifact_path, manifest_path, manifest = write_generated_artifact(
            root=self.tmp,
            relative_path=Path("generated/out.json"),
            value=value,
            generated_at="2026-09-01T00:00:00Z",
            input_snapshot_manifest_paths=["b.json", "a.json"],
            source_ids=["source:b", "source:a"],
            record_count=2,
            qa_report_path="data/qa/out.qa.json",
        )

        self.assertTrue(artifact_path.exists())
        self.assertTrue(manifest_path.exists())
        self.assertEqual(manifest["inputSnapshotManifestPaths"], ["a.json", "b.json"])
        self.assertEqual(manifest["sourceIds"], ["source:a", "source:b"])
        self.assertEqual(manifest["digest"]["algorithm"], "sha256")

    def test_byte_identical_reruns_under_fixed_clock(self) -> None:
        kwargs = {
            "root": self.tmp,
            "relative_path": Path("generated/out.json"),
            "value": {"schemaVersion": 1, "records": [{"id": 1}]},
            "generated_at": "2026-09-01T00:00:00Z",
            "input_snapshot_manifest_paths": ["a.json"],
            "source_ids": ["source:a"],
            "record_count": 1,
            "qa_report_path": "data/qa/out.qa.json",
        }

        first_path, first_manifest_path, _ = write_generated_artifact(**kwargs)
        first = first_path.read_bytes()
        first_manifest = first_manifest_path.read_bytes()
        second_path, second_manifest_path, _ = write_generated_artifact(**kwargs)

        self.assertEqual(second_path.read_bytes(), first)
        self.assertEqual(second_manifest_path.read_bytes(), first_manifest)

    def test_changing_clock_is_explicit_in_manifest(self) -> None:
        first = write_generated_artifact(
            root=self.tmp,
            relative_path=Path("out.json"),
            value={"schemaVersion": 1, "records": []},
            generated_at="2026-09-01T00:00:00Z",
            input_snapshot_manifest_paths=[],
            source_ids=[],
            record_count=0,
            qa_report_path=None,
        )[2]
        second = write_generated_artifact(
            root=self.tmp,
            relative_path=Path("out.json"),
            value={"schemaVersion": 1, "records": []},
            generated_at="2026-09-01T00:01:00Z",
            input_snapshot_manifest_paths=[],
            source_ids=[],
            record_count=0,
            qa_report_path=None,
        )[2]

        self.assertNotEqual(first["generatedAt"], second["generatedAt"])

    def test_path_confinement_and_atomic_failure(self) -> None:
        with self.assertRaisesRegex(ArtifactError, "escapes"):
            write_canonical_json(self.tmp, Path("../outside.json"), {})

        target = self.tmp / "safe.json"
        target.write_text("old", encoding="utf-8")
        with mock.patch("build_wars_ingest.artifacts.os.replace", side_effect=RuntimeError("stop")):
            with self.assertRaisesRegex(RuntimeError, "stop"):
                write_canonical_json(self.tmp, Path("safe.json"), {"new": True})
        self.assertEqual(target.read_text(encoding="utf-8"), "old")

    def test_baseline_no_baseline_diff_and_schema_mismatch(self) -> None:
        current = {"schemaVersion": 1, "records": []}
        baseline = self.tmp / "baseline.json"
        baseline.write_text(json.dumps({"schemaVersion": 2, "records": []}), encoding="utf-8")

        self.assertEqual(compare_baseline(current, None, artifact_path="out.json")[0].code, "ARTIFACT_BASELINE_NOT_PROVIDED")
        self.assertEqual(
            compare_baseline(current, baseline, artifact_path="out.json")[0].code,
            "ARTIFACT_BASELINE_SCHEMA_MISMATCH",
        )
        baseline.write_text(json.dumps({"schemaVersion": 1, "records": [{"id": 1}]}), encoding="utf-8")
        self.assertEqual(compare_baseline(current, baseline, artifact_path="out.json")[0].code, "ARTIFACT_BASELINE_DIFF")

    def test_baseline_diff_classifier_distinguishes_first_semantic_and_provenance_changes(self) -> None:
        current = {
            "schemaVersion": 1,
            "catalogVersion": "pa-current",
            "generatedAt": "2026-09-01T00:00:00Z",
            "professions": [{"id": 1, "name": "Warrior", "provenance": {"sourceIds": ["source:new"]}}],
        }
        provenance_only = {
            **current,
            "catalogVersion": "pa-old",
            "generatedAt": "2026-08-31T00:00:00Z",
            "professions": [{"id": 1, "name": "Warrior", "provenance": {"sourceIds": ["source:old"]}}],
        }
        semantic = {**current, "professions": [{"id": 1, "name": "Warr"}]}

        self.assertEqual(classify_baseline_diff(current, None), "first-baseline")
        self.assertEqual(classify_baseline_diff(current, semantic), "semantic")
        self.assertEqual(classify_baseline_diff(current, provenance_only), "provenance-only")


if __name__ == "__main__":
    unittest.main()
