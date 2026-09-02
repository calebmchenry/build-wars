import { describe, expect, it } from "vitest";

import { catalogId } from "../domain";
import { playableEditorFixture } from "./editor-fixtures";
import {
  fixtureCatalogFacts,
  validLocalLibraryEnvelopeFixture,
  validSavedRecordFixture
} from "./library-fixtures";
import { LOCAL_LIBRARY_STORAGE_KEY, localBuildRecordId } from "./persistence-schema";
import {
  createInitialWorkspaceState,
  createWorkspaceEnvelope,
  generateLocalBuildRecordId,
  needsDirtyGuard,
  workspacePersistenceFingerprint,
  workspaceReducer
} from "./workspace-state";

const NOW = "2026-09-02T19:25:41Z";
const LATER = "2026-09-02T19:26:41Z";

describe("workspace state", () => {
  it("hydrates a stored working draft with records while keeping editor UI defaults fresh", () => {
    const envelope = validLocalLibraryEnvelopeFixture();
    const workspace = createInitialWorkspaceState({
      envelope,
      readStatus: "loaded",
      diagnostics: []
    });

    expect(workspace.editor.build.name).toBe(envelope.workingDraft?.snapshot.build.name);
    expect(workspace.editor.browser.filters.query).toBe("");
    expect(workspace.library.records).toHaveLength(3);
    expect(workspace.draftSession.hydrationSource).toBe("storage");
    expect(workspace.draftSession.dirtyState).toBe("clean");
  });

  it("persists the working draft separately from saved records", () => {
    const workspace = workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
      type: "editor",
      action: {
        type: "set-profession",
        field: "primary",
        professionId: catalogId<"Profession">(1)
      }
    });
    const envelope = createWorkspaceEnvelope(workspace, fixtureCatalogFacts, LATER);

    expect(workspace.draftSession.dirtyState).toBe("dirty");
    expect(envelope.workingDraft?.snapshot.build.primaryProfessionId).toBe(
      catalogId<"Profession">(1)
    );
    expect(envelope.savedBuilds).toHaveLength(0);
    expect(LOCAL_LIBRARY_STORAGE_KEY).toBe("build-wars:v1");
  });

  it("saves new records, updates associated records, and allows save-as-new duplicates", () => {
    const edited = {
      ...createInitialWorkspaceState({ now: NOW }),
      editor: playableEditorFixture()
    };
    const saved = workspaceReducer(edited, {
      type: "save-new",
      id: localBuildRecordId("local-a"),
      name: "First Save",
      now: NOW,
      savedWith: fixtureCatalogFacts
    });
    const changed = workspaceReducer(saved, {
      type: "editor",
      action: { type: "set-mode", mode: "pvp" }
    });
    const updated = workspaceReducer(changed, {
      type: "update-associated",
      now: LATER,
      savedWith: fixtureCatalogFacts
    });
    const copy = workspaceReducer(updated, {
      type: "save-as-new",
      id: localBuildRecordId("local-b"),
      name: "First Save",
      now: LATER,
      savedWith: fixtureCatalogFacts
    });

    expect(saved.library.records).toHaveLength(1);
    expect(saved.draftSession.associatedRecordId).toBe("local-a");
    expect(updated.library.records[0]?.snapshot.build.mode).toBe("pvp");
    expect(updated.draftSession.dirtyState).toBe("clean");
    expect(copy.library.records).toHaveLength(2);
    expect(copy.library.records.map((record) => record.name)).toEqual(["First Save", "First Save"]);
    expect(copy.library.records.map((record) => record.id)).toEqual(["local-a", "local-b"]);
  });

  it("duplicates without changing the active draft and deletes associated records safely", () => {
    const record = validSavedRecordFixture({ id: localBuildRecordId("local-a") });
    const loaded = workspaceReducer(
      createInitialWorkspaceState({
        envelope: validLocalLibraryEnvelopeFixture({ workingDraft: null, savedBuilds: [record] })
      }),
      { type: "load-record", id: record.id, decision: "discard" }
    );
    const duplicated = workspaceReducer(loaded, {
      type: "duplicate-record",
      id: record.id,
      newId: localBuildRecordId("local-copy"),
      now: LATER
    });
    const ignoredDelete = workspaceReducer(duplicated, {
      type: "delete-record",
      id: record.id,
      confirmed: false,
      now: LATER
    });
    const deleted = workspaceReducer(ignoredDelete, {
      type: "delete-record",
      id: record.id,
      confirmed: true,
      now: LATER
    });

    expect(duplicated.library.records).toHaveLength(2);
    expect(duplicated.draftSession.associatedRecordId).toBe(record.id);
    expect(ignoredDelete.library.records).toHaveLength(2);
    expect(deleted.library.records.map((item) => item.id)).toEqual(["local-copy"]);
    expect(deleted.draftSession.associatedRecordId).toBeNull();
    expect(deleted.editor.build.name).toBe(record.snapshot.build.name);
  });

  it("normalizes tags and notes without deduplicating records by name or content", () => {
    const record = validSavedRecordFixture({ id: localBuildRecordId("local-a"), tags: [] });
    const workspace = createInitialWorkspaceState({
      envelope: validLocalLibraryEnvelopeFixture({ workingDraft: null, savedBuilds: [record] })
    });
    const tagged = workspaceReducer(workspace, {
      type: "set-record-tags",
      id: record.id,
      tags: [" Farm ", "farm", "Support"],
      now: LATER
    });
    const noted = workspaceReducer(tagged, {
      type: "set-record-notes",
      id: record.id,
      notes: "  Keep this variant.  ",
      now: LATER
    });

    expect(noted.library.records[0]?.tags).toEqual(["Farm", "Support"]);
    expect(noted.library.records[0]?.notes).toBe("Keep this variant.");
  });

  it("guards dirty draft replacement until the caller chooses discard", () => {
    const record = validSavedRecordFixture({ id: localBuildRecordId("local-a") });
    const dirty = workspaceReducer(
      createInitialWorkspaceState({
        envelope: validLocalLibraryEnvelopeFixture({ workingDraft: null, savedBuilds: [record] })
      }),
      {
        type: "replace-draft",
        editor: playableEditorFixture(),
        source: "template-import",
        decision: "discard"
      }
    );

    expect(needsDirtyGuard(dirty)).toBe(true);

    const canceled = workspaceReducer(dirty, {
      type: "load-record",
      id: record.id,
      decision: "cancel"
    });
    const discarded = workspaceReducer(dirty, {
      type: "load-record",
      id: record.id,
      decision: "discard"
    });

    expect(canceled.editor.build.name).toBe("Hammer and Bow");
    expect(discarded.draftSession.associatedRecordId).toBe(record.id);
    expect(discarded.draftSession.dirtyState).toBe("clean");
  });

  it("renames associated clean records into the draft but leaves dirty divergence visible", () => {
    const record = validSavedRecordFixture({ id: localBuildRecordId("local-a") });
    const loaded = workspaceReducer(
      createInitialWorkspaceState({
        envelope: validLocalLibraryEnvelopeFixture({ workingDraft: null, savedBuilds: [record] })
      }),
      { type: "load-record", id: record.id, decision: "discard" }
    );
    const cleanRename = workspaceReducer(loaded, {
      type: "rename-record",
      id: record.id,
      name: "Renamed",
      now: LATER,
      savedWith: fixtureCatalogFacts
    });
    const dirty = workspaceReducer(cleanRename, {
      type: "editor",
      action: { type: "set-mode", mode: "pvp" }
    });
    const dirtyRename = workspaceReducer(dirty, {
      type: "rename-record",
      id: record.id,
      name: "Library Name",
      now: LATER,
      savedWith: fixtureCatalogFacts
    });

    expect(cleanRename.editor.build.name).toBe("Renamed");
    expect(dirtyRename.library.records[0]?.name).toBe("Library Name");
    expect(dirtyRename.editor.build.name).toBe("Renamed");
    expect(dirtyRename.draftSession.dirtyState).toBe("dirty");
  });

  it("tracks durable fingerprints and explicit flush tokens for storage effects", () => {
    const workspace = createInitialWorkspaceState({ now: NOW });
    const fingerprint = workspacePersistenceFingerprint(workspace, fixtureCatalogFacts);
    const saved = workspaceReducer(workspace, {
      type: "save-new",
      id: generateLocalBuildRecordId(NOW, 1),
      name: "Flush Me",
      now: NOW,
      savedWith: fixtureCatalogFacts
    });

    expect(fingerprint).not.toBe(workspacePersistenceFingerprint(saved, fixtureCatalogFacts));
    expect(saved.storage.flushToken).toBe(1);
  });

  it("creates a blank draft through the shared dirty guard", () => {
    const dirty = workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
      type: "replace-draft",
      editor: playableEditorFixture(),
      source: "template-import",
      decision: "discard"
    });
    const canceled = workspaceReducer(dirty, {
      type: "new-draft",
      name: "New",
      decision: "cancel"
    });
    const blank = workspaceReducer(dirty, {
      type: "new-draft",
      name: "New",
      decision: "discard"
    });

    expect(canceled.editor.build.name).toBe("Hammer and Bow");
    expect(blank.editor.build.name).toBe("New");
    expect(blank.draftSession.dirtyState).toBe("clean");
  });
});
