#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import json
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("ticket-burn.py")
SPEC = importlib.util.spec_from_file_location("ticket_burn", SCRIPT_PATH)
assert SPEC is not None and SPEC.loader is not None
ticket_burn = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = ticket_burn
SPEC.loader.exec_module(ticket_burn)


class TicketBurnTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="ticket_burn_test_"))
        (self.tmp / "work/tickets").mkdir(parents=True)
        (self.tmp / "work/sprints").mkdir(parents=True)
        self.target = ticket_burn.TicketTarget(
            id="BACKLOG",
            title="Backlog",
            ticket_dir=self.tmp / "work/tickets",
        )

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp)

    def test_parses_multiline_frontmatter_lists(self) -> None:
        epic = self._write_epic("EPIC-02", "backlog", depends_on=["EPIC-00", "EPIC-01"])

        self.assertEqual(epic.depends_on, ["EPIC-00", "EPIC-01"])

    def test_discovers_burnable_epics_in_number_order(self) -> None:
        self._write_epic("EPIC-03", "ready")
        self._write_epic("EPIC-01", "done")
        self._write_epic("EPIC-02", "in-progress")
        self._write_epic("EPIC-04", "blocked")
        self._write_epic("EPIC-05", "archived")

        epics = ticket_burn.discover_epics(self.tmp, self.target)

        self.assertEqual([epic.id for epic in epics], ["EPIC-02", "EPIC-03"])

    def test_dependency_gate_waits_for_open_dependencies(self) -> None:
        self._write_epic("EPIC-00", "backlog")
        self._write_epic("EPIC-01", "backlog", depends_on=["EPIC-00"])

        epics = ticket_burn.discover_epics(self.tmp, self.target)

        self.assertEqual([epic.id for epic in epics], ["EPIC-00"])

    def test_dependency_gate_allows_done_dependencies(self) -> None:
        self._write_epic("EPIC-00", "done")
        self._write_epic("EPIC-01", "backlog", depends_on=["EPIC-00"])

        epics = ticket_burn.discover_epics(self.tmp, self.target)

        self.assertEqual([epic.id for epic in epics], ["EPIC-01"])

    def test_ignore_dependencies_allows_targeted_epic(self) -> None:
        self._write_epic("EPIC-00", "backlog")
        self._write_epic("EPIC-01", "backlog", depends_on=["EPIC-00"])
        target = ticket_burn.TicketTarget(
            id="EPIC-01",
            title="One",
            ticket_dir=self.tmp / "work/tickets",
            only_epic="EPIC-01",
        )

        epics = ticket_burn.discover_epics(self.tmp, target, ignore_dependencies=True)

        self.assertEqual([epic.id for epic in epics], ["EPIC-01"])

    def test_include_blocked_allows_blocked_epics(self) -> None:
        self._write_epic("EPIC-00", "blocked")

        epics = ticket_burn.discover_epics(self.tmp, self.target, include_blocked=True)

        self.assertEqual([epic.id for epic in epics], ["EPIC-00"])

    def test_through_epic_filters_later_epics(self) -> None:
        self._write_epic("EPIC-01", "ready")
        self._write_epic("EPIC-02", "ready")
        self._write_epic("EPIC-03", "ready")
        self._write_epic("EPIC-04", "ready")
        target = ticket_burn.TicketTarget(
            id="BACKLOG",
            title="Backlog",
            ticket_dir=self.tmp / "work/tickets",
            through_epic="EPIC-03",
        )

        epics = ticket_burn.discover_epics(self.tmp, target)

        self.assertEqual([epic.id for epic in epics], ["EPIC-01", "EPIC-02", "EPIC-03"])

    def test_through_epic_completion_ignores_later_open_epics(self) -> None:
        self._write_epic("EPIC-01", "done")
        self._write_epic("EPIC-02", "ready")
        target = ticket_burn.TicketTarget(
            id="BACKLOG",
            title="Backlog",
            ticket_dir=self.tmp / "work/tickets",
            through_epic="EPIC-01",
        )

        self.assertEqual(ticket_burn.discover_epics(self.tmp, target), [])
        self.assertEqual(ticket_burn.open_target_epics(self.tmp, target), [])

    def test_active_sprints_reads_in_progress_rows(self) -> None:
        ledger = self.tmp / "work/sprints/ledger.tsv"
        ledger.write_text(
            "sprint_id\ttitle\tstatus\tupdated_at\n"
            "001\tOne\tcompleted\t2026-01-01T00:00:00Z\n"
            "002\tTwo\tin_progress\t2026-01-02T00:00:00Z\n"
            "SPRINT-003\tThree\tin-progress\t2026-01-03T00:00:00Z\n",
            encoding="utf-8",
        )

        self.assertEqual(ticket_burn.active_sprints(self.tmp), ["SPRINT-002", "SPRINT-003"])

    def test_plan_prompt_contains_machine_readable_contract(self) -> None:
        epic = self._write_epic("EPIC-07", "ready")
        prompt = ticket_burn.build_plan_prompt(
            epic=epic,
            target=self.target,
            manifest_path=self.tmp / "work/runs/ticket-burn/BACKLOG/run/plan-EPIC-07-result.json",
            sprint_dir=self.tmp / "work/sprints",
        )

        self.assertIn("$sprint-plan-codex-only create a sprint", prompt)
        self.assertIn("mode: ticket-burn", prompt)
        self.assertIn("ticket_statuses: backlog, ready, in-progress, blocked, done", prompt)
        self.assertIn('"status": "planned" | "blocked"', prompt)
        self.assertIn("plan-EPIC-07-result.json", prompt)
        self.assertIn("do_not_modify_code: true", prompt)

    def test_default_codex_command_uses_current_non_interactive_flag(self) -> None:
        self.assertNotIn("--full-auto", ticket_burn.DEFAULT_CODEX_CMD)
        self.assertIn("--dangerously-bypass-approvals-and-sandbox", ticket_burn.DEFAULT_CODEX_CMD)

    def test_default_runner_validation_is_empty_for_unscaffolded_repo(self) -> None:
        self.assertEqual(ticket_burn.DEFAULT_VALIDATION_COMMANDS, ())

    def test_execute_prompt_disables_child_commits(self) -> None:
        epic = self._write_epic("EPIC-08", "ready")
        prompt = ticket_burn.build_execute_prompt(
            sprint_path=self.tmp / "work/sprints/SPRINT-009.md",
            sprint_id="SPRINT-009",
            epic=epic,
            target=self.target,
            manifest_path=self.tmp / "work/runs/ticket-burn/BACKLOG/run/execute-SPRINT-009-result.json",
            strategy="orchestrated",
        )

        self.assertIn("$sprint-execute implement", prompt)
        self.assertIn("commits: false", prompt)
        self.assertIn("outer_runner_owns_git: true", prompt)
        self.assertIn("update_ticket_status_when_done: true", prompt)
        self.assertIn('"status": "completed" | "blocked" | "failed"', prompt)

    def test_read_manifest_rejects_blocked_status(self) -> None:
        path = self.tmp / "manifest.json"
        path.write_text(json.dumps({"status": "blocked", "blocked_reason": "needs human"}), encoding="utf-8")

        with self.assertRaisesRegex(ticket_burn.BurnError, "needs human"):
            ticket_burn.read_manifest(path, {"planned"})

    def test_read_manifest_reports_failed_validation_details(self) -> None:
        path = self.tmp / "manifest.json"
        path.write_text(
            json.dumps(
                {
                    "status": "failed",
                    "validation": [
                        {"command": "unit", "status": "passed"},
                        {"command": "integration", "status": "failed"},
                    ],
                }
            ),
            encoding="utf-8",
        )

        with self.assertRaisesRegex(ticket_burn.BurnError, "integration"):
            ticket_burn.read_manifest(path, {"completed"})

    def test_manifest_rejection_reason_falls_back_to_followups(self) -> None:
        reason = ticket_burn.manifest_rejection_reason(
            {"status": "failed", "blocked_reason": None, "validation": [], "followups": ["rerun full suite"]}
        )

        self.assertEqual(reason, "followups: rerun full suite")

    def test_unchecked_task_items_ignore_code_fences(self) -> None:
        path = self.tmp / "work/sprints/SPRINT-001.md"
        path.write_text(
            "# Sprint 001\n\n"
            "- [x] done\n"
            "- [ ] real work\n"
            "```md\n"
            "- [ ] example only\n"
            "```\n",
            encoding="utf-8",
        )

        self.assertEqual(ticket_burn.unchecked_task_items(path), [(4, "- [ ] real work")])

    def test_completed_sprint_checklist_rejects_unchecked_items(self) -> None:
        path = self.tmp / "work/sprints/SPRINT-001.md"
        path.write_text("# Sprint 001\n\n- [ ] unfinished\n", encoding="utf-8")

        with self.assertRaisesRegex(ticket_burn.BurnError, "unchecked task item"):
            ticket_burn.verify_completed_sprint_checklist(path, allow_unchecked=False)

        with redirect_stdout(StringIO()):
            ticket_burn.verify_completed_sprint_checklist(path, allow_unchecked=True)

    def test_update_issue_doc_done_marks_status(self) -> None:
        path = self._write_epic("EPIC-00", "ready").path

        changed = ticket_burn.update_issue_doc_done(path)

        self.assertTrue(changed)
        doc = ticket_burn.read_ticket_doc(path)
        self.assertEqual(doc.status, "done")
        self.assertIn("updated:", doc.path.read_text(encoding="utf-8"))

    def test_resolve_target_accepts_epic_id(self) -> None:
        self._write_epic("EPIC-00", "backlog", title="Foundation")

        target = ticket_burn.resolve_target(self.tmp, "EPIC-00", None)

        self.assertEqual(target.id, "EPIC-00")
        self.assertEqual(target.title, "Foundation")
        self.assertEqual(target.only_epic, "EPIC-00")

    def test_resolve_target_rejects_target_after_through_epic(self) -> None:
        self._write_epic("EPIC-07", "backlog")
        self._write_epic("EPIC-08", "backlog")

        with self.assertRaisesRegex(ticket_burn.BurnError, "after --through-epic"):
            ticket_burn.resolve_target(self.tmp, "EPIC-08", None, "EPIC-07")

    def _write_epic(
        self,
        epic_id: str,
        status: str,
        *,
        title: str | None = None,
        depends_on: list[str] | None = None,
    ) -> object:
        number = int(epic_id.split("-")[1])
        path = self.tmp / "work/tickets" / f"{number:02d}-demo" / "EPIC.md"
        frontmatter: dict[str, object] = {
            "id": epic_id,
            "title": title or f"{epic_id} Demo",
            "track": "functional",
            "status": status,
            "priority": "normal",
            "depends_on": depends_on or [],
        }
        self._write_issue(path, frontmatter, f"# {epic_id}: Demo\n")
        return ticket_burn.read_ticket_doc(path)

    def _write_issue(self, path: Path, frontmatter: dict[str, object], body: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        lines = ["---"]
        for key, value in frontmatter.items():
            if isinstance(value, list):
                if value:
                    lines.append(f"{key}:")
                    for item in value:
                        lines.append(f"  - {item}")
                else:
                    lines.append(f"{key}: []")
            else:
                lines.append(f"{key}: {value}")
        lines.append("---")
        lines.append("")
        lines.append(body)
        path.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
