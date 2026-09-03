import {
  catalogId,
  templateEquipmentModifierId,
  type ArmorSlot,
  type CatalogFieldProvenance,
  type CatalogInsigniaRecord,
  type CatalogRuneRecord,
  type CatalogWeaponBaseRecord,
  type CatalogWeaponModRecord,
  type EquipmentRuneCatalogView,
  type InsigniaCondition,
  type InsigniaEffectCombination,
  type RuneId,
  type WeaponAllowedModifierSlot,
  type WeaponId,
  type WeaponModifierId
} from "../../../src/domain";
import { attributeIds, professionIds } from "./catalogs";

const provenance: CatalogFieldProvenance = {
  sourceIds: ["fixture:equipment"],
  claimIds: ["claim:equipment"],
  reviewIds: [],
  notes: "Synthetic non-authoritative equipment fixture fact."
};

export const runeIds = {
  minorAxe: catalogId<"Rune">(69) as RuneId,
  superiorAxe: catalogId<"Rune">(95) as RuneId,
  rangerMarksmanship: catalogId<"Rune">(201) as RuneId,
  vigor: catalogId<"Rune">(202) as RuneId
};

export const weaponIds = {
  sword: catalogId<"Weapon">(301) as WeaponId,
  bow: catalogId<"Weapon">(302) as WeaponId,
  shield: catalogId<"Weapon">(303) as WeaponId,
  staff: catalogId<"Weapon">(304) as WeaponId,
  focus: catalogId<"Weapon">(305) as WeaponId
};

export const weaponModifierIds = {
  swordPrefix: catalogId<"WeaponModifier">(401) as WeaponModifierId,
  swordSuffix: catalogId<"WeaponModifier">(402) as WeaponModifierId,
  secondSwordSuffix: catalogId<"WeaponModifier">(403) as WeaponModifierId,
  staffHead: catalogId<"WeaponModifier">(404) as WeaponModifierId,
  indeterminate: catalogId<"WeaponModifier">(405) as WeaponModifierId
};

export const equipmentRuneCatalog = {
  catalogVersion: "fixture-runes-v1",
  records: [
    attributeRune({
      id: runeIds.minorAxe,
      name: "Rune of Minor Axe Mastery",
      attributeId: attributeIds.axeMastery,
      amount: 1,
      professionId: professionIds.warrior
    }),
    attributeRune({
      id: runeIds.superiorAxe,
      name: "Rune of Superior Axe Mastery",
      attributeId: attributeIds.axeMastery,
      amount: 3,
      professionId: professionIds.warrior
    }),
    attributeRune({
      id: runeIds.rangerMarksmanship,
      name: "Rune of Marksmanship",
      attributeId: attributeIds.marksmanship,
      amount: 1,
      professionId: professionIds.ranger
    }),
    {
      ...attributeRune({
        id: runeIds.vigor,
        name: "Rune of Vigor",
        attributeId: attributeIds.tactics,
        amount: 0,
        professionId: null
      }),
      familyKind: "vigor",
      eligibility: "universal-armor",
      affectedAttributeId: null,
      effects: [
        {
          kind: "maximum-health-delta",
          amount: 30,
          unit: "health",
          target: "character",
          stacking: { rule: "highest", groupKey: "vigor", notes: null },
          provenance
        }
      ]
    } satisfies CatalogRuneRecord
  ]
} satisfies EquipmentRuneCatalogView;

function attributeRune(input: {
  readonly id: RuneId;
  readonly name: string;
  readonly attributeId: CatalogRuneRecord["affectedAttributeId"];
  readonly amount: number;
  readonly professionId: CatalogRuneRecord["professionId"];
}): CatalogRuneRecord {
  return {
    id: input.id,
    templateModifierId: templateEquipmentModifierId(Number(input.id)),
    name: input.name,
    normalizedName: input.name.toLowerCase().replace(/\s+/g, "-"),
    wikiUrl: "https://wiki.guildwars.com/wiki/Rune",
    pageIdentity: pageIdentity(input.name),
    familyKey: `attribute:${input.attributeId === null ? "none" : Number(input.attributeId)}`,
    familyKind: "attribute",
    familyRank: input.amount >= 3 ? "superior" : input.amount >= 2 ? "major" : "minor",
    rarityTier: input.amount >= 3 ? "superior" : input.amount >= 2 ? "major" : "minor",
    eligibility: input.professionId === null ? "universal-armor" : "profession-armor",
    professionId: input.professionId,
    affectedAttributeId: input.attributeId,
    effects:
      input.attributeId === null || input.amount <= 0
        ? []
        : [
            {
              kind: "attribute-rank",
              attributeId: input.attributeId,
              amount: input.amount,
              unit: "rank",
              target: "attribute",
              stacking: {
                rule: "highest",
                groupKey: `attribute:${Number(input.attributeId)}`,
                notes: null
              },
              provenance
            }
          ],
    headgearInteraction: "attribute-linked",
    displayState: "structured-only",
    iconId: null,
    provenance
  };
}

