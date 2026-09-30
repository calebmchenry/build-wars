import { StrictMode, useEffect, useReducer, useState } from "react";
import type { Editor } from "@tiptap/core";
import { GapCursor } from "@tiptap/pm/gapcursor";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { guideBuilds } from "../../../domain/guide";
import { validLocalLibraryEnvelopeFixture, validSnapshotFixture } from "../../library-fixtures";
import { emptyGuide } from "../../../guide/markdown";
import { createGuideFixture } from "../../guide-fixture";
import { requireReadyCatalogs, type AppCatalogViews } from "../../catalogs";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  type WorkspaceState
} from "../../workspace-state";
import GuideWorkspace from "./GuideWorkspace";
import { GuideTransferDialog } from "./GuideTransferDialog";
import { guideAddress } from "../../guide-state";
const catalogs = requireReadyCatalogs();
function initial() {
  return workspaceReducer(createInitialWorkspaceState(), {
    type: "replace-guide",
    document: emptyGuide("guide-shell"),
    session: "shell",
    decision: "discard"
  });
}
let latest: WorkspaceState;
function Harness({
  catalogs,
  initialState
}: {
  readonly catalogs: AppCatalogViews | null;
  readonly initialState?: WorkspaceState;
}) {
  const [transfer, setTransfer] = useState(false);
  const [workspace, dispatch] = useReducer(
    workspaceReducer,
    undefined,
    () => initialState ?? initial()
  );
  useEffect(() => {
    latest = workspace;
  }, [workspace]);
  if (workspace.document.kind !== "guide") throw Error("fixture");
  return (
    <>
      <button onClick={() => setTransfer(true)}>Import Markdown</button>
      {transfer && (
        <GuideTransferDialog
          getGuide={() => {
            if (latest.document.kind !== "guide") throw Error("fixture");
            return latest.document;
          }}
          catalogs={catalogs}
          onImport={(raw) => {
            if (latest.document.kind !== "guide") return false;
            dispatch({
              type: "guide",
              command: { ...guideAddress(latest.document), type: "import-markdown", raw },
              catalogs
            });
            return true;
          }}
          onClose={() => setTransfer(false)}
        />
      )}
      <GuideWorkspace
        workspace={workspace}
        guide={workspace.document}
        catalogs={catalogs}
        dispatch={dispatch}
      />
    </>
  );
}
beforeEach(() => {
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => [] });
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect()
  });
});
async function insertBlankBuild() {
  const input = await screen.findByRole("textbox", { name: "Guide document" });
  act(() => input.focus());
  fireEvent.paste(input, {
    clipboardData: {
      types: ["text/plain"],
      getData: () => "/build"
    }
  });
  await screen.findByRole("option", { name: "Build Insert a blank build" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(screen.queryByRole("dialog", { name: "Insert a build" })).toBeNull();
}
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
describe("rendered guide workspace", () => {
  it("offers focused rendered editing without library or source controls", async () => {
    render(<Harness catalogs={catalogs} />);
    await screen.findByRole("textbox", { name: "Guide document" });
    expect(screen.queryByRole("button", { name: "Source" })).toBeNull();
    expect(screen.queryByText("Sources", { exact: true })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Markdown source" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Download as Markdown" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Read" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Write" })).toBeNull();
    expect(screen.getByRole("complementary", { name: "Guide catalog" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Guide title" })).toBeEnabled();
    expect(screen.queryByRole("heading", { name: "Sources and attribution" })).toBeNull();
  });
  it("validates Markdown import before explicit replacement and preserves state on Cancel", async () => {
    render(<Harness catalogs={null} />);
    fireEvent.click(await screen.findByRole("button", { name: "Import Markdown" }));
    expect(screen.queryByRole("textbox", { name: "Markdown to import" })).toBeNull();
    const bytes = new TextEncoder().encode("# Imported\n\n**Original** prose.");
    const file = { size: bytes.byteLength, arrayBuffer: async () => bytes.buffer };
    fireEvent.change(screen.getByLabelText("Markdown file"), { target: { files: [file] } });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Replace guide with Markdown" })).toBeEnabled()
    );
    expect(
      screen.getByRole("button", { name: "Replace guide with Markdown" }).hasAttribute("disabled")
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    if (latest.document.kind !== "guide") throw Error("fixture");
    expect(latest.document.history.past).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Import Markdown" }));
    fireEvent.change(screen.getByLabelText("Markdown file"), { target: { files: [file] } });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Replace guide with Markdown" })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Replace guide with Markdown" }));
    expect(latest.document.history.past).toHaveLength(1);
    expect(latest.document.history.frame.document.nodes[0]).toMatchObject({ type: "heading" });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Guide document" }), {
      key: "z",
      metaKey: true
    });
    expect(latest.document.history.frame.document).toEqual(emptyGuide("guide-shell"));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Guide document" }), {
      key: "z",
      ctrlKey: true,
      shiftKey: true
    });
    expect(latest.document.history.frame.document.nodes[0]).toMatchObject({ type: "heading" });
  });
  it("repairs one atomic reference without changing neighboring prose and undoes in guide history", async () => {
    // jsdom has no layout; native caret geometry is verified in Chrome.
    Object.defineProperty(Range.prototype, "getClientRects", {
      configurable: true,
      value: () => []
    });
    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      configurable: true,
      value: () => new DOMRect()
    });
    const document = createGuideFixture();
    const state = workspaceReducer(createInitialWorkspaceState(), {
      type: "replace-guide",
      document,
      session: "repair",
      decision: "discard"
    });
    render(<Harness catalogs={catalogs} initialState={state} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Change context for Flare — Flare practice" })
    );
    fireEvent.change(screen.getByLabelText("Reference context"), { target: { value: "generic" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply reference" }));
    await screen.findByRole("button", { name: "Change context for Flare — Generic" });
    if (latest.document.kind !== "guide") throw Error("fixture");
    const paragraph = latest.document.history.frame.document.nodes[1];
    expect(paragraph).toEqual({
      type: "paragraph",
      children: [
        { type: "text", value: "Practice with " },
        { type: "skill", skillId: "catalog:skill:194", context: { kind: "generic" } },
        { type: "text", value: " before changing the variant." }
      ]
    });
    expect(latest.document.history.past).toHaveLength(1);
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Guide document" }), {
      key: "z",
      metaKey: true
    });
    await screen.findByRole("button", { name: "Change context for Flare — Flare practice" });
    expect(latest.document.history.frame.document).toEqual(document);
  });
  it.each(["auto", "build:gb-flare", "generic"])(
    "inserts a catalog atom with %s context after a trailing build without replacing that build",
    async (context) => {
      const original = createGuideFixture();
      const document = { ...original, nodes: original.nodes.slice(0, -1) };
      const state = workspaceReducer(createInitialWorkspaceState(), {
        type: "replace-guide",
        document,
        session: "end-caret",
        decision: "discard"
      });
      render(<Harness catalogs={catalogs} initialState={state} />);
      await screen.findByRole("button", { name: "Edit Flare practice" });
      const input = screen.getByRole("textbox", { name: "Guide document" });
      const editor = (input as HTMLElement & { editor: Editor }).editor;
      act(() => {
        editor.view.dispatch(
          editor.state.tr.setSelection(
            new GapCursor(editor.state.doc.resolve(editor.state.doc.content.size))
          )
        );
        editor.view.focus();
      });
      fireEvent.change(screen.getByRole("combobox", { name: "New reference context" }), {
        target: { value: context }
      });
      fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), {
        target: { value: "Flare" }
      });
      fireEvent.click(
        screen.getByRole("button", {
          name:
            context === "auto"
              ? "Insert reference: Flare"
              : context === "generic"
                ? "Insert generic reference: Flare"
                : "Insert bound reference: Flare"
        })
      );
      if (latest.document.kind !== "guide") throw Error("fixture");
      expect(guideBuilds(latest.document.history.frame.document)).toEqual(guideBuilds(document));
      expect(latest.document.history.frame.document.nodes.at(-1)).toEqual({
        type: "paragraph",
        children: [
          {
            type: "skill",
            skillId: "catalog:skill:194",
            context:
              context === "generic" ? { kind: "generic" } : { kind: "local", buildId: "gb-flare" }
          }
        ]
      });
      expect(latest.document.history.past).toHaveLength(1);
    }
  );
  it("inserts independent blank builds despite captured/saved builds, edits one inspector and cancels delete", async () => {
    const snapshot = validSnapshotFixture();
    const envelope = validLocalLibraryEnvelopeFixture();
    const state = workspaceReducer(createInitialWorkspaceState({ envelope }), {
      type: "replace-guide",
      document: emptyGuide("copy-shell"),
      session: "copy-shell",
      decision: "discard",
      capturedBuild: snapshot
    });
    render(<Harness catalogs={catalogs} initialState={state} />);
    await insertBlankBuild();
    await insertBlankBuild();
    if (latest.document.kind !== "guide") throw Error("fixture");
    const before = guideBuilds(latest.document.history.frame.document);
    expect(before).toHaveLength(2);
    expect(before[0]!.id).not.toBe(before[1]!.id);
    expect(before[0]!.snapshot.build).toMatchObject({
      name: "New build",
      primaryProfessionId: null,
      secondaryProfessionId: null,
      skillBar: Array(8).fill(null)
    });
    fireEvent.click((await screen.findAllByRole("button", { name: "Edit New build" }))[0]!);
    fireEvent.change(screen.getByRole("textbox", { name: "Build name" }), {
      target: { value: "Independent first" }
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Build name" }));
    if (latest.document.kind !== "guide") throw Error("fixture");
    expect(guideBuilds(latest.document.history.frame.document)[1]).toEqual(before[1]);
    expect(snapshot.build.name).not.toBe("Independent first");
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete Independent first" }));
    expect(confirm).toHaveBeenCalled();
    expect(guideBuilds(latest.document.history.frame.document)).toHaveLength(2);
    await insertBlankBuild();
    expect(guideBuilds(latest.document.history.frame.document)).toHaveLength(3);
    expect(latest.library.records).toBe(state.library.records);
    expect(document.querySelectorAll('[aria-label="Selected build inspector"]')).toHaveLength(1);
    expect(
      document.querySelector('.tiptap [aria-label="Selected build inspector"]')
    ).toBeInTheDocument();
    expect(document.querySelector(".guide-inspector .focused-attribute-panel")).toBeInTheDocument();
    expect(document.querySelector(".guide-inspector .skillbar")).toBeInTheDocument();
  });
  it("routes native undo and redo once and keeps seed commands outside authored history", async () => {
    const original = document.execCommand;
    document.execCommand = vi.fn((command: string) => {
      if (command === "undo")
        document.activeElement?.dispatchEvent(
          new InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true,
            inputType: "historyUndo"
          })
        );
      return true;
    });
    try {
      render(<Harness catalogs={null} />);
      await insertBlankBuild();
      await insertBlankBuild();
      if (latest.document.kind !== "guide") throw Error("fixture");
      expect(latest.document.history.past).toHaveLength(4);
      const host = document.querySelector(".guide-native-history")!;
      act(() => {
        host.dispatchEvent(
          new InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true,
            inputType: "historyUndo"
          })
        );
      });
      expect(guideBuilds(latest.document.history.frame.document)).toHaveLength(1);
      expect(latest.document.history.future).toHaveLength(1);
      act(() => {
        host.dispatchEvent(
          new InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true,
            inputType: "historyRedo"
          })
        );
      });
      expect(guideBuilds(latest.document.history.frame.document)).toHaveLength(2);
      expect(latest.document.history.past).toHaveLength(4);
      expect(latest.document.history.future).toHaveLength(0);
      expect(host).toHaveAttribute("aria-hidden", "true");
    } finally {
      document.execCommand = original;
    }
  });
  it("keeps metadata usable without catalogs", async () => {
    render(<Harness catalogs={null} />);
    await screen.findByRole("textbox", { name: "Guide document" });
    fireEvent.change(screen.getByLabelText("Guide title"), {
      target: { value: "No-catalog notes" }
    });
    fireEvent.blur(screen.getByLabelText("Guide title"));
    expect(screen.getByLabelText("Guide title")).toHaveValue("No-catalog notes");
    expect(screen.queryByRole("button", { name: "Download as Markdown" })).toBeNull();
    expect(latest.draftSession.dirtyState).toBe("dirty");
  });
  it("inserts a blank build immediately in Strict Mode, leaves a writing caret and undoes atomically", async () => {
    render(
      <StrictMode>
        <Harness catalogs={null} />
      </StrictMode>
    );
    expect(screen.queryByRole("toolbar", { name: "Text formatting" })).toBeNull();
    expect(screen.getByRole("complementary", { name: "Guide catalog" })).toBeInTheDocument();
    await insertBlankBuild();
    if (latest.document.kind !== "guide") throw Error("fixture");
    expect(guideBuilds(latest.document.history.frame.document)).toHaveLength(1);
    const input = screen.getByRole("textbox", { name: "Guide document" });
    const editor = (input as HTMLElement & { editor: Editor }).editor;
    expect(editor.state.selection.$from.parent.type.name).toBe("paragraph");
    expect(editor.state.selection.$from.index(0)).toBe(1);
    fireEvent.keyDown(input, { key: "z", metaKey: true });
    expect(guideBuilds(latest.document.history.frame.document)).toHaveLength(0);
    await waitFor(() => expect(input).toHaveTextContent("/build"));
    fireEvent.keyDown(input, { key: "z", metaKey: true, shiftKey: true });
    expect(guideBuilds(latest.document.history.frame.document)).toHaveLength(1);
  });
  it("edits title and slim metadata in place and restores them with guide Undo", async () => {
    render(<Harness catalogs={null} />);
    const title = await screen.findByRole("textbox", { name: "Guide title" });
    const before = latest.document;
    fireEvent.change(title, { target: { value: "Field notes" } });
    expect(latest.document).toBe(before);
    fireEvent.keyDown(title, { key: "Enter" });
    fireEvent.blur(title);
    fireEvent.change(screen.getByLabelText("Tags (comma separated)"), {
      target: { value: "daggers, pve" }
    });
    fireEvent.blur(screen.getByLabelText("Tags (comma separated)"));
    if (latest.document.kind !== "guide") throw Error("fixture");
    expect(latest.document.history.frame.document.metadata).toMatchObject({
      title: "Field notes",
      tags: ["daggers", "pve"]
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Guide document" }), {
      key: "z",
      metaKey: true
    });
    expect(screen.getByLabelText("Tags (comma separated)")).toHaveValue("");
    expect(screen.getByLabelText("Guide title")).toHaveValue("Field notes");
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Guide document" }), {
      key: "z",
      metaKey: true
    });
    expect(screen.getByLabelText("Guide title")).toHaveValue("Untitled Guide");
  });
  it("keeps catalog filters and rejected no-target placement outside authored history", () => {
    render(<Harness catalogs={catalogs} />);
    const before = latest.document;
    fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), {
      target: { value: "Flare" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Insert reference: Flare" }));
    expect(
      screen.getByText("Choose a text caret before inserting a skill reference.")
    ).toBeInTheDocument();
    expect(
      latest.document.kind === "guide" &&
        before.kind === "guide" &&
        latest.document.history === before.history
    ).toBe(true);
    expect(latest.draftSession.dirtyState).toBe("clean");
  });
});
