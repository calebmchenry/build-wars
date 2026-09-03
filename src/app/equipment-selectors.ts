import {
  ARMOR_SLOTS,
  HEADGEAR_ATTRIBUTE_BONUS,
  WEAPON_SET_SLOTS,
  analyzeWeaponSet,
  calculateEffectiveAttributeRank,
  collectEquipmentAttributeRankAdjustments,
  equipmentAdjustmentsForAttribute,
  knownEquipmentSelection,
  resolveInsigniaEffectsForArmorSlot,
  type ArmorPiece,
  type ArmorSlot,
  type AttributeId,
  type CatalogInsigniaRecord,
  type CatalogRuneRecord,
  type CatalogWeaponBaseRecord,
  type CatalogWeaponModRecord,
  type EquipmentLoadout,
  type EquipmentSelectionState,
  type InsigniaId,
  type RuneId,
  type ValidationIssue,
  type ValidationResult,
  type WeaponAllowedModifierSlot,
  type WeaponHandAnalysis,
  type WeaponHandSelection,
  type WeaponId,
  type WeaponModifierId,
  type WeaponModifierSlot,
  type WeaponSet,
  type WeaponSetAnalysis,
  type WeaponSetHand,
  type WeaponSetSlot
} from "../domain";
import type {
  AppCatalogViews,
  EquipmentCatalogReadiness,
  EquipmentCatalogReadinessMap
} from "./catalogs";
import { hasMeaningfulEquipment } from "./equipment-editor-state";
import type { EditorState } from "./editor-state";

export const EQUIPMENT_PICKER_RESULT_LIMIT = 80;

export type EquipmentSelectedState = "empty" | "known" | "retained" | "unresolved";

export interface EquipmentSelectedValueView {
  readonly state: EquipmentSelectedState;
  readonly label: string;
  readonly detail: string | null;
  readonly catalogId: number | null;
}

export interface EquipmentSelectOption<Id> {
  readonly id: string;
  readonly label: string;
  readonly detail: string | null;
  readonly disabled: boolean;
  readonly disabledReason: string | null;
  readonly retained: boolean;
  readonly selection: EquipmentSelectionState<Id>;
}

export interface ArmorEquipmentSlotView {
  readonly slot: ArmorSlot;
  readonly label: string;
  readonly rune: EquipmentSelectedValueView;
  readonly runeOptions: readonly EquipmentSelectOption<RuneId>[];
  readonly insignia: EquipmentSelectedValueView;
  readonly insigniaOptions: readonly EquipmentSelectOption<InsigniaId>[];
  readonly headgearAttribute: EquipmentSelectedValueView;
  readonly headgearOptions: readonly EquipmentSelectOption<AttributeId>[];
  readonly headgearAvailable: boolean;
  readonly summary: readonly string[];
  readonly issues: readonly ValidationIssue[];
}

export interface WeaponModifierControlView {
  readonly key: string;
  readonly label: string;
  readonly slot: WeaponModifierSlot | null;
  readonly modifierIndex: number;
  readonly selected: EquipmentSelectedValueView;
  readonly options: readonly EquipmentSelectOption<WeaponModifierId>[];
  readonly disabled: boolean;
  readonly disabledReason: string | null;
  readonly issues: readonly ValidationIssue[];
}

export interface WeaponHandView {
  readonly hand: WeaponSetHand;
  readonly label: string;
  readonly selectedWeapon: EquipmentSelectedValueView;
  readonly weaponOptions: readonly EquipmentSelectOption<WeaponId>[];
  readonly modifierControls: readonly WeaponModifierControlView[];
  readonly requirementNotes: readonly string[];
  readonly issues: readonly ValidationIssue[];
  readonly canClear: boolean;
}

export interface WeaponSetView {
  readonly slot: WeaponSetSlot;
  readonly label: string;
  readonly occupancy: string;
  readonly mainHand: WeaponHandView;
  readonly offHand: WeaponHandView;
  readonly issues: readonly ValidationIssue[];
  readonly canClear: boolean;
}

export interface EquipmentSummaryView {
  readonly hasMaterializedEquipment: boolean;
  readonly hasMeaningfulEquipment: boolean;
  readonly selectedUpgradeCount: number;
  readonly unresolvedCount: number;
  readonly healthDelta: number;
  readonly energyDelta: number;
  readonly globalNotes: readonly string[];
  readonly weaponSetNotes: readonly string[];
  readonly attribution: readonly string[];
  readonly validationUnavailable: readonly string[];
}

export interface EquipmentPanelView {
  readonly buildName: string;
  readonly hasMaterializedEquipment: boolean;
  readonly hasMeaningfulEquipment: boolean;
  readonly validationIssueCount: number;
  readonly readiness: EquipmentCatalogReadinessMap;
  readonly readinessList: readonly EquipmentCatalogReadiness[];
  readonly summary: EquipmentSummaryView;
  readonly armorSlots: readonly ArmorEquipmentSlotView[];
  readonly weaponSets: readonly WeaponSetView[];
}

const MODIFIER_SLOT_ORDER: readonly WeaponModifierSlot[] = [
  "prefix",
  "suffix",
  "inscription",
  "staff-head",
  "staff-wrapping",
  "shield-handle",
  "focus-core",
  "caster",
  "intrinsic"
];

export function selectHasMeaningfulEquipment(equipment: EquipmentLoadout | null): boolean {
  return hasMeaningfulEquipment(equipment);
}

