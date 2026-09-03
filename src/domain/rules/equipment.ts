import type { CatalogInsigniaRecord } from "../catalog";
import { collectEquipmentAttributeRankAdjustments } from "../equipment-attribute-rank";
import {
  ARMOR_SLOTS,
  EQUIPMENT_LOADOUT_SCHEMA_VERSION,
  MAX_ARMOR_ROWS_TO_VALIDATE,
  MAX_MODIFIERS_PER_HAND_TO_VALIDATE,
  MAX_WEAPON_SET_ROWS_TO_VALIDATE,
  WEAPON_SET_SLOTS,
  isArmorSlot,
  isWeaponSetSlot,
  type ArmorSlot,
  type EquipmentLoadout,
  type EquipmentSelection,
  type EquipmentSelectionState,
  type WeaponSet
} from "../equipment";
import type { AttributeId, InsigniaId, RuneId } from "../ids";
import { resolveInsigniaEffectsForArmorSlot } from "../insignia-effects";
import { analyzeWeaponSet, type WeaponSetAnalysisIssue } from "../weapon-set";
import {
  readNumericId,
  type BuildValidationContext,
  type EquipmentCatalogIndex
} from "../validation-context";
import {
  createValidationIssue,
  relatedEntity,
  type ValidationIssue,
  type ValidationIssueCode,
  type ValidationLocation,
  type ValidationRuleId
} from "../validation";

type ArmorSelectionKind = "headgear" | "insignia" | "rune";

type SelectionRead<Id> =
  | {
      readonly kind: "empty";
    }
  | {
      readonly kind: "known";
      readonly selection: EquipmentSelection<Id>;
      readonly id: number;
    }
  | {
      readonly kind: "unresolved";
      readonly selection: EquipmentSelectionState<Id>;
      readonly candidateId: number | null;
    }
  | {
      readonly kind: "malformed";
    };

export function validateEquipmentRules(
  context: BuildValidationContext
): readonly ValidationIssue[] {
  const equipment = (context.build as unknown as Readonly<Record<string, unknown>>).equipment;
  if (equipment === null || equipment === undefined) {
    return [];
  }
  if (!isRecord(equipment)) {
    return [
      createValidationIssue({
        severity: "error",
        code: "equipment.schema-unsupported",
        message: "Equipment loadout must be an object when present.",
        path: ["equipment"],
        location: null,
        relatedEntities: [],
        sourceRule: "equipment.structure"
      })
    ];
  }
  if (equipment.schemaVersion !== EQUIPMENT_LOADOUT_SCHEMA_VERSION) {
    return [
      createValidationIssue({
        severity: "error",
        code: "equipment.schema-unsupported",
        message: "Equipment loadout schema version is not supported.",
        path: ["equipment", "schemaVersion"],
        location: null,
        relatedEntities: [
          relatedEntity("catalog-key", String(equipment.schemaVersion ?? "missing"), "schema")
        ],
        sourceRule: "equipment.structure"
      })
    ];
  }

  const loadout = equipment as unknown as EquipmentLoadout;
  const armorIssues = validateArmor(context, loadout);
  const weaponIssues = validateWeaponSets(context, loadout);
  return [...armorIssues, ...weaponIssues];
}

