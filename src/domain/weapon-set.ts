import type { Build } from "./build";
import type {
  CatalogWeaponBaseRecord,
  CatalogWeaponModRecord,
  WeaponModifierSlot,
  WeaponRequirement
} from "./catalog";
import { calculateEffectiveAttributeRank } from "./effective-attribute-rank";
import type {
  EquipmentSelection,
  EquipmentSelectionState,
  WeaponHandSelection,
  WeaponSet
} from "./equipment";
import { MAX_MODIFIERS_PER_HAND_TO_VALIDATE } from "./equipment";
import type { WeaponId, WeaponModifierId } from "./ids";
import type { TargetedEquipmentAttributeRankAdjustment } from "./equipment-attribute-rank";
import { explainWeaponModCompatibility } from "./weapon-mod-compatibility";
import type { ProfessionAttributeValidationCatalog } from "./validation-context";
import { isFiniteSafeInteger, readNumericId } from "./validation-context";

export interface EquipmentWeaponCatalogView {
  readonly catalogVersion: string | null;
  readonly catalogSetVersion: string | null;
  readonly catalogSetDigest: string | null;
  readonly records: readonly CatalogWeaponBaseRecord[];
}

export interface EquipmentWeaponModifierCatalogView {
  readonly catalogVersion: string | null;
  readonly catalogSetVersion: string | null;
  readonly catalogSetDigest: string | null;
  readonly records: readonly CatalogWeaponModRecord[];
}

export type WeaponSetHand = "mainHand" | "offHand";

export type WeaponSetOccupancyKind =
  | "conflict"
  | "empty"
  | "main-hand-only"
  | "off-hand-only"
  | "paired"
  | "two-handed"
  | "unresolved";

export type WeaponSetAnalysisIssueCode =
  | "catalog-set-mismatch"
  | "catalog-unavailable"
  | "catalog-duplicate-id"
  | "weapon-mode-restricted"
  | "weapon-modifier-compatibility-unresolved"
  | "weapon-modifier-duplicate-slot"
  | "weapon-modifier-incompatible"
  | "weapon-modifier-unresolved"
  | "weapon-modifier-without-weapon"
  | "weapon-occupancy-conflict"
  | "weapon-requirement-unmet"
  | "weapon-requirement-unresolved"
  | "weapon-unresolved"
  | "weapon-wrong-hand";

export interface WeaponSetAnalysisIssue {
  readonly code: WeaponSetAnalysisIssueCode;
  readonly severity: "error" | "warning";
  readonly path: readonly (string | number)[];
  readonly message: string;
  readonly entityKind: "catalog-key" | "weapon" | "weapon-modifier" | "weapon-set";
  readonly entityId: string | number;
}

export interface WeaponModifierAnalysis {
  readonly index: number;
  readonly selection: EquipmentSelectionState<WeaponModifierId>;
  readonly modifierId: number | null;
  readonly modifier: CatalogWeaponModRecord | null;
  readonly occupiedSlot: WeaponModifierSlot | null;
}

export interface WeaponHandAnalysis {
  readonly hand: WeaponSetHand;
  readonly selection: WeaponHandSelection | null;
  readonly weaponId: number | null;
  readonly weapon: CatalogWeaponBaseRecord | null;
  readonly modifiers: readonly WeaponModifierAnalysis[];
}

export interface WeaponSetAnalysis {
  readonly set: WeaponSet;
  readonly setIndex: number | null;
  readonly occupancy: WeaponSetOccupancyKind;
  readonly mainHand: WeaponHandAnalysis;
  readonly offHand: WeaponHandAnalysis;
  readonly issues: readonly WeaponSetAnalysisIssue[];
}

export interface WeaponSetAnalysisInput {
  readonly build?: Build;
  readonly professionAttributes?: ProfessionAttributeValidationCatalog;
  readonly rankAdjustments?: readonly TargetedEquipmentAttributeRankAdjustment[];
  readonly rankAdjustmentsUnresolved?: boolean;
  readonly weaponSet: WeaponSet;
  readonly setIndex?: number;
  readonly weapons?: EquipmentWeaponCatalogView;
  readonly weaponModifiers?: EquipmentWeaponModifierCatalogView;
}

interface CatalogIndex<Record> {
  readonly recordsById: ReadonlyMap<number, Record>;
  readonly ambiguousIds: ReadonlySet<number>;
  readonly issues: readonly WeaponSetAnalysisIssue[];
}

