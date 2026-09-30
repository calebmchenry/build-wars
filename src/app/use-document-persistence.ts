import { useEffect, useRef, type Dispatch } from "react";
import { GUIDE_AUTOSAVE_DELAY_MS } from "./guide-autosave";
import { readLocalLibrary, type LocalStoragePort } from "./local-storage";
import {
  LOCAL_LIBRARY_STORAGE_KEY,
  type LocalBuildRecordId,
  type PersistedCatalogFacts
} from "./persistence-schema";
import {
  documentUrl,
  writeDocumentLibrary,
  type DocumentLibraryAction,
  type DocumentWorkspace
} from "./document-library";
import { workspacePersistenceFingerprint } from "./workspace-state";

export function useDocumentPersistence(
  workspace: DocumentWorkspace,
  savedWith: PersistedCatalogFacts | null,
  storage: LocalStoragePort | null,
  dispatch: Dispatch<DocumentLibraryAction>
) {
  const latest = useRef({ workspace, savedWith });
  useEffect(() => {
    latest.current = { workspace, savedWith };
  });
  const token = workspacePersistenceFingerprint(workspace, savedWith);
  const guideId =
    workspace.document.kind === "guide"
      ? workspace.document.history.frame.document.metadata.id
      : null;
  const lastFlush = useRef(workspace.storage.flushToken);
  const flush = (reason: string) => {
    const current = latest.current;
    if (["write-blocked", "conflict"].includes(current.workspace.draftSession.durability))
      return false;
    if (!current.workspace.draftSession.allowWorkingDraftAutosave) return false;
    const result = writeDocumentLibrary(storage, current.workspace, current.savedWith, reason);
    dispatch({
      type: "storage-write-result",
      result,
      durableFingerprint: workspacePersistenceFingerprint(current.workspace, current.savedWith)
    });
    return result.ok;
  };
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => {
    if (
      token === workspace.storage.lastDurableFingerprint ||
      ["write-blocked", "conflict"].includes(workspace.draftSession.durability) ||
      !workspace.draftSession.allowWorkingDraftAutosave
    )
      return;
    const immediate = lastFlush.current !== workspace.storage.flushToken;
    lastFlush.current = workspace.storage.flushToken;
    let cancelled = false;
    const timer = window.setTimeout(
      () => {
        const save = () => {
          if (!cancelled) flushRef.current("document autosave");
        };
        // Serialize read/merge/write across tabs where Web Locks is available.
        if (navigator.locks)
          void navigator.locks.request(LOCAL_LIBRARY_STORAGE_KEY, save).catch(() => save());
        else save();
      },
      immediate ? 0 : workspace.document.kind === "guide" ? GUIDE_AUTOSAVE_DELAY_MS : 150
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    token,
    workspace.storage.lastDurableFingerprint,
    workspace.storage.flushToken,
    workspace.draftSession.durability,
    workspace.draftSession.allowWorkingDraftAutosave,
    workspace.document.kind
  ]);
  useEffect(() => {
    const pagehide = () => {
      const current = latest.current;
      if (
        workspacePersistenceFingerprint(current.workspace, current.savedWith) !==
        current.workspace.storage.lastDurableFingerprint
      )
        flushRef.current("pagehide");
    };
    const receive = (event: StorageEvent) => {
      if (event.key !== null && event.key !== LOCAL_LIBRARY_STORAGE_KEY) return;
      const remote = readLocalLibrary(storage);
      if (remote.writeBlocked)
        dispatch({
          type: "set-storage-diagnostics",
          durability: "write-blocked",
          diagnostics: remote.diagnostics
        });
      else if (remote.status !== "unavailable")
        dispatch({ type: "receive-library", envelope: remote.envelope });
    };
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("storage", receive);
    return () => {
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("storage", receive);
    };
  }, [storage, dispatch]);
  useEffect(() => {
    const id = workspace.draftSession.associatedRecordId;
    if (id) {
      const url = new URL(documentUrl(id));
      if (guideId && window.location.hash.startsWith(`#bw-guide:${guideId}:`))
        url.hash = window.location.hash;
      window.history.replaceState(null, "", url);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("document");
      window.history.replaceState(null, "", url);
    }
  }, [workspace.draftSession.associatedRecordId, guideId]);
  useEffect(() => {
    const navigate = () => {
      const id = new URL(window.location.href).searchParams.get("document");
      const record = latest.current.workspace.library.records.find((record) => record.id === id);
      if (record) dispatch({ type: "open-document", id: record.id });
    };
    window.addEventListener("popstate", navigate);
    return () => window.removeEventListener("popstate", navigate);
  }, [dispatch]);
  return (id: LocalBuildRecordId) =>
    latest.current.workspace.library.records.some((record) => record.id === id) &&
    flushRef.current("open document in new tab");
}
