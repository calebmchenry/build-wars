from __future__ import annotations

import contextlib
import io
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from build_wars_ingest.cli import main

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class CliTests(unittest.TestCase):
    def test_fixture_command_prints_summary(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_cli_test_"))
        stdout = io.StringIO()
        try:
            with contextlib.redirect_stdout(stdout):
                exit_code = main(["fixture", "--root", str(tmp), "--fixture-root", str(FIXTURE_ROOT)])

            self.assertEqual(exit_code, 0)
            output = stdout.getvalue()
            self.assertIn("records: 3", output)
            self.assertIn("qaReport:", output)
        finally:
            shutil.rmtree(tmp)

    def test_epic03_fixture_profile_command_prints_catalog_summary(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_cli_epic03_test_"))
        stdout = io.StringIO()
        try:
            with contextlib.redirect_stdout(stdout):
                exit_code = main(
                    [
                        "fixture",
                        "--profile",
                        "epic-03-professions-attributes",
                        "--root",
                        str(tmp),
                        "--fixture-root",
                        str(FIXTURE_ROOT),
                    ]
                )

            self.assertEqual(exit_code, 0)
            output = stdout.getvalue()
            self.assertIn("records: 52", output)
            self.assertIn("professions-attributes.catalog.qa.json", output)
        finally:
            shutil.rmtree(tmp)

    def test_live_mode_requires_explicit_network_intent_and_title(self) -> None:
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            with self.assertRaises(SystemExit):
                main(["live"])
            with self.assertRaises(SystemExit):
                main(["live", "--allow-live-network"])

    def test_blocking_baseline_mismatch_writes_qa_report_before_nonzero_exit(self) -> None:
        tmp = Path(tempfile.mkdtemp(prefix="bw_cli_block_test_"))
        baseline = tmp / "baseline.json"
        baseline.write_text(json.dumps({"schemaVersion": 2, "records": []}), encoding="utf-8")
        stdout = io.StringIO()
        try:
            with contextlib.redirect_stdout(stdout):
                exit_code = main(
                    [
                        "fixture",
                        "--root",
                        str(tmp),
                        "--fixture-root",
                        str(FIXTURE_ROOT),
                        "--baseline",
                        str(baseline),
                    ]
                )

            self.assertEqual(exit_code, 2)
            self.assertTrue((tmp / "data/qa/epic-02/skill-id-map.fixture.qa.json").exists())
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
