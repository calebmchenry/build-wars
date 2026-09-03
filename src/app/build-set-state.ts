import {
  MAX_BUILD_SET_ENTRIES,
  assignPartySlotEntry,
  authoredDocumentId,
  clearPartyEntryReferences,
  clearPartySlotEntry,
  cloneBuildForBuildSetEntry,
  clonePartyAnnotations,
  createPartyAnnotationsForEntries,
  duplicatePartySlotMetadata,
  normalizeBuildSetEntryLabel,
  normalizeBuildSetEntryNotes,
  normalizeBuildSetName,
  partySizeForSlotCount,
  repairSelectedPartySlotId,
  resetPartySlotMetadata,
  resizePartyAnnotations,
  setPartyEnabled,
  movePartySlot,
  renamePartySlot,
  setPartySlotKind,
  setPartySlotNotes,
  setPartySlotRole,
  uniqueBuildSetEntryLabel,
  type AuthoredDocumentId,
  type BuildSetEntryId,
  type BuildSetEntryKind,
  type PartyAnnotations,
  type PartyMemberKind,
  type PartySlotId
} from "../domain";
import { createBlankEditorState, type EditorState } from "./editor-state";
import {
  clonePersistedBuildSnapshot,
  createPersistedBuildSnapshot,
  hydrateEditorFromSnapshot,
  PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION,
  type PersistedBuildSetEntrySnapshot,
  type PersistedBuildSetSnapshot,
  type PersistedBuildSnapshot
} from "./persistence-schema";

export interface RuntimeBuildSetEntry {
  readonly id: BuildSetEntryId;
  readonly label: string;
  readonly kind: BuildSetEntryKind;
  readonly notes: string | null;
  readonly snapshot: PersistedBuildSnapshot | null;
}

export interface RuntimeBuildSetDocument {
  readonly kind: "build-set";
  readonly id: AuthoredDocumentId;
  readonly name: string;
  readonly entries: readonly RuntimeBuildSetEntry[];
  readonly selectedEntryId: BuildSetEntryId | null;
  readonly comparisonEntryId: BuildSetEntryId | null;
  readonly party: PartyAnnotations | null;
  readonly selectedPartySlotId: PartySlotId | null;
}

export interface MaterializedBuildSetEntry extends PersistedBuildSetEntrySnapshot {
  readonly selected: boolean;
}

export interface MaterializedBuildSetView {
  readonly snapshot: PersistedBuildSetSnapshot;
  readonly entries: readonly MaterializedBuildSetEntry[];
}

export function createBuildSetFromEditor(input: {
  readonly editor: EditorState;
  readonly setId: AuthoredDocumentId;
  readonly entryId: BuildSetEntryId;
  readonly name?: string;
  readonly label?: string;
}): RuntimeBuildSetDocument {
  return {
    kind: "build-set",
    id: input.setId,
    name: normalizeBuildSetName(input.name ?? `${input.editor.build.name} Set`),
    selectedEntryId: input.entryId,
    comparisonEntryId: null,
    party: null,
    selectedPartySlotId: null,
    entries: [
      {
        id: input.entryId,
        label: normalizeBuildSetEntryLabel(input.label ?? input.editor.build.name),
        kind: "build",
        notes: null,
        snapshot: null
      }
    ]
  };
}

export function createEmptyBuildSet(input: {
  readonly setId: AuthoredDocumentId;
  readonly name?: string;
}): RuntimeBuildSetDocument {
  return {
    kind: "build-set",
    id: input.setId,
    name: normalizeBuildSetName(input.name ?? "Untitled Build Set"),
    selectedEntryId: null,
    comparisonEntryId: null,
    party: null,
    selectedPartySlotId: null,
    entries: []
  };
}