function validateArmor(
  context: BuildValidationContext,
  equipment: EquipmentLoadout
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rawArmor = (equipment as unknown as Readonly<Record<string, unknown>>).armor;
  if (!Array.isArray(rawArmor)) {
    return [
      createValidationIssue({
        severity: "error",
        code: "equipment.armor-slot-malformed",
        message: "Equipment armor must be an array.",
        path: ["equipment", "armor"],
        location: null,
        relatedEntities: [],
        sourceRule: "equipment.structure"
      })
    ];
  }
  if (rawArmor.length > MAX_ARMOR_ROWS_TO_VALIDATE) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "equipment.armor-slot-malformed",
        message: "Equipment armor rows exceed the validation traversal limit.",
        path: ["equipment", "armor"],
        location: null,
        relatedEntities: [relatedEntity("armor-slot", rawArmor.length, "observed-length")],
        sourceRule: "equipment.structure"
      })
    );
  }

  const rows = rawArmor.slice(0, MAX_ARMOR_ROWS_TO_VALIDATE);
  const seen = new Map<ArmorSlot, number[]>();
  rows.forEach((row, index) => {
    if (!isRecord(row)) {
      issues.push(malformedArmorIssue(index, null, "Armor row must be an object."));
      return;
    }
    if (!isArmorSlot(row.slot)) {
      issues.push(malformedArmorIssue(index, null, "Armor row slot is not supported."));
      return;
    }
    const slot = row.slot;
    seen.set(slot, [...(seen.get(slot) ?? []), index]);
    if (ARMOR_SLOTS[index] !== slot) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "equipment.armor-slot-malformed",
          message: "Armor rows are not authored in canonical slot order.",
          path: ["equipment", "armor", index, "slot"],
          location: armorLocation(index, slot),
          relatedEntities: [relatedEntity("armor-slot", slot)],
          sourceRule: "equipment.structure"
        })
      );
    }

    validateRuneSelection(context, row, index, slot, issues);
    validateInsigniaSelection(context, row, index, slot, issues);
    validateHeadgearSelection(context, row, index, slot, issues);
  });

  for (const slot of ARMOR_SLOTS) {
    const indexes = seen.get(slot) ?? [];
    if (indexes.length === 0) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "equipment.armor-slot-missing",
          message: "Canonical armor slot is missing from the authored loadout.",
          path: ["equipment", "armor"],
          location: null,
          relatedEntities: [relatedEntity("armor-slot", slot)],
          sourceRule: "equipment.structure"
        })
      );
    } else if (indexes.length > 1) {
      issues.push(
        createValidationIssue({
          severity: "error",
          code: "equipment.armor-slot-duplicate",
          message: "Armor slot appears more than once in the authored loadout.",
          path: ["equipment", "armor", indexes[1] ?? indexes[0] ?? 0, "slot"],
          location: armorLocation(indexes[1] ?? indexes[0] ?? 0, slot),
          relatedEntities: [
            relatedEntity("armor-slot", slot),
            ...indexes.map((index) => relatedEntity("armor-slot", index, "row"))
          ],
          sourceRule: "equipment.structure"
        })
      );
    }
  }

  return issues;
}

function validateRuneSelection(
  context: BuildValidationContext,
  row: Readonly<Record<string, unknown>>,
  index: number,
  slot: ArmorSlot,
  issues: ValidationIssue[]
): void {
  const selection = readSelection<RuneId>(row.rune);
  if (selection.kind === "empty") {
    return;
  }
  if (selection.kind === "malformed") {
    issues.push(armorSelectionIssue("rune", index, slot, "equipment.armor-selection-unresolved"));
    return;
  }
  if (selection.kind === "unresolved") {
    issues.push(armorSelectionIssue("rune", index, slot, "equipment.rune-unresolved"));
    return;
  }
  const rune = resolveEquipmentRecord(
    context.equipmentIndexes.runes,
    selection.id,
    "rune",
    ["equipment", "armor", index, "rune"],
    armorLocation(index, slot),
    issues
  );
  if (rune === null) {
    return;
  }
  if (rune.eligibility === "unknown") {
    issues.push(armorSelectionIssue("rune", index, slot, "equipment.rune-unresolved"));
    return;
  }
  if (rune.eligibility === "profession-armor") {
    if (context.primaryProfession.lookup.kind !== "resolved") {
      issues.push(armorSelectionIssue("rune", index, slot, "equipment.rune-unresolved"));
      return;
    }
    const primaryId = Number(context.primaryProfession.lookup.record.id);
    if (rune.professionId === null || Number(rune.professionId) !== primaryId) {
      issues.push(
        createValidationIssue({
          severity: "error",
          code: "equipment.rune-restricted",
          message: "Rune is not applicable to armor for the selected primary profession.",
          path: ["equipment", "armor", index, "rune"],
          location: armorLocation(index, slot),
          relatedEntities: [
            relatedEntity("equipment-selection", selection.id, "rune"),
            relatedEntity("profession", primaryId, "selected-primary")
          ],
          sourceRule: "equipment.armor"
        })
      );
    }
  }
}

