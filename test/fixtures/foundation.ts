import {
  authoredDocumentId,
  BUILD_SCHEMA_VERSION,
  catalogId,
  type Attribute,
  type AttributeId,
  type Build,
  type Profession,
  type ProfessionId,
  type Skill,
  type SkillId
} from "../../src/domain";

// Synthetic foundation fixtures. They are non-authoritative and unsuitable for Guild Wars correctness assertions.
export const syntheticProfessionId = catalogId<"Profession">(9001) as ProfessionId;
export const syntheticAttributeId = catalogId<"Attribute">(9002) as AttributeId;
export const syntheticUnknownSkillId = catalogId<"Skill">(987654321) as SkillId;

export const syntheticProfession: Profession = {
  id: syntheticProfessionId,
  name: "Synthetic Profession",
  abbreviation: "SP",
  primaryAttributeId: syntheticAttributeId,
  provenance: null
};

export const syntheticAttribute: Attribute = {
  id: syntheticAttributeId,
  name: "Synthetic Attribute",
  professionId: syntheticProfessionId,
  isPrimary: true,
  provenance: null
};

export const syntheticSkill: Skill = {
  id: syntheticUnknownSkillId,
  name: "Synthetic Skill",
  professionId: syntheticProfessionId,
  attributeId: syntheticAttributeId,
  progression: {
    attributeId: syntheticAttributeId,
    breakpoints: [{ rank: 0, values: [1] }]
  },
  provenance: null
};

export const syntheticFoundationBuild: Build = {
  id: authoredDocumentId("foundation-build"),
  schemaVersion: BUILD_SCHEMA_VERSION,
  catalogVersion: "synthetic-foundation",
  name: "Synthetic Foundation Build",
  mode: "unknown",
  primaryProfessionId: syntheticProfessionId,
  secondaryProfessionId: null,
  attributes: [{ attributeId: syntheticAttributeId, rank: 0 }],
  skillBar: [syntheticUnknownSkillId, null, null, null, null, null, null, null],
  titleRankOverrides: [],
  equipment: null
};
