# SPRINT-006 Merge Notes

## Inputs

- Intent: `work/sprints/drafts/SPRINT-006-INTENT.md`
- Drafts:
  - `work/sprints/drafts/SPRINT-006-GPT56SOL-DRAFT.md`
  - `work/sprints/drafts/SPRINT-006-GPT55-DRAFT.md`
  - `work/sprints/drafts/SPRINT-006-GPT54-DRAFT.md`
- Critiques:
  - `work/sprints/drafts/SPRINT-006-GPT56SOL-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-006-GPT55-CRITIQUE.md`
  - `work/sprints/drafts/SPRINT-006-GPT54-CRITIQUE.md`

## Accepted

- Use GPT-5.6 Sol as the safety and architecture baseline: `src/domain` owns plain contracts,
  `src/template-compatibility` owns executable vendor calls, and `src/app` remains unchanged.
- Use GPT-5.4's and GPT-5.5's simpler phase discipline: dependency qualification, contracts and
  adapter, skill compatibility, equipment compatibility, paw-ned2 ship-or-defer, then fixtures/docs
  closeout.
- Keep `@buildwars/gw-templates@1.1.1` as the first implementation path, but require proof under
  the repository Node.js floor, TypeScript, Vitest, and Vite production build before deeper work.
- Record the known package risks in the sprint: no advertised TypeScript declarations, CJS/ES/browser
  distribution, `windows-1252` transitive dependency, and package documentation naming Node
  `>=24` while the repo supports Node `>=22.11.0`.
- Separate raw template documents from semantic authored models. Do not widen `Build` or the current
  semantic `EquipmentTemplate` to carry unresolved template state.
- Split decode, resolution, and projection. Resolution is a pure view over caller-supplied EPIC-03
  and EPIC-04 catalogs and can be rerun after catalog updates.
- Define explicit fidelity grades: exact-source replay, field-complete normalized re-encode, and
  unsupported-or-lossy.
- Accept empty chat-code names as valid and preserve them distinctly from no wrapper.
- Keep equipment support raw-only until EPIC-13 owns semantic equipment catalogs.
- Treat paw-ned2/team as conditional optional scope. It must either ship as a bounded raw codec or be
  deferred with evidence and no public partial API.
- Add six traceability tickets, BW-0501 through BW-0506, linked to `SPRINT-006`.

## Rejected Or Adjusted

- Rejected placing vendor imports directly in `src/domain`. Domain contracts stay vendor-independent;
  the executable adapter lives under `src/template-compatibility`.
- Rejected a full local bitstream parser as an unplanned fallback. If the pinned dependency fails
  mandatory skill/equipment gates, execution blocks for an explicit amendment.
- Rejected embedding a persisted `Build` projection in decoded template documents. Any projection
  helper must be pure, optional, and fully resolved only.
- Rejected semantic equipment projection in this sprint. Raw equipment IDs are not enough to invent
  armor, rune, insignia, weapon, modifier, or dye facts.
- Rejected canonical-only export. Exact-source replay is necessary for unknown, future,
  dispositioned, or dependency-nonencodable imported facts.
- Adjusted GPT-5.6 Sol's broad hardening list into mandatory gates, closeout checks, and conditional
  optional hardening so the sprint remains executable.
- Adjusted GPT-5.5's open questions into sprint defaults rather than leaving contract-defining
  decisions unresolved.
- Adjusted GPT-5.4's Phase 0 traceability concept into BW-0501 baseline and planning records because
  the ticket files are created during this planning pass.

## Local Feasibility Notes

- The existing repo already has branded `TemplateProfessionId`, `TemplateAttributeId`, and
  `TemplateSkillId` types, plus lookup helpers for EPIC-03 and EPIC-04. EPIC-05 can build around
  existing contracts instead of reshaping the catalog model.
- The generated EPIC-04 catalog contains 2,951 skills and 315 dispositions, with template IDs from 1
  through 3442 and 435 numeric gaps. Unknown and dispositioned template IDs must remain
  round-trippable where possible.
- `@buildwars/gw-templates@1.1.1` package inspection shows methods for skill, equipment, and
  paw-ned2 support, but also shows normalization behavior in package source such as profession
  normalization, attribute filtering, skill normalization, item-to-slot mapping, and modifier
  filtering. The adapter must treat those as potential loss, not validation.
- Current project validation is centered on `npm run verify`, with `python3 scripts/test_ticket_burn.py`
  included in the canonical command.
- The existing lint configuration already protects `src/domain`; the implementation should extend
  equivalent restrictions to `src/template-compatibility` if that directory is introduced.

## Interview

Interview skipped under the non-interactive ticket-burn contract. No high-risk architecture choice
requires routine user confirmation because the final sprint resolves the open questions with
conservative defaults and pushes dependency failure to explicit phase gates.

## Final Assumptions

- `SPRINT-006` is the next sprint because SPRINT-001 through SPRINT-005 are completed and the ledger
  has no active sprint.
- EPIC-05 can be planned as one executable sprint because mandatory skill/equipment/chat
  compatibility is tightly coupled around the same dependency and fidelity boundary.
- Mandatory skill and equipment codec support must pass the dependency qualification gate or the
  sprint blocks rather than silently adopting a local parser or changing the project runtime floor.
- paw-ned2/team support is optional conditional scope. Deferral with evidence is an acceptable
  planned outcome if mandatory formats ship and no partial team API is exposed.
- Planning may update ticket, sprint, ledger, and run records, but implementation code is not
  modified by this planning pass.
