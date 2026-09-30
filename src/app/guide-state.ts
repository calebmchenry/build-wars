import type { GuideMetadata, GuideNode } from "../domain/guide";
import { guideBuilds } from "../domain/guide";
import { guideDeletionImpact } from "../domain/guide-references";
import { parseGuideMarkdown, serializeGuideMarkdown } from "../guide/markdown";
import type { GuideDiagnostic } from "../guide/markdown";
import { validateGuideDocument } from "../guide/validation";
import { guideBuildAdapter, cloneGuideBuild } from "./guide-build-adapter";
import {
  commitGuide,
  createGuideHistory,
  stepGuideHistory,
  type AppliedGuide,
  type GuideHistory
} from "./guide-history";
import {
  createPersistedBuildSnapshot,
  hydrateEditorFromSnapshot,
  type PersistedBuildSnapshot
} from "./persistence-schema";
import { editorReducer, type EditorAction } from "./editor-state";
import type { AppCatalogViews } from "./catalogs";
export type GuideIntent =
  | { readonly kind: "none" }
  | { readonly kind: "prose"; readonly from: number; readonly to: number }
  | { readonly kind: "slot"; readonly buildId: string; readonly index: number };
export interface RuntimeGuideDocument {
  readonly kind: "guide";
  readonly history: GuideHistory;
  readonly generation: number;
  readonly selectedBuildId: string | null;
  readonly intent: GuideIntent;
  readonly composing: boolean;
  readonly capturedBuild: PersistedBuildSnapshot | null;
  readonly message: string | null;
  readonly diagnostics: readonly GuideDiagnostic[];
}
export type GuideCommand =
  | { type: "select"; buildId: string | null }
  | { type: "intent"; intent: GuideIntent }
  | { type: "composition"; active: boolean }
  | { type: "message"; message: string }
  | ({ session: string; revision: number } & (
      | { type: "edit"; document: AppliedGuide; typing?: boolean; retainUnresolved?: boolean }
      | { type: "build"; buildId: string; action: EditorAction }
      | { type: "insert-build"; snapshot: PersistedBuildSnapshot; id: string }
      | { type: "duplicate-build"; buildId: string; id: string }
      | { type: "delete-build"; buildId: string; retainUnresolved: boolean }
      | { type: "move-build"; buildId: string; direction: -1 | 1 }
      | { type: "metadata"; metadata: GuideMetadata }
      | { type: "import-markdown"; raw: string }
      | { type: "history"; direction: "undo" | "redo" }
      | {
          type: "insert-fragment";
          nodes: readonly GuideNode<PersistedBuildSnapshot>[];
          index: number;
        }
    ));
export function createRuntimeGuide(
  document: AppliedGuide,
  session: string,
  capturedBuild: PersistedBuildSnapshot | null = null
): RuntimeGuideDocument {
  return {
    kind: "guide",
    history: createGuideHistory(validateGuideDocument(document, guideBuildAdapter(null)), session),
    generation: 0,
    selectedBuildId: null,
    intent: { kind: "none" },
    composing: false,
    capturedBuild,
    message: null,
    diagnostics: []
  };
}
export function guideAddress(state: RuntimeGuideDocument) {
  return { session: state.history.session, revision: state.history.revision };
}
// The workspace preflights a command synchronously so the editor can reject it.
// Reuse that immutable result when React dispatches the exact same command (and
// when Strict Mode replays the reducer), rather than validating/encoding twice.
const reductions = new WeakMap<
  GuideCommand,
  {
    state: RuntimeGuideDocument;
    catalogs: AppCatalogViews | null;
    result: RuntimeGuideDocument;
  }
