import { catalogId, type GameMode, type ProfessionId } from "../domain";
import {
  createBlankEditorState,
  editorReducer,
  type EditorAction,
  type EditorState
} from "./editor-state";
import type { LocalLibraryWriteResult } from "./local-storage";
import {
  createPersistedBuildSnapshot,
  emptyLocalLibraryEnvelope,
  fingerprintPersistedSnapshot,
  hydrateEditorFromSnapshot,
  localBuildRecordId,
  serializeLocalLibraryEnvelope,
  type LocalBuildRecordId,
  type LocalLibraryEnvelopeV1,
  type PersistenceDiagnostic,
  type PersistedCatalogFacts,
  type PersistedSavedBuildRecord,
  type PersistedWorkingDraft
} from "./persistence-schema";

export type HydrationSource =
  "blank" | "storage" | "saved-record" | "template-import" | "share-url" | "restore";
export type DraftDirtyState = "clean" | "dirty" | "unknown";
export type WorkspaceDurability =
  "durable" | "pending" | "memory-only" | "write-blocked" | "conflict";
export type LibrarySortMode = "updated-desc" | "name-asc" | "profession-asc";
export type DirtyGuardDecision = "cancel" | "discard";

export interface DraftSessionState {
  readonly associatedRecordId: LocalBuildRecordId | null;
  readonly hydrationSource: HydrationSource;
  readonly dirtyState: DraftDirtyState;
  readonly durability: WorkspaceDurability;
  readonly allowWorkingDraftAutosave: boolean;
  readonly baselineFingerprint: string;
}

export interface WorkspaceLibraryState {
  readonly records: readonly PersistedSavedBuildRecord[];
  readonly selectedRecordId: LocalBuildRecordId | null;
  readonly query: string;
  readonly professionFilter: ProfessionId | null;
  readonly modeFilter: GameMode | "all";
  readonly favoriteOnly: boolean;
  readonly tagFilter: string | null;
  readonly sortMode: LibrarySortMode;
  readonly collapsed: boolean;
}

export interface WorkspaceStorageState {
  readonly revision: number;
  readonly preservedWorkingDraft: PersistedWorkingDraft | null;
  readonly readStatus: string;
  readonly diagnostics: readonly PersistenceDiagnostic[];
  readonly rejectedPayloadSummary: string | null;
  readonly lastDurableFingerprint: string | null;
  readonly flushToken: number;
}

export interface WorkspaceRestoreState {
  readonly previewId: string | null;
}

export interface WorkspaceState {
  readonly editor: EditorState;
  readonly draftSession: DraftSessionState;
  readonly library: WorkspaceLibraryState;
  readonly storage: WorkspaceStorageState;
  readonly restore: WorkspaceRestoreState;
}

