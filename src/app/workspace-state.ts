import {
  authoredDocumentId,
  buildSetEntryId,
  catalogId,
  type AuthoredDocumentId,
  type BuildSetEntryId,
  type BuildSetEntryKind,
  type GameMode,
  type ProfessionId
} from "../domain";
import {
  addBlankBuildSetEntry,
  copySnapshotIntoBuildSet,
  createBuildSetFromEditor,
  createEmptyBuildSet,
  duplicateSelectedBuildSetEntry,
  hydrateRuntimeBuildSet,
  materializeBuildSetSnapshot,
  moveBuildSetRuntimeEntry,
  removeBuildSetRuntimeEntry,
  renameBuildSetRuntimeEntry,
  selectBuildSetEntry,
  setBuildSetComparisonEntry,
  setBuildSetRuntimeEntryKind,
  setBuildSetRuntimeEntryNotes,
  type RuntimeBuildSetDocument
} from "./build-set-state";
import {
  createBlankEditorState,
  editorReducer,
  type EditorAction,
  type EditorState
} from "./editor-state";
import type { LocalLibraryWriteResult } from "./local-storage";
import {
  createPersistedBuildSnapshot,
  clonePersistedBuildSetSnapshot,
  clonePersistedBuildSnapshot,
  emptyLocalLibraryEnvelope,
  fingerprintPersistedDocument,
  hydrateEditorFromSnapshot,
  localBuildRecordId,
  persistedBuildDocument,
  persistedBuildSetDocument,
  serializeLocalLibraryEnvelope,
  type LocalBuildRecordId,
  type LocalLibraryEnvelopeV1,
  type PersistenceDiagnostic,
  type PersistedCatalogFacts,
  type PersistedBuildSetSnapshot,
  type PersistedDocument,
  type PersistedSavedDocumentRecord,
  type PersistedWorkingDraft
} from "./persistence-schema";

export type HydrationSource =
  | "blank"
  | "storage"
  | "saved-record"
  | "template-import"
  | "share-url"
  | "restore"
  | "build-set-transfer";
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
  readonly records: readonly PersistedSavedDocumentRecord[];
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

export type WorkspaceDocument =
  | {
      readonly kind: "build";
    }
  | RuntimeBuildSetDocument;

