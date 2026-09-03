import type { Build } from "./build";
import type { CatalogProfessionRecord, CatalogRuneRecord } from "./catalog";
import type { EffectiveAttributeRankAdjustment } from "./effective-attribute-rank";
import {
  ARMOR_SLOTS,
  EQUIPMENT_LOADOUT_SCHEMA_VERSION,
  HEADGEAR_ATTRIBUTE_BONUS,
  MAX_ARMOR_ROWS_TO_VALIDATE,
  type ArmorSlot,
  type EquipmentSelection,
  type EquipmentSelectionState
} from "./equipment";
import type { AttributeId, RuneId } from "./ids";
import {
  summarizeAttributeRuneEffects,
  type AttributeRuneEffectSummary,
  type EquippedRuneEntry
} from "./rune-effects";
import type { ProfessionAttributeValidationCatalog } from "./validation-context";
import { isFiniteSafeInteger, readNumericId } from "./validation-context";

export interface EquipmentRuneCatalogView {
  readonly catalogVersion: string | null;
  readonly records: readonly CatalogRuneRecord[];
}

export type EquipmentAttributeRankAdjustmentSource = "headgear" | "rune";

export interface TargetedEquipmentAttributeRankAdjustment {
  readonly attributeId: AttributeId;
  readonly adjustment: EffectiveAttributeRankAdjustment;
  readonly source: EquipmentAttributeRankAdjustmentSource;
}

export type EquipmentAttributeRankUnresolvedCode =
  | "catalog-unavailable"
  | "duplicate-rune-id"
  | "headgear-attribute-invalid"
  | "headgear-slot-invalid"
  | "headgear-unresolved"
  | "primary-profession-unresolved"
  | "rune-restricted"
  | "rune-unresolved"
  | "schema-unsupported";

