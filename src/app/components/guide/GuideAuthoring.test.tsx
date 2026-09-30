import { useEffect, useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Editor } from "@tiptap/core";
import { emptyGuide, serializeGuideMarkdown } from "../../../guide/markdown";
import { guideBuilds } from "../../../domain/guide";
import type { AppliedGuide } from "../../guide-history";
import type { PersistedBuildSnapshot } from "../../persistence-schema";
import { validSnapshotFixture } from "../../library-fixtures";
import {
  createRuntimeGuide,
  guideAddress,
  reduceGuide,
  type RuntimeGuideDocument
} from "../../guide-state";
import { GuideEditor } from "./GuideEditor";
import { requireReadyCatalogs } from "../../catalogs";
import { createGuideFixture } from "../../guide-fixture";
import { cloneGuideBuild } from "../../guide-build-adapter";
import { GuideSkillMention } from "./GuideSkillMention";

const catalogs = requireReadyCatalogs();
let editor: Editor;
let latest: RuntimeGuideDocument;
let insertBuild: ((snapshot: PersistedBuildSnapshot) => boolean) | undefined;
const onSkill = vi.fn();
const message = vi.fn();
function bind(value: Editor | null) {
  if (value) editor = value;
}
function Harness({ document = emptyGuide("authoring") }: { readonly document?: AppliedGuide }) {
  const [guide, setGuide] = useState(() => createRuntimeGuide(document, "authoring"));
  useEffect(() => {
    latest = guide;
  }, [guide]);
  return (
    <GuideEditor
      document={guide.history.frame.document}
      catalogs={catalogs}
      onEditor={bind}
      renderBuild={(id) => <span>Build {id}</span>}
      renderSkill={(node) => (
        <GuideSkillMention
          node={node}
          document={guide.history.frame.document}
          catalogs={catalogs}
        />
      )}
      onComposition={() => {}}
      onInsertBuild={(insert) => {
        insertBuild = insert;
      }}
      onInsertSkill={onSkill}
      clipboard={{ read: () => [], write: () => ({ json: "", markdown: "" }), message }}
      onHistory={(direction) =>
        setGuide((g) => reduceGuide(g, { ...guideAddress(g), type: "history", direction }))
      }
      onChange={(document, typing) => {
        const next = reduceGuide(guide, { ...guideAddress(guide), type: "edit", document, typing });
        setGuide(next);
        return next.history !== guide.history;
      }}
    />
  );
}
function type(text: string) {
  for (const char of text)
    act(() => {
      const view = editor.view;
      const { from, to } = view.state.selection;
      const fallback = () => view.state.tr.insertText(char, from, to);
      if (!view.someProp("handleTextInput", (handler) => handler(view, from, to, char, fallback)))
        view.dispatch(fallback());
    });
}
function key(key: string, options = {}) {
  fireEvent.keyDown(screen.getByRole("textbox", { name: "Guide document" }), { key, ...options });
}
async function focus() {
  await waitFor(() => expect(editor).toBeDefined());
  act(() => {
    editor.view.focus();
  });
}
beforeEach(() => {
  insertBuild = undefined;
  vi.clearAllMocks();
  vi.spyOn(window, "scrollBy").mockImplementation(() => {});
  // Geometry is exercised separately in Chrome; jsdom has no layout.
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => [] });
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(20, 20, 1, 20)
  });
});
describe("inline guide authoring", () => {
  it("searches [[ in a heading and inserts a wiki link with a portrait, preserving text and undo", async () => {
    render(
      <Harness
        document={{
          ...emptyGuide("skills"),
          nodes: [{ type: "heading", depth: 1, children: [{ type: "text", value: "Use  first" }] }]
        }}
      />
    );
    await focus();
    act(() => {
      editor.commands.setTextSelection(5);
    });
    type("[[purg");
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("Purge Conditions");
    expect(options[0]).toHaveTextContent("Monk");
    expect(options[0]!.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("/gww-icons/skills/")
    );
    expect(screen.getByRole("textbox", { name: "Guide document" })).toHaveAttribute(
      "aria-activedescendant",
      options[0]!.id
    );
    key("ArrowDown");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    const before = latest.history.frame.document;
    key("Enter");
    const link = await screen.findByRole("link", { name: "Purge Signet — Generic" });
    expect(link).toHaveAttribute("href", "https://wiki.guildwars.com/wiki/Purge_Signet");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.closest("h1")).toHaveTextContent("Use Purge Signet first");
    expect(editor.state.doc.childCount).toBe(1);
    expect(screen.queryByRole("listbox")).toBeNull();
    const inserted = latest.history.frame.document;
    key("z", { metaKey: true });
    await waitFor(() => expect(latest.history.frame.document).toEqual(before));
    key("z", { metaKey: true, shiftKey: true });
    await waitFor(() => expect(latest.history.frame.document).toEqual(inserted));
  });
  it("binds to the nearest preceding build, including nested prose, and stays generic before any build", async () => {
    const first = guideBuilds(createGuideFixture())[0]!;
    const second = { ...first, id: "second", snapshot: cloneGuideBuild(first.snapshot, "second") };
    render(
      <Harness
        document={{
          ...emptyGuide("contexts"),
          nodes: [
            { type: "paragraph", children: [] },
            first,
            { type: "heading", depth: 2, children: [] },
            second,
            {
              type: "list",
              ordered: false,
              start: 1,
              children: [{ type: "listItem", children: [{ type: "paragraph", children: [] }] }]
            }
          ]
        }}
      />
    );
    await focus();
    type("[[flare");
    key("Tab");
    expect(editor.state.doc.firstChild!.firstChild!.attrs.context).toEqual({ kind: "generic" });
    let heading = 0;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") heading = pos + 1;
    });
    act(() => {
      editor.commands.setTextSelection(heading);
    });
    type("[[flare");
    fireEvent.mouseDown(screen.getByRole("option", { name: /Flare/ }));
    fireEvent.click(screen.getByRole("option", { name: /Flare/ }));
    expect(editor.state.doc.child(2).firstChild!.attrs.context).toEqual({
      kind: "local",
      buildId: first.id
    });
    act(() => {
      editor.commands.focus("end");
    });
    type("[[flare");
    key("Enter");
    expect(editor.state.doc.lastChild!.firstChild!.firstChild!.firstChild!.attrs.context).toEqual({
      kind: "local",
      buildId: second.id
    });
    expect(serializeGuideMarkdown(latest.history.frame.document)).toContain('build="second"');
  });
  it("keeps unmatched searches and Escape literal and ignores code", async () => {
    render(<Harness />);
    await focus();
    type("[[purg");
    const before = latest.history;
    key("Escape");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(editor.getText()).toBe("[[purg");
    expect(latest.history).toBe(before);
    type("zzzz");
    expect(screen.getByRole("status")).toHaveTextContent("No matching skills");
    key("Enter");
    expect(editor.getText()).toContain("[[purgzzzz");
    act(() => {
      editor.commands.setCodeBlock();
    });
    type("[[flare");
    expect(screen.queryByRole("listbox")).toBeNull();
    act(() => {
      editor.commands.setParagraph();
      editor.commands.clearContent();
      editor.commands.toggleCode();
    });
    type("[[flare");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("hides suggestions during composition and lets Enter commit without inserting a skill", async () => {
    render(<Harness />);
    await focus();
    type("[[flare");
    const before = latest.history;
    const input = screen.getByRole("textbox", { name: "Guide document" });
    fireEvent.compositionStart(input);
    expect(screen.queryByRole("listbox")).toBeNull();
    key("Enter", { isComposing: true });
    expect(latest.history).toBe(before);
    fireEvent.compositionEnd(input);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
  });
  it("retains bold formatting around a skill in the saved document", async () => {
    render(<Harness />);
    await focus();
    act(() => {
      editor.commands.toggleBold();
    });
    type("[[flare");
    key("Enter");
    expect(latest.history.frame.document.nodes[0]).toMatchObject({
      type: "paragraph",
      children: [{ type: "strong", children: [{ type: "skill", skillId: "catalog:skill:194" }] }]
    });
  });
  it("replaces only the current token after an inline atom and consumes existing closing brackets", async () => {
    render(<Harness />);
    await focus();
    type("[[flare");
    key("Enter");
    type(" then [[purg]]!");
    act(() => {
      editor.commands.setTextSelection(editor.state.selection.from - 3);
    });
    key("Enter");
    expect(
      await screen.findByRole("link", { name: "Purge Conditions — Generic" })
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Guide document" })).toHaveTextContent(
      "Flare then Purge Conditions!"
    );
  });
  it("renders Markdown shortcuts as headings, bold, italic and lists while typing", async () => {
    render(<Harness />);
    await focus();
    type("## Rotation");
    expect(screen.getByRole("heading", { level: 2, name: "Rotation" })).toBeInTheDocument();
    key("Enter");
    type("Use **Flare** then *repeat*.");
    expect(document.querySelector(".tiptap strong")).toHaveTextContent("Flare");
    expect(document.querySelector(".tiptap em")).toHaveTextContent("repeat");
    key("Enter");
    type("- First skill");
    expect(document.querySelector(".tiptap ul li")).toHaveTextContent("First skill");
    key("Enter");
    key("Enter");
    type("1. Next step");
    expect(document.querySelector(".tiptap ol li")).toHaveTextContent("Next step");
    const source = serializeGuideMarkdown(latest.history.frame.document);
    expect(source).toContain("## Rotation");
    expect(source).toContain("**Flare**");
    expect(source).toContain("*repeat*");
  });
  it("filters slash commands, chooses with arrow keys and consumes Enter before paragraph splitting", async () => {
    render(<Harness />);
    await focus();
    type("/heading");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    key("ArrowDown");
    key("Enter");
    type("Equipment");
    expect(screen.getByRole("heading", { level: 2, name: "Equipment" })).toBeInTheDocument();
    expect(editor.state.doc.childCount).toBe(1);
    expect(screen.queryByRole("listbox")).toBeNull();
    key("z", { metaKey: true });
    key("z", { metaKey: true });
    await waitFor(() => expect(editor.getText()).toBe("/heading"));
  });
  it("keeps literal slashes, dismisses on Escape, and never offers commands in code or nested lists", async () => {
    render(<Harness />);
    await focus();
    type("/");
    const before = latest.history;
    key("Escape");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(latest.history).toBe(before);
    type("unknown-command");
    expect(screen.getByText(/No matching commands/)).toBeInTheDocument();
    key("Enter");
    expect(editor.getText()).toContain("/unknown-command");
    act(() => {
      editor.commands.setCodeBlock();
    });
    type("/build");
    expect(screen.queryByRole("listbox")).toBeNull();
    act(() => {
      editor.commands.setParagraph();
      editor.commands.clearContent();
      editor.commands.toggleBulletList();
    });
    type("/build");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("shows formatting only for selected prose and removes it for a caret", async () => {
    render(<Harness />);
    await focus();
    type("Select these words");
    expect(screen.queryByRole("toolbar")).toBeNull();
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 7 });
    });
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(document.querySelector(".tiptap strong")).toHaveTextContent("Select");
    act(() => {
      editor.commands.setTextSelection(7);
    });
    expect(screen.queryByRole("toolbar")).toBeNull();
  });
  it("inserts an independent build between paragraphs, leaves a writing caret and undoes atomically", async () => {
    const document: AppliedGuide = {
      ...emptyGuide("middle"),
      nodes: [
        { type: "paragraph", children: [{ type: "text", value: "Before" }] },
        { type: "paragraph", children: [] },
        { type: "paragraph", children: [{ type: "text", value: "After" }] }
      ]
    };
    render(<Harness document={document} />);
    await focus();
    act(() => {
      editor.commands.setTextSelection(9);
    });
    type("/build");
    key("Enter");
    expect(insertBuild).toBeDefined();
    const before = latest.history.frame.document;
    const snapshot = validSnapshotFixture();
    act(() => {
      expect(insertBuild!(snapshot)).toBe(true);
    });
    const nodes = latest.history.frame.document.nodes;
    expect(nodes.map((node) => node.type)).toEqual([
      "paragraph",
      "build",
      "paragraph",
      "paragraph"
    ]);
    const build = guideBuilds(latest.history.frame.document)[0]!;
    expect(build.id).not.toBe(snapshot.build.id);
    expect(build.snapshot.build.id).toBe(build.id);
    expect(build.snapshot.rawTemplate).toEqual(snapshot.rawTemplate);
    expect(editor.state.selection.$from.parent.type.name).toBe("paragraph");
    expect(editor.state.selection.$from.index(0)).toBe(2);
    key("z", { metaKey: true });
    await waitFor(() => expect(latest.history.frame.document).toEqual(before));
    key("z", { metaKey: true, shiftKey: true });
    await waitFor(() => expect(guideBuilds(latest.history.frame.document)[0]).toEqual(build));
  });
  it("rejects a stale build insertion and opens skill search after consuming its command", async () => {
    render(<Harness />);
    await focus();
    type("/build");
    key("Enter");
    act(() => {
      editor.commands.insertContent("x");
    });
    act(() => {
      expect(insertBuild!(validSnapshotFixture())).toBe(false);
    });
    expect(message).toHaveBeenCalledWith(expect.stringContaining("insertion point changed"));
    expect(guideBuilds(latest.history.frame.document)).toHaveLength(0);
    act(() => {
      editor.commands.clearContent();
    });
    type("/skill");
    key("Enter");
    expect(onSkill).toHaveBeenCalledOnce();
    expect(editor.getText()).toBe("");
  });
});
