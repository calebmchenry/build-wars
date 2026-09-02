import type {
  AttributeRankRuneEffect,
  CatalogRuneRecord,
  MaximumHealthDeltaRuneEffect,
  RuneCatalog,
  RuneEffect
} from "./catalog";
import type {
  EffectiveAttributeRankAdjustment,
  EffectiveAttributeRankAdjustmentKind
} from "./effective-attribute-rank";
import type { AttributeId, RuneId } from "./ids";
import { readNumericId } from "./validation-context";

export interface EquippedRuneEntry {
  readonly sourceKey: string;
  readonly runeId: RuneId;
}

export interface SelectedAttributeRuneContribution {
  readonly attributeId: AttributeId;
  readonly runeId: RuneId;
  readonly sourceKeys: readonly string[];
  readonly amount: number;
  readonly effectGroupKey: string;
  readonly label: string;
}

export interface AttributeRuneHealthPenaltyOccurrence {
  readonly sourceKey: string;
  readonly runeId: RuneId;
  readonly amount: number;
  readonly effectGroupKey: string;
  readonly label: string;
}

export type AttributeRuneEffectUnresolvedCode =
  | "duplicate-source-key"
  | "malformed-catalog-record"
  | "non-attribute-rune"
  | "note-only-effect"
  | "unknown-effect"
  | "unknown-rune-id"
  | "unsupported-semantics";

export interface AttributeRuneEffectUnresolvedReason {
  readonly code: AttributeRuneEffectUnresolvedCode;
  readonly sourceKey: string;
  readonly runeId: RuneId | null;
  readonly message: string;
}

export interface AttributeRuneEffectSummary {
  readonly attributeContributions: readonly SelectedAttributeRuneContribution[];
  readonly rankAdjustments: readonly EffectiveAttributeRankAdjustment[];
  readonly healthPenaltyOccurrences: readonly AttributeRuneHealthPenaltyOccurrence[];
  readonly totalAttributeRuneHealthDelta: number;
  readonly unresolved: readonly AttributeRuneEffectUnresolvedReason[];
}

type AttributeCandidate = {
  readonly sourceKey: string;
  readonly rune: CatalogRuneRecord;
  readonly effect: AttributeRankRuneEffect;
};

export function summarizeAttributeRuneEffects(
  catalog: RuneCatalog,
  equippedEntries: readonly EquippedRuneEntry[]
): AttributeRuneEffectSummary {
  const unresolved: AttributeRuneEffectUnresolvedReason[] = [];
  const attributeCandidates: AttributeCandidate[] = [];
  const healthPenaltyOccurrences: AttributeRuneHealthPenaltyOccurrence[] = [];
  const sourceKeyCounts = countSourceKeys(equippedEntries);
  const runesById = indexRunesById(catalog.runes);

  for (const entry of equippedEntries) {
    if (sourceKeyCounts.get(entry.sourceKey) !== 1) {
      unresolved.push({
        code: "duplicate-source-key",
        sourceKey: entry.sourceKey,
        runeId: entry.runeId,
        message: "Equipped rune source keys must be unique."
      });
    }

    const rune = runesById.get(Number(entry.runeId));
    if (rune === undefined) {
      unresolved.push({
        code: "unknown-rune-id",
        sourceKey: entry.sourceKey,
        runeId: entry.runeId,
        message: "Equipped rune ID does not exist in the rune catalog."
      });
      continue;
    }

    if (rune.familyKind !== "attribute") {
      unresolved.push({
        code: "non-attribute-rune",
        sourceKey: entry.sourceKey,
        runeId: entry.runeId,
        message: "Only attribute runes are summarized by this helper."
      });
      continue;
    }

    for (const effect of rune.effects) {
      if (effect.kind === "note-only") {
        unresolved.push({
          code: "note-only-effect",
          sourceKey: entry.sourceKey,
          runeId: entry.runeId,
          message: `Rune has note-only effect ${effect.noteCode}.`
        });
      } else if (effect.kind === "unknown") {
        unresolved.push({
          code: "unknown-effect",
          sourceKey: entry.sourceKey,
          runeId: entry.runeId,
          message: `Rune has unknown effect ${effect.sourceField}.`
        });
      }
    }

    const recordIssues = validateAttributeRuneRecord(rune);
    for (const message of recordIssues) {
      unresolved.push({
        code: "malformed-catalog-record",
        sourceKey: entry.sourceKey,
        runeId: entry.runeId,
        message
      });
    }
    if (recordIssues.length > 0) {
      continue;
    }

    for (const effect of rune.effects) {
      if (effect.kind === "attribute-rank") {
        attributeCandidates.push({ sourceKey: entry.sourceKey, rune, effect });
      } else if (effect.kind === "maximum-health-delta") {
        if (isAttributeHealthPenalty(effect)) {
          healthPenaltyOccurrences.push({
            sourceKey: entry.sourceKey,
            runeId: rune.id,
            amount: effect.amount,
            effectGroupKey: effect.stacking.groupKey,
            label: rune.name
          });
        } else {
          unresolved.push({
            code: "unsupported-semantics",
            sourceKey: entry.sourceKey,
            runeId: entry.runeId,
            message: "Attribute rune health effects must be negative summed penalties."
          });
        }
      } else if (effect.kind === "note-only") {
        continue;
      } else if (effect.kind === "unknown") {
        continue;
      } else {
        unresolved.push({
          code: "unsupported-semantics",
          sourceKey: entry.sourceKey,
          runeId: entry.runeId,
          message: `Attribute rune effect ${effect.kind} is outside this helper boundary.`
        });
      }
    }
  }

  const attributeContributions = selectHighestAttributeContributions(attributeCandidates);
  const rankAdjustments = attributeContributions.map((contribution) => ({
    kind: "rune" as EffectiveAttributeRankAdjustmentKind,
    amount: contribution.amount,
    sourceId: contribution.sourceKeys.join("|"),
    label: contribution.label
  }));

  return {
    attributeContributions,
    rankAdjustments,
    healthPenaltyOccurrences: [...healthPenaltyOccurrences].sort(compareHealthOccurrences),
    totalAttributeRuneHealthDelta: healthPenaltyOccurrences.reduce(
      (total, occurrence) => total + occurrence.amount,
      0
    ),
    unresolved: dedupeUnresolved(unresolved)
  };
}