export function selectEquipmentPanelView(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationResult
): EquipmentPanelView {
  const equipment = state.build.equipment;
  const loadout = equipment ?? emptyViewLoadout();
  const equipmentIssues = validation.issues.filter((issue) => issue.code.startsWith("equipment."));
  const armorSlots = ARMOR_SLOTS.map((slot, index) =>
    selectArmorSlotView(state, catalogs, validation, armorPieceForSlot(loadout, slot), index)
  );
  const weaponSets = WEAPON_SET_SLOTS.map((slot, index) =>
    selectWeaponSetView(state, catalogs, validation, weaponSetForSlot(loadout, slot), index)
  );
  return {
    buildName: state.build.name,
    hasMaterializedEquipment: equipment !== null,
    hasMeaningfulEquipment: hasMeaningfulEquipment(equipment),
    validationIssueCount: equipmentIssues.length,
    readiness: catalogs.equipment.readiness,
    readinessList: Object.values(catalogs.equipment.readiness),
    summary: selectEquipmentSummary(state, catalogs, validation),
    armorSlots,
    weaponSets
  };
}

export function selectEquipmentSummary(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationResult
): EquipmentSummaryView {
  const equipment = state.build.equipment;
  const loadout = equipment ?? emptyViewLoadout();
  const globalNotes: string[] = [];
  const weaponSetNotes: string[] = [];
  const attribution = Object.values(catalogs.equipment.readiness)
    .filter((readiness) => readiness.status === "ready")
    .map((readiness) => `${readiness.label}: ${readiness.catalogVersion ?? "unversioned"}`);
  const validationUnavailable = validation.issues
    .filter((issue) => issue.code === "equipment.catalog-unavailable")
    .map((issue) => issue.message);
  let selectedUpgradeCount = 0;
  let unresolvedCount = 0;
  const healthEffects: DeltaEffect[] = [];
  const energyEffects: DeltaEffect[] = [];

  for (const piece of loadout.armor) {
    const rune = resolveKnownRecord(piece.rune, catalogs.equipment.runes);
    const insignia = resolveKnownRecord(piece.insignia, catalogs.equipment.insignias);
    selectedUpgradeCount += countSelection(piece.rune) + countSelection(piece.insignia);
    unresolvedCount += countUnresolved(piece.rune) + countUnresolved(piece.insignia);
    if (piece.headgearAttribute !== null) {
      selectedUpgradeCount += 1;
      unresolvedCount += piece.headgearAttribute.kind === "unresolved" ? 1 : 0;
    }
    if (rune !== null) {
      collectRuneSummaryEffects(rune, healthEffects, energyEffects, globalNotes);
    } else if (piece.rune !== null) {
      collectMissingSelectionNote("rune", piece.rune, globalNotes);
    }
    if (insignia !== null) {
      collectInsigniaSummaryEffects(
        piece.slot,
        insignia,
        healthEffects,
        energyEffects,
        globalNotes
      );
    } else if (piece.insignia !== null) {
      collectMissingSelectionNote("insignia", piece.insignia, globalNotes);
    }
  }

  const adjustments = collectEquipmentAttributeRankAdjustments({
    build: state.build,
    professionAttributes: catalogs.validation.professionAttributes,
    ...(catalogs.equipment.validation.runes === undefined
      ? {}
      : { runes: catalogs.equipment.validation.runes })
  });
  adjustments.adjustments.forEach((adjustment) => {
    const attribute = catalogs.attributes.find(
      (candidate) => Number(candidate.id) === Number(adjustment.attributeId)
    );
    globalNotes.push(
      `${attribute?.name ?? `Attribute ${Number(adjustment.attributeId)}`} ${
        adjustment.adjustment.amount >= 0 ? "+" : ""
      }${adjustment.adjustment.amount} from ${adjustment.source}.`
    );
  });
  unresolvedCount += adjustments.unresolved.length;

  for (const [setIndex, weaponSet] of loadout.weaponSets.entries()) {
    const analysis = analyzeWeaponSet({
      build: state.build,
      professionAttributes: catalogs.validation.professionAttributes,
      rankAdjustments: adjustments.adjustments,
      rankAdjustmentsUnresolved: adjustments.unresolved.length > 0,
      weaponSet,
      setIndex,
      ...(catalogs.equipment.validation.weapons === undefined
        ? {}
        : { weapons: catalogs.equipment.validation.weapons }),
      ...(catalogs.equipment.validation.weaponModifiers === undefined
        ? {}
        : { weaponModifiers: catalogs.equipment.validation.weaponModifiers })
    });
    for (const hand of [analysis.mainHand, analysis.offHand]) {
      if (hand.selection !== null) {
        selectedUpgradeCount += countSelection(hand.selection.weapon);
        selectedUpgradeCount += hand.selection.modifiers.length;
        unresolvedCount += countUnresolved(hand.selection.weapon);
        unresolvedCount += hand.selection.modifiers.filter(
          (modifier) => modifier.kind === "unresolved"
        ).length;
      }
      if (hand.weapon !== null) {
        weaponSetNotes.push(...weaponNotes(hand.weapon, setIndex, hand.hand));
      } else if (hand.selection?.weapon !== null && hand.selection?.weapon !== undefined) {
        collectMissingSelectionNote(
          `${handLabel(hand.hand)} weapon`,
          hand.selection.weapon,
          weaponSetNotes
        );
      }
      for (const modifier of hand.modifiers) {
        if (modifier.modifier !== null) {
          collectWeaponModifierSummaryEffects(
            modifier.modifier,
            healthEffects,
            energyEffects,
            weaponSetNotes
          );
        } else {
          collectMissingSelectionNote("weapon modifier", modifier.selection, weaponSetNotes);
        }
      }
    }
  }

  return {
    hasMaterializedEquipment: equipment !== null,
    hasMeaningfulEquipment: hasMeaningfulEquipment(equipment),
    selectedUpgradeCount,
    unresolvedCount,
    healthDelta: combineDeltas(healthEffects),
    energyDelta: combineDeltas(energyEffects),
    globalNotes: uniqueSorted(globalNotes),
    weaponSetNotes: uniqueSorted(weaponSetNotes),
    attribution,
    validationUnavailable: uniqueSorted(validationUnavailable)
  };
}

