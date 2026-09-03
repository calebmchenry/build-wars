import { useEffect, useMemo, useReducer, useRef, useState, type Dispatch } from "react";

import { promotedAppCatalogs, type AppCatalogLoadState } from "./catalogs";
import { AttributeEditor } from "./components/AttributeEditor";
import { CatalogAttribution } from "./components/CatalogAttribution";
import { EditorWorkspaceTabs, type EditorWorkspaceTab } from "./components/EditorWorkspaceTabs";
import { EquipmentPanel } from "./components/EquipmentPanel";
import { BackupDialog, RestoreDialog } from "./components/LibraryDialogs";
import { LibraryPanel } from "./components/LibraryPanel";
import { ProfessionModeEditor } from "./components/ProfessionModeEditor";
import { ShareControls } from "./components/ShareControls";
import { SkillBar } from "./components/SkillBar";
import { SkillBrowser } from "./components/SkillBrowser";
import { SkillTooltip } from "./components/SkillTooltip";
import { StorageBanner } from "./components/StorageBanner";
import { TemplateControls } from "./components/TemplateDialogs";
import { ValidationPanel } from "./components/ValidationPanel";
import { selectEquipmentPanelView } from "./equipment-selectors";
import { selectSkillDisplay, selectValidationView } from "./editor-selectors";
import type { EditorAction } from "./editor-state";
import { browserLocalStorage, readLocalLibrary, writeLocalLibrary } from "./local-storage";
import { persistedCatalogFactsFromValidation } from "./persistence-schema";
import { consumeShareFragment, parseShareFragment } from "./share-url";
import { importSkillTemplateToEditor } from "./template-workflow";
import {
  createInitialWorkspaceState,
  createWorkspaceEnvelope,
  needsDirtyGuard,
  workspacePersistenceFingerprint,
  workspaceReducer,
  type WorkspaceAction,
  type WorkspaceState
} from "./workspace-state";

