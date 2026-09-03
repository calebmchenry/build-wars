import {
  validatePartyAnnotations,
  type BuildSetEntryId,
  type GameMode,
  type PartyAnnotations,
  type PartySlotId
} from "../domain";
import type { AppCatalogViews } from "./catalogs";
import { selectValidationView, type ValidationView } from "./editor-selectors";
import { hydrateEditorFromSnapshot, type PersistedBuildSetSnapshot } from "./persistence-schema";

export type PartyValidationSeverity = "error" | "warning" | "info";
export type PartyMemberValidationStatus =
  | "ok"
  | "empty"
  | "error"
  | "warning"
  | "unresolved"
  | "incomplete"
  | "unknown-mode"
  | "catalog-unavailable";

export interface PartyValidationIssue {
  readonly code: string;
  readonly severity: PartyValidationSeverity;
  readonly path: string;
  readonly message: string;
  readonly slotId?: PartySlotId;
  readonly entryId?: BuildSetEntryId;
}

export interface PartyMemberValidationSummary {
  readonly slotId: PartySlotId;
  readonly entryId: BuildSetEntryId | null;
  readonly label: string;
  readonly status: PartyMemberValidationStatus;
  readonly mode: GameMode | "empty";
  readonly issueCount: number;
  readonly valid: boolean;
  readonly complete: boolean;
  readonly resolved: boolean;
  readonly validation: ValidationView | null;
}

export interface PartyValidationCounts {
  readonly errors: number;
  readonly warnings: number;
  readonly info: number;
  readonly emptySlots: number;
  readonly unresolvedMembers: number;
  readonly incompleteMembers: number;
  readonly unavailableMembers: number;
  readonly totalIssues: number;
}

export interface PartyValidationView {
  readonly party: PartyAnnotations;
  readonly members: readonly PartyMemberValidationSummary[];
  readonly issues: readonly PartyValidationIssue[];
  readonly counts: PartyValidationCounts;
  readonly summary: string;
  readonly truncation: { readonly observed: number; readonly limit: number } | null;
}

const PARTY_VALIDATION_ISSUE_LIMIT = 80;

export function selectPartyValidationView(
  snapshot: PersistedBuildSetSnapshot,
  catalogs: AppCatalogViews
): PartyValidationView | null {
  if (snapshot.party === null) {
    return null;
  }
  const party = snapshot.party;
  const issues: PartyValidationIssue[] = validatePartyAnnotations(party, {
    entries: snapshot.entries,
    includeEmptySlotIssues: true
  }).map((issue) => ({
    code: issue.code,
    severity: issue.severity,
    path: issue.path,
    message: issue.message,
    ...(issue.slotId === undefined ? {} : { slotId: issue.slotId }),
    ...(issue.entryId === undefined ? {} : { entryId: issue.entryId })
  }));
  const members = party.slots.map((slot, index): PartyMemberValidationSummary => {
    if (slot.entryId === null) {
      return {
        slotId: slot.id,
        entryId: null,
        label: slot.memberLabel,
        status: "empty",
        mode: "empty",
        issueCount: 0,
        valid: false,
        complete: false,
        resolved: true,
        validation: null
      };
    }
    const entry = snapshot.entries.find((candidate) => candidate.id === slot.entryId);
    if (entry === undefined) {
      return {
        slotId: slot.id,
        entryId: slot.entryId,
        label: slot.memberLabel,
        status: "error",
        mode: "empty",
        issueCount: 1,
        valid: false,
        complete: false,
        resolved: false,
        validation: null
      };
    }
    const validation = selectValidationView(hydrateEditorFromSnapshot(entry.snapshot), catalogs);
    const catalogUnavailable = validation.result.issues.some((issue) =>
      issue.code.includes("catalog-unavailable")
    );
    const status = memberStatus(validation, catalogUnavailable);
    addMemberIssues(issues, slot.id, slot.entryId, index, validation, catalogUnavailable);
    return {
      slotId: slot.id,
      entryId: slot.entryId,
      label: slot.memberLabel,
      status,
      mode: validation.input.build.mode,
      issueCount: validation.result.counts.total,
      valid: validation.result.valid,
      complete: validation.result.complete,
      resolved: validation.result.resolved,
      validation
    };
  });
  addMixedModeIssues(issues, members);
  const sorted = issues.sort(
    (left, right) =>
      severityRank(left.severity) - severityRank(right.severity) ||
      left.path.localeCompare(right.path, "en-US") ||
      left.code.localeCompare(right.code, "en-US")
  );
  const visible = sorted.slice(0, PARTY_VALIDATION_ISSUE_LIMIT);
  const counts = countIssues(visible, members);
  return {
    party,
    members,
    issues: visible,
    counts,
    summary:
      members.length === 0
        ? "no party slots"
        : `${counts.errors} errors, ${counts.warnings} warnings, ${counts.emptySlots} empty slots, ${counts.unresolvedMembers} unresolved, ${counts.incompleteMembers} incomplete`,
    truncation:
      sorted.length > PARTY_VALIDATION_ISSUE_LIMIT
        ? { observed: sorted.length, limit: PARTY_VALIDATION_ISSUE_LIMIT }
        : null
  };
}

