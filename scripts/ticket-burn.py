#!/usr/bin/env python3
"""Run a ticket-level sprint planning/execution burn-down loop."""

from __future__ import annotations

import argparse
import json
import os
import re
import shlex
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


FORMAT_VERSION = 1
DEFAULT_CODEX_CMD = "codex exec --dangerously-bypass-approvals-and-sandbox"
DEFAULT_VALIDATION_COMMANDS: tuple[str, ...] = ()
DEFAULT_TICKET_DIR = Path("work/tickets")
DEFAULT_SPRINT_DIR = Path("work/sprints")
DEFAULT_RUNS_DIR = Path("work/runs/ticket-burn")

TERMINAL_STATUSES = {"done", "archived"}
BURNABLE_STATUSES = {"backlog", "ready", "in-progress"}
KNOWN_STATUSES = BURNABLE_STATUSES | TERMINAL_STATUSES | {"blocked"}

EPIC_ID_RE = re.compile(r"\bEPIC-\d+\b")
ISSUE_ID_RE = re.compile(r"\b(?:EPIC-\d+|BW-\d+)\b")


class BurnError(RuntimeError):
    pass


@dataclass(frozen=True)
class TicketDoc:
    path: Path
    frontmatter: dict[str, Any]
    body: str

    @property
    def id(self) -> str:
        value = str(self.frontmatter.get("id", "")).strip()
        if value:
            return value
        match = ISSUE_ID_RE.search(self.path.name)
        if match:
            return match.group(0)
        raise BurnError(f"cannot infer ticket id from {self.path}")

    @property
    def title(self) -> str:
        value = str(self.frontmatter.get("title", "")).strip()
        if value:
            return value
        for line in self.body.splitlines():
            if line.startswith("# "):
                return line[2:].strip()
        return self.id

    @property
    def status(self) -> str:
        return normalize_status(str(self.frontmatter.get("status", "")).strip())

    @property
    def depends_on(self) -> list[str]:
        value = self.frontmatter.get("depends_on", [])
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []


@dataclass(frozen=True)
class TicketTarget:
    id: str
    title: str
    ticket_dir: Path
    only_epic: str | None = None
    target_path: Path | None = None
    through_epic: str | None = None


@dataclass(frozen=True)
class RunPaths:
    root: Path
    run_dir: Path
    state_path: Path
    summary_path: Path


@dataclass(frozen=True)
class ChildResult:
    returncode: int
    elapsed_seconds: int
    log_path: Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def local_hms() -> str:
    return datetime.now().strftime("%H:%M:%S")


def local_date() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def emit(message: str) -> None:
    print(f"[{local_hms()}] {message}", flush=True)


def normalize_status(status: str) -> str:
    return status.strip().lower().replace("_", "-")


def read_ticket_doc(path: Path) -> TicketDoc:
    if not path.is_file():
        raise BurnError(f"ticket doc not found: {path}")
    text = path.read_text(encoding="utf-8")
    frontmatter: dict[str, Any] = {}
    body = text
    if text.startswith("---\n"):
        end = text.find("\n---", 4)
        if end == -1:
            raise BurnError(f"unterminated front matter: {path}")
        raw_frontmatter = text[4:end]
        body = text[end + len("\n---") :].lstrip("\n")
        frontmatter = parse_frontmatter(raw_frontmatter)
    return TicketDoc(path=path, frontmatter=frontmatter, body=body)


def parse_frontmatter(raw: str) -> dict[str, Any]:
    result: dict[str, Any] = {}
    lines = raw.splitlines()
    index = 0
    while index < len(lines):
        line = lines[index]
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or line[:1].isspace():
            index += 1
            continue
        if ":" not in line:
            index += 1
            continue

        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if value:
            result[key] = parse_frontmatter_value(value)
            index += 1
            continue

        items: list[Any] = []
        index += 1
        while index < len(lines):
            item_line = lines[index]
            item_stripped = item_line.strip()
            if not item_stripped or item_stripped.startswith("#"):
                index += 1
                continue
            if not item_line[:1].isspace():
                break
            if item_stripped.startswith("- "):
                items.append(parse_frontmatter_value(item_stripped[2:].strip()))
            index += 1
        result[key] = items if items else ""
    return result


def parse_frontmatter_value(value: str) -> Any:
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [strip_quotes(part.strip()) for part in inner.split(",") if part.strip()]
    return strip_quotes(value)


def strip_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def all_epics(root: Path, ticket_dir: Path) -> list[TicketDoc]:
    epic_dir = normalize_repo_path(root, ticket_dir.as_posix())
    if not epic_dir.is_dir():
        raise BurnError(f"ticket directory not found: {epic_dir}")
    epics = [read_ticket_doc(path) for path in sorted(epic_dir.glob("*/EPIC.md"))]
    for epic in epics:
        if not EPIC_ID_RE.fullmatch(epic.id):
            raise BurnError(f"expected EPIC-NN id in {epic.path}, got {epic.id!r}")
    return sorted(epics, key=lambda doc: issue_number(doc.id))


def find_epic(root: Path, ticket_dir: Path, epic_id: str) -> TicketDoc:
    for epic in all_epics(root, ticket_dir):
        if epic.id == epic_id:
            return epic
    raise BurnError(f"epic not found in {repo_relative(ticket_dir)}: {epic_id}")


