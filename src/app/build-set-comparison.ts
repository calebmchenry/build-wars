import {
  ARMOR_SLOTS,
  WEAPON_SET_SLOTS,
  type ArmorPiece,
  type AttributeId,
  type Build,
  type BuildSetEntryId,
  type EquipmentSelectionState,
  type WeaponHandSelection,
  type WeaponSet
} from "../domain";
import type { AppCatalogViews } from "./catalogs";
import type { RawTemplateOverlayEntry } from "./editor-state";
import type { PersistedBuildSetEntrySnapshot, PersistedBuildSnapshot } from "./persistence-schema";
import { materializeActiveBuildSetSnapshot, type WorkspaceState } from "./workspace-state";

export type BuildSetComparisonGroupKey =
  | "identity"
  | "professions"
  | "mode"
  | "skills"
  | "attributes"
  | "pve"
  | "titles"
  | "equipment"
  | "raw";

export type BuildSetComparisonValueStatus =
  "empty" | "configured" | "stale" | "retained" | "unresolved";

export interface BuildSetComparisonValue {
  readonly status: BuildSetComparisonValueStatus;
  readonly label: string;
  readonly normalized: string;
}

export interface BuildSetComparisonRow {
  readonly key: string;
  readonly group: BuildSetComparisonGroupKey;
  readonly groupLabel: string;
  readonly label: string;
  readonly left: BuildSetComparisonValue;
  readonly right: BuildSetComparisonValue;
  readonly changed: boolean;
}

export interface BuildSetComparisonGroup {
  readonly key: BuildSetComparisonGroupKey;
  readonly label: string;
  readonly rows: readonly BuildSetComparisonRow[];
}

export type BuildSetComparisonView =
  | {
      readonly status: "not-build-set";
    }
  | {
      readonly status: "missing-selection";
    }
  | {
      readonly status: "missing-comparison";
    }
  | {
      readonly status: "ready";
      readonly selectedEntryId: BuildSetEntryId;
      readonly comparisonEntryId: BuildSetEntryId;
      readonly selectedLabel: string;
      readonly comparisonLabel: string;
      readonly allRows: readonly BuildSetComparisonRow[];
      readonly changedGroups: readonly BuildSetComparisonGroup[];
      readonly changedRowCount: number;
      readonly hasDifferences: boolean;
    };

const GROUP_LABELS: Record<BuildSetComparisonGroupKey, string> = {
  identity: "Identity",
  professions: "Professions",
  mode: "Mode",
  skills: "Skills",
  attributes: "Attributes",
  pve: "PvE Budget",
  titles: "Title Ranks",
  equipment: "Equipment",
  raw: "Raw Facts"
};

const GROUP_ORDER: readonly BuildSetComparisonGroupKey[] = [
  "identity",
  "professions",
  "mode",
  "skills",
  "attributes",
  "pve",
  "titles",
  "equipment",
  "raw"
];

type CatalogRecord<Id> = {
  readonly id: Id;
  readonly name: string;
};

export function selectBuildSetComparisonView(
  workspace: WorkspaceState,
  catalogs: AppCatalogViews
): BuildSetComparisonView {
  if (workspace.document.kind !== "build-set") {
    return { status: "not-build-set" };
  }
  const snapshot = materializeActiveBuildSetSnapshot(workspace);
  const selectedEntryId = snapshot?.lastSelectedEntryId ?? null;
  if (snapshot === null || selectedEntryId === null) {
    return { status: "missing-selection" };
  }
  const comparisonEntryId = workspace.document.comparisonEntryId;
  if (comparisonEntryId === null) {
    return { status: "missing-comparison" };
  }
  const selected = snapshot.entries.find((entry) => entry.id === selectedEntryId);
  const comparison = snapshot.entries.find((entry) => entry.id === comparisonEntryId);
  if (selected === undefined || comparison === undefined) {
    return { status: "missing-comparison" };
  }
  const allRows = compareEntries(selected, comparison, catalogs);
  const changedGroups = groupRows(allRows.filter((row) => row.changed));
  return {
    status: "ready",
    selectedEntryId,
    comparisonEntryId,
    selectedLabel: selected.label,
    comparisonLabel: comparison.label,
    allRows,
    changedGroups,
    changedRowCount: changedGroups.reduce((total, group) => total + group.rows.length, 0),
    hasDifferences: changedGroups.length > 0
  };
}

export function compareBuildSetEntries(
  left: PersistedBuildSetEntrySnapshot,
  right: PersistedBuildSetEntrySnapshot,
  catalogs: AppCatalogViews
): readonly BuildSetComparisonRow[] {
  return compareEntries(left, right, catalogs);
}

