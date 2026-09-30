import { emptyGuide } from "../guide/markdown";
import { authoredDocumentId } from "../domain";
import { loadDaggerExample } from "./examples/dagger-guide";
import {
  fingerprintSavedRecord,
  fingerprintPersistedDocument,
  localBuildRecordId,
  type LocalBuildRecordId,
  type LocalLibraryEnvelopeV1,
  type PersistedDocument,
  type PersistedSavedDocumentRecord
} from "./persistence-schema";
import { readLocalLibrary, writeLocalLibrary, type LocalStoragePort } from "./local-storage";
import {
  createWorkspaceEnvelope,
  guideCatalogFacts,
  materializeActiveDocument,
  workspacePersistenceFingerprint,
  workspaceReducer,
  type WorkspaceAction,
  type WorkspaceState
} from "./workspace-state";

export interface DocumentWorkspace extends WorkspaceState {
  readonly documentLibrary: {
    /** The last observed disk records, kept separately from our live document edits. */
    readonly baseline: readonly PersistedSavedDocumentRecord[];
  };
}

export type DocumentLibraryAction =
  | WorkspaceAction
  | {
      readonly type: "create-document";
      readonly kind: "guide" | "build" | "build-set" | "example";
      readonly id: LocalBuildRecordId;
    }
  | { readonly type: "open-document"; readonly id: LocalBuildRecordId }
  | { readonly type: "remove-document"; readonly id: LocalBuildRecordId }
  | { readonly type: "receive-library"; readonly envelope: LocalLibraryEnvelopeV1 };

export function documentName(document: PersistedDocument): string {
  return document.kind === "guide"
    ? document.snapshot.document.metadata.title
    : document.kind === "build-set"
      ? document.snapshot.name
      : document.snapshot.build.name;
}

function renamedDocument(document: PersistedDocument, name: string): PersistedDocument {
  if (document.kind === "guide")
    return {
      ...document,
      snapshot: {
        ...document.snapshot,
        document: {
          ...document.snapshot.document,
          metadata: { ...document.snapshot.document.metadata, title: name }
        }
      }
    };
  if (document.kind === "build-set")
    return { ...document, snapshot: { ...document.snapshot, name } };
  return {
    ...document,
    snapshot: { ...document.snapshot, build: { ...document.snapshot.build, name } }
  };
}

/** Adopt legacy drafts in memory. Hydration alone never overwrites the existing library. */
export function initializeDocumentLibrary(state: WorkspaceState): DocumentWorkspace {
  const next = synchronizeActiveDocument(state, new Date().toISOString());
  return {
    ...next,
    documentLibrary: { baseline: state.library.records },
    storage: {
      ...next.storage,
      lastDurableFingerprint: workspacePersistenceFingerprint(next, null)
    }
  };
}

function synchronizeActiveDocument(state: WorkspaceState, now: string): WorkspaceState {
  if (!state.draftSession.allowWorkingDraftAutosave) return state;
  const document = materializeActiveDocument(state);
  const associated = state.library.records.find(
    (record) => record.id === state.draftSession.associatedRecordId
  );
  const identity =
    document.kind === "guide"
      ? document.snapshot.document.metadata.id
      : document.kind === "build-set"
        ? document.snapshot.id
        : document.snapshot.build.id;
  // Stable for the same legacy draft opened simultaneously in two tabs.
  let id = associated?.id ?? localBuildRecordId(`document:${identity}`);
  if (!associated) {
    let suffix = 2;
    while (state.library.records.some((record) => record.id === id)) {
      id = localBuildRecordId(`document:${identity}:${suffix++}`);
    }
  }
  const record: PersistedSavedDocumentRecord = {
    id,
    name: documentName(document),
    createdAt: associated?.createdAt ?? now,
    updatedAt: now,
    favorite: associated?.favorite ?? false,
    tags:
      document.kind === "guide"
        ? document.snapshot.document.metadata.tags
        : (associated?.tags ?? []),
    notes: associated?.notes ?? null,
    document,
    savedWith:
      associated?.savedWith ??
      (document.kind === "guide"
        ? guideCatalogFacts(state)
        : (state.storage.preservedWorkingDraft?.savedWith ?? {
            buildCatalogVersion: state.editor.build.catalogVersion,
            professionAttributeCatalogVersion: null,
            skillCatalogVersion: null,
            ruleEngineVersion: null
          }))
  };
  if (
    associated &&
    associated.name === record.name &&
    fingerprintPersistedDocument(associated.document) === fingerprintPersistedDocument(document)
  )
    return state;
  return {
    ...state,
    draftSession: { ...state.draftSession, associatedRecordId: id },
    library: {
      ...state.library,
      selectedRecordId: id,
      records: associated
        ? state.library.records.map((item) => (item.id === id ? record : item))
        : [...state.library.records, record]
    }
  };
}