export function App() {
  const catalogState = promotedAppCatalogs;
  const storage = useMemo(() => browserLocalStorage(), []);
  const [workspace, workspaceDispatch] = useReducer(
    workspaceReducer,
    catalogState,
    createWorkspaceFromBrowserStorage
  );
  const [shareRecordId, setShareRecordId] = useState<string | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<EditorWorkspaceTab>("skills");
  const latestWorkspaceRef = useRef<{
    readonly workspace: WorkspaceState;
    readonly savedWith: ReturnType<typeof persistedCatalogFactsFromValidation> | null;
  }>({ workspace, savedWith: null });
  const lastFlushTokenRef = useRef(workspace.storage.flushToken);
  const readyCatalogs = catalogState.status === "ready" ? catalogState.catalogs : null;
  const state = workspace.editor;
  const dispatch: Dispatch<EditorAction> = (action) =>
    workspaceDispatch({ type: "editor", action });
  const validation = readyCatalogs === null ? null : selectValidationView(state, readyCatalogs);
  const savedWith = useMemo(
    () => (validation === null ? null : persistedCatalogFactsFromValidation(validation.result)),
    [validation]
  );

  useEffect(() => {
    latestWorkspaceRef.current = { workspace, savedWith };
  }, [workspace, savedWith]);
  useWorkspaceAutosave(workspace, savedWith, storage, workspaceDispatch, lastFlushTokenRef);
  usePagehideFlush(latestWorkspaceRef, storage, workspaceDispatch);

  if (catalogState.status === "error") {
    return (
      <main className="app-shell catalog-error-shell" aria-labelledby="app-title">
        <section className="editor-panel catalog-error-state">
          <p className="eyebrow">Catalog error</p>
          <h1 id="app-title">Build Wars</h1>
          <h2>Catalogs could not be adapted</h2>
          <ul>
            {catalogState.error.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  const catalogs = catalogState.catalogs;
  const validationView = validation;
  if (validationView === null || savedWith === null) {
    throw new Error("Catalog validation view missing after catalog readiness check.");
  }
  const tooltipView =
    workspaceTab !== "skills" || state.tooltip.skillId === null
      ? null
      : selectSkillDisplay(catalogs, state, state.tooltip.skillId, "tooltip");
  const equipmentView = selectEquipmentPanelView(state, catalogs, validationView.result);

  return (
    <main className="app-shell editor-shell" aria-labelledby="app-title" data-catalog-state="ready">
      <CatalogAttribution attribution={catalogs.attribution} />
      <StorageBanner
        durability={workspace.draftSession.durability}
        diagnostics={workspace.storage.diagnostics}
        rejectedPayloadSummary={workspace.storage.rejectedPayloadSummary}
      />
      <div className="workspace-layout">
        <div className="left-column">
          <LibraryPanel
            workspace={workspace}
            catalogs={catalogs}
            currentFacts={savedWith}
            dispatch={workspaceDispatch}
            onShareRecord={setShareRecordId}
            onOpenBackup={() => setBackupOpen(true)}
            onOpenRestore={() => setRestoreOpen(true)}
          />
          <ProfessionModeEditor
            state={state}
            catalogs={catalogs}
            validation={validationView.result}
            dispatch={dispatch}
          />
          <AttributeEditor
            state={state}
            catalogs={catalogs}
            validation={validationView}
            dispatch={dispatch}
          />
          <TemplateControls
            state={state}
            catalogs={catalogs}
            validation={validationView}
            dispatch={dispatch}
            requestDraftReplacement={() =>
              needsDirtyGuard(workspace) && !window.confirm("Discard unsaved draft changes?")
                ? "cancel"
                : "discard"
            }
          />
          <ShareControls
            workspace={workspace}
            catalogs={catalogs}
            shareRecordId={shareRecordId}
            dispatch={workspaceDispatch}
          />
          <ValidationPanel validation={validationView} />
        </div>
        <div className="main-column">
          <EditorWorkspaceTabs
            activeTab={workspaceTab}
            onChange={setWorkspaceTab}
            skills={
              <>
                <SkillBar state={state} catalogs={catalogs} dispatch={dispatch} />
                <SkillBrowser state={state} catalogs={catalogs} dispatch={dispatch} />
              </>
            }
            equipment={<EquipmentPanel view={equipmentView} dispatch={dispatch} />}
          />
        </div>
        <SkillTooltip
          view={tooltipView}
          onClose={() => dispatch({ type: "set-tooltip", skillId: null, pinned: false })}
        />
      </div>
      <div className="live-region" role="status" aria-live="polite">
        {state.transient?.text ?? ""}
      </div>
      <BackupDialog
        open={backupOpen}
        workspace={workspace}
        currentFacts={savedWith}
        dispatch={workspaceDispatch}
        onClose={() => setBackupOpen(false)}
      />
      <RestoreDialog
        open={restoreOpen}
        workspace={workspace}
        dispatch={workspaceDispatch}
        onClose={() => setRestoreOpen(false)}
      />
    </main>
  );
}

function createWorkspaceFromBrowserStorage(catalogState: AppCatalogLoadState): WorkspaceState {
  const parsed =
    catalogState.status === "ready" && typeof window !== "undefined"
      ? parseShareFragment(window.location.hash)
      : ({ ok: true, value: null } as const);
  const read = readLocalLibrary(browserLocalStorage());
  let workspace = createInitialWorkspaceState({
    envelope: read.envelope,
    writeBlocked: read.writeBlocked,
    diagnostics: read.diagnostics,
    readStatus: read.status
  });
  if (catalogState.status !== "ready" || typeof window === "undefined") {
    return workspace;
  }

  if (!parsed.ok) {
    if (parsed.error.code === "no-share-fragment") {
      return workspace;
    }
    return workspaceReducer(workspace, {
      type: "set-storage-diagnostics",
      durability: workspace.draftSession.durability,
      diagnostics: [
        ...workspace.storage.diagnostics,
        { code: parsed.error.code, path: "location.hash", message: parsed.error.message }
      ]
    });
  }
  if (parsed.value === null) {
    return workspace;
  }

  const imported = importSkillTemplateToEditor(
    parsed.value.bareCode,
    workspace.editor,
    catalogState.catalogs
  );
  if (!imported.ok) {
    return workspaceReducer(workspace, {
      type: "set-storage-diagnostics",
      durability: workspace.draftSession.durability,
      diagnostics: [
        ...workspace.storage.diagnostics,
        { code: "invalid-template-code", path: "location.hash", message: imported.error.message }
      ]
    });
  }

  workspace = workspaceReducer(workspace, {
    type: "replace-draft",
    editor: {
      ...imported.state,
      build: {
        ...imported.state.build,
        mode: parsed.value.mode
      }
    },
    source: "share-url",
    decision: "discard",
    allowWorkingDraftAutosave: read.envelope.workingDraft === null
  });
  const consumed = consumeShareFragment({ location: window.location, history: window.history });
  if (!consumed.ok) {
    return workspaceReducer(workspace, {
      type: "set-storage-diagnostics",
      durability: workspace.draftSession.durability,
      diagnostics: [
        ...workspace.storage.diagnostics,
        { code: consumed.error.code, path: "history", message: consumed.error.message }
      ]
    });
  }
  return workspace;
}

function useWorkspaceAutosave(
  workspace: WorkspaceState,
  savedWith: ReturnType<typeof persistedCatalogFactsFromValidation> | null,
  storage: ReturnType<typeof browserLocalStorage>,
  dispatch: Dispatch<WorkspaceAction>,
  lastFlushTokenRef: { current: number }
): void {
  useEffect(() => {
    if (savedWith === null) {
      return;
    }
    const durableFingerprint = workspacePersistenceFingerprint(workspace, savedWith);
    if (durableFingerprint === workspace.storage.lastDurableFingerprint) {
      return;
    }
    if (workspace.draftSession.durability === "write-blocked") {
      return;
    }
    const explicitFlush = workspace.storage.flushToken !== lastFlushTokenRef.current;
    lastFlushTokenRef.current = workspace.storage.flushToken;
    const delay = explicitFlush ? 0 : 150;
    const timer = window.setTimeout(() => {
      const now = new Date().toISOString();
      const envelope = createWorkspaceEnvelope(workspace, savedWith, now);
      const result = writeLocalLibrary(storage, envelope, {
        now,
        reason: explicitFlush ? "explicit flush" : "autosave",
        expectedRevision: workspace.storage.revision
      });
      dispatch({ type: "storage-write-result", result, durableFingerprint });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [dispatch, lastFlushTokenRef, savedWith, storage, workspace]);
}

function usePagehideFlush(
  latestWorkspaceRef: {
    current: {
      readonly workspace: WorkspaceState;
      readonly savedWith: ReturnType<typeof persistedCatalogFactsFromValidation> | null;
    };
  },
  storage: ReturnType<typeof browserLocalStorage>,
  dispatch: Dispatch<WorkspaceAction>
): void {
  useEffect(() => {
    const flush = () => {
      const latest = latestWorkspaceRef.current;
      if (
        latest.savedWith === null ||
        latest.workspace.draftSession.durability === "write-blocked"
      ) {
        return;
      }
      const durableFingerprint = workspacePersistenceFingerprint(
        latest.workspace,
        latest.savedWith
      );
      if (durableFingerprint === latest.workspace.storage.lastDurableFingerprint) {
        return;
      }
      const now = new Date().toISOString();
      const envelope = createWorkspaceEnvelope(latest.workspace, latest.savedWith, now);
      const result = writeLocalLibrary(storage, envelope, {
        now,
        reason: "pagehide",
        expectedRevision: latest.workspace.storage.revision
      });
      dispatch({ type: "storage-write-result", result, durableFingerprint });
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [dispatch, latestWorkspaceRef, storage]);
}
