import {
  catalogId,
  templateAttributeId,
  templateProfessionId,
  templateSkillId,
  type AttributeId,
  type AttributePointRules,
  type CatalogAttributeRecord,
  type CatalogFieldProvenance,
  type CatalogProfessionRecord,
  type CatalogSkillRecord,
  type ProfessionId,
  type SkillClassification,
  type SkillId,
  type SkillModeVariantGroup,
  type SkillProgressionSeries,
  type SkillSourceSetDisposition,
  type ProfessionAttributeValidationCatalog,
  type SkillValidationCatalog
} from "../../../src/domain";

export const professionIds = {
  warrior: catalogId<"Profession">(1) as ProfessionId,
  ranger: catalogId<"Profession">(2) as ProfessionId,
  monk: catalogId<"Profession">(3) as ProfessionId,
  necromancer: catalogId<"Profession">(4) as ProfessionId,
  mesmer: catalogId<"Profession">(5) as ProfessionId
};

export const attributeIds = {
  strength: catalogId<"Attribute">(17) as AttributeId,
  axeMastery: catalogId<"Attribute">(18) as AttributeId,
  tactics: catalogId<"Attribute">(21) as AttributeId,
  expertise: catalogId<"Attribute">(23) as AttributeId,
  marksmanship: catalogId<"Attribute">(24) as AttributeId,
  domination: catalogId<"Attribute">(2) as AttributeId,
  bloodMagic: catalogId<"Attribute">(4) as AttributeId
};

export const skillIds = {
  healingSignet: catalogId<"Skill">(100) as SkillId,
  severArtery: catalogId<"Skill">(101) as SkillId,
  powerBlock: catalogId<"Skill">(102) as SkillId,
  energySurge: catalogId<"Skill">(103) as SkillId,
  resurrectionSignet: catalogId<"Skill">(104) as SkillId,
  charmAnimal: catalogId<"Skill">(105) as SkillId,
  pveOnlyOne: catalogId<"Skill">(106) as SkillId,
  pveOnlyTwo: catalogId<"Skill">(107) as SkillId,
  pveOnlyThree: catalogId<"Skill">(108) as SkillId,
  pveOnlyFour: catalogId<"Skill">(109) as SkillId,
  pvpOnly: catalogId<"Skill">(110) as SkillId,
  unsupported: catalogId<"Skill">(111) as SkillId,
  nonPlayer: catalogId<"Skill">(112) as SkillId,
  professionlessUnknown: catalogId<"Skill">(113) as SkillId,
  splitPve: catalogId<"Skill">(114) as SkillId,
  splitPvp: catalogId<"Skill">(115) as SkillId,
  missingAttribute: catalogId<"Skill">(116) as SkillId,
  conflictingAttribute: catalogId<"Skill">(117) as SkillId,
  titleSkill: catalogId<"Skill">(118) as SkillId,
  allegianceSkill: catalogId<"Skill">(119) as SkillId,
  commonOne: catalogId<"Skill">(120) as SkillId,
  commonTwo: catalogId<"Skill">(121) as SkillId,
  commonThree: catalogId<"Skill">(122) as SkillId,
  commonFour: catalogId<"Skill">(123) as SkillId,
  commonFive: catalogId<"Skill">(124) as SkillId,
  commonSix: catalogId<"Skill">(125) as SkillId,
  special: catalogId<"Skill">(126) as SkillId,
  dispositioned: catalogId<"Skill">(9000) as SkillId,
  unknown: catalogId<"Skill">(999999) as SkillId
};

const provenance = {
  sourceIds: ["fixture:rule-engine"],
  claimIds: ["claim:fixture:rule-engine"],
  reviewIds: [],
  notes: "Rule-engine fixture fact."
} satisfies CatalogFieldProvenance;

export const warrior = profession({
  id: professionIds.warrior,
  templateId: 1,
  name: "Warrior",
  abbreviation: "W",
  primaryAttributeId: attributeIds.strength,
  primaryAttributeTemplateId: 17
});

