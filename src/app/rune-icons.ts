import {
  summarizeAttributeRuneEffects,
  type AttributeId,
  type CatalogRuneRecord,
  type ProfessionId
} from "../domain";
import { localRuneIconAsset, type LocalIconAsset } from "./icon-assets";

export interface RuneTierOption {
  readonly amount: 1 | 2 | 3;
  readonly rune: CatalogRuneRecord | null;
  readonly icon: LocalIconAsset | null;
  readonly healthPenalty: number | null;
  readonly reason: string | null;
}
const tierCache = new WeakMap<
  readonly CatalogRuneRecord[],
  ReadonlyMap<string, readonly RuneTierOption[]>
>();

export function runeTierOptions(
  records: readonly CatalogRuneRecord[],
  professionId: ProfessionId,
  attributeId: AttributeId
): readonly RuneTierOption[] {
  let index = tierCache.get(records);
  if (index === undefined) {
    const keys = new Set(
      records
        .filter((r) => r.familyKind === "attribute")
        .map((r) => `${r.professionId}:${r.affectedAttributeId}`)
    );
    const built = new Map<string, readonly RuneTierOption[]>();
    const idCounts = new Map<number, number>();
    for (const rune of records)
      idCounts.set(Number(rune.id), (idCounts.get(Number(rune.id)) ?? 0) + 1);
    for (const key of keys)
      built.set(
        key,
        ([1, 2, 3] as const).map((amount) => {
          const matches = records.filter(
            (r) =>
              r.familyKind === "attribute" &&
              r.eligibility === "profession-armor" &&
              `${r.professionId}:${r.affectedAttributeId}` === key &&
              r.effects.some((e) => e.kind === "attribute-rank" && e.amount === amount)
          );
          const rune =
            matches.length === 1 && idCounts.get(Number(matches[0]?.id)) === 1
              ? (matches[0] ?? null)
              : null;
          const summary =
            rune === null
              ? null
              : summarizeAttributeRuneEffects({ runes: [rune] }, [
                  { runeId: rune.id, sourceKey: "tier" }
                ]);
          const valid =
            rune !== null &&
            summary?.unresolved.length === 0 &&
            summary.attributeContributions.length === 1;
          return {
            amount,
            rune: valid ? rune : null,
            icon: valid ? localRuneIconAsset(rune.id) : null,
            healthPenalty: valid ? summary.totalAttributeRuneHealthDelta : null,
            reason: valid ? null : "Rune tier is missing, ambiguous, or has unresolved facts."
          };
        })
      );
    index = built;
    tierCache.set(records, index);
  }
  return (
    index.get(`${professionId}:${attributeId}`) ??
    ([1, 2, 3] as const).map((amount) => ({
      amount,
      rune: null,
      icon: null,
      healthPenalty: null,
      reason: "Rune tier is unavailable."
    }))
  );
}
