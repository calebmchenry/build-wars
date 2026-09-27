import { guideBuilds, type GuideDocument, type GuideNode, type GuideSkillContext } from "./guide";

export function mapGuideNodes<B>(
  nodes: readonly GuideNode<B>[],
  map: (node: GuideNode<B>) => GuideNode<B>
): GuideNode<B>[] {
  return nodes.map((node) =>
    map("children" in node ? { ...node, children: mapGuideNodes(node.children, map) } : node)
  );
}
export function resolveGuideContext<B>(doc: GuideDocument<B>, context: GuideSkillContext) {
  if (context.kind !== "local") return { kind: context.kind, build: null } as const;
  const build = guideBuilds(doc).find((b) => b.id === context.buildId) ?? null;
  return { kind: build ? "bound" : "missing", build } as const;
}
export function guideDeletionImpact<B>(doc: GuideDocument<B>, buildId: string): number {
  let mentions = 0;
  mapGuideNodes(doc.nodes, (node) => {
    if (node.type === "skill" && node.context.kind === "local" && node.context.buildId === buildId)
      mentions++;
    return node;
  });
  return mentions;
}
/** Allocate contained build identities together. External references never bind by coincidence. */
export function copyGuideFragment<B>(input: {
  nodes: readonly GuideNode<B>[];
  sourceGuideId: string;
  sameSession: boolean;
  allocateId: () => string;
  cloneBuild: (snapshot: B, id: string) => B;
}): readonly GuideNode<B>[] {
  const ids = new Map<string, string>();
  for (const node of input.nodes) if (node.type === "build") ids.set(node.id, input.allocateId());
  if (new Set(ids.values()).size !== ids.size)
    throw new Error("ID allocator returned a collision.");
  return mapGuideNodes(input.nodes, (node) => {
    if (node.type === "build") {
      const id = ids.get(node.id)!;
      return { ...node, id, snapshot: input.cloneBuild(node.snapshot, id) };
    }
    if (node.type !== "skill" || node.context.kind !== "local") return node;
    const buildId = ids.get(node.context.buildId);
    if (buildId) return { ...node, context: { kind: "local", buildId } };
    if (input.sameSession) return node;
    return {
      ...node,
      context: {
        kind: "detached",
        guideId: input.sourceGuideId,
        buildId: node.context.buildId,
        reason: "Copied from another document"
      }
    };
  });
}