const alwaysCondition: InsigniaCondition = { kind: "always", provenance };
const sumCombination: InsigniaEffectCombination = {
  rule: "sum",
  groupKey: "fixture-insignia",
  notes: null
};

export const insigniaIds = {
  survivor: catalogId<"Insignia">(501),
  warrior: catalogId<"Insignia">(502),
  chestOnly: catalogId<"Insignia">(503)
};

export const equipmentInsigniaCatalog = {
  catalogVersion: "fixture-insignias-v1",
  records: [
    insignia("Survivor Insignia", insigniaIds.survivor, null, [
      "head",
      "chest",
      "hands",
      "legs",
      "feet"
    ]),
    insignia("Warrior Insignia", insigniaIds.warrior, professionIds.warrior, [
      "head",
      "chest",
      "hands",
      "legs",
      "feet"
    ]),
    insignia("Chest Insignia", insigniaIds.chestOnly, null, ["chest"])
  ]
};

function insignia(
  name: string,
  id: CatalogInsigniaRecord["id"],
  professionId: CatalogInsigniaRecord["professionId"],
  applicableSlots: readonly ArmorSlot[]
): CatalogInsigniaRecord {
  return {
    id,
    sourceKey: name.toLowerCase(),
    variantKey: null,
    name,
    normalizedName: name.toLowerCase().replace(/\s+/g, "-"),
    wikiUrl: "https://wiki.guildwars.com/wiki/Insignia",
    pageIdentity: pageIdentity(name),
    familyKey: name.toLowerCase(),
    availability: professionId === null ? "common" : "profession-specific",
    professionId,
    modeAvailability: "both",
    applicableSlots,
    templateModifiers: [
      {
        templateModifierId: templateEquipmentModifierId(Number(id)),
        status: "active",
        mode: "both",
        scope: "armor-prefix",
        provenance
      }
    ],
    effects: [
      {
        id: `${name}:effect`,
        kind: "maximum-health-delta",
        unit: "health",
        modeAvailability: "both",
        applicationScope: "armor-piece-local",
        condition: alwaysCondition,
        combination: sumCombination,
        slotOutcomes: {
          head: { kind: "value", amount: 10, unit: "health", precision: "integer", provenance },
          chest: { kind: "value", amount: 15, unit: "health", precision: "integer", provenance },
          hands: { kind: "value", amount: 10, unit: "health", precision: "integer", provenance },
          legs: { kind: "value", amount: 10, unit: "health", precision: "integer", provenance },
          feet: { kind: "value", amount: 10, unit: "health", precision: "integer", provenance }
        },
        provenance
      }
    ],
    effectCompleteness: "structured",
    displayState: "structured-only",
    iconId: null,
    provenance
  };
}

export const equipmentWeaponCatalog = {
  catalogVersion: "fixture-weapons-v1",
  catalogSetVersion: "fixture-weapon-set-v1",
  catalogSetDigest: "fixture-weapon-set-digest",
  records: [
    weapon("Sword", weaponIds.sword, "main-hand", "one-handed", [
      slot("prefix", "zero-or-one", ["weapon-prefix"]),
      slot("suffix", "zero-or-one", ["weapon-suffix"])
    ]),
    weapon("Flatbow", weaponIds.bow, "two-hand", "two-handed", [
      slot("prefix", "zero-or-one", ["weapon-prefix"]),
      slot("suffix", "zero-or-one", ["weapon-suffix"])
    ]),
    weapon("Shield", weaponIds.shield, "off-hand", "off-hand", [
      slot("shield-handle", "zero-or-one", ["shield-offhand"])
    ]),
    weapon("Staff", weaponIds.staff, "two-hand", "two-handed", [
      slot("staff-head", "zero-or-one", ["staff-head"]),
      slot("staff-wrapping", "zero-or-one", ["staff-wrapping"])
    ]),
    weapon("Focus", weaponIds.focus, "off-hand", "off-hand", [
      slot("focus-core", "zero-or-one", ["caster"])
    ])
  ]
};

