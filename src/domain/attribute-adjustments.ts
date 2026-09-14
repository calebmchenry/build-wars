import type { AttributeId, RuneId } from "./ids";

export const MAX_ATTRIBUTE_RUNE_OVERRIDES = 64;
export const ASSUMED_EFFECT_IDS = [
  "glyph-of-elemental-power",
  "elemental-lord",
  "masochism",
  "heroic-refrain"
] as const;
export type AssumedEffectId = (typeof ASSUMED_EFFECT_IDS)[number];
export type SelfEffectId = Exclude<AssumedEffectId, "heroic-refrain">;
export type RefrainStrength = 1 | 2 | 3 | 4;
export type AssumedEffectPreference =
  | { readonly effectId: SelfEffectId; readonly preference: "on" | "off" }
  | {
      readonly effectId: "heroic-refrain";
      readonly preference: "on" | "off";
      readonly strength: RefrainStrength;
    };
export type HeadgearOverride =
  | null
  | { readonly kind: "none" }
  | { readonly kind: "attribute"; readonly attributeId: AttributeId };
export interface AttributeAdjustments {
  readonly headgearOverride: HeadgearOverride;
  readonly runeOverrides: readonly {
    readonly attributeId: AttributeId;
    readonly runeId: RuneId | null;
  }[];
  readonly effectPreferences: readonly AssumedEffectPreference[];
}

export function emptyAttributeAdjustments(): AttributeAdjustments {
  return { headgearOverride: null, runeOverrides: [], effectPreferences: [] };
}

export function hasAuthoredAttributeAdjustments(value: AttributeAdjustments | null): boolean {
  return (
    value !== null &&
    (value.headgearOverride !== null ||
      value.runeOverrides.length > 0 ||
      value.effectPreferences.length > 0)
  );
}

/** Copies authored inputs only, with stable order independent of editing order. */
export function cloneAttributeAdjustments(
  value: AttributeAdjustments | null
): AttributeAdjustments | null {
  if (value === null || !hasAuthoredAttributeAdjustments(value)) return null;
  return {
    headgearOverride: value.headgearOverride === null ? null : { ...value.headgearOverride },
    runeOverrides: value.runeOverrides
      .map((row) => ({ ...row }))
      .sort((a, b) => a.attributeId - b.attributeId),
    effectPreferences: value.effectPreferences
      .map((row) => ({ ...row }))
      .sort(
        (a, b) => ASSUMED_EFFECT_IDS.indexOf(a.effectId) - ASSUMED_EFFECT_IDS.indexOf(b.effectId)
      )
  };
}

export const normalizeAttributeAdjustments = cloneAttributeAdjustments;

export function isAdjustmentCatalogId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function isRefrainStrength(value: unknown): value is RefrainStrength {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 4;
}

/** Structural validation is deliberately independent of the current catalogs. */
export function isAttributeAdjustments(value: unknown): value is AttributeAdjustments | null {
  if (value === null) return true;
  if (!exactObject(value, ["headgearOverride", "runeOverrides", "effectPreferences"])) return false;
  const head = value.headgearOverride;
  if (
    head !== null &&
    !(exactObject(head, ["kind"]) && head.kind === "none") &&
    !(
      exactObject(head, ["kind", "attributeId"]) &&
      head.kind === "attribute" &&
      isAdjustmentCatalogId(head.attributeId)
    )
  )
    return false;
  if (
    !denseArray(value.runeOverrides, MAX_ATTRIBUTE_RUNE_OVERRIDES) ||
    !denseArray(value.effectPreferences, ASSUMED_EFFECT_IDS.length)
  )
    return false;
  const attributes = new Set<number>();
  for (const row of value.runeOverrides) {
    if (
      !exactObject(row, ["attributeId", "runeId"]) ||
      !isAdjustmentCatalogId(row.attributeId) ||
      (row.runeId !== null && !isAdjustmentCatalogId(row.runeId)) ||
      attributes.has(row.attributeId)
    )
      return false;
    attributes.add(row.attributeId);
  }
  const effects = new Set<string>();
  for (const input of value.effectPreferences) {
    if (typeof input !== "object" || input === null) return false;
    const row = input as Record<string, unknown>;
    const keys =
      row.effectId === "heroic-refrain"
        ? ["effectId", "preference", "strength"]
        : ["effectId", "preference"];
    if (
      !exactObject(row, keys) ||
      typeof row.effectId !== "string" ||
      !ASSUMED_EFFECT_IDS.some((id) => id === row.effectId) ||
      effects.has(row.effectId) ||
      (row.preference !== "on" && row.preference !== "off") ||
      (row.effectId === "heroic-refrain" && !isRefrainStrength(row.strength))
    )
      return false;
    effects.add(row.effectId);
  }
  return true;
}

function exactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function denseArray(value: unknown, maximum: number): value is unknown[] {
  return (
    Array.isArray(value) &&
    value.length <= maximum &&
    Object.keys(value).length === value.length &&
    Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean)
  );
}
