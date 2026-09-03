import { describe, expect, it } from "vitest";

import {
  catalogId,
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  type RuneId
} from "../domain";
import { playableEditorFixture } from "./editor-fixtures";
import {
  fixtureCatalogFacts,
  validLocalLibraryEnvelopeFixture,
  validSavedRecordFixture
} from "./library-fixtures";
import {
  LOCAL_LIBRARY_STORAGE_KEY,
  localBuildRecordId,
  selectedPersistedBuildSnapshot,
  type PersistedSavedDocumentRecord,
  type PersistedWorkingDraft
} from "./persistence-schema";
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

    expect(workspace.editor.build.name).toBe(draftSnapshot(envelope.workingDraft)?.build.name);
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
    expect(draftSnapshot(envelope.workingDraft)?.build.primaryProfessionId).toBe(
      catalogId<"Profession">(1)
    );
    expect(envelope.savedDocuments).toHaveLength(0);
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
    expect(recordSnapshot(updated.library.records[0])?.build.mode).toBe("pvp");
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
    expect(deleted.editor.build.name).toBe(recordSnapshot(record)?.build.name);
  });

  it("preserves semantic equipment through save, duplicate, and load", () => {
    const equipment = createEmptyEquipmentLoadout();
    const editor = {
      ...playableEditorFixture(),
      build: {
        ...playableEditorFixture().build,
        equipment: {
          ...equipment,
          armor: equipment.armor.map((piece) =>
            piece.slot === "head"
              ? { ...piece, rune: knownEquipmentSelection(40 as RuneId) }
              : piece
          )
        }
      }
    };
    const saved = workspaceReducer(
      {
        ...createInitialWorkspaceState({ now: NOW }),
        editor
      },
      {
        type: "save-new",
        id: localBuildRecordId("local-equipment"),
        name: "Equipment Save",
        now: NOW,
        savedWith: fixtureCatalogFacts
      }
    );
    const duplicated = workspaceReducer(saved, {
      type: "duplicate-record",
      id: localBuildRecordId("local-equipment"),
      newId: localBuildRecordId("local-equipment-copy"),
      now: LATER
    });
    const loaded = workspaceReducer(duplicated, {
      type: "load-record",
      id: localBuildRecordId("local-equipment-copy"),
      decision: "discard"
    });

    expect(duplicated.library.records).toHaveLength(2);
    expect(recordSnapshot(duplicated.library.records[1])?.build.equipment).toEqual(
      recordSnapshot(saved.library.records[0])?.build.equipment
    );
    expect(loaded.editor.build.equipment).toEqual(
      recordSnapshot(saved.library.records[0])?.build.equipment
    );
  });

  it("preserves title overrides through save, duplicate, and load", () => {
    const editor = {
      ...playableEditorFixture(),
      build: {
        ...playableEditorFixture().build,
        titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }]
      }
    };
    const saved = workspaceReducer(
      {
        ...createInitialWorkspaceState({ now: NOW }),
        editor
      },
      {
        type: "save-new",
        id: localBuildRecordId("local-title"),
        name: "Title Save",
        now: NOW,
        savedWith: fixtureCatalogFacts
      }
    );
    const duplicated = workspaceReducer(saved, {
      type: "duplicate-record",
      id: localBuildRecordId("local-title"),
      newId: localBuildRecordId("local-title-copy"),
      now: LATER
    });
    const loaded = workspaceReducer(duplicated, {
      type: "load-record",
      id: localBuildRecordId("local-title-copy"),
      decision: "discard"
    });

    expect(recordSnapshot(duplicated.library.records[1])?.build.titleRankOverrides).toEqual([
      { key: "title:lightbringer-rank", rank: 4 }
    ]);
    expect(loaded.editor.build.titleRankOverrides).toEqual([
      { key: "title:lightbringer-rank", rank: 4 }
    ]);
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

function draftSnapshot(draft: PersistedWorkingDraft | null | undefined) {
  return draft === null || draft === undefined
    ? null
    : selectedPersistedBuildSnapshot(draft.document);
}

function recordSnapshot(record: PersistedSavedDocumentRecord | undefined) {
  return record === undefined ? null : selectedPersistedBuildSnapshot(record.document);
}
