import { describe, expect, it } from "vitest";
import {
  calculateSkillAttributeEffects,
  catalogId,
  type SkillInherentRanks,
  type SkillMode,
  type SkillTypeId,
  type SkillValueState
} from "../../src/domain";

describe("inherent skill attribute effects", () => {
  it.each<SkillTypeId>(["stance", "preparation", "shout", "bow-attack", "nature-ritual"])(
    "discounts Ranger %s skills regardless of their linked attribute",
    (type) =>
      expect(effects({ profession: 2, type }, { expertise: 12 }).energy).toMatchObject({
        kind: "modified",
        baseValue: 10,
        effectiveValue: 5,
        rank: 12
      })
  );

  it.each<SkillTypeId>([
    "dual-attack",
    "spear-attack",
    "binding-ritual",
    "ebon-vanguard-ritual",
    "touch-spell",
    "touch-skill"
  ])("discounts non-Ranger %s skills", (type) =>
    expect(effects({ profession: 4, type }, { expertise: 12 }).energy).toMatchObject({
      effectiveValue: 5
    })
  );

  it.each<SkillTypeId>(["spell", "enchantment-spell", "stance", "chant"])(
    "does not discount non-Ranger %s skills with Expertise",
    (type) =>
      expect(effects({ profession: 4, type }, { expertise: 12 }).energy.kind).toBe("unchanged")
  );

  it.each<SkillTypeId>(["enchantment-spell", "flash-enchantment-spell"])(
    "discounts Dervish %s skills with Mysticism",
    (type) =>
      expect(effects({ profession: 10, type, energy: 5 }, { mysticism: 13 }).energy).toMatchObject({
        effectiveValue: 2,
        attribute: "mysticism"
      })
  );

  it("excludes other enchantments, Dervish forms, ordinary spells, and attacks from Mysticism", () => {
    for (const args of [
      { profession: 3, type: "enchantment-spell" as const },
      { profession: 10, type: "form" as const },
      { profession: 10, type: "spell" as const },
      { profession: 10, type: "scythe-attack" as const }
    ]) {
      expect(effects(args, { mysticism: 15 }).energy.kind).toBe("unchanged");
    }
  });

  it.each([
    [2, 5],
    [3, 4],
    [7, 4],
    [8, 3],
    [12, 3],
    [13, 2],
    [17, 2],
    [18, 1]
  ])("matches the 5-energy breakpoint at rank %i", (rank, expected) => {
    const effect = effects({ energy: 5 }, { expertise: rank }).energy;
    expect(effect.kind === "modified" ? effect.effectiveValue : 5).toBe(expected);
  });

  it("does not mark unchanged rounding results or invent a minimum energy cost", () => {
    expect(effects({ energy: 5 }, { expertise: 2 }).energy.kind).toBe("unchanged");
    expect(effects({ energy: 1 }, { expertise: 13 }).energy).toMatchObject({ effectiveValue: 0 });
    expect(effects({ energy: 0 }, { expertise: 20 }).energy.kind).toBe("unchanged");
  });

  it.each<SkillMode>(["pve", "pvp"])("uses exponential activation scaling in %s", (mode) => {
    for (const type of ["spell", "hex-spell", "signet"] as const) {
      expect(
        effects({ profession: 5, type, activation: 1 }, { fastCasting: 15 }, mode).activation
      ).toMatchObject({ effectiveValue: 0.5, pveOnly: false });
    }
  });

  it("uses the original two-second threshold for non-Mesmer spells and signets", () => {
    for (const type of ["spell", "signet"] as const) {
      expect(
        effects({ profession: 3, type, activation: "{{3/2}}" }, { fastCasting: 15 }).activation.kind
      ).toBe("unchanged");
      expect(
        effects({ profession: 3, type, activation: 2 }, { fastCasting: 15 }).activation
      ).toMatchObject({ effectiveValue: 1 });
    }
    expect(
      effects({ profession: 5, type: "chant", activation: 2 }, { fastCasting: 15 }).activation.kind
    ).toBe("unchanged");
  });

  it.each([
    ["{{1/4}}", 0.144],
    ["{{3/4}}", 0.431],
    ["{{1/2}}", 0.287],
    ["{{3/2}}", 0.862],
    ["{{1.5}}", 0.862],
    ["1", 0.574]
  ])("normalizes %s and rounds adjusted activation to milliseconds", (activation, expected) =>
    expect(
      effects({ profession: 5, type: "spell", activation }, { fastCasting: 12 }).activation
    ).toMatchObject({ effectiveValue: expected })
  );

  it.each([
    [15, 12, 10],
    [15, 13, 9],
    [15, 10, 11],
    [30, 15, 17]
  ])("rounds a %i-second recharge at Fast Casting %i to %i", (recharge, rank, expected) =>
    expect(
      effects({ profession: 5, type: "hex-spell", recharge }, { fastCasting: rank }).recharge
    ).toMatchObject({ effectiveValue: expected, pveOnly: true })
  );

  it("preserves the one-second recharge floor, zero, absent, and special recharge", () => {
    for (const recharge of [1, 0, null]) {
      expect(
        effects({ profession: 5, type: "spell", recharge }, { fastCasting: 20 }).recharge.kind
      ).toBe("unchanged");
    }
    expect(
      effects({ profession: 5, type: "spell", recharge: "morale boost" }, { fastCasting: 12 })
        .recharge
    ).toEqual({ kind: "unresolved", reason: "unsupported-value" });
  });

  it("does not reduce signet, non-Mesmer, or PvP recharge", () => {
    expect(effects({ profession: 5, type: "signet" }, { fastCasting: 15 }).recharge.kind).toBe(
      "unchanged"
    );
    expect(effects({ profession: 6, type: "spell" }, { fastCasting: 15 }).recharge.kind).toBe(
      "unchanged"
    );
    expect(
      effects({ profession: 5, type: "spell" }, { fastCasting: 15 }, "pvp").recharge.kind
    ).toBe("unchanged");
  });

  it("caps inherent ranks and preserves uncertainty without changing input values", () => {
    expect(effects({}, { expertise: 25 }).energy).toMatchObject({ effectiveValue: 2, rank: 20 });
    expect(effects({}, { expertise: null }).energy).toEqual({
      kind: "unresolved",
      reason: "unknown-rank"
    });
    expect(effects({}, { expertise: NaN }).energy).toEqual({
      kind: "unresolved",
      reason: "unknown-rank"
    });
    expect(
      effects({ profession: 5, type: "spell" }, { fastCasting: 12 }, "unknown").recharge
    ).toEqual({ kind: "unresolved", reason: "unknown-mode" });
  });

  it.each(["{{1/0}}", "{{1/4}} trailing", "{{variable}}", "-1", "NaN"])(
    "preserves unsupported activation %s",
    (activation) =>
      expect(
        effects({ profession: 3, type: "spell", activation }, { fastCasting: 12 }).activation
      ).toEqual({ kind: "unresolved", reason: "unsupported-value" })
  );
});

