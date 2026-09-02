import type { Build } from "./build";
import type { AttributeId } from "./ids";
import type { ProfessionAttributeValidationCatalog } from "./validation-context";
import { readNumericId } from "./validation-context";

export type EffectiveAttributeRankAdjustmentKind =
  "headgear" | "manual" | "other" | "rune" | "temporary" | "title" | "weapon";

export interface EffectiveAttributeRankAdjustment {
  readonly kind: EffectiveAttributeRankAdjustmentKind;
  readonly amount: number;
  readonly sourceId?: string | null;
  readonly label?: string;
}

export type EffectiveAttributeRankBaseSource = "authored" | "unallocated" | "override";

export interface EffectiveAttributeRankAppliedAdjustment {
  readonly kind: EffectiveAttributeRankAdjustmentKind;
  readonly amount: number;
  readonly sourceId: string | null;
  readonly label: string | null;
}

export type EffectiveAttributeRankContribution =
  | {
      readonly kind: "base";
      readonly source: EffectiveAttributeRankBaseSource;
      readonly amount: number;
    }
  | {
      readonly kind: "adjustment";
      readonly source: EffectiveAttributeRankAdjustmentKind;
      readonly amount: number;
      readonly sourceId: string | null;
      readonly label: string | null;
    };

export type EffectiveAttributeRankUnresolvedCode =
  | "duplicate-allocation"
  | "invalid-adjustment"
  | "invalid-base-rank"
  | "invalid-override"
  | "negative-final-rank"
  | "rank-overflow"
  | "unknown-attribute";

export interface EffectiveAttributeRankUnresolvedReason {
  readonly code: EffectiveAttributeRankUnresolvedCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export interface EffectiveAttributeRankInput {
  readonly build: Build;
  readonly professionAttributes: ProfessionAttributeValidationCatalog;
  readonly attributeId: AttributeId;
  readonly baseRankOverride?: number | null;
  readonly adjustments?: readonly EffectiveAttributeRankAdjustment[];
}

export type EffectiveAttributeRankResult =
  | {
      readonly kind: "resolved";
      readonly attributeId: AttributeId;
      readonly authoredBaseRank: number;
      readonly baseRank: number;
      readonly baseSource: EffectiveAttributeRankBaseSource;
      readonly baseRankOverride: number | null;
      readonly adjustments: readonly EffectiveAttributeRankAppliedAdjustment[];
      readonly contributions: readonly EffectiveAttributeRankContribution[];
      readonly finalRank: number;
    }
  | {
      readonly kind: "unresolved";
      readonly attributeId: AttributeId;
      readonly reasons: readonly EffectiveAttributeRankUnresolvedReason[];
      readonly authoredBaseRank: number | null;
      readonly baseRank: number | null;
      readonly baseSource: EffectiveAttributeRankBaseSource | null;
      readonly baseRankOverride: number | null;
      readonly adjustments: readonly EffectiveAttributeRankAppliedAdjustment[];
      readonly contributions: readonly EffectiveAttributeRankContribution[];
    };

const ADJUSTMENT_KIND_ORDER: readonly EffectiveAttributeRankAdjustmentKind[] = [
  "headgear",
  "rune",
  "weapon",
  "title",
  "temporary",
  "manual",
  "other"
];

export function calculateEffectiveAttributeRank(
  input: EffectiveAttributeRankInput
): EffectiveAttributeRankResult {
  const reasons: EffectiveAttributeRankUnresolvedReason[] = [];
  const numericAttributeId = readNumericId(input.attributeId);
  if (
    numericAttributeId === null ||
    !catalogHasUniqueAttribute(input.professionAttributes, numericAttributeId)
  ) {
    reasons.push({
      code: "unknown-attribute",
      path: ["attributeId"],
      message: "Attribute ID is not uniquely resolved in the catalog."
    });
  }

  const base = resolveAuthoredBaseRank(input, numericAttributeId, reasons);
  const override = resolveBaseOverride(input.baseRankOverride, reasons);
  const authoredBaseRank = base.rank;
  const baseRank = override ?? base.rank;
  const baseSource: EffectiveAttributeRankBaseSource | null =
    baseRank === null ? null : override === null ? base.source : "override";
  const adjustments = resolveAdjustments(input.adjustments ?? [], reasons);
  const contributions =
    baseRank === null || baseSource === null
      ? appliedAdjustmentContributions(adjustments)
      : [
          {
            kind: "base",
            source: baseSource,
            amount: baseRank
          } satisfies EffectiveAttributeRankContribution,
          ...appliedAdjustmentContributions(adjustments)
        ];

  const finalRank = calculateFinalRank(baseRank, adjustments, reasons);
  if (
    reasons.length > 0 ||
    finalRank === null ||
    authoredBaseRank === null ||
    baseRank === null ||
    baseSource === null
  ) {
    return {
      kind: "unresolved",
      attributeId: input.attributeId,
      reasons: dedupeReasons(reasons),
      authoredBaseRank,
      baseRank,
      baseSource,
      baseRankOverride: override,
      adjustments,
      contributions
    };
  }

  return {
    kind: "resolved",
    attributeId: input.attributeId,
    authoredBaseRank,
    baseRank,
    baseSource,
    baseRankOverride: override,
    adjustments,
    contributions,
    finalRank
  };
}

function catalogHasUniqueAttribute(
  catalog: ProfessionAttributeValidationCatalog,
  attributeId: number
): boolean {
  return (
    catalog.attributes.filter((attribute) => Number(attribute.id) === attributeId).length === 1
  );
}

function resolveAuthoredBaseRank(
  input: EffectiveAttributeRankInput,
  numericAttributeId: number | null,
  reasons: EffectiveAttributeRankUnresolvedReason[]
): {
  readonly rank: number | null;
  readonly source: EffectiveAttributeRankBaseSource | null;
} {
  const attributes = (input.build as unknown as Readonly<Record<string, unknown>>).attributes;
  if (!Array.isArray(attributes) || numericAttributeId === null) {
    reasons.push({
      code: "invalid-base-rank",
      path: ["attributes"],
      message: "Build attributes must be an array before base rank can be resolved."
    });
    return { rank: null, source: null };
  }

  const matches = attributes
    .map((row, index) => ({ row: row as Readonly<Record<string, unknown>>, index }))
    .filter(({ row }) => readNumericId(row.attributeId) === numericAttributeId);
  if (matches.length === 0) {
    return { rank: 0, source: "unallocated" };
  }
  if (matches.length > 1) {
    reasons.push({
      code: "duplicate-allocation",
      path: ["attributes"],
      message: "Attribute has duplicate authored allocations."
    });
    return { rank: null, source: null };
  }

  const match = matches[0];
  if (match === undefined || !Number.isSafeInteger(match.row.rank) || Number(match.row.rank) < 0) {
    reasons.push({
      code: "invalid-base-rank",
      path: ["attributes", match?.index ?? 0, "rank"],
      message: "Authored attribute rank must be a finite non-negative integer."
    });
    return { rank: null, source: null };
  }
  return { rank: Number(match.row.rank), source: "authored" };
}

function resolveBaseOverride(
  value: number | null | undefined,
  reasons: EffectiveAttributeRankUnresolvedReason[]
): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!Number.isSafeInteger(value) || value < 0) {
    reasons.push({
      code: "invalid-override",
      path: ["baseRankOverride"],
      message: "Base rank override must be a finite non-negative integer."
    });
    return null;
  }
  return value;
}

