import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { AppCatalogError } from "./catalogs";
import { emptyGuide } from "../guide/markdown";
import {
  fixtureCatalogFacts,
  validLocalLibraryEnvelopeFixture,
  validSavedRecordFixture
} from "./library-fixtures";
import {
  LOCAL_LIBRARY_STORAGE_KEY,
  localBuildRecordId,
  parseLocalLibraryJson,
  serializeLocalLibraryEnvelope,
  type PersistedBuildSnapshot
} from "./persistence-schema";
import * as guideFiles from "./guide-files";

const missing = {
  status: "error" as const,
  error: new AppCatalogError(["Catalog unavailable in this fixture"])
};
function seedGuides() {
  const guides = ["First guide", "Second guide"].map((name, index) => {
    const document = emptyGuide<PersistedBuildSnapshot>(`guide-${index}`);
    return validSavedRecordFixture({
      id: localBuildRecordId(`record-${index}`),
      name,
      tags: [],
      document: {
        kind: "guide",
        snapshot: {
          schemaVersion: 1,
          recovery: null,
          appliedRevision: 0,
          document: { ...document, metadata: { ...document.metadata, title: name } }
        }
      }
    });
  });
  const first = guides[0]!;
  localStorage.setItem(
    LOCAL_LIBRARY_STORAGE_KEY,
    serializeLocalLibraryEnvelope(
      validLocalLibraryEnvelopeFixture({
        savedDocuments: guides,
        workingDraft: {
          document: first.document,
          associatedRecordId: first.id,
          savedWith: fixtureCatalogFacts
        }
      })
    )
  );
}
function openSidebar() {
  fireEvent.click(screen.getByRole("button", { name: "Open document sidebar" }));
}
function actions(name: string) {
  fireEvent.click(screen.getByRole("button", { name: `Actions for ${name}` }));
}
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("document sidebar workflows", () => {
  it("collapses sections and supports menu keyboard navigation, Escape, and outside dismissal", async () => {
    seedGuides();
    render(<App catalogState={missing} />);
    await screen.findByRole("textbox", { name: "Guide title" });
    expect(screen.queryByRole("complementary", { name: "Document library" })).toBeNull();
    openSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Guides" }));
    expect(screen.queryByRole("button", { name: "First guide" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Guides" }));
    actions("First guide");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "Duplicate" }), { key: "ArrowDown" });
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("button", { name: "Actions for First guide" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("complementary", { name: "Document library" })).toBeNull();
    openSidebar();
    fireEvent.pointerDown(screen.getByRole("textbox", { name: "Guide title" }));
    expect(screen.queryByRole("complementary", { name: "Document library" })).toBeNull();
  });
  it("duplicates current edits, renames the copy, and confirms deletion of the active entry", async () => {
    seedGuides();
    render(<App catalogState={missing} />);
    const title = await screen.findByRole("textbox", { name: "Guide title" });
    fireEvent.change(title, { target: { value: "Latest guide" } });
    fireEvent.blur(title);
    openSidebar();
    actions("Latest guide");
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    actions("Latest guide Copy");
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Document name" }), {
      target: { value: "Copy renamed" }
    });
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Rename document" })).getByRole("button", {
        name: "Rename"
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy renamed" }));
    expect(await screen.findByRole("textbox", { name: "Guide title" })).toHaveValue("Copy renamed");
    openSidebar();
    actions("Copy renamed");
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", { name: "Delete document" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(screen.queryByRole("button", { name: "Copy renamed" })).toBeNull();
    expect(await screen.findByRole("textbox", { name: "Guide title" })).toHaveValue("Latest guide");
    act(() => window.dispatchEvent(new Event("pagehide")));
    const saved = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY)!);
    expect(saved.ok && saved.envelope.savedDocuments.map((record) => record.name)).toEqual([
      "Latest guide",
      "Second guide"
    ]);
  });
  it("downloads the selected menu's guide, including edits not yet flushed to disk", async () => {
    const download = vi.spyOn(guideFiles, "downloadGuide").mockImplementation(() => undefined);
    seedGuides();
    render(<App catalogState={missing} />);
    const title = await screen.findByRole("textbox", { name: "Guide title" });
    fireEvent.change(title, { target: { value: "Download these edits" } });
    fireEvent.blur(title);
    openSidebar();
    actions("Download these edits");
    fireEvent.click(screen.getByRole("menuitem", { name: "Download as Markdown" }));
    expect(download).toHaveBeenCalledWith(
      expect.stringContaining("Download these edits"),
      "Download these edits"
    );
  });
  it("opens a document URL independently of the other tab's last active document", async () => {
    seedGuides();
    const first = render(<App catalogState={missing} />);
    await screen.findByRole("textbox", { name: "Guide title" });
    openSidebar();
    actions("Second guide");
    const link = screen.getByRole("menuitem", { name: "Open in new tab" });
    const url = link.getAttribute("href")!;
    expect(link).toHaveAttribute("target", "_blank");
    expect(new URL(url).searchParams.get("document")).toBe("record-1");
    // Invoke the save-before-open handler without asking jsdom to navigate.
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);
    first.unmount();
    window.history.replaceState(null, "", url);
    render(<App catalogState={missing} />);
    expect(await screen.findByRole("textbox", { name: "Guide title" })).toHaveValue("Second guide");
  });
  it("creates an entry from the plus button and exposes Markdown import in library tools", async () => {
    seedGuides();
    render(<App catalogState={missing} />);
    await screen.findByRole("textbox", { name: "Guide title" });
    openSidebar();
    fireEvent.click(screen.getByRole("button", { name: "New Guide" }));
    expect(await screen.findByRole("textbox", { name: "Guide title" })).toHaveValue(
      "Untitled Guide"
    );
    openSidebar();
    fireEvent.click(screen.getByText("Library tools"));
    fireEvent.click(screen.getByRole("button", { name: "Import Markdown" }));
    const bytes = new TextEncoder().encode("# Imported notes\n\nSome writing.");
    fireEvent.change(screen.getByLabelText("Markdown file"), {
      target: { files: [{ size: bytes.byteLength, arrayBuffer: async () => bytes.buffer }] }
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Replace guide with Markdown" })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Replace guide with Markdown" }));
    expect(await screen.findByRole("textbox", { name: "Guide document" })).toHaveTextContent(
      "Imported notes"
    );
  });
});
