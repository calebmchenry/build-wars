import {
  MAX_ATTRIBUTE_RUNES,
  cloneAttributeAdjustments,
  isAdjustmentCatalogId,
  isAttributeAdjustments,
  type AttributeAdjustments
} from "../domain";

/** One-way Build v3 migration. Prototype armor/weapon data is deliberately not imported. */
export function migrateLegacyAttributeAdjustments(
  input: unknown
): AttributeAdjustments | null | undefined {
  if (input === null) return null;
  if (!exactRecord(input, ["headgearOverride", "runeOverrides", "effectPreferences"]))
    return undefined;
  const head = input.headgearOverride;
  let headgearAttributeId: number | null = null;
  if (head !== null) {
    if (exactRecord(head, ["kind"]) && head.kind === "none") {
      headgearAttributeId = null;
    } else if (
      exactRecord(head, ["kind", "attributeId"]) &&
      head.kind === "attribute" &&
      isAdjustmentCatalogId(head.attributeId)
    ) {
      headgearAttributeId = head.attributeId;
    } else return undefined;
  }
  const rows = input.runeOverrides;
  if (
    !Array.isArray(rows) ||
    rows.length > MAX_ATTRIBUTE_RUNES ||
    Object.keys(rows).length !== rows.length ||
    !Array.from({ length: rows.length }, (_, i) => Object.hasOwn(rows, i)).every(Boolean)
  )
    return undefined;
  const seen = new Set<number>();
  const runes: { attributeId: number; runeId: number }[] = [];
  for (const row of rows) {
    if (
      !exactRecord(row, ["attributeId", "runeId"]) ||
      !isAdjustmentCatalogId(row.attributeId) ||
      seen.has(row.attributeId) ||
      (row.runeId !== null && !isAdjustmentCatalogId(row.runeId))
    )
      return undefined;
    seen.add(row.attributeId);
    if (row.runeId !== null) runes.push({ attributeId: row.attributeId, runeId: row.runeId });
  }
  const result = { headgearAttributeId, runes, effectPreferences: input.effectPreferences };
  return isAttributeAdjustments(result) ? cloneAttributeAdjustments(result) : undefined;
}

function exactRecord(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}