function selectArmorSlotView(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationResult,
  piece: ArmorPiece,
  index: number
): ArmorEquipmentSlotView {
  const issues = validation.issues.filter(
    (issue) => issue.location?.kind === "armor-piece" && issue.location.index === index
  );
  return {
    slot: piece.slot,
    label: armorSlotLabel(piece.slot),
    rune: selectedRuneValue(piece.rune, catalogs),
    runeOptions: runeOptions(state, catalogs, piece.rune),
    insignia: selectedInsigniaValue(piece.slot, piece.insignia, catalogs),
    insigniaOptions: insigniaOptions(state, catalogs, piece.slot, piece.insignia),
    headgearAttribute: selectedAttributeValue(piece.headgearAttribute, catalogs),
    headgearOptions: headgearOptions(state, catalogs, piece.headgearAttribute),
    headgearAvailable: piece.slot === "head",
    summary: armorSummary(piece, catalogs),
    issues
  };
}

function selectWeaponSetView(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationResult,
  weaponSet: WeaponSet,
  index: number
): WeaponSetView {
  const adjustments = collectEquipmentAttributeRankAdjustments({
    build: state.build,
    professionAttributes: catalogs.validation.professionAttributes,
    ...(catalogs.equipment.validation.runes === undefined
      ? {}
      : { runes: catalogs.equipment.validation.runes })
  });
  const analysis = analyzeWeaponSet({
    build: state.build,
    professionAttributes: catalogs.validation.professionAttributes,
    rankAdjustments: adjustments.adjustments,
    rankAdjustmentsUnresolved: adjustments.unresolved.length > 0,
    weaponSet,
    setIndex: index,
    ...(catalogs.equipment.validation.weapons === undefined
      ? {}
      : { weapons: catalogs.equipment.validation.weapons }),
    ...(catalogs.equipment.validation.weaponModifiers === undefined
      ? {}
      : { weaponModifiers: catalogs.equipment.validation.weaponModifiers })
  });
  const issues = validation.issues.filter(
    (issue) => issue.location?.kind === "weapon-set" && issue.location.index === index
  );
  return {
    slot: weaponSet.slot,
    label: `Set ${index + 1}`,
    occupancy: occupancyLabel(analysis.occupancy),
    mainHand: selectWeaponHandView(state, catalogs, validation, analysis, analysis.mainHand),
    offHand: selectWeaponHandView(state, catalogs, validation, analysis, analysis.offHand),
    issues,
    canClear: handHasState(weaponSet.mainHand) || handHasState(weaponSet.offHand)
  };
}

function selectWeaponHandView(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationResult,
  analysis: WeaponSetAnalysis,
  hand: WeaponHandAnalysis
): WeaponHandView {
  const setIndex = analysis.setIndex ?? 0;
  const handIssues = validation.issues.filter(
    (issue) =>
      issue.location?.kind === "weapon-hand" &&
      issue.location.setIndex === setIndex &&
      issue.location.hand === hand.hand
  );
  return {
    hand: hand.hand,
    label: hand.hand === "mainHand" ? "Main hand" : "Off hand",
    selectedWeapon: selectedWeaponValue(hand.selection?.weapon ?? null, catalogs),
    weaponOptions: weaponOptions(state, catalogs, hand.hand, hand.selection?.weapon ?? null),
    modifierControls: modifierControls(state, catalogs, validation, analysis, hand),
    requirementNotes: requirementNotes(state, catalogs, hand),
    issues: handIssues,
    canClear: handHasState(hand.selection)
  };
}

function modifierControls(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationResult,
  analysis: WeaponSetAnalysis,
  hand: WeaponHandAnalysis
): readonly WeaponModifierControlView[] {
  const setIndex = analysis.setIndex ?? 0;
  const usedModifierIndexes = new Set<number>();
  const controls: WeaponModifierControlView[] = [];
  const allowedSlots =
    hand.weapon === null
      ? []
      : [...hand.weapon.allowedModifierSlots]
          .filter((slot) => slot.cardinality !== "not-applicable")
          .sort(compareAllowedModifierSlots);

  for (const allowed of allowedSlots) {
    const existing = hand.modifiers.find((modifier) => modifier.occupiedSlot === allowed.slot);
    const modifierIndex = existing?.index ?? hand.modifiers.length;
    if (existing !== undefined) {
      usedModifierIndexes.add(existing.index);
    }
    controls.push(
      modifierControl(
        state,
        catalogs,
        validation,
        hand,
        setIndex,
        allowed.slot,
        modifierIndex,
        existing?.selection ?? null,
        allowed
      )
    );
  }

  for (const modifier of hand.modifiers) {
    if (usedModifierIndexes.has(modifier.index)) {
      continue;
    }
    controls.push(
      modifierControl(
        state,
        catalogs,
        validation,
        hand,
        setIndex,
        modifier.occupiedSlot,
        modifier.index,
        modifier.selection,
        null
      )
    );
  }

  return controls;
}

