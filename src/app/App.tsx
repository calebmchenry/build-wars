import { selectAttributePreview } from "./attribute-preview-selectors";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch
} from "react";

import { promotedAppCatalogs, type AppCatalogLoadState } from "./catalogs";
import { BuildComposer } from "./components/BuildComposer";
import { SkillTooltip } from "./components/SkillTooltip";
import { StorageBanner } from "./components/StorageBanner";
import { DocumentSidebar } from "./components/DocumentSidebar";
import {
  documentLibraryReducer,
  initializeDocumentLibrary,
  type DocumentWorkspace
} from "./document-library";
import { useDocumentPersistence } from "./use-document-persistence";
import { GuideTransferDialog } from "./components/guide/GuideTransferDialog";
import { ThemeControls } from "./components/ThemeControls";
import { selectComposerLoadoutContext } from "./composer-selectors";
import { selectSkillDisplay, selectValidationView } from "./editor-selectors";
import type { EditorAction } from "./editor-state";
import { browserLocalStorage, readLocalLibrary, type LocalStoragePort } from "./local-storage";
import { persistedCatalogFactsFromValidation } from "./persistence-schema";
import { consumeShareFragment, parseShareFragment } from "./share-url";
import { importSkillTemplateToEditor } from "./template-workflow";
import {
  applyResolvedTheme,
  readThemePreference,
  resolveThemePreference,
  subscribeToSystemTheme,
  systemPrefersDark,
  writeThemePreference,
  type ThemePreference
} from "./theme";
import {
  createInitialWorkspaceState,
  needsDirtyGuard,
  workspaceReducer,
  type WorkspaceState
} from "./workspace-state";

const GuideWorkspace = lazy(() => import("./components/guide/GuideWorkspace"));

