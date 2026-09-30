import { describe, expect, it } from "vitest";
import {
  documentLibraryReducer as reduce,
  initializeDocumentLibrary,
  mergeDocumentRecords,
  writeDocumentLibrary,
  documentUrl
} from "./document-library";
import { createInitialWorkspaceState, materializeActiveDocument } from "./workspace-state";
import {
  fixtureCatalogFacts,
  validLocalLibraryEnvelopeFixture,
  validSavedRecordFixture
} from "./library-fixtures";
import {
  localBuildRecordId,
  parseLocalLibraryJson,
  serializeLocalLibraryEnvelope
} from "./persistence-schema";
import { guideAddress } from "./guide-state";

const first = validSavedRecordFixture({ id: localBuildRecordId("first") });
const second = validSavedRecordFixture({ id: localBuildRecordId("second") });
function initial() {
  return initializeDocumentLibrary(
    createInitialWorkspaceState({
      envelope: validLocalLibraryEnvelopeFixture({
        savedDocuments: [first, second],
        workingDraft: {
          document: first.document,
          associatedRecordId: first.id,
          savedWith: fixtureCatalogFacts
        }
      })
    })
  );
}
const rename = (id: typeof first.id, name: string) => ({
  type: "rename-record" as const,
  id,
  name,
  now: "2026-09-29T20:00:00Z",
  savedWith: fixtureCatalogFacts
});

describe("document library", () => {
  it("adopts an unassociated draft without colliding with an existing document ID", () => {
    const fresh = initializeDocumentLibrary(createInitialWorkspaceState());
    const existing = fresh.library.records[0]!;
    const state = initializeDocumentLibrary(
      createInitialWorkspaceState({
        envelope: validLocalLibraryEnvelopeFixture({
          savedDocuments: [existing],
          workingDraft: {
            document: existing.document,
            associatedRecordId: null,
            savedWith: fixtureCatalogFacts
          }
        })
      })
    );
    expect(state.library.records).toHaveLength(2);
    expect(new Set(state.library.records.map((record) => record.id)).size).toBe(2);
    expect(state.draftSession.associatedRecordId).not.toBe(existing.id);
  });
  it("keeps edits when switching before the autosave debounce expires", () => {
    let state = initial();
    state = reduce(state, {
      type: "editor",
      action: { type: "set-build-name", name: "Latest writing" }
    });
    state = reduce(state, { type: "open-document", id: second.id });
    state = reduce(state, { type: "open-document", id: first.id });
    expect(state.editor.build.name).toBe("Latest writing");
  });
  it("creates independent guides, duplicates their latest writing and retains recovery", () => {
    let state = reduce(initial(), {
      type: "create-document",
      kind: "guide",
      id: localBuildRecordId("notes")
    });
    if (state.document.kind !== "guide") throw Error("Expected guide");
    state = reduce(state, {
      type: "guide",
      command: {
        ...guideAddress(state.document),
        type: "metadata",
        metadata: { ...state.document.history.frame.document.metadata, title: "Field notes" }
      }
    });
    const original = materializeActiveDocument(state);
    state = reduce(state, {
      type: "duplicate-record",
      id: localBuildRecordId("notes"),
      newId: localBuildRecordId("copy"),
      now: "2026-09-29T20:00:00Z"
    });
    const copy = state.library.records.find((record) => record.id === "copy");
    expect(copy?.name).toBe("Field notes Copy");
    if (copy?.document.kind !== "guide" || original.kind !== "guide")
      throw Error("Expected guides");
    expect(copy.document.snapshot.document.metadata.id).not.toBe(
      original.snapshot.document.metadata.id
    );
    expect(copy.document.snapshot.document.nodes).toEqual(original.snapshot.document.nodes);
  });
  it("renames inactive document content, not only its label", () => {
    let state = reduce(initial(), rename(second.id, "Renamed"));
    state = reduce(state, { type: "open-document", id: second.id });
    expect(state.editor.build.name).toBe("Renamed");
  });
  it("deletes the active document without resurrecting it on the next write", () => {
    let state = reduce(initial(), { type: "remove-document", id: first.id });
    expect(state.draftSession.associatedRecordId).toBe(second.id);
    state = reduce(state, { type: "remove-document", id: second.id });
    expect(state.library.records).toEqual([]);
    expect(state.draftSession.associatedRecordId).toBeNull();
  });
  it("merges edits to different documents and detects edit/delete conflicts", () => {
    const ours = { ...first, name: "Ours" };
    const theirs = { ...second, name: "Theirs" };
    expect(mergeDocumentRecords([first, second], [ours, second], [first, theirs])).toEqual({
      records: [ours, theirs],
      conflicts: []
    });
    expect(mergeDocumentRecords([first], [ours], []).conflicts).toEqual(["Ours"]);
    expect(mergeDocumentRecords([first], [], [{ ...first, name: "Theirs" }]).conflicts).toEqual([
      "Theirs"
    ]);
  });
  it("refreshes a clean open document from another tab and preserves local conflicting edits", () => {
    const state = initial();
    const remote = reduce(state, rename(first.id, "Remote title"));
    const envelope = validLocalLibraryEnvelopeFixture({
      revision: 4,
      savedDocuments: remote.library.records
    });
    expect(reduce(state, { type: "receive-library", envelope }).editor.build.name).toBe(
      "Remote title"
    );
    const dirty = reduce(state, rename(first.id, "Local title"));
    const conflicted = reduce(dirty, { type: "receive-library", envelope });
    expect(conflicted.draftSession.durability).toBe("conflict");
    expect(conflicted.editor.build.name).toBe("Local title");
  });
  it("merges before writing even if the storage event has not arrived", () => {
    const state = initial();
    const remote = reduce(state, rename(second.id, "Other tab"));
    let raw = serializeLocalLibraryEnvelope(
      validLocalLibraryEnvelopeFixture({ revision: 4, savedDocuments: remote.library.records })
    );
    const storage = {
      getItem: () => raw,
      setItem: (_key: string, value: string) => {
        raw = value;
      }
    };
    const result = writeDocumentLibrary(
      storage,
      reduce(state, rename(first.id, "This tab")),
      fixtureCatalogFacts,
      "test"
    );
    expect(result.ok).toBe(true);
    const parsed = parseLocalLibraryJson(raw);
    expect(parsed.ok && parsed.envelope.savedDocuments.map((record) => record.name)).toEqual([
      "This tab",
      "Other tab"
    ]);
  });
  it("does not write over a concurrent edit to the same document", () => {
    const state = initial();
    const remote = reduce(state, rename(first.id, "Other tab"));
    const raw = serializeLocalLibraryEnvelope(
      validLocalLibraryEnvelopeFixture({ revision: 4, savedDocuments: remote.library.records })
    );
    let writes = 0;
    const result = writeDocumentLibrary(
      {
        getItem: () => raw,
        setItem: () => {
          writes++;
        }
      },
      reduce(state, rename(first.id, "This tab")),
      fixtureCatalogFacts,
      "test"
    );
    expect(result).toMatchObject({ ok: false, status: "conflict" });
    expect(writes).toBe(0);
  });
  it("builds document URLs without carrying share fragments into another tab", () => {
    const url = new URL(documentUrl(first.id, "https://example.com/editor?mode=dark#share-code"));
    expect(url.searchParams.get("document")).toBe("first");
    expect(url.searchParams.get("mode")).toBe("dark");
    expect(url.hash).toBe("");
  });
});
