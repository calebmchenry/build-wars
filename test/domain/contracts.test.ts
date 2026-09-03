import { describe, expect, it } from "vitest";

import {
  FOUNDATION_SCHEMA_VERSION,
  BUILD_SCHEMA_VERSION,
  SKILL_BAR_SLOT_COUNT,
  type ArmorPiece,
  type Attribute,
  type Build,
  type CatalogInsigniaRecord,
  type CatalogRuneRecord,
  type CatalogWeaponBaseRecord,
  type CatalogWeaponModRecord,
  type EquipmentTemplate,
  type Guide,
  type Insignia,
  PARTY_ANNOTATION_SCHEMA_VERSION,
  partySlotId,
  buildSetEntryId,
  type PartyAnnotations,
  type Profession,
  type RecordProvenance,
  type RemoteMediaMetadata,
  TEMPLATE_COMPATIBILITY_SCHEMA_VERSION,
  templateEquipmentColorId,
  templateEquipmentItemId,
  templateEquipmentModifierId,
  templateEquipmentSlotId,
  type Rune,
  type RuneCatalog,
  type InsigniaCatalog,
  type Skill,
  type SkillProgression,
  type SourceReference,
  type SkillTemplateDocument,
  type EquipmentTemplateDocument,
  templateAttributeId,
  templateProfessionId,
  templateSkillId,
  type Weapon,
  type WeaponBaseCatalog,
  type WeaponModCatalog,
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
      | PartyAnnotations
      | Guide
      | SkillTemplateDocument
      | EquipmentTemplateDocument
      | SourceReference
      | RecordProvenance
      | RemoteMediaMetadata
      | CatalogInsigniaRecord
      | InsigniaCatalog
      | CatalogRuneRecord
      | RuneCatalog
      | CatalogWeaponBaseRecord
      | WeaponBaseCatalog
      | CatalogWeaponModRecord
      | WeaponModCatalog;

    const publicModels: PublicModels[] = [
      syntheticProfession,
      syntheticAttribute,
      syntheticSkill,
      syntheticFoundationBuild,
      {
        schemaVersion: PARTY_ANNOTATION_SCHEMA_VERSION,
        enabled: true,
        size: { kind: "preset", size: 2 },
        slots: [
          {
            id: partySlotId("slot-1"),
            entryId: buildSetEntryId("entry-1"),
            memberLabel: "Leader",
            role: "Frontline",
            memberKind: "player",
            memberKindLabel: null,
            notes: null
          },
          {
            id: partySlotId("slot-2"),
            entryId: null,
            memberLabel: "Member 2",
            role: null,
            memberKind: "unspecified",
            memberKindLabel: null,
            notes: null
          }
        ]
      }
    ];

    expect(publicModels).toHaveLength(5);
  });

  it("requires authored roots to carry a schema version", () => {
    expect(FOUNDATION_SCHEMA_VERSION).toBe(1);
    expect(syntheticFoundationBuild.schemaVersion).toBe(BUILD_SCHEMA_VERSION);
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

  it("keeps template profession and attribute ID namespaces distinct in JSON", () => {
    const encoded = JSON.stringify({
      professionNone: templateProfessionId(0),
      attributeZero: templateAttributeId(0),
      knownSkill: templateSkillId(1),
      equipmentSlot: templateEquipmentSlotId(0),
      equipmentItem: templateEquipmentItemId(279),
      equipmentColor: templateEquipmentColorId(9),
      equipmentModifier: templateEquipmentModifierId(190),
      unknownProfession: templateProfessionId(9876),
      unknownAttribute: templateAttributeId(9876),
      unknownSkill: templateSkillId(987654321)
    });

    expect(JSON.parse(encoded)).toEqual({
      professionNone: 0,
      attributeZero: 0,
      knownSkill: 1,
      equipmentSlot: 0,
      equipmentItem: 279,
      equipmentColor: 9,
      equipmentModifier: 190,
      unknownProfession: 9876,
      unknownAttribute: 9876,
      unknownSkill: 987654321
    });
  });

  it("defines plain JSON-compatible template compatibility documents", () => {
    const skillTemplate: SkillTemplateDocument = {
      kind: "skill",
      schemaVersion: TEMPLATE_COMPATIBILITY_SCHEMA_VERSION,
      source: {
        inputKind: "bare",
        templateKind: "skill",
        originalInput: "OAAQIAAAAAAAAAAAAAAA",
        originalBareCode: "OAAQIAAAAAAAAAAAAAAA",
        normalizedDependencyInput: null,
        templateName: null,
        semanticFingerprint: "skill-template:v1:test",
        fidelity: "exact-source"
      },
      primaryProfessionId: templateProfessionId(0),
      secondaryProfessionId: templateProfessionId(0),
      attributes: [],
      skillIds: [
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0)
      ]
    };
    const equipmentTemplate: EquipmentTemplateDocument = {
      kind: "equipment",
      schemaVersion: TEMPLATE_COMPATIBILITY_SCHEMA_VERSION,
      source: {
        inputKind: "bare",
        templateKind: "equipment",
        originalInput: "PkZwFP9FzSKA",
        originalBareCode: "PkZwFP9FzSKA",
        normalizedDependencyInput: null,
        templateName: null,
        semanticFingerprint: "equipment-template:v1:test",
        fidelity: "exact-source"
      },
      items: [
        {
          slotId: templateEquipmentSlotId(0),
          itemId: templateEquipmentItemId(279),
          colorId: templateEquipmentColorId(9),
          modifierIds: [templateEquipmentModifierId(190)]
        }
      ]
    };

    expectPlainJson(JSON.parse(JSON.stringify(skillTemplate)) as JsonValue);
    expectPlainJson(JSON.parse(JSON.stringify(equipmentTemplate)) as JsonValue);
  });

  it("round-trips authored domain data as plain JSON-compatible values", () => {
    const encoded = JSON.stringify(syntheticFoundationBuild);
    const decoded = JSON.parse(encoded) as JsonValue;

    expectPlainJson(decoded);
    expect(JSON.stringify(decoded)).toBe(encoded);
  });
});