function modifierControl(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationResult,
  hand: WeaponHandAnalysis,
  setIndex: number,
  slot: WeaponModifierSlot | null,
  modifierIndex: number,
  selection: EquipmentSelectionState<WeaponModifierId> | null,
  allowed: WeaponAllowedModifierSlot | null
): WeaponModifierControlView {
  const issues = validation.issues.filter(
    (issue) =>
      issue.location?.kind === "weapon-modifier" &&
      issue.location.setIndex === setIndex &&
      issue.location.hand === hand.hand &&
      issue.location.index === modifierIndex
  );
  const noWeapon = hand.weapon === null;
  return {
    key: `${hand.hand}:${slot ?? "retained"}:${modifierIndex}`,
    label: slot === null ? `Modifier ${modifierIndex + 1}` : modifierSlotLabel(slot),
    slot,
    modifierIndex,
    selected: selectedModifierValue(selection, catalogs),
    options: modifierOptions(state, catalogs, hand.weapon, slot, selection),
    disabled: noWeapon && selection === null,
    disabledReason: noWeapon ? "Select a weapon before adding modifiers." : null,
    issues,
    ...(allowed === null ? {} : { allowed })
  };
}

function runeOptions(
  state: EditorState,
  catalogs: AppCatalogViews,
  selected: EquipmentSelectionState<RuneId> | null
): readonly EquipmentSelectOption<RuneId>[] {
  const options = catalogs.equipment.runes.map((rune) => ({
    id: knownOptionId(rune.id),
    label: rune.name,
    detail: runeDetail(rune, catalogs),
    disabled: runeDisabledReason(state, rune) !== null,
    disabledReason: runeDisabledReason(state, rune),
    retained: false,
    selection: knownEquipmentSelection(rune.id)
  }));
  return [
    ...withRetainedSelection(selected, options, (id) =>
      selectedRuneValue(knownEquipmentSelection(id as RuneId), catalogs)
    )
  ].sort(compareOptions);
}

function insigniaOptions(
  state: EditorState,
  catalogs: AppCatalogViews,
  slot: ArmorSlot,
  selected: EquipmentSelectionState<InsigniaId> | null
): readonly EquipmentSelectOption<InsigniaId>[] {
  const options = catalogs.equipment.insignias.map((insignia) => ({
    id: knownOptionId(insignia.id),
    label: insignia.name,
    detail: insigniaDetail(insignia, catalogs),
    disabled: insigniaDisabledReason(state, insignia, slot) !== null,
    disabledReason: insigniaDisabledReason(state, insignia, slot),
    retained: false,
    selection: knownEquipmentSelection(insignia.id)
  }));
  return [
    ...withRetainedSelection(selected, options, (id) =>
      selectedInsigniaValue(slot, knownEquipmentSelection(id as InsigniaId), catalogs)
    )
  ].sort(compareOptions);
}

function headgearOptions(
  state: EditorState,
  catalogs: AppCatalogViews,
  selected: EquipmentSelectionState<AttributeId> | null
): readonly EquipmentSelectOption<AttributeId>[] {
  const primaryId = state.build.primaryProfessionId;
  const options = catalogs.attributes
    .filter(
      (attribute) => primaryId !== null && Number(attribute.professionId) === Number(primaryId)
    )
    .map((attribute) => ({
      id: knownOptionId(attribute.id),
      label: attribute.name,
      detail: `Headgear +${HEADGEAR_ATTRIBUTE_BONUS} effective rank`,
      disabled: false,
      disabledReason: null,
      retained: false,
      selection: knownEquipmentSelection(attribute.id)
    }));
  return [
    ...withRetainedSelection(selected, options, (id) =>
      selectedAttributeValue(knownEquipmentSelection(id as AttributeId), catalogs)
    )
  ].sort(compareOptions);
}

function weaponOptions(
  state: EditorState,
  catalogs: AppCatalogViews,
  hand: WeaponSetHand,
  selected: EquipmentSelectionState<WeaponId> | null
): readonly EquipmentSelectOption<WeaponId>[] {
  const options = catalogs.equipment.weapons.map((weapon) => ({
    id: knownOptionId(weapon.id),
    label: weapon.name,
    detail: weaponDetail(weapon),
    disabled: weaponDisabledReason(state, weapon, hand) !== null,
    disabledReason: weaponDisabledReason(state, weapon, hand),
    retained: false,
    selection: knownEquipmentSelection(weapon.id)
  }));
  return [
    ...withRetainedSelection(selected, options, (id) =>
      selectedWeaponValue(knownEquipmentSelection(id as WeaponId), catalogs)
    )
  ].sort(compareOptions);
}

function modifierOptions(
  state: EditorState,
  catalogs: AppCatalogViews,
  weapon: CatalogWeaponBaseRecord | null,
  slot: WeaponModifierSlot | null,
  selected: EquipmentSelectionState<WeaponModifierId> | null
): readonly EquipmentSelectOption<WeaponModifierId>[] {
  const options = catalogs.equipment.weaponModifiers
    .filter((modifier) => slot === null || modifier.occupiedSlot === slot)
    .map((modifier) => {
      const disabledReason = modifierDisabledReason(state, weapon, modifier);
      return {
        id: knownOptionId(modifier.id),
        label: modifier.name,
        detail: modifierDetail(modifier),
        disabled: disabledReason !== null,
        disabledReason,
        retained: false,
        selection: knownEquipmentSelection(modifier.id)
      };
    });
  return [
    ...withRetainedSelection(selected, options, (id) =>
      selectedModifierValue(knownEquipmentSelection(id as WeaponModifierId), catalogs)
    )
  ].sort(compareOptions);
}

