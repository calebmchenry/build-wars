import { describe, expect, it } from "vitest";

import { skillActionIconForType } from "./skill-icons";

describe("skill icon semantics", () => {
  it("maps Guild Wars action skill types to stable local icon kinds", () => {
    expect(skillActionIconForType("Axe Attack").kind).toBe("attack");
    expect(skillActionIconForType("Enchantment Spell").kind).toBe("enchantment");
    expect(skillActionIconForType("Hex Spell").kind).toBe("hex");
    expect(skillActionIconForType("Signet").kind).toBe("signet");
    expect(skillActionIconForType("Touch Skill").kind).toBe("touch");
    expect(skillActionIconForType("Unknown").kind).toBe("unknown");
  });
});
