import { describe, expect, it } from "vitest";

import { skillTypeIdFromLabel, skillTypeMatches } from "../../src/domain";

describe("skill type taxonomy", () => {
  it("normalizes source labels into canonical type IDs", () => {
    expect(skillTypeIdFromLabel("Off-Hand Attack")).toBe("off-hand-attack");
    expect(skillTypeIdFromLabel("off hand attack")).toBe("off-hand-attack");
    expect(skillTypeIdFromLabel("Flash Enchantment Spell")).toBe("flash-enchantment-spell");
    expect(skillTypeIdFromLabel("unknown type")).toBeNull();
  });

  it("matches parents while keeping exact Skill separate", () => {
    expect(skillTypeMatches("axe-attack", "attack")).toBe(true);
    expect(skillTypeMatches("lead-attack", "dagger-attack")).toBe(true);
    expect(skillTypeMatches("lead-attack", "melee-attack")).toBe(true);
    expect(skillTypeMatches("touch-hex-spell", "touch")).toBe(true);
    expect(skillTypeMatches("touch-signet", "touch")).toBe(true);
    expect(skillTypeMatches("touch-skill", "skill")).toBe(false);
    expect(skillTypeMatches("skill", "base-skill")).toBe(true);
  });
});