function withRetainedSelection<Id>(
  selected: EquipmentSelectionState<Id> | null,
  options: readonly EquipmentSelectOption<Id>[],
  describeKnown: (id: number) => EquipmentSelectedValueView
): readonly EquipmentSelectOption<Id>[] {
  if (selected === null || options.some((option) => sameSelection(option.selection, selected))) {
    return options;
  }
  if (selected.kind === "known") {
    const selectedView = describeKnown(Number(selected.id));
    return [
      {
        id: knownOptionId(Number(selected.id)),
        label: selectedView.label,
        detail: selectedView.detail,
        disabled: false,
        disabledReason: null,
        retained: true,
        selection: selected
      },
      ...options
    ];
  }
  return [
    {
      id: `unresolved:${selected.candidateCatalogId ?? selected.label ?? "selection"}`,
      label: selected.label ?? "Unresolved selection",
      detail: selected.reason,
      disabled: false,
      disabledReason: null,
      retained: true,
      selection: selected
    },
    ...options
  ];
}

function selectedRuneValue(
  selection: EquipmentSelectionState<RuneId> | null,
  catalogs: AppCatalogViews
): EquipmentSelectedValueView {
  if (selection === null) {
    return emptySelected("No rune");
  }
  if (selection.kind === "unresolved") {
    return unresolvedSelected(selection, "Unresolved rune");
  }
  const rune = resolveKnownRecord(selection, catalogs.equipment.runes);
  return rune === null
    ? retainedSelected(Number(selection.id), "Retained rune")
    : knownSelected(Number(rune.id), rune.name, runeDetail(rune, catalogs));
}

function selectedInsigniaValue(
  slot: ArmorSlot,
  selection: EquipmentSelectionState<InsigniaId> | null,
  catalogs: AppCatalogViews
): EquipmentSelectedValueView {
  if (selection === null) {
    return emptySelected("No insignia");
  }
  if (selection.kind === "unresolved") {
    return unresolvedSelected(selection, "Unresolved insignia");
  }
  const insignia = resolveKnownRecord(selection, catalogs.equipment.insignias);
  return insignia === null
    ? retainedSelected(Number(selection.id), "Retained insignia")
    : knownSelected(Number(insignia.id), insignia.name, insigniaSlotDetail(slot, insignia));
}

function selectedAttributeValue(
  selection: EquipmentSelectionState<AttributeId> | null,
  catalogs: AppCatalogViews
): EquipmentSelectedValueView {
  if (selection === null) {
    return emptySelected("No headgear bonus");
  }
  if (selection.kind === "unresolved") {
    return unresolvedSelected(selection, "Unresolved headgear attribute");
  }
  const attribute = catalogs.attributes.find(
    (candidate) => Number(candidate.id) === Number(selection.id)
  );
  return attribute === undefined
    ? retainedSelected(Number(selection.id), "Retained headgear attribute")
    : knownSelected(
        Number(attribute.id),
        attribute.name,
        `Headgear +${HEADGEAR_ATTRIBUTE_BONUS} effective rank`
      );
}

function selectedWeaponValue(
  selection: EquipmentSelectionState<WeaponId> | null,
  catalogs: AppCatalogViews
): EquipmentSelectedValueView {
  if (selection === null) {
    return emptySelected("No weapon");
  }
  if (selection.kind === "unresolved") {
    return unresolvedSelected(selection, "Unresolved weapon");
  }
  const weapon = resolveKnownRecord(selection, catalogs.equipment.weapons);
  return weapon === null
    ? retainedSelected(Number(selection.id), "Retained weapon")
    : knownSelected(Number(weapon.id), weapon.name, weaponDetail(weapon));
}

function selectedModifierValue(
  selection: EquipmentSelectionState<WeaponModifierId> | null,
  catalogs: AppCatalogViews
): EquipmentSelectedValueView {
  if (selection === null) {
    return emptySelected("No modifier");
  }
  if (selection.kind === "unresolved") {
    return unresolvedSelected(selection, "Unresolved modifier");
  }
  const modifier = resolveKnownRecord(selection, catalogs.equipment.weaponModifiers);
  return modifier === null
    ? retainedSelected(Number(selection.id), "Retained modifier")
    : knownSelected(Number(modifier.id), modifier.name, modifierDetail(modifier));
}

function armorSummary(piece: ArmorPiece, catalogs: AppCatalogViews): readonly string[] {
  const notes: string[] = [];
  const rune = resolveKnownRecord(piece.rune, catalogs.equipment.runes);
  const insignia = resolveKnownRecord(piece.insignia, catalogs.equipment.insignias);
  if (rune !== null) {
    notes.push(runeDetail(rune, catalogs));
  }
  if (insignia !== null) {
    notes.push(insigniaSlotDetail(piece.slot, insignia));
  }
  if (piece.headgearAttribute !== null) {
    notes.push(selectedAttributeValue(piece.headgearAttribute, catalogs).label);
  }
  return notes.filter((note) => note.length > 0);
}

function requirementNotes(
  state: EditorState,
  catalogs: AppCatalogViews,
  hand: WeaponHandAnalysis
): readonly string[] {
  if (hand.weapon === null || hand.selection === null) {
    return [];
  }
  const requirement = hand.weapon.requirement;
  if (requirement.kind === "none") {
    return [requirement.reason];
  }
  if (requirement.kind === "unresolved") {
    if (hand.selection.requirement !== null) {
      return ["Authored fallback requirement retained for unresolved catalog data."];
    }
    return [
      `Requirement unresolved${requirement.attributeName === null ? "" : `: ${requirement.attributeName}`}.`
    ];
  }
  const adjustmentSummary = collectEquipmentAttributeRankAdjustments({
    build: state.build,
    professionAttributes: catalogs.validation.professionAttributes,
    ...(catalogs.equipment.validation.runes === undefined
      ? {}
      : { runes: catalogs.equipment.validation.runes })
  });
  const rank = calculateEffectiveAttributeRank({
    build: state.build,
    professionAttributes: catalogs.validation.professionAttributes,
    attributeId: requirement.attributeId,
    adjustments: equipmentAdjustmentsForAttribute(adjustmentSummary, requirement.attributeId)
  });
  const actual = rank.kind === "resolved" ? rank.finalRank : null;
  return [
    `Requires ${requirement.attributeName} ${requirement.rank}${
      actual === null ? "" : `; effective rank ${actual}`
    }.`
  ];
}