export function analyzeWeaponSet(input: WeaponSetAnalysisInput): WeaponSetAnalysis {
  const setIndex = input.setIndex ?? null;
  const setPath = ["equipment", "weaponSets", setIndex ?? input.weaponSet.slot];
  const weaponIndex =
    input.weapons === undefined
      ? null
      : indexCatalog(
          input.weapons.records,
          (record) => record.id,
          ["equipmentCatalogs", "weapons", "records"],
          "Duplicate weapon catalog IDs are not resolved first-record-wins."
        );
  const modifierIndex =
    input.weaponModifiers === undefined
      ? null
      : indexCatalog(
          input.weaponModifiers.records,
          (record) => record.id,
          ["equipmentCatalogs", "weaponModifiers", "records"],
          "Duplicate weapon modifier catalog IDs are not resolved first-record-wins."
        );
  const issues: WeaponSetAnalysisIssue[] = [
    ...(weaponIndex?.issues ?? []),
    ...(modifierIndex?.issues ?? [])
  ];
  const catalogSetMismatch = catalogsMismatch(input.weapons, input.weaponModifiers);

  const mainHand = analyzeHand("mainHand", input.weaponSet.mainHand, {
    setPath,
    weaponIndex,
    modifierIndex,
    catalogSetMismatch,
    issues,
    input
  });
  const offHand = analyzeHand("offHand", input.weaponSet.offHand, {
    setPath,
    weaponIndex,
    modifierIndex,
    catalogSetMismatch,
    issues,
    input
  });

  issues.push(...validatePlacement(mainHand, offHand, setPath, input.build));
  issues.push(...validateRequirements([mainHand, offHand], setPath, input));

  return {
    set: input.weaponSet,
    setIndex,
    occupancy: resolveOccupancy(mainHand, offHand, issues),
    mainHand,
    offHand,
    issues: dedupeIssues(issues)
  };
}

interface AnalyzeHandState {
  readonly setPath: readonly (string | number)[];
  readonly weaponIndex: CatalogIndex<CatalogWeaponBaseRecord> | null;
  readonly modifierIndex: CatalogIndex<CatalogWeaponModRecord> | null;
  readonly catalogSetMismatch: boolean;
  readonly issues: WeaponSetAnalysisIssue[];
  readonly input: WeaponSetAnalysisInput;
}

function analyzeHand(
  hand: WeaponSetHand,
  selection: WeaponHandSelection | null,
  state: AnalyzeHandState
): WeaponHandAnalysis {
  const handPath = [...state.setPath, hand];
  const weaponSelection = readSelection<WeaponId>(selection?.weapon ?? null);
  const weapon = resolveWeaponSelection(weaponSelection, handPath, state);
  const modifiers = analyzeModifiers(selection, hand, weapon.record, handPath, state);
  return {
    hand,
    selection,
    weaponId: weapon.id,
    weapon: weapon.record,
    modifiers
  };
}

function resolveWeaponSelection(
  selection: EquipmentSelectionState<WeaponId> | null,
  handPath: readonly (string | number)[],
  state: AnalyzeHandState
): {
  readonly id: number | null;
  readonly record: CatalogWeaponBaseRecord | null;
} {
  if (selection === null) {
    return { id: null, record: null };
  }
  if (selection.kind === "unresolved") {
    state.issues.push({
      code: "weapon-unresolved",
      severity: "warning",
      path: [...handPath, "weapon"],
      message: "Weapon selection is unresolved.",
      entityKind: "weapon",
      entityId: selection.candidateCatalogId ?? "unresolved"
    });
    return { id: null, record: null };
  }
  const id = readNumericId(selection.id);
  if (id === null) {
    state.issues.push(unresolvedWeaponIssue([...handPath, "weapon"], "invalid"));
    return { id: null, record: null };
  }
  if (state.weaponIndex === null) {
    state.issues.push({
      code: "catalog-unavailable",
      severity: "warning",
      path: [...handPath, "weapon"],
      message: "Weapon catalog view is required before weapon selection can be resolved.",
      entityKind: "weapon",
      entityId: id
    });
    return { id, record: null };
  }
  if (state.weaponIndex.ambiguousIds.has(id)) {
    state.issues.push(unresolvedWeaponIssue([...handPath, "weapon"], id));
    return { id, record: null };
  }
  const record = state.weaponIndex.recordsById.get(id) ?? null;
  if (record === null) {
    state.issues.push(unresolvedWeaponIssue([...handPath, "weapon"], id));
  }
  return { id, record };
}

