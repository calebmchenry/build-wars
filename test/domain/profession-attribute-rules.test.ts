import { describe, expect, it } from "vitest";

import { catalogId, validateBuild, type AttributeId, type ProfessionId } from "../../src/domain";
import {
  attributeIds,
  professionAttributeCatalog,
  professionIds,
  skillsCatalog,
  withProfessionAttributeCatalog
} from "../fixtures/rule-engine/catalogs";
import { attributes, buildFixture, ordinarySkillBar } from "../fixtures/rule-engine/builds";

describe("profession and attribute validation rules", () => {
  it("accepts legal dual-profession and single-profession builds", () => {
    const dual = validateBuild({
      build: buildFixture(),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });
    const single = validateBuild({
      build: buildFixture({
        secondaryProfessionId: null,
        attributes: attributes(
          [attributeIds.strength, 0],
          [attributeIds.axeMastery, 12],
          [attributeIds.tactics, 8]
        ),
        skillBar: ordinarySkillBar()
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(dual.issues).toEqual([]);
    expect(dual.valid).toBe(true);
    expect(dual.complete).toBe(true);
    expect(single.issues).toEqual([]);
    expect(single.valid).toBe(true);
  });

  it("distinguishes missing primary, secondary-without-primary, duplicate, and unresolved states", () => {
    expect(
      codes(
        validateBuild({
          build: buildFixture({
            primaryProfessionId: null,
            secondaryProfessionId: null,
            attributes: [],
            skillBar: ordinarySkillBar()
          }),
          professionAttributes: professionAttributeCatalog,
          skills: skillsCatalog
        })
      )
    ).toEqual(["profession.primary-missing"]);

    expect(
      codes(
        validateBuild({
          build: buildFixture({
            primaryProfessionId: null,
            secondaryProfessionId: professionIds.mesmer,
            attributes: [],
            skillBar: ordinarySkillBar()
          }),
          professionAttributes: professionAttributeCatalog,
          skills: skillsCatalog
        })
      )
    ).toEqual(["profession.primary-missing", "profession.secondary-without-primary"]);

    expect(
      codes(
        validateBuild({
          build: buildFixture({
            primaryProfessionId: professionIds.warrior,
            secondaryProfessionId: professionIds.warrior,
            attributes: [],
            skillBar: ordinarySkillBar()
          }),
          professionAttributes: professionAttributeCatalog,
          skills: skillsCatalog
        })
      )
    ).toEqual(["profession.duplicate"]);

    const unknownProfession = catalogId<"Profession">(9999) as ProfessionId;
    expect(
      codes(
        validateBuild({
          build: buildFixture({
            primaryProfessionId: unknownProfession,
            secondaryProfessionId: unknownProfession,
            attributes: [],
            skillBar: ordinarySkillBar()
          }),
          professionAttributes: professionAttributeCatalog,
          skills: skillsCatalog
        })
      )
    ).toEqual([
      "profession.duplicate",
      "profession.primary-unresolved",
      "profession.secondary-unresolved"
    ]);
  });

  it("validates duplicate rows, malformed ranks, unsupported rank costs, and unresolved attributes", () => {
    const result = validateBuild({
      build: buildFixture({
        attributes: [
          { attributeId: attributeIds.tactics, rank: 8 },
          { attributeId: attributeIds.tactics, rank: 6 },
          { attributeId: attributeIds.axeMastery, rank: Number.NaN },
          { attributeId: catalogId<"Attribute">(7777) as AttributeId, rank: 1 },
          { attributeId: attributeIds.domination, rank: 13 }
        ],
        skillBar: ordinarySkillBar()
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual([
      "attribute.unresolved",
      "attribute.invalid-rank",
      "attribute.unsupported-rank",
      "attribute.duplicate"
    ]);
    expect(result.counts).toEqual({ error: 3, warning: 1, info: 0, total: 4 });
  });

  it("enforces primary-only and selected-profession attribute ownership without cascades", () => {
    const result = validateBuild({
      build: buildFixture({
        secondaryProfessionId: professionIds.mesmer,
        attributes: attributes([attributeIds.expertise, 0], [attributeIds.bloodMagic, 0]),
        skillBar: ordinarySkillBar()
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual(["attribute.primary-only", "attribute.wrong-profession"]);
    expect(result.issues.map((issue) => issue.path)).toEqual([
      ["attributes", 0, "attributeId"],
      ["attributes", 1, "attributeId"]
    ]);
  });

  it("uses first duplicate row only for spending and reports overspend when budget is resolved", () => {
    const result = validateBuild({
      build: buildFixture({
        attributes: attributes(
          [attributeIds.strength, 12],
          [attributeIds.axeMastery, 12],
          [attributeIds.tactics, 12],
          [attributeIds.domination, 12],
          [attributeIds.tactics, 12]
        ),
        skillBar: ordinarySkillBar()
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual(["attribute.duplicate", "attribute.budget-overspent"]);
    expect(result.issues[1]?.relatedEntities).toContainEqual({
      kind: "budget",
      id: 388,
      label: "spend"
    });
  });

  it("supports explicit budgets and warns when PvP auto budget is unresolved", () => {
    const explicit = validateBuild({
      build: buildFixture({
        attributes: attributes([attributeIds.axeMastery, 8]),
        skillBar: ordinarySkillBar()
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog,
      options: { attributeBudget: { kind: "points", points: 20 } }
    });
    const pvpAuto = validateBuild({
      build: buildFixture({
        mode: "pvp",
        attributes: attributes([attributeIds.axeMastery, 8]),
        skillBar: ordinarySkillBar()
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(explicit)).toEqual(["attribute.budget-overspent"]);
    expect(codes(pvpAuto)).toEqual(["attribute.budget-unresolved"]);
    expect(pvpAuto.valid).toBe(true);
    expect(pvpAuto.resolved).toBe(false);
  });

  it("reports rank-cost catalog gaps from catalog facts", () => {
    const result = validateBuild({
      build: buildFixture({
        attributes: attributes([attributeIds.axeMastery, 12]),
        skillBar: ordinarySkillBar()
      }),
      professionAttributes: withProfessionAttributeCatalog({
        attributePointRules: {
          ...professionAttributeCatalog.attributePointRules,
          purchasedRankCosts:
            professionAttributeCatalog.attributePointRules.purchasedRankCosts.filter(
              (row) => row.purchasedRank !== 12
            )
        }
      }),
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual(["attribute.unsupported-rank"]);
  });
});

function codes(result: ReturnType<typeof validateBuild>): readonly string[] {
  return result.issues.map((issue) => issue.code);
}