export function App({
  catalogState = promotedAppCatalogs,
  storagePort
}: {
  readonly catalogState?: AppCatalogLoadState;
  readonly storagePort?: LocalStoragePort | null;
} = {}) {
  const [storage] = useState(() =>
    storagePort === undefined ? browserLocalStorage() : storagePort
  );
  const [workspace, workspaceDispatch] = useReducer(
    documentLibraryReducer,
    { catalogState, storage },
    createDocumentWorkspaceFromBrowserStorage
  );
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    readThemePreference()
  );
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const resolvedTheme = resolveThemePreference(themePreference, systemDark);
  const latestWorkspaceRef = useRef<{
    readonly workspace: WorkspaceState;
    readonly savedWith: ReturnType<typeof persistedCatalogFactsFromValidation> | null;
  }>({ workspace, savedWith: null });
  const [guideTransferOpen, setGuideTransferOpen] = useState(false);
  const readyCatalogs = catalogState.status === "ready" ? catalogState.catalogs : null;
  const state = workspace.editor;
  const loadoutContext = selectComposerLoadoutContext(workspace);
  const preview = useMemo(
    () =>
      readyCatalogs === null || !loadoutContext.selected
        ? null
        : selectAttributePreview(state.build, readyCatalogs),
    [state.build, readyCatalogs, loadoutContext.selected]
  );
  const dispatch: Dispatch<EditorAction> = (action) =>
    workspaceDispatch({ type: "editor", action });
  const validation =
    readyCatalogs === null || workspace.document.kind === "guide"
      ? null
      : selectValidationView(state, readyCatalogs);
  const savedWith = useMemo(
    () => (validation === null ? null : persistedCatalogFactsFromValidation(validation.result)),
    [validation]
  );

  useEffect(() => {
    latestWorkspaceRef.current = { workspace, savedWith };
  }, [workspace, savedWith]);
  useEffect(() => subscribeToSystemTheme(setSystemDark), []);
  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);
  useEffect(() => {
    writeThemePreference(themePreference);
  }, [themePreference]);
  const openInTab = useDocumentPersistence(workspace, savedWith, storage, workspaceDispatch);
  const activeName =
    workspace.document.kind === "guide"
      ? workspace.document.history.frame.document.metadata.title
      : workspace.document.kind === "build-set"
        ? workspace.document.name
        : workspace.editor.build.name;
  const header = (
    <>
      <DocumentSidebar
        workspace={workspace}
        catalogs={readyCatalogs}
        dispatch={workspaceDispatch}
        onOpenTab={openInTab}
        onImportGuide={() => setGuideTransferOpen(true)}
        themeControls={
          <ThemeControls
            preference={themePreference}
            resolvedTheme={resolvedTheme}
            onChange={setThemePreference}
          />
        }
      />
      <header className="document-workspace-header">
        <span className="document-breadcrumb-type">
          {workspace.document.kind === "guide" ? "Guides" : "Builds"}
        </span>
        <span aria-hidden="true">/</span>
        <span className="document-breadcrumb">{activeName}</span>
      </header>
    </>
  );
  if (workspace.document.kind === "guide")
    return (
      <main className="app-shell editor-shell guide-shell" aria-label="Build Wars Guide">
        {header}
        <StorageBanner
          durability={workspace.draftSession.durability}
          diagnostics={workspace.storage.diagnostics}
          rejectedPayloadSummary={workspace.storage.rejectedPayloadSummary}
        />
        <Suspense fallback={<p role="status">Loading guide editor…</p>}>
          <GuideWorkspace
            key={workspace.document.history.session}
            workspace={workspace}
            guide={workspace.document}
            catalogs={readyCatalogs}
            dispatch={workspaceDispatch}
          />
        </Suspense>
        {guideTransferOpen && (
          <GuideTransferDialog
            getGuide={() => {
              const document = latestWorkspaceRef.current.workspace.document;
              if (document.kind !== "guide") throw new Error("The guide is no longer open.");
              return document;
            }}
            catalogs={readyCatalogs}
            onImport={(raw) => {
              if (workspace.document.kind !== "guide") return false;
              workspaceDispatch({
                type: "guide",
                command: {
                  type: "import-markdown",
                  raw,
                  session: workspace.document.history.session,
                  revision: workspace.document.history.revision
                },
                catalogs: readyCatalogs
              });
              return true;
            }}
            onClose={() => setGuideTransferOpen(false)}
          />
        )}
      </main>
    );

  if (catalogState.status === "error") {
    return (
      <main className="app-shell catalog-error-shell" aria-labelledby="app-title">
        {header}
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
    !loadoutContext.selected || state.tooltip.skillId === null
      ? null
      : selectSkillDisplay(
          catalogs,
          state,
          state.tooltip.skillId,
          "tooltip",
          null,
          preview ?? undefined
        );

  return (
    <main className="app-shell editor-shell" aria-label="Build Wars" data-catalog-state="ready">
      {header}
      <StorageBanner
        durability={workspace.draftSession.durability}
        diagnostics={workspace.storage.diagnostics}
        rejectedPayloadSummary={workspace.storage.rejectedPayloadSummary}
      />
      {!workspace.draftSession.allowWorkingDraftAutosave &&
      workspace.draftSession.hydrationSource === "share-url" ? (
        <div className="share-warning">
          <strong>Shared draft is not replacing stored draft</strong>
          <button
            type="button"
            onClick={() => workspaceDispatch({ type: "allow-working-draft-autosave" })}
          >
            Use as Draft
          </button>
        </div>
      ) : null}
      <BuildComposer
        workspace={workspace}
        catalogs={catalogs}
        validation={validationView}
        preview={preview}
        editorDispatch={dispatch}
        workspaceDispatch={workspaceDispatch}
        requestDraftReplacement={() =>
          needsDirtyGuard(workspace) && !window.confirm("Discard unsaved draft changes?")
            ? "cancel"
            : "discard"
        }
      />
      <SkillTooltip
        view={tooltipView}
        onClose={() => dispatch({ type: "set-tooltip", skillId: null, pinned: false })}
      />
      <div className="live-region" role="status" aria-live="polite">
        {state.transient?.text ?? ""}
      </div>
    </main>
  );
}

function createWorkspaceFromBrowserStorage({
  catalogState,
  storage
}: {
  readonly catalogState: AppCatalogLoadState;
  readonly storage: LocalStoragePort | null;
}): WorkspaceState {
  const parsed =
    catalogState.status === "ready" && typeof window !== "undefined"
      ? parseShareFragment(window.location.hash)
      : ({ ok: true, value: null } as const);
  const read = readLocalLibrary(storage);
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

function createDocumentWorkspaceFromBrowserStorage(
  input: Parameters<typeof createWorkspaceFromBrowserStorage>[0]
): DocumentWorkspace {
  const hasFragment = window.location.hash.length > 0;
  const requested = new URL(window.location.href).searchParams.get("document");
  let workspace = initializeDocumentLibrary(createWorkspaceFromBrowserStorage(input));
  if (requested && !hasFragment) {
    const record = workspace.library.records.find((record) => record.id === requested);
    if (record)
      workspace = documentLibraryReducer(workspace, { type: "open-document", id: record.id });
    else
      workspace = documentLibraryReducer(workspace, {
        type: "set-storage-diagnostics",
        durability: workspace.draftSession.durability,
        diagnostics: [
          {
            code: "missing-document",
            path: "location.search",
            message:
              "This document is no longer in this device’s library. Choose another entry from the sidebar."
          }
        ]
      });
  }
  return workspace;
}