function memberStatus(
  validation: ValidationView,
  catalogUnavailable: boolean
): PartyMemberValidationStatus {
  if (validation.result.counts.error > 0) {
    return "error";
  }
  if (catalogUnavailable) {
    return "catalog-unavailable";
  }
  if (!validation.result.resolved) {
    return "unresolved";
  }
  if (!validation.result.complete) {
    return "incomplete";
  }
  if (validation.input.build.mode === "unknown") {
    return "unknown-mode";
  }
  if (validation.result.counts.warning > 0) {
    return "warning";
  }
  return "ok";
}

function addMemberIssues(
  issues: PartyValidationIssue[],
  slotId: PartySlotId,
  entryId: BuildSetEntryId,
  index: number,
  validation: ValidationView,
  catalogUnavailable: boolean
): void {
  const path = `$.slots[${index}]`;
  if (validation.result.counts.error > 0) {
    issues.push({
      code: "party-member-loadout-errors",
      severity: "error",
      path,
      message: "Party member has loadout validation errors.",
      slotId,
      entryId
    });
  }
  if (!validation.result.complete) {
    issues.push({
      code: "party-member-incomplete",
      severity: "warning",
      path,
      message: "Party member loadout is incomplete.",
      slotId,
      entryId
    });
  }
  if (!validation.result.resolved) {
    issues.push({
      code: "party-member-unresolved",
      severity: "warning",
      path,
      message: "Party member loadout has unresolved catalog facts.",
      slotId,
      entryId
    });
  }
  if (validation.input.build.mode === "unknown") {
    issues.push({
      code: "party-member-unknown-mode",
      severity: "info",
      path,
      message: "Party member mode is unknown.",
      slotId,
      entryId
    });
  }
  if (catalogUnavailable) {
    issues.push({
      code: "party-member-catalog-unavailable",
      severity: "warning",
      path,
      message: "Party member validation used unavailable catalog facts.",
      slotId,
      entryId
    });
  }
}

function addMixedModeIssues(
  issues: PartyValidationIssue[],
  members: readonly PartyMemberValidationSummary[]
): void {
  const knownModes = new Set(
    members.flatMap((member) =>
      member.mode === "pve" || member.mode === "pvp" ? [member.mode] : []
    )
  );
  if (knownModes.size > 1) {
    issues.push({
      code: "party-mixed-known-modes",
      severity: "warning",
      path: "$.slots",
      message: "Party contains both known PvE and PvP members."
    });
  }
}

function countIssues(
  issues: readonly PartyValidationIssue[],
  members: readonly PartyMemberValidationSummary[]
): PartyValidationCounts {
  return {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    info: issues.filter((issue) => issue.severity === "info").length,
    emptySlots: members.filter((member) => member.status === "empty").length,
    unresolvedMembers: members.filter((member) => !member.resolved).length,
    incompleteMembers: members.filter((member) => !member.complete).length,
    unavailableMembers: members.filter((member) => member.status === "catalog-unavailable").length,
    totalIssues: issues.length
  };
}

function severityRank(severity: PartyValidationSeverity): number {
  switch (severity) {
    case "error":
      return 0;
    case "warning":
      return 1;
    case "info":
      return 2;
  }
}
