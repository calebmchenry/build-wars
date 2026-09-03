import {
  MAX_PARTY_SLOTS,
  PARTY_SIZE_PRESETS,
  unassignedPartyEntryIds,
  type BuildSetEntryId,
  type GameMode,
  type PartyMemberKind,
  type PartySlotId
} from "../domain";
import type { AppCatalogViews } from "./catalogs";
import { selectEquipmentSummary } from "./equipment-selectors";
import { selectSkillSlotDisplays, type SkillDisplayView } from "./editor-selectors";
import {
  hydrateEditorFromSnapshot,
  type PersistedBuildSetEntrySnapshot
} from "./persistence-schema";
import { selectPartyValidationView, type PartyValidationView } from "./party-validation";
import { materializeActiveBuildSetSnapshot, type WorkspaceState } from "./workspace-state";

export interface PartySkillSummary {
  readonly slot: number;
  readonly label: string;
  readonly state: SkillDisplayView["kind"];
}

export interface PartySlotView {
  readonly id: PartySlotId;
  readonly ordinal: number;
  readonly entryId: BuildSetEntryId | null;
  readonly memberLabel: string;
  readonly role: string;
  readonly rolePresent: boolean;
  readonly memberKind: PartyMemberKind;
  readonly kindLabel: string;
  readonly notes: string;
  readonly notesPresent: boolean;
  readonly occupied: boolean;
  readonly selected: boolean;
  readonly entryLabel: string | null;
  readonly entryKind: string | null;
  readonly entryNotesPresent: boolean;
  readonly professionPair: string;
  readonly mode: GameMode | "empty";
  readonly modeLabel: string;
  readonly skills: readonly PartySkillSummary[];
  readonly equipmentIndicator: string;
  readonly titleIndicator: string;
  readonly status: string;
  readonly issueCount: number;
  readonly canMoveEarlier: boolean;
  readonly canMoveLater: boolean;
  readonly canClear: boolean;
  readonly canDuplicateIntoEmptySlot: boolean;
}

export interface PartyUnassignedEntryView {
  readonly id: BuildSetEntryId;
  readonly label: string;
  readonly kind: string;
  readonly professionPair: string;
  readonly modeLabel: string;
}

export interface PartyWorkspaceView {
  readonly setName: string;
  readonly enabled: boolean;
  readonly dormant: boolean;
  readonly slotCount: number;
  readonly occupiedCount: number;
  readonly emptyCount: number;
  readonly selectedSlotId: PartySlotId | null;
  readonly selectedEntryId: BuildSetEntryId | null;
  readonly sizeValue: number;
  readonly presetSizes: readonly number[];
  readonly atSlotCap: boolean;
  readonly slots: readonly PartySlotView[];
  readonly unassignedEntries: readonly PartyUnassignedEntryView[];
  readonly validation: PartyValidationView | null;
}