function analyzeModifiers(
  handSelection: WeaponHandSelection | null,
  hand: WeaponSetHand,
  weapon: CatalogWeaponBaseRecord | null,
  handPath: readonly (string | number)[],
  state: AnalyzeHandState
): readonly WeaponModifierAnalysis[] {
  const rawModifiers = Array.isArray(handSelection?.modifiers) ? handSelection.modifiers : [];
  const modifiers: WeaponModifierAnalysis[] = [];
  for (
    let index = 0;
    index < Math.min(rawModifiers.length, MAX_MODIFIERS_PER_HAND_TO_VALIDATE);
    index += 1
  ) {
    const selection = readSelection<WeaponModifierId>(rawModifiers[index]);
    if (selection === null) {
      continue;
    }
    const modifier = resolveModifierSelection(selection, [...handPath, "modifiers", index], state);
    modifiers.push({
      index,
      selection,
      modifierId: modifier.id,
      modifier: modifier.record,
      occupiedSlot: modifier.record?.occupiedSlot ?? null
    });
    validateModifierAttachment(
      hand,
      weapon,
      modifier.record,
      [...handPath, "modifiers", index],
      state
    );
  }
  validateDuplicateModifierSlots(weapon, modifiers, handPath, state.issues);
  return modifiers;
}

function resolveModifierSelection(
  selection: EquipmentSelectionState<WeaponModifierId>,
  path: readonly (string | number)[],
  state: AnalyzeHandState
): {
  readonly id: number | null;
  readonly record: CatalogWeaponModRecord | null;
} {
  if (selection.kind === "unresolved") {
    state.issues.push({
      code: "weapon-modifier-unresolved",
      severity: "warning",
      path,
      message: "Weapon modifier selection is unresolved.",
      entityKind: "weapon-modifier",
      entityId: selection.candidateCatalogId ?? "unresolved"
    });
    return { id: null, record: null };
  }
  const id = readNumericId(selection.id);
  if (id === null) {
    state.issues.push(unresolvedModifierIssue(path, "invalid"));
    return { id: null, record: null };
  }
  if (state.modifierIndex === null) {
    state.issues.push({
      code: "catalog-unavailable",
      severity: "warning",
      path,
      message:
        "Weapon modifier catalog view is required before modifier selection can be resolved.",
      entityKind: "weapon-modifier",
      entityId: id
    });
    return { id, record: null };
  }
  if (state.modifierIndex.ambiguousIds.has(id)) {
    state.issues.push(unresolvedModifierIssue(path, id));
    return { id, record: null };
  }
  const record = state.modifierIndex.recordsById.get(id) ?? null;
  if (record === null) {
    state.issues.push(unresolvedModifierIssue(path, id));
  }
  return { id, record };
}

function validateModifierAttachment(
  hand: WeaponSetHand,
  weapon: CatalogWeaponBaseRecord | null,
  modifier: CatalogWeaponModRecord | null,
  path: readonly (string | number)[],
  state: AnalyzeHandState
): void {
  if (modifier === null) {
    return;
  }
  if (weapon === null) {
    state.issues.push({
      code: "weapon-modifier-without-weapon",
      severity: "warning",
      path,
      message: "Weapon modifier cannot be validated without a resolved weapon selection.",
      entityKind: "weapon-modifier",
      entityId: Number(modifier.id)
    });
    return;
  }
  if (state.catalogSetMismatch) {
    state.issues.push({
      code: "catalog-set-mismatch",
      severity: "warning",
      path: ["equipmentCatalogs", "weaponModifiers"],
      message:
        "Weapon and modifier catalog-set identifiers differ, so compatibility is unresolved.",
      entityKind: "catalog-key",
      entityId: "weapon-catalog-set"
    });
    state.issues.push({
      code: "weapon-modifier-compatibility-unresolved",
      severity: "warning",
      path,
      message: "Weapon modifier compatibility is unresolved because catalog sets differ.",
      entityKind: "weapon-modifier",
      entityId: Number(modifier.id)
    });
    return;
  }
  const compatibility = explainWeaponModCompatibility(weapon, modifier);
  if (compatibility.kind === "incompatible") {
    state.issues.push({
      code: "weapon-modifier-incompatible",
      severity: "error",
      path,
      message: "Weapon modifier is incompatible with the selected weapon.",
      entityKind: "weapon-modifier",
      entityId: Number(modifier.id)
    });
  } else if (compatibility.kind === "indeterminate") {
    state.issues.push({
      code: "weapon-modifier-compatibility-unresolved",
      severity: "warning",
      path,
      message: "Weapon modifier compatibility is unresolved.",
      entityKind: "weapon-modifier",
      entityId: Number(modifier.id)
    });
  }

  if (hand === "offHand" && weapon.handedness === "two-handed") {
    state.issues.push({
      code: "weapon-wrong-hand",
      severity: "error",
      path,
      message: "Two-handed weapon modifiers cannot make an off-hand weapon legal.",
      entityKind: "weapon-modifier",
      entityId: Number(modifier.id)
    });
  }
}