export const ranger = profession({
  id: professionIds.ranger,
  templateId: 2,
  name: "Ranger",
  abbreviation: "R",
  primaryAttributeId: attributeIds.expertise,
  primaryAttributeTemplateId: 23
});

export const mesmer = profession({
  id: professionIds.mesmer,
  templateId: 5,
  name: "Mesmer",
  abbreviation: "Me",
  primaryAttributeId: catalogId<"Attribute">(0) as AttributeId,
  primaryAttributeTemplateId: 0
});

export const strength = attribute({
  id: attributeIds.strength,
  templateId: 17,
  name: "Strength",
  professionId: professionIds.warrior,
  isPrimary: true,
  isPrimaryOnly: true
});

export const axeMastery = attribute({
  id: attributeIds.axeMastery,
  templateId: 18,
  name: "Axe Mastery",
  professionId: professionIds.warrior
});

export const tactics = attribute({
  id: attributeIds.tactics,
  templateId: 21,
  name: "Tactics",
  professionId: professionIds.warrior
});

export const expertise = attribute({
  id: attributeIds.expertise,
  templateId: 23,
  name: "Expertise",
  professionId: professionIds.ranger,
  isPrimary: true,
  isPrimaryOnly: true
});

export const marksmanship = attribute({
  id: attributeIds.marksmanship,
  templateId: 24,
  name: "Marksmanship",
  professionId: professionIds.ranger
});

export const domination = attribute({
  id: attributeIds.domination,
  templateId: 2,
  name: "Domination Magic",
  professionId: professionIds.mesmer
});

export const bloodMagic = attribute({
  id: attributeIds.bloodMagic,
  templateId: 4,
  name: "Blood Magic",
  professionId: professionIds.necromancer
});

export const attributePointRules = {
  purchasedRankCosts: [
    { purchasedRank: 0, marginalCost: 0, cumulativeCost: 0 },
    { purchasedRank: 1, marginalCost: 1, cumulativeCost: 1 },
    { purchasedRank: 2, marginalCost: 2, cumulativeCost: 3 },
    { purchasedRank: 3, marginalCost: 3, cumulativeCost: 6 },
    { purchasedRank: 4, marginalCost: 4, cumulativeCost: 10 },
    { purchasedRank: 5, marginalCost: 5, cumulativeCost: 15 },
    { purchasedRank: 6, marginalCost: 6, cumulativeCost: 21 },
    { purchasedRank: 7, marginalCost: 7, cumulativeCost: 28 },
    { purchasedRank: 8, marginalCost: 9, cumulativeCost: 37 },
    { purchasedRank: 9, marginalCost: 11, cumulativeCost: 48 },
    { purchasedRank: 10, marginalCost: 13, cumulativeCost: 61 },
    { purchasedRank: 11, marginalCost: 16, cumulativeCost: 77 },
    { purchasedRank: 12, marginalCost: 20, cumulativeCost: 97 }
  ],
  levelPointTotals: [
    { level: 1, earnedAtLevel: 0, cumulativeTotal: 0 },
    { level: 20, earnedAtLevel: 15, cumulativeTotal: 170 }
  ],
  questRewards: [],
  questRewardGroups: [],
  maximumApplicableQuestBonus: {
    points: 30,
    policy: "one-native-campaign",
    provenance
  },
  defaultPveLevel20: {
    level: 20,
    baseAttributePoints: 170,
    maximumQuestBonusPoints: 30,
    totalWithoutQuestBonus: 170,
    totalWithMaximumQuestBonus: 200,
    policy: "level-20-pve-native-character-maximum-applicable-quest-rewards",
    deferredContexts: ["equipment", "actual-quest-log-state"],
    provenance
  }
} satisfies AttributePointRules;

export const professionAttributeCatalog = {
  catalogVersion: "fixture-pa-v1",
  generatedAt: "2026-09-01T00:00:00Z",
  professions: [warrior, ranger, mesmer],
  attributes: [strength, axeMastery, tactics, expertise, marksmanship, domination, bloodMagic],
  attributePointRules
} satisfies ProfessionAttributeValidationCatalog;

