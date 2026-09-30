import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor, ChainedCommands } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { safeGuideUrl } from "../../../guide/limits";
import type { AppCatalogViews, PlaceholderIconDescriptor } from "../../catalogs";
import { guideSkillSearchRange, precedingGuideBuildContext } from "../../guide-skill-references";
import { CatalogIcon } from "../CatalogIcon";

export interface SlashRange {
  readonly from: number;
  readonly to: number;
  readonly query: string;
}
function guideSlashRange(state: EditorState): SlashRange | null {
  const { selection } = state;
  const { $from } = selection;
  if (
    !selection.empty ||
    $from.parent.type.name !== "paragraph" ||
    $from.marks().some((mark) => mark.type.name === "code")
  )
    return null;
  // Build embeds are top-level blocks; keep every command at the same predictable boundary.
  if ($from.depth !== 1 || $from.parentOffset !== $from.parent.content.size) return null;
  const match = /^\/([\w -]*)$/.exec($from.parent.textContent);
  return match ? { from: $from.start(), to: $from.pos, query: match[1]!.toLowerCase() } : null;
}
interface Command {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly icon: string;
  readonly keywords: string;
  readonly run?: (chain: ChainedCommands) => ChainedCommands;
  readonly skillId?: string;
  readonly portrait?: PlaceholderIconDescriptor;
}
const commands: readonly Command[] = [
  {
    id: "build",
    label: "Build",
    hint: "Insert a blank build",
    icon: "▦",
    keywords: "widget blank new composer"
  },
  {
    id: "text",
    label: "Text",
    hint: "Plain paragraph",
    icon: "T",
    keywords: "paragraph",
    run: (c) => c.setParagraph()
  },
  ...([1, 2, 3] as const).map((level) => ({
    id: `h${level}`,
    label: `Heading ${level}`,
    hint: `${"#".repeat(level)} + space`,
    icon: `H${level}`,
    keywords: `heading h${level} title`,
    run: (c: ChainedCommands) => c.setHeading({ level })
  })),
  {
    id: "bullet",
    label: "Bullet list",
    hint: "- + space",
    icon: "•",
    keywords: "bullets unordered",
    run: (c) => c.toggleBulletList()
  },
  {
    id: "number",
    label: "Numbered list",
    hint: "1. + space",
    icon: "1.",
    keywords: "ordered numbers",
    run: (c) => c.toggleOrderedList()
  },
  {
    id: "quote",
    label: "Quote",
    hint: "> + space",
    icon: "❝",
    keywords: "blockquote",
    run: (c) => c.setBlockquote()
  },
  {
    id: "code",
    label: "Code block",
    hint: "``` + space",
    icon: "<>",
    keywords: "fenced code",
    run: (c) => c.setCodeBlock()
  },
  {
    id: "divider",
    label: "Divider",
    hint: "A horizontal line",
    icon: "—",
    keywords: "rule separator",
    run: (c) => c.setHorizontalRule()
  },
  {
    id: "skill",
    label: "Skill reference",
    hint: "Choose from the skills catalog",
    icon: "◇",
    keywords: "mention catalog"
  }
];
const key = new PluginKey("guide-authoring");
interface MenuState {
  range: SlashRange | null;
  skillSearch: boolean;
  items: readonly Command[];
  index: number;
  left: number;
  top: number;
  maxHeight: number;
  selection: boolean;
}

