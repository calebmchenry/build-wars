import { describe, expect, it } from "vitest";
import { authoredDocumentId, buildSetEntryId, catalogId } from "../domain";
import { adjustmentProfileFixture } from "./attribute-adjustment-fixtures";
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
      runeId: catalogId<"Rune">(22)
    });
    expect(next.build.attributes).toBe(before.build.attributes);
    expect(next.rawTemplate).toBe(before.rawTemplate);
    expect(next.build).not.toHaveProperty("equipment");
    expect(next.build.attributeAdjustments?.runes).toEqual([{ attributeId: 0, runeId: 22 }]);
    expect(fingerprintPersistedSnapshot(createPersistedBuildSnapshot(next))).not.toBe(
      fingerprintPersistedSnapshot(createPersistedBuildSnapshot(before))
    );
    expect(hydrateEditorFromSnapshot(createPersistedBuildSnapshot(next)).build).toEqual(next.build);
    expect(
      editorReducer(next, {
        type: "set-attribute-rune",
        runeId: null,
        attributeId: catalogId<"Attribute">(0)
      }).build.attributeAdjustments
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
      headgearAttributeId: null,
      runes: [],
      effectPreferences: state.build.attributeAdjustments.effectPreferences
    });
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
      action: { type: "set-attribute-headgear", attributeId: null }
    });
    const after = materializeActiveBuildSetSnapshot(workspace)!;
    expect(after.entries[0]).toEqual(before.entries[0]);
    expect(after.entries[1]?.snapshot.build.attributeAdjustments?.headgearAttributeId).toBeNull();
    expect(workspace.draftSession.dirtyState).toBe("dirty");
  });
});
