import { describe, expect, it } from "vitest";

import {
  authoredDocumentId,
  buildSetEntryId,
  catalogId,
  createEmptyEquipmentLoadout,
  knownEquipmentSelection
} from "../domain";
import { fixtureCatalogFacts, validSavedRecordFixture } from "./library-fixtures";
import { localBuildRecordId, selectedPersistedBuildSnapshot } from "./persistence-schema";
import {
  createInitialWorkspaceState,
  generateNestedBuildId,
  materializeActiveBuildSetSnapshot,
  workspaceReducer
} from "./workspace-state";

const NOW = "2026-09-03T06:00:00Z";
const LATER = "2026-09-03T06:01:00Z";

describe("build set workspace state", () => {
  it("switches entries atomically without losing unsaved editor fields", () => {
    const entryA = buildSetEntryId("entry-a");
    const entryB = buildSetEntryId("entry-b");
    const set = workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
      type: "create-build-set-from-current",
      setId: authoredDocumentId("set-a"),
      entryId: entryA,
      decision: "discard"
    });
    const editedA = workspaceReducer(set, {
      type: "editor",
      action: {
        type: "set-profession",
        field: "primary",
        professionId: catalogId<"Profession">(1)
      }
    });
    const addedB = workspaceReducer(editedA, {
      type: "add-blank-build-set-entry",
      entryId: entryB,
      buildId: generateNestedBuildId(entryB),
      label: "Second"
    });
    const editedB = workspaceReducer(addedB, {
      type: "editor",
      action: {
        type: "set-profession",
        field: "secondary",
        professionId: catalogId<"Profession">(2)
      }
    });
    const backToA = workspaceReducer(editedB, {
      type: "select-build-set-entry",
      entryId: entryA
    });
    const backToB = workspaceReducer(backToA, {
      type: "select-build-set-entry",
      entryId: entryB
    });

    expect(backToA.editor.build.primaryProfessionId).toBe(catalogId<"Profession">(1));
    expect(backToB.editor.build.secondaryProfessionId).toBe(catalogId<"Profession">(2));
    expect(
      backToB.document.kind === "build-set" ? backToB.document.entries[1]?.snapshot : null
    ).toBeNull();
    expect(
      backToB.document.kind === "build-set"
        ? backToB.document.entries[0]?.snapshot?.build.primaryProfessionId
        : null
    ).toBe(catalogId<"Profession">(1));
  });

  it("saves active build-set edits without requiring a switch first", () => {
    const entry = buildSetEntryId("entry-save");
    const set = workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
      type: "create-build-set-from-current",
      setId: authoredDocumentId("set-save"),
      entryId: entry,
      decision: "discard",
      name: "Saved Set"
    });
    const edited = workspaceReducer(set, {
      type: "editor",
      action: { type: "set-mode", mode: "pvp" }
    });
    const saved = workspaceReducer(edited, {
      type: "save-new",
      id: localBuildRecordId("local-set"),
      name: "Saved Set",
      now: LATER,
      savedWith: fixtureCatalogFacts
    });

    const record = saved.library.records[0];
    expect(record?.document.kind).toBe("build-set");
    expect(
      record?.document.kind === "build-set"
        ? record.document.snapshot.entries[0]?.snapshot.build.mode
        : null
    ).toBe("pvp");
    expect(materializeActiveBuildSetSnapshot(saved)?.entries[0]?.snapshot.build.mode).toBe("pvp");
  });

  it("duplicates the selected entry as an independent variant with fresh nested IDs", () => {
    const entryA = buildSetEntryId("entry-source");
    const entryB = buildSetEntryId("entry-copy");
    const buildId = authoredDocumentId("build-copy");
    const set = workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
      type: "create-build-set-from-current",
      setId: authoredDocumentId("set-duplicate"),
      entryId: entryA,
      decision: "discard"
    });
    const equipment = createEmptyEquipmentLoadout();
    const sourceWithNestedState = {
      ...set,
      editor: {
        ...set.editor,
        pveBudget: { level: 18, questBonus: "none" as const },
        rawTemplate: {
          ...set.editor.rawTemplate,
          attributes: [
            {
              namespace: "attribute" as const,
              templateId: 26,
              catalogId: null,
              outcomeKind: "reserved" as const,
              label: "Reserved attribute",
              reason: "Reserved fixture"
            }
          ]
        },
        build: {
          ...set.editor.build,
          attributes: [{ attributeId: catalogId<"Attribute">(17), rank: 10 }],
          titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }],
          equipment: {
            ...equipment,
            armor: equipment.armor.map((piece) =>
              piece.slot === "head"
                ? { ...piece, rune: knownEquipmentSelection(catalogId<"Rune">(1)) }
                : piece
            )
          }
        }
      }
    };
    const duplicated = workspaceReducer(sourceWithNestedState, {
      type: "duplicate-selected-build-set-entry",
      entryId: entryB,
      buildId
    });
    const changedCopy = workspaceReducer(duplicated, {
      type: "editor",
      action: { type: "set-mode", mode: "pvp" }
    });
    const source = workspaceReducer(changedCopy, {
      type: "select-build-set-entry",
      entryId: entryA
    });
    const materialized = materializeActiveBuildSetSnapshot(source);
    const sourceSnapshot = materialized?.entries.find((entry) => entry.id === entryA)?.snapshot;
    const copySnapshot = materialized?.entries.find((entry) => entry.id === entryB)?.snapshot;

    expect(copySnapshot?.build.id).toBe(buildId);
    expect(copySnapshot?.build.mode).toBe("pvp");
    expect(source.editor.build.mode).toBe("pve");
    expect(copySnapshot?.pveBudget).toEqual({ level: 18, questBonus: "none" });
    expect(copySnapshot?.build.titleRankOverrides).toEqual([
      { key: "title:lightbringer-rank", rank: 4 }
    ]);
    expect(copySnapshot?.build.skillBar).not.toBe(source.editor.build.skillBar);
    expect(copySnapshot?.build.attributes).not.toBe(sourceSnapshot?.build.attributes);
    expect(copySnapshot?.build.titleRankOverrides).not.toBe(
      sourceSnapshot?.build.titleRankOverrides
    );
    expect(copySnapshot?.build.equipment).not.toBe(sourceSnapshot?.build.equipment);
    expect(copySnapshot?.rawTemplate.attributes).not.toBe(sourceSnapshot?.rawTemplate.attributes);
    expect(source.document.kind === "build-set" ? source.document.comparisonEntryId : null).toBe(
      entryB
    );
  });

  it("leaves safe empty-set state after removing the last entry and ignores no-selection commands", () => {
    const entry = buildSetEntryId("entry-empty");
    const set = workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
      type: "create-build-set-from-current",
      setId: authoredDocumentId("set-empty"),
      entryId: entry,
      decision: "discard"
    });
    const empty = workspaceReducer(set, {
      type: "remove-build-set-entry",
      entryId: entry
    });
    const unchanged = workspaceReducer(empty, {
      type: "duplicate-selected-build-set-entry",
      entryId: buildSetEntryId("entry-copy"),
      buildId: authoredDocumentId("build-copy")
    });

    expect(materializeActiveBuildSetSnapshot(empty)?.entries).toEqual([]);
    expect(
      empty.document.kind === "build-set" ? empty.document.selectedEntryId : "build"
    ).toBeNull();
    expect(unchanged).toStrictEqual(empty);
  });

  it("enforces the 16-entry cap on reducer ingress", () => {
    let state = workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
      type: "new-build-set",
      setId: authoredDocumentId("set-cap"),
      decision: "discard"
    });
    for (let index = 0; index < 17; index += 1) {
      const entryId = buildSetEntryId(`entry-${index}`);
      state = workspaceReducer(state, {
        type: "add-blank-build-set-entry",
        entryId,
        buildId: generateNestedBuildId(entryId),
        label: `Loadout ${index}`
      });
    }

    expect(materializeActiveBuildSetSnapshot(state)?.entries).toHaveLength(16);
  });

  it("clears kind-mismatched associations instead of overwriting another document kind", () => {
    const record = validSavedRecordFixture({ id: localBuildRecordId("local-build") });
    const set = workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
      type: "create-build-set-from-current",
      setId: authoredDocumentId("set-kind"),
      entryId: buildSetEntryId("entry-kind"),
      decision: "discard"
    });
    const mismatched = {
      ...set,
      draftSession: {
        ...set.draftSession,
        associatedRecordId: record.id
      },
      library: {
        ...set.library,
        records: [record]
      }
    };
    const updated = workspaceReducer(mismatched, {
      type: "update-associated",
      now: LATER,
      savedWith: fixtureCatalogFacts
    });

    expect(updated.draftSession.associatedRecordId).toBeNull();
    expect(selectedPersistedBuildSnapshot(updated.library.records[0]!.document)?.build.name).toBe(
      selectedPersistedBuildSnapshot(record.document)?.build.name
    );
  });
});