export const skillsCatalog = {
  catalogVersion: "fixture-skills-v1",
  generatedAt: "2026-09-01T00:00:00Z",
  skills: [
    skill({
      id: skillIds.healingSignet,
      name: "Healing Signet",
      professionId: professionIds.warrior,
      attributeId: attributeIds.tactics,
      type: "Signet"
    }),
    skill({
      id: skillIds.severArtery,
      name: "Sever Artery",
      professionId: professionIds.warrior,
      attributeId: attributeIds.axeMastery,
      type: "Axe Attack"
    }),
    skill({
      id: skillIds.powerBlock,
      name: "Power Block",
      professionId: professionIds.mesmer,
      attributeId: attributeIds.domination,
      classification: { elite: true },
      type: "Spell"
    }),
    skill({
      id: skillIds.energySurge,
      name: "Energy Surge",
      professionId: professionIds.mesmer,
      attributeId: attributeIds.domination,
      classification: { elite: true },
      type: "Spell"
    }),
    skill({
      id: skillIds.resurrectionSignet,
      name: "Resurrection Signet",
      professionId: null,
      attributeId: null,
      classification: { common: true, noAttribute: true },
      type: "Signet"
    }),
    skill({
      id: skillIds.charmAnimal,
      name: "Charm Animal",
      professionId: professionIds.ranger,
      attributeId: attributeIds.marksmanship,
      type: "Skill"
    }),
    pveOnlySkill(skillIds.pveOnlyOne, "PvE Only One"),
    pveOnlySkill(skillIds.pveOnlyTwo, "PvE Only Two"),
    pveOnlySkill(skillIds.pveOnlyThree, "PvE Only Three"),
    pveOnlySkill(skillIds.pveOnlyFour, "PvE Only Four"),
    skill({
      id: skillIds.pvpOnly,
      name: "PvP Only",
      professionId: null,
      attributeId: null,
      classification: {
        common: true,
        noAttribute: true,
        pvpOnly: true,
        modeAvailability: "pvp-only"
      }
    }),
    skill({
      id: skillIds.unsupported,
      name: "Unsupported Fixture",
      professionId: null,
      attributeId: null,
      classification: { unsupported: true, noAttribute: true }
    }),
    skill({
      id: skillIds.nonPlayer,
      name: "Non-player Fixture",
      professionId: professionIds.warrior,
      attributeId: attributeIds.tactics,
      classification: { nonPlayer: true }
    }),
    skill({
      id: skillIds.professionlessUnknown,
      name: "Professionless Unknown",
      professionId: null,
      attributeId: null
    }),
    skill({
      id: skillIds.splitPve,
      name: "Split Fixture PvE",
      professionId: null,
      attributeId: null,
      classification: {
        common: true,
        noAttribute: true,
        split: true,
        pveOnly: true,
        modeAvailability: "pve-only"
      },
      splitGroupId: "split:fixture"
    }),
    skill({
      id: skillIds.splitPvp,
      name: "Split Fixture PvP",
      professionId: null,
      attributeId: null,
      classification: {
        common: true,
        noAttribute: true,
        split: true,
        pvpOnly: true,
        modeAvailability: "pvp-only"
      },
      splitGroupId: "split:fixture"
    }),
    skill({
      id: skillIds.missingAttribute,
      name: "Missing Attribute Fixture",
      professionId: professionIds.warrior,
      attributeId: catalogId<"Attribute">(7777) as AttributeId
    }),
    skill({
      id: skillIds.conflictingAttribute,
      name: "Conflicting Attribute Fixture",
      professionId: professionIds.warrior,
      attributeId: attributeIds.domination
    }),
    skill({
      id: skillIds.titleSkill,
      name: "Title Fixture",
      professionId: null,
      attributeId: null,
      classification: {
        title: true,
        noAttribute: true,
        pveOnly: true,
        modeAvailability: "pve-only"
      },
      progressionSeriesIds: ["progression:title-fixture"]
    }),
    skill({
      id: skillIds.allegianceSkill,
      name: "Allegiance Fixture",
      professionId: null,
      attributeId: null,
      classification: {
        title: true,
        noAttribute: true,
        pveOnly: true,
        modeAvailability: "pve-only"
      },
      progressionSeriesIds: ["progression:allegiance-fixture"]
    }),
    skill({
      id: skillIds.commonOne,
      name: "Common One",
      professionId: null,
      attributeId: null,
      classification: { common: true, noAttribute: true }
    }),
    skill({
      id: skillIds.commonTwo,
      name: "Common Two",
      professionId: null,
      attributeId: null,
      classification: { common: true, noAttribute: true }
    }),
    skill({
      id: skillIds.commonThree,
      name: "Common Three",
      professionId: null,
      attributeId: null,
      classification: { common: true, noAttribute: true }
    }),
    skill({
      id: skillIds.commonFour,
      name: "Common Four",
      professionId: null,
      attributeId: null,
      classification: { common: true, noAttribute: true }
    }),
    skill({
      id: skillIds.commonFive,
      name: "Common Five",
      professionId: null,
      attributeId: null,
      classification: { common: true, noAttribute: true }
    }),
    skill({
      id: skillIds.commonSix,
      name: "Common Six",
      professionId: null,
      attributeId: null,
      classification: { common: true, noAttribute: true }
    }),
    skill({
      id: skillIds.special,
      name: "Special Fixture",
      professionId: null,
      attributeId: null,
      classification: { special: true, noAttribute: true }
    })
  ],
  dispositions: [
    {
      id: "disposition:fixture:9000",
      skillId: skillIds.dispositioned,
      templateId: templateSkillId(9000),
      requestedTitle: "Disposition Fixture",
      kind: "unsupported",
      reason: "Fixture unsupported source disposition.",
      reviewId: null,
      provenance
    }
  ],
  progressionSeries: [
    titleProgression("progression:title-fixture", skillIds.titleSkill, "title:sunspear"),
    titleProgression("progression:allegiance-fixture", skillIds.allegianceSkill, "allegiance:luxon")
  ],
  splitGroups: [
    {
      id: "split:fixture",
      members: [
        { mode: "pve", skillId: skillIds.splitPve },
        { mode: "pvp", skillId: skillIds.splitPvp }
      ],
      ambiguity: "none",
      provenance
    }
  ]
} satisfies SkillValidationCatalog;

