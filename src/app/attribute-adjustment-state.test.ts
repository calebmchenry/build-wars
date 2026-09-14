import { describe, expect, it } from "vitest";
import {
  authoredDocumentId,
  buildSetEntryId,
  catalogId,
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  type AttributeId,
  type RuneId
} from "../domain";
import { adjustmentProfileFixture } from "./attribute-adjustment-fixtures";
import { equipmentActionWithAdjustmentFacts } from "./attribute-adjustment-actions";
import { requireReadyCatalogs } from "./catalogs";
import { createBlankEditorState, editorReducer, type EditorAction } from "./editor-state";
import {
  createPersistedBuildSnapshot,
  fingerprintPersistedSnapshot,
  hydrateEditorFromSnapshot
} from "./persistence-schema";
import {
  createInitialWorkspaceState,
  materializeActiveBuildSetSnapshot,
  workspaceReducer
} from "./workspace-state";

const catalogs = requireReadyCatalogs();
function adjusted() {
  const state = createBlankEditorState();
  return {
    ...state,
    build: {
      ...state.build,
      primaryProfessionId: catalogId<"Profession">(5),
      attributeAdjustments: adjustmentProfileFixture()
    }
  };
}
describe("authored adjustment lifecycle", () => {
  it("edits only authored adjustments, including attribute zero, and fingerprints them", () => {
    const before = createBlankEditorState();
    const next = editorReducer(before, {
      type: "set-attribute-rune",
      attributeId: catalogId<"Attribute">(0),
      runeId: null
    });
    expect(next.build.attributes).toBe(before.build.attributes);
    expect(next.rawTemplate).toBe(before.rawTemplate);
    expect(next.build.equipment).toBeNull();
    expect(next.build.attributeAdjustments?.runeOverrides).toEqual([
      { attributeId: 0, runeId: null }
    ]);
    expect(fingerprintPersistedSnapshot(createPersistedBuildSnapshot(next))).not.toBe(
      fingerprintPersistedSnapshot(createPersistedBuildSnapshot(before))
    );
    expect(hydrateEditorFromSnapshot(createPersistedBuildSnapshot(next)).build).toEqual(next.build);
    expect(
      editorReducer(next, { type: "reset-attribute-rune", attributeId: catalogId<"Attribute">(0) })
        .build.attributeAdjustments
    ).toBeNull();
  });
  it("preserves explicit off/strength through unrelated edits and reset", () => {
    let state = adjusted();
    for (const action of [
      { type: "set-mode", mode: "pvp" },
      { type: "place-skill", slotIndex: 0, skillId: catalogId<"Skill">(198) },
      { type: "clear-skill-slot", slotIndex: 0 },
      { type: "set-profession", field: "secondary", professionId: catalogId<"Profession">(6) }
    ] satisfies EditorAction[])
      state = editorReducer(state, action) as typeof state;
    expect(state.build.attributeAdjustments).toEqual(adjustmentProfileFixture());
    const reset = editorReducer(state, {
      type: "reset-assumed-effect",
      effectId: "heroic-refrain"
    });
    expect(reset.build.attributeAdjustments?.effectPreferences).toEqual([
      { effectId: "glyph-of-elemental-power", preference: "off" }
    ]);
  });
  it("same primary is a true no-op before cleanup; actual primary changes clear only gear", () => {
    const state = adjusted();
    expect(
      editorReducer(state, {
        type: "set-profession",
        field: "primary",
        professionId: state.build.primaryProfessionId,
        clearAttributeIds: [catalogId<"Attribute">(0)],
        clearSkillSlotIndexes: [0]
      })
    ).toBe(state);
    const next = editorReducer(state, {
      type: "set-profession",
      field: "primary",
      professionId: null
    });
    expect(next.build.attributeAdjustments).toEqual({
      headgearOverride: null,
      runeOverrides: [],
      effectPreferences: state.build.attributeAdjustments.effectPreferences
    });
    expect(next.build.equipment).toBe(state.build.equipment);
  });
  it("hidden rune edits clear only proven old/new targets and preserve no-ops", () => {
    const runes = [0, 1, 2].map((id) =>
      catalogs.equipment.runes.find(
        (r) => Number(r.affectedAttributeId) === id && r.familyRank === "minor"
      )!
    );
    const blank = adjusted();
    const equipment = createEmptyEquipmentLoadout();
    const state = {
      ...blank,
      build: {
        ...blank.build,
        attributeAdjustments: {
          ...blank.build.attributeAdjustments,
          runeOverrides: runes.map((r) => ({
            attributeId: r.affectedAttributeId as AttributeId,
            runeId: r.id
          }))
        },
        equipment: {
          ...equipment,
          armor: equipment.armor.map((p) =>
            p.slot === "hands" ? { ...p, rune: knownEquipmentSelection(runes[0]!.id) } : p
          )
        }
      }
    };
    const command = (id: RuneId) =>
      equipmentActionWithAdjustmentFacts(state.build, catalogs, {
        type: "set-armor-rune",
        slot: "hands",
        selection: knownEquipmentSelection(id)
      });
    expect(editorReducer(state, command(runes[0]!.id)).build).toBe(state.build);
    expect(
      editorReducer(state, command(runes[1]!.id)).build.attributeAdjustments?.runeOverrides.map(
        (r) => r.attributeId
      )
    ).toEqual([2]);
    const unknown = editorReducer(state, command(catalogId<"Rune">(99999)));
    expect(unknown.build.attributeAdjustments?.runeOverrides.map((r) => r.attributeId)).toEqual([
      1, 2
    ]);
    const reset = editorReducer(
      state,
      equipmentActionWithAdjustmentFacts(state.build, catalogs, { type: "reset-equipment" })
    );
    expect(reset.build.attributeAdjustments?.runeOverrides.map((r) => r.attributeId)).toEqual([
      1, 2
    ]);
    expect(reset.build.attributeAdjustments?.headgearOverride).toEqual(
      state.build.attributeAdjustments.headgearOverride
    );
    expect(editorReducer(blank, { type: "reset-equipment" }).build).toBe(blank.build);
  });
  it("guards absent selected loadouts and dirties only the selected variant", () => {
    const empty = workspaceReducer(createInitialWorkspaceState(), {
      type: "new-build-set",
      setId: authoredDocumentId("empty"),
      decision: "discard"
    });
    expect(
      workspaceReducer(empty, {
        type: "editor",
        action: {
          type: "set-assumed-effect",
          value: { effectId: "heroic-refrain", preference: "on", strength: 4 }
        }
      })
    ).toBe(empty);
    let workspace = workspaceReducer(createInitialWorkspaceState(), {
      type: "editor",
      action: { type: "replace-state", state: adjusted() }
    });
    workspace = workspaceReducer(workspace, {
      type: "create-build-set-from-current",
      setId: authoredDocumentId("set"),
      entryId: buildSetEntryId("a"),
      decision: "discard"
    });
    workspace = workspaceReducer(workspace, {
      type: "duplicate-selected-build-set-entry",
      entryId: buildSetEntryId("b"),
      buildId: authoredDocumentId("b")
    });
    const before = materializeActiveBuildSetSnapshot(workspace)!;
    workspace = workspaceReducer(workspace, {
      type: "editor",
      action: { type: "set-attribute-headgear", override: { kind: "none" } }
    });
    const after = materializeActiveBuildSetSnapshot(workspace)!;
    expect(after.entries[0]).toEqual(before.entries[0]);
    expect(after.entries[1]?.snapshot.build.attributeAdjustments?.headgearOverride).toEqual({
      kind: "none"
    });
    expect(workspace.draftSession.dirtyState).toBe("dirty");
  });
});
