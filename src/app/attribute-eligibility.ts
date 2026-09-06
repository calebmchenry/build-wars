import type { AttributeId, Build, CatalogAttributeRecord, ProfessionId } from "../domain";
import type { AppCatalogViews } from "./catalogs";
import type { BrowserProfessionScope, EditorAction, EditorState } from "./editor-state";

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
  const browserProfessionScope = browserProfessionScopeAfterProfessionChange(
    state,
    catalogs,
    field,
    professionId
  );
  return {
    type: "set-profession",
    field,
    professionId,
    clearAttributeIds: attributeIdsClearedByProfessionChange(state, catalogs, field, professionId),
    clearSkillSlotIndexes: skillSlotIndexesClearedByProfessionChange(
      state,
      catalogs,
      field,
      professionId
    ),
    ...(browserProfessionScope === undefined ? {} : { browserProfessionScope })
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

function skillSlotIndexesClearedByProfessionChange(
  state: EditorState,
  catalogs: AppCatalogViews,
  field: "primary" | "secondary",
  professionId: ProfessionId | null
): readonly number[] {
  const previousProfessionId =
    field === "primary" ? state.build.primaryProfessionId : state.build.secondaryProfessionId;
  if (sameProfession(previousProfessionId, professionId)) {
    return [];
  }

  const nextPair: ProfessionPair =
    field === "primary"
      ? { ...state.build, primaryProfessionId: professionId }
      : { ...state.build, secondaryProfessionId: professionId };
  const selectedProfessionIds = selectedProfessionSet(nextPair);

  return state.build.skillBar.flatMap((skillId, index) => {
    if (skillId === null) {
      return [];
    }
    const skill = catalogs.skills.find((candidate) => Number(candidate.id) === Number(skillId));
    if (skill === undefined || skill.professionId === null) {
      return [];
    }
    return selectedProfessionIds.has(Number(skill.professionId)) ? [] : [index];
  });
}

function browserProfessionScopeAfterProfessionChange(
  state: EditorState,
  catalogs: AppCatalogViews,
  field: "primary" | "secondary",
  professionId: ProfessionId | null
): BrowserProfessionScope | undefined {
  const previousProfessionId =
    field === "primary" ? state.build.primaryProfessionId : state.build.secondaryProfessionId;
  if (sameProfession(previousProfessionId, professionId)) {
    return undefined;
  }

  const scope = state.browser.filters.professionScope;
  if (scope.kind !== "custom") {
    return undefined;
  }

  const selected = new Set(scope.professionIds.map((selectedId) => Number(selectedId)));
  if (previousProfessionId !== null) {
    selected.delete(Number(previousProfessionId));
  }
  if (professionId !== null) {
    selected.add(Number(professionId));
  }

  const nextProfessionIds = catalogs.professions
    .filter((profession) => selected.has(Number(profession.id)))
    .map((profession) => profession.id);
  return professionScopeFromIds(nextProfessionIds, catalogs);
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

function selectedProfessionSet(pair: ProfessionPair): ReadonlySet<number> {
  const selected = new Set<number>();
  if (pair.primaryProfessionId !== null) {
    selected.add(Number(pair.primaryProfessionId));
  }
  if (pair.secondaryProfessionId !== null) {
    selected.add(Number(pair.secondaryProfessionId));
  }
  return selected;
}

function professionScopeFromIds(
  professionIds: readonly ProfessionId[],
  catalogs: AppCatalogViews
): BrowserProfessionScope {
  const selected = new Set(professionIds.map((professionId) => Number(professionId)));
  const normalized = catalogs.professions
    .filter((profession) => selected.has(Number(profession.id)))
    .map((profession) => profession.id);
  if (normalized.length === 0 || normalized.length === catalogs.professions.length) {
    return { kind: "all" };
  }
  return { kind: "custom", professionIds: normalized };
}

function sameProfession(left: ProfessionId | null, right: ProfessionId | null): boolean {
  return left === null ? right === null : right !== null && Number(left) === Number(right);
}
