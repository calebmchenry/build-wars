import { useEffect, useReducer } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
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
    <GuideWorkspace
      workspace={workspace}
      guide={workspace.document}
      catalogs={catalogs}
      dispatch={dispatch}
    />
  );
}
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
describe("rendered guide workspace", () => {
  it("resolves dirty source explicitly and cannot leave failed Apply for visual editing", async () => {
    render(<Harness catalogs={catalogs} />);
    fireEvent.click(await screen.findByRole("button", { name: "Source" }));
    const raw = ":::bw-guide\n{broken JSON\n:::";
    fireEvent.change(screen.getByRole("textbox", { name: "Markdown source" }), {
      target: { value: raw }
    });
    fireEvent.click(screen.getByRole("button", { name: "Write" }));
    expect(screen.getByRole("dialog", { name: "Resolve unapplied source" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep editing source" }));
    expect(
      (screen.getByRole("textbox", { name: "Markdown source" }) as HTMLTextAreaElement).value
    ).toBe(raw);
    fireEvent.click(screen.getByRole("button", { name: "Write" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply and continue" }));
    expect(screen.getByRole("alert").textContent).toMatch(/JSON/);
    expect(screen.queryByRole("textbox", { name: "Guide document" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Discard source changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard unapplied source" }));
    await screen.findByRole("textbox", { name: "Guide document" });
    if (latest.document.kind !== "guide") throw Error("fixture");
    expect(latest.document.history.frame.recovery).toBeNull();
    expect(latest.document.history.past).toHaveLength(0);
  });
  it("validates Markdown import before explicit replacement and preserves state on Cancel", async () => {
    render(<Harness catalogs={null} />);
    fireEvent.click(await screen.findByRole("button", { name: "Import Markdown" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Markdown to import" }), {
      target: { value: "# Imported\n\n**Original** prose." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Validate Markdown" }));
    expect(
      screen.getByRole("button", { name: "Replace guide with Markdown" }).hasAttribute("disabled")
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    if (latest.document.kind !== "guide") throw Error("fixture");
    expect(latest.document.history.past).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Import Markdown" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Markdown to import" }), {
      target: { value: "# Imported\n\n**Original** prose." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Validate Markdown" }));
    fireEvent.click(screen.getByRole("button", { name: "Replace guide with Markdown" }));
    expect(latest.document.history.past).toHaveLength(1);
    expect(latest.document.history.frame.document.nodes[0]).toMatchObject({ type: "heading" });
    fireEvent.click(screen.getByRole("button", { name: "Undo guide" }));
    expect(latest.document.history.frame.document).toEqual(emptyGuide("guide-shell"));
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
      await screen.findByRole("button", { name: "Flare — Flare practice; edit reference" })
    );
    fireEvent.change(screen.getByLabelText("Reference context"), { target: { value: "generic" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply reference" }));
    await screen.findByRole("button", { name: "Flare — Generic; edit reference" });
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
    fireEvent.click(screen.getByRole("button", { name: "Undo guide" }));
    await screen.findByRole("button", { name: "Flare — Flare practice; edit reference" });
    expect(latest.document.history.frame.document).toEqual(document);
  });
  it("inserts a bound catalog atom after a trailing build without replacing that build", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Choose caret at end" }));
    fireEvent.change(screen.getByRole("combobox", { name: "New reference context" }), {
      target: { value: "build:gb-flare" }
    });
    fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), {
      target: { value: "Flare" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Insert bound reference: Flare" }));
    if (latest.document.kind !== "guide") throw Error("fixture");
    expect(guideBuilds(latest.document.history.frame.document)).toEqual(guideBuilds(document));
    expect(latest.document.history.frame.document.nodes.at(-1)).toEqual({
      type: "paragraph",
      children: [
        {
          type: "skill",
          skillId: "catalog:skill:194",
          context: { kind: "local", buildId: "gb-flare" }
        }
      ]
    });
    expect(latest.document.history.past).toHaveLength(1);
  });
  it("inserts independent captured/saved copies, edits one inspector and cancels delete", async () => {
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
    fireEvent.click(screen.getByText("Add a build at end"));
    fireEvent.click(screen.getByRole("button", { name: "Insert captured composer build" }));
    fireEvent.click(screen.getByRole("button", { name: "Insert captured composer build" }));
    if (latest.document.kind !== "guide") throw Error("fixture");
    const before = guideBuilds(latest.document.history.frame.document);
    expect(before).toHaveLength(2);
    expect(before[0]!.id).not.toBe(before[1]!.id);
    expect(before[0]!.snapshot.rawTemplate).toEqual(snapshot.rawTemplate);
    fireEvent.click(
      (await screen.findAllByRole("button", { name: `Edit ${snapshot.build.name}` }))[0]!
    );
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
    const select = screen.getByLabelText("Saved build") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: select.options[1]!.value } });
    fireEvent.click(screen.getByRole("button", { name: "Insert saved copy" }));
    expect(guideBuilds(latest.document.history.frame.document)).toHaveLength(3);
    expect(latest.library.records).toBe(state.library.records);
    expect(document.querySelectorAll('[aria-label="Selected build inspector"]')).toHaveLength(1);
    expect(document.querySelector('.tiptap [aria-label="Selected build inspector"]')).toBeNull();
  });
  it("routes native history once and keeps seed commands outside authored history and source editing", () => {
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
      fireEvent.click(screen.getByText("Add a build at end"));
      fireEvent.click(screen.getByRole("button", { name: "Insert blank build" }));
      fireEvent.click(screen.getByRole("button", { name: "Insert blank build" }));
      if (latest.document.kind !== "guide") throw Error("fixture");
      expect(latest.document.history.past).toHaveLength(2);
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
      fireEvent.click(screen.getByRole("button", { name: "Source" }));
      const before = latest.document.history;
      act(() => {
        host.dispatchEvent(
          new InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true,
            inputType: "historyUndo"
          })
        );
      });
      expect(latest.document.history).toBe(before);
      expect(host).toHaveAttribute("aria-hidden", "true");
    } finally {
      document.execCommand = original;
    }
  });
  it("keeps metadata and invalid source usable without catalogs and retains unapplied input", () => {
    render(<Harness catalogs={null} />);
    fireEvent.click(screen.getByText("Guide details"));
    fireEvent.change(screen.getByLabelText("Guide title"), {
      target: { value: "No-catalog notes" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save guide details" }));
    expect(screen.getByRole("heading", { name: "No-catalog notes" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Source" }));
    const raw = ':::bw-guide\n{"version":99}\n:::';
    fireEvent.change(screen.getByRole("textbox", { name: "Markdown source" }), {
      target: { value: raw }
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply source" }));
    fireEvent.click(screen.getByRole("button", { name: "Write" }));
    expect(screen.getByRole("textbox", { name: "Markdown source" })).toHaveValue(raw);
    expect(screen.getByRole("button", { name: "Download unapplied source" })).toBeEnabled();
    expect(latest.draftSession.dirtyState).toBe("dirty");
    expect(
      latest.document.kind === "guide" && latest.document.history.frame.document.metadata.title
    ).toBe("No-catalog notes");
  });
  it("keeps catalog filters and rejected no-target placement outside authored history", () => {
    render(<Harness catalogs={catalogs} />);
    const before = latest.document;
    fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), {
      target: { value: "Flare" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Insert generic reference: Flare" }));
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