function profession(input: {
  readonly id: ProfessionId;
  readonly templateId: number;
  readonly name: string;
  readonly abbreviation: string;
  readonly primaryAttributeId: AttributeId;
  readonly primaryAttributeTemplateId: number;
}): CatalogProfessionRecord {
  return {
    id: input.id,
    templateId: templateProfessionId(input.templateId),
    name: input.name,
    abbreviation: input.abbreviation,
    professionFamily: "core",
    primaryCreationCampaigns: ["prophecies", "factions", "nightfall"],
    primaryAttributeId: input.primaryAttributeId,
    primaryAttributeTemplateId: templateAttributeId(input.primaryAttributeTemplateId),
    iconId: null,
    provenance
  };
}

function attribute(input: {
  readonly id: AttributeId;
  readonly templateId: number;
  readonly name: string;
  readonly professionId: ProfessionId;
  readonly isPrimary?: boolean;
  readonly isPrimaryOnly?: boolean;
}): CatalogAttributeRecord {
  return {
    id: input.id,
    templateId: templateAttributeId(input.templateId),
    name: input.name,
    professionId: input.professionId,
    professionTemplateId: templateProfessionId(Number(input.professionId)),
    isPrimary: input.isPrimary ?? false,
    isPrimaryOnly: input.isPrimaryOnly ?? false,
    primaryEffectSummary: null,
    provenance
  };
}

function pveOnlySkill(id: SkillId, name: string): CatalogSkillRecord {
  return skill({
    id,
    name,
    professionId: null,
    attributeId: null,
    classification: { common: true, noAttribute: true, pveOnly: true, modeAvailability: "pve-only" }
  });
}