function validateDuplicateModifierSlots(
  weapon: CatalogWeaponBaseRecord | null,
  modifiers: readonly WeaponModifierAnalysis[],
  handPath: readonly (string | number)[],
  issues: WeaponSetAnalysisIssue[]
): void {
  if (weapon === null) {
    return;
  }
  const counts = new Map<WeaponModifierSlot, WeaponModifierAnalysis[]>();
  for (const modifier of modifiers) {
    if (modifier.occupiedSlot !== null) {
      counts.set(modifier.occupiedSlot, [...(counts.get(modifier.occupiedSlot) ?? []), modifier]);
    }
  }
  for (const [slot, members] of counts) {
    if (members.length < 2) {
      continue;
    }
    const allowed = weapon.allowedModifierSlots.find((candidate) => candidate.slot === slot);
    if (allowed?.cardinality === "zero-or-more") {
      continue;
    }
    issues.push({
      code: "weapon-modifier-duplicate-slot",
      severity: "error",
      path: [...handPath, "modifiers"],
      message: "Weapon has more than one modifier occupying the same exclusive slot.",
      entityKind: "catalog-key",
      entityId: slot
    });
  }
}

function validatePlacement(
  mainHand: WeaponHandAnalysis,
  offHand: WeaponHandAnalysis,
  setPath: readonly (string | number)[],
  build: Build | undefined
): readonly WeaponSetAnalysisIssue[] {
  const issues: WeaponSetAnalysisIssue[] = [];
  if (mainHand.weapon !== null && mainHand.weapon.equipRole === "off-hand") {
    issues.push(wrongHandIssue([...setPath, "mainHand", "weapon"], Number(mainHand.weapon.id)));
  }
  if (offHand.weapon !== null && offHand.weapon.equipRole !== "off-hand") {
    issues.push(wrongHandIssue([...setPath, "offHand", "weapon"], Number(offHand.weapon.id)));
  }
  if (
    mainHand.weapon !== null &&
    isTwoHanded(mainHand.weapon) &&
    handHasAuthoredState(offHand.selection)
  ) {
    issues.push({
      code: "weapon-occupancy-conflict",
      severity: "error",
      path: [...setPath, "offHand"],
      message: "A two-handed main-hand weapon cannot coexist with off-hand authored state.",
      entityKind: "weapon-set",
      entityId: setPath.at(-1) ?? "weapon-set"
    });
  }
  if (build !== undefined) {
    issues.push(...validateWeaponMode(mainHand, [...setPath, "mainHand", "weapon"], build));
    issues.push(...validateWeaponMode(offHand, [...setPath, "offHand", "weapon"], build));
  }
  return issues;
}

function validateWeaponMode(
  hand: WeaponHandAnalysis,
  path: readonly (string | number)[],
  build: Build
): readonly WeaponSetAnalysisIssue[] {
  if (hand.weapon === null || build.mode === "unknown" || hand.weapon.modeAvailability === "both") {
    return [];
  }
  if (
    (build.mode === "pve" && hand.weapon.modeAvailability === "pvp-only") ||
    (build.mode === "pvp" && hand.weapon.modeAvailability === "pve-only")
  ) {
    return [
      {
        code: "weapon-mode-restricted",
        severity: "error",
        path,
        message: "Weapon is not available in the selected build mode.",
        entityKind: "weapon",
        entityId: Number(hand.weapon.id)
      }
    ];
  }
  return [];
}