def resolve_target(
    root: Path,
    target_value: str | None,
    only_epic: str | None,
    through_epic: str | None = None,
) -> TicketTarget:
    ticket_dir = root / DEFAULT_TICKET_DIR
    target = target_value.strip() if target_value else ""
    target_path: Path | None = None
    target_epic: str | None = None
    through_epic_id = through_epic.strip() if through_epic else None
    title = "Build Wars Ticket Backlog"
    target_id = "BACKLOG"

    if target:
        if EPIC_ID_RE.fullmatch(target):
            epic = find_epic(root, ticket_dir, target)
            target_epic = epic.id
            target_path = epic.path
            target_id = epic.id
            title = epic.title
        else:
            candidate = Path(target)
            if not candidate.is_absolute():
                candidate = root / candidate
            candidate = candidate.resolve()
            if candidate.is_dir() and (candidate / "EPIC.md").is_file():
                epic = read_ticket_doc(candidate / "EPIC.md")
                target_epic = epic.id
                target_path = epic.path
                target_id = epic.id
                title = epic.title
            elif candidate.is_file():
                doc = read_ticket_doc(candidate)
                if not EPIC_ID_RE.fullmatch(doc.id):
                    raise BurnError("ticket-burn currently targets the backlog or an EPIC.md file")
                target_epic = doc.id
                target_path = doc.path
                target_id = doc.id
                title = doc.title
            elif candidate.is_dir():
                ticket_dir = candidate
            else:
                raise BurnError(f"target not found: {target}")

    if only_epic:
        if not EPIC_ID_RE.fullmatch(only_epic):
            raise BurnError(f"--epic must be an EPIC-NN id, got {only_epic!r}")
        epic = find_epic(root, ticket_dir, only_epic)
        if target_epic and target_epic != epic.id:
            raise BurnError(f"target is {target_epic}, but --epic requested {epic.id}")
        target_epic = epic.id
        target_path = epic.path
        target_id = epic.id
        title = epic.title

    if through_epic_id:
        if not EPIC_ID_RE.fullmatch(through_epic_id):
            raise BurnError(f"--through-epic must be an EPIC-NN id, got {through_epic_id!r}")
        find_epic(root, ticket_dir, through_epic_id)
        if target_epic and issue_number(target_epic) > issue_number(through_epic_id):
            raise BurnError(f"target {target_epic} is after --through-epic {through_epic_id}")

    return TicketTarget(
        id=target_id,
        title=title,
        ticket_dir=ticket_dir.resolve(),
        only_epic=target_epic,
        target_path=target_path,
        through_epic=through_epic_id,
    )


def discover_epics(
    root: Path,
    target: TicketTarget,
    *,
    include_blocked: bool = False,
    ignore_dependencies: bool = False,
) -> list[TicketDoc]:
    epics = all_epics(root, target.ticket_dir)
    epic_by_id = {epic.id: epic for epic in epics}
    selected: list[TicketDoc] = []
    for epic in epics:
        if not target_selects_epic(target, epic):
            continue
        status = epic.status
        if not status:
            raise BurnError(f"{epic.id} has no status")
        if status not in KNOWN_STATUSES:
            raise BurnError(f"{epic.id} has unsupported automation status {status!r}")
        if status in TERMINAL_STATUSES:
            continue
        if status == "blocked" and not include_blocked:
            continue
        if status not in BURNABLE_STATUSES and not (include_blocked and status == "blocked"):
            continue
        if not ignore_dependencies and dependency_blockers(epic, epic_by_id):
            continue
        selected.append(epic)
    return sorted(selected, key=lambda doc: issue_number(doc.id))


def open_target_epics(root: Path, target: TicketTarget) -> list[TicketDoc]:
    epics = all_epics(root, target.ticket_dir)
    return [
        epic
        for epic in epics
        if target_selects_epic(target, epic) and epic.status not in TERMINAL_STATUSES
    ]


def target_includes_epic(target: TicketTarget, epic: TicketDoc) -> bool:
    return not target.through_epic or issue_number(epic.id) <= issue_number(target.through_epic)


def target_selects_epic(target: TicketTarget, epic: TicketDoc) -> bool:
    return target_includes_epic(target, epic) and (
        not target.only_epic or epic.id == target.only_epic
    )


def dependency_blockers(epic: TicketDoc, epic_by_id: dict[str, TicketDoc]) -> list[str]:
    blockers: list[str] = []
    for dep_id in epic.depends_on:
        dependency = epic_by_id.get(dep_id)
        if dependency is None:
            blockers.append(f"{dep_id}:missing")
        elif dependency.status not in TERMINAL_STATUSES:
            blockers.append(f"{dep_id}:{dependency.status or 'missing-status'}")
    return blockers


def no_eligible_reason(
    root: Path,
    target: TicketTarget,
    *,
    include_blocked: bool,
    ignore_dependencies: bool,
) -> str:
    epics = all_epics(root, target.ticket_dir)
    epic_by_id = {epic.id: epic for epic in epics}
    blockers: list[str] = []
    for epic in epics:
        if not target_selects_epic(target, epic):
            continue
        if epic.status in TERMINAL_STATUSES:
            continue
        status = epic.status or "missing-status"
        if status == "blocked" and not include_blocked:
            blockers.append(f"{epic.id}:blocked")
            continue
        if status not in BURNABLE_STATUSES and not (include_blocked and status == "blocked"):
            blockers.append(f"{epic.id}:{status}")
            continue
        if not ignore_dependencies:
            deps = dependency_blockers(epic, epic_by_id)
            if deps:
                blockers.append(f"{epic.id} waits on {', '.join(deps)}")
    if not blockers:
        return "no open epics remain"
    return "no eligible epics: " + "; ".join(blockers[:6])


def issue_number(issue_id: str) -> int:
    match = re.search(r"-(\d+)$", issue_id)
    if not match:
        return 0
    return int(match.group(1))


def active_sprints(root: Path) -> list[str]:
    ledger = root / DEFAULT_SPRINT_DIR / "ledger.tsv"
    if not ledger.is_file():
        return []
    active: list[str] = []
    for index, line in enumerate(ledger.read_text(encoding="utf-8").splitlines()):
        if index == 0 or not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        sprint_id, _title, status = parts[:3]
        if normalize_status(status) == "in-progress":
            active.append(normalize_sprint_id(sprint_id))
    return active


def normalize_sprint_id(value: str) -> str:
    value = value.strip()
    match = re.search(r"\d+", value)
    if not match:
        return value
    return f"SPRINT-{int(match.group(0)):03d}"


