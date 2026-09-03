import {
  ARMOR_SLOTS,
  MAX_MODIFIERS_PER_HAND_TO_VALIDATE,
  WEAPON_SET_SLOTS,
  createEmptyEquipmentLoadout,
  createEmptyWeaponHandSelection,
  type ArmorPiece,
  type ArmorSlot,
  type AttributeId,
  type AuthoredWeaponRequirement,
  type Build,
  type EquipmentLoadout,
  type EquipmentSelectionState,
  type InsigniaId,
  type RuneId,
  type WeaponHandSelection,
  type WeaponId,
  type WeaponModifierId,
  type WeaponSet,
  type WeaponSetHand,
  type WeaponSetSlot
} from "../domain";

export type ArmorEquipmentField = "headgearAttribute" | "insignia" | "rune";

export type EquipmentEditorAction =
  | {
      readonly type: "set-armor-rune";
      readonly slot: ArmorSlot;
      readonly selection: EquipmentSelectionState<RuneId>;
    }
  | {
      readonly type: "set-armor-insignia";
      readonly slot: ArmorSlot;
      readonly selection: EquipmentSelectionState<InsigniaId>;
    }
  | {
      readonly type: "set-headgear-attribute";
      readonly selection: EquipmentSelectionState<AttributeId>;
    }
  | {
      readonly type: "clear-armor-field";
      readonly slot: ArmorSlot;
      readonly field: ArmorEquipmentField;
    }
  | {
      readonly type: "set-weapon";
      readonly setSlot: WeaponSetSlot;
      readonly hand: WeaponSetHand;
      readonly selection: EquipmentSelectionState<WeaponId>;
    }
  | {
      readonly type: "set-authored-unresolved-weapon";
      readonly setSlot: WeaponSetSlot;
      readonly hand: WeaponSetHand;
      readonly selection: Extract<
        EquipmentSelectionState<WeaponId>,
        { readonly kind: "unresolved" }
      >;
    }
  | {
      readonly type: "clear-weapon";
      readonly setSlot: WeaponSetSlot;
      readonly hand: WeaponSetHand;
    }
  | {
      readonly type: "set-weapon-modifier";
      readonly setSlot: WeaponSetSlot;
      readonly hand: WeaponSetHand;
      readonly modifierIndex: number;
      readonly selection: EquipmentSelectionState<WeaponModifierId>;
    }
  | {
      readonly type: "set-authored-unresolved-modifier";
      readonly setSlot: WeaponSetSlot;
      readonly hand: WeaponSetHand;
      readonly modifierIndex: number;
      readonly selection: Extract<
        EquipmentSelectionState<WeaponModifierId>,
        { readonly kind: "unresolved" }
      >;
    }
  | {
      readonly type: "clear-weapon-modifier";
      readonly setSlot: WeaponSetSlot;
      readonly hand: WeaponSetHand;
      readonly modifierIndex: number;
    }
  | {
      readonly type: "set-weapon-requirement";
      readonly setSlot: WeaponSetSlot;
      readonly hand: WeaponSetHand;
      readonly requirement: AuthoredWeaponRequirement | null;
    }
  | {
      readonly type: "clear-weapon-hand";
      readonly setSlot: WeaponSetSlot;
      readonly hand: WeaponSetHand;
    }
  | {
      readonly type: "clear-weapon-set";
      readonly setSlot: WeaponSetSlot;
    }
  | {
      readonly type: "reset-equipment";
    };

export function reduceEquipmentEditorAction(build: Build, action: EquipmentEditorAction): Build {
  switch (action.type) {
    case "set-armor-rune":
      return setArmorField(build, action.slot, "rune", action.selection);
    case "set-armor-insignia":
      return setArmorField(build, action.slot, "insignia", action.selection);
    case "set-headgear-attribute":
      return setArmorField(build, "head", "headgearAttribute", action.selection);
    case "clear-armor-field":
      return clearArmorField(build, action.slot, action.field);
    case "set-weapon":
    case "set-authored-unresolved-weapon":
      return setWeaponSelection(build, action.setSlot, action.hand, action.selection);
    case "clear-weapon":
      return clearWeaponSelection(build, action.setSlot, action.hand);
    case "set-weapon-modifier":
    case "set-authored-unresolved-modifier":
      return setWeaponModifier(
        build,
        action.setSlot,
        action.hand,
        action.modifierIndex,
        action.selection
      );
    case "clear-weapon-modifier":
      return clearWeaponModifier(build, action.setSlot, action.hand, action.modifierIndex);
    case "set-weapon-requirement":
      return setWeaponRequirement(build, action.setSlot, action.hand, action.requirement);
    case "clear-weapon-hand":
      return clearWeaponHand(build, action.setSlot, action.hand);
    case "clear-weapon-set":
      return clearWeaponSet(build, action.setSlot);
    case "reset-equipment":
      return build.equipment === null ? build : { ...build, equipment: null };
  }
}