function compareEntries(
  left: PersistedBuildSetEntrySnapshot,
  right: PersistedBuildSetEntrySnapshot,
  catalogs: AppCatalogViews
): readonly BuildSetComparisonRow[] {
  const rows: BuildSetComparisonRow[] = [];
  addRow(
    rows,
    "identity",
    "entry.label",
    "Entry label",
    textValue(left.label),
    textValue(right.label)
  );
  addRow(rows, "identity", "entry.kind", "Entry kind", textValue(left.kind), textValue(right.kind));
  addRow(
    rows,
    "identity",
    "build.name",
    "Build name",
    textValue(left.snapshot.build.name),
    textValue(right.snapshot.build.name)
  );
  addRow(
    rows,
    "raw",
    "entry.notes",
    "Entry notes",
    notesValue(left.notes),
    notesValue(right.notes)
  );

  compareBuild(rows, left.snapshot, right.snapshot, catalogs);
  return rows.sort(compareRows);
}

function compareBuild(
  rows: BuildSetComparisonRow[],
  left: PersistedBuildSnapshot,
  right: PersistedBuildSnapshot,
  catalogs: AppCatalogViews
): void {
  const leftBuild = left.build;
  const rightBuild = right.build;
  addRow(
    rows,
    "professions",
    "build.primaryProfessionId",
    "Primary profession",
    catalogValue(leftBuild.primaryProfessionId, catalogs.professions, "profession"),
    catalogValue(rightBuild.primaryProfessionId, catalogs.professions, "profession")
  );
  addRow(
    rows,
    "professions",
    "build.secondaryProfessionId",
    "Secondary profession",
    catalogValue(leftBuild.secondaryProfessionId, catalogs.professions, "profession"),
    catalogValue(rightBuild.secondaryProfessionId, catalogs.professions, "profession")
  );
  addRow(rows, "mode", "build.mode", "Mode", textValue(leftBuild.mode), textValue(rightBuild.mode));
  compareSkills(rows, leftBuild, rightBuild, catalogs);
  compareAttributes(rows, leftBuild, rightBuild, catalogs);
  comparePveBudget(rows, left, right);
  compareTitleRanks(rows, leftBuild, rightBuild, catalogs);
  compareEquipment(rows, leftBuild, rightBuild, catalogs);
  compareRawFacts(rows, left, right);
}

function compareSkills(
  rows: BuildSetComparisonRow[],
  left: Build,
  right: Build,
  catalogs: AppCatalogViews
): void {
  left.skillBar.forEach((leftSkillId, index) => {
    const rightSkillId = right.skillBar[index] ?? null;
    addRow(
      rows,
      "skills",
      `build.skillBar.${index}`,
      `Skill ${index + 1}`,
      catalogValue(leftSkillId, catalogs.skills, "skill"),
      catalogValue(rightSkillId, catalogs.skills, "skill")
    );
  });
}

function compareAttributes(
  rows: BuildSetComparisonRow[],
  left: Build,
  right: Build,
  catalogs: AppCatalogViews
): void {
  const leftRanks = new Map(
    left.attributes.map((allocation) => [allocation.attributeId, allocation.rank])
  );
  const rightRanks = new Map(
    right.attributes.map((allocation) => [allocation.attributeId, allocation.rank])
  );
  const ids = uniqueSortedNumbers([...leftRanks.keys(), ...rightRanks.keys()]);
  for (const id of ids) {
    const attributeId = id as AttributeId;
    const label = catalogLabel(attributeId, catalogs.attributes, "attribute");
    addRow(
      rows,
      "attributes",
      `build.attributes.${id}`,
      label,
      rankValue(attributeId, leftRanks.get(attributeId) ?? null, catalogs.attributes, "attribute"),
      rankValue(attributeId, rightRanks.get(attributeId) ?? null, catalogs.attributes, "attribute")
    );
  }
}

function comparePveBudget(
  rows: BuildSetComparisonRow[],
  left: PersistedBuildSnapshot,
  right: PersistedBuildSnapshot
): void {
  addRow(
    rows,
    "pve",
    "pveBudget.level",
    "Level",
    numberValue(left.pveBudget.level),
    numberValue(right.pveBudget.level)
  );
  addRow(
    rows,
    "pve",
    "pveBudget.questBonus",
    "Quest bonus",
    textValue(left.pveBudget.questBonus),
    textValue(right.pveBudget.questBonus)
  );
}