export function hydrateRuntimeBuildSet(snapshot: PersistedBuildSetSnapshot): {
  readonly document: RuntimeBuildSetDocument;
  readonly editor: EditorState;
} {
  const party = snapshot.party === null ? null : clonePartyAnnotations(snapshot.party);
  const selectedPartySlotId = repairSelectedPartySlotId(party, snapshot.lastSelectedPartySlotId);
  const selectedEntryId =
    party?.enabled === true
      ? entryIdForPartySlot(party, selectedPartySlotId, snapshot.entries)
      : repairSelected(snapshot.entries, snapshot.lastSelectedEntryId);
  const selectedEntry =
    selectedEntryId === null
      ? null
      : (snapshot.entries.find((entry) => entry.id === selectedEntryId) ?? null);
  const editor =
    selectedEntry === null
      ? createBlankEditorState("Untitled Build")
      : hydrateEditorFromSnapshot(selectedEntry.snapshot);
  return {
    editor,
    document: {
      kind: "build-set",
      id: snapshot.id,
      name: normalizeBuildSetName(snapshot.name),
      selectedEntryId,
      comparisonEntryId: comparisonAfterSelectionChange(snapshot.entries, selectedEntryId, null),
      party,
      selectedPartySlotId,
      entries: snapshot.entries.map((entry) => ({
        id: entry.id,
        label: normalizeBuildSetEntryLabel(entry.label),
        kind: entry.kind,
        notes: normalizeBuildSetEntryNotes(entry.notes),
        snapshot: entry.id === selectedEntryId ? null : clonePersistedBuildSnapshot(entry.snapshot)
      }))
    }
  };
}

export function materializeBuildSetSnapshot(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState
): MaterializedBuildSetView {
  const lastSelectedPartySlotId = repairSelectedPartySlotId(
    document.party,
    document.selectedPartySlotId
  );
  const lastSelectedEntryId =
    document.party?.enabled === true
      ? entryIdForPartySlot(document.party, lastSelectedPartySlotId, document.entries)
      : repairSelected(document.entries, document.selectedEntryId);
  const entries = document.entries.map((entry) => {
    const snapshot =
      entry.id === lastSelectedEntryId
        ? createPersistedBuildSnapshot(activeEditor)
        : requireInactiveSnapshot(entry);
    return {
      id: entry.id,
      label: normalizeBuildSetEntryLabel(entry.label),
      kind: entry.kind,
      notes: normalizeBuildSetEntryNotes(entry.notes),
      snapshot: clonePersistedBuildSnapshot(snapshot),
      selected: entry.id === lastSelectedEntryId
    };
  });
  const snapshot: PersistedBuildSetSnapshot = {
    schemaVersion: PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION,
    id: document.id,
    name: normalizeBuildSetName(document.name),
    entries,
    lastSelectedEntryId,
    party: document.party === null ? null : clonePartyAnnotations(document.party),
    lastSelectedPartySlotId
  };
  return { snapshot, entries };
}

export function selectBuildSetEntry(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  entryId: BuildSetEntryId
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (document.selectedEntryId === entryId) {
    return { document, editor: activeEditor };
  }
  const partySlotId =
    document.party?.enabled === true
      ? (document.party.slots.find((slot) => slot.entryId === entryId)?.id ?? null)
      : null;
  if (document.party?.enabled === true && partySlotId === null) {
    return { document, editor: activeEditor };
  }
  const target = document.entries.find((entry) => entry.id === entryId);
  if (target === undefined || target.snapshot === null) {
    return { document, editor: activeEditor };
  }
  const activeSnapshot = createPersistedBuildSnapshot(activeEditor);
  const entries = document.entries.map((entry) => {
    if (entry.id === document.selectedEntryId) {
      return { ...entry, snapshot: activeSnapshot };
    }
    if (entry.id === entryId) {
      return { ...entry, snapshot: null };
    }
    return entry;
  });
  return {
    editor: hydrateEditorFromSnapshot(target.snapshot),
    document: {
      ...document,
      entries,
      selectedEntryId: entryId,
      selectedPartySlotId: partySlotId ?? document.selectedPartySlotId,
      comparisonEntryId: comparisonAfterSelectionChange(
        entries,
        entryId,
        document.comparisonEntryId
      )
    }
  };
}