export type WorkspaceAction =
  | {
      readonly type: "editor";
      readonly action: EditorAction;
    }
  | {
      readonly type: "replace-draft";
      readonly editor: EditorState;
      readonly source: HydrationSource;
      readonly decision: DirtyGuardDecision;
      readonly allowWorkingDraftAutosave?: boolean;
    }
  | {
      readonly type: "new-draft";
      readonly name?: string;
      readonly decision: DirtyGuardDecision;
    }
  | {
      readonly type: "save-new";
      readonly name: string;
      readonly id: LocalBuildRecordId;
      readonly now: string;
      readonly savedWith: PersistedCatalogFacts;
    }
  | {
      readonly type: "update-associated";
      readonly now: string;
      readonly savedWith: PersistedCatalogFacts;
    }
  | {
      readonly type: "save-as-new";
      readonly name: string;
      readonly id: LocalBuildRecordId;
      readonly now: string;
      readonly savedWith: PersistedCatalogFacts;
    }
  | {
      readonly type: "load-record";
      readonly id: LocalBuildRecordId;
      readonly decision: DirtyGuardDecision;
    }
  | {
      readonly type: "duplicate-record";
      readonly id: LocalBuildRecordId;
      readonly newId: LocalBuildRecordId;
      readonly now: string;
    }
  | {
      readonly type: "delete-record";
      readonly id: LocalBuildRecordId;
      readonly confirmed: boolean;
      readonly now: string;
    }
  | {
      readonly type: "toggle-favorite";
      readonly id: LocalBuildRecordId;
      readonly now: string;
    }
  | {
      readonly type: "rename-record";
      readonly id: LocalBuildRecordId;
      readonly name: string;
      readonly now: string;
      readonly savedWith: PersistedCatalogFacts;
    }
  | {
      readonly type: "set-record-tags";
      readonly id: LocalBuildRecordId;
      readonly tags: readonly string[];
      readonly now: string;
    }
  | {
      readonly type: "set-record-notes";
      readonly id: LocalBuildRecordId;
      readonly notes: string | null;
      readonly now: string;
    }
  | {
      readonly type: "apply-restore";
      readonly records: readonly PersistedSavedBuildRecord[];
      readonly draftEditor: EditorState | null;
      readonly draftAssociation: LocalBuildRecordId | null;
      readonly decision: DirtyGuardDecision;
    }
  | {
      readonly type: "set-library-ui";
      readonly query?: string;
      readonly professionFilter?: ProfessionId | null;
      readonly modeFilter?: GameMode | "all";
      readonly favoriteOnly?: boolean;
      readonly tagFilter?: string | null;
      readonly sortMode?: LibrarySortMode;
      readonly collapsed?: boolean;
      readonly selectedRecordId?: LocalBuildRecordId | null;
    }
  | {
      readonly type: "storage-write-result";
      readonly result: LocalLibraryWriteResult;
      readonly durableFingerprint: string;
    }
  | {
      readonly type: "allow-working-draft-autosave";
    }
  | {
      readonly type: "set-storage-diagnostics";
      readonly durability: WorkspaceDurability;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly rejectedPayloadSummary?: string | null;
    };

