import type { AttributePreview } from "./attribute-preview";
import type { CatalogSkillRecord, SkillCatalog } from "./catalog";
import { skillTypeMatches } from "./skill-types";

/** Per-skill progression inputs. These never replace the character's inherent ranks. */
export function projectSkillEffectRanks(input: {
  readonly skill: CatalogSkillRecord;
  readonly catalog: SkillCatalog;
  readonly preview: AttributePreview;
  readonly ranks: Readonly<Record<string, number>>;
}): {
  readonly ranks: Readonly<Record<string, number>>;
  readonly titleAttributeRank?: number;
  readonly assumptions: readonly string[];
} {
  const { skill, catalog, preview } = input;
  const ranks = { ...input.ranks };
  const assumptions: string[] = [];
  const active = preview.effects.filter((e) => e.active && e.amount !== null);
  const replacement = active.find(
    (e) =>
      (e.definition.application === "spell-rank" &&
        skillTypeMatches(skill.typeId, "spell") &&
        // Illusion spells do not consume Signet of Illusions charges.
        !preview.availableAttributes.some(
          (a) => a.id === skill.attributeId && Number(a.templateId) === 1
        )) ||
      (e.definition.application === "signet-rank" && skillTypeMatches(skill.typeId, "signet"))
  );
  const bonus = active.find(
    (e) =>
      e.definition.application === "skill-bonus" &&
      !e.definition.templateIds.includes(Number(skill.templateId))
  );
  let replaced = false;
  let boosted = false;
  let titleAttributeRank: number | undefined;
  for (const seriesId of skill.progressionSeriesIds) {
    const series = catalog.progressionSeries.find((s) => s.id === seriesId);
    if (series?.dependency.kind === "attribute" && series.dependency.attributeId !== null) {
      const id = series.dependency.attributeId;
      const key = `attribute:${Number(id)}`;
      if (replacement !== undefined) {
        ranks[key] = replacement.amount!;
        replaced = true;
      } else if (bonus?.targetAttributeIds.includes(id) && ranks[key] !== undefined) {
        ranks[key] = Math.min(20, ranks[key] + bonus.amount!);
        boosted = true;
      }
    } else if (series?.dependency.kind === "title-rank" && replacement !== undefined) {
      titleAttributeRank = replacement.amount!;
      replaced = true;
    }
  }
  if (replaced && replacement !== undefined) {
    const attribute =
      replacement.definition.application === "spell-rank" ? "Illusion Magic" : "Fast Casting";
    assumptions.push(`Uses ${attribute} ${replacement.amount} · ${replacement.definition.label}.`);
  }
  if (boosted && bonus !== undefined)
    assumptions.push(
      `Next skill: +${bonus.amount} to its attribute scaling · ${bonus.definition.label}.`
    );
  return {
    ranks,
    assumptions,
    ...(titleAttributeRank === undefined ? {} : { titleAttributeRank })
  };
}
