import type {
  ArmorPieceId,
  AttributeId,
  InsigniaId,
  RuneId,
  WeaponId,
  WeaponModifierId
} from "./ids";
import type { AuthoredDocumentRoot } from "./source";

export type ArmorSlot = "head" | "chest" | "hands" | "legs" | "feet";
export type WeaponSetSlot = "set-1" | "set-2" | "set-3" | "set-4";

export interface ArmorPiece {
  readonly id: ArmorPieceId | null;
  readonly slot: ArmorSlot;
  readonly armorRating: number | null;
  readonly runeId: RuneId | null;
  readonly insigniaId: InsigniaId | null;
  readonly attributeBonusId: AttributeId | null;
}

export interface WeaponModifier {
  readonly id: WeaponModifierId;
  readonly name: string;
}

export interface Weapon {
  readonly id: WeaponId | null;
  readonly requirementAttributeId: AttributeId | null;
  readonly modifiers: readonly (WeaponModifierId | null)[];
}

export interface WeaponSet {
  readonly slot: WeaponSetSlot;
  readonly mainHand: Weapon | null;
  readonly offHand: Weapon | null;
}

export interface EquipmentTemplate extends AuthoredDocumentRoot {
  readonly armor: readonly ArmorPiece[];
  readonly weaponSets: readonly WeaponSet[];
}