function validateInsigniaSelection(
  context: BuildValidationContext,
  row: Readonly<Record<string, unknown>>,
  index: number,
  slot: ArmorSlot,
  issues: ValidationIssue[]
): void {
  const selection = readSelection<InsigniaId>(row.insignia);
  if (selection.kind === "empty") {
    return;
  }
  if (selection.kind === "malformed") {
    issues.push(
      armorSelectionIssue("insignia", index, slot, "equipment.armor-selection-unresolved")
    );
    return;
  }
  if (selection.kind === "unresolved") {
    issues.push(armorSelectionIssue("insignia", index, slot, "equipment.insignia-unresolved"));
    return;
  }
  const insignia = resolveEquipmentRecord(
    context.equipmentIndexes.insignias,
    selection.id,
    "insignia",
    ["equipment", "armor", index, "insignia"],
    armorLocation(index, slot),
    issues
  );
  if (insignia === null) {
    return;
  }
  validateInsigniaRestrictions(context, insignia, selection.id, index, slot, issues);
  const slotResolution = resolveInsigniaEffectsForArmorSlot(insignia, slot);
  for (const issue of slotResolution.unresolved) {
    issues.push(
      createValidationIssue({
        severity: issue.code === "inapplicable-slot" ? "error" : "warning",
        code:
          issue.code === "inapplicable-slot"
            ? "equipment.insignia-slot-inapplicable"
            : "equipment.insignia-unresolved",
        message:
          issue.code === "inapplicable-slot"
            ? "Insignia is not applicable to the selected armor slot."
            : "Insignia slot effect is unresolved.",
        path: ["equipment", "armor", index, "insignia"],
        location: armorLocation(index, slot),
        relatedEntities: [relatedEntity("equipment-selection", selection.id, "insignia")],
        sourceRule: "equipment.armor"
      })
    );
  }
}

function validateInsigniaRestrictions(
  context: BuildValidationContext,
  insignia: CatalogInsigniaRecord,
  id: number,
  index: number,
  slot: ArmorSlot,
  issues: ValidationIssue[]
): void {
  if (insignia.availability === "unknown") {
    issues.push(armorSelectionIssue("insignia", index, slot, "equipment.insignia-unresolved"));
    return;
  }
  if (insignia.availability === "profession-specific") {
    if (context.primaryProfession.lookup.kind !== "resolved") {
      issues.push(armorSelectionIssue("insignia", index, slot, "equipment.insignia-unresolved"));
      return;
    }
    const primaryId = Number(context.primaryProfession.lookup.record.id);
    if (insignia.professionId === null || Number(insignia.professionId) !== primaryId) {
      issues.push(
        createValidationIssue({
          severity: "error",
          code: "equipment.insignia-restricted",
          message: "Insignia is not applicable to armor for the selected primary profession.",
          path: ["equipment", "armor", index, "insignia"],
          location: armorLocation(index, slot),
          relatedEntities: [
            relatedEntity("equipment-selection", id, "insignia"),
            relatedEntity("profession", primaryId, "selected-primary")
          ],
          sourceRule: "equipment.armor"
        })
      );
    }
  }
  if (
    (context.mode === "pve" && insignia.modeAvailability === "pvp-only") ||
    (context.mode === "pvp" && insignia.modeAvailability === "pve-only")
  ) {
    issues.push(
      createValidationIssue({
        severity: "error",
        code: "equipment.insignia-restricted",
        message: "Insignia is not available in the selected build mode.",
        path: ["equipment", "armor", index, "insignia"],
        location: armorLocation(index, slot),
        relatedEntities: [relatedEntity("equipment-selection", id, "insignia")],
        sourceRule: "equipment.armor"
      })
    );
  }
}

function validateHeadgearSelection(
  context: BuildValidationContext,
  row: Readonly<Record<string, unknown>>,
  index: number,
  slot: ArmorSlot,
  issues: ValidationIssue[]
): void {
  const selection = readSelection<AttributeId>(row.headgearAttribute);
  if (selection.kind === "empty") {
    return;
  }
  if (slot !== "head") {
    issues.push(
      createValidationIssue({
        severity: "error",
        code: "equipment.headgear-slot-invalid",
        message: "Headgear attribute bonuses can only be authored on the head armor slot.",
        path: ["equipment", "armor", index, "headgearAttribute"],
        location: armorLocation(index, slot),
        relatedEntities: [relatedEntity("armor-slot", slot)],
        sourceRule: "equipment.armor"
      })
    );
    return;
  }
  if (selection.kind === "malformed" || selection.kind === "unresolved") {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code:
          selection.kind === "malformed"
            ? "equipment.armor-selection-unresolved"
            : "equipment.headgear-unresolved",
        message: "Headgear attribute selection is unresolved.",
        path: ["equipment", "armor", index, "headgearAttribute"],
        location: armorLocation(index, slot),
        relatedEntities: [relatedEntity("armor-slot", slot)],
        sourceRule: "equipment.armor"
      })
    );
    return;
  }
  if (context.primaryProfession.lookup.kind !== "resolved") {
    issues.push(headgearUnresolvedIssue(index, slot, selection.id));
    return;
  }
  const attribute = context.attributesById.get(selection.id) ?? null;
  if (attribute === null || context.ambiguousAttributeIds.has(selection.id)) {
    issues.push(headgearUnresolvedIssue(index, slot, selection.id));
    return;
  }
  const primaryId = Number(context.primaryProfession.lookup.record.id);
  if (Number(attribute.professionId) !== primaryId) {
    issues.push(
      createValidationIssue({
        severity: "error",
        code: "equipment.headgear-attribute-invalid",
        message: "Headgear attribute must belong to the selected primary profession.",
        path: ["equipment", "armor", index, "headgearAttribute"],
        location: armorLocation(index, slot),
        relatedEntities: [
          relatedEntity("attribute", selection.id),
          relatedEntity("profession", primaryId, "selected-primary")
        ],
        sourceRule: "equipment.armor"
      })
    );
  }
}

