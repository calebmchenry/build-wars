import { describe, expect, it } from "vitest";

import generatedSkillIconManifest from "./skill-icon-assets.generated.json";
import { requireReadyCatalogs } from "./catalogs";
import { localSkillIconAsset } from "./icon-assets";

describe("generated skill icon assets", () => {
  it("keeps runtime icon paths local and maps broad skill coverage by skill id", () => {
    const encoded = JSON.stringify(generatedSkillIconManifest);

    expect(encoded).not.toMatch(/https?:\/\//);
    expect(generatedSkillIconManifest.summary.runtimeSkillIconCount).toBeGreaterThan(2000);

    const catalogs = requireReadyCatalogs();
    const powerBlock = catalogs.skills.find((skill) => skill.name === "Power Block");
    const asset = localSkillIconAsset(powerBlock ?? null);

    expect(asset?.src).toContain("/gww-icons/skills/power-block");
    expect(asset?.src).not.toMatch(/^https?:\/\//);
  });
});
