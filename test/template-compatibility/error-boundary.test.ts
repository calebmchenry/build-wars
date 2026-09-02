import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { templateSkillId, type SkillTemplateDocument } from "../../src/domain";
import {
  decodeSkillTemplate,
  exportSkillTemplate,
  SKILL_TEMPLATE_PACKAGE_EXAMPLE
} from "../../src/template-compatibility";
import { probePwndTemplateFeasibility } from "../../src/template-compatibility/gw-templates-adapter";

describe("template compatibility error boundary", () => {
  it("returns bounded typed failures without leaking dependency objects or stacks", () => {
    const result = decodeSkillTemplate("not-a-code");

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected malformed input to fail");
    }

    expect(Object.keys(result.error).sort()).toEqual([
      "code",
      "expectedTemplateKind",
      "fieldPath",
      "message",
      "operation",
      "stage"
    ]);
    expect(result.error.code).toBe("INVALID_CHARACTER_SET");
    expect(JSON.stringify(result.error)).not.toContain("node_modules");
    expect(JSON.stringify(result.error)).not.toContain("Error:");
  });

  it("refuses preserve-source export after a semantic edit", () => {
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
    const result = exportSkillTemplate(edited, { mode: "preserve-source" });

    expect(result.ok ? null : result.error.code).toBe("SOURCE_CHANGED");
  });

  it("keeps the vendor import isolated to the adapter", () => {
    const sourceFiles = listSourceFiles("src");
    const importOffenders = sourceFiles.filter((file) => {
      if (file === "src/template-compatibility/gw-templates-adapter.ts") {
        return false;
      }
      return /from\s+["']@buildwars\/gw-templates["']/.test(readFileSync(file, "utf-8"));
    });
    const domainCompatImports = sourceFiles.filter(
      (file) =>
        file.startsWith("src/domain/") && /template-compatibility/.test(readFileSync(file, "utf-8"))
    );

    expect(importOffenders).toEqual([]);
    expect(domainCompatImports).toEqual([]);
  });

  it("records paw-ned2 as deferred without exporting a public team codec", () => {
    const probe = probePwndTemplateFeasibility();
    const publicApi = readFileSync("src/template-compatibility/index.ts", "utf-8");

    expect(probe.ok ? probe.value.disposition : probe.error.code).toBe("PAWNED2_DEFERRED");
    expect(publicApi).not.toContain("Pwnd");
    expect(publicApi).not.toContain("pawned");
  });
});

function listSourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      return listSourceFiles(path);
    }
    return path.endsWith(".ts") || path.endsWith(".tsx") ? [relative(".", path)] : [];
  });
}