export interface WorkspaceState {
  readonly editor: EditorState;
  readonly document: WorkspaceDocument;
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
      readonly type: "create-build-set-from-current";
      readonly setId: AuthoredDocumentId;
      readonly entryId: BuildSetEntryId;
      readonly decision: DirtyGuardDecision;
      readonly name?: string;
    }
  | {
      readonly type: "new-build-set";
      readonly setId: AuthoredDocumentId;
      readonly name?: string;
      readonly decision: DirtyGuardDecision;
    }
  | {
      readonly type: "replace-build-set-draft";
      readonly snapshot: PersistedBuildSetSnapshot;
      readonly decision: DirtyGuardDecision;
      readonly source: HydrationSource;
    }
  | {
      readonly type: "rename-build-set";
      readonly name: string;
    }
  | {
      readonly type: "add-blank-build-set-entry";
      readonly entryId: BuildSetEntryId;
      readonly buildId: AuthoredDocumentId;
      readonly label?: string;
    }
  | {
      readonly type: "copy-record-into-set";
      readonly recordId: LocalBuildRecordId;
      readonly entryId: BuildSetEntryId;
      readonly buildId: AuthoredDocumentId;
    }
  | {
      readonly type: "select-build-set-entry";
      readonly entryId: BuildSetEntryId;
    }
  | {
      readonly type: "remove-build-set-entry";
      readonly entryId: BuildSetEntryId;
    }
  | {
      readonly type: "move-build-set-entry";
      readonly entryId: BuildSetEntryId;
      readonly direction: "earlier" | "later";
    }
  | {
      readonly type: "rename-build-set-entry";
      readonly entryId: BuildSetEntryId;
      readonly label: string;
    }
  | {
      readonly type: "set-build-set-entry-notes";
      readonly entryId: BuildSetEntryId;
      readonly notes: string | null;
    }
  | {
      readonly type: "set-build-set-entry-kind";
      readonly entryId: BuildSetEntryId;
      readonly kind: BuildSetEntryKind;
    }
  | {
      readonly type: "promote-build-set-entry";
      readonly entryId: BuildSetEntryId;
    }
  | {
      readonly type: "duplicate-selected-build-set-entry";
      readonly entryId: BuildSetEntryId;
      readonly buildId: AuthoredDocumentId;
    }
  | {
      readonly type: "set-build-set-comparison-entry";
      readonly entryId: BuildSetEntryId | null;
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
      readonly records: readonly PersistedSavedDocumentRecord[];
      readonly draftDocument: PersistedDocument | null;
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
  const hydrated =
    envelope.workingDraft === null
      ? { editor: createBlankEditorState(), document: { kind: "build" } as WorkspaceDocument }
      : hydrateWorkspaceDocument(envelope.workingDraft.document);
  const baselineFingerprint = fingerprintPersistedDocument(
    materializeDocument(hydrated.document, hydrated.editor)
  );
  const initial: WorkspaceState = {
    editor: hydrated.editor,
    document: hydrated.document,
    draftSession: {
      associatedRecordId: envelope.workingDraft?.associatedRecordId ?? null,
      hydrationSource: envelope.workingDraft === null ? "blank" : "storage",
      dirtyState: "clean",
      durability: input.writeBlocked === true ? "write-blocked" : "durable",
      allowWorkingDraftAutosave: input.writeBlocked !== true,
      baselineFingerprint
    },
    library: {
      records: envelope.savedDocuments,
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
    case "create-build-set-from-current":
      return createBuildSetDraftFromCurrent(state, action);
    case "new-build-set":
      return replaceWithBuildSetDraft(state, action);
    case "replace-build-set-draft":
      return replaceWithBuildSetSnapshot(state, action.snapshot, action.source, action.decision);
    case "rename-build-set":
      return reduceBuildSetDocument(state, (document) => ({
        ...document,
        name: action.name
      }));
    case "add-blank-build-set-entry":
      return reduceBuildSetTransition(state, (document) =>
        addBlankBuildSetEntry(
          document,
          state.editor,
          action.label === undefined
            ? { entryId: action.entryId, buildId: action.buildId }
            : { entryId: action.entryId, buildId: action.buildId, label: action.label }
        )
      );
    case "copy-record-into-set":
      return copyRecordIntoSet(state, action.recordId, action.entryId, action.buildId);
    case "select-build-set-entry":
      return reduceBuildSetTransition(state, (document) =>
        selectBuildSetEntry(document, state.editor, action.entryId)
      );
    case "remove-build-set-entry":
      return reduceBuildSetTransition(state, (document) =>
        removeBuildSetRuntimeEntry(document, state.editor, action.entryId)
      );
    case "move-build-set-entry":
      return reduceBuildSetDocument(state, (document) =>
        moveBuildSetRuntimeEntry(document, state.editor, action.entryId, action.direction)
      );
    case "rename-build-set-entry":
      return reduceBuildSetDocument(state, (document) =>
        renameBuildSetRuntimeEntry(document, action.entryId, action.label)
      );
    case "set-build-set-entry-notes":
      return reduceBuildSetDocument(state, (document) =>
        setBuildSetRuntimeEntryNotes(document, action.entryId, action.notes)
      );
    case "set-build-set-entry-kind":
      return reduceBuildSetDocument(state, (document) =>
        setBuildSetRuntimeEntryKind(document, action.entryId, action.kind)
      );
    case "promote-build-set-entry":
      return reduceBuildSetDocument(state, (document) =>
        setBuildSetRuntimeEntryKind(document, action.entryId, "build")
      );
    case "duplicate-selected-build-set-entry":
      return reduceBuildSetTransition(state, (document) =>
        duplicateSelectedBuildSetEntry(document, state.editor, {
          entryId: action.entryId,
          buildId: action.buildId
        })
      );
    case "set-build-set-comparison-entry":
      return reduceBuildSetDocument(state, (document) =>
        setBuildSetComparisonEntry(document, action.entryId)
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
        action.draftDocument,
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
  records: readonly PersistedSavedDocumentRecord[],
  draftDocument: PersistedDocument | null,
  draftAssociation: LocalBuildRecordId | null,
  decision: DirtyGuardDecision
): WorkspaceState {
  if (needsDirtyGuard(state) && decision === "cancel") {
    return state;
  }
  const retainedAssociation =
    draftDocument !== null
      ? draftAssociation
      : records.some((record) => record.id === state.draftSession.associatedRecordId)
        ? state.draftSession.associatedRecordId
        : null;
  const hydrated =
    draftDocument === null
      ? { editor: state.editor, document: state.document }
      : hydrateWorkspaceDocument(draftDocument);
  const document = materializeDocument(hydrated.document, hydrated.editor);
  return markDurableMutation(
    {
      ...state,
      editor: hydrated.editor,
      document: hydrated.document,
      draftSession: {
        associatedRecordId: retainedAssociation,
        hydrationSource: draftDocument === null ? state.draftSession.hydrationSource : "restore",
        dirtyState:
          retainedAssociation === state.draftSession.associatedRecordId
            ? state.draftSession.dirtyState
            : "dirty",
        durability: pendingFrom(state.draftSession.durability),
        allowWorkingDraftAutosave: true,
        baselineFingerprint: fingerprintPersistedDocument(document)
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
    schemaVersion: 2,
    kind: "build-wars-local-library",
    revision: state.storage.revision,
    updatedAt: now,
    workingDraft: state.draftSession.allowWorkingDraftAutosave
      ? {
          document: materializeActiveDocument(state),
          associatedRecordId: state.draftSession.associatedRecordId,
          savedWith: facts
        }
      : state.storage.preservedWorkingDraft,
    savedDocuments: state.library.records,
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

export function materializeActiveDocument(state: WorkspaceState): PersistedDocument {
  return materializeDocument(state.document, state.editor);
}

export function materializeActiveBuildSetSnapshot(
  state: WorkspaceState
): PersistedBuildSetSnapshot | null {
  return state.document.kind === "build-set"
    ? materializeBuildSetSnapshot(state.document, state.editor).snapshot
    : null;
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

export function generateBuildSetEntryId(now: string, sequence: number): BuildSetEntryId {
  const normalized = now.replace(/[^0-9A-Za-z]/g, "");
  return buildSetEntryId(`entry-${normalized}-${sequence}`);
}

export function generateAuthoredBuildSetId(now: string, sequence: number): AuthoredDocumentId {
  const normalized = now.replace(/[^0-9A-Za-z]/g, "");
  return authoredDocumentId(`build-set-${normalized}-${sequence}`);
}

export function generateNestedBuildId(entryId: BuildSetEntryId): AuthoredDocumentId {
  return authoredDocumentId(`build:${entryId}`);
}

function hydrateWorkspaceDocument(document: PersistedDocument): {
  readonly editor: EditorState;
  readonly document: WorkspaceDocument;
} {
  switch (document.kind) {
    case "build":
      return {
        editor: hydrateEditorFromSnapshot(document.snapshot),
        document: { kind: "build" }
      };
    case "build-set":
      return hydrateRuntimeBuildSet(document.snapshot);
  }
}

function materializeDocument(document: WorkspaceDocument, editor: EditorState): PersistedDocument {
  switch (document.kind) {
    case "build":
      return persistedBuildDocument(createPersistedBuildSnapshot(editor));
    case "build-set":
      return persistedBuildSetDocument(materializeBuildSetSnapshot(document, editor).snapshot);
  }
}

function createBuildSetDraftFromCurrent(
  state: WorkspaceState,
  action: Extract<WorkspaceAction, { readonly type: "create-build-set-from-current" }>
): WorkspaceState {
  if (needsDirtyGuard(state) && action.decision === "cancel") {
    return state;
  }
  const document = createBuildSetFromEditor(
    action.name === undefined
      ? { editor: state.editor, setId: action.setId, entryId: action.entryId }
      : { editor: state.editor, setId: action.setId, entryId: action.entryId, name: action.name }
  );
  return markDurableMutation({
    ...state,
    document,
    draftSession: {
      associatedRecordId: null,
      hydrationSource: "blank",
      dirtyState: "dirty",
      durability: pendingFrom(state.draftSession.durability),
      allowWorkingDraftAutosave: true,
      baselineFingerprint: fingerprintPersistedDocument(materializeDocument(document, state.editor))
    },
    library: {
      ...state.library,
      selectedRecordId: null
    }
  });
}

function replaceWithBuildSetDraft(
  state: WorkspaceState,
  action: Extract<WorkspaceAction, { readonly type: "new-build-set" }>
): WorkspaceState {
  if (needsDirtyGuard(state) && action.decision === "cancel") {
    return state;
  }
  const document = createEmptyBuildSet(
    action.name === undefined ? { setId: action.setId } : { setId: action.setId, name: action.name }
  );
  const editor = createBlankEditorState("Untitled Build");
  return markDurableMutation({
    ...state,
    editor,
    document,
    draftSession: {
      associatedRecordId: null,
      hydrationSource: "blank",
      dirtyState: "dirty",
      durability: pendingFrom(state.draftSession.durability),
      allowWorkingDraftAutosave: true,
      baselineFingerprint: fingerprintPersistedDocument(materializeDocument(document, editor))
    },
    library: {
      ...state.library,
      selectedRecordId: null
    }
  });
}

function replaceWithBuildSetSnapshot(
  state: WorkspaceState,
  snapshot: PersistedBuildSetSnapshot,
  source: HydrationSource,
  decision: DirtyGuardDecision
): WorkspaceState {
  if (needsDirtyGuard(state) && decision === "cancel") {
    return state;
  }
  const hydrated = hydrateRuntimeBuildSet(snapshot);
  return markDurableMutation({
    ...state,
    editor: hydrated.editor,
    document: hydrated.document,
    draftSession: {
      associatedRecordId: null,
      hydrationSource: source,
      dirtyState: "dirty",
      durability: pendingFrom(state.draftSession.durability),
      allowWorkingDraftAutosave: true,
      baselineFingerprint: fingerprintPersistedDocument(
        materializeDocument(hydrated.document, hydrated.editor)
      )
    },
    library: {
      ...state.library,
      selectedRecordId: null
    }
  });
}

function reduceBuildSetTransition(
  state: WorkspaceState,
  reduce: (document: RuntimeBuildSetDocument) => {
    readonly document: RuntimeBuildSetDocument;
    readonly editor: EditorState;
  }
): WorkspaceState {
  if (state.document.kind !== "build-set") {
    return state;
  }
  const before = fingerprintPersistedDocument(materializeActiveDocument(state));
  const next = reduce(state.document);
  const after = fingerprintPersistedDocument(materializeDocument(next.document, next.editor));
  if (before === after) {
    return { ...state, editor: next.editor, document: next.document };
  }
  return markDurableMutation({
    ...state,
    editor: next.editor,
    document: next.document,
    draftSession: {
      ...state.draftSession,
      dirtyState: "dirty",
      durability: pendingFrom(state.draftSession.durability),
      allowWorkingDraftAutosave: true
    }
  });
}

function reduceBuildSetDocument(
  state: WorkspaceState,
  reduce: (document: RuntimeBuildSetDocument) => RuntimeBuildSetDocument
): WorkspaceState {
  return reduceBuildSetTransition(state, (document) => ({
    editor: state.editor,
    document: reduce(document)
  }));
}

function copyRecordIntoSet(
  state: WorkspaceState,
  recordId: LocalBuildRecordId,
  entryId: BuildSetEntryId,
  buildId: AuthoredDocumentId
): WorkspaceState {
  if (state.document.kind !== "build-set") {
    return state;
  }
  const record = state.library.records.find((candidate) => candidate.id === recordId);
  if (record === undefined || record.document.kind !== "build") {
    return state;
  }
  const documentToCopy = record.document;
  return reduceBuildSetTransition(state, (document) =>
    copySnapshotIntoBuildSet(document, state.editor, {
      entryId,
      buildId,
      snapshot: documentToCopy.snapshot,
      label: record.name
    })
  );
}

function activeDocumentName(state: WorkspaceState): string {
  return state.document.kind === "build-set" ? state.document.name : state.editor.build.name;
}

function stateWithRecordName(state: WorkspaceState, name: string): WorkspaceState {
  if (state.document.kind === "build-set") {
    return {
      ...state,
      document: {
        ...state.document,
        name: normalizeRecordName(name, state.document.name)
      }
    };
  }
  return {
    ...state,
    editor: editorWithName(state.editor, name)
  };
}

function cloneRecordDocumentForDuplicate(
  document: PersistedDocument,
  newId: LocalBuildRecordId
): PersistedDocument {
  if (document.kind === "build") {
    const snapshot = clonePersistedBuildSnapshot(document.snapshot);
    return persistedBuildDocument({
      ...snapshot,
      build: {
        ...snapshot.build,
        id: authoredDocumentId(`build:${newId}`)
      }
    });
  }
  const snapshot = clonePersistedBuildSetSnapshot(document.snapshot);
  return persistedBuildSetDocument({
    ...snapshot,
    id: authoredDocumentId(`build-set:${newId}`),
    entries: snapshot.entries.map((entry, index) => ({
      ...entry,
      id: buildSetEntryId(`${newId}:entry-${index + 1}`),
      snapshot: {
        ...entry.snapshot,
        build: {
          ...entry.snapshot.build,
          id: authoredDocumentId(`build:${newId}:entry-${index + 1}`)
        }
      }
    })),
    lastSelectedEntryId:
      snapshot.entries[0] === undefined ? null : buildSetEntryId(`${newId}:entry-1`)
  });
}

function reduceEditorAction(state: WorkspaceState, action: EditorAction): WorkspaceState {
  const before = fingerprintPersistedDocument(materializeActiveDocument(state));
  const reducedEditor = editorReducer(state.editor, action);
  const externalReplacement = action.type === "replace-state";
  const nextEditor =
    externalReplacement && state.document.kind === "build-set"
      ? {
          ...reducedEditor,
          build: {
            ...reducedEditor.build,
            id: state.editor.build.id
          }
        }
      : reducedEditor;
  const after = fingerprintPersistedDocument(materializeDocument(state.document, nextEditor));
  if (before === after) {
    return { ...state, editor: nextEditor };
  }

  const clearsAssociation = externalReplacement && state.document.kind === "build";
  return {
    ...state,
    editor: nextEditor,
    draftSession: {
      ...state.draftSession,
      associatedRecordId: clearsAssociation ? null : state.draftSession.associatedRecordId,
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
  const document: WorkspaceDocument = { kind: "build" };
  const baselineFingerprint = fingerprintPersistedDocument(materializeDocument(document, editor));
  const nextState: WorkspaceState = {
    ...state,
    editor,
    document,
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
  const renamed = stateWithRecordName(state, name);
  const document = materializeActiveDocument(renamed);
  const record: PersistedSavedDocumentRecord = {
    id,
    name: normalizeRecordName(name, activeDocumentName(state)),
    createdAt: now,
    updatedAt: now,
    favorite: false,
    tags: [],
    notes: null,
    document,
    savedWith
  };
  return markDurableMutation(
    {
      ...renamed,
      draftSession: {
        associatedRecordId: id,
        hydrationSource: "saved-record",
        dirtyState: "clean",
        durability: pendingFrom(renamed.draftSession.durability),
        allowWorkingDraftAutosave: true,
        baselineFingerprint: fingerprintPersistedDocument(document)
      },
      library: {
        ...renamed.library,
        records: [...renamed.library.records, record],
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
  const record = state.library.records.find((candidate) => candidate.id === associatedRecordId);
  if (record === undefined) {
    return state;
  }
  const document = materializeActiveDocument(state);
  if (record.document.kind !== document.kind) {
    return markDurableMutation({
      ...state,
      draftSession: {
        ...state.draftSession,
        associatedRecordId: null,
        dirtyState: "dirty",
        durability: pendingFrom(state.draftSession.durability)
      },
      library: {
        ...state.library,
        selectedRecordId: null
      }
    });
  }
  return mutateRecord(
    {
      ...state,
      draftSession: {
        ...state.draftSession,
        dirtyState: "clean",
        baselineFingerprint: fingerprintPersistedDocument(document)
      }
    },
    associatedRecordId,
    now,
    (record) => ({
      ...record,
      name: activeDocumentName(state),
      document,
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
  const hydrated = hydrateWorkspaceDocument(record.document);
  return markDurableMutation({
    ...state,
    editor: hydrated.editor,
    document: hydrated.document,
    draftSession: {
      associatedRecordId: id,
      hydrationSource: "saved-record",
      dirtyState: "clean",
      durability: pendingFrom(state.draftSession.durability),
      allowWorkingDraftAutosave: true,
      baselineFingerprint: fingerprintPersistedDocument(record.document)
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
  const copy: PersistedSavedDocumentRecord = {
    ...record,
    id: newId,
    name: `${record.name} Copy`,
    createdAt: now,
    updatedAt: now,
    document: cloneRecordDocumentForDuplicate(record.document, newId)
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
  const nextState = associatedAndClean ? stateWithRecordName(state, nextName) : state;
  const document = associatedAndClean ? materializeActiveDocument(nextState) : null;
  return mutateRecord(
    {
      ...nextState,
      draftSession:
        associatedAndClean && document !== null
          ? {
              ...nextState.draftSession,
              baselineFingerprint: fingerprintPersistedDocument(document)
            }
          : nextState.draftSession
    },
    id,
    now,
    (record) => ({
      ...record,
      name: nextName,
      document: document ?? record.document,
      savedWith: document === null ? record.savedWith : savedWith
    }),
    true
  );
}

function mutateRecord(
  state: WorkspaceState,
  id: LocalBuildRecordId,
  now: string,
  mutate: (record: PersistedSavedDocumentRecord) => PersistedSavedDocumentRecord,
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
