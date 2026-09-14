import { describe, expect, it } from "vitest";

import { catalogId } from "../domain";
import {
  createBlankEditorState,
  createRawOverlayEntry,
  editorReducer,
  type EditorState
} from "./editor-state";
import { requireReadyCatalogs } from "./catalogs";
import { playableEditorFixture } from "./editor-fixtures";
import { setProfessionWithAttributeCleanup } from "./attribute-eligibility";

const catalogs = requireReadyCatalogs();

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
    const next = editorReducer(state, { type: "set-mode", mode: "pvp" });

    expect(next.rawTemplate.templateName).toBe("Imported");
    expect(next.build.mode).toBe("pvp");
  });

  it("clears stale skills and updates custom profession filters when a profession changes", () => {
    const base = playableEditorFixture();
    const state: EditorState = {
      ...base,
      rawTemplate: {
        ...base.rawTemplate,
        skillBar: [
          null,
          null,
          null,
          null,
          null,
          createRawOverlayEntry({
            namespace: "skill",
            templateId: 391,
            catalogId: 391,
            outcomeKind: "known",
            label: "Hunter's Shot"
          }),
          null,
          null
        ]
      },
      browser: {
        ...base.browser,
        filters: {
          ...base.browser.filters,
          professionScope: {
            kind: "custom",
            professionIds: [catalogId<"Profession">(1), catalogId<"Profession">(2)]
          }
        }
      }
    };

    const next = editorReducer(
      state,
      setProfessionWithAttributeCleanup(state, catalogs, "secondary", catalogId<"Profession">(3))
    );

    expect(Number(next.build.secondaryProfessionId)).toBe(3);
    expect(
      next.build.skillBar.map((skillId) => (skillId === null ? null : Number(skillId)))
    ).toEqual([1, 316, 319, 331, 351, null, null, null]);
    expect(next.rawTemplate.skillBar[5]).toBeNull();
    expect(next.browser.filters.professionScope).toEqual({
      kind: "custom",
      professionIds: [catalogId<"Profession">(1), catalogId<"Profession">(3)]
    });
  });

  it("sets and resets structural title rank overrides without touching skill or equipment state", () => {
    const state = createBlankEditorState();
    const facts = {
      key: "title:lightbringer-rank",
      defaultKind: "coherent" as const,
      editableRanks: Array.from({ length: 13 }, (_, rank) => rank)
    };
    const lowered = editorReducer(state, {
      type: "set-title-rank-override",
      facts,
      rank: 4
    });
    const removedAtMax = editorReducer(lowered, {
      type: "set-title-rank-override",
      facts,
      rank: 12
    });
    const ignored = editorReducer(removedAtMax, {
      type: "set-title-rank-override",
      facts,
      rank: 13
    });

    expect(lowered.build.titleRankOverrides).toEqual([{ key: "title:lightbringer-rank", rank: 4 }]);
    expect(lowered.build.skillBar).toBe(state.build.skillBar);
    expect(removedAtMax.build.titleRankOverrides).toEqual([]);
    expect(ignored.build).toBe(removedAtMax.build);
  });
});
