import { catalogId } from "../domain";
import type { AppCatalogViews } from "./catalogs";
import { hydrateEditorFromSnapshot, type PersistedBuildSnapshot } from "./persistence-schema";
import { selectGenericSkillDisplay, selectSkillDisplay } from "./editor-selectors";
import type { AppliedGuide } from "./guide-history";
import type { GuideSkillContext } from "../domain/guide";
import { resolveGuideContext } from "../domain/guide-references";
const projections = new WeakMap<
  PersistedBuildSnapshot,
  {
    catalogs: AppCatalogViews;
    values: Map<string, ReturnType<typeof selectSkillDisplay>>;
  }
>();
/** Snapshots are immutable; cache context by its actual owner, never active selection. */
export function selectGuideBoundSkill(
  catalogs: AppCatalogViews,
  snapshot: PersistedBuildSnapshot,
  identity: string
) {
  let cache = projections.get(snapshot);
  if (!cache || cache.catalogs !== catalogs) {
    cache = { catalogs, values: new Map() };
    projections.set(snapshot, cache);
  }
  let view = cache.values.get(identity);
  if (!view) {
    view = selectSkillDisplay(
      catalogs,
      hydrateEditorFromSnapshot(snapshot),
      catalogId<"Skill">(Number(identity.split(":").at(-1))),
      "tooltip",
      null
    );
    cache.values.set(identity, view);
  }
  return view;
}

export function selectGuideSkill(
  catalogs: AppCatalogViews,
  document: AppliedGuide,
  identity: string,
  context: GuideSkillContext
) {
  const resolved = resolveGuideContext(document, context);
  const label = resolved.build
    ? resolved.build.snapshot.build.name
    : context.kind === "generic"
      ? "Generic"
      : context.kind === "detached"
        ? `Detached from ${context.guideId} / ${context.buildId}`
        : `Missing build ${context.buildId}`;
  const view = resolved.build
    ? selectGuideBoundSkill(catalogs, resolved.build.snapshot, identity)
    : selectGenericSkillDisplay(catalogs, catalogId<"Skill">(Number(identity.split(":").at(-1))));
  return {
    label,
    status: resolved.kind,
    view:
      view.kind === "known"
        ? {
            ...view,
            assumptions: [
              `Context: ${label}${resolved.build ? ` (${resolved.build.snapshot.build.mode.toUpperCase()})` : ""}.`,
              ...view.assumptions
            ]
          }
        : view
  };
}