function compareTitleRanks(
  rows: BuildSetComparisonRow[],
  left: Build,
  right: Build,
  catalogs: AppCatalogViews
): void {
  const leftRanks = new Map(
    left.titleRankOverrides.map((override) => [override.key, override.rank])
  );
  const rightRanks = new Map(
    right.titleRankOverrides.map((override) => [override.key, override.rank])
  );
  for (const key of uniqueSortedStrings([...leftRanks.keys(), ...rightRanks.keys()])) {
    const definition = catalogs.titleRanks.byCanonicalKey.get(key);
    const label = definition?.label ?? key;
    addRow(
      rows,
      "titles",
      `build.titleRankOverrides.${key}`,
      label,
      titleRankValue(key, leftRanks.get(key) ?? null, catalogs),
      titleRankValue(key, rightRanks.get(key) ?? null, catalogs)
    );
  }
}

function compareEquipment(
  rows: BuildSetComparisonRow[],
  left: Build,
  right: Build,
  catalogs: AppCatalogViews
): void {
  addRow(
    rows,
    "equipment",
    "build.equipment",
    "Equipment loadout",
    left.equipment === null ? emptyValue() : configuredValue("configured", "equipment:present"),
    right.equipment === null ? emptyValue() : configuredValue("configured", "equipment:present")
  );
  for (const slot of ARMOR_SLOTS) {
    const leftPiece = left.equipment?.armor.find((piece) => piece.slot === slot) ?? null;
    const rightPiece = right.equipment?.armor.find((piece) => piece.slot === slot) ?? null;
    compareArmorPiece(rows, slot, leftPiece, rightPiece, catalogs);
  }
  for (const slot of WEAPON_SET_SLOTS) {
    const leftSet = left.equipment?.weaponSets.find((set) => set.slot === slot) ?? null;
    const rightSet = right.equipment?.weaponSets.find((set) => set.slot === slot) ?? null;
    compareWeaponSet(rows, slot, leftSet, rightSet, catalogs);
  }
}

function compareArmorPiece(
  rows: BuildSetComparisonRow[],
  slot: string,
  left: ArmorPiece | null,
  right: ArmorPiece | null,
  catalogs: AppCatalogViews
): void {
  addRow(
    rows,
    "equipment",
    `build.equipment.armor.${slot}.headgearAttribute`,
    `${titleCase(slot)} headgear`,
    selectionValue(left?.headgearAttribute ?? null, catalogs.attributes, "attribute"),
    selectionValue(right?.headgearAttribute ?? null, catalogs.attributes, "attribute")
  );
  addRow(
    rows,
    "equipment",
    `build.equipment.armor.${slot}.insignia`,
    `${titleCase(slot)} insignia`,
    selectionValue(left?.insignia ?? null, catalogs.equipment.insignias, "insignia"),
    selectionValue(right?.insignia ?? null, catalogs.equipment.insignias, "insignia")
  );
  addRow(
    rows,
    "equipment",
    `build.equipment.armor.${slot}.rune`,
    `${titleCase(slot)} rune`,
    selectionValue(left?.rune ?? null, catalogs.equipment.runes, "rune"),
    selectionValue(right?.rune ?? null, catalogs.equipment.runes, "rune")
  );
}

function compareWeaponSet(
  rows: BuildSetComparisonRow[],
  slot: string,
  left: WeaponSet | null,
  right: WeaponSet | null,
  catalogs: AppCatalogViews
): void {
  compareWeaponHand(
    rows,
    `${slot}.mainHand`,
    `${titleCase(slot)} main hand`,
    left?.mainHand ?? null,
    right?.mainHand ?? null,
    catalogs
  );
  compareWeaponHand(
    rows,
    `${slot}.offHand`,
    `${titleCase(slot)} off hand`,
    left?.offHand ?? null,
    right?.offHand ?? null,
    catalogs
  );
}

function compareWeaponHand(
  rows: BuildSetComparisonRow[],
  path: string,
  label: string,
  left: WeaponHandSelection | null,
  right: WeaponHandSelection | null,
  catalogs: AppCatalogViews
): void {
  addRow(
    rows,
    "equipment",
    `build.equipment.weaponSets.${path}.weapon`,
    `${label} weapon`,
    selectionValue(left?.weapon ?? null, catalogs.equipment.weapons, "weapon"),
    selectionValue(right?.weapon ?? null, catalogs.equipment.weapons, "weapon")
  );
  addRow(
    rows,
    "equipment",
    `build.equipment.weaponSets.${path}.modifiers`,
    `${label} modifiers`,
    selectionListValue(
      left?.modifiers ?? [],
      catalogs.equipment.weaponModifiers,
      "weapon modifier"
    ),
    selectionListValue(
      right?.modifiers ?? [],
      catalogs.equipment.weaponModifiers,
      "weapon modifier"
    )
  );
  addRow(
    rows,
    "equipment",
    `build.equipment.weaponSets.${path}.requirement`,
    `${label} requirement`,
    requirementValue(left, catalogs),
    requirementValue(right, catalogs)
  );
}