function openDocument(state: WorkspaceState, id: LocalBuildRecordId): WorkspaceState {
  const record = state.library.records.find((item) => item.id === id);
  if (!record || state.draftSession.associatedRecordId === id) return state;
  // Older rename actions only changed the record label, not the build's title.
  const records = state.library.records.map((item) =>
    item.id === id ? { ...item, document: renamedDocument(item.document, item.name) } : item
  );
  return workspaceReducer(
    { ...state, library: { ...state.library, records } },
    { type: "load-record", id, decision: "discard" }
  );
}

export function documentLibraryReducer(
  state: DocumentWorkspace,
  action: DocumentLibraryAction
): DocumentWorkspace {
  const now = new Date().toISOString();
  if (action.type === "receive-library") return receiveLibrary(state, action.envelope);
  if (action.type === "storage-write-result") {
    if (!action.result.ok)
      return { ...workspaceReducer(state, action), documentLibrary: state.documentLibrary };
    const received = receiveLibrary(state, action.result.envelope);
    const next = workspaceReducer(received, action);
    return {
      ...next,
      documentLibrary: received.documentLibrary,
      storage: {
        ...next.storage,
        lastDurableFingerprint: workspacePersistenceFingerprint(
          next,
          action.result.envelope.workingDraft?.savedWith ?? null
        )
      }
    };
  }

  if (
    state.document.kind === "guide" &&
    state.document.composing &&
    ["create-document", "open-document", "remove-document", "rename-record"].includes(action.type)
  )
    return state;
  let next: WorkspaceState;
  if (action.type === "create-document") {
    if (action.kind === "guide" || action.kind === "example") {
      next = workspaceReducer(state, {
        type: "replace-guide",
        decision: "discard",
        session: action.id,
        document:
          action.kind === "guide"
            ? emptyGuide(action.id)
            : {
                ...loadDaggerExample(),
                metadata: { ...loadDaggerExample().metadata, id: action.id }
              }
      });
    } else if (action.kind === "build-set") {
      next = workspaceReducer(state, {
        type: "new-build-set",
        decision: "discard",
        setId: authoredDocumentId(action.id)
      });
    } else {
      next = workspaceReducer(state, { type: "new-draft", decision: "discard" });
      next = {
        ...next,
        editor: {
          ...next.editor,
          build: { ...next.editor.build, id: authoredDocumentId(action.id) }
        }
      };
    }
    next = workspaceReducer(next, {
      type: "save-as-new",
      id: action.id,
      name: documentName(materializeActiveDocument(next)),
      now,
      savedWith: guideCatalogFacts(next)
    });
  } else if (action.type === "open-document") {
    next = openDocument(state, action.id);
  } else if (action.type === "remove-document") {
    next = workspaceReducer(state, { type: "delete-record", id: action.id, confirmed: true, now });
    if (state.draftSession.associatedRecordId === action.id) {
      const first = next.library.records[0];
      if (first) next = openDocument(next, first.id);
      else {
        next = workspaceReducer(next, { type: "new-draft", decision: "discard" });
        // A blank editor after deleting the last entry is not silently saved as a replacement.
        return { ...next, documentLibrary: state.documentLibrary };
      }
    }
  } else if (action.type === "rename-record") {
    const clean =
      state.draftSession.associatedRecordId === action.id
        ? workspaceReducer(state, { type: "update-associated", now, savedWith: action.savedWith })
        : state;
    next = workspaceReducer(clean, action);
    next = {
      ...next,
      library: {
        ...next.library,
        records: next.library.records.map((record) =>
          record.id === action.id
            ? { ...record, document: renamedDocument(record.document, record.name) }
            : record
        )
      }
    };
  } else if (action.type === "duplicate-record") {
    next = workspaceReducer(state, action);
    const original = state.library.records.find((record) => record.id === action.id);
    next = {
      ...next,
      library: {
        ...next.library,
        records: next.library.records.map((record) => {
          if (record.id !== action.newId || !original) return record;
          const name = `${original.name.slice(0, original.document.kind === "guide" ? 155 : 115)} Copy`;
          let document = renamedDocument(record.document, name);
          if (document.kind === "guide")
            document = {
              ...document,
              snapshot: {
                ...document.snapshot,
                document: {
                  ...document.snapshot.document,
                  metadata: { ...document.snapshot.document.metadata, id: action.newId }
                }
              }
            };
          return { ...record, name, document };
        })
      }
    };
  } else {
    next = workspaceReducer(state, action);
    // Pasting a template edits the open build rather than detaching it from its sidebar entry.
    if (
      action.type === "editor" &&
      action.action.type === "replace-state" &&
      state.document.kind === "build"
    ) {
      next = {
        ...next,
        draftSession: {
          ...next.draftSession,
          associatedRecordId: state.draftSession.associatedRecordId
        }
      };
    }
  }
  if (next === state) return state;
  const documentChanged =
    next.editor.build !== state.editor.build ||
    next.editor.rawTemplate !== state.editor.rawTemplate ||
    next.editor.pveBudget !== state.editor.pveBudget ||
    next.document.kind !== state.document.kind ||
    (next.document.kind === "guide" && state.document.kind === "guide"
      ? next.document.history !== state.document.history
      : next.document !== state.document);
  if (documentChanged || action.type === "allow-working-draft-autosave")
    next = synchronizeActiveDocument(next, now);
  return { ...next, documentLibrary: state.documentLibrary };
}