export function createInitialWorkspaceState(
  input: {
    readonly envelope?: LocalLibraryEnvelopeV1;
    readonly writeBlocked?: boolean;
    readonly diagnostics?: readonly PersistenceDiagnostic[];
    readonly readStatus?: string;
    readonly now?: string;
  } = {}
): WorkspaceState {
  const now = input.now ?? new Date().toISOString();
  const envelope = input.envelope ?? emptyLocalLibraryEnvelope(now);
  const editor =
    envelope.workingDraft === null
      ? createBlankEditorState()
      : hydrateEditorFromSnapshot(envelope.workingDraft.snapshot);
  const baselineFingerprint = fingerprintPersistedSnapshot(createPersistedBuildSnapshot(editor));
  const initial: WorkspaceState = {
    editor,
    draftSession: {
      associatedRecordId: envelope.workingDraft?.associatedRecordId ?? null,
      hydrationSource: envelope.workingDraft === null ? "blank" : "storage",
      dirtyState: "clean",
      durability: input.writeBlocked === true ? "write-blocked" : "durable",
      allowWorkingDraftAutosave: input.writeBlocked !== true,
      baselineFingerprint
    },
    library: {
      records: envelope.savedBuilds,
      selectedRecordId: envelope.workingDraft?.associatedRecordId ?? null,
      query: "",
      professionFilter: null,
      modeFilter: "all",
      favoriteOnly: false,
      tagFilter: null,
      sortMode: "updated-desc",
      collapsed: false
    },
    storage: {
      revision: envelope.revision,
      preservedWorkingDraft: envelope.workingDraft,
      readStatus: input.readStatus ?? "empty",
      diagnostics: input.diagnostics ?? [],
      rejectedPayloadSummary: summarizeDiagnostics(input.diagnostics ?? []),
      lastDurableFingerprint: null,
      flushToken: 0
    },
    restore: {
      previewId: null
    }
  };
  return {
    ...initial,
    storage: {
      ...initial.storage,
      lastDurableFingerprint: workspacePersistenceFingerprint(initial, null)
    }
  };
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "editor":
      return reduceEditorAction(state, action.action);
    case "replace-draft":
      return replaceDraft(
        state,
        action.editor,
        action.source,
        action.decision,
        action.allowWorkingDraftAutosave ?? true
      );
    case "new-draft":
      return replaceDraft(
        state,
        createBlankEditorState(action.name ?? "Untitled Build"),
        "blank",
        action.decision,
        true
      );
    case "save-new":
      return saveNewRecord(state, action.name, action.id, action.now, action.savedWith);
    case "update-associated":
      return updateAssociatedRecord(state, action.now, action.savedWith);
    case "save-as-new":
      return saveNewRecord(state, action.name, action.id, action.now, action.savedWith);
    case "load-record":
      return loadRecord(state, action.id, action.decision);
    case "duplicate-record":
      return duplicateRecord(state, action.id, action.newId, action.now);
    case "delete-record":
      return deleteRecord(state, action.id, action.confirmed, action.now);
    case "toggle-favorite":
      return mutateRecord(state, action.id, action.now, (record) => ({
        ...record,
        favorite: !record.favorite
      }));
    case "rename-record":
      return renameRecord(state, action.id, action.name, action.now, action.savedWith);
    case "set-record-tags":
      return mutateRecord(state, action.id, action.now, (record) => ({
        ...record,
        tags: normalizeTags(action.tags)
      }));
    case "set-record-notes":
      return mutateRecord(state, action.id, action.now, (record) => ({
        ...record,
        notes: normalizeNotes(action.notes)
      }));
    case "apply-restore":
      return applyRestore(
        state,
        action.records,
        action.draftEditor,
        action.draftAssociation,
        action.decision
      );
    case "set-library-ui":
      return {
        ...state,
        library: {
          ...state.library,
          query: action.query ?? state.library.query,
          professionFilter:
            action.professionFilter === undefined
              ? state.library.professionFilter
              : action.professionFilter,
          modeFilter: action.modeFilter ?? state.library.modeFilter,
          favoriteOnly: action.favoriteOnly ?? state.library.favoriteOnly,
          tagFilter: action.tagFilter === undefined ? state.library.tagFilter : action.tagFilter,
          sortMode: action.sortMode ?? state.library.sortMode,
          collapsed: action.collapsed ?? state.library.collapsed,
          selectedRecordId:
            action.selectedRecordId === undefined
              ? state.library.selectedRecordId
              : action.selectedRecordId
        }
      };
    case "storage-write-result":
      return applyStorageWriteResult(state, action.result, action.durableFingerprint);
    case "allow-working-draft-autosave":
      return markDurableMutation(
        {
          ...state,
          draftSession: {
            ...state.draftSession,
            allowWorkingDraftAutosave: true,
            durability: pendingFrom(state.draftSession.durability)
          }
        },
        true
      );
    case "set-storage-diagnostics":
      return {
        ...state,
        draftSession: {
          ...state.draftSession,
          durability: action.durability,
          allowWorkingDraftAutosave: action.durability !== "write-blocked"
        },
        storage: {
          ...state.storage,
          diagnostics: action.diagnostics,
          rejectedPayloadSummary:
            action.rejectedPayloadSummary === undefined
              ? summarizeDiagnostics(action.diagnostics)
              : action.rejectedPayloadSummary
        }
      };
  }
}

function applyRestore(
  state: WorkspaceState,
  records: readonly PersistedSavedBuildRecord[],
  draftEditor: EditorState | null,
  draftAssociation: LocalBuildRecordId | null,
  decision: DirtyGuardDecision
): WorkspaceState {
  if (needsDirtyGuard(state) && decision === "cancel") {
    return state;
  }
  const retainedAssociation =
    draftEditor !== null
      ? draftAssociation
      : records.some((record) => record.id === state.draftSession.associatedRecordId)
        ? state.draftSession.associatedRecordId
        : null;
  const editor = draftEditor ?? state.editor;
  const snapshot = createPersistedBuildSnapshot(editor);
  return markDurableMutation(
    {
      ...state,
      editor,
      draftSession: {
        associatedRecordId: retainedAssociation,
        hydrationSource: draftEditor === null ? state.draftSession.hydrationSource : "restore",
        dirtyState:
          retainedAssociation === state.draftSession.associatedRecordId
            ? state.draftSession.dirtyState
            : "dirty",
        durability: pendingFrom(state.draftSession.durability),
        allowWorkingDraftAutosave: true,
        baselineFingerprint: fingerprintPersistedSnapshot(snapshot)
      },
      library: {
        ...state.library,
        records,
        selectedRecordId: retainedAssociation
      }
    },
    true
  );
}

