import { describe, expect, it } from "vitest";

import { validateBuild } from "../../src/domain";
import {
  professionAttributeCatalog,
  skillsCatalog,
  skillIds,
  withSkillCatalog
} from "../fixtures/rule-engine/catalogs";
import {
  attributes,
  buildFixture,
  ordinarySkillBar,
  skillBar
} from "../fixtures/rule-engine/builds";

describe("skill eligibility and mode rules", () => {
  it("accepts primary, secondary, common, special, and no-attribute skills when facts support them", () => {
    const result = validateBuild({
      build: buildFixture({
        skillBar: skillBar(
          skillIds.healingSignet,
          skillIds.powerBlock,
          skillIds.resurrectionSignet,
          skillIds.special,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour
        )
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(result.issues).toEqual([]);
  });

  it("warns when a selected skill needs a missing secondary profession", () => {
    const result = validateBuild({
      build: buildFixture({
        secondaryProfessionId: null,
        attributes: [],
        skillBar: skillBar(
          skillIds.powerBlock,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix,
          skillIds.resurrectionSignet
        )
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(result.issues.map((issue) => [issue.code, issue.severity])).toEqual([
      ["skill.profession-missing-secondary", "warning"]
    ]);
    expect(result.complete).toBe(false);
  });

  it("errors when a resolved skill belongs to an unrelated profession", () => {
    const result = validateBuild({
      build: buildFixture({
        skillBar: skillBar(
          skillIds.charmAnimal,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix,
          skillIds.resurrectionSignet
        )
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual(["skill.wrong-profession"]);
    expect(result.valid).toBe(false);
  });

  it("warns when professionless skills lack a supporting classification", () => {
    const result = validateBuild({
      build: buildFixture({
        skillBar: skillBar(
          skillIds.professionlessUnknown,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix,
          skillIds.resurrectionSignet
        )
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual([
      "skill.professionless-unsupported",
      "skill.attribute-metadata-missing"
    ]);
    expect(result.resolved).toBe(false);
  });

  it("validates skill attribute joins without requiring a positive authored allocation", () => {
    const missing = validateBuild({
      build: buildFixture({
        attributes: attributes(),
        skillBar: skillBar(
          skillIds.missingAttribute,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix,
          skillIds.resurrectionSignet
        )
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });
    const conflicting = validateBuild({
      build: buildFixture({
        skillBar: skillBar(
          skillIds.conflictingAttribute,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix,
          skillIds.resurrectionSignet
        )
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(missing)).toEqual(["skill.attribute-unresolved"]);
    expect(codes(conflicting)).toEqual(["skill.attribute-metadata-conflict"]);
  });

  it("enforces mode restrictions and warns when restricted skills need a known mode", () => {
    const pveWithPvpOnly = validateBuild({
      build: buildFixture({
        skillBar: skillBar(
          skillIds.pvpOnly,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix,
          skillIds.resurrectionSignet
        )
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });
    const pvpWithPveOnly = validateBuild({
      build: buildFixture({
        mode: "pvp",
        skillBar: skillBar(
          skillIds.pveOnlyOne,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix,
          skillIds.resurrectionSignet
        )
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog,
      options: { attributeBudget: { kind: "none" } }
    });
    const unknownMode = validateBuild({
      build: buildFixture({
        mode: "unknown",
        attributes: [],
        skillBar: skillBar(
          skillIds.pveOnlyOne,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix,
          skillIds.resurrectionSignet
        )
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(pveWithPvpOnly)).toEqual(["skill.mode-restricted"]);
    expect(codes(pvpWithPveOnly)).toEqual(["skill.mode-restricted"]);
    expect(codes(unknownMode)).toEqual(["skill.mode-unknown"]);
  });

  it("reports split ambiguity, duplicate members, overbroad groups, and unresolved counterparts", () => {
    const ambiguous = validateBuild({
      build: buildFixture({ skillBar: ordinarySkillBarWith(skillIds.splitPve) }),
      professionAttributes: professionAttributeCatalog,
      skills: withSkillCatalog({
        splitGroups: [{ ...skillsCatalog.splitGroups[0]!, ambiguity: "incomplete-counterpart" }]
      })
    });
    const duplicateAndOverbroad = validateBuild({
      build: buildFixture({ skillBar: ordinarySkillBarWith(skillIds.splitPve) }),
      professionAttributes: professionAttributeCatalog,
      skills: withSkillCatalog({
        splitGroups: [
          {
            ...skillsCatalog.splitGroups[0]!,
            members: [
              ...skillsCatalog.splitGroups[0]!.members,
              { mode: "pve", skillId: skillIds.splitPve }
            ]
          }
        ]
      })
    });
    const missingCounterpart = validateBuild({
      build: buildFixture({ mode: "pvp", skillBar: ordinarySkillBarWith(skillIds.splitPve) }),
      professionAttributes: professionAttributeCatalog,
      skills: withSkillCatalog({
        skills: skillsCatalog.skills.filter((skill) => skill.id !== skillIds.splitPvp)
      }),
      options: { attributeBudget: { kind: "none" } }
    });

    expect(codes(ambiguous)).toEqual(["skill.split-ambiguous"]);
    expect(codes(duplicateAndOverbroad)).toEqual([
      "skill.split-counterpart-unresolved",
      "catalog.skill-split-group-duplicate-member",
      "catalog.skill-split-group-overbroad"
    ]);
    expect(codes(missingCounterpart)).toEqual([
      "skill.mode-restricted",
      "skill.split-counterpart-unresolved"
    ]);
  });

  it("resolves title ranks and keeps allegiance uncertainty narrow", () => {
    const title = validateBuild({
      build: buildFixture({ skillBar: ordinarySkillBarWith(skillIds.titleSkill) }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });
    const allegiance = validateBuild({
      build: buildFixture({ skillBar: ordinarySkillBarWith(skillIds.allegianceSkill) }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(title)).toEqual([]);
    expect(codes(allegiance)).toEqual(["skill.allegiance-unmodeled"]);
  });
});

function ordinarySkillBarWith(first: (typeof skillIds)[keyof typeof skillIds]) {
  const bar = ordinarySkillBar();
  return skillBar(first, bar[1], bar[2], bar[3], bar[4], bar[5], bar[6], bar[7]);
}

function codes(result: ReturnType<typeof validateBuild>): readonly string[] {
  return result.issues.map((issue) => issue.code);
}
