import { copyGuideFragment } from "../domain/guide-references";
import { guideBuilds, type GuideNode } from "../domain/guide";
import { emptyGuide, serializeGuideMarkdown } from "../guide/markdown";
import { parseGuideJson } from "../guide/strict-json";
import { validateGuideDocument } from "../guide/validation";
import { GUIDE_LIMITS, utf8Bytes, validGuideId } from "../guide/limits";
import { cloneGuideBuild, guideBuildAdapter } from "./guide-build-adapter";
import type { RuntimeGuideDocument } from "./guide-state";
import type { PersistedBuildSnapshot } from "./persistence-schema";
export const GUIDE_CLIPBOARD_MIME = "application/x-build-wars-guide-fragment+json";
export function guideFragmentMarkdown(nodes: readonly GuideNode<PersistedBuildSnapshot>[]) {
  const source = serializeGuideMarkdown({
    ...emptyGuide<PersistedBuildSnapshot>("fragment"),
    nodes
  });
  return source.slice(source.indexOf("\n:::\n") + 5).trimStart();
}
export function writeGuideFragment(
  state: RuntimeGuideDocument,
  nodes: readonly GuideNode<PersistedBuildSnapshot>[]
): string {
  return JSON.stringify({
    version: 1,
    session: state.history.session,
    generation: state.generation,
    guideId: state.history.frame.document.metadata.id,
    nodes
  });
}
export function readGuideFragment(
  raw: string,
  destination: RuntimeGuideDocument,
  newId: () => string
): readonly GuideNode<PersistedBuildSnapshot>[] {
  if (utf8Bytes(raw) > GUIDE_LIMITS.rawBytes)
    throw new Error("Clipboard fragment exceeds capacity.");
  const input = parseGuideJson(raw);
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid guide clipboard.");
  const record = input as Record<string, unknown>;
  if (
    Object.keys(record).some(
      (k) => !["version", "session", "generation", "guideId", "nodes"].includes(k)
    ) ||
    record.version !== 1 ||
    !validGuideId(record.guideId) ||
    (record.session !== undefined &&
      record.session !== null &&
      typeof record.session !== "string") ||
    (record.generation !== undefined &&
      (!Number.isSafeInteger(record.generation) || (record.generation as number) < 0))
  )
    throw new Error("Invalid guide clipboard envelope.");
  const document = validateGuideDocument(
    { ...emptyGuide(record.guideId), nodes: record.nodes },
    guideBuildAdapter(null)
  );
  const occupied = new Set(guideBuilds(destination.history.frame.document).map((b) => b.id));
  return copyGuideFragment({
    nodes: document.nodes,
    sourceGuideId: record.guideId,
    sameSession:
      record.session === destination.history.session &&
      record.generation === destination.generation &&
      record.guideId === destination.history.frame.document.metadata.id,
    cloneBuild: cloneGuideBuild,
    allocateId: () => {
      const id = newId();
      if (!validGuideId(id) || occupied.has(id))
        throw new Error("Copied build identity collided; no fragment was inserted.");
      occupied.add(id);
      return id;
    }
  });
}
