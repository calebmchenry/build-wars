import {
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  unresolvedEquipmentSelection,
  type ArmorPiece,
  type ArmorSlot,
  type AttributeId,
  type EquipmentLoadout,
  type InsigniaId,
  type RuneId,
  type WeaponHandSelection,
  type WeaponId,
  type WeaponModifierId,
  type WeaponSet,
  type WeaponSetSlot
} from "../../../src/domain";

export const emptyEquipmentLoadout = createEmptyEquipmentLoadout();

export function loadoutWithArmor(
  overrides: Partial<Record<ArmorSlot, Partial<ArmorPiece>>>
): EquipmentLoadout {
  const base = createEmptyEquipmentLoadout();
  return {
    ...base,
    armor: base.armor.map((piece) => ({ ...piece, ...(overrides[piece.slot] ?? {}) }))
  };
}

export function loadoutWithArmorRows(armor: readonly ArmorPiece[]): EquipmentLoadout {
  return {
    ...createEmptyEquipmentLoadout(),
    armor
  };
}

export function loadoutWithWeaponSets(weaponSets: readonly WeaponSet[]): EquipmentLoadout {
  return {
    ...createEmptyEquipmentLoadout(),
    weaponSets
  };
}

export function knownRune(id: RuneId) {
  return knownEquipmentSelection(id);
}

export function knownInsignia(id: InsigniaId) {
  return knownEquipmentSelection(id);
}

export function knownAttribute(id: AttributeId) {
  return knownEquipmentSelection(id);
}

export function knownWeapon(id: WeaponId) {
  return knownEquipmentSelection(id);
}

export function knownWeaponModifier(id: WeaponModifierId) {
  return knownEquipmentSelection(id);
}

export function unresolvedSelection(reason = "fixture unresolved") {
  return unresolvedEquipmentSelection({ label: "Fixture unresolved", reason });
}

export function weaponHand(input: Partial<WeaponHandSelection> = {}): WeaponHandSelection {
  return {
    weapon: null,
    modifiers: [],
    requirement: null,
    ...input
  };
}

export function weaponSet(slot: WeaponSetSlot, input: Partial<WeaponSet> = {}): WeaponSet {
  return {
    slot,
    mainHand: null,
    offHand: null,
    ...input
  };
}