function sameRecord(
  a: PersistedSavedDocumentRecord | undefined,
  b: PersistedSavedDocumentRecord | undefined
): boolean {
  return (
    a === b ||
    (a !== undefined &&
      b !== undefined &&
      fingerprintSavedRecord({ ...a, createdAt: "", updatedAt: "", savedWith: b.savedWith }) ===
        fingerprintSavedRecord({ ...b, createdAt: "", updatedAt: "" }))
  );
}

/** Three-way merge: disjoint document edits commute; concurrent edits/deletes of one document do not. */
export function mergeDocumentRecords(
  baseline: readonly PersistedSavedDocumentRecord[],
  local: readonly PersistedSavedDocumentRecord[],
  remote: readonly PersistedSavedDocumentRecord[]
) {
  const before = new Map(baseline.map((record) => [record.id, record]));
  const ours = new Map(local.map((record) => [record.id, record]));
  const theirs = new Map(remote.map((record) => [record.id, record]));
  const records: PersistedSavedDocumentRecord[] = [];
  const conflicts: string[] = [];
  for (const id of new Set([...ours.keys(), ...theirs.keys(), ...before.keys()])) {
    const a = before.get(id),
      b = ours.get(id),
      c = theirs.get(id);
    const localChanged = !sameRecord(a, b),
      remoteChanged = !sameRecord(a, c);
    if (localChanged && remoteChanged && !sameRecord(b, c))
      conflicts.push(b?.name ?? c?.name ?? id);
    const record = localChanged && !sameRecord(b, c) ? b : c;
    if (record) records.push(record);
  }
  return { records, conflicts };
}

