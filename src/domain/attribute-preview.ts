import type { Build } from "./build";
import type { CatalogAttributeRecord, SkillCatalog } from "./catalog";
import type { AttributeId } from "./ids";
import { calculateEffectiveAttributeRank } from "./effective-attribute-rank";
import {
  collectEquipmentAttributeRankAdjustments,
  type EquipmentRuneCatalogView
} from "./equipment-attribute-rank";
import { summarizeAttributeRuneEffects } from "./rune-effects";
import {
  resolveAssumedAttributeEffects,
  type AssumedAttributeEffectState
} from "./assumed-attribute-effects";
import {
  createBuildValidationContext,
  type ProfessionAttributeValidationCatalog
} from "./validation-context";

export const ATTRIBUTE_PREVIEW_CAP = 20;
export interface AttributePreviewDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly attributeIds: readonly AttributeId[] | null;
  readonly contribution: "base" | "rune" | "headgear" | "both";
  readonly uncertain: boolean;
  readonly suppressed: boolean;
}
export interface AttributePreviewContribution {
  readonly kind: "headgear" | "rune" | "temporary";
  readonly source: "inherited" | "override" | "assumed";
  readonly label: string;
  readonly amount: number;
  readonly active: boolean;
  readonly suppressed: boolean;
  readonly sourceId: string | null;
}
export interface AttributePreviewRank {
  readonly attributeId: AttributeId;
  readonly available: boolean;
  readonly gearEligible: boolean;
  readonly base: number | null;
  readonly equipmentAdjusted: number | null;
  readonly uncapped: number | null;
  readonly effective: number | null;
  readonly clipped: number;
  readonly contributions: readonly AttributePreviewContribution[];
  readonly diagnostics: readonly AttributePreviewDiagnostic[];
}
export interface AttributePreview {
  readonly ranks: ReadonlyMap<AttributeId, AttributePreviewRank>;
  readonly effects: readonly AssumedAttributeEffectState[];
  readonly activeEffectCount: number;
  readonly diagnostics: readonly AttributePreviewDiagnostic[];
  readonly availableAttributes: readonly CatalogAttributeRecord[];
  readonly primaryResolved: boolean;
}
export interface AttributePreviewInput {
  readonly build: Build;
  readonly professionAttributes: ProfessionAttributeValidationCatalog;
  readonly skillCatalog: SkillCatalog;
  readonly runes?: EquipmentRuneCatalogView;
}

