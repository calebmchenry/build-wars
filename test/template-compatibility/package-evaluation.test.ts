import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  decodeEquipmentTemplate,
  decodeSkillTemplate,
  exportEquipmentTemplate,
  exportSkillTemplate
} from "../../src/template-compatibility";
import {
  decodeEquipmentTemplateBare,
  decodeSkillTemplateBare,
  EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE,
  encodeEquipmentTemplateBare,
  encodeSkillTemplateBare,
  GW_TEMPLATES_PACKAGE_VERSION,
  probePwndTemplateFeasibility,
  SKILL_TEMPLATE_PACKAGE_EXAMPLE
} from "../../src/template-compatibility/gw-templates-adapter";

describe("gw-templates package qualification", () => {
  it("pins the exact runtime dependency and records package metadata", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf-8")) as {
      dependencies?: Record<string, string>;
      engines?: Record<string, string>;
    };
    const lockfile = JSON.parse(readFileSync("package-lock.json", "utf-8")) as {
      packages: Record<
        string,
        {
          version?: string;
          license?: string;
          dependencies?: Record<string, string>;
          integrity?: string;
          engines?: Record<string, string>;
        }
      >;
    };
    const vendor = lockfile.packages["node_modules/@buildwars/gw-templates"];
    const windows1252 = lockfile.packages["node_modules/windows-1252"];

    expect(packageJson.dependencies?.["@buildwars/gw-templates"]).toBe(
      GW_TEMPLATES_PACKAGE_VERSION
    );
    expect(packageJson.engines?.node).toBe(">=22.11.0");
    expect(vendor?.version).toBe(GW_TEMPLATES_PACKAGE_VERSION);
    expect(vendor?.license).toBe("MIT");
    expect(vendor?.integrity).toMatch(/^sha512-/);
    expect(vendor?.dependencies?.["windows-1252"]).toBe("^3.0.4");
    expect(vendor?.engines).toBeUndefined();
    expect(windows1252?.version).toBe("3.0.4");
    expect(windows1252?.license).toBe("MIT");
  });

  it("proves mandatory skill decode and encode paths under the repo runtime", () => {
    const decoded = decodeSkillTemplateBare(SKILL_TEMPLATE_PACKAGE_EXAMPLE);
    expect(decoded.ok && decoded.value.primaryProfessionId).toBe(7);

    if (!decoded.ok) {
      throw new Error(decoded.error.message);
    }
    const encoded = encodeSkillTemplateBare(decoded.value);
    expect(encoded.ok).toBe(true);

    const publicDecoded = decodeSkillTemplate(SKILL_TEMPLATE_PACKAGE_EXAMPLE);
    if (!publicDecoded.ok) {
      throw new Error(publicDecoded.error.message);
    }
    const canonical = exportSkillTemplate(publicDecoded.value, { mode: "canonical" });
    expect(canonical.ok && canonical.value.fidelity).toBe("field-complete-normalized");
  });

  it("proves equipment decode and bounded canonical encode behavior", () => {
    const packageDecoded = decodeEquipmentTemplateBare(EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE);
    expect(packageDecoded.ok && packageDecoded.value.items).toHaveLength(6);

    if (!packageDecoded.ok) {
      throw new Error(packageDecoded.error.message);
    }
    const packageCanonical = encodeEquipmentTemplateBare(packageDecoded.value);
    expect(packageCanonical.ok ? packageCanonical.value : packageCanonical.error.code).toBe(
      "UNSUPPORTED_BY_CODEC"
    );

    const singleItemDecoded = decodeEquipmentTemplate("PkZwFP9FzSKA");
    if (!singleItemDecoded.ok) {
      throw new Error(singleItemDecoded.error.message);
    }
    const canonical = exportEquipmentTemplate(singleItemDecoded.value, { mode: "canonical" });
    expect(canonical.ok && canonical.value.fidelity).toBe("field-complete-normalized");
  });

  it("prevents public wrong-kind calls before dependency decode", () => {
    const skillAsEquipment = decodeEquipmentTemplate(SKILL_TEMPLATE_PACKAGE_EXAMPLE);
    const equipmentAsSkill = decodeSkillTemplate(EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE);

    expect(skillAsEquipment.ok ? null : skillAsEquipment.error.code).toBe("WRONG_TEMPLATE_KIND");
    expect(equipmentAsSkill.ok ? null : equipmentAsSkill.error.code).toBe("WRONG_TEMPLATE_KIND");
  });

  it("records paw-ned2 dependency failure as a deferral gate", () => {
    const result = probePwndTemplateFeasibility();

    expect(result.ok ? result.value.disposition : result.error.code).toBe("PAWNED2_DEFERRED");
    expect(result.ok ? "" : result.error.message).toContain("toBase64");
  });
});