function resolveAdjustments(
  adjustments: readonly EffectiveAttributeRankAdjustment[],
  reasons: EffectiveAttributeRankUnresolvedReason[]
): readonly EffectiveAttributeRankAppliedAdjustment[] {
  return [...adjustments]
    .map((adjustment, index) => {
      if (!Number.isSafeInteger(adjustment.amount)) {
        reasons.push({
          code: "invalid-adjustment",
          path: ["adjustments", index, "amount"],
          message: "Rank adjustment amount must be a finite safe integer."
        });
      }
      return {
        kind: adjustment.kind,
        amount: adjustment.amount,
        sourceId: adjustment.sourceId ?? null,
        label: adjustment.label ?? null
      };
    })
    .sort(compareAdjustments);
}

function calculateFinalRank(
  baseRank: number | null,
  adjustments: readonly EffectiveAttributeRankAppliedAdjustment[],
  reasons: EffectiveAttributeRankUnresolvedReason[]
): number | null {
  if (baseRank === null) {
    return null;
  }
  let total = baseRank;
  for (const adjustment of adjustments) {
    if (!Number.isSafeInteger(adjustment.amount)) {
      continue;
    }
    total += adjustment.amount;
    if (!Number.isSafeInteger(total)) {
      reasons.push({
        code: "rank-overflow",
        path: ["adjustments"],
        message: "Effective rank exceeds safe integer arithmetic limits."
      });
      return null;
    }
  }
  if (total < 0) {
    reasons.push({
      code: "negative-final-rank",
      path: ["adjustments"],
      message: "Effective rank cannot be negative."
    });
    return null;
  }
  return total;
}

function appliedAdjustmentContributions(
  adjustments: readonly EffectiveAttributeRankAppliedAdjustment[]
): readonly EffectiveAttributeRankContribution[] {
  return adjustments
    .filter((adjustment) => Number.isSafeInteger(adjustment.amount))
    .map((adjustment) => ({
      kind: "adjustment",
      source: adjustment.kind,
      amount: adjustment.amount,
      sourceId: adjustment.sourceId,
      label: adjustment.label
    }));
}

function compareAdjustments(
  left: EffectiveAttributeRankAppliedAdjustment,
  right: EffectiveAttributeRankAppliedAdjustment
): number {
  return (
    compareNumber(
      ADJUSTMENT_KIND_ORDER.indexOf(left.kind),
      ADJUSTMENT_KIND_ORDER.indexOf(right.kind)
    ) ||
    compareString(left.sourceId ?? "", right.sourceId ?? "") ||
    compareNumber(left.amount, right.amount) ||
    compareString(left.label ?? "", right.label ?? "")
  );
}

function dedupeReasons(
  reasons: readonly EffectiveAttributeRankUnresolvedReason[]
): readonly EffectiveAttributeRankUnresolvedReason[] {
  const byKey = new Map<string, EffectiveAttributeRankUnresolvedReason>();
  for (const reason of reasons) {
    byKey.set(`${reason.code}:${reason.path.join(".")}`, reason);
  }
  return [...byKey.values()].sort((left, right) => compareString(left.code, right.code));
}

function compareNumber(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareString(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
