# EPIC-20 Draft Critique

Reviewed the [independent Codex draft](EPIC-020-CODEX-DRAFT.md) against the
conversation, current code and ticket-burn contract on 2026-09-26. Claude produced
no draft because its CLI was not logged in; this is the sprint-plan skill's local
second-pass fallback, not a claim of cross-provider consensus.

## Strengths

- Correctly identifies the existing Guide scaffold and current Build v4 model.
- Separates authoring selection from persistent mention context, and calls out
  neutral catalog use with no selected build.
- Preserves full authored snapshots and app raw overlays instead of reducing
  each guide build to a lossy game template code.
- Includes migration, storage recovery, backup/restore, safe Markdown rendering,
  actual browser evidence and preserved composer workflows.
- Keeps public discovery, source intake and publishing out of the local editor
  milestone while retaining the motivating use case.

## Required Refinements

1. **Rendered editing must be explicit.** A shell, source view and renderer could
   satisfy several draft bullets without delivering the writing experience the
   user described. Require rendered text editing, formatting, insert commands,
   cursor/selection behavior, IME and inline-safe tooltip markup.
2. **Set history ownership before UI work.** The draft leaves transaction/history
   consolidation until BW-2008. That invites separate rich-text and build undo
   stacks. Establish one guide transaction contract early and test mixed edits
   during the feasibility spike.
3. **Choose one applied document owner.** The draft proposes canonical source as
   the durable owner. The final contract uses a vendor-independent semantic guide
   for accepted transactions, annotated Markdown for portability, and a separate
   unapplied source buffer. Both approaches can work; mixing them cannot. Require
   atomic Apply, source recovery and opaque content preservation explicitly.
4. **Missing context must not become neutral silently.** A missing bound build is
   unresolved context, not equivalent to an intentionally generic mention. Preserve
   its identity and explain it until explicit rebind or undo repairs it.
5. **Expand the drop contract.** Address nested slot/prose targets, inactive cards,
   source-slot changes during drag, document switches, same-bar moves, cross-bar
   copy and source-bar-to-bound-mention. The existing slot-index payload is unsafe
   when reused unmodified for multiple cards.
6. **Define identity operations.** Rename/reorder preserve IDs, duplicate creates
   independent IDs, fragment copy remaps internal references, and cross-document
   paste must not accidentally bind external references to colliding local IDs.
7. **Preserve invalid source durably.** Last-valid preview alone is insufficient;
   reload must preserve the unapplied source draft. Export must distinguish raw
   draft from last-valid guide and never claim successful lossless import of
   rejected syntax.
8. **Make save controls reachable.** Existing persistence capabilities do not mean
   users have a guide Save/Open flow. Include a bounded guide-specific entry point
   and named local operations without reviving all obsolete secondary panels.
9. **Keep code input usable.** A blanket rule that game codes are never persisted
   would conflict with preserved raw-template envelopes and useful hand-authored
   template shorthand. Prohibit conflicting authorities and derived duplicate
   fields instead; preserve exact imported source when fidelity requires it.
10. **Separate setup from implementation verification.** A closeout dry-run cannot
    require selection of a just-completed epic. Dry-run eligibility is evidence for
    this backlog preparation; implementation closeout validates actual product
    behavior and correct done status.

## Scope and Risk Assessment

The first milestone is substantial enough for several burn-created sprints.
Splitting source transfer, durability and reading into separate tickets makes the
implementation and validation boundaries clearer than one large shell ticket.
Do not declare the epic done at the initial prototype slice.

The largest risks are rich-editor integration, divergent document/build histories,
silent loss across Markdown conversion, hidden active-build coupling and storage
migration. The final brief gives executable defaults and the ticket acceptance
must verify these risks directly. A library decision and limits remain routine
execution choices owned by the first ticket, not reasons to reopen the interview.

## Applied to Final Backlog

The synthesis uses twelve tickets. Transaction/history ownership precedes UI;
catalog isolation is explicit in BW-2004 and BW-2006; pointer/keyboard targeting has
BW-2007; source transfer, persistence and reader each have a dedicated ticket.
The original example and final browser gate cover the complete author/read flow.
