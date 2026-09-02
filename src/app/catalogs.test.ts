import { describe, expect, it } from "vitest";

import { loadAppCatalogs, promotedAppCatalogs, requireReadyCatalogs } from "./catalogs";

describe("app catalog boundary", () => {
  it("adapts the promoted catalogs into app-ready views", () => {
    const catalogs = requireReadyCatalogs();

    expect(promotedAppCatalogs.status).toBe("ready");
    expect(catalogs.professions).toHaveLength(10);
    expect(catalogs.skills.length).toBeGreaterThan(2900);
    expect(catalogs.versions.professionAttributes).toMatch(/^pa-/);
    expect(catalogs.versions.skills).toMatch(/^skills-/);
    expect(catalogs.attribution.sourceLinks.length).toBeGreaterThan(0);
    expect(catalogs.validation.professionAttributes.attributePointRules.purchasedRankCosts).toEqual(
      catalogs.professionAttributeCatalog.attributePointRules.purchasedRankCosts
    );
  });

  it("uses stable placeholder descriptors without remote render URLs", () => {
    const catalogs = requireReadyCatalogs();
    const profession = catalogs.placeholders.profession(catalogs.professions[0] ?? null);
    const skill = catalogs.placeholders.skill(catalogs.skills[0] ?? null, "skill-browser");

    expect(profession.label).toContain("placeholder");
    expect(profession.mediaId).toMatch(/^remote-media:/);
    expect(skill.label).toContain("placeholder");
    expect(skill).not.toHaveProperty("url");
  });

  it("reports product-owned catalog adaptation errors", () => {
    const result = loadAppCatalogs({
      professionAttributes: { profile: { id: "wrong" } },
      skills: { profile: { id: "wrong" } }
    });

    expect(result.status).toBe("error");
    expect(result.status === "error" ? result.error.issues.length : 0).toBeGreaterThan(0);
  });
});
