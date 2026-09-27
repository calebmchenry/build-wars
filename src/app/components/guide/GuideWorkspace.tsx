import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch } from "react";
import type { Editor } from "@tiptap/core";
import type { SelectionBookmark } from "@tiptap/pm/state";
import { GapCursor } from "@tiptap/pm/gapcursor";
import type { SkillId } from "../../../domain";
import { guideBuilds, type GuideMetadata } from "../../../domain/guide";
import { serializeGuideMarkdown } from "../../../guide/markdown";
import { safeGuideUrl } from "../../../guide/limits";
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
import { guideBuildAdapter } from "../../guide-build-adapter";
import { copyGuideTemplate } from "../../guide-template";
import { GuideBuildCard } from "./GuideBuildCard";
import { GuideBuildInspector } from "./GuideBuildInspector";
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
import { FocusedSkillCatalog } from "../FocusedSkillCatalog";
import { downloadGuide } from "../../guide-files";
import { GuideSourceEditor } from "./GuideSourceEditor";
import { GuideLibrary } from "./GuideLibrary";
import { GuideReader } from "./GuideReader";
import { GuideDialog, GuideTransferDialog } from "./GuideTransferDialog";
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
    guide.view === "visual" && !guide.composing,
    guide.history.session,
    guide.history.future.length
  );
  const [transferOpen, setTransferOpen] = useState(false);
  const [pendingSource, setPendingSource] = useState<"visual" | "undo" | "redo" | "discard" | null>(
    null
  );
  const current = useRef(guide);
  const sendRef = useRef<GuideDispatch>(() => false);
  const editorRef = useRef<Editor | null>(null);
  const returnSelection = useRef<{ from: number; to: number } | null>(null);
  const sourceSelection = useRef<{ start: number; end: number } | null>(null);
  const bookmark = useRef<SelectionBookmark | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (catalogOpen)
      catalogRef.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  }, [catalogOpen]);
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
  const [templateInput, setTemplateInput] = useState("");
  const [templateMode, setTemplateMode] = useState<"pve" | "pvp">("pve");
  const [savedBuild, setSavedBuild] = useState("");
  const [mentionContext, setMentionContext] = useState("generic");
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
  const send: GuideDispatch = (input) => {
    if (
      current.current.history.frame.recovery?.dirty &&
      (input.type === "history" || (input.type === "view" && input.view === "visual"))
    ) {
      setPendingSource(input.type === "history" ? input.direction : "visual");
      return false;
    }
    const command = { ...guideAddress(current.current), ...input } as GuideCommand;
    const next = reduceGuide(current.current, command, catalogs);
    const accepted = next === current.current || next.history !== current.current.history;
    current.current = next;
    dispatch({ type: "guide", command, catalogs });
    return accepted;
  };
  useEffect(() => {
    current.current = guide;
    sendRef.current = send;
  });
  const placement = useGuidePlacement({
    getGuide: () => current.current,
    editor: editorRef,
    bookmark,
    catalogs,
    send
  });
  const bindEditor = useCallback((editor: Editor | null) => {
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
    editor.on("transaction", ({ transaction }) => {
      if (!bookmark.current) return;
      const previous = bookmark.current.resolve(transaction.before);
      if (
        transaction.getMeta("guide-reconcile") ||
        transaction.mapping.mapResult(previous.from).deletedAcross ||
        transaction.mapping.mapResult(previous.to).deletedAcross
      ) {
        bookmark.current = null;
        sendRef.current({ type: "intent", intent: { kind: "none" } });
      } else bookmark.current = bookmark.current.map(transaction.mapping);
    });
    if (returnSelection.current) {
      const { from, to } = returnSelection.current;
      returnSelection.current = null;
      editor.commands.setTextSelection({
        from: Math.min(from, editor.state.doc.content.size),
        to: Math.min(to, editor.state.doc.content.size)
      });
      editor.commands.focus();
    }
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
        target.closest(".tiptap, dialog, .guide-metadata, .guide-insert-build") ||
        (target instanceof HTMLInputElement &&
          !["number", "radio", "checkbox"].includes(target.type))
      )
        return;
      if (input.inputType !== "historyUndo" && input.inputType !== "historyRedo") return;
      event.preventDefault();
      if (current.current.view !== "visual") return;
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
    if (placement.pickCatalog(skillId)) return;
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
            mentionContext === "generic"
              ? { kind: "generic" }
              : { kind: "local", buildId: mentionContext.slice(6) }
        }
      })
      .run();
    setCatalogOpen(false);
  };
  const canEdit = !guide.composing && !guide.history.frame.recovery?.dirty;
  const source = guide.history.frame.recovery?.raw ?? serializeGuideMarkdown(document);
  const metadataKey = JSON.stringify(document.metadata);
  const builds = useMemo(() => guideBuilds(document), [document]);
  useEffect(() => {
    if (guide.selectedBuildId)
      window.document.querySelector(".guide-inspector")?.scrollIntoView?.({ block: "nearest" });
  }, [guide.selectedBuildId]);
  const selected = builds.find((build) => build.id === guide.selectedBuildId);
  const savedOptions = workspace.library.records.flatMap((record) =>
    record.document.kind === "build"
      ? [{ key: record.id, label: record.name, snapshot: record.document.snapshot }]
      : record.document.kind === "build-set"
        ? record.document.snapshot.entries.map((entry) => ({
            key: `${record.id}:${entry.id}`,
            label: `${record.name} / ${entry.label}`,
            snapshot: entry.snapshot
          }))
        : guideBuilds(record.document.snapshot.document).map((build) => ({
            key: `${record.id}:${build.id}`,
            label: `${record.name} / ${build.snapshot.build.name}`,
            snapshot: build.snapshot
          }))
  );
  const insert = (snapshot: ReturnType<typeof createPersistedBuildSnapshot>) =>
    send({ type: "insert-build", snapshot, id: crypto.randomUUID() });
  return (
    <section
      className="guide-workspace"
      data-last-drop-effect={placement.lastDropEffect ?? undefined}
      aria-label="Guide workspace"
      onKeyDown={(event) => {
        if (guide.view === "read") return;
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
            event.target.closest("dialog, .guide-metadata, .guide-insert-build")) ||
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
      {guide.view !== "read" && (
        <span
          ref={nativeHistoryHostRef}
          className="guide-native-history"
          contentEditable
          suppressContentEditableWarning
          tabIndex={-1}
          aria-hidden="true"
          aria-label="Guide native history target"
        />
      )}
      <header className="guide-header">
        <h1>{document.metadata.title}</h1>
        <p>
          {workspace.draftSession.durability === "memory-only"
            ? "Memory-only guide — download Markdown to keep a copy."
            : workspace.draftSession.durability}
        </p>
        {guide.view !== "read" && (
          <details>
            <summary>Guide details</summary>
            <GuideMetadataForm
              key={metadataKey}
              metadata={document.metadata}
              onSave={(metadata) => send({ type: "metadata", metadata })}
            />
          </details>
        )}
        {guide.view !== "read" && <GuideLibrary workspace={workspace} dispatch={dispatch} />}
        <div className="guide-actions">
          {guide.view !== "read" && (
            <>
              <button
                disabled={guide.composing || !guide.history.past.length}
                onClick={() => send({ type: "history", direction: "undo" })}
              >
                Undo guide
              </button>
              <button
                disabled={guide.composing || !guide.history.future.length}
                onClick={() => send({ type: "history", direction: "redo" })}
              >
                Redo guide
              </button>
            </>
          )}
          <button
            disabled={guide.composing}
            aria-pressed={guide.view === "visual"}
            onClick={() =>
              guide.view === "read" && guide.history.frame.recovery?.dirty
                ? send({ type: "source-open" })
                : send({ type: "view", view: "visual" })
            }
          >
            Write
          </button>
          <button
            disabled={guide.composing}
            aria-pressed={guide.view === "source"}
            onClick={() => send({ type: "source-open" })}
          >
            Source
          </button>
          <button
            disabled={guide.composing}
            aria-pressed={guide.view === "read"}
            onClick={() => {
              if (editorRef.current)
                returnSelection.current = {
                  from: editorRef.current.state.selection.from,
                  to: editorRef.current.state.selection.to
                };
              placement.cancel();
              setCatalogOpen(false);
              setReference(null);
              send({ type: "view", view: "read" });
            }}
          >
            Read
          </button>
          {guide.view !== "read" && (
            <button disabled={guide.composing} onClick={() => setTransferOpen(true)}>
              Import Markdown
            </button>
          )}
          <button
            onClick={() => downloadGuide(serializeGuideMarkdown(document), document.metadata.title)}
          >
            Download applied Markdown
          </button>
          {guide.history.frame.recovery?.dirty && (
            <button onClick={() => downloadGuide(source, document.metadata.title + "-source")}>
              Download unapplied source
            </button>
          )}
        </div>
        <p role="status" aria-live="polite">
          {guide.message ??
            (guide.history.frame.recovery?.dirty && guide.view !== "read"
              ? "Unapplied source is retained. Apply or discard it to resume visual edits."
              : "")}
        </p>
        {guide.view === "read" && guide.history.frame.recovery?.dirty && (
          <p>
            Reading the last applied guide. Unapplied source is retained; choose Source to continue
            editing it.
          </p>
        )}
      </header>
      {guide.view === "read" ? (
        <GuideReader
          document={document}
          catalogs={catalogs}
          onCopy={(id) => {
            if (catalogs) void copyGuideTemplate(() => current.current, id, catalogs, send);
          }}
        />
      ) : guide.view === "source" ? (
        <GuideSourceEditor
          key={`${guide.history.session}:${guide.history.frame.appliedRevision}`}
          guide={guide}
          source={source}
          send={send}
          onDiscard={() => setPendingSource("discard")}
          selectionRef={sourceSelection}
        />
      ) : (
        <div className="guide-layout">
          <article className="guide-writing" aria-label="Guide writing pane">
            <GuideToolbar editor={editorRef} disabled={!canEdit} />
            <details className="guide-insert-build">
              <summary>Add a build at end</summary>
              <fieldset disabled={!canEdit}>
                <button
                  onClick={() =>
                    insert(createPersistedBuildSnapshot(createBlankEditorState("New build")))
                  }
                >
                  Insert blank build
                </button>
                <button
                  disabled={!guide.capturedBuild}
                  onClick={() => {
                    if (guide.capturedBuild) insert(guide.capturedBuild);
                  }}
                >
                  Insert captured composer build
                </button>
                <label>
                  Saved build
                  <select
                    value={savedBuild}
                    onChange={(event) => setSavedBuild(event.target.value)}
                  >
                    <option value="">Choose saved build</option>
                    {savedOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  disabled={!savedBuild}
                  onClick={() => {
                    const choice = savedOptions.find((option) => option.key === savedBuild);
                    if (choice) insert(choice.snapshot);
                  }}
                >
                  Insert saved copy
                </button>
                <label>
                  Build template to insert
                  <input
                    value={templateInput}
                    onChange={(event) => setTemplateInput(event.target.value)}
                  />
                </label>
                <label>
                  Template mode
                  <select
                    value={templateMode}
                    onChange={(event) => setTemplateMode(event.target.value as "pve" | "pvp")}
                  >
                    <option value="pve">PvE</option>
                    <option value="pvp">PvP</option>
                  </select>
                </label>
                <button
                  disabled={!catalogs || !templateInput.trim()}
                  onClick={() => {
                    try {
                      insert(
                        guideBuildAdapter(catalogs).expandTemplate(
                          templateInput,
                          crypto.randomUUID(),
                          templateMode
                        )
                      );
                      setTemplateInput("");
                    } catch (error) {
                      send({
                        type: "message",
                        message: error instanceof Error ? error.message : "Template rejected."
                      });
                    }
                  }}
                >
                  Insert template build
                </button>
              </fieldset>
            </details>
            <button
              className="guide-catalog-toggle"
              aria-expanded={catalogOpen}
              onClick={() => setCatalogOpen(!catalogOpen)}
            >
              Skills catalog
            </button>
            <button
              onClick={() => {
                const editor = editorRef.current;
                if (!editor) return;
                if (editor.state.doc.lastChild?.isTextblock) editor.commands.focus("end");
                else {
                  editor.view.dispatch(
                    editor.state.tr.setSelection(
                      new GapCursor(editor.state.doc.resolve(editor.state.doc.content.size))
                    )
                  );
                  editor.view.focus();
                }
              }}
            >
              Choose caret at end
            </button>
            <div className="guide-actions" aria-label="Skill placement">
              <button disabled={!catalogs || !canEdit} onClick={placement.armCatalog}>
                Pick from catalog
              </button>
              <button
                disabled={guide.intent.kind !== "slot" || !canEdit}
                onClick={() => {
                  if (guide.intent.kind === "slot")
                    placement.pickSlot(guide.intent.buildId, guide.intent.index);
                }}
              >
                Pick selected slot
              </button>
              <button disabled={!placement.picked || !canEdit} onClick={placement.placeAtCaret}>
                Place picked at caret
              </button>
              <button
                disabled={!placement.picked && !placement.pickingCatalog}
                onClick={placement.cancel}
              >
                Cancel placement
              </button>
              <span>
                Select a slot, then Pick selected slot; or Pick from catalog. Choose a destination
                slot or Place picked at caret. Tab and Enter operate these controls; Escape cancels.
              </span>
            </div>
            {placement.marker && (
              <span
                className="guide-drop-caret"
                style={{
                  left: placement.marker.left,
                  top: placement.marker.top,
                  height: placement.marker.height
                }}
                aria-hidden="true"
              />
            )}
            <GuideEditor
              document={document}
              onEditor={bindEditor}
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
                return send({ type: "edit", document, typing, retainUnresolved: removal });
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
                    if (!canEdit) return;
                    setReference({
                      node,
                      getPosition,
                      session: guide.history.session,
                      generation: guide.generation
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
            {selected && catalogs && (
              <GuideBuildInspector
                id={selected.id}
                snapshot={selected.snapshot}
                catalogs={catalogs}
                getGuide={() => current.current}
                send={send}
              />
            )}
          </article>
          <aside
            ref={catalogRef}
            className={`guide-catalog ${catalogOpen ? "is-open" : ""}`}
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
                ? `Target: remembered text caret · ${mentionContext === "generic" ? "Generic" : (builds.find((build) => build.id === mentionContext.slice(6))?.snapshot.build.name ?? "Missing build")} reference`
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
                <option value="generic">Generic — catalog ranges</option>
                {mentionContext !== "generic" &&
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
                      : mentionContext === "generic"
                        ? "Insert generic reference"
                        : "Insert bound reference",
                  place,
                  dragStart: placement.startCatalog,
                  dragEnd: placement.dragEnd
                }}
              />
            ) : (
              <p>
                Catalog unavailable. Guide text, source and Markdown downloads remain available.
              </p>
            )}
          </aside>
        </div>
      )}
      {transferOpen && (
        <GuideTransferDialog
          getGuide={() => current.current}
          catalogs={catalogs}
          onImport={(raw) => send({ type: "import-source", raw })}
          onClose={() => setTransferOpen(false)}
        />
      )}
      {pendingSource && (
        <GuideDialog title="Resolve unapplied source" onClose={() => setPendingSource(null)}>
          <p>
            Your exact source draft has not been applied. Keep editing it, apply the whole draft, or
            explicitly discard it before continuing.
          </p>
          <div className="guide-actions">
            {pendingSource !== "discard" && (
              <button
                onClick={() => {
                  send({ type: "source-apply" });
                  if (current.current.history.frame.recovery?.dirty) {
                    setPendingSource(null);
                    send({ type: "source-open" });
                    return;
                  }
                  const next = pendingSource;
                  setPendingSource(null);
                  if (next === "visual") send({ type: "view", view: "visual" });
                  else send({ type: "history", direction: next });
                }}
              >
                Apply and continue
              </button>
            )}
            <button
              autoFocus
              onClick={() => {
                setPendingSource(null);
                send({ type: "source-open" });
              }}
            >
              Keep editing source
            </button>
            <button
              onClick={() => {
                const next = pendingSource;
                setPendingSource(null);
                send({ type: "source-discard" });
                if (next === "undo" || next === "redo") send({ type: "history", direction: next });
              }}
            >
              Discard unapplied source
            </button>
          </div>
        </GuideDialog>
      )}
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
function GuideToolbar({
  editor,
  disabled
}: {
  readonly editor: { current: Editor | null };
  readonly disabled: boolean;
}) {
  return (
    <div className="guide-toolbar" role="toolbar" aria-label="Text formatting">
      <button
        disabled={disabled}
        onClick={() => editor.current?.chain().focus().toggleBold().run()}
      >
        Bold
      </button>
      <button
        disabled={disabled}
        onClick={() => editor.current?.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>
      <button
        disabled={disabled}
        onClick={() => editor.current?.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        Heading
      </button>
      <button
        disabled={disabled}
        onClick={() => editor.current?.chain().focus().toggleBulletList().run()}
      >
        Bullets
      </button>
      <button
        disabled={disabled}
        onClick={() => editor.current?.chain().focus().toggleOrderedList().run()}
      >
        Numbered list
      </button>
      <button
        disabled={disabled}
        onClick={() => editor.current?.chain().focus().toggleBlockquote().run()}
      >
        Quote
      </button>
      <button
        disabled={disabled}
        onClick={() => editor.current?.chain().focus().toggleCode().run()}
      >
        Inline code
      </button>
      <button
        disabled={disabled}
        onClick={() => editor.current?.chain().focus().toggleCodeBlock().run()}
      >
        Code block
      </button>
      <button
        disabled={disabled}
        onClick={() => editor.current?.chain().focus().setHorizontalRule().run()}
      >
        Rule
      </button>
      <button
        disabled={disabled}
        onClick={() => {
          const url = window.prompt("Link URL (https, http, mailto or local anchor)");
          if (url && safeGuideUrl(url))
            editor.current?.chain().focus().setLink({ href: url }).run();
        }}
      >
        Link
      </button>
    </div>
  );
}
function GuideMetadataForm({
  metadata,
  onSave
}: {
  readonly metadata: GuideMetadata;
  readonly onSave: (metadata: GuideMetadata) => void;
}) {
  const [title, setTitle] = useState(metadata.title);
  const [summary, setSummary] = useState(metadata.summary ?? "");
  const [tags, setTags] = useState(metadata.tags.join(", "));
  const [sources, setSources] = useState(metadata.sources);
  return (
    <form
      className="guide-metadata"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...metadata,
          title,
          summary: summary || null,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          sources
        });
      }}
    >
      <label>
        Guide title
        <input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Summary
        <textarea
          value={summary}
          maxLength={2048}
          onChange={(event) => setSummary(event.target.value)}
        />
      </label>
      <label>
        Tags (comma separated)
        <input value={tags} onChange={(event) => setTags(event.target.value)} />
      </label>
      {sources.map((source, index) => (
        <fieldset key={index}>
          <legend>Source {index + 1}</legend>
          {(
            ["label", "url", "attribution", "license", "licenseUrl", "revision", "notes"] as const
          ).map((field) => (
            <label key={field}>
              {field}
              <input
                value={source[field] ?? ""}
                maxLength={2048}
                onChange={(event) =>
                  setSources(
                    sources.map((item, i) =>
                      i === index ? { ...item, [field]: event.target.value } : item
                    )
                  )
                }
              />
            </label>
          ))}
          <button type="button" onClick={() => setSources(sources.filter((_, i) => i !== index))}>
            Remove source {index + 1}
          </button>
        </fieldset>
      ))}
      <button type="button" onClick={() => setSources([...sources, { label: "", url: "" }])}>
        Add source
      </button>
      <button type="submit">Save guide details</button>
    </form>
  );
}
