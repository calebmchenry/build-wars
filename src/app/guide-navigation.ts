import type { GuideNode } from "../domain/guide";
import type { AppliedGuide } from "./guide-history";
import type { PersistedBuildSnapshot } from "./persistence-schema";

export const GUIDE_FRAGMENT_PREFIX = "bw-guide:";
export function guideAnchor(guideId: string, kind: "section" | "build", key: string): string {
  return `${GUIDE_FRAGMENT_PREFIX}${guideId}:${kind}:${key}`;
}
export interface GuideNavigationItem {
  readonly id: string;
  readonly label: string;
  readonly kind: "section" | "build";
}
export function guideNavigation(document: AppliedGuide): readonly GuideNavigationItem[] {
  const items: GuideNavigationItem[] = [];
  const label = (nodes: readonly GuideNode<PersistedBuildSnapshot>[]): string =>
    nodes
      .map((node) =>
        "value" in node
          ? node.value
          : "children" in node
            ? label(node.children)
            : node.type === "skill"
              ? node.skillId
              : ""
      )
      .join("");
  const visit = (nodes: readonly GuideNode<PersistedBuildSnapshot>[], parent = "") => {
    nodes.forEach((node, index) => {
      const path = parent ? `${parent}.${index}` : `${index}`;
      if (node.type === "heading")
        items.push({
          id: guideAnchor(document.metadata.id, "section", path),
          label: label(node.children) || "Untitled section",
          kind: "section"
        });
      if (node.type === "build")
        items.push({
          id: guideAnchor(document.metadata.id, "build", node.id),
          label: node.snapshot.build.name,
          kind: "build"
        });
      if ("children" in node) visit(node.children, path);
    });
  };
  visit(document.nodes);
  return items;
}
/** A fragment can only navigate the currently restored guide, never load another document. */
export function matchingGuideAnchor(document: AppliedGuide, hash: string): string | null {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  return guideNavigation(document).some((item) => item.id === id) ? id : null;
}
