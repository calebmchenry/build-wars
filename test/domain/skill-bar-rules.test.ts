import { describe, expect, it } from "vitest";

import { validateBuild } from "../../src/domain";
import {
  professionAttributeCatalog,
  skillsCatalog,
  skillIds
} from "../fixtures/rule-engine/catalogs";
import {
  blankBuild,
  buildFixture,
  malformedBuild,
  partialBuild,
  skillBar
} from "../fixtures/rule-engine/builds";

describe("skill-bar composition rules", () => {
  it("accepts a complete legal skill bar and aggregates blank or partial bars", () => {
    const complete = validateBuild({
      build: buildFixture(),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });
    const blank = validateBuild({
      build: blankBuild,
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });
    const partial = validateBuild({
      build: partialBuild,
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(complete.issues).toEqual([]);
    expect(codes(blank)).toEqual(["profession.primary-missing", "skill-bar.incomplete"]);
    expect(blank.issues.at(-1)?.relatedEntities).toHaveLength(8);
    expect(codes(partial)).toEqual(["skill-bar.incomplete"]);
    expect(partial.issues[0]?.relatedEntities).toHaveLength(6);
  });

  it("returns a malformed-bar issue while preserving first-eight slot evidence", () => {
    const result = validateBuild({
      build: malformedBuild({
        skillBar: [
          skillIds.healingSignet,
          skillIds.healingSignet,
          null,
          null,
          null,
          null,
          null,
          null,
          skillIds.commonOne
        ]
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual([
      "skill-bar.malformed",
      "skill-bar.incomplete",
      "skill.duplicate"
    ]);
    expect(result.truncation).toEqual({
      kind: "skill-slot-cap",
      limit: 8,
      observed: 9,
      path: ["skillBar"]
    });
    expect(result.exhaustive).toBe(false);
  });

  it("reports unresolved and dispositioned slots without compacting or replacing them", () => {
    const result = validateBuild({
      build: buildFixture({
        skillBar: skillBar(
          skillIds.unknown,
          skillIds.dispositioned,
          skillIds.commonOne,
          skillIds.commonTwo,
          skillIds.commonThree,
          skillIds.commonFour,
          skillIds.commonFive,
          skillIds.commonSix
        )
      }),
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual(["skill.unresolved", "skill.dispositioned"]);
    expect(result.issues.map((issue) => issue.location)).toEqual([
      { kind: "skill-slot", index: 0 },
      { kind: "skill-slot", index: 1 }
    ]);
  });

  it("detects duplicate resolved player skills at second and later occurrences", () => {
    const result = validateBuild({
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
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual(["skill.duplicate"]);
    expect(result.issues[0]?.path).toEqual(["skillBar", 1]);
    expect(result.issues[0]?.relatedEntities).toContainEqual({ kind: "skill-slot", id: 0 });
    expect(result.issues[0]?.relatedEntities).toContainEqual({ kind: "skill-slot", id: 1 });
  });

  it("marks second and later elite skills", () => {
    const result = validateBuild({
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
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual(["skill.elite-limit"]);
    expect(result.issues[0]?.path).toEqual(["skillBar", 1]);
  });

  it("marks fourth and later PvE-only skills in PvE mode", () => {
    const result = validateBuild({
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
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(codes(result)).toEqual(["skill.pve-only-limit"]);
    expect(result.issues[0]?.path).toEqual(["skillBar", 3]);
  });

  it("reports unsupported records as warnings and non-player records as errors", () => {
    const result = validateBuild({
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
      professionAttributes: professionAttributeCatalog,
      skills: skillsCatalog
    });

    expect(result.issues.map((issue) => [issue.code, issue.severity])).toEqual([
      ["skill.unsupported", "warning"],
      ["skill.non-player", "error"]
    ]);
  });
});

function codes(result: ReturnType<typeof validateBuild>): readonly string[] {
  return result.issues.map((issue) => issue.code);
}
