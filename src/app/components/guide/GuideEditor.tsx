import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { Node as TiptapNode, type Editor } from "@tiptap/core";
import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  type NodeViewProps
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { ReplaceStep } from "@tiptap/pm/transform";
import type { GuideNode } from "../../../domain/guide";
import type { AppliedGuide } from "../../guide-history";
import type { PersistedBuildSnapshot } from "../../persistence-schema";
import { GUIDE_CLIPBOARD_MIME } from "../../guide-clipboard";
import { GUIDE_LIMITS, utf8Bytes } from "../../../guide/limits";
import { projectGuideNodes, readGuideNodes } from "../../guide-editor-adapter";
interface GuideRenderContext {
  readonly document: AppliedGuide;
  readonly renderBuild: (id: string) => ReactNode;
  readonly renderSkill: (
    node: Extract<GuideNode<PersistedBuildSnapshot>, { type: "skill" }>,
    getPosition: () => number | undefined
  ) => ReactNode;
}
const RenderContext = createContext<GuideRenderContext | null>(null);
function BuildView({ node }: NodeViewProps) {
  const context = useContext(RenderContext);
  return (
    <NodeViewWrapper contentEditable={false} className="guide-build-embed">
      {context?.renderBuild(node.attrs.id as string)}
    </NodeViewWrapper>
  );
}
function MentionView({ node, getPos }: NodeViewProps) {
  const context = useContext(RenderContext);
  return (
    <NodeViewWrapper as="span" contentEditable={false} className="guide-mention">
      {context?.renderSkill(
        {
          type: "skill",
          skillId: node.attrs.skillId as string,
          context: node.attrs.context as Extract<
            GuideNode<PersistedBuildSnapshot>,
            { type: "skill" }
          >["context"]
        },
        getPos
      )}
    </NodeViewWrapper>
  );
}
const BuildNode = TiptapNode.create({
  name: "guideBuild",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes: () => ({ id: { default: null } }),
  parseHTML: () => [],
  renderHTML: () => ["div", { "data-guide-build": "" }],
  addNodeView: () => ReactNodeViewRenderer(BuildView)
});
const SkillNode = TiptapNode.create({
  name: "guideSkill",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes: () => ({ skillId: { default: null }, context: { default: { kind: "generic" } } }),
  parseHTML: () => [],
  renderHTML: () => ["span", { "data-guide-skill": "" }],
  addNodeView: () => ReactNodeViewRenderer(MentionView, { as: "span" })
});
const OpaqueNode = TiptapNode.create({
  name: "guideOpaque",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes: () => ({ raw: { default: "" } }),
  parseHTML: () => [],
  renderHTML: ({ node }) => ["pre", { "data-guide-opaque": "" }, node.attrs.raw as string]
});
export function GuideEditor(
  props: GuideRenderContext & {
    readonly onChange: (document: AppliedGuide, typing: boolean) => boolean | void;
    readonly onHistory: (direction: "undo" | "redo") => void;
    readonly onEditor: (editor: Editor | null) => void;
    readonly onComposition: (active: boolean) => void;
    readonly onSkillDragOver?: (view: EditorView, event: DragEvent) => boolean;
    readonly onSkillDrop?: (view: EditorView, event: DragEvent) => boolean;
    readonly onSkillDragLeave?: () => void;
    readonly clipboard?: {
      readonly read: (raw: string) => readonly GuideNode<PersistedBuildSnapshot>[];
      readonly write: (nodes: readonly GuideNode<PersistedBuildSnapshot>[]) => {
        readonly json: string;
        readonly markdown: string;
      };
      readonly message: (message: string) => void;
    };
  }
) {
  const latest = useRef(props);
  const published = useRef(props.document);
  const composition = useRef<Editor["state"]["doc"] | null>(null);
  const incoming = useRef<readonly GuideNode<PersistedBuildSnapshot>[]>([]);
  const copy = (view: EditorView, event: ClipboardEvent) => {
    if (!latest.current.clipboard || !event.clipboardData || view.state.selection.empty)
      return false;
    try {
      const nodes = readGuideNodes(
        view.state.selection.content().content.toJSON() ?? [],
        latest.current.document
      );
      const data = latest.current.clipboard.write(nodes);
      event.preventDefault();
      event.clipboardData.setData(GUIDE_CLIPBOARD_MIME, data.json);
      event.clipboardData.setData("text/plain", data.markdown);
      if (event.type === "cut" && !composition.current)
        view.dispatch(view.state.tr.deleteSelection().setMeta("guide-gesture", true));
    } catch (error) {
      event.preventDefault();
      latest.current.clipboard.message(
        error instanceof Error ? error.message : "Guide fragment could not be copied."
      );
    }
    return true;
  };
  useEffect(() => {
    latest.current = props;
  });
  const editor: Editor | null = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
        link: { openOnClick: false, autolink: false },
        underline: false,
        strike: false,
        trailingNode: false
      }),
      BuildNode,
      SkillNode,
      OpaqueNode
    ],
    content: { type: "doc", content: projectGuideNodes(props.document.nodes) },
    editorProps: {
      attributes: { "aria-label": "Guide document", role: "textbox", "aria-multiline": "true" },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
          event.preventDefault();
          event.stopPropagation();
          if (!event.isComposing && !composition.current)
            latest.current.onHistory(event.shiftKey ? "redo" : "undo");
          return true;
        }
        return false;
      },
      handleDOMEvents: {
        copy,
        cut: copy,
        paste: (view, event) => {
          if (!latest.current.clipboard || !event.clipboardData) return false;
          event.preventDefault();
          if (composition.current) {
            latest.current.clipboard.message("Finish composing before pasting a fragment.");
            return true;
          }
          try {
            if (event.clipboardData.types.includes(GUIDE_CLIPBOARD_MIME)) {
              incoming.current = latest.current.clipboard.read(
                event.clipboardData.getData(GUIDE_CLIPBOARD_MIME)
              );
              editor
                ?.chain()
                .command(({ tr }) => {
                  tr.setMeta("guide-gesture", true);
                  return true;
                })
                .insertContent(projectGuideNodes(incoming.current))
                .run();
            } else {
              const text = event.clipboardData.getData("text/plain");
              if (utf8Bytes(text) > GUIDE_LIMITS.rawBytes)
                throw new Error("Clipboard text exceeds guide capacity.");
              if (!text)
                throw new Error("Clipboard has no plain text or supported guide fragment.");
              if (view.state.selection.$from.parent.type.spec.code)
                view.dispatch(view.state.tr.insertText(text).setMeta("guide-gesture", true));
              else
                editor
                  ?.chain()
                  .command(({ tr }) => {
                    tr.setMeta("guide-gesture", true);
                    return true;
                  })
                  .insertContent(
                    text.split(/\r?\n/).map((line) => ({
                      type: "paragraph",
                      content: line ? [{ type: "text", text: line }] : []
                    }))
                  )
                  .run();
            }
          } catch (error) {
            latest.current.clipboard.message(
              error instanceof Error ? error.message : "Clipboard rejected; the guide is unchanged."
            );
          } finally {
            incoming.current = [];
          }
          return true;
        },
        dragover: (view, event) => latest.current.onSkillDragOver?.(view, event) ?? false,
        drop: (view, event) => latest.current.onSkillDrop?.(view, event) ?? false,
        dragleave: () => {
          latest.current.onSkillDragLeave?.();
          return false;
        },
        compositionstart: (view) => {
          composition.current ??= view.state.doc;
          latest.current.onComposition(true);
          return false;
        },
        compositionend: (view) => {
          // Let ProseMirror's DOM observer consume the final native mutation first.
          // Intermediate candidates never become semantic history or durable state.
          setTimeout(() => {
            const before = composition.current;
            composition.current = null;
            if (view.isDestroyed) return;
            latest.current.onComposition(false);
            if (before && !before.eq(view.state.doc)) {
              const document = {
                ...latest.current.document,
                nodes: readGuideNodes(
                  view.state.doc.toJSON().content ?? [],
                  latest.current.document
                )
              };
              published.current = document;
              if (latest.current.onChange(document, false) === false) {
                published.current = latest.current.document;
                editor?.commands.setContent(
                  { type: "doc", content: projectGuideNodes(latest.current.document.nodes) },
                  { emitUpdate: false }
                );
              }
            }
          }, 0);
          return false;
        },
        beforeinput: (_view, event) => {
          const input = event as InputEvent;
          if (input.inputType === "historyUndo" || input.inputType === "historyRedo") {
            event.preventDefault();
            if (!composition.current)
              latest.current.onHistory(input.inputType === "historyUndo" ? "undo" : "redo");
            return true;
          }
          return false;
        }
      }
    },
    onUpdate: ({ editor, transaction }) => {
      if (transaction.getMeta("guide-reconcile") || composition.current) return;
      const document = {
        ...latest.current.document,
        nodes: readGuideNodes(editor.getJSON().content ?? [], {
          ...latest.current.document,
          nodes: [...latest.current.document.nodes, ...incoming.current]
        })
      };
      published.current = document;
      const typing =
        !transaction.getMeta("guide-gesture") &&
        transaction.steps.every((step) => {
          if (!(step instanceof ReplaceStep) || step.slice.openStart || step.slice.openEnd)
            return false;
          let textOnly = true;
          step.slice.content.forEach((node) => {
            if (!node.isText) textOnly = false;
          });
          return textOnly;
        });
      if (latest.current.onChange(document, typing) === false) {
        published.current = latest.current.document;
        editor.commands.setContent(
          { type: "doc", content: projectGuideNodes(latest.current.document.nodes) },
          { emitUpdate: false }
        );
      }
    }
  });
  const { onEditor } = props;
  useEffect(() => {
    onEditor(editor);
    return () => onEditor(null);
  }, [editor, onEditor]);
  useEffect(() => {
    if (!editor || composition.current || props.document === published.current) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || editor.isDestroyed) return;
      const content = editor.schema.nodeFromJSON({
        type: "doc",
        content: projectGuideNodes(props.document.nodes)
      });
      if (!editor.state.doc.eq(content)) {
        const selection = editor.state.selection;
        const start = editor.state.doc.content.findDiffStart(content.content) ?? 0;
        const end = editor.state.doc.content.findDiffEnd(content.content);
        const overlap = end ? start - Math.min(end.a, end.b) : 0;
        const oldEnd = end ? end.a + Math.max(0, overlap) : editor.state.doc.content.size;
        const newEnd = end ? end.b + Math.max(0, overlap) : content.content.size;
        const transaction = editor.state.tr
          .replace(start, oldEnd, content.slice(start, newEnd))
          .setMeta("guide-reconcile", true);
        // Preserve a nearby caret across whole-document commands. Inspector-only
        // snapshot edits do not touch the vendor document or its selection at all.
        transaction.setSelection(
          TextSelection.near(
            transaction.doc.resolve(Math.min(selection.from, transaction.doc.content.size))
          )
        );
        editor.view.dispatch(transaction);
      }
      published.current = props.document;
    });
    return () => {
      cancelled = true;
    };
  }, [editor, props.document]);
  return (
    <RenderContext.Provider value={props}>
      <EditorContent editor={editor} />
    </RenderContext.Provider>
  );
}