export function addBlankBuildSetEntry(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  input: {
    readonly entryId: BuildSetEntryId;
    readonly buildId: AuthoredDocumentId;
    readonly label?: string;
  }
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (document.entries.length >= MAX_BUILD_SET_ENTRIES) {
    return { document, editor: activeEditor };
  }
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const blank = createBlankEditorState(input.label ?? "Untitled Loadout");
  const editor = {
    ...blank,
    build: {
      ...blank.build,
      id: input.buildId,
      name: normalizeBuildSetEntryLabel(input.label ?? blank.build.name)
    }
  };
  const entry: RuntimeBuildSetEntry = {
    id: input.entryId,
    label: uniqueBuildSetEntryLabel(materialized, input.label ?? "Untitled Loadout", input.entryId),
    kind: "build",
    notes: null,
    snapshot: null
  };
  if (document.party?.enabled === true) {
    return {
      editor: activeEditor,
      document: {
        ...document,
        entries: [
          ...runtimeEntriesFromMaterialized(materialized, document.selectedEntryId),
          { ...entry, snapshot: createPersistedBuildSnapshot(editor) }
        ],
        comparisonEntryId: comparisonAfterSelectionChange(
          materialized,
          document.selectedEntryId,
          document.comparisonEntryId
        )
      }
    };
  }
  return {
    editor,
    document: {
      ...document,
      entries: [...materialized.map(toInactiveRuntimeEntry), entry],
      selectedEntryId: input.entryId,
      comparisonEntryId: comparisonAfterSelectionChange(
        materialized,
        input.entryId,
        document.comparisonEntryId
      )
    }
  };
}

export function copySnapshotIntoBuildSet(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  input: {
    readonly entryId: BuildSetEntryId;
    readonly buildId: AuthoredDocumentId;
    readonly snapshot: PersistedBuildSnapshot;
    readonly label?: string;
    readonly kind?: BuildSetEntryKind;
  }
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (document.entries.length >= MAX_BUILD_SET_ENTRIES) {
    return { document, editor: activeEditor };
  }
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const cloned = clonePersistedBuildSnapshot(input.snapshot);
  const copiedSnapshot = {
    ...cloned,
    build: cloneBuildForBuildSetEntry(cloned.build, input.buildId)
  };
  const entry: RuntimeBuildSetEntry = {
    id: input.entryId,
    label: uniqueBuildSetEntryLabel(
      materialized,
      input.label ?? copiedSnapshot.build.name,
      input.entryId
    ),
    kind: input.kind ?? "build",
    notes: null,
    snapshot: null
  };
  if (document.party?.enabled === true) {
    return {
      editor: activeEditor,
      document: {
        ...document,
        entries: [
          ...runtimeEntriesFromMaterialized(materialized, document.selectedEntryId),
          { ...entry, snapshot: copiedSnapshot }
        ],
        comparisonEntryId: comparisonAfterSelectionChange(
          materialized,
          document.selectedEntryId,
          document.comparisonEntryId
        )
      }
    };
  }
  return {
    editor: hydrateEditorFromSnapshot(copiedSnapshot),
    document: {
      ...document,
      entries: [...materialized.map(toInactiveRuntimeEntry), entry],
      selectedEntryId: input.entryId,
      comparisonEntryId: comparisonAfterSelectionChange(
        materialized,
        input.entryId,
        document.comparisonEntryId
      )
    }
  };
}

