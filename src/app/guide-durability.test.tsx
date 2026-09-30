import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Editor } from "@tiptap/core";
import { App } from "./App";
import { AppCatalogError } from "./catalogs";
import { createGuideFixture } from "./guide-fixture";
import { GUIDE_AUTOSAVE_DELAY_MS } from "./guide-autosave";
import { validLocalLibraryEnvelopeFixture, fixtureCatalogFacts } from "./library-fixtures";
import {
  LOCAL_LIBRARY_STORAGE_KEY,
  parseLocalLibraryJson,
  serializeLocalLibraryEnvelope
} from "./persistence-schema";
const missing = {
  status: "error" as const,
  error: new AppCatalogError(["Controlled unavailable catalog fixture"])
};
const legacyRaw = ":::bw-guide\n{unfinished";
function seed() {
  const envelope = validLocalLibraryEnvelopeFixture({
    savedDocuments: [],
    workingDraft: {
      document: {
        kind: "guide",
        snapshot: {
          schemaVersion: 1,
          document: createGuideFixture(),
          recovery: { raw: legacyRaw, baseRevision: 0, dirty: true },
          appliedRevision: 0
        }
      },
      associatedRecordId: null,
      savedWith: fixtureCatalogFacts
    }
  });
  localStorage.setItem(LOCAL_LIBRARY_STORAGE_KEY, serializeLocalLibraryEnvelope(envelope));
}
function typeAtStart(input: HTMLElement, text: string) {
  const editor = (input as HTMLElement & { editor: Editor }).editor;
  act(() => {
    editor.commands.insertContentAt(1, text);
  });
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});
describe("catalog-independent rendered guide durability", () => {
  it("debounces repeated prose edits until idle, then saves the latest document once", async () => {
    seed();
    render(<App catalogState={missing} />);
    const input = await screen.findByRole("textbox", { name: "Guide document" });
    vi.useFakeTimers();
    const write = vi.spyOn(Storage.prototype, "setItem");
    for (const text of ["First ", "Second ", "Final "]) {
      typeAtStart(input, text);
      act(() => vi.advanceTimersByTime(GUIDE_AUTOSAVE_DELAY_MS - 1));
      expect(write.mock.calls.filter(([key]) => key === LOCAL_LIBRARY_STORAGE_KEY)).toHaveLength(0);
    }
    act(() => vi.advanceTimersByTime(1));
    expect(write.mock.calls.filter(([key]) => key === LOCAL_LIBRARY_STORAGE_KEY)).toHaveLength(1);
    const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY)!);
    if (!parsed.ok || parsed.envelope.workingDraft?.document.kind !== "guide")
      throw Error("fixture");
    expect(parsed.envelope.workingDraft.document.snapshot.document.nodes[0]).toMatchObject({
      children: [{ type: "text", value: "Final Second First Practice guide" }]
    });
    expect(parsed.envelope.workingDraft.document.snapshot.recovery?.raw).toBe(legacyRaw);
  });
  it.each(["autosave", "pagehide"])(
    "reopens old drafts in the rendered editor and retains new writing through %s and reload",
    async (flush) => {
      seed();
      const first = render(<App catalogState={missing} />);
      const input = await screen.findByRole("textbox", { name: "Guide document" });
      expect(screen.queryByRole("textbox", { name: "Markdown source" })).toBeNull();
      const write = vi.spyOn(Storage.prototype, "setItem");
      typeAtStart(input, "Updated ");
      if (flush === "pagehide") act(() => window.dispatchEvent(new Event("pagehide")));
      else
        await waitFor(
          () =>
            expect(write.mock.calls.some(([key]) => key === LOCAL_LIBRARY_STORAGE_KEY)).toBe(true),
          { timeout: 2000 }
        );
      first.unmount();
      render(<App catalogState={missing} />);
      expect(await screen.findByRole("textbox", { name: "Guide document" })).toHaveTextContent(
        "Updated Practice guide"
      );
      fireEvent.click(screen.getByRole("button", { name: "Open document sidebar" }));
      fireEvent.click(screen.getByRole("button", { name: /^Actions for / }));
      expect(screen.getByRole("menuitem", { name: "Download as Markdown" })).toBeEnabled();
    }
  );
  it("does not write on hydration and keeps rendered edits downloadable when storage is denied", async () => {
    seed();
    const original = localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY);
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key) => {
      if (key === LOCAL_LIBRARY_STORAGE_KEY) throw new DOMException("Denied", "SecurityError");
    });
    render(<App catalogState={missing} />);
    const input = await screen.findByRole("textbox", { name: "Guide document" });
    expect(write.mock.calls.filter(([key]) => key === LOCAL_LIBRARY_STORAGE_KEY)).toHaveLength(0);
    typeAtStart(input, "Retain despite denied storage ");
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY)).toBe(original);
    expect(input).toHaveTextContent("Retain despite denied storage Practice guide");
    expect(screen.getByText("Not saved")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open document sidebar" }));
    fireEvent.click(screen.getByRole("button", { name: /^Actions for / }));
    expect(screen.getByRole("menuitem", { name: "Download as Markdown" })).toBeEnabled();
  });
});
