import { describe, expect, it } from "vitest";

import {
  authoredDocumentId,
  calculateEffectiveAttributeRank,
  createEmptyEquipmentLoadout,
  validateBuild,
  type Build,
  type ProfessionAttributeValidationCatalog,
  type SkillValidationCatalog
} from "../../src/domain";
import { createBuildValidationContext } from "../../src/domain/validation-context";
import generatedProfessions from "../../data/generated/epic-03/professions-attributes.catalog.json";
import generatedSkills from "../../data/generated/epic-04/skills.catalog.json";
import {
  attributeIds,
  professionAttributeCatalog,
  professionIds,
  skillsCatalog,
  skillIds,
  withProfessionAttributeCatalog,
  withSkillCatalog
} from "../fixtures/rule-engine/catalogs";
import { buildFixture, malformedBuild, skillBar } from "../fixtures/rule-engine/builds";
import {
  equipmentInsigniaCatalog,
  equipmentRuneCatalog,
  equipmentWeaponCatalog,
  equipmentWeaponModifierCatalog
} from "../fixtures/rule-engine/equipment-catalogs";

describe("build validation context", () => {
  it("preserves authored IDs and catalog-version evidence", () => {
    const context = createBuildValidationContext({
      build: buildFixture(),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(context.primaryProfession.numericId).toBe(Number(professionIds.warrior));
    expect(context.secondaryProfession.numericId).toBe(Number(professionIds.mesmer));
    expect(context.attributeRows.map((row) => [row.index, row.numericId, row.rank])).toEqual([
      [0, 17, 0],
      [1, 18, 12],
      [2, 21, 8],
      [3, 2, 8]
    ]);
    expect(context.skillSlots.map((slot) => [slot.index, slot.numericId])).toEqual([
      [0, 100],
      [1, 101],
      [2, 102],
      [3, 104],
      [4, 114],
      [5, 120],
      [6, 121],
      [7, 122]
    ]);
    expect(context.catalogVersions).toEqual({
      buildCatalogVersion: "fixture-build-v1",
      professionAttributeCatalogVersion: "fixture-pa-v1",
      skillCatalogVersion: "fixture-skills-v1",
      ruleEngineVersion: "rule-engine:v2"
    });
  });

  it("preserves optional equipment catalog indexes and version evidence", () => {
    const context = createBuildValidationContext({
      build: buildFixture({ equipment: createEmptyEquipmentLoadout() }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog,
      equipmentCatalogs: {
        runes: equipmentRuneCatalog,
        insignias: equipmentInsigniaCatalog,
        weapons: equipmentWeaponCatalog,
        weaponModifiers: equipmentWeaponModifierCatalog
      }
    });

    expect(context.equipmentIndexes.runes?.recordsById.size).toBe(
      equipmentRuneCatalog.records.length
    );
    expect(context.equipmentIndexes.weaponModifiers?.recordsById.size).toBe(
      equipmentWeaponModifierCatalog.records.length
    );
    expect(context.catalogVersions).toMatchObject({
      runeCatalogVersion: "fixture-runes-v1",
      insigniaCatalogVersion: "fixture-insignias-v1",
      weaponCatalogVersion: "fixture-weapons-v1",
      weaponModifierCatalogVersion: "fixture-weapon-mods-v1",
      weaponCatalogSetVersion: "fixture-weapon-set-v1",
      weaponModifierCatalogSetDigest: "fixture-weapon-set-digest"
    });
  });

  it("excludes duplicate catalog IDs from resolved lookup behavior", () => {
    const duplicateProfessionCatalog = withProfessionAttributeCatalog({
      professions: [
        ...professionAttributeCatalog.professions,
        { ...professionAttributeCatalog.professions[0]!, name: "Duplicate Warrior" }
      ]
    });
    const result = validateBuild({
      build: buildFixture(),
      professionAttributes: duplicateProfessionCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual([
      "catalog.profession-duplicate-id",
      "profession.primary-unresolved"
    ]);
    expect(result.resolved).toBe(false);
  });

  it("resolves auto, explicit-level, explicit-point, and unresolved budgets", () => {
    expect(
      createBuildValidationContext({
        build: buildFixture({ mode: "pve" }),
        professionAttributes: professionAttributeCatalog,
        skills: skillsCatalog
      }).budget
    ).toEqual({ kind: "resolved", policy: "auto-pve-level-20", points: 200 });

    expect(
      createBuildValidationContext({
        build: buildFixture({ mode: "pvp" }),
        professionAttributes: professionAttributeCatalog,
        skills: skillsCatalog
      }).budget
    ).toEqual({ kind: "unresolved", reason: "auto budget requires a PvE build mode" });

    expect(
      createBuildValidationContext({
        build: buildFixture(),
        professionAttributes: professionAttributeCatalog,
        skills: skillsCatalog,
        options: { attributeBudget: { kind: "level", level: 20, questBonus: "none" } }
      }).budget
    ).toEqual({ kind: "resolved", policy: "explicit-level", points: 170 });

    expect(
      createBuildValidationContext({
        build: buildFixture(),
        professionAttributes: professionAttributeCatalog,
        skills: skillsCatalog,
        options: { attributeBudget: { kind: "points", points: 20 } }
      }).budget
    ).toEqual({ kind: "resolved", policy: "explicit-points", points: 20 });
  });

  it("returns structured issues for malformed runtime shapes and unsupported options", () => {
    const result = validateBuild({
      build: malformedBuild({
        mode: "invalid",
        attributes: [{ attributeId: attributeIds.tactics, rank: Number.NaN }],
        skillBar: [
          skillIds.healingSignet,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.pveOnlyOne,
          skillIds.pveOnlyTwo,
          skillIds.pveOnlyThree,
          skillIds.pveOnlyFour,
          skillIds.unknown
        ]
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog,
      options: {
        profile: "strict" as never,
        attributeBudget: { kind: "points", points: -1 },
        maxIssues: 4
      }
    });

    expect(result.valid).toBe(false);
    expect(result.exhaustive).toBe(false);
    expect(result.truncation).toEqual({ kind: "issue-cap", limit: 4, observed: 9, path: [] });
    expect(codes(result)).toEqual([
      "build.unsupported-mode",
      "option.unsupported",
      "option.unsupported",
      "skill-bar.malformed"
    ]);
  });

  it("caps attribute traversal and keeps the result non-exhaustive", () => {
    const result = validateBuild({
      build: buildFixture({
        attributes: [
          { attributeId: attributeIds.tactics, rank: 0 },
          { attributeId: attributeIds.axeMastery, rank: 0 },
          { attributeId: attributeIds.domination, rank: 0 }
        ]
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog,
      options: { maxAttributeRows: 2 }
    });

    expect(result.truncation).toEqual({
      kind: "attribute-row-cap",
      limit: 2,
      observed: 3,
      path: ["attributes"]
    });
    expect(result.exhaustive).toBe(false);
  });

  it("proves checked-in generated runtime catalogs satisfy narrow validation inputs", () => {
    const build: Build = {
      id: authoredDocumentId("generated-smoke"),
      schemaVersion: 1,
      catalogVersion: "generated-smoke",
      name: "Generated Smoke",
      mode: "pve",
      primaryProfessionId: professionIds.warrior,
      secondaryProfessionId: professionIds.mesmer,
      attributes: [{ attributeId: attributeIds.tactics, rank: 0 }],
      skillBar: skillBar(skillIds.healingSignet),
      equipment: null
    };
    const context = createBuildValidationContext({
      build,
      professionAttributes: generatedProfessions as unknown as ProfessionAttributeValidationCatalog,
      skills: generatedSkills as unknown as SkillValidationCatalog
    });

    expect(context.catalogVersions.professionAttributeCatalogVersion).toBe("pa-e5d0d35ad8f30b4c");
    expect(context.catalogVersions.skillCatalogVersion).toBe("skills-f3bb1c6da9b0b761");
    expect(context.primaryProfession.lookup.kind).toBe("resolved");
    expect(context.attributeRows[0]?.lookup.kind).toBe("resolved");
    expect(context.skillSlots[0]?.lookup.kind).toBe("resolved");
  });

  it("does not mutate frozen builds, catalogs, options, or rank adjustment arrays", () => {
    const build = deepFreeze(buildFixture());
    const professionAttributes = deepFreeze(professionAttributeCatalog);
    const skills = deepFreeze(skillsCatalog);
    const options = deepFreeze({ attributeBudget: { kind: "auto" as const } });
    const adjustments = deepFreeze([
      { kind: "rune" as const, amount: 1, sourceId: "rune:minor" },
      { kind: "headgear" as const, amount: 1, sourceId: "headgear" }
    ]);
    const before = JSON.stringify({ build, professionAttributes, skills, options, adjustments });

    validateBuild({ build, professionAttributes, skills, options });
    calculateEffectiveAttributeRank({
      build,
      professionAttributes,
      attributeId: attributeIds.tactics,
      adjustments
    });

    expect(JSON.stringify({ build, professionAttributes, skills, options, adjustments })).toBe(
      before
    );
  });

  it("serializes stably across repeated calls and catalog reordering", () => {
    const input = {
      build: buildFixture({
        skillBar: skillBar(skillIds.energySurge, skillIds.powerBlock, skillIds.healingSignet)
      }),
      professionAttributes: withProfessionAttributeCatalog({
        professions: [...professionAttributeCatalog.professions].reverse(),
        attributes: [...professionAttributeCatalog.attributes].reverse()
      }),
      skills: withSkillCatalog({
        skills: [...skillsCatalog.skills].reverse(),
        splitGroups: [...skillsCatalog.splitGroups].reverse()
      })
    };

    expect(JSON.stringify(validateBuild(input))).toBe(JSON.stringify(validateBuild(input)));
  });
});

function codes(result: ReturnType<typeof validateBuild>): readonly string[] {
  return result.issues.map((issue) => issue.code);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) {
    return value;
  }
  Object.freeze(value);
  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  return value;
}
