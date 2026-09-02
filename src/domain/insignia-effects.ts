import type {
  CatalogInsigniaRecord,
  InsigniaCondition,
  InsigniaEffect,
  InsigniaEffectCombination,
  InsigniaSlotOutcome
} from "./catalog";
import type { ArmorSlot } from "./equipment";
import type { InsigniaId } from "./ids";

export type InsigniaSlotResolutionIssueCode =
  | "inapplicable-slot"
  | "malformed-slot-outcomes"
  | "numeric-effect-unresolved"
  | "note-only-effect"
  | "unknown-effect";

export interface ResolvedInsigniaSlotEffect {
  readonly effectId: string;
  readonly kind: InsigniaEffect["kind"];
  readonly outcome: InsigniaSlotOutcome | null;
  readonly condition: InsigniaCondition;
  readonly combination: InsigniaEffectCombination;
}

export interface InsigniaSlotResolutionIssue {
  readonly code: InsigniaSlotResolutionIssueCode;
  readonly effectId: string | null;
  readonly message: string;
}

export interface InsigniaArmorSlotResolution {
  readonly insigniaId: InsigniaId;
  readonly slot: ArmorSlot;
  readonly effects: readonly ResolvedInsigniaSlotEffect[];
  readonly unresolved: readonly InsigniaSlotResolutionIssue[];
}

export function resolveInsigniaEffectsForArmorSlot(
  record: CatalogInsigniaRecord,
  slot: ArmorSlot
): InsigniaArmorSlotResolution {
  const unresolved: InsigniaSlotResolutionIssue[] = [];
  const effects: ResolvedInsigniaSlotEffect[] = [];

  if (!record.applicableSlots.includes(slot)) {
    unresolved.push({
      code: "inapplicable-slot",
      effectId: null,
      message: `Insignia ${record.id} does not apply to ${slot} armor.`
    });
  }

  for (const effect of record.effects) {
    if ("slotOutcomes" in effect) {
      const outcome = effect.slotOutcomes[slot];
      if (outcome === undefined) {
        unresolved.push({
          code: "malformed-slot-outcomes",
          effectId: effect.id,
          message: `Numeric insignia effect ${effect.id} is missing a ${slot} outcome.`
        });
        effects.push({
          effectId: effect.id,
          kind: effect.kind,
          outcome: null,
          condition: effect.condition,
          combination: effect.combination
        });
        continue;
      }
      if (outcome.kind === "unresolved") {
        unresolved.push({
          code: "numeric-effect-unresolved",
          effectId: effect.id,
          message: outcome.reason
        });
      }
      effects.push({
        effectId: effect.id,
        kind: effect.kind,
        outcome,
        condition: effect.condition,
        combination: effect.combination
      });
      continue;
    }

    unresolved.push({
      code: effect.kind === "note-only" ? "note-only-effect" : "unknown-effect",
      effectId: effect.id,
      message:
        effect.kind === "note-only"
          ? `Insignia effect ${effect.id} is a reviewed note, not arithmetic.`
          : effect.reason
    });
    effects.push({
      effectId: effect.id,
      kind: effect.kind,
      outcome: null,
      condition: effect.condition,
      combination: effect.combination
    });
  }

  return {
    insigniaId: record.id,
    slot,
    effects,
    unresolved
  };
}
