import { describe, expect, it } from "vitest";

import { catalogId } from "../domain";
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
});
