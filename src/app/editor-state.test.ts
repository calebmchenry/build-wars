import { describe, expect, it } from "vitest";

import {
  catalogId,
  knownEquipmentSelection,
  type RuneId,
  type WeaponId,
  type WeaponModifierId
} from "../domain";
import {
  createBlankEditorState,
  createRawOverlayEntry,
  editorReducer,
  type EditorState
} from "./editor-state";

describe("editor state reducer", () => {
  it("constructs a blank in-memory build with exactly eight skill slots", () => {
    const state = createBlankEditorState();

    expect(state.build.skillBar).toHaveLength(8);
    expect(state.build.skillBar.every((slot) => slot === null)).toBe(true);
    expect(state.build.mode).toBe("pve");
    expect(state.pveBudget).toEqual({ level: 20, questBonus: "maximum-applicable" });
  });

  it("places, moves, swaps, and clears slots with raw overlays atomically", () => {
    const initial = createBlankEditorState();
    const imported: EditorState = {
      ...initial,
      build: {
        ...initial.build,
        skillBar: [
          catalogId<"Skill">(-1),
          catalogId<"Skill">(1),
          null,
          null,
          null,
          null,
          null,
          null
        ]
      },
      rawTemplate: {
        ...initial.rawTemplate,
        skillBar: [
          createRawOverlayEntry({
            namespace: "skill",
            templateId: 999999,
            catalogId: null,
            outcomeKind: "unknown",
            label: "Unknown"
          }),
          createRawOverlayEntry({
            namespace: "skill",
            templateId: 1,
            catalogId: 1,
            outcomeKind: "known",
            label: "Healing Signet"
          }),
          null,
          null,
          null,
          null,
          null,
          null
        ]
      }
    };

    const moved = editorReducer(imported, { type: "move-skill-slot", fromIndex: 0, toIndex: 2 });
    expect(Number(moved.build.skillBar[2])).toBe(-1);
    expect(moved.rawTemplate.skillBar[2]?.templateId).toBe(999999);

    const swapped = editorReducer(moved, { type: "swap-skill-slots", leftIndex: 1, rightIndex: 2 });
    expect(Number(swapped.build.skillBar[1])).toBe(-1);
    expect(swapped.rawTemplate.skillBar[1]?.templateId).toBe(999999);

    const cleared = editorReducer(swapped, { type: "clear-skill-slot", slotIndex: 1 });
    expect(cleared.build.skillBar[1]).toBeNull();
    expect(cleared.rawTemplate.skillBar[1]).toBeNull();
  });

  it("treats invalid operations as typed no-ops", () => {
    const state = createBlankEditorState();

    expect(editorReducer(state, { type: "move-skill-slot", fromIndex: 99, toIndex: 0 })).toBe(
      state
    );
    expect(editorReducer(state, { type: "clear-skill-slot", slotIndex: -1 })).toBe(state);
  });

  it("keeps UI-only mode changes separate from imported raw overlays", () => {
    const state = {
      ...createBlankEditorState(),
      rawTemplate: {
        ...createBlankEditorState().rawTemplate,
        templateName: "Imported"
      }
    };
    const next = editorReducer(state, { type: "set-mode", mode: "unknown" });

    expect(next.rawTemplate.templateName).toBe("Imported");
    expect(next.build.mode).toBe("unknown");
  });

  it("keeps null equipment untouched for no-op clears and materializes on first meaningful edit", () => {
    const state = createBlankEditorState();
    const noOp = editorReducer(state, {
      type: "clear-armor-field",
      slot: "head",
      field: "rune"
    });
    const edited = editorReducer(state, {
      type: "set-armor-rune",
      slot: "head",
      selection: knownEquipmentSelection(101 as RuneId)
    });

    expect(noOp.build).toBe(state.build);
    expect(noOp.build.equipment).toBeNull();
    expect(edited.build.equipment?.armor).toHaveLength(5);
    expect(edited.build.equipment?.weaponSets).toHaveLength(4);
    expect(edited.build.equipment?.armor[0]?.rune).toEqual(knownEquipmentSelection(101 as RuneId));
  });

  it("clears ordinary equipment back to canonical empty state and resets explicitly to null", () => {
    const edited = editorReducer(createBlankEditorState(), {
      type: "set-armor-rune",
      slot: "head",
      selection: knownEquipmentSelection(101 as RuneId)
    });
    const cleared = editorReducer(edited, {
      type: "clear-armor-field",
      slot: "head",
      field: "rune"
    });
    const reset = editorReducer(cleared, { type: "reset-equipment" });

    expect(cleared.build.equipment).not.toBeNull();
    expect(cleared.build.equipment?.armor.every((piece) => piece.rune === null)).toBe(true);
    expect(reset.build.equipment).toBeNull();
  });

  it("preserves modifiers when clearing a weapon and rejects sparse modifier writes", () => {
    const withWeapon = editorReducer(createBlankEditorState(), {
      type: "set-weapon",
      setSlot: "set-1",
      hand: "mainHand",
      selection: knownEquipmentSelection(301 as WeaponId)
    });
    const withModifier = editorReducer(withWeapon, {
      type: "set-weapon-modifier",
      setSlot: "set-1",
      hand: "mainHand",
      modifierIndex: 0,
      selection: knownEquipmentSelection(401 as WeaponModifierId)
    });
    const sparseWrite = editorReducer(withModifier, {
      type: "set-weapon-modifier",
      setSlot: "set-1",
      hand: "mainHand",
      modifierIndex: 2,
      selection: knownEquipmentSelection(402 as WeaponModifierId)
    });
    const clearedWeapon = editorReducer(sparseWrite, {
      type: "clear-weapon",
      setSlot: "set-1",
      hand: "mainHand"
    });

    expect(sparseWrite.build).toBe(withModifier.build);
    expect(clearedWeapon.build.equipment?.weaponSets[0]?.mainHand?.weapon).toBeNull();
    expect(clearedWeapon.build.equipment?.weaponSets[0]?.mainHand?.modifiers).toEqual([
      knownEquipmentSelection(401 as WeaponModifierId)
    ]);
  });
});