function effects(
  {
    profession = 2,
    type = "bow-attack",
    energy = 10,
    activation = 2,
    recharge = 15
  }: {
    profession?: number;
    type?: SkillTypeId;
    energy?: number | string | null;
    activation?: number | string | null;
    recharge?: number | string | null;
  },
  ranks: Partial<SkillInherentRanks>,
  mode: SkillMode | "unknown" = "pve"
) {
  const skill = {
    professionId: catalogId<"Profession">(profession),
    typeId: type,
    costs: {
      energy: value(energy),
      adrenaline: value(null),
      upkeep: value(null),
      sacrifice: value(null),
      overcast: value(null)
    },
    timings: {
      activation: value(activation),
      recharge: value(recharge),
      moraleBoostRecharge: value(null)
    }
  };
  const before = JSON.stringify(skill);
  const result = calculateSkillAttributeEffects({
    skill,
    ranks: { expertise: 0, mysticism: 0, fastCasting: 0, ...ranks },
    mode
  });
  expect(JSON.stringify(skill)).toBe(before);
  return result;
}

function value(input: number | string | null): SkillValueState {
  return {
    state:
      input === null
        ? "absent"
        : typeof input === "string"
          ? "special"
          : input === 0
            ? "zero"
            : "number",
    value: typeof input === "number" ? input : null,
    text: input === null ? null : String(input),
    unit: null,
    source: null
  };
}
