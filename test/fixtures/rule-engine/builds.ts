import {
  authoredDocumentId,
  FOUNDATION_SCHEMA_VERSION,
  type AttributeAllocation,
  type AttributeId,
  type Build,
  type GameMode,
  type ProfessionId,
  type SkillBar,
  type SkillId
} from "../../../src/domain";
import { attributeIds, professionIds, skillIds } from "./catalogs";

export const legalWarriorMesmerBuild = buildFixture();

export const blankBuild = buildFixture({
  name: "Blank Build",
  mode: "unknown",
  primaryProfessionId: null,
  secondaryProfessionId: null,
  attributes: [],
  skillBar: emptySkillBar()
});

export const partialBuild = buildFixture({
  name: "Partial Build",
  secondaryProfessionId: null,
  attributes: [{ attributeId: attributeIds.tactics, rank: 4 }],
  skillBar: [skillIds.healingSignet, skillIds.severArtery, null, null, null, null, null, null]
});

export function buildFixture(overrides: Partial<Build> = {}): Build {
  return {
    id: authoredDocumentId("rule-engine-build"),
    schemaVersion: FOUNDATION_SCHEMA_VERSION,
    catalogVersion: "fixture-build-v1",
    name: "Rule Engine Fixture Build",
    mode: "pve",
    primaryProfessionId: professionIds.warrior,
    secondaryProfessionId: professionIds.mesmer,
    attributes: [
      { attributeId: attributeIds.strength, rank: 0 },
      { attributeId: attributeIds.axeMastery, rank: 12 },
      { attributeId: attributeIds.tactics, rank: 8 },
      { attributeId: attributeIds.domination, rank: 8 }
    ],
    skillBar: [
      skillIds.healingSignet,
      skillIds.severArtery,
      skillIds.powerBlock,
      skillIds.resurrectionSignet,
      skillIds.splitPve,
      skillIds.commonOne,
      skillIds.commonTwo,
      skillIds.commonThree
    ],
    equipment: null,
    ...overrides
  };
}

export function emptySkillBar(): SkillBar {
  return [null, null, null, null, null, null, null, null];
}

export function skillBar(...skills: readonly (SkillId | null)[]): SkillBar {
  return [
    skills[0] ?? null,
    skills[1] ?? null,
    skills[2] ?? null,
    skills[3] ?? null,
    skills[4] ?? null,
    skills[5] ?? null,
    skills[6] ?? null,
    skills[7] ?? null
  ];
}

export function ordinarySkillBar(): SkillBar {
  return skillBar(
    skillIds.healingSignet,
    skillIds.severArtery,
    skillIds.resurrectionSignet,
    skillIds.commonOne,
    skillIds.commonTwo,
    skillIds.commonThree,
    skillIds.commonFour,
    skillIds.commonFive
  );
}

export function attributes(
  ...rows: readonly (readonly [AttributeId, number])[]
): readonly AttributeAllocation[] {
  return rows.map(([attributeId, rank]) => ({ attributeId, rank }));
}

export function malformedBuild(overrides: {
  readonly mode?: unknown;
  readonly skillBar?: unknown;
  readonly attributes?: unknown;
  readonly primaryProfessionId?: unknown;
  readonly secondaryProfessionId?: unknown;
}): Build {
  return {
    ...buildFixture(),
    ...(overrides as Partial<Build>)
  };
}

export function professionPair(
  primary: ProfessionId | null,
  secondary: ProfessionId | null
): Build {
  return buildFixture({
    primaryProfessionId: primary,
    secondaryProfessionId: secondary
  });
}

export function modeBuild(mode: GameMode): Build {
  return buildFixture({ mode });
}