function runeDisabledReason(state: EditorState, rune: CatalogRuneRecord): string | null {
  if (rune.displayState === "excluded") {
    return "Rune is excluded from runtime display.";
  }
  if (rune.eligibility === "unknown") {
    return "Rune eligibility is unresolved.";
  }
  if (rune.eligibility === "universal-armor") {
    return null;
  }
  if (state.build.primaryProfessionId === null) {
    return "Select a primary profession before using profession armor runes.";
  }
  return rune.professionId !== null &&
    Number(rune.professionId) === Number(state.build.primaryProfessionId)
    ? null
    : "Rune is restricted to a different primary profession.";
}

function insigniaDisabledReason(
  state: EditorState,
  insignia: CatalogInsigniaRecord,
  slot: ArmorSlot
): string | null {
  if (insignia.displayState === "excluded") {
    return "Insignia is excluded from runtime display.";
  }
  if (!insignia.applicableSlots.includes(slot)) {
    return `Insignia does not apply to ${armorSlotLabel(slot).toLowerCase()}.`;
  }
  if (
    (state.build.mode === "pve" && insignia.modeAvailability === "pvp-only") ||
    (state.build.mode === "pvp" && insignia.modeAvailability === "pve-only")
  ) {
    return "Insignia is not available in the selected mode.";
  }
  if (insignia.availability === "profession-specific") {
    if (state.build.primaryProfessionId === null) {
      return "Select a primary profession before using profession insignias.";
    }
    if (
      insignia.professionId === null ||
      Number(insignia.professionId) !== Number(state.build.primaryProfessionId)
    ) {
      return "Insignia is restricted to a different primary profession.";
    }
  }
  return insignia.availability === "unknown" ? "Insignia availability is unresolved." : null;
}

function weaponDisabledReason(
  state: EditorState,
  weapon: CatalogWeaponBaseRecord,
  hand: WeaponSetHand
): string | null {
  if (weapon.displayState === "excluded") {
    return "Weapon is excluded from runtime display.";
  }
  if (
    (state.build.mode === "pve" && weapon.modeAvailability === "pvp-only") ||
    (state.build.mode === "pvp" && weapon.modeAvailability === "pve-only")
  ) {
    return "Weapon is not available in the selected mode.";
  }
  if (hand === "mainHand" && weapon.equipRole === "off-hand") {
    return "Off-hand weapons cannot be selected in the main hand.";
  }
  if (hand === "offHand" && weapon.equipRole !== "off-hand") {
    return "Main-hand and two-handed weapons cannot be selected in the off hand.";
  }
  return null;
}

function modifierDisabledReason(
  state: EditorState,
  weapon: CatalogWeaponBaseRecord | null,
  modifier: CatalogWeaponModRecord
): string | null {
  if (modifier.displayState === "excluded") {
    return "Modifier is excluded from runtime display.";
  }
  if (
    (state.build.mode === "pve" && modifier.modeAvailability === "pvp-only") ||
    (state.build.mode === "pvp" && modifier.modeAvailability === "pve-only")
  ) {
    return "Modifier is not available in the selected mode.";
  }
  if (weapon === null) {
    return "Select a weapon before adding modifiers.";
  }
  const allowed = weapon.allowedModifierSlots.find(
    (slot) => slot.slot === modifier.occupiedSlot && slot.cardinality !== "not-applicable"
  );
  if (allowed === undefined) {
    return "Modifier does not occupy a slot supported by the selected weapon.";
  }
  if (!allowed.compatibleModifierFamilies.includes(modifier.family)) {
    return "Modifier family is not compatible with this weapon slot.";
  }
  if (modifier.applicability.kind === "specific-families") {
    return modifier.applicability.familyKeys.includes(weapon.familyKey)
      ? null
      : "Modifier does not apply to this weapon family.";
  }
  if (modifier.applicability.kind === "not-applicable") {
    return modifier.applicability.reason;
  }
  return modifier.applicability.kind === "unresolved" ? modifier.applicability.reason : null;
}

function runeDetail(rune: CatalogRuneRecord, catalogs: AppCatalogViews): string {
  if (rune.familyKind === "attribute" && rune.affectedAttributeId !== null) {
    const attribute = catalogs.attributes.find(
      (candidate) => Number(candidate.id) === Number(rune.affectedAttributeId)
    );
    const amount = rune.effects.find((effect) => effect.kind === "attribute-rank")?.amount ?? null;
    return `${attribute?.name ?? `Attribute ${Number(rune.affectedAttributeId)}`} ${
      amount === null ? "" : `${amount >= 0 ? "+" : ""}${amount}`
    }`.trim();
  }
  const health = rune.effects.find((effect) => effect.kind === "maximum-health-delta");
  if (health !== undefined) {
    return `Health ${health.amount >= 0 ? "+" : ""}${health.amount}`;
  }
  const energy = rune.effects.find((effect) => effect.kind === "maximum-energy-delta");
  if (energy !== undefined) {
    return `Energy ${energy.amount >= 0 ? "+" : ""}${energy.amount}`;
  }
  return rune.familyKind;
}

