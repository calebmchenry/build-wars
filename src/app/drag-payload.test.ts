import { describe, expect, it } from "vitest";

import { catalogId } from "../domain";
import { browserSkillDragPayload, parseDragPayload, slotDragPayload } from "./drag-payload";

describe("drag payloads", () => {
  it("round-trips strict internal browser skill and slot payloads", () => {
    expect(parseDragPayload(browserSkillDragPayload(catalogId<"Skill">(1)))).toEqual({
      kind: "browser-skill",
      skillId: 1
    });
    expect(parseDragPayload(slotDragPayload(3))).toEqual({ kind: "skill-slot", slotIndex: 3 });
  });

  it("rejects malformed, foreign, and over-broad payload objects", () => {
    expect(parseDragPayload("not-json")).toBeNull();
    expect(
      parseDragPayload(JSON.stringify({ kind: "browser-skill", skillId: 1, url: "/" }))
    ).toBeNull();
    expect(parseDragPayload(JSON.stringify({ kind: "skill-slot", slotIndex: 1.2 }))).toBeNull();
    expect(parseDragPayload(JSON.stringify({ kind: "other", skillId: 1 }))).toBeNull();
  });
});