export function skill(input: {
  readonly id: SkillId;
  readonly name: string;
  readonly professionId: ProfessionId | null;
  readonly attributeId: AttributeId | null;
  readonly classification?: Partial<SkillClassification>;
  readonly splitGroupId?: string | null;
  readonly progressionSeriesIds?: readonly string[];
  readonly type?: string;
}): CatalogSkillRecord {
  const classification = {
    ...baseSkillClassification(),
    ...(input.classification ?? {})
  } satisfies SkillClassification;
  return {
    id: input.id,
    templateId: templateSkillId(Number(input.id)),
    name: input.name,
    normalizedName: input.name.toLowerCase(),
    wikiUrl: `https://example.invalid/${input.name.replace(/\s+/g, "_")}`,
    pageIdentity: {
      requestedTitle: input.name,
      normalizedTitle: input.name,
      canonicalTitle: input.name,
      pageId: Number(input.id),
      revisionId: Number(input.id),
      sourceRevisionTimestamp: "2026-09-01T00:00:00Z",
      redirectedFrom: null
    },
    campaign: "core",
    professionId: input.professionId,
    attributeId: input.attributeId,
    type: input.type ?? "Skill",
    classification,
    costs: costProfile(),
    timings: timingProfile(),
    description: {
      state: "structured-only",
      tokens: [],
      searchText: input.name,
      sourceTextDigest: null,
      reviewId: null,
      limitations: []
    },
    progressionSeriesIds: input.progressionSeriesIds ?? [],
    splitGroupId: input.splitGroupId ?? null,
    iconId: null,
    provenance
  };
}

function baseSkillClassification(): SkillClassification {
  return {
    elite: false,
    common: false,
    title: false,
    special: false,
    noAttribute: false,
    pveOnly: false,
    pvpOnly: false,
    sharedPage: false,
    split: false,
    unsupported: false,
    nonPlayer: false,
    modeAvailability: "both"
  };
}

function costProfile(): CatalogSkillRecord["costs"] {
  const absent = { state: "absent", value: null, unit: null, text: null, source: null } as const;
  return {
    energy: absent,
    adrenaline: absent,
    sacrifice: absent,
    upkeep: absent,
    overcast: absent
  };
}

function timingProfile(): CatalogSkillRecord["timings"] {
  const absent = { state: "absent", value: null, unit: null, text: null, source: null } as const;
  return {
    activation: absent,
    recharge: absent,
    moraleBoostRecharge: absent
  };
}

function titleProgression(id: string, skillId: SkillId, titleKey: string): SkillProgressionSeries {
  return {
    id,
    skillId,
    dependency: {
      kind: "title-rank",
      attributeId: null,
      titleKey,
      mode: null,
      rankDomain: { min: 0, max: 12 }
    },
    valueSlots: [{ index: 0, label: "Fixture value", unit: null }],
    values: [{ rank: 0, values: [0] }],
    sourceForm: "skill progression",
    provenance
  };
}

export function withSkillCatalog(overrides: {
  readonly skills?: readonly CatalogSkillRecord[];
  readonly dispositions?: readonly SkillSourceSetDisposition[];
  readonly progressionSeries?: readonly SkillProgressionSeries[];
  readonly splitGroups?: readonly SkillModeVariantGroup[];
}): SkillValidationCatalog {
  return {
    ...skillsCatalog,
    skills: overrides.skills ?? skillsCatalog.skills,
    dispositions: overrides.dispositions ?? skillsCatalog.dispositions,
    progressionSeries: overrides.progressionSeries ?? skillsCatalog.progressionSeries,
    splitGroups: overrides.splitGroups ?? skillsCatalog.splitGroups
  };
}

export function withProfessionAttributeCatalog(overrides: {
  readonly professions?: readonly CatalogProfessionRecord[];
  readonly attributes?: readonly CatalogAttributeRecord[];
  readonly attributePointRules?: AttributePointRules;
}): ProfessionAttributeValidationCatalog {
  return {
    ...professionAttributeCatalog,
    professions: overrides.professions ?? professionAttributeCatalog.professions,
    attributes: overrides.attributes ?? professionAttributeCatalog.attributes,
    attributePointRules:
      overrides.attributePointRules ?? professionAttributeCatalog.attributePointRules
  };
}