export function duplicateSelectedBuildSetEntry(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  input: {
    readonly entryId: BuildSetEntryId;
    readonly buildId: AuthoredDocumentId;
  }
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  const selected = selectedRuntimeEntry(document);
  if (selected === null || document.entries.length >= MAX_BUILD_SET_ENTRIES) {
    return { document, editor: activeEditor };
  }
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const sourceIndex = materialized.findIndex((entry) => entry.id === selected.id);
  const source = materialized[sourceIndex];
  if (source === undefined) {
    return { document, editor: activeEditor };
  }
  const copiedBuild = cloneBuildForBuildSetEntry(source.snapshot.build, input.buildId);
  const snapshot = clonePersistedBuildSnapshot({
    ...source.snapshot,
    build: {
      ...copiedBuild,
      name: uniqueBuildSetEntryLabel(materialized, `${source.label} Variant`, input.entryId)
    }
  });
  const entry: RuntimeBuildSetEntry = {
    id: input.entryId,
    label: snapshot.build.name,
    kind: "variant",
    notes: source.notes,
    snapshot: null
  };
  const nextEntries = [
    ...materialized.slice(0, sourceIndex + 1).map(toInactiveRuntimeEntry),
    entry,
    ...materialized.slice(sourceIndex + 1).map(toInactiveRuntimeEntry)
  ];
  return {
    editor: hydrateEditorFromSnapshot(snapshot),
    document: {
      ...document,
      entries: nextEntries,
      selectedEntryId: input.entryId,
      comparisonEntryId: source.id
    }
  };
}

export function removeBuildSetRuntimeEntry(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  entryId: BuildSetEntryId
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const filtered = materialized.filter((entry) => entry.id !== entryId);
  if (filtered.length === materialized.length) {
    return { document, editor: activeEditor };
  }
  const party = document.party === null ? null : clearPartyEntryReferences(document.party, entryId);
  const removedSelected = document.selectedEntryId === entryId;
  const selectedPartySlotId = repairSelectedPartySlotId(party, document.selectedPartySlotId);
  const selectedEntryId =
    party?.enabled === true
      ? entryIdForPartySlot(party, selectedPartySlotId, filtered)
      : removedSelected
        ? (filtered[0]?.id ?? null)
        : document.selectedEntryId;
  const selected =
    selectedEntryId === null
      ? null
      : (filtered.find((entry) => entry.id === selectedEntryId) ?? null);
  return {
    editor:
      selected === null
        ? createBlankEditorState("Untitled Build")
        : hydrateEditorFromSnapshot(selected.snapshot),
    document: {
      ...document,
      party,
      selectedPartySlotId,
      entries: filtered.map((entry) => ({
        ...toInactiveRuntimeEntry(entry),
        snapshot: entry.id === selectedEntryId ? null : clonePersistedBuildSnapshot(entry.snapshot)
      })),
      selectedEntryId,
      comparisonEntryId:
        document.comparisonEntryId === entryId
          ? comparisonAfterSelectionChange(filtered, selectedEntryId, null)
          : comparisonAfterSelectionChange(filtered, selectedEntryId, document.comparisonEntryId)
    }
  };
}

export function moveBuildSetRuntimeEntry(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  entryId: BuildSetEntryId,
  direction: "earlier" | "later"
): RuntimeBuildSetDocument {
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const index = materialized.findIndex((entry) => entry.id === entryId);
  const target = direction === "earlier" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= materialized.length) {
    return document;
  }
  const next = [...materialized];
  const [removed] = next.splice(index, 1);
  if (removed === undefined) {
    return document;
  }
  next.splice(target, 0, removed);
  return {
    ...document,
    entries: next.map((entry) => ({
      ...toInactiveRuntimeEntry(entry),
      snapshot:
        entry.id === document.selectedEntryId ? null : clonePersistedBuildSnapshot(entry.snapshot)
    }))
  };
}

export function renameBuildSetRuntimeEntry(
  document: RuntimeBuildSetDocument,
  entryId: BuildSetEntryId,
  label: string
): RuntimeBuildSetDocument {
  return {
    ...document,
    entries: document.entries.map((entry) =>
      entry.id === entryId
        ? { ...entry, label: uniqueBuildSetEntryLabel(document.entries, label, entryId) }
        : entry
    )
  };
}

export function setBuildSetRuntimeEntryNotes(
  document: RuntimeBuildSetDocument,
  entryId: BuildSetEntryId,
  notes: string | null
): RuntimeBuildSetDocument {
  return {
    ...document,
    entries: document.entries.map((entry) =>
      entry.id === entryId ? { ...entry, notes: normalizeBuildSetEntryNotes(notes) } : entry
    )
  };
}

