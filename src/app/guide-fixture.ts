import { authoredDocumentId, catalogId } from "../domain";
import type { GuideNode } from "../domain/guide";
import { emptyGuide } from "../guide/markdown";
import { createBlankEditorState } from "./editor-state";
import { createPersistedBuildSnapshot, type PersistedBuildSnapshot } from "./persistence-schema";
import type { AppliedGuide } from "./guide-history";
export function createGuideFixture(long = false): AppliedGuide {
  const blank = createBlankEditorState("Flare practice");
  const snapshot = createPersistedBuildSnapshot({
    ...blank,
    build: {
      ...blank.build,
      id: authoredDocumentId("gb-flare"),
      primaryProfessionId: catalogId<"Profession">(6),
      attributes: [{ attributeId: catalogId<"Attribute">(10), rank: 8 }],
      skillBar: [catalogId<"Skill">(194), null, null, null, null, null, null, null]
    }
  });
  const nodes: GuideNode<PersistedBuildSnapshot>[] = [
    { type: "heading", depth: 1, children: [{ type: "text", value: "Practice guide" }] },
    {
      type: "paragraph",
      children: [
        { type: "text", value: "Practice with " },
        {
          type: "skill",
          skillId: "catalog:skill:194",
          context: { kind: "local", buildId: "gb-flare" }
        },
        { type: "text", value: " before changing the variant." }
      ]
    },
    { type: "build", id: "gb-flare", snapshot },
    { type: "paragraph", children: [{ type: "text", value: "Write your observations here." }] }
  ];
  if (long) {
    for (let i = 1; i < 16; i++)
      nodes.push({
        type: "build",
        id: `gb-${i}`,
        snapshot: {
          ...snapshot,
          build: { ...snapshot.build, id: authoredDocumentId(`gb-${i}`), name: `Variant ${i}` }
        }
      });
    for (let i = 0; i < 400; i++)
      nodes.push(
        i % 4 === 0
          ? {
              type: "code",
              lang: "text",
              value: `Practice note ${i}\n:bw-skill[]{skill="catalog:skill:194" context="generic"}`
            }
          : {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  value: `Practice note ${i}. Observe timing and preserve independent attributes. `
                },
                ...Array.from({ length: i % 4 === 0 ? 0 : 2 }, (_, j) => ({
                  type: "skill" as const,
                  skillId: "catalog:skill:194",
                  context: {
                    kind: "local" as const,
                    buildId: (i + j) % 16 === 0 ? "gb-flare" : `gb-${(i + j) % 16}`
                  }
                }))
              ]
            }
      );
  }
  return { ...emptyGuide<PersistedBuildSnapshot>("guide-practice"), nodes };
}