function insigniaDetail(insignia: CatalogInsigniaRecord, catalogs: AppCatalogViews): string {
  const profession =
    insignia.professionId === null
      ? "Common"
      : (catalogs.professions.find(
          (profession) => Number(profession.id) === Number(insignia.professionId)
        )?.name ?? "Profession-specific");
  return `${profession} - ${insignia.modeAvailability}`;
}

function insigniaSlotDetail(slot: ArmorSlot, insignia: CatalogInsigniaRecord): string {
  const resolution = resolveInsigniaEffectsForArmorSlot(insignia, slot);
  const effect = resolution.effects.find(
    (candidate) =>
      candidate.outcome?.kind === "value" &&
      (candidate.kind === "maximum-health-delta" ||
        candidate.kind === "maximum-energy-delta" ||
        candidate.kind === "armor-rating-delta")
  );
  if (effect?.outcome?.kind === "value") {
    return `${effect.outcome.unit} ${effect.outcome.amount >= 0 ? "+" : ""}${
      effect.outcome.amount
    }`;
  }
  return insignia.effectCompleteness;
}

function weaponDetail(weapon: CatalogWeaponBaseRecord): string {
  const damage =
    weapon.damage.kind === "fixed-range"
      ? `${weapon.damage.minimum}-${weapon.damage.maximum} ${weapon.damage.damageType}`
      : weapon.damage.kind === "not-applicable"
        ? "No weapon damage"
        : "Damage unresolved";
  return `${weapon.family} - ${weapon.handedness} - ${damage}`;
}

function modifierDetail(modifier: CatalogWeaponModRecord): string {
  return `${modifier.family} - ${modifierSlotLabel(modifier.occupiedSlot)}`;
}

function emptySelected(label: string): EquipmentSelectedValueView {
  return { state: "empty", label, detail: null, catalogId: null };
}

function knownSelected(
  catalogId: number,
  label: string,
  detail: string | null
): EquipmentSelectedValueView {
  return { state: "known", label, detail, catalogId };
}

function retainedSelected(catalogId: number, label: string): EquipmentSelectedValueView {
  return {
    state: "retained",
    label: `${label} ${catalogId}`,
    detail: "Catalog ID is no longer resolved but remains authored.",
    catalogId
  };
}

function unresolvedSelected(
  selection: Extract<EquipmentSelectionState<unknown>, { readonly kind: "unresolved" }>,
  fallback: string
): EquipmentSelectedValueView {
  return {
    state: "unresolved",
    label: selection.label ?? fallback,
    detail: selection.reason,
    catalogId: selection.candidateCatalogId
  };
}

function resolveKnownRecord<Id, Record extends { readonly id: Id }>(
  selection: EquipmentSelectionState<Id> | null,
  records: readonly Record[]
): Record | null {
  if (selection === null || selection.kind !== "known") {
    return null;
  }
  return records.find((record) => Number(record.id) === Number(selection.id)) ?? null;
}

function collectRuneSummaryEffects(
  rune: CatalogRuneRecord,
  health: DeltaEffect[],
  energy: DeltaEffect[],
  notes: string[]
): void {
  for (const effect of rune.effects) {
    if (effect.kind === "maximum-health-delta") {
      health.push(deltaEffect(effect.amount, effect.stacking.rule, effect.stacking.groupKey));
    } else if (effect.kind === "maximum-energy-delta") {
      energy.push(deltaEffect(effect.amount, effect.stacking.rule, effect.stacking.groupKey));
    } else if (effect.kind === "physical-damage-reduction") {
      notes.push(`Physical damage ${effect.amount >= 0 ? "-" : "+"}${Math.abs(effect.amount)}.`);
    } else if (effect.kind === "condition-duration-reduction") {
      notes.push(`${effect.percentage}% condition duration reduction note.`);
    } else if (effect.kind === "note-only") {
      notes.push(effect.text);
    } else if (effect.kind === "unknown") {
      notes.push(effect.reason);
    }
  }
}

function collectInsigniaSummaryEffects(
  slot: ArmorSlot,
  insignia: CatalogInsigniaRecord,
  health: DeltaEffect[],
  energy: DeltaEffect[],
  notes: string[]
): void {
  const resolution = resolveInsigniaEffectsForArmorSlot(insignia, slot);
  for (const effect of resolution.effects) {
    if (effect.outcome?.kind !== "value") {
      continue;
    }
    if (effect.condition.kind !== "always") {
      notes.push(`${insignia.name} has conditional ${effect.kind} on ${armorSlotLabel(slot)}.`);
      continue;
    }
    if (effect.kind === "maximum-health-delta") {
      health.push(
        deltaEffect(effect.outcome.amount, effect.combination.rule, effect.combination.groupKey)
      );
    } else if (effect.kind === "maximum-energy-delta") {
      energy.push(
        deltaEffect(effect.outcome.amount, effect.combination.rule, effect.combination.groupKey)
      );
    } else if (effect.kind === "armor-rating-delta") {
      notes.push(
        `${armorSlotLabel(slot)} armor ${effect.outcome.amount >= 0 ? "+" : ""}${
          effect.outcome.amount
        }.`
      );
    }
  }
  notes.push(...resolution.unresolved.map((issue) => issue.message));
}