export function setBuildSetRuntimeEntryKind(
  document: RuntimeBuildSetDocument,
  entryId: BuildSetEntryId,
  kind: BuildSetEntryKind
): RuntimeBuildSetDocument {
  return {
    ...document,
    entries: document.entries.map((entry) => (entry.id === entryId ? { ...entry, kind } : entry))
  };
}

export function setBuildSetComparisonEntry(
  document: RuntimeBuildSetDocument,
  comparisonEntryId: BuildSetEntryId | null
): RuntimeBuildSetDocument {
  return {
    ...document,
    comparisonEntryId: comparisonAfterSelectionChange(
      document.entries,
      document.selectedEntryId,
      comparisonEntryId
    )
  };
}

export function enableRuntimeParty(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  input: {
    readonly slotIds?: readonly PartySlotId[];
  } = {}
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const party =
    document.party === null
      ? createPartyAnnotationsForEntries(
          input.slotIds === undefined
            ? {
                entries: materialized,
                enabled: true
              }
            : {
                entries: materialized,
                slotIds: input.slotIds,
                enabled: true
              }
        )
      : setPartyEnabled(document.party, true);
  const selectedPartySlotId =
    party.slots.find((slot) => slot.entryId === document.selectedEntryId)?.id ??
    repairSelectedPartySlotId(party, document.selectedPartySlotId);
  return selectPartySlotFromMaterialized(
    {
      ...document,
      entries: runtimeEntriesFromMaterialized(materialized, document.selectedEntryId),
      party,
      selectedPartySlotId
    },
    activeEditor,
    selectedPartySlotId
  );
}

export function disableRuntimeParty(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (document.party === null) {
    return { document, editor: activeEditor };
  }
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const party = setPartyEnabled(document.party, false);
  const selectedEntryId = repairSelected(materialized, document.selectedEntryId);
  const selected =
    selectedEntryId === null
      ? null
      : (materialized.find((entry) => entry.id === selectedEntryId) ?? null);
  return {
    editor:
      selected === null
        ? createBlankEditorState("Untitled Build")
        : hydrateEditorFromSnapshot(selected.snapshot),
    document: {
      ...document,
      party,
      selectedPartySlotId: repairSelectedPartySlotId(party, document.selectedPartySlotId),
      selectedEntryId,
      comparisonEntryId: comparisonAfterSelectionChange(
        materialized,
        selectedEntryId,
        document.comparisonEntryId
      ),
      entries: runtimeEntriesFromMaterialized(materialized, selectedEntryId)
    }
  };
}

export function resetRuntimeParty(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  confirmed: boolean
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (!confirmed || document.party === null) {
    return { document, editor: activeEditor };
  }
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const selectedEntryId = repairSelected(materialized, document.selectedEntryId);
  const selected =
    selectedEntryId === null
      ? null
      : (materialized.find((entry) => entry.id === selectedEntryId) ?? null);
  return {
    editor:
      selected === null
        ? createBlankEditorState("Untitled Build")
        : hydrateEditorFromSnapshot(selected.snapshot),
    document: {
      ...document,
      party: null,
      selectedPartySlotId: null,
      selectedEntryId,
      comparisonEntryId: comparisonAfterSelectionChange(
        materialized,
        selectedEntryId,
        document.comparisonEntryId
      ),
      entries: runtimeEntriesFromMaterialized(materialized, selectedEntryId)
    }
  };
}

export function selectRuntimePartySlot(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  slotId: PartySlotId
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (document.party?.enabled !== true) {
    return { document, editor: activeEditor };
  }
  const materialized = materializeRuntimeEntries(document, activeEditor);
  return selectPartySlotFromMaterialized(
    {
      ...document,
      entries: runtimeEntriesFromMaterialized(materialized, document.selectedEntryId)
    },
    activeEditor,
    slotId
  );
}

