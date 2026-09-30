import { catalogId, lookupSkillById, type SkillId } from "../domain";
import { guideBuilds, type GuideNode } from "../domain/guide";
import { parseGuideJson } from "../guide/strict-json";
import { utf8Bytes } from "../guide/limits";
import type { AppCatalogViews } from "./catalogs";
import type { EditorAction } from "./editor-state";
import type { RuntimeGuideDocument } from "./guide-state";
import { hydrateEditorFromSnapshot, type PersistedBuildSnapshot } from "./persistence-schema";
import { planSkillBarWorkflow } from "./skill-bar-workflow";

export const GUIDE_SKILL_MIME = "application/x-build-wars-guide-skill+json";
type Source =
  | { readonly kind: "catalog"; readonly skillId: number }
  | {
      readonly kind: "bar";
      readonly buildId: string;
      readonly index: number;
      readonly fingerprint: string;
    };
export interface GuideSkillPayload {
  readonly version: 1;
  readonly session: string;
  readonly guideId: string;
  readonly generation: number;
  readonly source: Source;
}
export type GuidePlacementTarget =
  | { readonly kind: "prose" }
  | { readonly kind: "slot"; readonly buildId: string; readonly index: number };
export type GuidePlacementPlan =
  | { readonly kind: "rejected" | "unchanged"; readonly message: string }
  | {
      readonly kind: "mention";
      readonly node: Extract<GuideNode<PersistedBuildSnapshot>, { type: "skill" }>;
      readonly message: string;
    }
  | {
      readonly kind: "slot";
      readonly buildId: string;
      readonly action: EditorAction;
      readonly message: string;
    };
const slotFingerprint = (snapshot: PersistedBuildSnapshot, index: number) =>
  JSON.stringify([snapshot.build.skillBar[index], snapshot.rawTemplate.skillBar[index]]);
const validIndex = (index: unknown): index is number =>
  typeof index === "number" && Number.isInteger(index) && index >= 0 && index < 8;