export function hasMeaningfulEquipment(equipment: EquipmentLoadout | null): boolean {
  if (equipment === null) {
    return false;
  }
  return (
    equipment.armor.some(
      (piece) => piece.rune !== null || piece.insignia !== null || piece.headgearAttribute !== null
    ) ||
    equipment.weaponSets.some(
      (set) => handHasMeaningfulEquipment(set.mainHand) || handHasMeaningfulEquipment(set.offHand)
    )
  );
}

export function isCanonicalEmptyEquipment(equipment: EquipmentLoadout | null): boolean {
  return equipment !== null && !hasMeaningfulEquipment(equipment);
}

function setArmorField<Field extends ArmorEquipmentField>(
  build: Build,
  slot: ArmorSlot,
  field: Field,
  selection: ArmorPiece[Field]
): Build {
  if (!ARMOR_SLOTS.includes(slot)) {
    return build;
  }
  const equipment = build.equipment ?? createEmptyEquipmentLoadout();
  const current = equipment.armor.find((piece) => piece.slot === slot);
  if (current === undefined || sameSelection(current[field], selection)) {
    return build;
  }
  const armor = equipment.armor.map((piece) =>
    piece.slot === slot ? ({ ...piece, [field]: selection } as ArmorPiece) : piece
  );
  return {
    ...build,
    equipment: {
      ...equipment,
      armor
    }
  };
}

function clearArmorField(build: Build, slot: ArmorSlot, field: ArmorEquipmentField): Build {
  if (build.equipment === null || !ARMOR_SLOTS.includes(slot)) {
    return build;
  }
  const existing = build.equipment.armor.find((piece) => piece.slot === slot);
  if (existing === undefined || existing[field] === null) {
    return build;
  }
  return {
    ...build,
    equipment: {
      ...build.equipment,
      armor: build.equipment.armor.map((piece) =>
        piece.slot === slot ? ({ ...piece, [field]: null } as ArmorPiece) : piece
      )
    }
  };
}

function setWeaponSelection(
  build: Build,
  setSlot: WeaponSetSlot,
  hand: WeaponSetHand,
  selection: WeaponHandSelection["weapon"]
): Build {
  if (!WEAPON_SET_SLOTS.includes(setSlot)) {
    return build;
  }
  return updateWeaponHand(build, setSlot, hand, true, (handSelection) => ({
    ...handSelection,
    weapon: selection
  }));
}

function clearWeaponSelection(build: Build, setSlot: WeaponSetSlot, hand: WeaponSetHand): Build {
  if (build.equipment === null || !WEAPON_SET_SLOTS.includes(setSlot)) {
    return build;
  }
  return updateWeaponHand(build, setSlot, hand, false, (handSelection) =>
    compactHand({
      ...handSelection,
      weapon: null
    })
  );
}

function setWeaponModifier(
  build: Build,
  setSlot: WeaponSetSlot,
  hand: WeaponSetHand,
  modifierIndex: number,
  selection: EquipmentSelectionState<WeaponModifierId>
): Build {
  if (!validModifierIndexForWrite(modifierIndex) || !WEAPON_SET_SLOTS.includes(setSlot)) {
    return build;
  }
  return updateWeaponHand(build, setSlot, hand, true, (handSelection) => {
    if (modifierIndex > handSelection.modifiers.length) {
      return handSelection;
    }
    const modifiers =
      modifierIndex === handSelection.modifiers.length
        ? [...handSelection.modifiers, selection]
        : handSelection.modifiers.map((modifier, index) =>
            index === modifierIndex ? selection : modifier
          );
    return { ...handSelection, modifiers };
  });
}

