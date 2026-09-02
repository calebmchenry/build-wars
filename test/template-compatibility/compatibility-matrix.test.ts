import { describe, expect, it } from "vitest";

import {
  decodeEquipmentTemplate,
  decodeSkillTemplate,
  exportEquipmentTemplate,
  exportSkillTemplate
} from "../../src/template-compatibility";
import { probePwndTemplateFeasibility } from "../../src/template-compatibility/gw-templates-adapter";
import equipmentCases from "../fixtures/template-compatibility/equipment-cases.json";
import pwndCases from "../fixtures/template-compatibility/pwnd-cases.json";
import skillCases from "../fixtures/template-compatibility/skill-cases.json";

describe("template compatibility matrix", () => {
  it("round-trips valid skill vectors through exact replay", () => {
    for (const fixture of skillCases.valid) {
      const decoded = decodeSkillTemplate(fixture.input);
      if (!decoded.ok) {
        throw new Error(decoded.error.message);
      }
      const exported = exportSkillTemplate(decoded.value);

      expect(exported.ok && exported.value.bareCode).toBe(fixture.input);
      expect(exported.ok && exported.value.fidelity).toBe("exact-source");
    }
  });

  it("round-trips valid equipment vectors through exact replay", () => {
    for (const fixture of equipmentCases.valid) {
      const decoded = decodeEquipmentTemplate(fixture.input);
      if (!decoded.ok) {
        throw new Error(decoded.error.message);
      }
      const exported = exportEquipmentTemplate(decoded.value);

      expect(exported.ok && exported.value.bareCode).toBe(fixture.input);
      expect(exported.ok && exported.value.fidelity).toBe("exact-source");
    }
  });

  it("keeps invalid vector errors stable", () => {
    for (const fixture of skillCases.invalid) {
      const result = decodeSkillTemplate(fixture.input);

      expect(result.ok ? null : result.error.code).toBe(fixture.expectedError);
    }
    for (const fixture of equipmentCases.invalid) {
      const result = decodeEquipmentTemplate(fixture.input);

      expect(result.ok ? null : result.error.code).toBe(fixture.expectedError);
    }
  });

  it("records the deterministic paw-ned2 defer outcome", () => {
    const probe = probePwndTemplateFeasibility();

    expect(pwndCases.disposition).toBe("deferred");
    expect(probe.ok ? probe.value.disposition : probe.error.code).toBe(pwndCases.expectedError);
  });
});
