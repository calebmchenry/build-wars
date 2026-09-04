import type { AttributeId, Build, CatalogAttributeRecord, ProfessionId } from "../domain";
import type { AppCatalogViews } from "./catalogs";
import type { EditorAction, EditorState } from "./editor-state";

type ProfessionPair = Pick<Build, "primaryProfessionId" | "secondaryProfessionId">;

export function legalAttributesForSelectedProfessions(
  state: EditorState,
  catalogs: AppCatalogViews
): readonly CatalogAttributeRecord[] {
  const primaryProfessionId = state.build.primaryProfessionId;
  if (primaryProfessionId === null) {
    return [];
  }

  const attributes: CatalogAttributeRecord[] = [];
  appendProfessionAttributes(attributes, catalogs, primaryProfessionId, {
    includePrimaryOnly: true
  });

  const secondaryProfessionId = state.build.secondaryProfessionId;
  if (
    secondaryProfessionId !== null &&
    Number(secondaryProfessionId) !== Number(primaryProfessionId)
  ) {
    appendProfessionAttributes(attributes, catalogs, secondaryProfessionId, {
      includePrimaryOnly: false
    });
  }

  return attributes;
}

export function attributeIsLegalForSelectedProfessions(
  attribute: CatalogAttributeRecord,
  state: EditorState
): boolean {
  return attributeIsLegalForProfessionPair(attribute, state.build);
}

export function setProfessionWithAttributeCleanup(
  state: EditorState,
  catalogs: AppCatalogViews,
  field: "primary" | "secondary",
  professionId: ProfessionId | null
): Extract<EditorAction, { readonly type: "set-profession" }> {
  return {
    type: "set-profession",
    field,
    professionId,
    clearAttributeIds: attributeIdsClearedByProfessionChange(state, catalogs, field, professionId)
  };
}

function attributeIdsClearedByProfessionChange(
  state: EditorState,
  catalogs: AppCatalogViews,
  field: "primary" | "secondary",
  professionId: ProfessionId | null
): readonly AttributeId[] {
  const previousProfessionId =
    field === "primary" ? state.build.primaryProfessionId : state.build.secondaryProfessionId;
  if (sameProfession(previousProfessionId, professionId)) {
    return [];
  }

  const nextPair: ProfessionPair =
    field === "primary"
      ? { ...state.build, primaryProfessionId: professionId }
      : { ...state.build, secondaryProfessionId: professionId };

  return state.build.attributes.flatMap((allocation) => {
    const attribute = catalogs.attributes.find(
      (candidate) => Number(candidate.id) === Number(allocation.attributeId)
    );
    if (attribute === undefined || !sameProfession(attribute.professionId, previousProfessionId)) {
      return [];
    }
    return attributeIsLegalForProfessionPair(attribute, nextPair) ? [] : [attribute.id];
  });
}

function appendProfessionAttributes(
  attributes: CatalogAttributeRecord[],
  catalogs: AppCatalogViews,
  professionId: ProfessionId,
  options: { readonly includePrimaryOnly: boolean }
): void {
  for (const attribute of catalogs.attributes) {
    if (Number(attribute.professionId) !== Number(professionId)) {
      continue;
    }
    if (!options.includePrimaryOnly && attribute.isPrimaryOnly) {
      continue;
    }
    attributes.push(attribute);
  }
}

function attributeIsLegalForProfessionPair(
  attribute: CatalogAttributeRecord,
  pair: ProfessionPair
): boolean {
  const primaryProfessionId = pair.primaryProfessionId;
  if (primaryProfessionId === null) {
    return false;
  }
  if (Number(attribute.professionId) === Number(primaryProfessionId)) {
    return true;
  }
  return (
    pair.secondaryProfessionId !== null &&
    Number(attribute.professionId) === Number(pair.secondaryProfessionId) &&
    !attribute.isPrimaryOnly
  );
}

function sameProfession(left: ProfessionId | null, right: ProfessionId | null): boolean {
  return left === null ? right === null : right !== null && Number(left) === Number(right);
}