function validateRequirements(
  hands: readonly WeaponHandAnalysis[],
  setPath: readonly (string | number)[],
  input: WeaponSetAnalysisInput
): readonly WeaponSetAnalysisIssue[] {
  const issues: WeaponSetAnalysisIssue[] = [];
  for (const hand of hands) {
    if (hand.weapon === null || hand.selection === null) {
      continue;
    }
    const requirement = resolveRequirement(hand.weapon.requirement, hand.selection.requirement);
    if (requirement.kind === "none") {
      continue;
    }
    const path = [...setPath, hand.hand, "requirement"];
    if (requirement.kind === "unresolved") {
      issues.push(requirementUnresolvedIssue(path, Number(hand.weapon.id)));
      continue;
    }
    const rankIssue = evaluateRequirementRank(requirement, path, Number(hand.weapon.id), input);
    if (rankIssue !== null) {
      issues.push(rankIssue);
    }
  }
  return issues;
}

function resolveRequirement(
  catalogRequirement: WeaponRequirement,
  authoredRequirement: WeaponHandSelection["requirement"]
): WeaponRequirement {
  if (catalogRequirement.kind !== "unresolved") {
    return catalogRequirement;
  }
  if (
    authoredRequirement === null ||
    authoredRequirement.reason !== "catalog-unresolved" ||
    authoredRequirement.attribute === null ||
    authoredRequirement.attribute.kind !== "known" ||
    !isFiniteSafeInteger(authoredRequirement.rank) ||
    authoredRequirement.rank < 0
  ) {
    return catalogRequirement;
  }
  return {
    kind: "attribute-rank",
    attributeId: authoredRequirement.attribute.id,
    attributeName: "authored fallback",
    rank: authoredRequirement.rank,
    provenance: {
      sourceIds: ["authored-equipment"],
      claimIds: [],
      reviewIds: [],
      notes: "Authored fallback for catalog-unresolved weapon requirement."
    }
  };
}

function evaluateRequirementRank(
  requirement: Extract<WeaponRequirement, { readonly kind: "attribute-rank" }>,
  path: readonly (string | number)[],
  weaponId: number,
  input: WeaponSetAnalysisInput
): WeaponSetAnalysisIssue | null {
  if (
    input.build === undefined ||
    input.professionAttributes === undefined ||
    input.rankAdjustmentsUnresolved === true ||
    !isFiniteSafeInteger(requirement.rank) ||
    requirement.rank < 0
  ) {
    return requirementUnresolvedIssue(path, weaponId);
  }
  const result = calculateEffectiveAttributeRank({
    build: input.build,
    professionAttributes: input.professionAttributes,
    attributeId: requirement.attributeId,
    adjustments: (input.rankAdjustments ?? [])
      .filter((adjustment) => Number(adjustment.attributeId) === Number(requirement.attributeId))
      .map((adjustment) => adjustment.adjustment)
  });
  if (result.kind === "unresolved") {
    return requirementUnresolvedIssue(path, weaponId);
  }
  if (result.finalRank < requirement.rank) {
    return {
      code: "weapon-requirement-unmet",
      severity: "warning",
      path,
      message: "Selected weapon requirement is not met by the build's effective attribute rank.",
      entityKind: "weapon",
      entityId: weaponId
    };
  }
  return null;
}

function resolveOccupancy(
  mainHand: WeaponHandAnalysis,
  offHand: WeaponHandAnalysis,
  issues: readonly WeaponSetAnalysisIssue[]
): WeaponSetOccupancyKind {
  if (
    issues.some(
      (issue) =>
        issue.code === "weapon-occupancy-conflict" ||
        issue.code === "weapon-wrong-hand" ||
        issue.code === "weapon-modifier-incompatible" ||
        issue.code === "weapon-modifier-duplicate-slot"
    )
  ) {
    return "conflict";
  }
  if (
    issues.some(
      (issue) =>
        issue.code === "weapon-unresolved" ||
        issue.code === "weapon-modifier-unresolved" ||
        issue.code === "weapon-modifier-without-weapon" ||
        issue.code === "weapon-modifier-compatibility-unresolved" ||
        issue.code === "catalog-unavailable" ||
        issue.code === "catalog-set-mismatch"
    )
  ) {
    return "unresolved";
  }
  if (mainHand.weapon === null && offHand.weapon === null) {
    return "empty";
  }
  if (mainHand.weapon !== null && isTwoHanded(mainHand.weapon)) {
    return "two-handed";
  }
  if (mainHand.weapon !== null && offHand.weapon !== null) {
    return "paired";
  }
  if (mainHand.weapon !== null) {
    return "main-hand-only";
  }
  return "off-hand-only";
}

