import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { AppCatalogError } from "./catalogs";
import { createGuideFixture } from "./guide-fixture";
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
function seed() {
  const envelope = validLocalLibraryEnvelopeFixture({
    savedDocuments: [],
    workingDraft: {
      document: {
        kind: "guide",
        snapshot: {
          schemaVersion: 1,
          document: createGuideFixture(),
          recovery: { raw: ":::bw-guide\n{unfinished", baseRevision: 0, dirty: true },
          appliedRevision: 0
        }
      },
      associatedRecordId: null,
      savedWith: fixtureCatalogFacts
    }
  });
  localStorage.setItem(LOCAL_LIBRARY_STORAGE_KEY, serializeLocalLibraryEnvelope(envelope));
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
});
describe("catalog-independent guide durability", () => {
  it.each(["autosave", "pagehide"])(
    "retains exact unfinished source through %s and reload without catalogs",
    async (flush) => {
      seed();
      const first = render(<App catalogState={missing} />);
      const source = await screen.findByRole("textbox", { name: "Markdown source" });
      expect(source).toHaveValue(":::bw-guide\n{unfinished");
      const write = vi.spyOn(Storage.prototype, "setItem");
      fireEvent.change(source, { target: { value: ":::bw-guide\n{still unfinished  \n" } });
      if (flush === "pagehide") act(() => window.dispatchEvent(new Event("pagehide")));
      else
        await waitFor(() =>
          expect(write.mock.calls.some((call) => call[0] === LOCAL_LIBRARY_STORAGE_KEY)).toBe(true)
        );
      const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY)!);
      if (!parsed.ok || parsed.envelope.workingDraft?.document.kind !== "guide")
        throw Error("fixture");
      expect(parsed.envelope.workingDraft.document.snapshot.recovery?.raw).toBe(
        ":::bw-guide\n{still unfinished  \n"
      );
      expect(parsed.envelope.workingDraft.savedWith).toEqual(fixtureCatalogFacts);
      first.unmount();
      render(<App catalogState={missing} />);
      expect(await screen.findByRole("textbox", { name: "Markdown source" })).toHaveValue(
        ":::bw-guide\n{still unfinished  \n"
      );
      expect(screen.getByRole("button", { name: "Download unapplied source" })).toBeEnabled();
    }
  );
  it("does not write on hydration or clean mode changes and reports denied writes without losing source", async () => {
    seed();
    const original = localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY);
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key) => {
      if (key === LOCAL_LIBRARY_STORAGE_KEY) throw new DOMException("Denied", "SecurityError");
    });
    render(<App catalogState={missing} />);
    const source = await screen.findByRole("textbox", { name: "Markdown source" });
    expect(write.mock.calls.filter((call) => call[0] === LOCAL_LIBRARY_STORAGE_KEY)).toHaveLength(
      0
    );
    fireEvent.change(source, { target: { value: "# Retain despite denied storage" } });
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY)).toBe(original);
    expect(source).toHaveValue("# Retain despite denied storage");
    expect(screen.getByText("Not saved")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download unapplied source" })).toBeEnabled();
  });
});