def git_porcelain(root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        raise BurnError(f"git status failed: {result.stderr.strip()}")
    return [line for line in result.stdout.splitlines() if line.strip()]


def ensure_preflight(root: Path, *, allow_dirty: bool, allow_active_sprint: bool) -> None:
    dirty = git_porcelain(root)
    if dirty and not allow_dirty:
        raise BurnError(
            "git tree is dirty; commit/stash current work or pass --allow-dirty "
            f"({len(dirty)} changed path(s))"
        )
    active = active_sprints(root)
    if active and not allow_active_sprint:
        raise BurnError(
            "sprint ledger already has active sprint(s): "
            + ", ".join(active)
            + "; complete them or pass --allow-active-sprint"
        )
    if dirty:
        emit(f"preflight: continuing with dirty tree by request ({len(dirty)} changed path(s))")
    if active:
        emit(f"preflight: continuing with active sprint by request ({', '.join(active)})")
    if not dirty and not active:
        emit("preflight: clean git tree, no active sprint")


def create_run_paths(root: Path, target_id: str, *, resume: bool) -> RunPaths:
    runs_root = root / DEFAULT_RUNS_DIR / safe_path_component(target_id)
    runs_root.mkdir(parents=True, exist_ok=True)
    if resume:
        run_dir = latest_run_dir(runs_root)
        if run_dir is None:
            raise BurnError(f"no previous run found for {target_id}")
    else:
        run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        run_dir = runs_root / run_id
        suffix = 1
        while run_dir.exists():
            suffix += 1
            run_dir = runs_root / f"{run_id}-{suffix}"
        run_dir.mkdir(parents=True)
        update_latest_link(runs_root, run_dir)
    return RunPaths(
        root=runs_root,
        run_dir=run_dir,
        state_path=run_dir / "run.json",
        summary_path=run_dir / "summary.md",
    )


def safe_path_component(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip("-") or "target"


def latest_run_dir(runs_root: Path) -> Path | None:
    latest = runs_root / "latest"
    if latest.exists():
        resolved = latest.resolve()
        if resolved.is_dir():
            return resolved
    candidates = sorted(path for path in runs_root.iterdir() if path.is_dir() and path.name != "latest")
    if not candidates:
        return None
    return candidates[-1]


def update_latest_link(runs_root: Path, run_dir: Path) -> None:
    latest = runs_root / "latest"
    try:
        if latest.exists() or latest.is_symlink():
            latest.unlink()
        latest.symlink_to(run_dir.name, target_is_directory=True)
    except OSError:
        atomic_write_text(runs_root / "latest.txt", run_dir.name + "\n")


def new_state(target: TicketTarget, run_paths: RunPaths) -> dict[str, Any]:
    return {
        "format": FORMAT_VERSION,
        "status": "running",
        "phase": "created",
        "target": target.id,
        "target_title": target.title,
        "target_path": repo_relative(target.target_path).as_posix() if target.target_path else None,
        "through_epic": target.through_epic,
        "ticket_dir": repo_relative(target.ticket_dir).as_posix(),
        "sprint_dir": DEFAULT_SPRINT_DIR.as_posix(),
        "run_dir": repo_relative(run_paths.run_dir).as_posix(),
        "created_at": utc_now(),
        "updated_at": utc_now(),
        "current_epic": None,
        "current_sprint": None,
        "completed_epics": [],
        "steps": [],
        "last_event": "created run",
    }


def load_state(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise BurnError(f"run state not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_state(path: Path, state: dict[str, Any]) -> None:
    state["updated_at"] = utc_now()
    atomic_write_text(path, json.dumps(state, indent=2, sort_keys=True) + "\n")


def event(state: dict[str, Any], message: str) -> None:
    state["last_event"] = message


def find_step(state: dict[str, Any], epic_id: str, sprint_id: str | None = None) -> dict[str, Any] | None:
    for step in reversed(state.get("steps", [])):
        if step.get("epic") != epic_id:
            continue
        if sprint_id is not None and step.get("sprint") != sprint_id:
            continue
        return step
    return None


def ensure_step(state: dict[str, Any], epic: TicketDoc) -> dict[str, Any]:
    step = find_step(state, epic.id)
    if step is not None and step.get("state") not in {"committed", "completed"}:
        return step
    step = {
        "epic": epic.id,
        "epic_path": repo_relative(epic.path).as_posix(),
        "sprint": None,
        "state": "created",
        "plan_manifest": None,
        "execute_manifest": None,
        "commit": None,
    }
    state.setdefault("steps", []).append(step)
    return step


def repo_relative(path: Path | None) -> Path:
    if path is None:
        return Path("")
    root = repo_root()
    resolved = path.resolve()
    try:
        return resolved.relative_to(root)
    except ValueError:
        return path


def build_plan_prompt(
    *,
    epic: TicketDoc,
    target: TicketTarget,
    manifest_path: Path,
    sprint_dir: Path,
) -> str:
    epic_rel = repo_relative(epic.path).as_posix()
    manifest_rel = repo_relative(manifest_path).as_posix()
    sprint_dir_rel = repo_relative(sprint_dir).as_posix()
    ticket_dir_rel = repo_relative(target.ticket_dir).as_posix()
    return f"""$sprint-plan-codex-only create a sprint from {epic_rel}

Automation contract:
- mode: ticket-burn
- non_interactive: true
- ticket_dir: {ticket_dir_rel}
- sprint_dir: {sprint_dir_rel}
- source_target: {target.id}
- source_epic: {epic.id}
- source_epic_path: {epic_rel}
- ticket_statuses: backlog, ready, in-progress, blocked, done
- interview_policy: skip unless there is a high-risk architecture choice; if skipped, proceed with best judgment and record assumptions
- final_approval_policy: auto-approve if the sprint is internally consistent and executable
- do_not_modify_code: true
- do_not_commit: true

Required outputs:
- Write the final sprint to {sprint_dir_rel}/SPRINT-NNN.md.
- Write merge notes and planning artifacts under {sprint_dir_rel}/drafts/.
- Create or update BW ticket files in the source epic directory when useful for traceability.
- Update ticket planning records as the skill normally requires.
- Write a JSON result manifest to {manifest_rel}.

The result manifest must contain:
{{
  "status": "planned" | "blocked",
  "source_target": "{target.id}",
  "source_epic": "{epic.id}",
  "sprint_id": "SPRINT-NNN",
  "sprint_path": "{sprint_dir_rel}/SPRINT-NNN.md",
  "blocked_reason": null,
  "assumptions": []
}}

If you cannot produce an executable sprint, write status "blocked" and explain
why in blocked_reason. Do not ask routine confirmation questions in this mode.
"""


def build_execute_prompt(
    *,
    sprint_path: Path,
    sprint_id: str,
    epic: TicketDoc,
    target: TicketTarget,
    manifest_path: Path,
    strategy: str,
) -> str:
    sprint_rel = repo_relative(sprint_path).as_posix()
    epic_rel = repo_relative(epic.path).as_posix()
    manifest_rel = repo_relative(manifest_path).as_posix()
    ticket_dir_rel = repo_relative(target.ticket_dir).as_posix()
    return f"""$sprint-execute implement {sprint_rel}

Automation contract:
- mode: ticket-burn
- non_interactive: true
- strategy: {strategy}
- commits: false
- source_target: {target.id}
- ticket_dir: {ticket_dir_rel}
- source_epic: {epic.id}
- source_epic_path: {epic_rel}
- sprint_id: {sprint_id}
- outer_runner_owns_git: true
- update_compendium_when_behavior_changes: true
- update_ticket_status_when_done: true
- update_epic_status_when_done: true

Required outputs:
- Implement the full sprint Definition of Done.
- Run the sprint's required validation.
- Mark completed sprint checklist items checked; do not write a completed
  manifest while any actionable `- [ ]` item remains in the sprint document.
- Update sprint and ticket metadata as the skill normally requires.
- If concrete BW tickets are completed, mark them done and link {sprint_id}.
- If the epic completion criteria are satisfied, mark {epic.id} done and link
  {sprint_id}; otherwise leave it in-progress/ready so the runner can plan the
  next sprint for the same epic.
- Write a JSON result manifest to {manifest_rel}.

The result manifest must contain:
{{
  "status": "completed" | "blocked" | "failed",
  "sprint_id": "{sprint_id}",
  "source_target": "{target.id}",
  "source_epic": "{epic.id}",
  "validation": [
    {{"command": "...", "status": "passed"}}
  ],
  "changed_files_summary": [],
  "blocked_reason": null,
  "followups": []
}}

Do not commit. If validation fails and you cannot fix it, stop and write status
"failed" and set blocked_reason to the exact failed command and cause. If a
high-risk ambiguity would change architecture, write status "blocked" with the
exact question in blocked_reason.
"""


def run_child(
    *,
    root: Path,
    codex_cmd: str,
    prompt: str,
    label: str,
    log_path: Path,
    heartbeat_seconds: int,
) -> ChildResult:
    command = shlex.split(codex_cmd) + [prompt]
    log_path.parent.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    with log_path.open("w", encoding="utf-8") as log:
        log.write(f"# {label}\n")
        log.write(f"# started_at: {utc_now()}\n")
        log.write("# command: " + " ".join(shlex.quote(part) for part in command[:-1]) + " <prompt>\n\n")
        log.write(prompt)
        log.write("\n\n# child output\n")
        log.flush()
        process = subprocess.Popen(command, cwd=root, stdout=log, stderr=subprocess.STDOUT, text=True)
        last_heartbeat = started
        while True:
            returncode = process.poll()
            now = time.monotonic()
            if returncode is not None:
                elapsed = int(now - started)
                log.write(f"\n# finished_at: {utc_now()}\n# returncode: {returncode}\n")
                return ChildResult(returncode=returncode, elapsed_seconds=elapsed, log_path=log_path)
            if now - last_heartbeat >= heartbeat_seconds:
                elapsed = int(now - started)
                emit(f"{label}: still running ({elapsed // 60}m {elapsed % 60}s); log {repo_relative(log_path)}")
                last_heartbeat = now
            time.sleep(5)


def read_manifest(path: Path, expected_statuses: set[str]) -> dict[str, Any]:
    if not path.is_file():
        raise BurnError(f"expected manifest was not written: {path}")
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise BurnError(f"manifest is invalid JSON: {path}: {exc.msg}") from exc
    status = str(manifest.get("status", "")).strip()
    if status not in expected_statuses:
        reason = manifest_rejection_reason(manifest)
        raise BurnError(f"manifest status {status!r} is not acceptable: {reason}")
    return manifest


def manifest_rejection_reason(manifest: dict[str, Any]) -> str:
    for key in ("blocked_reason", "reason"):
        value = manifest.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    validation = manifest.get("validation")
    if isinstance(validation, list):
        failed: list[str] = []
        for item in validation:
            if not isinstance(item, dict):
                continue
            status = str(item.get("status", "")).strip().lower()
            if status in {"", "passed", "ok", "success"}:
                continue
            command = str(item.get("command", "")).strip() or "<unknown command>"
            failed.append(f"{command} ({status})")
        if failed:
            return "failed validation: " + "; ".join(failed[:3])

    followups = manifest.get("followups")
    if isinstance(followups, list):
        text = "; ".join(str(item).strip() for item in followups if str(item).strip())
        if text:
            return "followups: " + text

    return "no reason recorded"


def normalize_repo_path(root: Path, value: str) -> Path:
    if not value:
        raise BurnError("manifest path value is empty")
    path = Path(value)
    if not path.is_absolute():
        path = root / path
    path = path.resolve()
    try:
        path.relative_to(root.resolve())
    except ValueError as exc:
        raise BurnError(f"manifest path escapes repo: {value}") from exc
    return path


def sprint_id_from_path(path: Path) -> str:
    match = re.search(r"SPRINT-(\d+)\.md$", path.name)
    if not match:
        raise BurnError(f"cannot infer sprint id from path: {path}")
    return f"SPRINT-{int(match.group(1)):03d}"


def plan_epic(
    *,
    root: Path,
    target: TicketTarget,
    epic: TicketDoc,
    run_paths: RunPaths,
    state: dict[str, Any],
    codex_cmd: str,
    heartbeat_seconds: int,
    dry_run: bool,
) -> tuple[str, Path]:
    step = ensure_step(state, epic)
    state["phase"] = "planning"
    state["current_epic"] = epic.id
    state["current_sprint"] = None
    manifest_path = run_paths.run_dir / f"plan-{epic.id}-result.json"
    log_path = run_paths.run_dir / f"plan-{epic.id}.log"
    step["state"] = "planning"
    step["plan_manifest"] = repo_relative(manifest_path).as_posix()
    event(state, f"planning sprint for {epic.id}")
    write_state(run_paths.state_path, state)

    prompt = build_plan_prompt(
        epic=epic,
        target=target,
        manifest_path=manifest_path,
        sprint_dir=root / DEFAULT_SPRINT_DIR,
    )
    emit(f"planning: starting sprint plan for {epic.id}")
    if dry_run:
        emit(f"planning: dry-run would invoke {codex_cmd!r}; manifest {repo_relative(manifest_path)}")
        return "SPRINT-000", root / DEFAULT_SPRINT_DIR / "SPRINT-000.md"

    child = run_child(
        root=root,
        codex_cmd=codex_cmd,
        prompt=prompt,
        label=f"planning {epic.id}",
        log_path=log_path,
        heartbeat_seconds=heartbeat_seconds,
    )
    if child.returncode != 0:
        raise BurnError(f"planning child failed for {epic.id}; see {repo_relative(child.log_path)}")

    manifest = read_manifest(manifest_path, {"planned"})
    sprint_path = normalize_repo_path(root, str(manifest.get("sprint_path", "")))
    if not sprint_path.is_file():
        raise BurnError(f"planned sprint path does not exist: {sprint_path}")
    sprint_id = str(manifest.get("sprint_id") or sprint_id_from_path(sprint_path)).strip()
    step["state"] = "planned"
    step["sprint"] = sprint_id
    state["current_sprint"] = sprint_id
    event(state, f"planned {sprint_id} for {epic.id}")
    write_state(run_paths.state_path, state)
    emit(f"planning: produced {repo_relative(sprint_path)}")
    return sprint_id, sprint_path


def execute_sprint(
    *,
    root: Path,
    target: TicketTarget,
    epic: TicketDoc,
    sprint_id: str,
    sprint_path: Path,
    run_paths: RunPaths,
    state: dict[str, Any],
    codex_cmd: str,
    strategy: str,
    heartbeat_seconds: int,
    dry_run: bool,
) -> dict[str, Any]:
    step = ensure_step(state, epic)
    state["phase"] = "executing"
    state["current_epic"] = epic.id
    state["current_sprint"] = sprint_id
    manifest_path = run_paths.run_dir / f"execute-{sprint_id}-result.json"
    log_path = run_paths.run_dir / f"execute-{sprint_id}.log"
    step["state"] = "executing"
    step["sprint"] = sprint_id
    step["execute_manifest"] = repo_relative(manifest_path).as_posix()
    event(state, f"executing {sprint_id}")
    write_state(run_paths.state_path, state)

    prompt = build_execute_prompt(
        sprint_path=sprint_path,
        sprint_id=sprint_id,
        epic=epic,
        target=target,
        manifest_path=manifest_path,
        strategy=strategy,
    )
    emit(f"executing: starting {sprint_id} for {epic.id} with strategy {strategy}")
    if dry_run:
        emit(f"executing: dry-run would invoke {codex_cmd!r}; manifest {repo_relative(manifest_path)}")
        return {"status": "completed", "validation": []}

    child = run_child(
        root=root,
        codex_cmd=codex_cmd,
        prompt=prompt,
        label=f"executing {sprint_id}",
        log_path=log_path,
        heartbeat_seconds=heartbeat_seconds,
    )
    if child.returncode != 0:
        raise BurnError(f"execution child failed for {sprint_id}; see {repo_relative(child.log_path)}")

    manifest = read_manifest(manifest_path, {"completed"})
    step["state"] = "executed"
    event(state, f"executed {sprint_id}")
    write_state(run_paths.state_path, state)
    emit(f"executing: definition of done reported complete for {sprint_id}")
    return manifest


def unchecked_task_items(path: Path) -> list[tuple[int, str]]:
    if not path.is_file():
        raise BurnError(f"sprint document not found: {path}")
    unchecked: list[tuple[int, str]] = []
    in_fence = False
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        stripped = line.lstrip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if re.match(r"^\s*[-*+]\s+\[\s\]\s+", line):
            unchecked.append((line_number, line.strip()))
    return unchecked


def verify_completed_sprint_checklist(path: Path, *, allow_unchecked: bool) -> None:
    unchecked = unchecked_task_items(path)
    if not unchecked:
        emit(f"sprint-checklist: no unchecked task items in {repo_relative(path)}")
        return
    sample = ", ".join(f"{path.name}:{line}" for line, _text in unchecked[:5])
    if allow_unchecked:
        emit(
            "sprint-checklist: allowing "
            f"{len(unchecked)} unchecked task item(s) by request ({sample})"
        )
        return
    raise BurnError(
        f"{path.name} still has {len(unchecked)} unchecked task item(s) after execution: "
        f"{sample}; pass --allow-unchecked-sprint-items only for intentional historical checklists"
    )


def run_validations(
    *,
    root: Path,
    run_paths: RunPaths,
    state: dict[str, Any],
    sprint_id: str,
    commands: list[str],
    dry_run: bool,
) -> list[dict[str, str]]:
    state["phase"] = "validating"
    event(state, f"validating {sprint_id}")
    write_state(run_paths.state_path, state)
    results: list[dict[str, str]] = []
    for index, command in enumerate(commands, start=1):
        log_path = run_paths.run_dir / f"validation-{sprint_id}-{index}.log"
        emit(f"validation: {command}")
        if dry_run:
            results.append({"command": command, "status": "dry-run"})
            continue
        started = time.monotonic()
        with log_path.open("w", encoding="utf-8") as log:
            log.write(f"# validation: {command}\n# started_at: {utc_now()}\n\n")
            log.flush()
            result = subprocess.run(
                command,
                cwd=root,
                shell=True,
                text=True,
                stdout=log,
                stderr=subprocess.STDOUT,
                check=False,
            )
            elapsed = int(time.monotonic() - started)
            log.write(f"\n# finished_at: {utc_now()}\n# returncode: {result.returncode}\n")
        if result.returncode != 0:
            results.append({"command": command, "status": "failed", "log": repo_relative(log_path).as_posix()})
            raise BurnError(f"validation failed: {command}; see {repo_relative(log_path)}")
        results.append({"command": command, "status": "passed", "elapsed_seconds": str(elapsed)})
        emit(f"validation: passed {command}")
    return results


def commit_sprint(
    *,
    root: Path,
    run_paths: RunPaths,
    state: dict[str, Any],
    target: TicketTarget,
    epic: TicketDoc,
    sprint_id: str,
    sprint_path: Path,
    no_commit: bool,
    dry_run: bool,
) -> str | None:
    step = ensure_step(state, epic)
    if no_commit:
        step["state"] = "validated"
        event(state, f"{sprint_id} validated; no-commit mode stopped before commit")
        write_state(run_paths.state_path, state)
        emit("commit: skipped by --no-commit")
        return None
    state["phase"] = "committing"
    event(state, f"committing {sprint_id}")
    write_state(run_paths.state_path, state)
    if dry_run:
        emit(f"commit: dry-run would commit {sprint_id}")
        return "dry-run"
    dirty = git_porcelain(root)
    if not dirty:
        raise BurnError(f"nothing to commit after {sprint_id}")
    title = sprint_title(sprint_path)
    subject = f"Implement {sprint_id}: {title}"
    body = f"Ticket target: {target.id}\nEpic: {epic.id}\nSprint: {sprint_id}"
    subprocess.run(["git", "add", "-A"], cwd=root, check=True)
    subprocess.run(["git", "commit", "-m", subject, "-m", body], cwd=root, check=True)
    result = subprocess.run(
        ["git", "rev-parse", "--short", "HEAD"],
        cwd=root,
        text=True,
        stdout=subprocess.PIPE,
        check=True,
    )
    commit_hash = result.stdout.strip()
    step["state"] = "committed"
    step["commit"] = commit_hash
    event(state, f"committed {sprint_id} as {commit_hash}")
    write_state(run_paths.state_path, state)
    emit(f"commit: {commit_hash} {subject}")
    return commit_hash


def sprint_title(path: Path) -> str:
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("# "):
                title = line[2:].strip()
                prefix = re.compile(r"^Sprint\s+\d+\s*:\s*", re.IGNORECASE)
                return prefix.sub("", title)
    return path.stem


def refresh_epic(root: Path, epic: TicketDoc) -> TicketDoc:
    path = epic.path
    if not path.is_absolute():
        path = root / path
    return read_ticket_doc(path)


def update_issue_doc_done(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise BurnError(f"ticket doc has no front matter: {path}")
    end = text.find("\n---", 4)
    if end == -1:
        raise BurnError(f"unterminated front matter: {path}")
    frontmatter = text[4:end].splitlines()
    rest = text[end + len("\n---") :]

    updated_lines: list[str] = []
    saw_status = False
    saw_updated = False
    for line in frontmatter:
        key = line.split(":", 1)[0].strip() if ":" in line else ""
        if key == "status":
            saw_status = True
            updated_lines.append("status: done")
        elif key == "updated":
            saw_updated = True
            updated_lines.append(f"updated: {local_date()}")
        else:
            updated_lines.append(line)
    if not saw_status:
        updated_lines.append("status: done")
    if not saw_updated:
        updated_lines.append(f"updated: {local_date()}")

    next_text = "---\n" + "\n".join(updated_lines) + "\n---" + rest
    if next_text == text:
        return False
    atomic_write_text(path, next_text)
    return True


def write_summary(run_paths: RunPaths, state: dict[str, Any]) -> None:
    lines = [
        f"# {state['target']} Burn-Down Run",
        "",
        f"- Status: {state['status']}",
        f"- Phase: {state['phase']}",
        f"- Last event: {state['last_event']}",
        "",
        "| Epic | Sprint | Commit | State |",
        "|---|---|---|---|",
    ]
    for step in state.get("steps", []):
        lines.append(
            "| {epic} | {sprint} | {commit} | {state} |".format(
                epic=step.get("epic") or "",
                sprint=step.get("sprint") or "",
                commit=step.get("commit") or "",
                state=step.get("state") or "",
            )
        )
    lines.append("")
    atomic_write_text(run_paths.summary_path, "\n".join(lines))


def run_burn(args: argparse.Namespace) -> int:
    root = repo_root()
    target = resolve_target(root, args.target, args.epic, args.through_epic)

    if args.status or args.watch:
        return show_status(root, target.id, watch=args.watch, interval=args.watch_interval)

    if args.dry_run:
        return dry_run(root, target, args)

    if not args.resume:
        ensure_preflight(
            root,
            allow_dirty=args.allow_dirty,
            allow_active_sprint=args.allow_active_sprint,
        )

    run_paths = create_run_paths(root, target.id, resume=args.resume)
    if args.resume:
        state = load_state(run_paths.state_path)
        emit(f"resume: {repo_relative(run_paths.run_dir)} ({state.get('status')}, {state.get('phase')})")
        ensure_preflight(root, allow_dirty=True, allow_active_sprint=True)
    else:
        state = new_state(target, run_paths)
        write_state(run_paths.state_path, state)
        emit(f"run: {repo_relative(run_paths.run_dir)}")

    validation_commands = [] if args.skip_validation else list(args.validation_command or DEFAULT_VALIDATION_COMMANDS)
    completed_sprints = 0
    try:
        while True:
            remaining = discover_epics(
                root,
                target,
                include_blocked=args.include_blocked,
                ignore_dependencies=args.ignore_dependencies,
            )
            if not remaining:
                open_epics = open_target_epics(root, target)
                if open_epics:
                    reason = no_eligible_reason(
                        root,
                        target,
                        include_blocked=args.include_blocked,
                        ignore_dependencies=args.ignore_dependencies,
                    )
                    state["status"] = "blocked"
                    state["phase"] = "no_eligible_epics"
                    state["current_epic"] = None
                    state["current_sprint"] = None
                    event(state, reason)
                    write_state(run_paths.state_path, state)
                    write_summary(run_paths, state)
                    raise BurnError(reason)

                state["status"] = "complete"
                state["phase"] = "done"
                state["current_epic"] = None
                state["current_sprint"] = None
                event(state, f"all eligible epics for {target.id} are done")
                write_state(run_paths.state_path, state)
                write_summary(run_paths, state)
                emit(f"complete: all eligible epics for {target.id} are done")
                return 0
            if args.max_sprints is not None and completed_sprints >= args.max_sprints:
                state["status"] = "paused"
                state["phase"] = "max_sprints"
                event(state, f"paused after {completed_sprints} sprint(s) due to --max-sprints")
                write_state(run_paths.state_path, state)
                write_summary(run_paths, state)
                emit(f"paused: reached --max-sprints {args.max_sprints}; resume with --resume")
                return 0

            epic = remaining[0]
            sprint_id, sprint_path = resume_or_plan(
                root=root,
                target=target,
                epic=epic,
                run_paths=run_paths,
                state=state,
                args=args,
            )
            step = find_step(state, epic.id, sprint_id)
            step_state = str((step or {}).get("state", ""))
            if args.resume and step_state in {"executed", "validated"}:
                emit(f"resume: {sprint_id} is already {step_state}; skipping execution")
            else:
                execute_sprint(
                    root=root,
                    target=target,
                    epic=epic,
                    sprint_id=sprint_id,
                    sprint_path=sprint_path,
                    run_paths=run_paths,
                    state=state,
                    codex_cmd=args.execute_codex_cmd or args.codex_cmd,
                    strategy=args.strategy,
                    heartbeat_seconds=args.heartbeat,
                    dry_run=False,
                )

            verify_completed_sprint_checklist(
                sprint_path,
                allow_unchecked=args.allow_unchecked_sprint_items,
            )

            step = find_step(state, epic.id, sprint_id)
            if args.resume and step and step.get("state") == "validated":
                emit(f"resume: {sprint_id} is already validated; skipping runner validation")
            else:
                run_validations(
                    root=root,
                    run_paths=run_paths,
                    state=state,
                    sprint_id=sprint_id,
                    commands=validation_commands,
                    dry_run=False,
                )
                step = find_step(state, epic.id, sprint_id)
                if step is not None:
                    step["state"] = "validated"
                    write_state(run_paths.state_path, state)

            refreshed = refresh_epic(root, epic)
            if refreshed.status == "done":
                completed = state.setdefault("completed_epics", [])
                if epic.id not in completed:
                    completed.append(epic.id)
                emit(f"epic: {epic.id} is done")
            else:
                emit(f"epic: {epic.id} remains {refreshed.status or 'unknown'}; next loop will plan another sprint")

            commit_sprint(
                root=root,
                run_paths=run_paths,
                state=state,
                target=target,
                epic=epic,
                sprint_id=sprint_id,
                sprint_path=sprint_path,
                no_commit=args.no_commit,
                dry_run=False,
            )
            completed_sprints += 1
            write_state(run_paths.state_path, state)
            write_summary(run_paths, state)
            if args.no_commit:
                state["status"] = "paused"
                state["phase"] = "no_commit"
                event(state, "paused because --no-commit leaves the tree dirty")
                write_state(run_paths.state_path, state)
                emit("paused: --no-commit mode stops after one sprint")
                return 0
    except BurnError as exc:
        state["status"] = "failed" if state.get("status") != "blocked" else "blocked"
        event(state, str(exc))
        write_state(run_paths.state_path, state)
        write_summary(run_paths, state)
        raise


def resume_or_plan(
    *,
    root: Path,
    target: TicketTarget,
    epic: TicketDoc,
    run_paths: RunPaths,
    state: dict[str, Any],
    args: argparse.Namespace,
) -> tuple[str, Path]:
    step = find_step(state, epic.id)
    if args.resume and step and step.get("sprint") and step.get("state") in {"planned", "executing", "executed", "validated"}:
        sprint_id = str(step["sprint"])
        sprint_path = root / DEFAULT_SPRINT_DIR / f"{sprint_id}.md"
        if not sprint_path.is_file():
            raise BurnError(f"resume sprint path is missing: {sprint_path}")
        emit(f"resume: using existing planned sprint {sprint_id}")
        return sprint_id, sprint_path
    return plan_epic(
        root=root,
        target=target,
        epic=epic,
        run_paths=run_paths,
        state=state,
        codex_cmd=args.plan_codex_cmd or args.codex_cmd,
        heartbeat_seconds=args.heartbeat,
        dry_run=False,
    )


def dry_run(root: Path, target: TicketTarget, args: argparse.Namespace) -> int:
    emit(f"dry-run: {target.id} {target.title}")
    try:
        dirty = git_porcelain(root)
        active = active_sprints(root)
    except BurnError as exc:
        emit(f"dry-run: preflight check unavailable: {exc}")
        dirty = []
        active = []
    if dirty:
        emit(f"dry-run: fresh run would block on dirty tree ({len(dirty)} changed path(s))")
    if active:
        emit(f"dry-run: fresh run would block on active sprint(s): {', '.join(active)}")
    epics = discover_epics(
        root,
        target,
        include_blocked=args.include_blocked,
        ignore_dependencies=args.ignore_dependencies,
    )
    if not epics:
        open_epics = open_target_epics(root, target)
        if not open_epics:
            emit("dry-run: no eligible epics remaining; target is complete")
        else:
            reason = no_eligible_reason(
                root,
                target,
                include_blocked=args.include_blocked,
                ignore_dependencies=args.ignore_dependencies,
            )
            emit(f"dry-run: {reason}")
        return 0
    max_count = args.max_sprints or len(epics)
    emit(f"dry-run: {len(epics)} eligible epic(s); would process up to {max_count} sprint(s)")
    for epic in epics[:max_count]:
        emit(f"dry-run: next epic {epic.id} ({epic.status}) {epic.title}")
    emit(f"dry-run: plan command {args.plan_codex_cmd or args.codex_cmd!r}")
    emit(f"dry-run: execute command {args.execute_codex_cmd or args.codex_cmd!r}")
    if args.skip_validation or not (args.validation_command or DEFAULT_VALIDATION_COMMANDS):
        emit("dry-run: runner validation disabled")
    else:
        for command in args.validation_command or DEFAULT_VALIDATION_COMMANDS:
            emit(f"dry-run: runner validation {command}")
    return 0


def show_status(root: Path, target_id: str, *, watch: bool, interval: int) -> int:
    runs_root = root / DEFAULT_RUNS_DIR / safe_path_component(target_id)
    while True:
        run_dir = latest_run_dir(runs_root) if runs_root.is_dir() else None
        if run_dir is None:
            print(f"no run found for {target_id}")
            return 1
        state = load_state(run_dir / "run.json")
        print_status(state, run_dir)
        if not watch:
            return 0
        if state.get("status") in {"complete", "paused", "blocked", "failed"}:
            return 0
        time.sleep(interval)


def print_status(state: dict[str, Any], run_dir: Path) -> None:
    print(
        f"{state.get('target')} {state.get('status')} phase={state.get('phase')} "
        f"current_epic={state.get('current_epic')} current_sprint={state.get('current_sprint')}"
    )
    print(f"run: {repo_relative(run_dir)}")
    print(f"last: {state.get('last_event')}")
    for step in state.get("steps", []):
        print(
            "  {epic} {sprint} {state} {commit}".format(
                epic=step.get("epic") or "",
                sprint=step.get("sprint") or "",
                state=step.get("state") or "",
                commit=step.get("commit") or "",
            ).rstrip()
        )


def atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        tmp.write_text(text, encoding="utf-8")
        os.replace(tmp, path)
    finally:
        if tmp.exists():
            tmp.unlink()


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Burn down Build Wars ticket epics through sprint planning and execution.",
    )
    parser.add_argument(
        "target",
        nargs="?",
        help="ticket backlog directory, EPIC-NN id, epic directory, or EPIC.md path (default: work/tickets)",
    )
    parser.add_argument("--epic", help="limit the run to one EPIC-NN id")
    parser.add_argument("--through-epic", help="process only epics up to and including this EPIC-NN id")
    parser.add_argument("--include-blocked", action="store_true", help="include blocked epics instead of skipping them")
    parser.add_argument("--ignore-dependencies", action="store_true", help="ignore depends_on gating")
    parser.add_argument("--max-sprints", type=int, help="stop after this many completed sprint executions")
    parser.add_argument("--strategy", default="orchestrated", choices=("orchestrated", "worker", "codex-cli"))
    parser.add_argument("--codex-cmd", default=DEFAULT_CODEX_CMD, help=f"base Codex command (default: {DEFAULT_CODEX_CMD})")
    parser.add_argument("--plan-codex-cmd", help="override Codex command for planning child runs")
    parser.add_argument("--execute-codex-cmd", help="override Codex command for execution child runs")
    parser.add_argument("--validation-command", action="append", help="runner-owned validation command; repeatable")
    parser.add_argument("--skip-validation", action="store_true", help="skip runner-owned validation commands")
    parser.add_argument("--heartbeat", type=int, default=60, help="seconds between long child-run progress messages")
    parser.add_argument("--dry-run", action="store_true", help="show selected epics and commands without launching Codex")
    parser.add_argument("--resume", action="store_true", help="resume the latest run for this target")
    parser.add_argument("--status", action="store_true", help="print the latest run status for this target")
    parser.add_argument("--watch", action="store_true", help="watch the latest run status until it reaches a stop state")
    parser.add_argument("--watch-interval", type=int, default=30)
    parser.add_argument("--allow-dirty", action="store_true", help="allow a fresh run to start with a dirty git tree")
    parser.add_argument(
        "--allow-unchecked-sprint-items",
        action="store_true",
        help="allow a completed sprint document to retain unchecked markdown task items",
    )
    parser.add_argument(
        "--allow-active-sprint",
        action="store_true",
        help=f"allow a fresh run while {DEFAULT_SPRINT_DIR}/ledger.tsv has an in-progress sprint",
    )
    parser.add_argument("--no-commit", action="store_true", help="validate one sprint and pause before committing")
    args = parser.parse_args(argv)
    if args.max_sprints is not None and args.max_sprints < 1:
        parser.error("--max-sprints must be >= 1")
    return args


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        return run_burn(args)
    except BurnError as exc:
        print(f"ticket-burn: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