function collectWeaponModifierSummaryEffects(
  modifier: CatalogWeaponModRecord,
  health: DeltaEffect[],
  energy: DeltaEffect[],
  notes: string[]
): void {
  for (const effect of modifier.effects) {
    if (effect.kind === "maximum-health-delta") {
      health.push(deltaEffect(effect.amount, "separate", `${Number(modifier.id)}:health`));
    } else if (effect.kind === "maximum-energy-delta") {
      energy.push(deltaEffect(effect.amount, "separate", `${Number(modifier.id)}:energy`));
    } else if (effect.kind === "note-only") {
      notes.push(effect.text);
    } else if (effect.kind === "unknown") {
      notes.push(effect.reason);
    } else {
      notes.push(`${modifier.name} has set-local ${effect.kind}.`);
    }
  }
}

function collectMissingSelectionNote(
  label: string,
  selection: EquipmentSelectionState<unknown>,
  notes: string[]
): void {
  if (selection.kind === "unresolved") {
    notes.push(`${label}: ${selection.reason}`);
  } else {
    notes.push(`Retained ${label} ID ${Number(selection.id)}.`);
  }
}

function weaponNotes(
  weapon: CatalogWeaponBaseRecord,
  setIndex: number,
  hand: WeaponSetHand
): readonly string[] {
  const notes: string[] = [];
  if (weapon.damage.kind === "fixed-range") {
    notes.push(
      `Set ${setIndex + 1} ${handLabel(hand)}: ${weapon.damage.minimum}-${
        weapon.damage.maximum
      } ${weapon.damage.damageType}.`
    );
  }
  if (weapon.requirement.kind === "attribute-rank") {
    notes.push(
      `Set ${setIndex + 1} ${handLabel(hand)} requires ${weapon.requirement.attributeName} ${
        weapon.requirement.rank
      }.`
    );
  }
  return notes;
}

interface DeltaEffect {
  readonly amount: number;
  readonly rule: string;
  readonly groupKey: string;
}

function deltaEffect(amount: number, rule: string, groupKey: string): DeltaEffect {
  return { amount, rule, groupKey };
}

function combineDeltas(effects: readonly DeltaEffect[]): number {
  const byGroup = new Map<string, DeltaEffect[]>();
  for (const effect of effects) {
    byGroup.set(effect.groupKey, [...(byGroup.get(effect.groupKey) ?? []), effect]);
  }
  let total = 0;
  for (const group of byGroup.values()) {
    const first = group[0];
    if (first?.rule === "highest") {
      total += Math.max(...group.map((effect) => effect.amount));
    } else {
      total += group.reduce((subtotal, effect) => subtotal + effect.amount, 0);
    }
  }
  return total;
}

function countSelection(selection: EquipmentSelectionState<unknown> | null): number {
  return selection === null ? 0 : 1;
}

function countUnresolved(selection: EquipmentSelectionState<unknown> | null): number {
  return selection?.kind === "unresolved" ? 1 : 0;
}

function emptyViewLoadout(): EquipmentLoadout {
  return {
    schemaVersion: 1,
    armor: ARMOR_SLOTS.map((slot) => ({
      slot,
      rune: null,
      insignia: null,
      headgearAttribute: null
    })),
    weaponSets: WEAPON_SET_SLOTS.map((slot) => ({
      slot,
      mainHand: null,
      offHand: null
    }))
  };
}

function armorPieceForSlot(loadout: EquipmentLoadout, slot: ArmorSlot): ArmorPiece {
  return (
    loadout.armor.find((piece) => piece.slot === slot) ?? {
      slot,
      rune: null,
      insignia: null,
      headgearAttribute: null
    }
  );
}

function weaponSetForSlot(loadout: EquipmentLoadout, slot: WeaponSetSlot): WeaponSet {
  return (
    loadout.weaponSets.find((set) => set.slot === slot) ?? {
      slot,
      mainHand: null,
      offHand: null
    }
  );
}

function handHasState(hand: WeaponHandSelection | null): boolean {
  return (
    hand !== null &&
    (hand.weapon !== null || hand.modifiers.length > 0 || hand.requirement !== null)
  );
}

function knownOptionId(id: number | { valueOf(): number }): string {
  return `known:${Number(id)}`;
}

function sameSelection<Id>(
  left: EquipmentSelectionState<Id>,
  right: EquipmentSelectionState<Id>
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function compareOptions<Id>(
  left: EquipmentSelectOption<Id>,
  right: EquipmentSelectOption<Id>
): number {
  if (left.retained !== right.retained) {
    return left.retained ? -1 : 1;
  }
  if (left.disabled !== right.disabled) {
    return left.disabled ? 1 : -1;
  }
  return left.label.localeCompare(right.label, "en-US") || left.id.localeCompare(right.id, "en-US");
}

function compareAllowedModifierSlots(
  left: WeaponAllowedModifierSlot,
  right: WeaponAllowedModifierSlot
): number {
  return (
    MODIFIER_SLOT_ORDER.indexOf(left.slot) - MODIFIER_SLOT_ORDER.indexOf(right.slot) ||
    left.slot.localeCompare(right.slot, "en-US")
  );
}

function armorSlotLabel(slot: ArmorSlot): string {
  switch (slot) {
    case "head":
      return "Head";
    case "chest":
      return "Chest";
    case "hands":
      return "Hands";
    case "legs":
      return "Legs";
    case "feet":
      return "Feet";
  }
}

function modifierSlotLabel(slot: WeaponModifierSlot): string {
  return slot
    .split("-")
    .map((part) => part[0]?.toLocaleUpperCase("en-US") + part.slice(1))
    .join(" ");
}

function occupancyLabel(occupancy: string): string {
  return occupancy.replace(/-/g, " ");
}

function handLabel(hand: WeaponSetHand): string {
  return hand === "mainHand" ? "main hand" : "off hand";
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort((left, right) =>
    left.localeCompare(right, "en-US")
  );
}