export function renameRuntimePartySlot(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  slotId: PartySlotId,
  memberLabel: string
): RuntimeBuildSetDocument {
  return mutateParty(document, activeEditor, (party) =>
    renamePartySlot(party, slotId, memberLabel)
  );
}

export function setRuntimePartySlotRole(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  slotId: PartySlotId,
  role: string | null
): RuntimeBuildSetDocument {
  return mutateParty(document, activeEditor, (party) => setPartySlotRole(party, slotId, role));
}

export function setRuntimePartySlotKind(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  slotId: PartySlotId,
  memberKind: PartyMemberKind,
  memberKindLabel: string | null
): RuntimeBuildSetDocument {
  return mutateParty(document, activeEditor, (party) =>
    setPartySlotKind(party, slotId, memberKind, memberKindLabel)
  );
}

export function setRuntimePartySlotNotes(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  slotId: PartySlotId,
  notes: string | null
): RuntimeBuildSetDocument {
  return mutateParty(document, activeEditor, (party) => setPartySlotNotes(party, slotId, notes));
}

export function resetRuntimePartySlotMetadata(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  slotId: PartySlotId
): RuntimeBuildSetDocument {
  return mutateParty(document, activeEditor, (party) => resetPartySlotMetadata(party, slotId));
}

export function moveRuntimePartySlot(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  slotId: PartySlotId,
  direction: "earlier" | "later"
): RuntimeBuildSetDocument {
  return mutateParty(document, activeEditor, (party) => movePartySlot(party, slotId, direction));
}

export function resizeRuntimeParty(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  size: number,
  slotIds: readonly PartySlotId[] = []
): RuntimeBuildSetDocument {
  return mutateParty(document, activeEditor, (party) =>
    resizePartyAnnotations(party, { size: partySizeForSlotCount(size), slotIds })
  );
}

export function assignRuntimePartySlot(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  slotId: PartySlotId,
  entryId: BuildSetEntryId
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (document.party?.enabled !== true) {
    return { document, editor: activeEditor };
  }
  const party = assignPartySlotEntry(document.party, slotId, entryId);
  return selectRuntimePartySlot({ ...document, party }, activeEditor, slotId);
}

export function clearRuntimePartySlot(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  slotId: PartySlotId
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (document.party?.enabled !== true) {
    return { document, editor: activeEditor };
  }
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const party = clearPartySlotEntry(document.party, slotId);
  return selectPartySlotFromMaterialized(
    {
      ...document,
      party,
      entries: runtimeEntriesFromMaterialized(materialized, null)
    },
    createBlankEditorState("Untitled Build"),
    slotId
  );
}

export function createRuntimePartyMember(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  input: {
    readonly slotId: PartySlotId;
    readonly entryId: BuildSetEntryId;
    readonly buildId: AuthoredDocumentId;
    readonly label?: string;
  }
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (document.party?.enabled !== true || document.entries.length >= MAX_BUILD_SET_ENTRIES) {
    return { document, editor: activeEditor };
  }
  const slot = document.party.slots.find((candidate) => candidate.id === input.slotId);
  if (slot === undefined || slot.entryId !== null) {
    return { document, editor: activeEditor };
  }
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const blank = createBlankEditorState(input.label ?? slot.memberLabel);
  const editor = {
    ...blank,
    build: {
      ...blank.build,
      id: input.buildId,
      name: normalizeBuildSetEntryLabel(input.label ?? slot.memberLabel)
    }
  };
  const entry: RuntimeBuildSetEntry = {
    id: input.entryId,
    label: uniqueBuildSetEntryLabel(materialized, input.label ?? slot.memberLabel, input.entryId),
    kind: "build",
    notes: null,
    snapshot: null
  };
  const party = assignPartySlotEntry(document.party, input.slotId, input.entryId);
  return {
    editor,
    document: {
      ...document,
      party,
      selectedPartySlotId: input.slotId,
      selectedEntryId: input.entryId,
      comparisonEntryId: comparisonAfterSelectionChange(
        materialized,
        input.entryId,
        document.comparisonEntryId
      ),
      entries: [...runtimeEntriesFromMaterialized(materialized, null), entry]
    }
  };
}