function isTwoHanded(weapon: CatalogWeaponBaseRecord): boolean {
  return weapon.equipRole === "two-hand" || weapon.handedness === "two-handed";
}

function handHasAuthoredState(hand: WeaponHandSelection | null): boolean {
  return (
    hand !== null &&
    (hand.weapon !== null || hand.modifiers.length > 0 || hand.requirement !== null)
  );
}

function catalogsMismatch(
  weapons: EquipmentWeaponCatalogView | undefined,
  modifiers: EquipmentWeaponModifierCatalogView | undefined
): boolean {
  if (weapons === undefined || modifiers === undefined) {
    return false;
  }
  return (
    weapons.catalogSetVersion !== modifiers.catalogSetVersion ||
    weapons.catalogSetDigest !== modifiers.catalogSetDigest
  );
}

function indexCatalog<Record>(
  records: readonly Record[],
  idForRecord: (record: Record) => unknown,
  path: readonly (string | number)[],
  message: string
): CatalogIndex<Record> {
  const buckets = new Map<number, Record[]>();
  for (const record of records) {
    const id = readNumericId(idForRecord(record));
    if (id === null) {
      continue;
    }
    buckets.set(id, [...(buckets.get(id) ?? []), record]);
  }

  const recordsById = new Map<number, Record>();
  const ambiguousIds = new Set<number>();
  const issues: WeaponSetAnalysisIssue[] = [];
  for (const [id, bucket] of buckets) {
    if (bucket.length === 1) {
      const record = bucket[0];
      if (record !== undefined) {
        recordsById.set(id, record);
      }
    } else {
      ambiguousIds.add(id);
      issues.push({
        code: "catalog-duplicate-id",
        severity: "warning",
        path,
        message,
        entityKind: "catalog-key",
        entityId: id
      });
    }
  }
  return { recordsById, ambiguousIds, issues };
}

function readSelection<Id>(value: unknown): EquipmentSelectionState<Id> | null {
  if (value === null || value === undefined || !isRecord(value)) {
    return null;
  }
  if (value.kind === "known" && isFiniteSafeInteger(value.id) && value.id >= 0) {
    return value as unknown as EquipmentSelection<Id>;
  }
  if (value.kind === "unresolved") {
    return value as unknown as EquipmentSelectionState<Id>;
  }
  return null;
}

function unresolvedWeaponIssue(
  path: readonly (string | number)[],
  id: string | number
): WeaponSetAnalysisIssue {
  return {
    code: "weapon-unresolved",
    severity: "warning",
    path,
    message: "Weapon ID is not resolved in the supplied weapon catalog.",
    entityKind: "weapon",
    entityId: id
  };
}

function unresolvedModifierIssue(
  path: readonly (string | number)[],
  id: string | number
): WeaponSetAnalysisIssue {
  return {
    code: "weapon-modifier-unresolved",
    severity: "warning",
    path,
    message: "Weapon modifier ID is not resolved in the supplied modifier catalog.",
    entityKind: "weapon-modifier",
    entityId: id
  };
}

function wrongHandIssue(
  path: readonly (string | number)[],
  weaponId: number
): WeaponSetAnalysisIssue {
  return {
    code: "weapon-wrong-hand",
    severity: "error",
    path,
    message: "Weapon is authored in a hand that does not match catalog equip-role facts.",
    entityKind: "weapon",
    entityId: weaponId
  };
}

function requirementUnresolvedIssue(
  path: readonly (string | number)[],
  weaponId: number
): WeaponSetAnalysisIssue {
  return {
    code: "weapon-requirement-unresolved",
    severity: "warning",
    path,
    message: "Weapon requirement cannot be resolved from current catalog and rank evidence.",
    entityKind: "weapon",
    entityId: weaponId
  };
}

function dedupeIssues(
  issues: readonly WeaponSetAnalysisIssue[]
): readonly WeaponSetAnalysisIssue[] {
  const byKey = new Map<string, WeaponSetAnalysisIssue>();
  for (const issue of issues) {
    byKey.set(`${issue.code}:${issue.path.join(".")}:${issue.entityKind}:${issue.entityId}`, issue);
  }
  return [...byKey.values()].sort(
    (left, right) =>
      compareString(left.path.join("."), right.path.join(".")) ||
      compareString(left.code, right.code) ||
      compareString(String(left.entityId), String(right.entityId))
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compareString(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