export interface EquipmentAttributeRankUnresolvedReason {
  readonly code: EquipmentAttributeRankUnresolvedCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export interface EquipmentAttributeRankAdjustmentInput {
  readonly build: Build;
  readonly professionAttributes: ProfessionAttributeValidationCatalog;
  readonly runes?: EquipmentRuneCatalogView;
}

export interface EquipmentAttributeRankAdjustmentSummary {
  readonly adjustments: readonly TargetedEquipmentAttributeRankAdjustment[];
  readonly runeSummary: AttributeRuneEffectSummary | null;
  readonly unresolved: readonly EquipmentAttributeRankUnresolvedReason[];
}

interface PrimaryProfessionResolution {
  readonly id: number | null;
  readonly record: CatalogProfessionRecord | null;
}

interface RuneResolution {
  readonly entries: readonly EquippedRuneEntry[];
  readonly unresolved: readonly EquipmentAttributeRankUnresolvedReason[];
}

export function collectEquipmentAttributeRankAdjustments(
  input: EquipmentAttributeRankAdjustmentInput
): EquipmentAttributeRankAdjustmentSummary {
  const equipment = input.build.equipment;
  if (equipment === null) {
    return { adjustments: [], runeSummary: null, unresolved: [] };
  }

  const unresolved: EquipmentAttributeRankUnresolvedReason[] = [];
  if (equipment.schemaVersion !== EQUIPMENT_LOADOUT_SCHEMA_VERSION) {
    return {
      adjustments: [],
      runeSummary: null,
      unresolved: [
        {
          code: "schema-unsupported",
          path: ["equipment", "schemaVersion"],
          message: "Equipment loadout schema version is not supported."
        }
      ]
    };
  }

  const primary = resolvePrimaryProfession(input.build, input.professionAttributes);
  const armorRows = [...equipment.armor].slice(0, MAX_ARMOR_ROWS_TO_VALIDATE);
  const headgearAdjustments = collectHeadgearAdjustments(
    armorRows,
    input.professionAttributes,
    primary,
    unresolved
  );
  const runeResolution = collectRuneEntries(armorRows, input.runes, primary);
  unresolved.push(...runeResolution.unresolved);
  const runeSummary =
    runeResolution.entries.length === 0 || input.runes === undefined
      ? null
      : summarizeAttributeRuneEffects({ runes: input.runes.records }, runeResolution.entries);
  if (runeSummary !== null) {
    for (const reason of runeSummary.unresolved) {
      unresolved.push({
        code: "rune-unresolved",
        path: ["equipment", "armor"],
        message: reason.message
      });
    }
  }

  return {
    adjustments: sortTargetedAdjustments([
      ...headgearAdjustments,
      ...(runeSummary?.attributeContributions.map((contribution) => ({
        attributeId: contribution.attributeId,
        source: "rune" as const,
        adjustment: {
          kind: "rune" as const,
          amount: contribution.amount,
          sourceId: contribution.sourceKeys.join("|"),
          label: contribution.label
        }
      })) ?? [])
    ]),
    runeSummary,
    unresolved: dedupeUnresolved(unresolved)
  };
}

export function equipmentAdjustmentsForAttribute(
  summary: EquipmentAttributeRankAdjustmentSummary,
  attributeId: AttributeId
): readonly EffectiveAttributeRankAdjustment[] {
  const numericAttributeId = Number(attributeId);
  return summary.adjustments
    .filter((item) => Number(item.attributeId) === numericAttributeId)
    .map((item) => item.adjustment);
}

function collectHeadgearAdjustments(
  armorRows: readonly unknown[],
  catalog: ProfessionAttributeValidationCatalog,
  primary: PrimaryProfessionResolution,
  unresolved: EquipmentAttributeRankUnresolvedReason[]
): readonly TargetedEquipmentAttributeRankAdjustment[] {
  const adjustments: TargetedEquipmentAttributeRankAdjustment[] = [];
  armorRows.forEach((row, index) => {
    const record = isRecord(row) ? row : {};
    const selection = readSelection<AttributeId>(record.headgearAttribute);
    if (selection === null) {
      return;
    }
    const slot = record.slot;
    if (slot !== "head") {
      unresolved.push({
        code: "headgear-slot-invalid",
        path: ["equipment", "armor", index, "headgearAttribute"],
        message: "Headgear attribute bonuses can only be authored on the head armor slot."
      });
      return;
    }
    if (selection.kind === "unresolved") {
      unresolved.push({
        code: "headgear-unresolved",
        path: ["equipment", "armor", index, "headgearAttribute"],
        message: "Headgear attribute selection is unresolved."
      });
      return;
    }
    if (primary.record === null || primary.id === null) {
      unresolved.push({
        code: "primary-profession-unresolved",
        path: ["primaryProfessionId"],
        message: "Headgear attribute bonus requires a resolved primary profession."
      });
      return;
    }
    const attribute = resolveCatalogRecord(
      catalog.attributes,
      (candidate) => candidate.id,
      Number(selection.id)
    );
    if (
      attribute === null ||
      Number(attribute.professionId) !== primary.id ||
      readNumericId(attribute.id) === null
    ) {
      unresolved.push({
        code: "headgear-attribute-invalid",
        path: ["equipment", "armor", index, "headgearAttribute"],
        message: "Headgear attribute must belong to the selected primary profession."
      });
      return;
    }
    adjustments.push({
      attributeId: attribute.id,
      source: "headgear",
      adjustment: {
        kind: "headgear",
        amount: HEADGEAR_ATTRIBUTE_BONUS,
        sourceId: `equipment:armor:${slot}:headgear`,
        label: "Headgear attribute bonus"
      }
    });
  });
  return adjustments;
}

function collectRuneEntries(
  armorRows: readonly unknown[],
  runes: EquipmentRuneCatalogView | undefined,
  primary: PrimaryProfessionResolution
): RuneResolution {
  const unresolved: EquipmentAttributeRankUnresolvedReason[] = [];
  const entries: EquippedRuneEntry[] = [];
  const runeIndex = runes === undefined ? null : indexRuneRecords(runes.records, unresolved);

  armorRows.forEach((row, index) => {
    const record = isRecord(row) ? row : {};
    const selection = readSelection<RuneId>(record.rune);
    if (selection === null) {
      return;
    }
    if (selection.kind === "unresolved") {
      unresolved.push({
        code: "rune-unresolved",
        path: ["equipment", "armor", index, "rune"],
        message: "Rune selection is unresolved."
      });
      return;
    }
    if (runeIndex === null) {
      unresolved.push({
        code: "catalog-unavailable",
        path: ["equipment", "armor", index, "rune"],
        message: "Rune catalog view is required before rune rank adjustments can be applied."
      });
      return;
    }
    const rune = runeIndex.get(Number(selection.id));
    if (rune === undefined) {
      unresolved.push({
        code: "rune-unresolved",
        path: ["equipment", "armor", index, "rune"],
        message: "Rune ID is not resolved in the supplied rune catalog."
      });
      return;
    }
    if (!runeAppliesToPrimaryArmor(rune, primary)) {
      unresolved.push({
        code: "rune-restricted",
        path: ["equipment", "armor", index, "rune"],
        message: "Rune is not applicable to armor for the selected primary profession."
      });
      return;
    }
    if (rune.familyKind !== "attribute") {
      return;
    }
    const slot =
      typeof record.slot === "string" && ARMOR_SLOTS.includes(record.slot as ArmorSlot)
        ? record.slot
        : `row-${index}`;
    entries.push({ sourceKey: `armor:${slot}:${index}`, runeId: rune.id });
  });

  return { entries, unresolved };
}

function resolvePrimaryProfession(
  build: Build,
  catalog: ProfessionAttributeValidationCatalog
): PrimaryProfessionResolution {
  const id = readNumericId(
    (build as unknown as Readonly<Record<string, unknown>>).primaryProfessionId
  );
  if (id === null) {
    return { id: null, record: null };
  }
  return {
    id,
    record: resolveCatalogRecord(catalog.professions, (record) => record.id, id)
  };
}

function indexRuneRecords(
  records: readonly CatalogRuneRecord[],
  unresolved: EquipmentAttributeRankUnresolvedReason[]
): ReadonlyMap<number, CatalogRuneRecord> {
  const buckets = new Map<number, CatalogRuneRecord[]>();
  for (const record of records) {
    const id = readNumericId(record.id);
    if (id === null) {
      continue;
    }
    buckets.set(id, [...(buckets.get(id) ?? []), record]);
  }
  const index = new Map<number, CatalogRuneRecord>();
  for (const [id, bucket] of buckets) {
    if (bucket.length === 1) {
      const record = bucket[0];
      if (record !== undefined) {
        index.set(id, record);
      }
    } else {
      unresolved.push({
        code: "duplicate-rune-id",
        path: ["equipmentCatalogs", "runes", "records"],
        message: "Duplicate rune catalog IDs are not resolved first-record-wins."
      });
    }
  }
  return index;
}

function runeAppliesToPrimaryArmor(
  rune: CatalogRuneRecord,
  primary: PrimaryProfessionResolution
): boolean {
  if (rune.eligibility === "universal-armor") {
    return true;
  }
  if (rune.eligibility !== "profession-armor" || primary.id === null) {
    return false;
  }
  return rune.professionId !== null && Number(rune.professionId) === primary.id;
}

function resolveCatalogRecord<Record>(
  records: readonly Record[],
  idForRecord: (record: Record) => unknown,
  id: number
): Record | null {
  const matches = records.filter((record) => readNumericId(idForRecord(record)) === id);
  return matches.length === 1 ? (matches[0] ?? null) : null;
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

function sortTargetedAdjustments(
  adjustments: readonly TargetedEquipmentAttributeRankAdjustment[]
): readonly TargetedEquipmentAttributeRankAdjustment[] {
  return [...adjustments].sort(
    (left, right) =>
      compareNumber(Number(left.attributeId), Number(right.attributeId)) ||
      compareString(left.source, right.source) ||
      compareString(left.adjustment.sourceId ?? "", right.adjustment.sourceId ?? "")
  );
}

function dedupeUnresolved(
  reasons: readonly EquipmentAttributeRankUnresolvedReason[]
): readonly EquipmentAttributeRankUnresolvedReason[] {
  const byKey = new Map<string, EquipmentAttributeRankUnresolvedReason>();
  for (const reason of reasons) {
    byKey.set(`${reason.code}:${reason.path.join(".")}:${reason.message}`, reason);
  }
  return [...byKey.values()].sort(
    (left, right) =>
      compareString(left.path.join("."), right.path.join(".")) ||
      compareString(left.code, right.code) ||
      compareString(left.message, right.message)
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compareNumber(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareString(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
