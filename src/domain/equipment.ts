import type { AttributeId, InsigniaId, RuneId, WeaponId, WeaponModifierId } from "./ids";

export const EQUIPMENT_LOADOUT_SCHEMA_VERSION = 1;
export const HEADGEAR_ATTRIBUTE_BONUS = 1;
export const MAX_ARMOR_ROWS_TO_VALIDATE = 32;
export const MAX_WEAPON_SET_ROWS_TO_VALIDATE = 16;
export const MAX_MODIFIERS_PER_HAND_TO_VALIDATE = 16;

export const ARMOR_SLOTS = ["head", "chest", "hands", "legs", "feet"] as const;
export const WEAPON_SET_SLOTS = ["set-1", "set-2", "set-3", "set-4"] as const;

export type ArmorSlot = (typeof ARMOR_SLOTS)[number];
export type WeaponSetSlot = (typeof WEAPON_SET_SLOTS)[number];

export interface EquipmentSelection<Id> {
  readonly kind: "known";
  readonly id: Id;
}

export interface UnresolvedEquipmentSelection {
  readonly kind: "unresolved";
  readonly label: string | null;
  readonly reason: string;
  readonly candidateCatalogId: number | null;
}

export type EquipmentSelectionState<Id> = EquipmentSelection<Id> | UnresolvedEquipmentSelection;

export interface ArmorPiece {
  readonly slot: ArmorSlot;
  readonly rune: EquipmentSelectionState<RuneId> | null;
  readonly insignia: EquipmentSelectionState<InsigniaId> | null;
  readonly headgearAttribute: EquipmentSelectionState<AttributeId> | null;
}

export interface AuthoredWeaponRequirement {
  readonly attribute: EquipmentSelectionState<AttributeId> | null;
  readonly rank: number | null;
  readonly reason: "catalog-unresolved" | "user-visible-placeholder";
}

export interface WeaponHandSelection {
  readonly weapon: EquipmentSelectionState<WeaponId> | null;
  readonly modifiers: readonly EquipmentSelectionState<WeaponModifierId>[];
  readonly requirement: AuthoredWeaponRequirement | null;
}

export interface WeaponSet {
  readonly slot: WeaponSetSlot;
  readonly mainHand: WeaponHandSelection | null;
  readonly offHand: WeaponHandSelection | null;
}

export interface EquipmentLoadout {
  readonly schemaVersion: typeof EQUIPMENT_LOADOUT_SCHEMA_VERSION;
  readonly armor: readonly ArmorPiece[];
  readonly weaponSets: readonly WeaponSet[];
}

/**
 * @deprecated Use EquipmentLoadout for authored semantic equipment state. Raw
 * equipment template documents live in src/domain/template.ts.
 */
export type EquipmentTemplate = EquipmentLoadout;

export type Weapon = WeaponHandSelection;
export type WeaponModifier = EquipmentSelectionState<WeaponModifierId>;

const DEFAULT_UNRESOLVED_REASON = "selection unresolved";
const MAX_SELECTION_LABEL_LENGTH = 120;
const MAX_SELECTION_REASON_LENGTH = 240;

export function knownEquipmentSelection<Id>(id: Id): EquipmentSelection<Id> {
  return { kind: "known", id };
}

export function unresolvedEquipmentSelection(input: {
  readonly label?: string | null;
  readonly reason: string;
  readonly candidateCatalogId?: number | null;
}): UnresolvedEquipmentSelection {
  return {
    kind: "unresolved",
    label: boundNullableString(input.label ?? null, MAX_SELECTION_LABEL_LENGTH),
    reason: boundNonEmptyString(
      input.reason,
      DEFAULT_UNRESOLVED_REASON,
      MAX_SELECTION_REASON_LENGTH
    ),
    candidateCatalogId:
      typeof input.candidateCatalogId === "number" &&
      Number.isSafeInteger(input.candidateCatalogId) &&
      input.candidateCatalogId >= 0
        ? input.candidateCatalogId
        : null
  };
}

export function createEmptyArmorPiece(slot: ArmorSlot): ArmorPiece {
  return {
    slot,
    rune: null,
    insignia: null,
    headgearAttribute: null
  };
}

export function createEmptyWeaponHandSelection(): WeaponHandSelection {
  return {
    weapon: null,
    modifiers: [],
    requirement: null
  };
}

export function createEmptyWeaponSet(slot: WeaponSetSlot): WeaponSet {
  return {
    slot,
    mainHand: null,
    offHand: null
  };
}

export function createEmptyEquipmentLoadout(): EquipmentLoadout {
  return {
    schemaVersion: EQUIPMENT_LOADOUT_SCHEMA_VERSION,
    armor: ARMOR_SLOTS.map((slot) => createEmptyArmorPiece(slot)),
    weaponSets: WEAPON_SET_SLOTS.map((slot) => createEmptyWeaponSet(slot))
  };
}

export function isArmorSlot(value: unknown): value is ArmorSlot {
  return typeof value === "string" && (ARMOR_SLOTS as readonly string[]).includes(value);
}

export function isWeaponSetSlot(value: unknown): value is WeaponSetSlot {
  return typeof value === "string" && (WEAPON_SET_SLOTS as readonly string[]).includes(value);
}

function boundNullableString(value: string | null, maxLength: number): string | null {
  if (value === null) {
    return null;
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return null;
  }
  return normalized.length <= maxLength ? normalized : normalized.slice(0, maxLength);
}

function boundNonEmptyString(value: string, fallback: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return fallback;
  }
  return normalized.length <= maxLength ? normalized : normalized.slice(0, maxLength);
}