function countSourceKeys(entries: readonly EquippedRuneEntry[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.sourceKey, (counts.get(entry.sourceKey) ?? 0) + 1);
  }
  return counts;
}

function indexRunesById(
  runes: readonly CatalogRuneRecord[]
): ReadonlyMap<number, CatalogRuneRecord> {
  const byId = new Map<number, CatalogRuneRecord>();
  for (const rune of runes) {
    const id = Number(rune.id);
    if (!byId.has(id)) {
      byId.set(id, rune);
    }
  }
  return byId;
}

function validateAttributeRuneRecord(rune: CatalogRuneRecord): readonly string[] {
  const issues: string[] = [];
  if (readNumericId(rune.affectedAttributeId) === null) {
    issues.push("Attribute rune record must carry an affectedAttributeId.");
  }
  const attributeRankEffects = rune.effects.filter(
    (effect): effect is AttributeRankRuneEffect => effect.kind === "attribute-rank"
  );
  if (attributeRankEffects.length !== 1) {
    issues.push("Attribute rune record must carry exactly one attribute-rank effect.");
  }
  for (const effect of attributeRankEffects) {
    if (!Number.isSafeInteger(effect.amount) || effect.amount <= 0) {
      issues.push("Attribute-rank effect amount must be a positive safe integer.");
    }
    if (
      readNumericId(effect.attributeId) === null ||
      readNumericId(effect.attributeId) !== readNumericId(rune.affectedAttributeId)
    ) {
      issues.push("Attribute-rank effect attributeId must match affectedAttributeId.");
    }
    if (effect.stacking.rule !== "highest" || !effect.stacking.groupKey) {
      issues.push("Attribute-rank effects must use a highest stacking group.");
    }
  }
  for (const effect of rune.effects) {
    if (!isKnownRuneEffect(effect)) {
      issues.push("Rune effect shape is not recognized.");
    }
  }
  return issues;
}

function isAttributeHealthPenalty(effect: MaximumHealthDeltaRuneEffect): boolean {
  return effect.amount < 0 && effect.stacking.rule === "sum" && Boolean(effect.stacking.groupKey);
}

function isKnownRuneEffect(effect: RuneEffect): boolean {
  return (
    effect.kind === "attribute-rank" ||
    effect.kind === "maximum-health-delta" ||
    effect.kind === "maximum-energy-delta" ||
    effect.kind === "physical-damage-reduction" ||
    effect.kind === "condition-duration-reduction" ||
    effect.kind === "note-only" ||
    effect.kind === "unknown"
  );
}

function selectHighestAttributeContributions(
  candidates: readonly AttributeCandidate[]
): readonly SelectedAttributeRuneContribution[] {
  const byAttribute = new Map<number, AttributeCandidate[]>();
  for (const candidate of candidates) {
    const attributeId = Number(candidate.effect.attributeId);
    byAttribute.set(attributeId, [...(byAttribute.get(attributeId) ?? []), candidate]);
  }

  return [...byAttribute.entries()]
    .sort(([left], [right]) => compareNumber(left, right))
    .map(([, members]) => {
      const sorted = [...members].sort(compareAttributeCandidates);
      const selected = sorted[0];
      if (selected === undefined) {
        throw new Error("Attribute candidate group cannot be empty.");
      }
      const amount = selected.effect.amount;
      const tied = sorted
        .filter((candidate) => candidate.effect.amount === amount)
        .sort(compareAttributeCandidates);
      return {
        attributeId: selected.effect.attributeId,
        runeId: selected.rune.id,
        sourceKeys: tied.map((candidate) => candidate.sourceKey),
        amount,
        effectGroupKey: selected.effect.stacking.groupKey,
        label: selected.rune.name
      };
    });
}

function compareAttributeCandidates(left: AttributeCandidate, right: AttributeCandidate): number {
  return (
    compareNumber(right.effect.amount, left.effect.amount) ||
    compareNumber(Number(left.rune.id), Number(right.rune.id)) ||
    compareString(left.sourceKey, right.sourceKey)
  );
}

function compareHealthOccurrences(
  left: AttributeRuneHealthPenaltyOccurrence,
  right: AttributeRuneHealthPenaltyOccurrence
): number {
  return (
    compareString(left.sourceKey, right.sourceKey) ||
    compareNumber(Number(left.runeId), Number(right.runeId)) ||
    compareNumber(left.amount, right.amount)
  );
}

function dedupeUnresolved(
  reasons: readonly AttributeRuneEffectUnresolvedReason[]
): readonly AttributeRuneEffectUnresolvedReason[] {
  const byKey = new Map<string, AttributeRuneEffectUnresolvedReason>();
  for (const reason of reasons) {
    byKey.set(
      `${reason.code}:${reason.sourceKey}:${reason.runeId === null ? "null" : Number(reason.runeId)}:${reason.message}`,
      reason
    );
  }
  return [...byKey.values()].sort(
    (left, right) =>
      compareString(left.sourceKey, right.sourceKey) ||
      compareString(left.code, right.code) ||
      compareString(left.message, right.message)
  );
}

function compareNumber(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareString(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
