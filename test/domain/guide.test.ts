import { describe, it, expect } from "vitest";
import {
  copyGuideFragment,
  guideDeletionImpact,
  resolveGuideContext
} from "../../src/domain/guide-references";
import type { GuideDocument } from "../../src/domain/guide";
const doc: GuideDocument<{ id: string; rank: number }> = {
  metadata: {
    version: 1,
    id: "guide-source",
    title: "Source",
    summary: null,
    tags: [],
    sources: []
  },
  nodes: [
    { type: "build", id: "gb-a", snapshot: { id: "gb-a", rank: 8 } },
    {
      type: "paragraph",
      children: [
        {
          type: "skill",
          skillId: "catalog:skill:194",
          context: { kind: "local", buildId: "gb-a" }
        },
        {
          type: "skill",
          skillId: "catalog:skill:194",
          context: { kind: "local", buildId: "outside" }
        }
      ]
    }
  ]
};
const copy = (sameSession: boolean) =>
  copyGuideFragment({
    nodes: doc.nodes,
    sourceGuideId: doc.metadata.id,
    sameSession,
    allocateId: () => "gb-copy",
    cloneBuild: (s, id) => ({ ...s, id })
  });
describe("neutral guide identity and reference operations", () => {
  it("remaps contained references and build identity together without mutating the source", () => {
    const nodes = copy(true);
    expect(nodes[0]).toEqual({
      type: "build",
      id: "gb-copy",
      snapshot: { id: "gb-copy", rank: 8 }
    });
    expect(nodes[1]).toMatchObject({
      children: [
        { context: { kind: "local", buildId: "gb-copy" } },
        { context: { kind: "local", buildId: "outside" } }
      ]
    });
    expect(doc.nodes[0]).toMatchObject({ id: "gb-a", snapshot: { id: "gb-a" } });
  });
  it("detaches external references across documents even with colliding portable IDs", () => {
    const copied = { ...doc, nodes: copy(false) };
    const last = copied.nodes[1];
    if (!last || !("children" in last)) throw new Error("fixture");
    const ref = last.children[1];
    if (ref?.type !== "skill") throw new Error("fixture");
    expect(ref.context).toEqual({
      kind: "detached",
      guideId: "guide-source",
      buildId: "outside",
      reason: "Copied from another document"
    });
    expect(
      resolveGuideContext(
        {
          ...copied,
          nodes: [
            ...copied.nodes,
            { type: "build", id: "outside", snapshot: { id: "outside", rank: 12 } }
          ]
        },
        ref.context
      ).kind
    ).toBe("detached");
  });
  it("reports deletion impact but preserves local identity for deletion undo", () => {
    expect(guideDeletionImpact(doc, "gb-a")).toBe(1);
    const context = { kind: "local" as const, buildId: "gb-a" };
    expect(resolveGuideContext({ ...doc, nodes: doc.nodes.slice(1) }, context).kind).toBe(
      "missing"
    );
    expect(resolveGuideContext(doc, context)).toMatchObject({
      kind: "bound",
      build: { id: "gb-a" }
    });
  });
});