export function createWorkspaceEnvelope(
  state: WorkspaceState,
  savedWith: PersistedCatalogFacts | null,
  now: string
): LocalLibraryEnvelopeV1 {
  const facts = savedWith ??
    state.library.records[0]?.savedWith ?? {
      buildCatalogVersion: state.editor.build.catalogVersion,
      professionAttributeCatalogVersion: null,
      skillCatalogVersion: null,
      ruleEngineVersion: null
    };
  return {
    schemaVersion: 1,
    kind: "build-wars-local-library",
    revision: state.storage.revision,
    updatedAt: now,
    workingDraft: state.draftSession.allowWorkingDraftAutosave
      ? {
          snapshot: createPersistedBuildSnapshot(state.editor),
          associatedRecordId: state.draftSession.associatedRecordId,
          savedWith: facts
        }
      : state.storage.preservedWorkingDraft,
    savedBuilds: state.library.records,
    metadata: {
      lastWriteReason: null,
      lastCompactedAt: null
    }
  };
}

export function workspacePersistenceFingerprint(
  state: WorkspaceState,
  savedWith: PersistedCatalogFacts | null
): string {
  const envelope = createWorkspaceEnvelope(state, savedWith, "2000-01-01T00:00:00Z");
  return serializeLocalLibraryEnvelope({
    ...envelope,
    revision: 0,
    updatedAt: "2000-01-01T00:00:00Z",
    metadata: {
      lastWriteReason: null,
      lastCompactedAt: null
    }
  });
}

export function needsDirtyGuard(state: WorkspaceState): boolean {
  return state.draftSession.dirtyState !== "clean";
}

export function generateLocalBuildRecordId(now: string, sequence: number): LocalBuildRecordId {
  const normalized = now.replace(/[^0-9A-Za-z]/g, "");
  return localBuildRecordId(`local-${normalized}-${sequence}`);
}

export function professionFilterFromValue(value: string): ProfessionId | null {
  return value.length === 0 ? null : catalogId<"Profession">(Number(value));
}

function reduceEditorAction(state: WorkspaceState, action: EditorAction): WorkspaceState {
  const before = fingerprintPersistedSnapshot(createPersistedBuildSnapshot(state.editor));
  const nextEditor = editorReducer(state.editor, action);
  const after = fingerprintPersistedSnapshot(createPersistedBuildSnapshot(nextEditor));
  if (before === after) {
    return { ...state, editor: nextEditor };
  }

  const externalReplacement = action.type === "replace-state";
  return {
    ...state,
    editor: nextEditor,
    draftSession: {
      ...state.draftSession,
      associatedRecordId: externalReplacement ? null : state.draftSession.associatedRecordId,
      hydrationSource: externalReplacement ? "template-import" : state.draftSession.hydrationSource,
      dirtyState: "dirty",
      durability: pendingFrom(state.draftSession.durability),
      allowWorkingDraftAutosave: true
    }
  };
}

function replaceDraft(
  state: WorkspaceState,
  editor: EditorState,
  source: HydrationSource,
  decision: DirtyGuardDecision,
  allowWorkingDraftAutosave: boolean
): WorkspaceState {
  if (needsDirtyGuard(state) && decision === "cancel") {
    return state;
  }
  const baselineFingerprint = fingerprintPersistedSnapshot(createPersistedBuildSnapshot(editor));
  const nextState: WorkspaceState = {
    ...state,
    editor,
    draftSession: {
      associatedRecordId: null,
      hydrationSource: source,
      dirtyState: source === "blank" ? "clean" : "dirty",
      durability: allowWorkingDraftAutosave
        ? pendingFrom(state.draftSession.durability)
        : "memory-only",
      allowWorkingDraftAutosave,
      baselineFingerprint
    },
    library: {
      ...state.library,
      selectedRecordId: null
    }
  };
  return allowWorkingDraftAutosave ? markDurableMutation(nextState) : nextState;
}

function saveNewRecord(
  state: WorkspaceState,
  name: string,
  id: LocalBuildRecordId,
  now: string,
  savedWith: PersistedCatalogFacts
): WorkspaceState {
  const editor = editorWithName(state.editor, name);
  const snapshot = createPersistedBuildSnapshot(editor);
  const record: PersistedSavedBuildRecord = {
    id,
    name: normalizeRecordName(name, state.editor.build.name),
    createdAt: now,
    updatedAt: now,
    favorite: false,
    tags: [],
    notes: null,
    snapshot,
    savedWith
  };
  return markDurableMutation(
    {
      ...state,
      editor,
      draftSession: {
        associatedRecordId: id,
        hydrationSource: "saved-record",
        dirtyState: "clean",
        durability: pendingFrom(state.draftSession.durability),
        allowWorkingDraftAutosave: true,
        baselineFingerprint: fingerprintPersistedSnapshot(snapshot)
      },
      library: {
        ...state.library,
        records: [...state.library.records, record],
        selectedRecordId: id
      }
    },
    true
  );
}

