import { describe, expect, it } from "vitest";

import {
  EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE,
  SKILL_TEMPLATE_PACKAGE_EXAMPLE,
  TEMPLATE_BARE_CODE_CHAR_LIMIT,
  TEMPLATE_INPUT_CHAR_LIMIT,
  formatTemplateChatCode,
  parseTemplateInput
} from "../../src/template-compatibility";

describe("chat-code wrappers", () => {
  it("parses bare skill and equipment codes by kind", () => {
    const skill = parseTemplateInput(SKILL_TEMPLATE_PACKAGE_EXAMPLE, "skill");
    const equipment = parseTemplateInput(EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE, "equipment");

    expect(skill.ok && skill.value).toMatchObject({
      inputKind: "bare",
      bareCode: SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      templateName: null,
      inferredKind: "skill"
    });
    expect(equipment.ok && equipment.value.inferredKind).toBe("equipment");
  });

  it("preserves safe wrapper names, including empty names", () => {
    const named = parseTemplateInput(`[My Cool Build;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]`, "skill");
    const empty = parseTemplateInput(`[;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]`, "skill");
    const formatted = formatTemplateChatCode(SKILL_TEMPLATE_PACKAGE_EXAMPLE, "", "skill");

    expect(named.ok && named.value.templateName).toBe("My Cool Build");
    expect(empty.ok && empty.value.templateName).toBe("");
    expect(formatted.ok && formatted.value).toBe(`[;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]`);
  });

  it("trims only outer ASCII whitespace and reports the normalization", () => {
    const parsed = parseTemplateInput(` \n${SKILL_TEMPLATE_PACKAGE_EXAMPLE}\t`, "skill");

    expect(parsed.ok && parsed.value.bareCode).toBe(SKILL_TEMPLATE_PACKAGE_EXAMPLE);
    expect(parsed.ok && parsed.diagnostics.map((entry) => entry.code)).toContain(
      "OUTER_ASCII_WHITESPACE_TRIMMED"
    );
  });

  it("rejects missing, nested, ambiguous, unsafe, and oversized wrappers", () => {
    const cases = [
      ["[name]", "INVALID_CHAT_WRAPPER"],
      [`[outer;[inner;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]]`, "INVALID_CHAT_WRAPPER"],
      [`[bad;name;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]`, "INVALID_CHAT_WRAPPER"],
      [`[bad\nname;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]`, "UNSAFE_TEMPLATE_NAME"],
      [`${SKILL_TEMPLATE_PACKAGE_EXAMPLE}\u00a0`, "INVALID_CHARACTER_SET"],
      ["A".repeat(TEMPLATE_INPUT_CHAR_LIMIT + 1), "INPUT_TOO_LARGE"],
      [`O${"A".repeat(TEMPLATE_BARE_CODE_CHAR_LIMIT)}`, "INPUT_TOO_LARGE"]
    ] as const;

    for (const [input, expectedError] of cases) {
      const result = parseTemplateInput(input, "skill");
      expect(result.ok ? null : result.error.code).toBe(expectedError);
    }
  });

  it("distinguishes cross-kind input from unsupported headers", () => {
    const wrongKind = parseTemplateInput(EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE, "skill");
    const unsupported = parseTemplateInput("AValidBase64Header", "skill");

    expect(wrongKind.ok ? null : wrongKind.error.code).toBe("WRONG_TEMPLATE_KIND");
    expect(unsupported.ok ? null : unsupported.error.code).toBe("UNSUPPORTED_VERSION");
  });
});