>();
export function reduceGuide(
  state: RuntimeGuideDocument,
  command: GuideCommand,
  catalogs: AppCatalogViews | null = null
): RuntimeGuideDocument {
  const cached = reductions.get(command);
  if (cached?.state === state && cached.catalogs === catalogs) return cached.result;
  const result = applyGuideCommand(state, command, catalogs);
  reductions.set(command, { state, catalogs, result });
  return result;
}
function applyGuideCommand(
  state: RuntimeGuideDocument,
  command: GuideCommand,
  catalogs: AppCatalogViews | null = null
): RuntimeGuideDocument {
  const history = state.history;
  const doc = history.frame.document;
  const message = (message: string): RuntimeGuideDocument => ({ ...state, message });
  if (
    "session" in command &&
    (command.session !== history.session || command.revision !== history.revision)
  )
    return message("This guide changed; the stale command was ignored.");
  if (command.type === "composition") return { ...state, composing: command.active };
  if (command.type === "message") return message(command.message);
  if (state.composing) return message("Finish composing before using this command.");
  if (command.type === "select")
    return {
      ...state,
      selectedBuildId: guideBuilds(doc).some((b) => b.id === command.buildId)
        ? command.buildId
        : null
    };
  if (command.type === "intent") return { ...state, intent: command.intent };
  if (command.type === "history") {
    const next = stepGuideHistory(history, command.direction);
    if (next === history) return state;
    return {
      ...state,
      history: next,
      generation: state.generation + 1,
      intent: { kind: "none" },
      diagnostics: [],
      message: null
    };
  }
  const publish = (
    candidate: AppliedGuide,
    typing = false,
    recovery = history.frame.recovery
  ): RuntimeGuideDocument => {
    try {
      const validated = validateGuideDocument(candidate, guideBuildAdapter(catalogs));
      const changed = serializeGuideMarkdown(validated) !== serializeGuideMarkdown(doc);
      if (!changed && !history.frame.recovery?.dirty && !recovery?.dirty) return state;
      const revision = changed ? history.revision + 1 : (history.frame.appliedRevision ?? 0);
      const frame = {
        document: validated,
        recovery: recovery?.dirty ? recovery : null,
        appliedRevision: revision
      };
      const next = commitGuide(history, frame, history, typing ? "typing" : null);
      if (next === history) return state;
      return { ...state, history: next, message: null, diagnostics: [] };
    } catch (error) {
      return message(error instanceof Error ? error.message : "Guide edit rejected.");
    }
  };
  if (command.type === "import-markdown") {
    const parsed = parseGuideMarkdown(
      command.raw,
      guideBuildAdapter(catalogs),
      () => doc.metadata.id
    );
    if (!parsed.ok)
      return {
        ...state,
        diagnostics: parsed.diagnostics,
        message: "Markdown was not imported. The guide is unchanged."
      };
    const next = publish(parsed.document, false, null);
    return next.history === history
      ? next
      : {
          ...next,
          generation: state.generation + 1,
          intent: { kind: "none" },
          selectedBuildId: null,
          message: "Markdown imported. Undo restores the previous guide."
        };
  }
  switch (command.type) {
    case "edit": {
      const remaining = new Set(guideBuilds(command.document).map((build) => build.id));
      if (
        !command.retainUnresolved &&
        guideBuilds(doc).some(
          (build) => !remaining.has(build.id) && guideDeletionImpact(doc, build.id)
        )
      )
        return message(
          "Deleting a referenced build requires confirmation to retain unresolved references."
        );
      return publish(command.document, command.typing);
    }
    case "metadata":
      return publish({ ...doc, metadata: command.metadata });
    case "build": {
      const build = guideBuilds(doc).find((b) => b.id === command.buildId);
      if (!build) return message("Build no longer exists.");
      const snapshot = createPersistedBuildSnapshot(
        editorReducer(hydrateEditorFromSnapshot(build.snapshot), command.action)
      );
      if (snapshot.build.id !== build.id)
        return message("Build identity cannot be replaced by an editor action.");
      return publish({
        ...doc,
        nodes: doc.nodes.map((n) => (n === build ? { ...build, snapshot } : n))
      });
    }
    case "insert-build":
      return publish({
        ...doc,
        nodes: [
          ...doc.nodes,
          {
            type: "build",
            id: command.id,
            snapshot: cloneGuideBuild(command.snapshot, command.id)
          },
          { type: "paragraph", children: [] }
        ]
      });
    case "duplicate-build": {
      const build = guideBuilds(doc).find((b) => b.id === command.buildId);
      if (!build) return state;
      const index = doc.nodes.indexOf(build);
      return publish({
        ...doc,
        nodes: [
          ...doc.nodes.slice(0, index + 1),
          { ...build, id: command.id, snapshot: cloneGuideBuild(build.snapshot, command.id) },
          ...doc.nodes.slice(index + 1)
        ]
      });
    }
    case "delete-build": {
      if (guideDeletionImpact(doc, command.buildId) && !command.retainUnresolved)
        return message(
          "This build has bound mentions. Cancel or delete while retaining unresolved references."
        );
      const next = publish({
        ...doc,
        nodes: doc.nodes.filter((n) => n.type !== "build" || n.id !== command.buildId)
      });
      return next === state
        ? state
        : {
            ...next,
            selectedBuildId:
              state.selectedBuildId === command.buildId ? null : state.selectedBuildId,
            intent: { kind: "none" }
          };
    }
    case "move-build": {
      const index = doc.nodes.findIndex((n) => n.type === "build" && n.id === command.buildId);
      const target = index + command.direction;
      if (index < 0 || target < 0 || target >= doc.nodes.length) return state;
      const nodes = [...doc.nodes];
      [nodes[index], nodes[target]] = [nodes[target]!, nodes[index]!];
      return publish({ ...doc, nodes });
    }
    case "insert-fragment": {
      if (!Number.isInteger(command.index) || command.index < 0 || command.index > doc.nodes.length)
        return state;
      return publish({
        ...doc,
        nodes: [
          ...doc.nodes.slice(0, command.index),
          ...command.nodes,
          ...doc.nodes.slice(command.index)
        ]
      });
    }
  }
}
export interface GuideBuildCapture {
  readonly session: string;
  readonly generation: number;
  readonly buildId: string;
  readonly snapshot: PersistedBuildSnapshot;
}
export function captureGuideBuild(
  state: RuntimeGuideDocument,
  buildId: string
): GuideBuildCapture | null {
  const build = guideBuilds(state.history.frame.document).find((b) => b.id === buildId);
  return build
    ? {
        session: state.history.session,
        generation: state.generation,
        buildId,
        snapshot: build.snapshot
      }
    : null;
}
export function isCurrentGuideBuild(
  state: RuntimeGuideDocument,
  capture: GuideBuildCapture
): boolean {
  return (
    state.history.session === capture.session &&
    state.generation === capture.generation &&
    guideBuilds(state.history.frame.document).some(
      (b) => b.id === capture.buildId && b.snapshot === capture.snapshot
    )
  );
}
