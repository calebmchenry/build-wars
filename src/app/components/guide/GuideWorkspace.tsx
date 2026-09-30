import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch } from "react";
import type { Editor } from "@tiptap/core";
import type { SelectionBookmark, Transaction } from "@tiptap/pm/state";
import { GapCursor } from "@tiptap/pm/gapcursor";
import type { SkillId } from "../../../domain";
import { guideBuilds } from "../../../domain/guide";
import type { AppCatalogViews } from "../../catalogs";
import { createBlankEditorState, editorReducer, type EditorState } from "../../editor-state";
import {
  guideAddress,
  reduceGuide,
  type GuideCommand,
  type RuntimeGuideDocument
} from "../../guide-state";
import { guideDeletionImpact } from "../../../domain/guide-references";
import { createPersistedBuildSnapshot } from "../../persistence-schema";
import { copyGuideTemplate } from "../../guide-template";
import { GuideBuildCard } from "./GuideBuildCard";
import { GuideMetadataHeader } from "./GuideMetadata";
import { GuideSkillMention, type GuideSkillNode } from "./GuideSkillMention";
import { GuideReferenceDialog } from "./GuideReferenceDialog";
import { useGuidePlacement } from "./useGuidePlacement";
import {
  guideFragmentMarkdown,
  readGuideFragment,
  writeGuideFragment
} from "../../guide-clipboard";
import type { WorkspaceAction, WorkspaceState } from "../../workspace-state";
import { useNativeGuideHistory } from "./useNativeGuideHistory";
import { GuideEditor } from "./GuideEditor";
import { precedingGuideBuildContext } from "../../guide-skill-references";
import { FocusedSkillCatalog } from "../FocusedSkillCatalog";
import "./guide.css";