function clearWeaponModifier(
  build: Build,
  setSlot: WeaponSetSlot,
  hand: WeaponSetHand,
  modifierIndex: number
): Build {
  if (
    build.equipment === null ||
    !validModifierIndexForWrite(modifierIndex) ||
    !WEAPON_SET_SLOTS.includes(setSlot)
  ) {
    return build;
  }
  return updateWeaponHand(build, setSlot, hand, false, (handSelection) => {
    if (modifierIndex >= handSelection.modifiers.length) {
      return handSelection;
    }
    return compactHand({
      ...handSelection,
      modifiers: handSelection.modifiers.filter((_, index) => index !== modifierIndex)
    });
  });
}

function setWeaponRequirement(
  build: Build,
  setSlot: WeaponSetSlot,
  hand: WeaponSetHand,
  requirement: AuthoredWeaponRequirement | null
): Build {
  if (requirement === null && build.equipment === null) {
    return build;
  }
  return updateWeaponHand(build, setSlot, hand, requirement !== null, (handSelection) =>
    compactHand({
      ...handSelection,
      requirement
    })
  );
}

function clearWeaponHand(build: Build, setSlot: WeaponSetSlot, hand: WeaponSetHand): Build {
  if (build.equipment === null || !WEAPON_SET_SLOTS.includes(setSlot)) {
    return build;
  }
  const set = build.equipment.weaponSets.find((candidate) => candidate.slot === setSlot);
  if (set === undefined || set[hand] === null) {
    return build;
  }
  return {
    ...build,
    equipment: {
      ...build.equipment,
      weaponSets: build.equipment.weaponSets.map((weaponSet) =>
        weaponSet.slot === setSlot ? { ...weaponSet, [hand]: null } : weaponSet
      )
    }
  };
}

function clearWeaponSet(build: Build, setSlot: WeaponSetSlot): Build {
  if (build.equipment === null || !WEAPON_SET_SLOTS.includes(setSlot)) {
    return build;
  }
  const set = build.equipment.weaponSets.find((candidate) => candidate.slot === setSlot);
  if (set === undefined || (set.mainHand === null && set.offHand === null)) {
    return build;
  }
  return {
    ...build,
    equipment: {
      ...build.equipment,
      weaponSets: build.equipment.weaponSets.map((weaponSet) =>
        weaponSet.slot === setSlot ? { ...weaponSet, mainHand: null, offHand: null } : weaponSet
      )
    }
  };
}

function updateWeaponHand(
  build: Build,
  setSlot: WeaponSetSlot,
  hand: WeaponSetHand,
  materialize: boolean,
  update: (handSelection: WeaponHandSelection) => WeaponHandSelection | null
): Build {
  if (!WEAPON_SET_SLOTS.includes(setSlot)) {
    return build;
  }
  const equipment = build.equipment ?? (materialize ? createEmptyEquipmentLoadout() : null);
  if (equipment === null) {
    return build;
  }
  const currentSet = equipment.weaponSets.find((candidate) => candidate.slot === setSlot);
  if (currentSet === undefined) {
    return build;
  }
  const currentHand = currentSet[hand] ?? (materialize ? createEmptyWeaponHandSelection() : null);
  if (currentHand === null) {
    return build;
  }
  const nextHand = update(currentHand);
  if (sameHand(currentHand, nextHand)) {
    return build;
  }
  return {
    ...build,
    equipment: {
      ...equipment,
      weaponSets: equipment.weaponSets.map((weaponSet) =>
        weaponSet.slot === setSlot ? ({ ...weaponSet, [hand]: nextHand } as WeaponSet) : weaponSet
      )
    }
  };
}

function compactHand(handSelection: WeaponHandSelection): WeaponHandSelection | null {
  return handHasMeaningfulEquipment(handSelection) ? handSelection : null;
}

function handHasMeaningfulEquipment(handSelection: WeaponHandSelection | null): boolean {
  return (
    handSelection !== null &&
    (handSelection.weapon !== null ||
      handSelection.modifiers.length > 0 ||
      handSelection.requirement !== null)
  );
}

function validModifierIndexForWrite(index: number): boolean {
  return Number.isSafeInteger(index) && index >= 0 && index < MAX_MODIFIERS_PER_HAND_TO_VALIDATE;
}

function sameHand(left: WeaponHandSelection | null, right: WeaponHandSelection | null): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameSelection(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
