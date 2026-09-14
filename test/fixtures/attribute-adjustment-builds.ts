import { catalogId, type Build } from "../../src/domain";
import { createBlankBuild } from "../../src/app/editor-state";
import { requireReadyCatalogs } from "../../src/app/catalogs";

export const adjustmentCatalogs = requireReadyCatalogs();
export const fireId = catalogId<"Attribute">(10);
export const fireRune = (tier: "minor" | "major" | "superior") =>
  adjustmentCatalogs.equipment.runes.find(
    (r) => r.affectedAttributeId === fireId && r.familyRank === tier
  )!;
export function elementalBuild(overrides: Partial<Build> = {}): Build {
  return {
    ...createBlankBuild("Elemental preview"),
    primaryProfessionId: catalogId<"Profession">(6),
    secondaryProfessionId: catalogId<"Profession">(4),
    attributes: [{ attributeId: fireId, rank: 12 }],
    attributeAdjustments: {
      headgearAttributeId: fireId,
      runes: [{ attributeId: fireId, runeId: fireRune("superior").id }],
      effectPreferences: []
    },
    ...overrides
  };
}
export function adjustmentPreviewInput(build: Build) {
  return {
    build,
    professionAttributes: adjustmentCatalogs.validation.professionAttributes,
    skillCatalog: adjustmentCatalogs.skillCatalog,
    runes: adjustmentCatalogs.equipment.validation.runes!
  };
}