type Unaddressed<T> = T extends unknown ? Omit<T, "session" | "revision"> : never;
export type GuideDispatch = (command: Unaddressed<GuideCommand>) => boolean;
export default function GuideWorkspace({
  workspace,
  guide,
  catalogs,
  dispatch
}: {
  readonly workspace: WorkspaceState;
  readonly guide: RuntimeGuideDocument;
  readonly catalogs: AppCatalogViews | null;
  readonly dispatch: Dispatch<WorkspaceAction>;
}) {
  const { host: nativeHistoryHostRef, priming: nativeHistoryPrimingRef } = useNativeGuideHistory(
    !guide.composing,
    guide.history.session,
    guide.history.future.length
  );
  const current = useRef(guide);
  const sendRef = useRef<GuideDispatch>(() => false);
  const editorRef = useRef<Editor | null>(null);
  const editorCleanup = useRef<(() => void) | null>(null);
  const bookmark = useRef<SelectionBookmark | null>(null);
  // The desktop sidebar stays visible; this flag controls the narrow-screen sheet.
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (catalogOpen)
      catalogRef.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  }, [catalogOpen]);
  const focusCatalog = () => {
    setCatalogOpen(true);
    catalogRef.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  };
  const [browser, setBrowser] = useState<EditorState>(() => {
    const state = createBlankEditorState();
    return {
      ...state,
      browser: {
        ...state.browser,
        filters: { ...state.browser.filters, professionScope: { kind: "all" as const } }
      }
    };
  });
  const [mentionContext, setMentionContext] = useState("auto");
  const [reference, setReference] = useState<{
    node: GuideSkillNode;
    getPosition: () => number | undefined;
    session: string;
    generation: number;
  } | null>(null);
  const closeReference = () => {
    const position = reference?.getPosition();
    setReference(null);
    if (position !== undefined)
      editorRef.current
        ?.chain()
        .focus()
        .setTextSelection(position + 1)
        .run();
  };
  const document = guide.history.frame.document;
  const send = useCallback<GuideDispatch>(
    (input) => {
      const command = { ...guideAddress(current.current), ...input } as GuideCommand;
      const next = reduceGuide(current.current, command, catalogs);
      const accepted = next === current.current || next.history !== current.current.history;
      current.current = next;
      dispatch({ type: "guide", command, catalogs });
      return accepted;
    },
    [catalogs, dispatch]
  );
  useEffect(() => {
    current.current = guide;
    sendRef.current = send;
  });
  const placement = useGuidePlacement({
    getGuide: () => current.current,
    getLibraryRecords: () => workspace.library.records,
    editor: editorRef,
    catalogs,
    send
  });
  const slotTarget =
    guide.intent.kind === "slot" ? `${guide.intent.buildId}:${guide.intent.index}` : null;
  const renderContextKey = useMemo(
    () => ({
      catalogs,
      selectedBuildId: guide.selectedBuildId,
      slotTarget,
      session: guide.history.session,
      generation: guide.generation
    }),
    [catalogs, guide.selectedBuildId, slotTarget, guide.history.session, guide.generation]
  );
  const bindEditor = useCallback((editor: Editor | null) => {
    editorCleanup.current?.();
    editorCleanup.current = null;
    editorRef.current = editor;
    bookmark.current = null;
    if (!editor) return;
    const selection = (event?: { transaction?: { getMeta: (key: string) => unknown } }) => {
      if (event?.transaction?.getMeta("guide-reconcile")) return;
      if (
        !editor.state.selection.$from.parent.isTextblock &&
        !(editor.state.selection instanceof GapCursor)
      )
        return;
      bookmark.current = editor.state.selection.getBookmark();
      sendRef.current({
        type: "intent",
        intent: { kind: "prose", from: editor.state.selection.from, to: editor.state.selection.to }
      });
    };
    editor.on("selectionUpdate", selection);
    editor.on("focus", selection);
    const mapBookmark = ({
      transaction,
      appendedTransactions
    }: {
      transaction: Transaction;
      appendedTransactions: Transaction[];
    }) => {
      for (const step of [transaction, ...appendedTransactions]) {
        if (!bookmark.current) return;
        if (step.getMeta("guide-reconcile")) {
          bookmark.current = null;
          sendRef.current({ type: "intent", intent: { kind: "none" } });
          return;
        }
        const previous = bookmark.current.resolve(step.before);
        if (
          step.mapping.mapResult(previous.from).deletedAcross ||
          step.mapping.mapResult(previous.to).deletedAcross
        ) {
          bookmark.current = null;
          sendRef.current({ type: "intent", intent: { kind: "none" } });
        } else bookmark.current = bookmark.current.map(step.mapping);
      }
    };
    editor.on("transaction", mapBookmark);
    editorCleanup.current = () => {
      editor.off("selectionUpdate", selection);
      editor.off("focus", selection);
      editor.off("transaction", mapBookmark);
    };
  }, []);
  useEffect(() => {
    const beforeInput = (event: Event) => {
      if (nativeHistoryPrimingRef.current) return;
      const input = event as InputEvent;
      const target = event.target;
      if (
        !(target instanceof HTMLElement) ||
        !target.closest(".guide-workspace") ||
        target instanceof HTMLTextAreaElement ||
        (target.closest(".tiptap") && !target.closest(".guide-inspector")) ||
        target.closest("dialog, .guide-document-heading") ||
        (target instanceof HTMLInputElement &&
          !["number", "radio", "checkbox"].includes(target.type))
      )
        return;
      if (input.inputType !== "historyUndo" && input.inputType !== "historyRedo") return;
      event.preventDefault();
      if (!current.current.composing)
        sendRef.current({
          type: "history",
          direction: input.inputType === "historyUndo" ? "undo" : "redo"
        });
    };
    window.document.addEventListener("beforeinput", beforeInput, true);
    return () => window.document.removeEventListener("beforeinput", beforeInput, true);
  }, [nativeHistoryPrimingRef]);
  const place = (skillId: SkillId) => {
    const intent = current.current.intent;
    if (intent.kind === "slot" && catalogs) {
      const build = guideBuilds(current.current.history.frame.document).find(
        (build) => build.id === intent.buildId
      );
      if (!build) {
        send({ type: "message", message: "Target build no longer exists." });
        return;
      }
      placement.placeCatalogInSlot(skillId, build.id, intent.index);
      return;
    }
    const editor = editorRef.current;
    if (
      mentionContext !== "auto" &&
      mentionContext !== "generic" &&
      !guideBuilds(current.current.history.frame.document).some(
        (build) => build.id === mentionContext.slice(6)
      )
    ) {
      send({
        type: "message",
        message: "The chosen reference build no longer exists. Choose Generic or another build."
      });
      return;
    }
    if (!editor || !bookmark.current || current.current.intent.kind !== "prose") {
      send({ type: "message", message: "Choose a text caret before inserting a skill reference." });
      return;
    }
    const selection = bookmark.current.resolve(editor.state.doc);
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.setSelection(selection);
        return true;
      })
      .insertContent({
        type: "guideSkill",
        attrs: {
          skillId: `catalog:skill:${Number(skillId)}`,
          context:
            mentionContext === "auto"
              ? precedingGuideBuildContext(editor.state.doc, selection.from)
              : mentionContext === "generic"
                ? { kind: "generic" }
                : { kind: "local", buildId: mentionContext.slice(6) }
        }
      })
      .run();
    setCatalogOpen(false);
  };
  const builds = useMemo(() => guideBuilds(document), [document]);
  return (
    <section
      className="guide-workspace"
      data-last-drop-effect={placement.lastDropEffect ?? undefined}
      aria-label="Guide workspace"
      onKeyDown={(event) => {
        if (
          event.defaultPrevented ||
          (event.target instanceof HTMLElement && event.target.closest("dialog"))
        )
          return;
        if (event.key === "Escape") {
          placement.cancel();
          setCatalogOpen(false);
          editorRef.current?.commands.focus();
        }
        if (
          event.defaultPrevented ||
          (event.target instanceof HTMLElement &&
            event.target.closest("dialog, .guide-document-heading")) ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target instanceof HTMLInputElement &&
            !["number", "radio", "checkbox"].includes(event.target.type)) ||
          guide.composing ||
          event.nativeEvent.isComposing
        )
          return;
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
          event.preventDefault();
          event.stopPropagation();
          send({ type: "history", direction: event.shiftKey ? "redo" : "undo" });
        }
      }}
    >
      <span
        ref={nativeHistoryHostRef}
        className="guide-native-history"
        contentEditable
        suppressContentEditableWarning
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Guide native history target"
      />
      <div className="guide-layout">
        <div className="guide-document">
          <header className="guide-header">
            <div className="guide-document-controls">
              {workspace.draftSession.durability === "memory-only" && (
                <p>Memory-only guide — download Markdown to keep a copy.</p>
              )}
              <p role="status" aria-live="polite">
                {guide.message}
              </p>
            </div>
            <GuideMetadataHeader
              metadata={document.metadata}
              onChange={(patch) =>
                send({
                  type: "metadata",
                  metadata: { ...current.current.history.frame.document.metadata, ...patch }
                })
              }
            />
          </header>
          <article className="guide-writing" aria-label="Guide writing pane">
            <div className="guide-writing-tools">
              <p className="guide-writing-hint">
                Markdown as you type. <kbd>/</kbd> for blocks · <kbd>[[</kbd> for skills · select
                text to format.
              </p>
              <button
                className="guide-catalog-toggle"
                aria-expanded={catalogOpen}
                onClick={focusCatalog}
              >
                Skills catalog
              </button>
            </div>
            {placement.marker && (
              <span
                className="guide-drop-caret"
                style={{
                  left: placement.marker.left,
                  top: placement.marker.top,
                  height: placement.marker.height,
                  width: placement.marker.width
                }}
                aria-hidden="true"
              />
            )}
            <GuideEditor
              document={document}
              catalogs={catalogs}
              renderContextKey={renderContextKey}
              onEditor={bindEditor}
              onInsertBuild={(insert) => {
                send({ type: "message", message: "" });
                insert(createPersistedBuildSnapshot(createBlankEditorState("New build")));
              }}
              onInsertSkill={focusCatalog}
              onChange={(document, typing) => {
                const ids = new Set(guideBuilds(document).map((build) => build.id));
                const removal = guideBuilds(current.current.history.frame.document).some(
                  (build) =>
                    !ids.has(build.id) &&
                    guideDeletionImpact(current.current.history.frame.document, build.id)
                );
                if (
                  removal &&
                  !window.confirm("Delete referenced builds and keep their mentions unresolved?")
                )
                  return false;
                return send({ type: "edit", document, typing, retainUnresolved: removal })
                  ? current.current.history.frame.document
                  : false;
              }}
              onHistory={(direction) => send({ type: "history", direction })}
              onComposition={(active) => send({ type: "composition", active })}
              onSkillDragOver={placement.dragOver}
              onSkillDrop={placement.drop}
              onSkillDragLeave={placement.leave}
              clipboard={{
                read: (raw) => readGuideFragment(raw, current.current, () => crypto.randomUUID()),
                write: (nodes) => ({
                  json: writeGuideFragment(current.current, nodes),
                  markdown: guideFragmentMarkdown(nodes)
                }),
                message: (message) => {
                  send({ type: "message", message });
                }
              }}
              renderSkill={(node, getPosition) => (
                <GuideSkillMention
                  node={node}
                  document={document}
                  catalogs={catalogs}
                  onEdit={() => {
                    if (current.current.composing) return;
                    setReference({
                      node,
                      getPosition,
                      session: current.current.history.session,
                      generation: current.current.generation
                    });
                  }}
                />
              )}
              renderBuild={(id) => {
                const build = builds.find((build) => build.id === id);
                return build ? (
                  <GuideBuildCard
                    id={id}
                    snapshot={build.snapshot}
                    catalogs={catalogs}
                    selected={id === guide.selectedBuildId}
                    send={send}
                    getGuide={() => current.current}
                    onOpenCatalog={focusCatalog}
                    placement={placement}
                    slotIndex={
                      guide.intent.kind === "slot" && guide.intent.buildId === id
                        ? guide.intent.index
                        : null
                    }
                    onCopy={() => {
                      if (catalogs)
                        void copyGuideTemplate(() => current.current, id, catalogs, send);
                    }}
                  />
                ) : (
                  <p>Missing build</p>
                );
              }}
            />
          </article>
        </div>
        <aside
          ref={catalogRef}
          className={`guide-catalog catalog-panel ${catalogOpen ? "is-open" : ""}`}
          aria-label="Guide catalog"
        >
          <button
            className="guide-catalog-close"
            onClick={() => {
              setCatalogOpen(false);
              editorRef.current?.commands.focus();
            }}
          >
            Close catalog
          </button>
          <p className="guide-target" role="status">
            {guide.intent.kind === "prose"
              ? `Target: remembered text caret · ${mentionContext === "auto" ? "Preceding build (or generic)" : mentionContext === "generic" ? "Generic" : (builds.find((build) => build.id === mentionContext.slice(6))?.snapshot.build.name ?? "Missing build")} reference`
              : guide.intent.kind === "slot"
                ? `Target: ${builds.find((build) => guide.intent.kind === "slot" && build.id === guide.intent.buildId)?.snapshot.build.name ?? "Missing build"} · slot ${guide.intent.index + 1}`
                : "No insertion target — choose a text caret"}
          </p>
          <label>
            New reference context
            <select
              value={mentionContext}
              onChange={(event) => setMentionContext(event.target.value)}
            >
              <option value="auto">Automatic — preceding build</option>
              <option value="generic">Generic — catalog ranges</option>
              {mentionContext !== "auto" &&
                mentionContext !== "generic" &&
                !builds.some((build) => `build:${build.id}` === mentionContext) && (
                  <option value={mentionContext}>Missing build — choose a context</option>
                )}
              {builds.map((build) => (
                <option key={build.id} value={`build:${build.id}`}>
                  {build.snapshot.build.name}
                </option>
              ))}
            </select>
          </label>
          {catalogs ? (
            <FocusedSkillCatalog
              state={browser}
              catalogs={catalogs}
              dispatch={(action) => setBrowser((state) => editorReducer(state, action))}
              placement={{
                label:
                  guide.intent.kind === "slot"
                    ? "Place in selected slot"
                    : mentionContext === "auto"
                      ? "Insert reference"
                      : mentionContext === "generic"
                        ? "Insert generic reference"
                        : "Insert bound reference",
                place,
                dragStart: placement.startCatalog,
                dragEnd: placement.dragEnd
              }}
            />
          ) : (
            <p>Catalog unavailable. Guide text and Markdown downloads remain available.</p>
          )}
        </aside>
      </div>
      {reference && (
        <GuideReferenceDialog
          node={reference.node}
          document={document}
          catalogs={catalogs}
          onClose={closeReference}
          onSave={(node) => {
            const position = reference.getPosition();
            const editor = editorRef.current;
            const existing = position === undefined ? null : editor?.state.doc.nodeAt(position);
            if (
              !editor ||
              position === undefined ||
              existing?.type.name !== "guideSkill" ||
              current.current.history.session !== reference.session ||
              current.current.generation !== reference.generation ||
              existing.attrs.skillId !== reference.node.skillId ||
              JSON.stringify(existing.attrs.context) !== JSON.stringify(reference.node.context)
            ) {
              send({
                type: "message",
                message: "The reference changed while its dialog was open. Reopen it to edit."
              });
              setReference(null);
              return;
            }
            editor.view.dispatch(
              editor.state.tr
                .setNodeMarkup(position, undefined, {
                  skillId: node.skillId,
                  context: node.context
                })
                .setMeta("guide-gesture", true)
            );
            closeReference();
          }}
        />
      )}
    </section>
  );
}
