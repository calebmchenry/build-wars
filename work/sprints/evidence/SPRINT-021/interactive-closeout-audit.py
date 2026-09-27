"""Audit SPRINT-021 completion records and preserved browser evidence (no browser replay)."""

from pathlib import Path
import hashlib
import json
import re
import runpy
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[4]
assert Path.cwd() == ROOT == Path('/Users/calebmchenry/code/build-wars')
EVIDENCE = ROOT / 'work/sprints/evidence/SPRINT-021'
RUN = ROOT / 'work/runs/SPRINT-021'
RESULT = ROOT / 'work/runs/ticket-burn/EPIC-20/20260926T232847Z/execute-SPRINT-021-result.json'
runner = runpy.run_path(str(ROOT / 'scripts/ticket-burn.py'))
read_doc = runner['read_ticket_doc']
sprint_path = ROOT / 'work/sprints/SPRINT-021.md'
sprint = read_doc(sprint_path)
assert sprint.frontmatter['status'] == 'completed'
assert sprint.frontmatter['execution_status'] == 'completed'
runner['verify_completed_sprint_checklist'](sprint_path, allow_unchecked=False)
assert len(re.findall(r'^- \[x\] ', sprint_path.read_text(), re.M)) == 68
baseline = json.loads((RUN / 'interactive-closeout-baseline.json').read_text())
assert len(baseline['unchecked_items']) == 9
for item in baseline['unchecked_items']:
    assert item.replace('- [ ]', '- [x]', 1) in sprint_path.read_text(), item

ticket_dir = ROOT / 'work/tickets'
epics = {doc.id: doc for doc in runner['all_epics'](ROOT, ticket_dir)}
epic = epics['EPIC-20']
assert epic.frontmatter['status'] == 'done'
assert epic.frontmatter['completed_sprint'] == 'SPRINT-021'
assert not runner['dependency_blockers'](epic, epics)
assert len(epic.frontmatter['depends_on']) == 8
all_docs = dict(epics)
all_docs.update({doc.id: doc for doc in [read_doc(p) for p in epic.path.parent.glob('BW-*.md')]})
assert epic.frontmatter['tickets'] == [f'BW-{n}' for n in range(2001, 2013)]
for ticket_id in epic.frontmatter['tickets']:
    ticket = all_docs[ticket_id]
    assert ticket.frontmatter['status'] == 'done', ticket_id
    assert ticket.frontmatter['completed_sprint'] == 'SPRINT-021', ticket_id
    for dependency in ticket.frontmatter.get('depends_on', []):
        assert all_docs[dependency].frontmatter['status'] == 'done', (ticket_id, dependency)
rows = [line.split('\t') for line in (ROOT / 'work/sprints/ledger.tsv').read_text().splitlines()[1:]]
assert next(row for row in rows if row[0] == '021')[2] == 'completed'
print('PASS: 68/68 sprint items checked, nine reviewed items completed individually, all 12 tickets and EPIC-20 done with SPRINT-021 links; eight prerequisite epics and ticket dependency DAG satisfied; ledger completed.')

checks = json.loads((EVIDENCE / 'interactive-transfer-checks.json').read_text())
assert len(checks) == 18 and all(case['passed'] is True for case in checks)
for rel, size, expected in [
    ('work/sprints/evidence/SPRINT-021/phase11-workflow-export.md', 9478, '4f045c842b73644cb5b7e3c5a74f69764b37efc2a4e00937ba54174c87b01140'),
    ('work/sprints/evidence/SPRINT-021/phase8-applied-download.md', 237, '4338a7351d0478d300748d83ee0c161c0b1936d496d7d111c7cf4c89d11eb28d'),
    ('test/fixtures/guides/long-v1.md', 70233, 'b8149f13740954f41b16378f9b0e5893e60978c16f8344bff762a716f94cdc52'),
]:
    value = (ROOT / rel).read_bytes()
    assert len(value) == size and hashlib.sha256(value).hexdigest() == expected, rel
assert len((EVIDENCE / 'phase8-invalid-raw.md').read_bytes()) == 28
code = (EVIDENCE / 'interactive-template-input.txt').read_text()
assert len(code.encode()) == 24

def builds(source):
    return {node['id']: node for node in [json.loads(raw) for raw in re.findall(r'^:::bw-build\n([^\n]+)\n:::', source, re.M)]}

before = builds((EVIDENCE / 'phase11-workflow-export.md').read_text())
after = builds((EVIDENCE / 'interactive-template-import.md').read_text())
selection = builds((EVIDENCE / 'interactive-template-selection-source.txt').read_text())
assert len(before) == len(after) == len(selection) == 2
for observed in [after, selection]:
    assert observed['dagger-supported'] == before['dagger-supported']
    target = observed['dagger-independent']
    assert target['snapshot']['build']['id'] == target['id'] == 'dagger-independent'
    assert target['snapshot']['build']['name'] == 'Protection B'
    assert target['snapshot']['rawTemplate']['source']['originalBareCode'] == code
    assert target['snapshot']['build']['primaryProfessionId'] == 3