function compareRawFacts(
  rows: BuildSetComparisonRow[],
  left: PersistedBuildSnapshot,
  right: PersistedBuildSnapshot
): void {
  addRawRow(
    rows,
    "raw.primaryProfession",
    "Raw primary profession",
    left.rawTemplate.primaryProfession,
    right.rawTemplate.primaryProfession
  );
  addRawRow(
    rows,
    "raw.secondaryProfession",
    "Raw secondary profession",
    left.rawTemplate.secondaryProfession,
    right.rawTemplate.secondaryProfession
  );
  const attributeRows = Math.max(
    left.rawTemplate.attributes.length,
    right.rawTemplate.attributes.length
  );
  for (let index = 0; index < attributeRows; index += 1) {
    addRawRow(
      rows,
      `raw.attributes.${index}`,
      `Raw attribute ${index + 1}`,
      left.rawTemplate.attributes[index] ?? null,
      right.rawTemplate.attributes[index] ?? null
    );
  }
  left.rawTemplate.skillBar.forEach((leftSkill, index) =>
    addRawRow(
      rows,
      `raw.skillBar.${index}`,
      `Raw skill ${index + 1}`,
      leftSkill,
      right.rawTemplate.skillBar[index] ?? null
    )
  );
}

function addRawRow(
  rows: BuildSetComparisonRow[],
  key: string,
  label: string,
  left: RawTemplateOverlayEntry | null,
  right: RawTemplateOverlayEntry | null
): void {
  if (!isMeaningfulRaw(left) && !isMeaningfulRaw(right)) {
    return;
  }
  addRow(rows, "raw", key, label, rawValue(left), rawValue(right));
}

function addRow(
  rows: BuildSetComparisonRow[],
  group: BuildSetComparisonGroupKey,
  key: string,
  label: string,
  left: BuildSetComparisonValue,
  right: BuildSetComparisonValue
): void {
  rows.push({
    key,
    group,
    groupLabel: GROUP_LABELS[group],
    label,
    left,
    right,
    changed: left.normalized !== right.normalized
  });
}

function catalogValue<Id>(
  id: Id | null,
  records: readonly CatalogRecord<Id>[],
  noun: string
): BuildSetComparisonValue {
  if (id === null) {
    return emptyValue();
  }
  const record = records.find((candidate) => Number(candidate.id) === Number(id));
  if (record === undefined) {
    return {
      status: "stale",
      label: `Stale ${noun} ${Number(id)}`,
      normalized: `${noun}:${Number(id)}`
    };
  }
  return configuredValue(record.name, `${noun}:${Number(id)}`);
}

function rankValue<Id>(
  id: Id,
  rank: number | null,
  records: readonly CatalogRecord<Id>[],
  noun: string
): BuildSetComparisonValue {
  if (rank === null) {
    return emptyValue();
  }
  const base = catalogValue(id, records, noun);
  return {
    status: base.status,
    label: `${base.label} rank ${rank}`,
    normalized: `${base.normalized}:rank:${rank}`
  };
}

function titleRankValue(
  key: string,
  rank: number | null,
  catalogs: AppCatalogViews
): BuildSetComparisonValue {
  if (rank === null) {
    return emptyValue();
  }
  const definition = catalogs.titleRanks.byCanonicalKey.get(key);
  if (definition === undefined) {
    return {
      status: "stale",
      label: `Stale title ${key} rank ${rank}`,
      normalized: `${key}:${rank}`
    };
  }
  return configuredValue(`${definition.label} rank ${rank}`, `${key}:${rank}`);
}

function selectionValue<Id>(
  selection: EquipmentSelectionState<Id> | null,
  records: readonly CatalogRecord<Id>[],
  noun: string
): BuildSetComparisonValue {
  if (selection === null) {
    return emptyValue();
  }
  if (selection.kind === "unresolved") {
    return {
      status: "unresolved",
      label: selection.label ?? `Unresolved ${noun}`,
      normalized: `${noun}:unresolved:${selection.candidateCatalogId ?? ""}:${selection.label ?? ""}:${selection.reason}`
    };
  }
  const record = records.find((candidate) => Number(candidate.id) === Number(selection.id));
  if (record === undefined) {
    return {
      status: "retained",
      label: `Retained ${noun} ${Number(selection.id)}`,
      normalized: `${noun}:${Number(selection.id)}`
    };
  }
  return configuredValue(record.name, `${noun}:${Number(selection.id)}`);
}

