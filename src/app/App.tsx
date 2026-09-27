import { emptyGuide } from "../guide/markdown";
import { matchingGuideAnchor } from "./guide-navigation";
import { loadDaggerExample } from "./examples/dagger-guide";
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
import { ThemeControls } from "./components/ThemeControls";
import { selectComposerLoadoutContext } from "./composer-selectors";
import { selectSkillDisplay, selectValidationView } from "./editor-selectors";
import type { EditorAction } from "./editor-state";
import {
  browserLocalStorage,
  readLocalLibrary,
  writeLocalLibrary,
  type LocalStoragePort
} from "./local-storage";
import {
  createPersistedBuildSnapshot,
  persistedCatalogFactsFromValidation
} from "./persistence-schema";
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
  createWorkspaceEnvelope,
  needsDirtyGuard,
  workspacePersistenceFingerprint,
  workspaceReducer,
  type WorkspaceAction,
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
    workspaceReducer,
    { catalogState, storage },
    createWorkspaceFromBrowserStorage
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
  const lastFlushTokenRef = useRef(workspace.storage.flushToken);
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
  useWorkspaceAutosave(workspace, savedWith, storage, workspaceDispatch, lastFlushTokenRef);
  usePagehideFlush(latestWorkspaceRef, storage, workspaceDispatch);

  const replaceDecision = () =>
    needsDirtyGuard(workspace) &&
    !window.confirm("Discard unsaved draft changes, including unapplied source?")
      ? ("cancel" as const)
      : ("discard" as const);
  const navigation = (
    <nav className="workspace-navigation" aria-label="Workspace">
      <button
        type="button"
        aria-pressed={workspace.document.kind !== "guide"}
        onClick={() => {
          if (workspace.document.kind === "guide")
            workspaceDispatch({ type: "new-draft", decision: replaceDecision() });
        }}
      >
        Composer
      </button>
      <button
        type="button"
        onClick={() =>
          workspaceDispatch({
            type: "replace-guide",
            document: emptyGuide(crypto.randomUUID()),
            session: crypto.randomUUID(),
            decision: replaceDecision(),
            capturedBuild: loadoutContext.selected ? createPersistedBuildSnapshot(state) : null
          })
        }
      >
        New Guide
      </button>
      <button
        type="button"
        onClick={() => {
          const decision = replaceDecision();
          if (decision === "cancel") return;
          workspaceDispatch({
            type: "replace-guide",
            document: loadDaggerExample(),
            session: crypto.randomUUID(),
            decision,
            capturedBuild: loadoutContext.selected ? createPersistedBuildSnapshot(state) : null
          });
        }}
      >
        Open example guide
      </button>
    </nav>
  );
  if (workspace.document.kind === "guide")
    return (
      <main className="app-shell guide-shell" aria-label="Build Wars Guide">
        <ThemeControls
          preference={themePreference}
          resolvedTheme={resolvedTheme}
          onChange={setThemePreference}
        />
        {navigation}
        <StorageBanner
          durability={workspace.draftSession.durability}
          diagnostics={workspace.storage.diagnostics}
          rejectedPayloadSummary={workspace.storage.rejectedPayloadSummary}
        />
        <Suspense fallback={<p role="status">Loading guide editor…</p>}>
          <GuideWorkspace
            workspace={workspace}
            guide={workspace.document}
            catalogs={readyCatalogs}
            dispatch={workspaceDispatch}
          />
        </Suspense>
      </main>
    );

  if (catalogState.status === "error") {
    return (
      <main className="app-shell catalog-error-shell" aria-labelledby="app-title">
        {navigation}
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
      <ThemeControls
        preference={themePreference}
        resolvedTheme={resolvedTheme}
        onChange={setThemePreference}
      />
      {navigation}
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
  if (
    typeof window !== "undefined" &&
    workspace.document.kind === "guide" &&
    matchingGuideAnchor(workspace.document.history.frame.document, window.location.hash)
  ) {
    workspace = { ...workspace, document: { ...workspace.document, view: "read" } };
  }
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
  const latest = useRef({ workspace, savedWith });
  useEffect(() => {
    latest.current = { workspace, savedWith };
  });
  const token = workspacePersistenceFingerprint(workspace, savedWith);
  const canSave = savedWith !== null || workspace.document.kind === "guide";
  const guide = workspace.document.kind === "guide";
  const lastDurable = workspace.storage.lastDurableFingerprint;
  const durability = workspace.draftSession.durability;
  const flushToken = workspace.storage.flushToken;
  useEffect(() => {
    if (
      !canSave ||
      token === lastDurable ||
      durability === "write-blocked" ||
      durability === "conflict"
    )
      return;
    const explicitFlush = flushToken !== lastFlushTokenRef.current;
    lastFlushTokenRef.current = flushToken;
    const timer = window.setTimeout(
      () => {
        const current = latest.current;
        const now = new Date().toISOString();
        const envelope = createWorkspaceEnvelope(current.workspace, current.savedWith, now);
        const result = writeLocalLibrary(storage, envelope, {
          now,
          reason: explicitFlush ? "explicit flush" : "autosave",
          expectedRevision: current.workspace.storage.revision
        });
        dispatch({ type: "storage-write-result", result, durableFingerprint: token });
      },
      explicitFlush ? 0 : guide ? 500 : 150
    );
    return () => window.clearTimeout(timer);
  }, [
    canSave,
    dispatch,
    durability,
    flushToken,
    guide,
    lastDurable,
    lastFlushTokenRef,
    storage,
    token
  ]);
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
        (latest.savedWith === null && latest.workspace.document.kind !== "guide") ||
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