export function guideSlotHasContent(snapshot: PersistedBuildSnapshot, index: number) {
  const raw = snapshot.rawTemplate.skillBar[index];
  return (
    (snapshot.build.skillBar[index] !== null && snapshot.build.skillBar[index] !== undefined) ||
    (!!raw && raw.outcomeKind !== "empty" && raw.outcomeKind !== "none")
  );
}
export function captureGuideSkill(
  state: RuntimeGuideDocument,
  source: { kind: "catalog"; skillId: SkillId } | { kind: "bar"; buildId: string; index: number }
): GuideSkillPayload | null {
  let captured: Source;
  if (source.kind === "catalog") captured = { kind: "catalog", skillId: Number(source.skillId) };
  else {
    const build = guideBuilds(state.history.frame.document).find(
      (build) => build.id === source.buildId
    );
    if (!build || !validIndex(source.index) || !guideSlotHasContent(build.snapshot, source.index))
      return null;
    captured = { ...source, fingerprint: slotFingerprint(build.snapshot, source.index) };
  }
  return {
    version: 1,
    session: state.history.session,
    guideId: state.history.frame.document.metadata.id,
    generation: state.generation,
    source: captured
  };
}
export function readGuideSkillPayload(raw: string): GuideSkillPayload | null {
  if (utf8Bytes(raw) > 65536) return null;
  try {
    const value = parseGuideJson(raw);
    if (
      !record(value) ||
      !keys(value, ["version", "session", "guideId", "generation", "source"]) ||
      value.version !== 1 ||
      typeof value.session !== "string" ||
      typeof value.guideId !== "string" ||
      !Number.isSafeInteger(value.generation) ||
      Number(value.generation) < 0 ||
      !record(value.source)
    )
      return null;
    const source = value.source;
    if (
      source.kind === "catalog" &&
      keys(source, ["kind", "skillId"]) &&
      Number.isSafeInteger(source.skillId) &&
      Number(source.skillId) > 0
    )
      return value as unknown as GuideSkillPayload;
    if (
      source.kind === "bar" &&
      keys(source, ["kind", "buildId", "index", "fingerprint"]) &&
      typeof source.buildId === "string" &&
      validIndex(source.index) &&
      typeof source.fingerprint === "string"
    )
      return value as unknown as GuideSkillPayload;
    return null;
  } catch {
    return null;
  }
}
export function planGuidePlacement(
  state: RuntimeGuideDocument,
  payload: GuideSkillPayload | null,
  catalogs: AppCatalogViews,
  target: GuidePlacementTarget
): GuidePlacementPlan {
  const reject = (message: string): GuidePlacementPlan => ({ kind: "rejected", message });
  if (!payload || !readGuideSkillPayload(JSON.stringify(payload)))
    return reject("Invalid guide skill payload; nothing changed.");
  if (state.composing) return reject("Finish composing before placing a skill.");
  if (
    payload.session !== state.history.session ||
    payload.generation !== state.generation ||
    payload.guideId !== state.history.frame.document.metadata.id
  )
    return reject("This skill came from an older guide session; pick it again.");
  const builds = guideBuilds(state.history.frame.document);
  const source = payload.source;
  const sourceBuild =
    source.kind === "bar" ? builds.find((build) => build.id === source.buildId) : null;
  if (
    source.kind === "bar" &&
    (!sourceBuild || slotFingerprint(sourceBuild.snapshot, source.index) !== source.fingerprint)
  )
    return reject("The source slot changed or was deleted; pick it again.");
  const skillId =
    source.kind === "catalog"
      ? catalogId<"Skill">(source.skillId)
      : sourceBuild!.snapshot.build.skillBar[source.index];
  if (target.kind === "slot") {
    const build = builds.find((build) => build.id === target.buildId);
    if (!build || !validIndex(target.index))
      return reject("The target build or slot no longer exists.");
    const sameBar = source.kind === "bar" && source.buildId === target.buildId;
    if (
      !sameBar &&
      (skillId === null ||
        skillId === undefined ||
        !lookupSkillById(catalogs.skillCatalog, skillId))
    )
      return reject("Unresolved source slots can move within their own bar only.");
    const result = planSkillBarWorkflow(
      hydrateEditorFromSnapshot(build.snapshot),
      catalogs,
      sameBar
        ? { kind: "bar-slot", fromIndex: source.index, toIndex: target.index }
        : { kind: "catalog-skill", skillId: skillId!, toIndex: target.index }
    );
    if (!result.ok) return reject(result.announcement);
    if (
      JSON.stringify(result.plan.skillBar) === JSON.stringify(build.snapshot.build.skillBar) &&
      (!sameBar ||
        JSON.stringify(result.plan.rawSkillBar) ===
          JSON.stringify(build.snapshot.rawTemplate.skillBar))
    )
      return { kind: "unchanged", message: result.plan.announcement };
    return {
      kind: "slot",
      buildId: build.id,
      action: {
        type: "apply-skill-bar-plan",
        skillBar: result.plan.skillBar,
        rawSkillBar: result.plan.rawSkillBar,
        selectedSlotIndex: target.index
      },
      message: result.plan.announcement
    };
  }
  if (skillId === null || skillId === undefined || !lookupSkillById(catalogs.skillCatalog, skillId))
    return reject("This unresolved slot has no catalog skill to reference.");
  return {
    kind: "mention",
    node: {
      type: "skill",
      skillId: `catalog:skill:${Number(skillId)}`,
      context:
        source.kind === "bar" ? { kind: "local", buildId: source.buildId } : { kind: "generic" }
    },
    message: `Inserted ${source.kind === "bar" ? "a source-build" : "a generic"} reference. The source bar is unchanged.`
  };
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function keys(value: Record<string, unknown>, expected: readonly string[]) {
  return (
    Object.keys(value).length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  );
}