export function GuideEditorTools({
  editor,
  catalogs,
  onBuild,
  onSkill
}: {
  readonly editor: Editor;
  readonly catalogs: AppCatalogViews | null;
  readonly onBuild?: ((range: SlashRange) => void) | undefined;
  readonly onSkill?: (() => void) | undefined;
}) {
  const skills = useMemo<readonly Command[]>(
    () =>
      catalogs?.skills
        .map((skill) => ({
          id: `skill-${Number(skill.id)}`,
          skillId: `catalog:skill:${Number(skill.id)}`,
          label: skill.name,
          hint:
            [
              catalogs.professions.find((profession) => profession.id === skill.professionId)?.name,
              catalogs.attributes.find((attribute) => attribute.id === skill.attributeId)?.name
            ]
              .filter(Boolean)
              .join(" · ") || skill.type,
          icon: "",
          portrait: catalogs.placeholders.skill(skill, "skill-browser"),
          keywords: skill.name.toLowerCase()
        }))
        .sort((a, b) => a.label.localeCompare(b.label)) ?? [],
    [catalogs]
  );
  const latest = useRef({ onBuild, onSkill, skills });
  useEffect(() => {
    latest.current = { onBuild, onSkill, skills };
  });
  const menuId = useId();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const execute = useRef<(command: Command) => void>(() => undefined);
  const dismiss = useRef<() => void>(() => undefined);
  useEffect(() => {
    let dismissed: string | null = null;
    let previous = "";
    let index = 0;
    let current: MenuState | null = null;
    const getRange = () => guideSkillSearchRange(editor.state) ?? guideSlashRange(editor.state);
    const signature = (range: SlashRange) => `${range.from}:${range.to}:${range.query}`;
    const close = () => {
      const range = getRange();
      dismissed = range ? signature(range) : "selection";
      refresh();
    };
    dismiss.current = close;
    const refresh = () => {
      if (editor.isDestroyed) return;
      const skillRange = guideSkillSearchRange(editor.state);
      const range = skillRange ?? guideSlashRange(editor.state);
      const token = range
        ? signature(range)
        : `${editor.state.selection.from}:${editor.state.selection.to}`;
      if (token !== previous) {
        index = 0;
        dismissed = null;
        previous = token;
      }
      const { selection } = editor.state;
      const isTextSelection =
        selection instanceof TextSelection && !selection.empty && !editor.isActive("codeBlock");
      const visible = editor.isFocused && !editor.view.composing && dismissed === null;
      const query = range?.query.trim() ?? "";
      const items = skillRange
        ? latest.current.skills
            .filter((skill) => skill.keywords.includes(query))
            .sort(
              (a, b) => Number(b.keywords.startsWith(query)) - Number(a.keywords.startsWith(query))
            )
            .slice(0, 30)
        : range
          ? commands.filter(
              (command) =>
                (command.id !== "build" || latest.current.onBuild) &&
                (command.id !== "skill" || latest.current.onSkill) &&
                `${command.label} ${command.keywords}`.toLowerCase().includes(range.query.trim())
            )
          : [];
      index = Math.min(index, Math.max(0, items.length - 1));
      current = null;
      if (visible && (range || isTextSelection)) {
        const rect = editor.view.coordsAtPos(range?.from ?? selection.from);
        const height = range ? Math.min(skillRange ? 400 : 360, 64 + items.length * 54) : 48;
        const below = window.innerHeight - rect.bottom - 16;
        const above = rect.top - 16;
        const openAbove = below < height && above > below;
        const maxHeight = Math.min(height, Math.max(48, openAbove ? above : below));
        const width = skillRange ? 360 : range ? 304 : 248;
        current = {
          range,
          skillSearch: !!skillRange,
          items,
          index,
          selection: !range && isTextSelection,
          left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
          top: openAbove
            ? Math.max(8, rect.top - Math.min(height, maxHeight) - 8)
            : rect.bottom + 8,
          maxHeight
        };
      }
      setMenu(current);
      const dom = editor.view.dom;
      if (current?.range) {
        dom.setAttribute("aria-controls", menuId);
        dom.setAttribute("aria-haspopup", "listbox");
        dom.setAttribute("aria-expanded", "true");
        if (items[index])
          dom.setAttribute("aria-activedescendant", `${menuId}-${items[index]!.id}`);
        else dom.removeAttribute("aria-activedescendant");
      } else {
        dom.removeAttribute("aria-controls");
        dom.removeAttribute("aria-haspopup");
        dom.removeAttribute("aria-expanded");
        dom.removeAttribute("aria-activedescendant");
      }
    };
    execute.current = (command) => {
      const range = command.skillId
        ? guideSkillSearchRange(editor.state)
        : guideSlashRange(editor.state);
      if (!range || editor.view.composing) return;
      if (command.skillId) {
        // Treat choosing a result as one guide-history operation, preserving the surrounding prose.
        // Also consume closing brackets when completing an existing [[query]] token.
        const after = editor.state.selection.$from.parent.textBetween(
          editor.state.selection.$from.parentOffset,
          editor.state.selection.$from.parent.content.size,
          "\n",
          "\ufffc"
        );
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setMeta("guide-gesture", true);
            return true;
          })
          .insertContentAt(
            { from: range.from, to: range.to + (after.startsWith("]]") ? 2 : 0) },
            {
              type: "guideSkill",
              attrs: {
                skillId: command.skillId,
                context: precedingGuideBuildContext(editor.state.doc, range.from)
              },
              marks: editor.state.selection.$from
                .marks()
                .filter((mark) => mark.type.name !== "link")
                .map((mark) => mark.toJSON())
            }
          )
          .run();
        return;
      }
      if (command.id === "build") {
        close();
        latest.current.onBuild?.(range);
        return;
      }
      let chain = editor
        .chain()
        .focus()
        .deleteRange(range)
        .command(({ tr }) => {
          tr.setMeta("guide-gesture", true);
          return true;
        });
      if (command.run) chain = command.run(chain);
      chain.run();
      if (command.id === "skill") latest.current.onSkill?.();
    };
    const plugin = new Plugin({
      key,
      props: {
        decorations(state) {
          const decorations: Decoration[] = [];
          state.doc.forEach((node, pos) => {
            if (
              node.type.name === "paragraph" &&
              node.content.size === 0 &&
              (state.doc.childCount === 1 ||
                (state.selection.empty && state.selection.from === pos + 1))
            )
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: "guide-empty-line",
                  "data-placeholder": "Write something, / for commands, or [[ for skills…"
                })
              );
          });
          return DecorationSet.create(state.doc, decorations);
        },
        handleKeyDown(_view, event) {
          if (event.isComposing || editor.view.composing || !current) return false;
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
            return true;
          }
          if (!current.range) return false;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const length = current.items.length;
            if (length) index = (index + (event.key === "ArrowDown" ? 1 : -1) + length) % length;
            refresh();
            return true;
          }
          if (
            (event.key === "Enter" ||
              (current.skillSearch && event.key === "Tab" && !event.shiftKey)) &&
            current.items[index]
          ) {
            event.preventDefault();
            execute.current(current.items[index]!);
            return true;
          }
          return false;
        }
      },
      view: (view) => {
        // Attach to the mounted view; React can reconnect this effect before Tiptap remounts.
        view.dom.addEventListener("compositionstart", refresh);
        view.dom.addEventListener("compositionend", refresh);
        return {
          update: refresh,
          destroy: () => {
            view.dom.removeEventListener("compositionstart", refresh);
            view.dom.removeEventListener("compositionend", refresh);
          }
        };
      }
    });
    // Tiptap may remount its view after Strict Mode cleanup marked it destroyed.
    // Replace any retained authoring plugin when attaching to that same editor.
    const previousPlugin = key.get(editor.state);
    editor.registerPlugin(plugin, (newPlugin, plugins) => [
      newPlugin,
      ...plugins.filter((existing) => existing !== previousPlugin)
    ]);
    editor.on("focus", refresh);
    editor.on("blur", refresh);
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    refresh();
    return () => {
      editor.off("focus", refresh);
      editor.off("blur", refresh);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
      if (!editor.isDestroyed) editor.unregisterPlugin(key);
    };
  }, [editor, menuId]);
  const selectedOption = menu?.range ? menu.items[menu.index]?.id : undefined;
  useEffect(() => {
    if (selectedOption)
      document
        .getElementById(`${menuId}-${selectedOption}`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [selectedOption, menuId]);
  if (!menu) return null;
  return createPortal(
    <div
      className={`guide-editor-popover ${menu.range ? "guide-slash-menu" : "guide-selection-menu"}${menu.skillSearch ? " guide-skill-menu" : ""}`}
      style={{ left: menu.left, top: menu.top, maxHeight: menu.maxHeight }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {menu.range ? (
        <>
          <div className="guide-command-caption">
            {menu.skillSearch ? "Link a skill" : "Insert a block"} <span>↑↓ choose · Enter</span>
          </div>
          <div
            id={menuId}
            role="listbox"
            aria-label={menu.skillSearch ? "Link a skill" : "Insert a block"}
          >
            {menu.items.map((command, i) => (
              <button
                type="button"
                role="option"
                key={command.id}
                id={`${menuId}-${command.id}`}
                aria-selected={i === menu.index}
                onClick={() => execute.current(command)}
              >
                {command.portrait ? (
                  <CatalogIcon descriptor={command.portrait} />
                ) : (
                  <span className="guide-command-icon" aria-hidden="true">
                    {command.icon}
                  </span>
                )}
                <span>
                  <strong>{command.label}</strong>
                  <small>{command.hint}</small>
                </span>
              </button>
            ))}
            {!menu.items.length && (
              <p className="guide-no-commands" role="status">
                {menu.skillSearch
                  ? catalogs
                    ? "No matching skills. Try another name."
                    : "Skill catalog unavailable."
                  : "No matching commands. Esc to keep writing."}
              </p>
            )}
          </div>
        </>
      ) : (
        <div role="toolbar" aria-label="Text formatting">
          <button
            type="button"
            aria-label="Bold"
            aria-pressed={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            aria-label="Italic"
            aria-pressed={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            aria-label="Inline code"
            aria-pressed={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            &lt;&gt;
          </button>
          <button
            type="button"
            aria-pressed={editor.isActive("link")}
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              const url = window.prompt("Link URL (https, http, mailto or local anchor)");
              if (url && safeGuideUrl(url)) editor.chain().focus().setLink({ href: url }).run();
            }}
          >
            {editor.isActive("link") ? "Unlink" : "Link"}
          </button>
          <button type="button" aria-label="Close formatting" onClick={() => dismiss.current()}>
            ×
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
