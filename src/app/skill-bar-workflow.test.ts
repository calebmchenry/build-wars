import { describe, expect, it } from "vitest";

import { catalogId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { createRawOverlayEntry, type EditorState } from "./editor-state";
import { playableEditorFixture } from "./editor-fixtures";
import { planSkillBarWorkflow } from "./skill-bar-workflow";

const catalogs = requireReadyCatalogs();

describe("skill bar workflow", () => {
  it("moves an existing catalog skill when placing the same skill in another slot", () => {
    const state = playableEditorFixture();
    const result = planSkillBarWorkflow(state, catalogs, {
      kind: "catalog-skill",
      skillId: state.build.skillBar[0]!,
      toIndex: 2
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.plan.skillBar[0]).toBeNull();
    expect(result.plan.skillBar[2]).toBe(state.build.skillBar[0]);
    expect(result.plan.rawSkillBar[0]).toBeNull();
  });

  it("replaces occupied slots and clears the other resolved elite atomically", () => {
    const [eliteOne, eliteTwo] = catalogs.skills.filter((skill) => skill.classification.elite);
    if (eliteOne === undefined || eliteTwo === undefined) {
      throw new Error("elite fixture skills missing");
    }
    const state: EditorState = {
      ...playableEditorFixture(),
      build: {
        ...playableEditorFixture().build,
        skillBar: [eliteOne.id, catalogId<"Skill">(1), null, null, null, null, null, null]
      }
    };

    const result = planSkillBarWorkflow(state, catalogs, {
      kind: "catalog-skill",
      skillId: eliteTwo.id,
      toIndex: 1
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.plan.skillBar[0]).toBeNull();
    expect(result.plan.skillBar[1]).toBe(eliteTwo.id);
    expect(result.plan.announcement).toContain("Removed other elite slot 1");
  });

  it("moves and swaps bar slots with raw overlays preserved", () => {
    const state: EditorState = {
      ...playableEditorFixture(),
      build: {
        ...playableEditorFixture().build,
        skillBar: [
          catalogId<"Skill">(-200001),
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
        ...playableEditorFixture().rawTemplate,
        skillBar: [
          createRawOverlayEntry({
            namespace: "skill",
            templateId: 999999,
            catalogId: null,
            outcomeKind: "unknown",
            label: "Unknown skill 999999"
          }),
          null,
          null,
          null,
          null,
          null,
          null,
          null
        ]
      }
    };

    const moved = planSkillBarWorkflow(state, catalogs, {
      kind: "bar-slot",
      fromIndex: 0,
      toIndex: 2
    });
    expect(moved.ok).toBe(true);
    if (!moved.ok) {
      return;
    }
    expect(Number(moved.plan.skillBar[2])).toBe(-200001);
    expect(moved.plan.rawSkillBar[2]?.templateId).toBe(999999);

    const swapped = planSkillBarWorkflow(
      {
        ...state,
        build: { ...state.build, skillBar: moved.plan.skillBar },
        rawTemplate: { ...state.rawTemplate, skillBar: moved.plan.rawSkillBar }
      },
      catalogs,
      { kind: "bar-slot", fromIndex: 1, toIndex: 2 }
    );
    expect(swapped.ok).toBe(true);
    if (!swapped.ok) {
      return;
    }
    expect(Number(swapped.plan.skillBar[1])).toBe(-200001);
    expect(swapped.plan.rawSkillBar[1]?.templateId).toBe(999999);
  });

  it("rejects stale catalog payloads and invalid slot indexes", () => {
    expect(
      planSkillBarWorkflow(playableEditorFixture(), catalogs, {
        kind: "catalog-skill",
        skillId: catalogId<"Skill">(-1),
        toIndex: 0
      }).ok
    ).toBe(false);
    expect(
      planSkillBarWorkflow(playableEditorFixture(), catalogs, {
        kind: "bar-slot",
        fromIndex: 99,
        toIndex: 0
      }).ok
    ).toBe(false);
  });
});
