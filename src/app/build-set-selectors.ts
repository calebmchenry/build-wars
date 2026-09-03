import {
  MAX_BUILD_SET_ENTRIES,
  type BuildSetEntryId,
  type BuildSetEntryKind,
  type GameMode,
  type ProfessionId
} from "../domain";
import type { AppCatalogViews } from "./catalogs";
import { selectEquipmentSummary } from "./equipment-selectors";
import {
  selectSkillSlotDisplays,
  selectValidationView,
  type SkillDisplayView
} from "./editor-selectors";
import { hydrateEditorFromSnapshot } from "./persistence-schema";
import { materializeActiveBuildSetSnapshot, type WorkspaceState } from "./workspace-state";

export type BuildSetEntryAttention = "ok" | "warning" | "error" | "unresolved" | "incomplete";

export interface BuildSetSkillSummary {
  readonly slot: number;
  readonly label: string;
  readonly state: SkillDisplayView["kind"];
}

export interface BuildSetEntrySummary {
  readonly id: BuildSetEntryId;
  readonly label: string;
  readonly kind: BuildSetEntryKind;
  readonly selected: boolean;
  readonly notes: string;
  readonly notesPresent: boolean;
  readonly professionPair: string;
  readonly mode: GameMode;
  readonly modeLabel: string;
  readonly skills: readonly BuildSetSkillSummary[];
  readonly equipmentIndicator: string;
  readonly titleIndicator: string;
  readonly validationStatus: BuildSetEntryAttention;
  readonly issueCount: number;
  readonly unresolved: boolean;
  readonly incomplete: boolean;
  readonly stale: boolean;
  readonly catalogUnavailable: boolean;
}

export interface BuildSetAggregateStatus {
  readonly errors: number;
  readonly warnings: number;
  readonly unresolvedEntries: number;
  readonly incompleteEntries: number;
  readonly staleEntries: number;
  readonly catalogUnavailableEntries: number;
  readonly totalIssues: number;
  readonly summary: string;
}

export interface BuildSetNavigatorView {
  readonly id: string;
  readonly name: string;
  readonly entryCount: number;
  readonly selectedEntryId: BuildSetEntryId | null;
  readonly comparisonEntryId: BuildSetEntryId | null;
  readonly atEntryCap: boolean;
  readonly empty: boolean;
  readonly entries: readonly BuildSetEntrySummary[];
  readonly aggregate: BuildSetAggregateStatus;
}

export function selectBuildSetNavigatorView(
  workspace: WorkspaceState,
  catalogs: AppCatalogViews
): BuildSetNavigatorView | null {
  if (workspace.document.kind !== "build-set") {
    return null;
  }
  const materialized = materializeActiveBuildSetSnapshot(workspace);
  if (materialized === null) {
    return null;
  }
  const entries = materialized.entries.map((entry) => {
    const editor = hydrateEditorFromSnapshot(entry.snapshot);
    const validation = selectValidationView(editor, catalogs).result;
    const equipment = selectEquipmentSummary(editor, catalogs, validation);
    const skillDisplays = selectSkillSlotDisplays(editor, catalogs);
    const catalogUnavailable = validation.issues.some((issue) =>
      issue.code.includes("catalog-unavailable")
    );
    const stale = validation.issues.some((issue) => issue.code.includes("stale"));
    return {
      id: entry.id,
      label: entry.label,
      kind: entry.kind,
      selected: entry.id === materialized.lastSelectedEntryId,
      notes: entry.notes ?? "",
      notesPresent: entry.notes !== null,
      professionPair: professionPair(
        editor.build.primaryProfessionId,
        editor.build.secondaryProfessionId,
        catalogs
      ),
      mode: editor.build.mode,
      modeLabel: editor.build.mode.toUpperCase(),
      skills: skillDisplays.map((skill, index) => ({
        slot: index + 1,
        label: skill.title,
        state: skill.kind
      })),
      equipmentIndicator: equipment.hasMeaningfulEquipment
        ? `${equipment.selectedUpgradeCount} equipment`
        : "no equipment",
      titleIndicator:
        editor.build.titleRankOverrides.length === 0
          ? "default titles"
          : `${editor.build.titleRankOverrides.length} title override${
              editor.build.titleRankOverrides.length === 1 ? "" : "s"
            }`,
      validationStatus: entryAttention(validation),
      issueCount: validation.counts.total,
      unresolved: !validation.resolved,
      incomplete: !validation.complete,
      stale,
      catalogUnavailable
    };
  });
  const aggregate = aggregateStatus(entries);
  return {
    id: workspace.document.id,
    name: materialized.name,
    entryCount: entries.length,
    selectedEntryId: materialized.lastSelectedEntryId,
    comparisonEntryId: workspace.document.comparisonEntryId,
    atEntryCap: entries.length >= MAX_BUILD_SET_ENTRIES,
    empty: entries.length === 0,
    entries,
    aggregate
  };
}

function professionPair(
  primaryProfessionId: ProfessionId | null,
  secondaryProfessionId: ProfessionId | null,
  catalogs: AppCatalogViews
): string {
  return [
    professionName(primaryProfessionId, catalogs),
    professionName(secondaryProfessionId, catalogs)
  ].join(" / ");
}

function professionName(professionId: ProfessionId | null, catalogs: AppCatalogViews): string {
  if (professionId === null) {
    return "None";
  }
  return (
    catalogs.professions.find((profession) => Number(profession.id) === Number(professionId))
      ?.name ?? `Unresolved profession ${Number(professionId)}`
  );
}

function entryAttention(
  validation: ReturnType<typeof selectValidationView>["result"]
): BuildSetEntryAttention {
  if (validation.counts.error > 0) {
    return "error";
  }
  if (!validation.resolved) {
    return "unresolved";
  }
  if (!validation.complete) {
    return "incomplete";
  }
  if (validation.counts.warning > 0) {
    return "warning";
  }
  return "ok";
}

function aggregateStatus(entries: readonly BuildSetEntrySummary[]): BuildSetAggregateStatus {
  const errors = entries.filter((entry) => entry.validationStatus === "error").length;
  const warnings = entries.filter((entry) => entry.validationStatus === "warning").length;
  const unresolvedEntries = entries.filter((entry) => entry.unresolved).length;
  const incompleteEntries = entries.filter((entry) => entry.incomplete).length;
  const staleEntries = entries.filter((entry) => entry.stale).length;
  const catalogUnavailableEntries = entries.filter((entry) => entry.catalogUnavailable).length;
  const totalIssues = entries.reduce((total, entry) => total + entry.issueCount, 0);
  return {
    errors,
    warnings,
    unresolvedEntries,
    incompleteEntries,
    staleEntries,
    catalogUnavailableEntries,
    totalIssues,
    summary:
      entries.length === 0
        ? "empty set"
        : `${errors} error entries, ${warnings} warning entries, ${unresolvedEntries} unresolved, ${incompleteEntries} incomplete, ${staleEntries} stale`
  };
}
