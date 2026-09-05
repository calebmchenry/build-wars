import { describe, expect, it } from "vitest";

import skillCatalog from "../../data/generated/epic-04/skills.catalog.json";
import skillMetadataOverlay from "../../src/domain/skill-metadata-overlay.json";
import {
  createSkillMetadataIndex,
  SKILL_METADATA_OVERLAY_KIND,
  SKILL_METADATA_OVERLAY_SCHEMA_VERSION,
  skillMetadataTokensForSkill,
  type CatalogSkillRecord,
  type SkillMetadataToken
} from "../../src/domain";

const skills = skillCatalog.skills as unknown as readonly CatalogSkillRecord[];

describe("skill metadata", () => {
  it("uses authored metadata and expands broad parent tokens", () => {
    const index = createSkillMetadataIndex(
      overlay([
        ["Body Blow", ["applies:deep_wound", "deals:damage"]],
        ["Immolate", ["applies:burning", "deals:fire"]],
        ["Shatter Enchantment", ["removes:enchantment", "deals:damage"]]
      ]),
      skills
    );

    expect(index.errors).toEqual([]);
    expect(index.warnings).toEqual([]);
    expect(skillMetadataTokensForSkill(skillByName("Body Blow"), index)).toEqual(
      expect.arrayContaining(["applies:deep_wound", "applies:condition", "deals:damage"])
    );
    expect(skillMetadataTokensForSkill(skillByName("Body Blow"), index)).not.toContain(
      "applies:cracked_armor"
    );
    expect(skillMetadataTokensForSkill(skillByName("Immolate"), index)).toEqual(
      expect.arrayContaining(["applies:burning", "applies:condition", "deals:fire", "deals:damage"])
    );
    expect(skillMetadataTokensForSkill(skillByName("Shatter Enchantment"), index)).toEqual(
      expect.arrayContaining(["removes:enchantment", "deals:damage"])
    );
  });

  it("treats an empty authored overlay as no metadata", () => {
    const index = createSkillMetadataIndex(overlay([]), skills);

    expect(index.errors).toEqual([]);
    expect(skillMetadataTokensForSkill(skillByName("Immolate"), index)).toEqual([]);
  });

  it("indexes promoted authored metadata for representative tricky skills", () => {
    const index = createSkillMetadataIndex(skillMetadataOverlay, skills);

    expect(index.errors).toEqual([]);
    expect(index.warnings).toEqual([]);
    expect(skillMetadataTokensForSkill(skillByName("Body Blow"), index)).toEqual(
      expect.arrayContaining(["applies:deep_wound", "applies:condition", "deals:damage"])
    );
    expect(skillMetadataTokensForSkill(skillByName("Body Blow"), index)).not.toContain(
      "applies:cracked_armor"
    );
    expect(skillMetadataTokensForSkill(skillByName("Antidote Signet"), index)).toContain(
      "removes:condition"
    );
    expect(skillMetadataTokensForSkill(skillByName("Inspired Hex"), index)).toContain(
      "removes:hex"
    );
    expect(skillMetadataTokensForSkill(skillByName("Immolate"), index)).toEqual(
      expect.arrayContaining(["deals:fire", "deals:damage"])
    );
    expect(skillMetadataTokensForSkill(skillByName("Demonic Flesh"), index)).toEqual(
      expect.arrayContaining(["deals:shadow", "deals:damage"])
    );
    expect(skillMetadataTokensForSkill(skillByName("Avatar of Lyssa"), index)).toEqual(
      expect.arrayContaining(["deals:chaos", "deals:damage"])
    );
  });

  it("rejects unsupported metadata tokens", () => {
    const index = createSkillMetadataIndex(
      {
        schemaVersion: SKILL_METADATA_OVERLAY_SCHEMA_VERSION,
        kind: SKILL_METADATA_OVERLAY_KIND,
        records: [
          {
            ...recordForSkill("Body Blow", []),
            metadata: ["applies:cracked_armor", "applies:body_slam"]
          }
        ]
      },
      skills
    );

    expect(index.errors.map((issue) => issue.code)).toContain("metadata-token-invalid");
    expect(index.recordsBySkillId.size).toBe(0);
  });

  it("skips stale records without applying their metadata", () => {
    const index = createSkillMetadataIndex(
      {
        schemaVersion: SKILL_METADATA_OVERLAY_SCHEMA_VERSION,
        kind: SKILL_METADATA_OVERLAY_KIND,
        records: [{ ...recordForSkill("Body Blow", ["applies:deep_wound"]), name: "Old Body Blow" }]
      },
      skills
    );

    expect(index.errors).toEqual([]);
    expect(index.warnings.map((warning) => warning.code)).toEqual(["name-mismatch"]);
    expect(skillMetadataTokensForSkill(skillByName("Body Blow"), index)).toEqual([]);
  });
});

function overlay(records: readonly (readonly [string, readonly SkillMetadataToken[]])[]): unknown {
  return {
    schemaVersion: SKILL_METADATA_OVERLAY_SCHEMA_VERSION,
    kind: SKILL_METADATA_OVERLAY_KIND,
    records: records.map(([name, metadata]) => recordForSkill(name, metadata))
  };
}

function recordForSkill(name: string, metadata: readonly SkillMetadataToken[]) {
  const skill = skillByName(name);
  return {
    skillId: skill.id,
    name: skill.name,
    sourceTextDigest: skill.description.sourceTextDigest,
    metadata
  };
}

function skillByName(name: string): CatalogSkillRecord {
  const skill = skills.find((candidate) => candidate.name === name);
  if (skill === undefined) {
    throw new Error(`Missing skill fixture: ${name}`);
  }
  return skill;
}