function validateWeaponSets(
  context: BuildValidationContext,
  equipment: EquipmentLoadout
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rawWeaponSets = (equipment as unknown as Readonly<Record<string, unknown>>).weaponSets;
  if (!Array.isArray(rawWeaponSets)) {
    return [
      createValidationIssue({
        severity: "error",
        code: "equipment.weapon-set-malformed",
        message: "Equipment weaponSets must be an array.",
        path: ["equipment", "weaponSets"],
        location: null,
        relatedEntities: [],
        sourceRule: "equipment.structure"
      })
    ];
  }
  if (rawWeaponSets.length > MAX_WEAPON_SET_ROWS_TO_VALIDATE) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "equipment.weapon-set-malformed",
        message: "Equipment weapon-set rows exceed the validation traversal limit.",
        path: ["equipment", "weaponSets"],
        location: null,
        relatedEntities: [relatedEntity("weapon-set", rawWeaponSets.length, "observed-length")],
        sourceRule: "equipment.structure"
      })
    );
  }
  const adjustmentSummary = collectEquipmentAttributeRankAdjustments({
    build: context.build,
    professionAttributes: context.professionAttributes,
    ...(context.equipmentCatalogs.runes === undefined
      ? {}
      : { runes: context.equipmentCatalogs.runes })
  });
  const seen = new Map<string, number[]>();
  const rows = rawWeaponSets.slice(0, MAX_WEAPON_SET_ROWS_TO_VALIDATE);
  rows.forEach((row, index) => {
    if (!isRecord(row)) {
      issues.push(malformedWeaponSetIssue(index, null, "Weapon-set row must be an object."));
      return;
    }
    if (!isWeaponSetSlot(row.slot)) {
      issues.push(malformedWeaponSetIssue(index, null, "Weapon-set slot is not supported."));
      return;
    }
    const slot = row.slot;
    seen.set(slot, [...(seen.get(slot) ?? []), index]);
    if (WEAPON_SET_SLOTS[index] !== slot) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "equipment.weapon-set-malformed",
          message: "Weapon sets are not authored in canonical order.",
          path: ["equipment", "weaponSets", index, "slot"],
          location: weaponSetLocation(index, slot),
          relatedEntities: [relatedEntity("weapon-set", slot)],
          sourceRule: "equipment.structure"
        })
      );
    }
    validateModifierLimits(row, index, issues);
    const analysis = analyzeWeaponSet({
      weaponSet: row as unknown as WeaponSet,
      setIndex: index,
      build: context.build,
      professionAttributes: context.professionAttributes,
      rankAdjustments: adjustmentSummary.adjustments,
      rankAdjustmentsUnresolved: adjustmentSummary.unresolved.length > 0,
      ...(context.equipmentCatalogs.weapons === undefined
        ? {}
        : { weapons: context.equipmentCatalogs.weapons }),
      ...(context.equipmentCatalogs.weaponModifiers === undefined
        ? {}
        : { weaponModifiers: context.equipmentCatalogs.weaponModifiers })
    });
    issues.push(
      ...analysis.issues
        .filter((issue) => issue.code !== "catalog-duplicate-id")
        .map(mapWeaponIssue)
    );
  });
  for (const slot of WEAPON_SET_SLOTS) {
    const indexes = seen.get(slot) ?? [];
    if (indexes.length === 0) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "equipment.weapon-set-missing",
          message: "Canonical weapon set is missing from the authored loadout.",
          path: ["equipment", "weaponSets"],
          location: null,
          relatedEntities: [relatedEntity("weapon-set", slot)],
          sourceRule: "equipment.structure"
        })
      );
    } else if (indexes.length > 1) {
      issues.push(
        createValidationIssue({
          severity: "error",
          code: "equipment.weapon-set-duplicate",
          message: "Weapon set appears more than once in the authored loadout.",
          path: ["equipment", "weaponSets", indexes[1] ?? indexes[0] ?? 0, "slot"],
          location: weaponSetLocation(indexes[1] ?? indexes[0] ?? 0, slot),
          relatedEntities: [
            relatedEntity("weapon-set", slot),
            ...indexes.map((index) => relatedEntity("weapon-set", index, "row"))
          ],
          sourceRule: "equipment.structure"
        })
      );
    }
  }
  return issues;
}