function selectionListValue<Id>(
  selections: readonly EquipmentSelectionState<Id>[],
  records: readonly CatalogRecord<Id>[],
  noun: string
): BuildSetComparisonValue {
  if (selections.length === 0) {
    return emptyValue();
  }
  const values = selections.map((selection) => selectionValue(selection, records, noun));
  return {
    status: combineStatuses(values),
    label: values.map((value) => value.label).join(", "),
    normalized: values.map((value) => value.normalized).join("|")
  };
}

function requirementValue(
  hand: WeaponHandSelection | null,
  catalogs: AppCatalogViews
): BuildSetComparisonValue {
  if (hand?.requirement === null || hand?.requirement === undefined) {
    return emptyValue();
  }
  const attribute = selectionValue(hand.requirement.attribute, catalogs.attributes, "attribute");
  return {
    status: attribute.status === "empty" ? "configured" : attribute.status,
    label: `${attribute.label} ${hand.requirement.rank ?? "any"} (${hand.requirement.reason})`,
    normalized: `${attribute.normalized}:${hand.requirement.rank ?? ""}:${hand.requirement.reason}`
  };
}

function rawValue(entry: RawTemplateOverlayEntry | null): BuildSetComparisonValue {
  if (entry === null) {
    return emptyValue();
  }
  return {
    status: entry.outcomeKind === "known" ? "configured" : "unresolved",
    label: `${entry.label} (${entry.outcomeKind})`,
    normalized: `${entry.namespace}:${entry.templateId}:${entry.catalogId ?? ""}:${entry.outcomeKind}:${entry.label}:${entry.reason ?? ""}`
  };
}

function notesValue(notes: string | null): BuildSetComparisonValue {
  return notes === null ? emptyValue() : textValue(notes);
}

function textValue(value: string): BuildSetComparisonValue {
  return value.trim().length === 0 ? emptyValue() : configuredValue(value, value);
}

function numberValue(value: number): BuildSetComparisonValue {
  return configuredValue(String(value), String(value));
}

function emptyValue(): BuildSetComparisonValue {
  return { status: "empty", label: "Empty", normalized: "" };
}

function configuredValue(label: string, normalized: string): BuildSetComparisonValue {
  return { status: "configured", label, normalized };
}

function combineStatuses(
  values: readonly BuildSetComparisonValue[]
): BuildSetComparisonValueStatus {
  if (values.some((value) => value.status === "unresolved")) {
    return "unresolved";
  }
  if (values.some((value) => value.status === "retained")) {
    return "retained";
  }
  if (values.some((value) => value.status === "stale")) {
    return "stale";
  }
  if (values.every((value) => value.status === "empty")) {
    return "empty";
  }
  return "configured";
}

function isMeaningfulRaw(entry: RawTemplateOverlayEntry | null): boolean {
  return entry !== null && entry.outcomeKind !== "known";
}

function catalogLabel<Id>(id: Id, records: readonly CatalogRecord<Id>[], noun: string): string {
  return catalogValue(id, records, noun).label;
}

function groupRows(rows: readonly BuildSetComparisonRow[]): readonly BuildSetComparisonGroup[] {
  return GROUP_ORDER.flatMap((groupKey) => {
    const groupRowsForKey = rows.filter((row) => row.group === groupKey).sort(compareRows);
    if (groupRowsForKey.length === 0) {
      return [];
    }
    return [{ key: groupKey, label: GROUP_LABELS[groupKey], rows: groupRowsForKey }];
  });
}

function uniqueSortedNumbers(
  values: readonly (number | { valueOf(): unknown })[]
): readonly number[] {
  return [
    ...new Set(values.map((value) => Number(value)).filter((value) => Number.isFinite(value)))
  ].sort((left, right) => left - right);
}

function uniqueSortedStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function compareRows(left: BuildSetComparisonRow, right: BuildSetComparisonRow): number {
  return groupRank(left.group) - groupRank(right.group) || left.key.localeCompare(right.key);
}

function groupRank(group: BuildSetComparisonGroupKey): number {
  return GROUP_ORDER.indexOf(group);
}

function titleCase(value: string): string {
  return value
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