export function duplicateRuntimePartyMember(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  input: {
    readonly sourceSlotId: PartySlotId;
    readonly targetSlotId: PartySlotId;
    readonly entryId: BuildSetEntryId;
    readonly buildId: AuthoredDocumentId;
  }
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (document.party?.enabled !== true || document.entries.length >= MAX_BUILD_SET_ENTRIES) {
    return { document, editor: activeEditor };
  }
  const sourceSlot = document.party.slots.find((slot) => slot.id === input.sourceSlotId);
  const targetSlot = document.party.slots.find((slot) => slot.id === input.targetSlotId);
  if (
    sourceSlot?.entryId === null ||
    sourceSlot?.entryId === undefined ||
    targetSlot?.entryId !== null
  ) {
    return { document, editor: activeEditor };
  }
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const source = materialized.find((entry) => entry.id === sourceSlot.entryId);
  if (source === undefined) {
    return { document, editor: activeEditor };
  }
  const copiedBuild = cloneBuildForBuildSetEntry(source.snapshot.build, input.buildId);
  const label = uniqueBuildSetEntryLabel(materialized, `${source.label} Copy`, input.entryId);
  const snapshot = clonePersistedBuildSnapshot({
    ...source.snapshot,
    build: {
      ...copiedBuild,
      name: label
    }
  });
  const entry: RuntimeBuildSetEntry = {
    id: input.entryId,
    label,
    kind: "variant",
    notes: source.notes,
    snapshot: null
  };
  const party = assignPartySlotEntry(
    renamePartySlot(
      duplicatePartySlotMetadata(document.party, input.sourceSlotId, input.targetSlotId),
      input.targetSlotId,
      label
    ),
    input.targetSlotId,
    input.entryId
  );
  return {
    editor: hydrateEditorFromSnapshot(snapshot),
    document: {
      ...document,
      party,
      selectedPartySlotId: input.targetSlotId,
      selectedEntryId: input.entryId,
      comparisonEntryId: source.id,
      entries: [...runtimeEntriesFromMaterialized(materialized, null), entry]
    }
  };
}

export function hydratedBuildSetFromTransfer(snapshot: PersistedBuildSetSnapshot): {
  readonly document: RuntimeBuildSetDocument;
  readonly editor: EditorState;
} {
  return hydrateRuntimeBuildSet({
    ...snapshot,
    id: snapshot.id ?? authoredDocumentId("build-set:imported")
  });
}

function materializeRuntimeEntries(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState
): readonly PersistedBuildSetEntrySnapshot[] {
  return materializeBuildSetSnapshot(document, activeEditor).entries;
}

function requireInactiveSnapshot(entry: RuntimeBuildSetEntry): PersistedBuildSnapshot {
  if (entry.snapshot === null) {
    throw new Error(`Inactive build-set entry ${entry.id} is missing a persisted snapshot.`);
  }
  return entry.snapshot;
}

function runtimeEntriesFromMaterialized(
  entries: readonly PersistedBuildSetEntrySnapshot[],
  selectedEntryId: BuildSetEntryId | null
): readonly RuntimeBuildSetEntry[] {
  return entries.map((entry) => ({
    ...toInactiveRuntimeEntry(entry),
    snapshot: entry.id === selectedEntryId ? null : clonePersistedBuildSnapshot(entry.snapshot)
  }));
}

function toInactiveRuntimeEntry(entry: PersistedBuildSetEntrySnapshot): RuntimeBuildSetEntry {
  return {
    id: entry.id,
    label: entry.label,
    kind: entry.kind,
    notes: entry.notes,
    snapshot: clonePersistedBuildSnapshot(entry.snapshot)
  };
}

function selectedRuntimeEntry(document: RuntimeBuildSetDocument): RuntimeBuildSetEntry | null {
  return document.selectedEntryId === null
    ? null
    : (document.entries.find((entry) => entry.id === document.selectedEntryId) ?? null);
}