function updateAssociatedRecord(
  state: WorkspaceState,
  now: string,
  savedWith: PersistedCatalogFacts
): WorkspaceState {
  const associatedRecordId = state.draftSession.associatedRecordId;
  if (associatedRecordId === null) {
    return state;
  }
  const snapshot = createPersistedBuildSnapshot(state.editor);
  return mutateRecord(
    {
      ...state,
      draftSession: {
        ...state.draftSession,
        dirtyState: "clean",
        baselineFingerprint: fingerprintPersistedSnapshot(snapshot)
      }
    },
    associatedRecordId,
    now,
    (record) => ({
      ...record,
      name: state.editor.build.name,
      snapshot,
      savedWith
    }),
    true
  );
}

function loadRecord(
  state: WorkspaceState,
  id: LocalBuildRecordId,
  decision: DirtyGuardDecision
): WorkspaceState {
  if (needsDirtyGuard(state) && decision === "cancel") {
    return state;
  }
  const record = state.library.records.find((candidate) => candidate.id === id);
  if (record === undefined) {
    return state;
  }
  const editor = hydrateEditorFromSnapshot(record.snapshot);
  return markDurableMutation({
    ...state,
    editor,
    draftSession: {
      associatedRecordId: id,
      hydrationSource: "saved-record",
      dirtyState: "clean",
      durability: pendingFrom(state.draftSession.durability),
      allowWorkingDraftAutosave: true,
      baselineFingerprint: fingerprintPersistedSnapshot(record.snapshot)
    },
    library: {
      ...state.library,
      selectedRecordId: id
    }
  });
}

function duplicateRecord(
  state: WorkspaceState,
  id: LocalBuildRecordId,
  newId: LocalBuildRecordId,
  now: string
): WorkspaceState {
  const record = state.library.records.find((candidate) => candidate.id === id);
  if (record === undefined) {
    return state;
  }
  const copy: PersistedSavedBuildRecord = {
    ...record,
    id: newId,
    name: `${record.name} Copy`,
    createdAt: now,
    updatedAt: now
  };
  return markDurableMutation(
    {
      ...state,
      library: {
        ...state.library,
        records: [...state.library.records, copy]
      }
    },
    true
  );
}

function deleteRecord(
  state: WorkspaceState,
  id: LocalBuildRecordId,
  confirmed: boolean,
  now: string
): WorkspaceState {
  if (!confirmed) {
    return state;
  }
  const records = state.library.records.filter((record) => record.id !== id);
  if (records.length === state.library.records.length) {
    return state;
  }
  const deletingAssociated = state.draftSession.associatedRecordId === id;
  return markDurableMutation(
    {
      ...state,
      draftSession: deletingAssociated
        ? {
            ...state.draftSession,
            associatedRecordId: null,
            dirtyState: "dirty",
            durability: pendingFrom(state.draftSession.durability)
          }
        : state.draftSession,
      library: {
        ...state.library,
        records,
        selectedRecordId:
          state.library.selectedRecordId === id ? null : state.library.selectedRecordId
      }
    },
    now.length > 0
  );
}

function renameRecord(
  state: WorkspaceState,
  id: LocalBuildRecordId,
  name: string,
  now: string,
  savedWith: PersistedCatalogFacts
): WorkspaceState {
  const nextName = normalizeRecordName(name, "Untitled Build");
  const associatedAndClean =
    state.draftSession.associatedRecordId === id && state.draftSession.dirtyState === "clean";
  const editor = associatedAndClean ? editorWithName(state.editor, nextName) : state.editor;
  const snapshot = associatedAndClean ? createPersistedBuildSnapshot(editor) : null;
  return mutateRecord(
    {
      ...state,
      editor,
      draftSession:
        associatedAndClean && snapshot !== null
          ? {
              ...state.draftSession,
              baselineFingerprint: fingerprintPersistedSnapshot(snapshot)
            }
          : state.draftSession
    },
    id,
    now,
    (record) => ({
      ...record,
      name: nextName,
      snapshot: snapshot ?? record.snapshot,
      savedWith: snapshot === null ? record.savedWith : savedWith
    }),
    true
  );
}