function validateModifierLimits(
  row: Readonly<Record<string, unknown>>,
  setIndex: number,
  issues: ValidationIssue[]
): void {
  for (const hand of ["mainHand", "offHand"] as const) {
    const selection = row[hand];
    if (!isRecord(selection) || !Array.isArray(selection.modifiers)) {
      continue;
    }
    if (selection.modifiers.length > MAX_MODIFIERS_PER_HAND_TO_VALIDATE) {
      issues.push(
        createValidationIssue({
          severity: "warning",
          code: "equipment.weapon-set-malformed",
          message: "Weapon modifiers exceed the per-hand validation traversal limit.",
          path: ["equipment", "weaponSets", setIndex, hand, "modifiers"],
          location: { kind: "weapon-hand", setIndex, hand },
          relatedEntities: [
            relatedEntity("weapon-set", selection.modifiers.length, "observed-modifiers")
          ],
          sourceRule: "equipment.structure"
        })
      );
    }
  }
}

function resolveEquipmentRecord<Record>(
  index: EquipmentCatalogIndex<Record> | null,
  id: number,
  label: "insignia" | "rune",
  path: readonly (string | number)[],
  location: ValidationLocation,
  issues: ValidationIssue[]
): Record | null {
  if (index === null) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "equipment.catalog-unavailable",
        message: `Equipment ${label} catalog view is required before selection can be resolved.`,
        path,
        location,
        relatedEntities: [relatedEntity("equipment-selection", id, label)],
        sourceRule: "equipment.catalog"
      })
    );
    return null;
  }
  if (index.ambiguousIds.has(id)) {
    issues.push(unresolvedCatalogSelectionIssue(label, id, path, location));
    return null;
  }
  const record = index.recordsById.get(id) ?? null;
  if (record === null) {
    issues.push(unresolvedCatalogSelectionIssue(label, id, path, location));
  }
  return record;
}

function unresolvedCatalogSelectionIssue(
  label: "insignia" | "rune",
  id: number,
  path: readonly (string | number)[],
  location: ValidationLocation
): ValidationIssue {
  return createValidationIssue({
    severity: "warning",
    code: label === "rune" ? "equipment.rune-unresolved" : "equipment.insignia-unresolved",
    message: `Equipment ${label} ID is not resolved in the supplied catalog.`,
    path,
    location,
    relatedEntities: [relatedEntity("equipment-selection", id, label)],
    sourceRule: "equipment.armor"
  });
}

function readSelection<Id>(value: unknown): SelectionRead<Id> {
  if (value === null || value === undefined) {
    return { kind: "empty" };
  }
  if (!isRecord(value)) {
    return { kind: "malformed" };
  }
  if (value.kind === "known") {
    const id = readNumericId(value.id);
    return id === null
      ? { kind: "malformed" }
      : { kind: "known", selection: value as unknown as EquipmentSelection<Id>, id };
  }
  if (value.kind === "unresolved") {
    return {
      kind: "unresolved",
      selection: value as unknown as EquipmentSelectionState<Id>,
      candidateId: readNumericId(value.candidateCatalogId)
    };
  }
  return { kind: "malformed" };
}

function armorSelectionIssue(
  kind: ArmorSelectionKind,
  index: number,
  slot: ArmorSlot,
  code: ValidationIssueCode
): ValidationIssue {
  return createValidationIssue({
    severity: "warning",
    code,
    message: `Equipment ${kind} selection is unresolved.`,
    path: ["equipment", "armor", index, kind === "headgear" ? "headgearAttribute" : kind],
    location: armorLocation(index, slot),
    relatedEntities: [relatedEntity("armor-slot", slot)],
    sourceRule: "equipment.armor"
  });
}