session_check = next(case for case in checks if 'newGuideId' in case)
assert session_check['newGuideId'] == '1a1c4eb9-48ee-4477-b25a-4bf0eb009bc9'
session_delta = (EVIDENCE / 'interactive-markdown-new-session.txt').read_text()
assert 'Released arrayBuffer completion for phase8-applied-download.md (237 bytes)' in session_delta
assert 'Native AX before/after: only scheduler changed from Held to Released' in session_check['observation']
for screenshot in EVIDENCE.glob('interactive-*.png'):
    # Retain original capture bytes: these .png-named artifacts contain JPEG data.
    assert screenshot.read_bytes().startswith((b'\x89PNG\r\n\x1a\n', b'\xff\xd8\xff')), screenshot
for name in ['initial-blocked-result.json', 'resume-blocked-result.json', 'original-worktree-blocked-result.json', 'main-checkout-retry2-blocked-result.json']:
    assert json.loads((EVIDENCE / name).read_text())['status'] == 'blocked', name
for name in ['phase12.md', 'interactive-closeout.md', 'interactive-transfer-closeout.md']:
    note = (EVIDENCE / name).read_text()
    assert 'unverified' in note and 'deferred' in note, name
assert 'deferred by user decision' in ' '.join((EVIDENCE / 'native-composition-deferral.md').read_text().split())
assert 'controlledScheduling' in (EVIDENCE / 'interactive-transfer-checks.json').read_text()
assert 'not a claim about naturally slow disk latency' in (EVIDENCE / 'interactive-transfer-closeout.md').read_text()
print('PASS: 18 recorded interactive observations pass; transfer byte counts/hashes, captured-target IDs/raw code and complete sibling equality confirmed; exact screenshots/captures and historical failures retained; native composition remains unverified/user-deferred.')

for name, expected in baseline['protected_sha256'].items():
    assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == expected, name
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip() == baseline['head']
print(f"PASS: all {len(baseline['protected_sha256'])} protected pre-existing files unchanged, including product/dependencies/local fixes and exact exports/TXT/AX captures; HEAD unchanged.")

paths = [ROOT / name for name in baseline['allowed_files'] if name.endswith('.md')]
paths += [EVIDENCE / 'interactive-closeout.md']
for path in paths:
    for link in re.findall(r'\]\(([^)]+)\)', path.read_text()):
        if '://' in link or link.startswith('#'):
            continue
        target = link.split('#', 1)[0]
        assert (path.parent / target).exists(), (path.relative_to(ROOT), link)
print('PASS: current sprint/ticket/epic/compendium/evidence links resolve locally.')

if '--records-only' in sys.argv:
    print('Record/evidence preflight complete; final validation/manifest checks are intentionally deferred to the full audit.')
    sys.exit(0)
verify = (EVIDENCE / 'interactive-closeout-verify.txt').read_text()
for proof in ['All matched files use Prettier code style!', '> eslint .', '> tsc -p tsconfig.domain.json', '110 passed (110)', '692 passed (692)', 'built in', 'Ran 151 tests', 'Ran 21 tests']:
    assert proof in verify, proof
assert verify.count('\nOK\n') == 2
assert json.loads((RUN / 'interactive-closeout-verify-exit.json').read_text())['exit_code'] == 0
assert 'All matched files use Prettier code style!' in (EVIDENCE / 'interactive-closeout-format.txt').read_text()
assert not (EVIDENCE / 'interactive-closeout-diff.txt').read_text()
print('PASS: fresh pinned verify passed formatting, lint, strict types, 692 Vitest tests / 110 files, production build, 151 ingestion tests and 21 runner tests; final format and diff checks pass.')
manifest = runner['read_manifest'](RESULT, {'completed'})
assert manifest == json.loads((EVIDENCE / 'final-result.json').read_text())
for key in ['sprint_id', 'source_target', 'source_epic', 'validation', 'changed_files_summary', 'blocked_reason', 'followups']:
    assert key in manifest, key
assert manifest['sprint_id'] == 'SPRINT-021'
assert manifest['source_target'] == manifest['source_epic'] == 'EPIC-20'
assert manifest['blocked_reason'] is None
assert all(entry['status'] == 'passed' for entry in manifest['validation'])
assert any('unverified' in entry and 'deferred by user decision' in entry for entry in manifest['followups'])
assert manifest['changed_files_summary']
print('PASS: caller and durable completed manifests match; no blocker, validation recorded, explicit composition/future-scope follow-ups retained. No commit/merge/push performed.')