function mutateRecord(
  state: WorkspaceState,
  id: LocalBuildRecordId,
  now: string,
  mutate: (record: PersistedSavedBuildRecord) => PersistedSavedBuildRecord,
  flush = false
): WorkspaceState {
  let changed = false;
  const records = state.library.records.map((record) => {
    if (record.id !== id) {
      return record;
    }
    changed = true;
    return {
      ...mutate(record),
      updatedAt: now
    };
  });
  if (!changed) {
    return state;
  }
  return markDurableMutation(
    {
      ...state,
      draftSession: {
        ...state.draftSession,
        durability: pendingFrom(state.draftSession.durability)
      },
      library: {
        ...state.library,
        records
      }
    },
    flush
  );
}

function markDurableMutation(state: WorkspaceState, flush = false): WorkspaceState {
  return {
    ...state,
    draftSession: {
      ...state.draftSession,
      durability: pendingFrom(state.draftSession.durability)
    },
    storage: {
      ...state.storage,
      flushToken: flush ? state.storage.flushToken + 1 : state.storage.flushToken
    }
  };
}

function applyStorageWriteResult(
  state: WorkspaceState,
  result: LocalLibraryWriteResult,
  durableFingerprint: string
): WorkspaceState {
  if (result.ok) {
    return {
      ...state,
      draftSession: {
        ...state.draftSession,
        durability: "durable"
      },
      storage: {
        ...state.storage,
        revision: result.envelope.revision,
        preservedWorkingDraft: result.envelope.workingDraft,
        diagnostics: [],
        rejectedPayloadSummary: null,
        lastDurableFingerprint: durableFingerprint
      }
    };
  }

  const durability =
    result.status === "conflict"
      ? "conflict"
      : result.status === "write-blocked"
        ? "write-blocked"
        : "memory-only";
  return {
    ...state,
    draftSession: {
      ...state.draftSession,
      durability,
      allowWorkingDraftAutosave: durability !== "write-blocked"
    },
    storage: {
      ...state.storage,
      diagnostics: result.diagnostics,
      rejectedPayloadSummary: result.message
    }
  };
}

function pendingFrom(current: WorkspaceDurability): WorkspaceDurability {
  return current === "write-blocked" || current === "conflict" ? current : "pending";
}

function editorWithName(editor: EditorState, name: string): EditorState {
  const nextName = normalizeRecordName(name, editor.build.name);
  return {
    ...editor,
    build: {
      ...editor.build,
      name: nextName
    },
    rawTemplate: {
      ...editor.rawTemplate,
      templateName: editor.rawTemplate.templateName ?? nextName
    },
    dialogs: {
      ...editor.dialogs,
      exportName: editor.dialogs.exportName ?? nextName
    }
  };
}

function normalizeRecordName(name: string, fallback: string): string {
  const trimmed = name.trim();
  return trimmed.length === 0 ? fallback.trim() || "Untitled Build" : trimmed.slice(0, 120);
}

function normalizeTags(tags: readonly string[]): readonly string[] {
  const byKey = new Map<string, string>();
  tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .forEach((tag) => {
      const key = tag.toLocaleLowerCase("en-US");
      if (!byKey.has(key)) {
        byKey.set(key, tag.slice(0, 40));
      }
    });
  return [...byKey.values()].slice(0, 24).sort((left, right) => left.localeCompare(right, "en-US"));
}

function normalizeNotes(notes: string | null): string | null {
  if (notes === null) {
    return null;
  }
  const trimmed = notes.trim();
  return trimmed.length === 0 ? null : trimmed.slice(0, 1_000);
}

function summarizeDiagnostics(diagnostics: readonly PersistenceDiagnostic[]): string | null {
  if (diagnostics.length === 0) {
    return null;
  }
  return diagnostics
    .slice(0, 3)
    .map((diagnostic) => diagnostic.message)
    .join(" ");
}
