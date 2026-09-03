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
    expect(catalogs.versions.runes).toMatch(/^runes-/);
    expect(catalogs.versions.insignias).toMatch(/^insignias-/);
    expect(catalogs.versions.weapons).toMatch(/^weapons-/);
    expect(catalogs.equipment.readiness.runes.status).toBe("ready");
    expect(catalogs.equipment.readiness.insignias.status).toBe("ready");
    expect(catalogs.equipment.readiness.weapons.status).toBe("ready");
    expect(catalogs.equipment.readiness.weaponModifiers.status).toBe("ready");
    expect(catalogs.equipment.runes.length).toBeGreaterThan(100);
    expect(catalogs.equipment.insignias.length).toBeGreaterThan(40);
    expect(catalogs.equipment.weapons.length).toBeGreaterThan(0);
    expect(catalogs.attribution.sourceLinks.length).toBeGreaterThan(0);
    expect(catalogs.validation.professionAttributes.attributePointRules.purchasedRankCosts).toEqual(
      catalogs.professionAttributeCatalog.attributePointRules.purchasedRankCosts
    );
  });

  it("uses stable placeholder descriptors without remote render URLs", () => {
    const catalogs = requireReadyCatalogs();
    const profession = catalogs.placeholders.profession(catalogs.professions[0] ?? null);
    const skillRecord = catalogs.skills.find((candidate) => candidate.name === "Power Block");
    const skill = catalogs.placeholders.skill(skillRecord ?? null, "skill-browser");

    expect(profession.label).toBe("Warrior icon");
    expect(profession.mediaId).toMatch(/^remote-media:/);
    expect(profession.asset?.src).toContain("profession-warrior-60");
    expect(skill.label).toContain("Power Block");
    expect(skill.asset?.src ?? "").not.toMatch(/^https?:\/\//);
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

  it("degrades invalid equipment slices without rejecting core app catalogs", () => {
    const result = loadAppCatalogs({
      runes: { profile: { id: "wrong" } },
      weaponModifiers: { profile: { id: "wrong" } }
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      return;
    }
    expect(result.catalogs.equipment.readiness.runes.status).toBe("error");
    expect(result.catalogs.equipment.readiness.weaponModifiers.status).toBe("error");
    expect(result.catalogs.equipment.readiness.insignias.status).toBe("ready");
    expect(result.catalogs.equipment.readiness.weapons.status).toBe("ready");
    expect(result.catalogs.equipment.validation.runes).toBeUndefined();
    expect(result.catalogs.equipment.validation.weaponModifiers).toBeUndefined();
    expect(result.catalogs.equipment.insignias.length).toBeGreaterThan(0);
  });
});
