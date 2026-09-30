import type { JSONContent } from "@tiptap/core";
import type { GuideNode } from "../domain/guide";
import type { AppliedGuide } from "./guide-history";
import type { PersistedBuildSnapshot } from "./persistence-schema";
type Node = GuideNode<PersistedBuildSnapshot>;
const blockNames: Record<string, string> = {
  listItem: "listItem",
  blockquote: "blockquote",
  paragraph: "paragraph",
  heading: "heading",
  thematicBreak: "horizontalRule",
  break: "hardBreak"
};
export function projectGuideNodes(nodes: readonly Node[]): JSONContent[] {
  return nodes.flatMap((node): JSONContent[] => {
    switch (node.type) {
      case "text":
        return node.value ? [{ type: "text", text: node.value }] : [];
      case "inlineCode":
        return [{ type: "text", text: node.value, marks: [{ type: "code" }] }];
      case "strong":
      case "emphasis":
      case "link": {
        const mark =
          node.type === "link"
            ? { type: "link", attrs: { href: node.url, title: node.title } }
            : { type: node.type === "strong" ? "bold" : "italic" };
        return projectGuideNodes(node.children).map((child) => ({
          ...child,
          marks: [...(child.marks ?? []), mark]
        }));
      }
      case "build":
        return [{ type: "guideBuild", attrs: { id: node.id } }];
      case "skill":
        return [{ type: "guideSkill", attrs: { skillId: node.skillId, context: node.context } }];
      case "opaque":
        return [{ type: "guideOpaque", attrs: { raw: node.raw } }];
      case "code":
        return [
          {
            type: "codeBlock",
            attrs: { language: node.lang },
            content: node.value ? [{ type: "text", text: node.value }] : []
          }
        ];
      case "list":
        return [
          {
            type: node.ordered ? "orderedList" : "bulletList",
            attrs: { start: node.start },
            content: projectGuideNodes(node.children)
          }
        ];
      default:
        return [
          {
            type: blockNames[node.type]!,
            ...(node.type === "heading" ? { attrs: { level: node.depth } } : {}),
            ...("children" in node ? { content: projectGuideNodes(node.children) } : {})
          }
        ];
    }
  });
}
export function readGuideNodes(content: JSONContent[], previous: AppliedGuide): Node[] {
  return content.map((node) => {
    const children = () => readGuideNodes(node.content ?? [], previous);
    const attrs = node.attrs ?? {};
    let result: Node;
    switch (node.type) {
      case "text":
        result = { type: "text", value: node.text ?? "" };
        break;
      case "guideBuild": {
        const build = previous.nodes.find((item) => item.type === "build" && item.id === attrs.id);
        if (!build) throw new Error("Unknown build projection.");
        return build;
      }
      case "guideSkill":
        result = {
          type: "skill",
          skillId: attrs.skillId as string,
          context: attrs.context as Extract<Node, { type: "skill" }>["context"]
        };
        break;
      case "guideOpaque":
        return { type: "opaque", raw: attrs.raw as string };
      case "heading":
        result = { type: "heading", depth: attrs.level as number, children: children() };
        break;
      case "orderedList":
      case "bulletList":
        result = {
          type: "list",
          ordered: node.type === "orderedList",
          start: (attrs.start as number | undefined) ?? 1,
          children: children()
        };
        break;
      case "codeBlock":
        return {
          type: "code",
          lang: (attrs.language as string | null) ?? null,
          value: (node.content ?? []).map((child) => child.text ?? "").join("")
        };
      case "paragraph":
      case "blockquote":
      case "listItem":
        result = { type: node.type, children: children() };
        break;
      case "horizontalRule":
        return { type: "thematicBreak" };
      case "hardBreak":
        return { type: "break" };
      default:
        throw new Error(`Unsupported editor projection ${node.type}.`);
    }
    for (const mark of node.marks ?? []) {
      if (mark.type === "code" && result.type === "text")
        result = { type: "inlineCode", value: result.value };
      else if (mark.type === "bold" || mark.type === "italic")
        result = { type: mark.type === "bold" ? "strong" : "emphasis", children: [result] };
      else if (mark.type === "link")
        result = {
          type: "link",
          url: mark.attrs?.href as string,
          title: (mark.attrs?.title as string | null) ?? null,
          children: [result]
        };
    }
    return result;
  });
}
