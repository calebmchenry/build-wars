import { describe, expect, it } from "vitest";

import { templateSkillId, type SkillTemplateDocument } from "../../src/domain";
import {
  decodeSkillTemplate,
  exportSkillTemplate,
  SKILL_TEMPLATE_PACKAGE_EXAMPLE
} from "../../src/template-compatibility";
import skillCases from "../fixtures/template-compatibility/skill-cases.json";

describe("skill template compatibility", () => {
  it("decodes supported skill fixtures into raw template facts", () => {
    for (const fixture of skillCases.valid) {
      const result = decodeSkillTemplate(fixture.input);
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      expect(result.value.kind).toBe("skill");
      expect(Number(result.value.primaryProfessionId)).toBe(fixture.expected.primaryProfessionId);
      expect(Number(result.value.secondaryProfessionId)).toBe(
        fixture.expected.secondaryProfessionId
      );
      expect(
        result.value.attributes.map((entry) => ({
          attributeId: Number(entry.attributeId),
          rank: entry.rank
        }))
      ).toEqual(fixture.expected.attributes);
      expect(result.value.skillIds.map(Number)).toEqual(fixture.expected.skillIds);
      expect(result.value.source.semanticFingerprint).toMatch(/^skill-template:v1:/);
    }
  });

  it("preserves wrapper names and exact-source replay independently", () => {
    const decoded = decodeSkillTemplate(`[Original Name;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]`);
    if (!decoded.ok) {
      throw new Error(decoded.error.message);
    }

    const replay = exportSkillTemplate(decoded.value, { templateName: "Renamed" });

    expect(replay.ok && replay.value).toMatchObject({
      code: `[Renamed;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]`,
      bareCode: SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      inputKind: "chat-code",
      templateName: "Renamed",
      fidelity: "exact-source"
    });
  });

  it("uses canonical encode only when decode-back equality proves the fields survived", () => {
    const decoded = decodeSkillTemplate(SKILL_TEMPLATE_PACKAGE_EXAMPLE);
    if (!decoded.ok) {
      throw new Error(decoded.error.message);
    }

    const canonical = exportSkillTemplate(decoded.value, { mode: "canonical" });

    expect(canonical.ok && canonical.value.bareCode).toBe("OwFj0xfzITOMMMHMie4O0kxZ6PAA");
    expect(canonical.ok && canonical.value.fidelity).toBe("field-complete-normalized");
  });

  it("refuses lossy canonical skill exports without returning a code", () => {
    const decoded = decodeSkillTemplate(SKILL_TEMPLATE_PACKAGE_EXAMPLE);
    if (!decoded.ok) {
      throw new Error(decoded.error.message);
    }

    const edited: SkillTemplateDocument = {
      ...decoded.value,
      skillIds: [
        templateSkillId(999999999),
        decoded.value.skillIds[1],
        decoded.value.skillIds[2],
        decoded.value.skillIds[3],
        decoded.value.skillIds[4],
        decoded.value.skillIds[5],
        decoded.value.skillIds[6],
        decoded.value.skillIds[7]
      ]
    };
    const result = exportSkillTemplate(edited, { mode: "canonical" });

    expect(result.ok ? result.value.code : result.error.code).toBe("LOSSY_ENCODE");
  });

  it("returns typed failures for invalid skill fixtures", () => {
    for (const fixture of skillCases.invalid) {
      const result = decodeSkillTemplate(fixture.input);
      expect(result.ok ? null : result.error.code).toBe(fixture.expectedError);
    }
  });
});
