import { describe, expect, it } from "vitest";

import {
  FOUNDATION_SCHEMA_VERSION,
  SKILL_BAR_SLOT_COUNT,
  type ArmorPiece,
  type Attribute,
  type Build,
  type EquipmentTemplate,
  type Guide,
  type Insignia,
  type PartyBuild,
  type Profession,
  type RecordProvenance,
  type RemoteMediaMetadata,
  type Rune,
  type Skill,
  type SkillProgression,
  type SourceReference,
  type Weapon,
  type WeaponModifier
} from "../../src/domain";
import {
  syntheticAttribute,
  syntheticFoundationBuild,
  syntheticProfession,
  syntheticSkill,
  syntheticUnknownSkillId
} from "../fixtures/foundation";

type JsonValue =
  string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };

function expectPlainJson(value: JsonValue): void {
  if (value === null || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(expectPlainJson);
    return;
  }

  expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
  Object.values(value).forEach(expectPlainJson);
}

describe("domain contracts", () => {
  it("keeps the public model surface available as framework-neutral types", () => {
    type PublicModels =
      | Profession
      | Attribute
      | Skill
      | SkillProgression
      | Rune
      | Insignia
      | ArmorPiece
      | Weapon
      | WeaponModifier
      | Build
      | EquipmentTemplate
      | PartyBuild
      | Guide
      | SourceReference
      | RecordProvenance
      | RemoteMediaMetadata;

    const publicModels: PublicModels[] = [
      syntheticProfession,
      syntheticAttribute,
      syntheticSkill,
      syntheticFoundationBuild
    ];

    expect(publicModels).toHaveLength(4);
  });

  it("requires authored roots to carry a schema version", () => {
    expect(syntheticFoundationBuild.schemaVersion).toBe(FOUNDATION_SCHEMA_VERSION);
    expect(syntheticFoundationBuild.catalogVersion).toBe("synthetic-foundation");
  });

  it("represents a build skill bar as exactly eight nullable slots", () => {
    expect(SKILL_BAR_SLOT_COUNT).toBe(8);
    expect(syntheticFoundationBuild.skillBar).toHaveLength(SKILL_BAR_SLOT_COUNT);
    expect(syntheticFoundationBuild.skillBar.slice(1)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ]);
  });

  it("preserves unknown numeric catalog identifiers through JSON", () => {
    const roundTripped = JSON.parse(JSON.stringify(syntheticFoundationBuild)) as Build;

    expect(roundTripped.skillBar[0]).toBe(syntheticUnknownSkillId);
  });

  it("round-trips authored domain data as plain JSON-compatible values", () => {
    const encoded = JSON.stringify(syntheticFoundationBuild);
    const decoded = JSON.parse(encoded) as JsonValue;

    expectPlainJson(decoded);
    expect(JSON.stringify(decoded)).toBe(encoded);
  });
});
