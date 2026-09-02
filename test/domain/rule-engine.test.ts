import { describe, expect, it } from "vitest";

import {
  calculateEffectiveAttributeRank,
  catalogId,
  validateBuild,
  type AttributeId,
  type ProfessionId
} from "../../src/domain";
import {
  attributeIds,
  professionAttributeCatalog,
  professionIds,
  skillsCatalog,
  skillIds,
  withSkillCatalog
} from "../fixtures/rule-engine/catalogs";
import {
  attributes,
  blankBuild,
  buildFixture,
  ordinarySkillBar,
  partialBuild,
  skillBar
} from "../fixtures/rule-engine/builds";

describe("rule-engine integration matrix", () => {
  it.each([
    {
      name: "valid build",
      build: buildFixture(),
      codes: [],
      state: { valid: true, complete: true, resolved: true, exhaustive: true }
    },
    {
      name: "blank build",
      build: blankBuild,
      codes: ["profession.primary-missing", "skill-bar.incomplete"],
      state: { valid: true, complete: false, resolved: true, exhaustive: true }
    },
    {
      name: "partial build",
      build: partialBuild,
      codes: ["skill-bar.incomplete"],
      state: { valid: true, complete: false, resolved: true, exhaustive: true }
    },
    {
      name: "invalid profession state",
      build: buildFixture({
        primaryProfessionId: null,
        secondaryProfessionId: professionIds.mesmer,
        attributes: [],
        skillBar: ordinarySkillBar()
      }),
      codes: ["profession.primary-missing", "profession.secondary-without-primary"],
      state: { valid: false, complete: false, resolved: true, exhaustive: true }
    },
    {
      name: "duplicate attributes",
      build: buildFixture({
        attributes: attributes([attributeIds.tactics, 1], [attributeIds.tactics, 2]),
        skillBar: ordinarySkillBar()
      }),
      codes: ["attribute.duplicate"],
      state: { valid: false, complete: true, resolved: true, exhaustive: true }
    },
    {
      name: "overspend",
      build: buildFixture({
        attributes: attributes(
          [attributeIds.strength, 12],
          [attributeIds.axeMastery, 12],
          [attributeIds.tactics, 12],
          [attributeIds.domination, 12]
        ),
        skillBar: ordinarySkillBar()
      }),
      codes: ["attribute.budget-overspent"],
      state: { valid: false, complete: true, resolved: true, exhaustive: true }
    },
    {
      name: "wrong-profession skill",
      build: buildFixture({
        skillBar: barWithFirst(skillIds.charmAnimal)
      }),
      codes: ["skill.wrong-profession"],
      state: { valid: false, complete: true, resolved: true, exhaustive: true }
    },
    {
      name: "duplicate ordinary skill",
      build: buildFixture({
        skillBar: skillBar(
          skillIds.healingSignet,
          skillIds.healingSignet,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix
        )
      }),
      codes: ["skill.duplicate"],
      state: { valid: false, complete: true, resolved: true, exhaustive: true }
    },
    {
      name: "duplicate elite",
      build: buildFixture({
        skillBar: skillBar(
          skillIds.powerBlock,
          skillIds.energySurge,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix
        )
      }),
      codes: ["skill.elite-limit"],
      state: { valid: false, complete: true, resolved: true, exhaustive: true }
    },
    {
      name: "too many PvE-only skills",
      build: buildFixture({
        skillBar: skillBar(
          skillIds.pveOnlyOne,
          skillIds.pveOnlyTwo,
          skillIds.pveOnlyThree,
          skillIds.pveOnlyFour,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour
        )
      }),
      codes: ["skill.pve-only-limit"],
      state: { valid: false, complete: true, resolved: true, exhaustive: true }
    },
    {
      name: "mode-restricted skill",
      build: buildFixture({
        skillBar: barWithFirst(skillIds.pvpOnly)
      }),
      codes: ["skill.mode-restricted"],
      state: { valid: false, complete: true, resolved: true, exhaustive: true }
    },
    {
      name: "unsupported and non-player skills",
      build: buildFixture({
        skillBar: skillBar(
          skillIds.unsupported,
          skillIds.nonPlayer,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix
        )
      }),
      codes: ["skill.unsupported", "skill.non-player"],
      state: { valid: false, complete: true, resolved: false, exhaustive: true }
    },
    {
      name: "unresolved IDs",
      build: buildFixture({
        primaryProfessionId: catalogId<"Profession">(9999) as ProfessionId,
        attributes: attributes([catalogId<"Attribute">(8888) as AttributeId, 0]),
        skillBar: barWithFirst(skillIds.unknown)
      }),
      codes: ["profession.primary-unresolved", "attribute.unresolved", "skill.unresolved"],
      state: { valid: true, complete: true, resolved: false, exhaustive: true }
    }
  ])("covers $name", ({ build, codes, state }) => {
    const result = validateBuild({
      build,
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(codes);
    expect(pickState(result)).toEqual(state);
    expect(result.truncation).toBeNull();
  });

  it("covers split ambiguity in a combined validation pass", () => {
    const result = validateBuild({
      build: buildFixture({ skillBar: barWithFirst(skillIds.splitPve) }),
      professionAttributes: professionAttributeCatalog,
      skills: withSkillCatalog({
        splitGroups: [{ ...skillsCatalog.splitGroups[0]!, ambiguity: "unknown-mode-differs" }]
      })
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(["skill.split-ambiguous"]);
    expect(result.issues[0]).toMatchObject({
      severity: "warning",
      path: ["skillBar", 0],
      location: { kind: "skill-slot", index: 0 },
      sourceRule: "skill.split"
    });
  });

  it("keeps effective-rank edge cases available alongside validation", () => {
    const result = calculateEffectiveAttributeRank({
      build: buildFixture({ attributes: attributes([attributeIds.tactics, 1]) }),
      professionAttributes: professionAttributeCatalog,
      attributeId: attributeIds.tactics,
      adjustments: [{ kind: "manual", amount: -2 }]
    });

    expect(result.kind).toBe("unresolved");
    expect(result.kind === "unresolved" ? result.reasons[0]?.code : null).toBe(
      "negative-final-rank"
    );
  });
});

function barWithFirst(first: (typeof skillIds)[keyof typeof skillIds]) {
  const bar = ordinarySkillBar();
  return skillBar(first, bar[1], bar[2], bar[3], bar[4], bar[5], bar[6], bar[7]);
}

function pickState(result: ReturnType<typeof validateBuild>) {
  return {
    valid: result.valid,
    complete: result.complete,
    resolved: result.resolved,
    exhaustive: result.exhaustive
  };
}
