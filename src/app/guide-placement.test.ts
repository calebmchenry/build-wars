import { describe, expect, it } from "vitest";
import { catalogId } from "../domain";
import { guideBuilds } from "../domain/guide";
import { requireReadyCatalogs } from "./catalogs";
import { createGuideFixture } from "./guide-fixture";
import { captureGuideSkill, planGuidePlacement, readGuideSkillPayload } from "./guide-placement";
import { createRuntimeGuide, guideAddress, reduceGuide } from "./guide-state";
const catalogs = requireReadyCatalogs();
function fixture() {
  let state = createRuntimeGuide(createGuideFixture(), "placement");
  state = reduceGuide(
    state,
    { ...guideAddress(state), type: "duplicate-build", buildId: "gb-flare", id: "other" },
    catalogs
  );
  return state;
}
describe("guide placement identity and isolation", () => {
  it("copies to an inactive build with target duplicate rules, moves same-bar raw facts, and creates one commit", () => {
    let state = fixture();
    const before = guideBuilds(state.history.frame.document);
    const payload = captureGuideSkill(state, { kind: "bar", buildId: "gb-flare", index: 0 })!;
    const plan = planGuidePlacement(state, payload, catalogs, {
      kind: "slot",
      buildId: "other",
      index: 7
    });
    expect(plan.kind).toBe("slot");
    if (plan.kind !== "slot") throw Error("fixture");
    const historyLength = state.history.past.length;
    state = reduceGuide(
      state,
      { ...guideAddress(state), type: "build", buildId: plan.buildId, action: plan.action },
      catalogs
    );
    const after = guideBuilds(state.history.frame.document);
    expect(after[0]).toEqual(before[0]);
    expect(after[1]!.snapshot.build.skillBar[0]).toBeNull();
    expect(after[1]!.snapshot.build.skillBar[7]).toBe(194);
    expect(state.history.past).toHaveLength(historyLength + 1);
    expect(
      planGuidePlacement(state, payload, catalogs, { kind: "slot", buildId: "gb-flare", index: 0 })
        .kind
    ).toBe("unchanged");
    const swapped = planGuidePlacement(
      state,
      captureGuideSkill(state, { kind: "bar", buildId: "other", index: 7 }),
      catalogs,
      { kind: "slot", buildId: "other", index: 0 }
    );
    expect(swapped.kind).toBe("slot");
  });
  it("binds a bar reference to its source and makes catalog references generic irrespective of professions", () => {
    const state = fixture();
    const source = guideBuilds(state.history.frame.document)[0]!;
    const bound = planGuidePlacement(
      state,
      captureGuideSkill(state, { kind: "bar", buildId: source.id, index: 0 }),
      catalogs,
      { kind: "prose" }
    );
    expect(bound).toMatchObject({
      kind: "mention",
      node: { skillId: "catalog:skill:194", context: { kind: "local", buildId: source.id } }
    });
    const warrior = catalogs.skills.find((skill) => Number(skill.professionId) === 1)!;
    expect(
      planGuidePlacement(
        state,
        captureGuideSkill(state, { kind: "catalog", skillId: warrior.id }),
        catalogs,
        { kind: "prose" }
      )
    ).toMatchObject({ kind: "mention", node: { context: { kind: "generic" } } });
    expect(guideBuilds(state.history.frame.document)[0]).toBe(source);
  });
  it("preserves unresolved raw-only slots for same-bar moves and refuses guessed cross-bar/prose identities", () => {
    const doc = createGuideFixture();
    const build = guideBuilds(doc)[0]!;
    const raw = {
      namespace: "skill" as const,
      templateId: 99999,
      catalogId: null,
      outcomeKind: "unknown" as const,
      label: "Unknown skill",
      reason: "Catalog missing"
    };
    const snapshot = {
      ...build.snapshot,
      rawTemplate: {
        ...build.snapshot.rawTemplate,
        skillBar: [raw, null, null, null, null, null, null, null] as const
      },
      build: {
        ...build.snapshot.build,
        skillBar: [null, null, null, null, null, null, null, null] as const
      }
    };
    const state = {
      ...fixture(),
      history: {
        ...fixture().history,
        frame: {
          ...fixture().history.frame,
          document: {
            ...doc,
            nodes: [{ ...build, snapshot }, guideBuilds(fixture().history.frame.document)[1]!]
          }
        }
      }
    };
    const payload = captureGuideSkill(state, { kind: "bar", buildId: build.id, index: 0 });
    const move = planGuidePlacement(state, payload, catalogs, {
      kind: "slot",
      buildId: build.id,
      index: 6
    });
    expect(move.kind).toBe("slot");
    if (move.kind !== "slot" || move.action.type !== "apply-skill-bar-plan") throw Error("fixture");
    expect(move.action.rawSkillBar[6]).toEqual(raw);
    expect(move.action.rawSkillBar[0]).toBeNull();
    expect(planGuidePlacement(state, payload, catalogs, { kind: "prose" }).kind).toBe("rejected");
    expect(
      planGuidePlacement(state, payload, catalogs, { kind: "slot", buildId: "other", index: 4 })
        .kind
    ).toBe("rejected");
  });
  it("allows reorder with stable facts but rejects edited, deleted, undo-replaced, switched and malformed sources", () => {
    const state = fixture();
    const payload = captureGuideSkill(state, { kind: "bar", buildId: "gb-flare", index: 0 })!;
    const reorder = reduceGuide(state, {
      ...guideAddress(state),
      type: "move-build",
      buildId: "gb-flare",
      direction: 1
    });
    expect(planGuidePlacement(reorder, payload, catalogs, { kind: "prose" }).kind).toBe("mention");
    const changed = reduceGuide(
      state,
      {
        ...guideAddress(state),
        type: "build",
        buildId: "gb-flare",
        action: { type: "place-skill", slotIndex: 0, skillId: catalogId<"Skill">(195) }
      },
      catalogs
    );
    const deleted = reduceGuide(state, {
      ...guideAddress(state),
      type: "delete-build",
      buildId: "gb-flare",
      retainUnresolved: true
    });
    const undone = reduceGuide(reorder, {
      ...guideAddress(reorder),
      type: "history",
      direction: "undo"
    });
    for (const current of [
      changed,
      deleted,
      undone,
      createRuntimeGuide(state.history.frame.document, "different"),
      { ...state, composing: true }
    ])
      expect(planGuidePlacement(current, payload, catalogs, { kind: "prose" }).kind).toBe(
        "rejected"
      );
    for (const raw of [
      "{}",
      "[]",
      JSON.stringify({ ...payload, version: 2 }),
      JSON.stringify({ ...payload, extra: true }),
      JSON.stringify({ ...payload, source: { ...payload.source, index: 8 } }),
      '{"version":1,"version":1}'
    ])
      expect(readGuideSkillPayload(raw)).toBeNull();
    expect(readGuideSkillPayload(JSON.stringify(payload))).toEqual(payload);
    expect(
      planGuidePlacement(state, payload, catalogs, { kind: "slot", buildId: "gone", index: 0 }).kind
    ).toBe("rejected");
  });
});