export function projectAttributePreview(input: AttributePreviewInput): AttributePreview {
  const { build, professionAttributes, skillCatalog } = input;
  const context = createBuildValidationContext({
    build,
    professionAttributes,
    skills: skillCatalog
  });
  const primary =
    context.primaryProfession.lookup.kind === "resolved"
      ? context.primaryProfession.lookup.record.id
      : null;
  const secondary =
    context.secondaryProfession.lookup.kind === "resolved"
      ? context.secondaryProfession.lookup.record.id
      : null;
  const uniqueAttributes = professionAttributes.attributes.filter(
    (a) => !context.ambiguousAttributeIds.has(Number(a.id))
  );
  const availableAttributes =
    primary === null
      ? []
      : uniqueAttributes.filter(
          (a) => a.professionId === primary || (a.professionId === secondary && !a.isPrimaryOnly)
        );
  const availableIds = new Set(availableAttributes.map((a) => a.id));
  const primaryIds = uniqueAttributes
    .filter((a) => primary !== null && a.professionId === primary)
    .map((a) => a.id);
  const effects = resolveAssumedAttributeEffects({ context, skillCatalog, availableAttributes });
  const equipment = collectEquipmentAttributeRankAdjustments({
    build,
    professionAttributes,
    ...(input.runes === undefined ? {} : { runes: input.runes })
  });
  const profile = build.attributeAdjustments;
  const runeOverrides = new Map(profile?.runeOverrides.map((row) => [row.attributeId, row]) ?? []);
  const head = profile?.headgearOverride ?? null;
  const diagnostics: AttributePreviewDiagnostic[] = [];
  const additions = new Map<AttributeId, AttributePreviewContribution[]>();
  const add = (id: AttributeId, contribution: AttributePreviewContribution) =>
    additions.set(id, [...(additions.get(id) ?? []), contribution]);
  for (const item of equipment.adjustments) {
    const suppressed =
      item.source === "headgear" ? head !== null : runeOverrides.has(item.attributeId);
    add(item.attributeId, {
      kind: item.source,
      source: "inherited",
      label: item.adjustment.label ?? "Equipped bonus",
      amount: item.adjustment.amount,
      sourceId: item.adjustment.sourceId ?? null,
      active: !suppressed && primaryIds.includes(item.attributeId),
      suppressed
    });
  }
  for (const reason of equipment.unresolved) {
    const ids = reason.affectedAttributeIds ?? primaryIds;
    // Split broad evidence by contribution and target so a partial override only resolves itself.
    for (const kind of reason.contribution === "both"
      ? (["headgear", "rune"] as const)
      : [reason.contribution ?? "rune"]) {
      for (const id of ids) {
        const suppressed = kind === "headgear" ? head !== null : runeOverrides.has(id);
        diagnostics.push({
          code: reason.code,
          message: reason.message,
          attributeIds: [id],
          contribution: kind,
          uncertain: (reason.uncertain ?? true) && primaryIds.includes(id),
          suppressed
        });
      }
      if (ids.length === 0)
        diagnostics.push({
          code: reason.code,
          message: reason.message,
          attributeIds: [],
          contribution: kind,
          uncertain: false,
          suppressed: false
        });
    }
  }
  const diagnose = (
    code: string,
    message: string,
    ids: readonly AttributeId[],
    kind: "rune" | "headgear",
    uncertain: boolean
  ) => {
    diagnostics.push({
      code,
      message,
      attributeIds: ids,
      contribution: kind,
      uncertain,
      suppressed: false
    });
  };
  if (head?.kind === "attribute") {
    const target = uniqueAttributes.find((a) => a.id === head.attributeId);
    if (target === undefined)
      diagnose(
        "headgear-unknown",
        `Unknown headgear attribute ${head.attributeId}.`,
        primaryIds,
        "headgear",
        true
      );
    else if (!primaryIds.includes(target.id))
      diagnose(
        "headgear-ineligible",
        "Headgear requires a primary-profession attribute.",
        [target.id],
        "headgear",
        false
      );
    else
      add(target.id, {
        kind: "headgear",
        source: "override",
        label: "Headgear +1 (replacement)",
        amount: 1,
        active: true,
        suppressed: false,
        sourceId: "compact:headgear"
      });
  }
  for (const row of runeOverrides.values()) {
    if (row.runeId === null) continue;
    const matches = input.runes?.records.filter((r) => r.id === row.runeId) ?? [];
    const rune = matches.length === 1 ? matches[0] : undefined;
    if (rune === undefined) {
      diagnose(
        "rune-unknown",
        `Rune ${row.runeId} is unknown or ambiguous.`,
        [row.attributeId],
        "rune",
        primaryIds.includes(row.attributeId)
      );
      continue;
    }
    if (
      !primaryIds.includes(row.attributeId) ||
      rune.professionId !== primary ||
      rune.affectedAttributeId !== row.attributeId ||
      rune.familyKind !== "attribute" ||
      rune.eligibility !== "profession-armor"
    ) {
      diagnose(
        "rune-ineligible",
        `${rune.name} cannot apply to this primary attribute.`,
        [row.attributeId],
        "rune",
        false
      );
      continue;
    }
    const summary = summarizeAttributeRuneEffects({ runes: [rune] }, [
      { runeId: rune.id, sourceKey: `compact:rune:${row.attributeId}` }
    ]);
    if (summary.unresolved.length > 0 || summary.attributeContributions.length !== 1) {
      diagnose(
        "rune-unresolved",
        `${rune.name} has unresolved rank facts.`,
        [row.attributeId],
        "rune",
        true
      );
      continue;
    }
    add(row.attributeId, {
      kind: "rune",
      source: "override",
      label: `${rune.name} (replacement)`,
      amount: summary.attributeContributions[0]!.amount,
      active: true,
      suppressed: false,
      sourceId: `compact:rune:${rune.id}`
    });
  }
  for (const effect of effects.filter((e) => e.active))
    for (const id of effect.targetAttributeIds) {
      add(id, {
        kind: "temporary",
        source: "assumed",
        label: effect.definition.label,
        amount: effect.amount,
        active: true,
        suppressed: false,
        sourceId: effect.definition.id
      });
    }
  const ranks = new Map<AttributeId, AttributePreviewRank>();
  const ids = new Set([
    ...professionAttributes.attributes.map((a) => a.id),
    ...build.attributes.map((a) => a.attributeId),
    ...runeOverrides.keys()
  ]);
  if (head?.kind === "attribute") ids.add(head.attributeId);
  const purchasedRanks = new Set(
    professionAttributes.attributePointRules.purchasedRankCosts.map((row) => row.purchasedRank)
  );
  for (const id of ids) {
    const contributions = additions.get(id) ?? [];
    const base = calculateEffectiveAttributeRank({ build, professionAttributes, attributeId: id });
    const rowDiagnostics = diagnostics.filter(
      (d) => d.attributeIds === null || d.attributeIds.includes(id)
    );
    if (base.kind === "unresolved")
      rowDiagnostics.push(
        ...base.reasons.map((reason) => ({
          code: reason.code,
          message: reason.message,
          attributeIds: [id],
          contribution: "base" as const,
          uncertain: true,
          suppressed: false
        }))
      );
    if (base.baseRank !== null && !purchasedRanks.has(base.baseRank))
      rowDiagnostics.push({
        code: "base-out-of-bounds",
        message: "Purchased rank is outside the supported allocation range.",
        attributeIds: [id],
        contribution: "base",
        uncertain: true,
        suppressed: false
      });
    if (!availableIds.has(id) && build.attributes.some((a) => a.attributeId === id))
      rowDiagnostics.push({
        code: "retained-allocation",
        message: "Retained allocation is unavailable for the selected professions.",
        attributeIds: [id],
        contribution: "base",
        uncertain: true,
        suppressed: false
      });
    const uncertain = rowDiagnostics.some((d) => d.uncertain && !d.suppressed);
    const equipmentResult = calculateEffectiveAttributeRank({
      build,
      professionAttributes,
      attributeId: id,
      adjustments: contributions
        .filter((c) => c.active && c.kind !== "temporary")
        .map((c) => ({ kind: c.kind, amount: c.amount, sourceId: c.sourceId, label: c.label }))
    });
    const totalResult = calculateEffectiveAttributeRank({
      build,
      professionAttributes,
      attributeId: id,
      adjustments: contributions
        .filter((c) => c.active)
        .map((c) => ({ kind: c.kind, amount: c.amount, sourceId: c.sourceId, label: c.label }))
    });
    const uncapped = !uncertain && totalResult.kind === "resolved" ? totalResult.finalRank : null;
    ranks.set(id, {
      attributeId: id,
      available: availableIds.has(id),
      gearEligible: primaryIds.includes(id),
      base: base.baseRank,
      equipmentAdjusted:
        !uncertain && equipmentResult.kind === "resolved" ? equipmentResult.finalRank : null,
      uncapped,
      effective: uncapped === null ? null : Math.min(ATTRIBUTE_PREVIEW_CAP, uncapped),
      clipped: uncapped === null ? 0 : Math.max(0, uncapped - ATTRIBUTE_PREVIEW_CAP),
      contributions,
      diagnostics: rowDiagnostics
    });
  }
  return {
    ranks,
    effects,
    activeEffectCount: effects.filter((e) => e.active).length,
    diagnostics: [...ranks.values()]
      .flatMap((r) => r.diagnostics)
      .concat(diagnostics.filter((d) => d.attributeIds?.length === 0)),
    availableAttributes,
    primaryResolved: primary !== null
  };
}