export function selectPartyWorkspaceView(
  workspace: WorkspaceState,
  catalogs: AppCatalogViews
): PartyWorkspaceView | null {
  if (workspace.document.kind !== "build-set") {
    return null;
  }
  const snapshot = materializeActiveBuildSetSnapshot(workspace);
  if (snapshot === null || snapshot.party === null) {
    return null;
  }
  const party = snapshot.party;
  const validation = selectPartyValidationView(snapshot, catalogs);
  const emptySlotAvailable = party.slots.some((slot) => slot.entryId === null);
  const slots = party.slots.map((slot, index): PartySlotView => {
    const entry =
      slot.entryId === null
        ? null
        : (snapshot.entries.find((candidate) => candidate.id === slot.entryId) ?? null);
    const editor = entry === null ? null : hydrateEditorFromSnapshot(entry.snapshot);
    const memberValidation = validation?.members.find((member) => member.slotId === slot.id);
    const validationResult = memberValidation?.validation?.result;
    const skillDisplays = editor === null ? [] : selectSkillSlotDisplays(editor, catalogs);
    const equipment =
      editor === null || validationResult === undefined
        ? null
        : selectEquipmentSummary(editor, catalogs, validationResult);
    const selected = slot.id === snapshot.lastSelectedPartySlotId;
    return {
      id: slot.id,
      ordinal: index + 1,
      entryId: slot.entryId,
      memberLabel: slot.memberLabel,
      role: slot.role ?? "",
      rolePresent: slot.role !== null,
      memberKind: slot.memberKind,
      kindLabel:
        slot.memberKind === "freeform" ? (slot.memberKindLabel ?? "freeform") : slot.memberKind,
      notes: slot.notes ?? "",
      notesPresent: slot.notes !== null,
      occupied: entry !== null,
      selected,
      entryLabel: entry?.label ?? null,
      entryKind: entry?.kind ?? null,
      entryNotesPresent: entry?.notes !== null && entry?.notes !== undefined,
      professionPair: editor === null ? "Empty" : professionPair(editor, catalogs),
      mode: editor === null ? "empty" : editor.build.mode,
      modeLabel: editor === null ? "Empty" : editor.build.mode.toUpperCase(),
      skills: skillDisplays.map((skill, skillIndex) => ({
        slot: skillIndex + 1,
        label: skill.title,
        state: skill.kind
      })),
      equipmentIndicator:
        editor === null
          ? "no loadout"
          : equipment?.hasMeaningfulEquipment === true
            ? "equipment"
            : "no equipment",
      titleIndicator:
        editor === null
          ? "no loadout"
          : editor.build.titleRankOverrides.length === 0
            ? "default titles"
            : `${editor.build.titleRankOverrides.length} title override${
                editor.build.titleRankOverrides.length === 1 ? "" : "s"
              }`,
      status: memberValidation?.status ?? (entry === null ? "empty" : "ok"),
      issueCount: memberValidation?.issueCount ?? 0,
      canMoveEarlier: index > 0,
      canMoveLater: index < party.slots.length - 1,
      canClear: slot.entryId !== null,
      canDuplicateIntoEmptySlot: slot.entryId !== null && emptySlotAvailable
    };
  });
  const unassignedIds = unassignedPartyEntryIds(party, snapshot.entries);
  const unassignedEntries = unassignedIds.flatMap((entryId) => {
    const entry = snapshot.entries.find((candidate) => candidate.id === entryId);
    return entry === undefined ? [] : [unassignedEntryView(entry, catalogs)];
  });
  return {
    setName: snapshot.name,
    enabled: party.enabled,
    dormant: !party.enabled,
    slotCount: party.slots.length,
    occupiedCount: slots.filter((slot) => slot.occupied).length,
    emptyCount: slots.filter((slot) => !slot.occupied).length,
    selectedSlotId: snapshot.lastSelectedPartySlotId,
    selectedEntryId: snapshot.lastSelectedEntryId,
    sizeValue: party.size.size,
    presetSizes: PARTY_SIZE_PRESETS,
    atSlotCap: party.slots.length >= MAX_PARTY_SLOTS,
    slots,
    unassignedEntries,
    validation
  };
}

function unassignedEntryView(
  entry: PersistedBuildSetEntrySnapshot,
  catalogs: AppCatalogViews
): PartyUnassignedEntryView {
  const editor = hydrateEditorFromSnapshot(entry.snapshot);
  return {
    id: entry.id,
    label: entry.label,
    kind: entry.kind,
    professionPair: professionPair(editor, catalogs),
    modeLabel: editor.build.mode.toUpperCase()
  };
}

function professionPair(
  editor: ReturnType<typeof hydrateEditorFromSnapshot>,
  catalogs: AppCatalogViews
): string {
  return [
    professionName(editor.build.primaryProfessionId, catalogs),
    professionName(editor.build.secondaryProfessionId, catalogs)
  ].join(" / ");
}

function professionName(
  professionId: ReturnType<typeof hydrateEditorFromSnapshot>["build"]["primaryProfessionId"],
  catalogs: AppCatalogViews
): string {
  if (professionId === null) {
    return "None";
  }
  return (
    catalogs.professions.find((profession) => Number(profession.id) === Number(professionId))
      ?.name ?? `Unresolved profession ${Number(professionId)}`
  );
}
