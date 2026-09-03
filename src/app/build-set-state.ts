import {
  BUILD_SET_SCHEMA_VERSION,
  MAX_BUILD_SET_ENTRIES,
  authoredDocumentId,
  cloneBuildForBuildSetEntry,
  normalizeBuildSetEntryLabel,
  normalizeBuildSetEntryNotes,
  normalizeBuildSetName,
  uniqueBuildSetEntryLabel,
  type AuthoredDocumentId,
  type BuildSetEntryId,
  type BuildSetEntryKind
} from "../domain";
import { createBlankEditorState, type EditorState } from "./editor-state";
import {
  clonePersistedBuildSnapshot,
  createPersistedBuildSnapshot,
  hydrateEditorFromSnapshot,
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
    entries: []
  };
}

export function hydrateRuntimeBuildSet(snapshot: PersistedBuildSetSnapshot): {
  readonly document: RuntimeBuildSetDocument;
  readonly editor: EditorState;
} {
  const selectedEntryId = repairSelected(snapshot.entries, snapshot.lastSelectedEntryId);
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
  const entries = document.entries.map((entry) => {
    const snapshot =
      entry.id === document.selectedEntryId
        ? createPersistedBuildSnapshot(activeEditor)
        : (entry.snapshot ?? createPersistedBuildSnapshot(activeEditor));
    return {
      id: entry.id,
      label: normalizeBuildSetEntryLabel(entry.label),
      kind: entry.kind,
      notes: normalizeBuildSetEntryNotes(entry.notes),
      snapshot: clonePersistedBuildSnapshot(snapshot),
      selected: entry.id === document.selectedEntryId
    };
  });
  const snapshot: PersistedBuildSetSnapshot = {
    schemaVersion: BUILD_SET_SCHEMA_VERSION,
    id: document.id,
    name: normalizeBuildSetName(document.name),
    entries,
    lastSelectedEntryId: repairSelected(entries, document.selectedEntryId)
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
  const removedSelected = document.selectedEntryId === entryId;
  const selectedEntryId = removedSelected ? (filtered[0]?.id ?? null) : document.selectedEntryId;
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