function entryIdForPartySlot(
  party: PartyAnnotations | null,
  selectedSlotId: PartySlotId | null,
  entries: readonly { readonly id: BuildSetEntryId }[]
): BuildSetEntryId | null {
  if (party === null || selectedSlotId === null) {
    return null;
  }
  const entryId = party.slots.find((slot) => slot.id === selectedSlotId)?.entryId ?? null;
  return entryId !== null && entries.some((entry) => entry.id === entryId) ? entryId : null;
}

function selectPartySlotFromMaterialized(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  slotId: PartySlotId | null
): { readonly document: RuntimeBuildSetDocument; readonly editor: EditorState } {
  if (document.party?.enabled !== true || slotId === null) {
    return { document, editor: activeEditor };
  }
  const slot = document.party.slots.find((candidate) => candidate.id === slotId);
  if (slot === undefined) {
    return { document, editor: activeEditor };
  }
  const selectedEntryId = entryIdForPartySlot(document.party, slotId, document.entries);
  const selected =
    selectedEntryId === null
      ? null
      : (document.entries.find((entry) => entry.id === selectedEntryId) ?? null);
  return {
    editor:
      selected === null
        ? createBlankEditorState("Untitled Build")
        : selected.snapshot === null
          ? activeEditor
          : hydrateEditorFromSnapshot(selected.snapshot),
    document: {
      ...document,
      selectedPartySlotId: slotId,
      selectedEntryId,
      comparisonEntryId: comparisonAfterSelectionChange(
        document.entries,
        selectedEntryId,
        document.comparisonEntryId
      ),
      entries: document.entries.map((entry) => ({
        ...entry,
        snapshot:
          entry.id === selectedEntryId
            ? null
            : entry.snapshot === null
              ? createPersistedBuildSnapshot(activeEditor)
              : clonePersistedBuildSnapshot(entry.snapshot)
      }))
    }
  };
}

function mutateParty(
  document: RuntimeBuildSetDocument,
  activeEditor: EditorState,
  mutate: (party: PartyAnnotations) => PartyAnnotations
): RuntimeBuildSetDocument {
  if (document.party === null) {
    return document;
  }
  const materialized = materializeRuntimeEntries(document, activeEditor);
  const party = mutate(document.party);
  const selectedPartySlotId = repairSelectedPartySlotId(party, document.selectedPartySlotId);
  const selectedEntryId =
    party.enabled === true
      ? entryIdForPartySlot(party, selectedPartySlotId, materialized)
      : repairSelected(materialized, document.selectedEntryId);
  return {
    ...document,
    party,
    selectedPartySlotId,
    selectedEntryId,
    comparisonEntryId: comparisonAfterSelectionChange(
      materialized,
      selectedEntryId,
      document.comparisonEntryId
    ),
    entries: runtimeEntriesFromMaterialized(materialized, selectedEntryId)
  };
}

function repairSelected(
  entries: readonly { readonly id: BuildSetEntryId }[],
  selectedEntryId: BuildSetEntryId | null
): BuildSetEntryId | null {
  if (entries.length === 0) {
    return null;
  }
  if (selectedEntryId !== null && entries.some((entry) => entry.id === selectedEntryId)) {
    return selectedEntryId;
  }
  return entries[0]?.id ?? null;
}

function comparisonAfterSelectionChange(
  entries: readonly { readonly id: BuildSetEntryId }[],
  selectedEntryId: BuildSetEntryId | null,
  comparisonEntryId: BuildSetEntryId | null
): BuildSetEntryId | null {
  if (selectedEntryId === null || entries.length < 2) {
    return null;
  }
  if (
    comparisonEntryId !== null &&
    comparisonEntryId !== selectedEntryId &&
    entries.some((entry) => entry.id === comparisonEntryId)
  ) {
    return comparisonEntryId;
  }
  return entries.find((entry) => entry.id !== selectedEntryId)?.id ?? null;
}
