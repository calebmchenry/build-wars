import { projectAttributePreview, type Build, type AttributePreview } from "../domain";
import type { AppCatalogViews } from "./catalogs";

/** App boundary supplies catalog facts, without depending on editor selectors. */
export function selectAttributePreview(build: Build, catalogs: AppCatalogViews): AttributePreview {
  return projectAttributePreview({
    build,
    professionAttributes: catalogs.validation.professionAttributes,
    skillCatalog: catalogs.skillCatalog,
    ...(catalogs.equipment.validation.runes === undefined
      ? {}
      : { runes: catalogs.equipment.validation.runes })
  });
}