function receiveLibrary(
  state: DocumentWorkspace,
  envelope: LocalLibraryEnvelopeV1
): DocumentWorkspace {
  if (state.document.kind === "guide" && state.document.composing) return state;
  const merged = mergeDocumentRecords(
    state.documentLibrary.baseline,
    state.library.records,
    envelope.savedDocuments
  );
  if (merged.conflicts.length)
    return {
      ...state,
      draftSession: { ...state.draftSession, durability: "conflict" },
      storage: {
        ...state.storage,
        rejectedPayloadSummary: `Another tab changed ${merged.conflicts.join(", ")}. Back up your work before reloading.`
      }
    };
  const activeId = state.draftSession.associatedRecordId;
  const oldActive = state.library.records.find((record) => record.id === activeId);
  const active = merged.records.find((record) => record.id === activeId);
  let next: WorkspaceState = {
    ...state,
    library: { ...state.library, records: merged.records },
    storage: {
      ...state.storage,
      revision: envelope.revision,
      preservedWorkingDraft: envelope.workingDraft,
      diagnostics: [],
      rejectedPayloadSummary: null
    }
  };
  if (!sameRecord(oldActive, active)) {
    next = { ...next, draftSession: { ...next.draftSession, associatedRecordId: null } };
    const target = active ?? merged.records[0];
    next = target
      ? openDocument(next, target.id)
      : workspaceReducer(next, { type: "new-draft", decision: "discard" });
  }
  const pending =
    merged.records.some(
      (record) =>
        !sameRecord(
          record,
          envelope.savedDocuments.find((item) => item.id === record.id)
        )
    ) ||
    envelope.savedDocuments.some((record) => !merged.records.some((item) => item.id === record.id));
  return {
    ...next,
    documentLibrary: { baseline: envelope.savedDocuments },
    draftSession: { ...next.draftSession, durability: pending ? "pending" : "durable" },
    storage: {
      ...next.storage,
      lastDurableFingerprint: pending ? null : workspacePersistenceFingerprint(next, null)
    }
  };
}

export function writeDocumentLibrary(
  storage: LocalStoragePort | null,
  state: DocumentWorkspace,
  savedWith: Parameters<typeof createWorkspaceEnvelope>[1],
  reason: string
) {
  const now = new Date().toISOString();
  let envelope = createWorkspaceEnvelope(state, savedWith, now);
  const draft = envelope.workingDraft;
  if (draft)
    envelope = {
      ...envelope,
      savedDocuments: envelope.savedDocuments.map((record) =>
        record.id === draft.associatedRecordId ? { ...record, savedWith: draft.savedWith } : record
      )
    };
  const remote = readLocalLibrary(storage, now);
  if (!remote.writeBlocked && remote.envelope.revision !== state.storage.revision) {
    const merged = mergeDocumentRecords(
      state.documentLibrary.baseline,
      envelope.savedDocuments,
      remote.envelope.savedDocuments
    );
    if (merged.conflicts.length)
      return {
        ok: false as const,
        status: "conflict" as const,
        envelope,
        diagnostics: [],
        message: `Another tab changed ${merged.conflicts.join(", ")}. Back up your work before reloading.`
      };
    const active = merged.records.find(
      (record) => record.id === envelope.workingDraft?.associatedRecordId
    );
    envelope = {
      ...envelope,
      savedDocuments: merged.records,
      workingDraft: envelope.workingDraft?.associatedRecordId
        ? active
          ? { ...envelope.workingDraft, document: active.document }
          : null
        : envelope.workingDraft
    };
  }
  return writeLocalLibrary(storage, envelope, {
    now,
    reason,
    expectedRevision: remote.envelope.revision
  });
}

export function documentUrl(id: LocalBuildRecordId, base = window.location.href): string {
  const url = new URL(base);
  url.hash = "";
  url.searchParams.set("document", id);
  return url.href;
}