function headgearUnresolvedIssue(index: number, slot: ArmorSlot, id: number): ValidationIssue {
  return createValidationIssue({
    severity: "warning",
    code: "equipment.headgear-unresolved",
    message: "Headgear attribute ID is not resolved with current profession/attribute evidence.",
    path: ["equipment", "armor", index, "headgearAttribute"],
    location: armorLocation(index, slot),
    relatedEntities: [relatedEntity("attribute", id)],
    sourceRule: "equipment.armor"
  });
}

function malformedArmorIssue(index: number, slot: string | null, message: string): ValidationIssue {
  return createValidationIssue({
    severity: "error",
    code: "equipment.armor-slot-malformed",
    message,
    path: ["equipment", "armor", index],
    location: armorLocation(index, slot),
    relatedEntities: slot === null ? [] : [relatedEntity("armor-slot", slot)],
    sourceRule: "equipment.structure"
  });
}

function malformedWeaponSetIssue(
  index: number,
  slot: string | null,
  message: string
): ValidationIssue {
  return createValidationIssue({
    severity: "error",
    code: "equipment.weapon-set-malformed",
    message,
    path: ["equipment", "weaponSets", index],
    location: weaponSetLocation(index, slot),
    relatedEntities: slot === null ? [] : [relatedEntity("weapon-set", slot)],
    sourceRule: "equipment.structure"
  });
}

function mapWeaponIssue(issue: WeaponSetAnalysisIssue): ValidationIssue {
  return createValidationIssue({
    severity: issue.severity,
    code: mapWeaponIssueCode(issue.code),
    message: issue.message,
    path: issue.path,
    location: weaponLocation(issue.path),
    relatedEntities: [relatedEntity(issue.entityKind, issue.entityId)],
    sourceRule: weaponSourceRule(issue.code)
  });
}

function mapWeaponIssueCode(code: WeaponSetAnalysisIssue["code"]): ValidationIssueCode {
  switch (code) {
    case "catalog-set-mismatch":
      return "equipment.catalog-set-mismatch";
    case "catalog-unavailable":
      return "equipment.catalog-unavailable";
    case "catalog-duplicate-id":
      return "equipment.catalog-duplicate-id";
    case "weapon-mode-restricted":
      return "equipment.weapon-mode-restricted";
    case "weapon-modifier-compatibility-unresolved":
      return "equipment.weapon-modifier-compatibility-unresolved";
    case "weapon-modifier-duplicate-slot":
      return "equipment.weapon-modifier-duplicate-slot";
    case "weapon-modifier-incompatible":
      return "equipment.weapon-modifier-incompatible";
    case "weapon-modifier-unresolved":
      return "equipment.weapon-modifier-unresolved";
    case "weapon-modifier-without-weapon":
      return "equipment.weapon-modifier-without-weapon";
    case "weapon-occupancy-conflict":
      return "equipment.weapon-occupancy-conflict";
    case "weapon-requirement-unmet":
      return "equipment.weapon-requirement-unmet";
    case "weapon-requirement-unresolved":
      return "equipment.weapon-requirement-unresolved";
    case "weapon-unresolved":
      return "equipment.weapon-unresolved";
    case "weapon-wrong-hand":
      return "equipment.weapon-wrong-hand";
  }
}

function weaponSourceRule(code: WeaponSetAnalysisIssue["code"]): ValidationRuleId {
  if (code.startsWith("catalog")) {
    return "equipment.catalog";
  }
  if (code.startsWith("weapon-requirement")) {
    return "equipment.weapon-requirement";
  }
  return "equipment.weapon";
}

function armorLocation(index: number, slot: string | null): ValidationLocation {
  return { kind: "armor-piece", index, slot };
}

function weaponSetLocation(index: number, slot: string | null): ValidationLocation {
  return { kind: "weapon-set", index, slot };
}

function weaponLocation(path: readonly (string | number)[]): ValidationLocation | null {
  const setIndex = path[2];
  if (typeof setIndex !== "number") {
    return null;
  }
  const hand = path[3];
  if (hand !== "mainHand" && hand !== "offHand") {
    return { kind: "weapon-set", index: setIndex, slot: null };
  }
  const modifiersIndex = path[5];
  if (path[4] === "modifiers" && typeof modifiersIndex === "number") {
    return { kind: "weapon-modifier", setIndex, hand, index: modifiersIndex };
  }
  return { kind: "weapon-hand", setIndex, hand };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
