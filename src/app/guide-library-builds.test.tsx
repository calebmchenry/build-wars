import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guideBuilds } from "../domain/guide";
import { App } from "./App";
import { AppCatalogError } from "./catalogs";
import { createGuideFixture } from "./guide-fixture";
import {
  LIBRARY_BUILD_MIME,
  libraryBuildDragPayload,
  readLibraryBuildDrop
} from "./guide-library-builds";
import {
  fixtureCatalogFacts,
  unresolvedSavedRecordFixture,
  validBuildSetSavedRecordFixture,
  validLocalLibraryEnvelopeFixture,
  validSavedRecordFixture
} from "./library-fixtures";
import {
  LOCAL_LIBRARY_STORAGE_KEY,
  localBuildRecordId,
  parseLocalLibraryJson,
  serializeLocalLibraryEnvelope,
  type PersistedSavedDocumentRecord
} from "./persistence-schema";

const missing = {
  status: "error" as const,
  error: new AppCatalogError(["Fixture catalog unavailable"])
};
function seed(record = unresolvedSavedRecordFixture()) {
  const guide = validSavedRecordFixture({
    id: localBuildRecordId("guide-record"),
    name: createGuideFixture().metadata.title,
    tags: [],
    document: {
      kind: "guide",
      snapshot: {
        schemaVersion: 1,
        recovery: null,
        appliedRevision: 0,
        document: createGuideFixture()
      }
    }
  });
  localStorage.setItem(
    LOCAL_LIBRARY_STORAGE_KEY,
    serializeLocalLibraryEnvelope(
      validLocalLibraryEnvelopeFixture({
        savedDocuments: [guide, record],
        workingDraft: {
          document: guide.document,
          associatedRecordId: guide.id,
          savedWith: fixtureCatalogFacts
        }
      })
    )
  );
  return record;
}
function saved() {
  act(() => window.dispatchEvent(new Event("pagehide")));
  const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY)!);
  if (!parsed.ok) throw Error("Invalid saved library");
  const document = parsed.envelope.savedDocuments.find(
    (record) => record.id === "guide-record"
  )!.document;
  if (document.kind !== "guide") throw Error("Missing guide");
  return { document: document.snapshot.document, records: parsed.envelope.savedDocuments };
}
function transfer() {
  const values = new Map<string, string>();
  return {
    get types() {
      return [...values.keys()];
    },
    setData: (type: string, value: string) => values.set(type, value),
    getData: (type: string) => values.get(type) ?? "",
    effectAllowed: "none",
    dropEffect: "none"
  };
}
function dragEvent(
  type: "dragOver" | "drop",
  target: Element,
  dataTransfer: ReturnType<typeof transfer>,
  clientY: number
) {
  const event = createEvent[type](target, { dataTransfer });
  Object.defineProperty(event, "clientY", { value: clientY });
  fireEvent(target, event);
}
async function startDrag(record: PersistedSavedDocumentRecord) {
  const box = await screen.findByRole("textbox", { name: "Guide document" });
  fireEvent.click(screen.getByRole("button", { name: "Open document sidebar" }));
  const source = screen.getByRole("button", { name: record.name });
  expect(source).toHaveAttribute("draggable", "true");
  const data = transfer();
  fireEvent.dragStart(source, { dataTransfer: data });
  expect(data.effectAllowed).toBe("copy");
  return { box, source, data };
}
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("sidebar build reuse", () => {
  it("drops a complete independent copy between blocks, undoes/redoes once, and persists on reload", async () => {
    const record = seed();
    const app = render(<App catalogState={missing} />);
    const { box, source, data } = await startDrag(record);
    const before = saved().document;
    vi.spyOn(box, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 100, 500, 400));
    Array.from(box.children).forEach((child, index) => {
      vi.spyOn(child, "getBoundingClientRect").mockReturnValue(
        new DOMRect(100, 100 + index * 100, 500, 100)
      );
    });
    dragEvent("dragOver", box, data, 190);
    expect(document.querySelector(".guide-drop-caret")).toHaveStyle({
      top: "200px",
      width: "500px"
    });
    dragEvent("drop", box, data, 190);
    fireEvent.dragEnd(source, { dataTransfer: data });
    await waitFor(() => expect(within(box).getAllByRole("list")).toHaveLength(2));
    expect(document.querySelector(".guide-drop-caret")).toBeNull();
    const copied = saved();
    const build = guideBuilds(copied.document)[0]!;
    expect(copied.document.nodes[1]).toEqual(build);
    expect(
      copied.document.nodes.filter(
        (node) => node !== build && !(node.type === "paragraph" && !node.children.length)
      )
    ).toEqual(before.nodes);
    if (record.document.kind !== "build") throw Error("fixture");
    expect(build.snapshot).toEqual({
      ...record.document.snapshot,
      build: { ...record.document.snapshot.build, id: build.id, name: record.name }
    });
    expect(build.id).not.toBe(record.document.snapshot.build.id);
    expect(copied.records.find((item) => item.id === record.id)!.document).toEqual(record.document);
    fireEvent.keyDown(box, { key: "z", ctrlKey: true });
    expect(saved().document).toEqual(before);
    fireEvent.keyDown(box, { key: "z", ctrlKey: true, shiftKey: true });
    expect(saved().document).toEqual(copied.document);
    app.unmount();
    render(<App catalogState={missing} />);
    const reloaded = await screen.findByRole("textbox", { name: "Guide document" });
    expect(within(reloaded).getAllByRole("list")).toHaveLength(2);
    expect(saved().document).toEqual(copied.document);
  });

  it("inserts a build set once even over a nested skill slot, leaving that slot unchanged", async () => {
    const record = seed(validBuildSetSavedRecordFixture());
    render(<App catalogState={missing} />);
    const { box, data } = await startDrag(record);
    const before = guideBuilds(saved().document)[0]!;
    const slot = within(box).getByRole("button", { name: "Flare practice slot 1: Skill 194" });
    dragEvent("dragOver", slot.firstElementChild!, data, 100);
    dragEvent("drop", slot.firstElementChild!, data, 100);
    await waitFor(() => expect(within(box).getAllByRole("list")).toHaveLength(3));
    const builds = guideBuilds(saved().document);
    expect(builds[0]).toEqual(before);
    expect(new Set(builds.map((build) => build.id)).size).toBe(3);
    fireEvent.keyDown(box, { key: "z", ctrlKey: true });
    expect(guideBuilds(saved().document)).toEqual([before]);
  });

  it("provides a menu alternative and ignores malformed or composing drops", async () => {
    const record = seed();
    render(<App catalogState={missing} />);
    const { box, source, data } = await startDrag(record);
    const before = saved().document;
    fireEvent.dragOver(box, { dataTransfer: data });
    fireEvent.dragEnd(source, { dataTransfer: data });
    expect(document.querySelector(".guide-drop-caret")).toBeNull();
    fireEvent.compositionStart(box);
    fireEvent.drop(box, { dataTransfer: data });
    expect(saved().document).toEqual(before);
    fireEvent.compositionEnd(box);
    await waitFor(() => expect(source).toBeEnabled());
    data.setData(LIBRARY_BUILD_MIME, "invalid");
    fireEvent.drop(box, { dataTransfer: data });
    expect(saved().document).toEqual(before);
    fireEvent.click(screen.getByRole("button", { name: `Actions for ${record.name}` }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Insert into guide" }));
    await waitFor(() => expect(within(box).getAllByRole("list")).toHaveLength(2));
    expect(guideBuilds(saved().document)).toHaveLength(2);
  });

  it("rejects stale sources and drags captured for another guide", () => {
    const record = unresolvedSavedRecordFixture();
    const payload = libraryBuildDragPayload(record, "original-guide");
    expect(() => readLibraryBuildDrop(payload, [record], "other-guide")).toThrow("guide changed");
    expect(() => readLibraryBuildDrop(payload, [], "original-guide")).toThrow("removed");
    expect(() =>
      readLibraryBuildDrop(payload, [{ ...record, updatedAt: "later" }], "original-guide")
    ).toThrow("saved build changed");
  });
});