export const equipmentWeaponModifierCatalog = {
  catalogVersion: "fixture-weapon-mods-v1",
  catalogSetVersion: "fixture-weapon-set-v1",
  catalogSetDigest: "fixture-weapon-set-digest",
  records: [
    weaponModifier(
      "Sundering Sword Hilt",
      weaponModifierIds.swordPrefix,
      "weapon-prefix",
      "prefix"
    ),
    weaponModifier(
      "Fortitude Sword Pommel",
      weaponModifierIds.swordSuffix,
      "weapon-suffix",
      "suffix"
    ),
    weaponModifier(
      "Second Fortitude Sword Pommel",
      weaponModifierIds.secondSwordSuffix,
      "weapon-suffix",
      "suffix"
    ),
    weaponModifier(
      "Insightful Staff Head",
      weaponModifierIds.staffHead,
      "staff-head",
      "staff-head"
    ),
    {
      ...weaponModifier(
        "Unresolved Grip",
        weaponModifierIds.indeterminate,
        "weapon-suffix",
        "suffix"
      ),
      applicability: {
        kind: "unresolved",
        reason: "fixture unresolved applicability",
        sourceText: null,
        provenance
      }
    } satisfies CatalogWeaponModRecord
  ]
};

function weapon(
  name: string,
  id: WeaponId,
  equipRole: CatalogWeaponBaseRecord["equipRole"],
  handedness: CatalogWeaponBaseRecord["handedness"],
  allowedModifierSlots: readonly WeaponAllowedModifierSlot[]
): CatalogWeaponBaseRecord {
  return {
    id,
    sourceKey: name.toLowerCase(),
    variantKey: name.toLowerCase(),
    name,
    normalizedName: name.toLowerCase(),
    wikiUrl: "https://wiki.guildwars.com/wiki/Weapon",
    pageIdentity: pageIdentity(name),
    familyKey: name.toLowerCase(),
    family: name.toLowerCase(),
    variant: null,
    equipRole,
    handedness,
    modeAvailability: "both",
    damage: { kind: "not-applicable", reason: "fixture", provenance },
    requirement:
      equipRole === "off-hand"
        ? {
            kind: "attribute-rank",
            attributeId: attributeIds.tactics,
            attributeName: "Tactics",
            rank: 9,
            provenance
          }
        : { kind: "none", reason: "fixture", provenance },
    allowedModifierSlots,
    templateItems: [],
    displayState: "structured-only",
    iconId: null,
    provenance
  };
}

function weaponModifier(
  name: string,
  id: WeaponModifierId,
  family: CatalogWeaponModRecord["family"],
  occupiedSlot: CatalogWeaponModRecord["occupiedSlot"]
): CatalogWeaponModRecord {
  return {
    id,
    sourceKey: name.toLowerCase(),
    variantKey: name.toLowerCase(),
    name,
    normalizedName: name.toLowerCase(),
    wikiUrl: "https://wiki.guildwars.com/wiki/Weapon_upgrade",
    pageIdentity: pageIdentity(name),
    familyKey: family,
    family,
    occupiedSlot,
    applicableWeaponFamilies: ["sword", "staff"],
    applicability: { kind: "specific-families", familyKeys: ["sword", "staff"], provenance },
    modeAvailability: "both",
    templateModifiers: [],
    effects: [],
    effectCompleteness: "structured",
    displayState: "structured-only",
    iconId: null,
    provenance
  };
}

function slot(
  slotName: WeaponAllowedModifierSlot["slot"],
  cardinality: WeaponAllowedModifierSlot["cardinality"],
  compatibleModifierFamilies: WeaponAllowedModifierSlot["compatibleModifierFamilies"]
): WeaponAllowedModifierSlot {
  return { slot: slotName, cardinality, compatibleModifierFamilies, provenance };
}

function pageIdentity(title: string) {
  return {
    requestedTitle: title,
    normalizedTitle: title,
    canonicalTitle: title,
    pageId: 1,
    revisionId: 1,
    sourceRevisionTimestamp: "2026-09-01T00:00:00Z",
    redirectedFrom: null
  };
}
