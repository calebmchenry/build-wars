import type { GuideDocument, GuideNode, GuideSkillContext } from "../domain/guide";
import { GUIDE_LIMITS, safeGuideUrl, utf8Bytes, validGuideId } from "./limits";
import {
  parseGuideMarkdown,
  serializeGuideMarkdown,
  validateGuideMetadata,
  type GuideBuildAdapter
} from "./markdown";

function object(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a guide object.");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((k) => !allowed.includes(k)))
    throw new Error("Unknown guide field.");
  return record;
}
function text(value: unknown, max = GUIDE_LIMITS.rawBytes): string {
  if (typeof value !== "string" || value.length > max) throw new Error("Invalid guide text.");
  return value;
}
function id(value: unknown): string {
  if (!validGuideId(value)) throw new Error("Invalid guide identity.");
  return value;
}
export function validateGuideContext(value: unknown): GuideSkillContext {
  const context = object(value, ["kind", "buildId", "guideId", "reason"]);
  switch (context.kind) {
    case "generic":
      object(value, ["kind"]);
      return { kind: "generic" };
    case "local":
      object(value, ["kind", "buildId"]);
      return { kind: "local", buildId: id(context.buildId) };
    case "detached":
      return {
        kind: "detached",
        buildId: id(context.buildId),
        guideId: id(context.guideId),
        reason: text(context.reason, 2048)
      };
    default:
      throw new Error("Invalid guide skill context.");
  }
}
/** Validate external JSON independently of both app state and the editor vendor. */
export function validateGuideDocument<B>(
  value: unknown,
  adapter: GuideBuildAdapter<B>
): GuideDocument<B> {
  const root = object(value, ["metadata", "nodes"]);
  const metadata = validateGuideMetadata(root.metadata);
  let count = 0,
    mentions = 0;
  const builds = new Set<string>();
  type Position = "block" | "inline" | "item";
  const list = (input: unknown, depth: number, position: Position): GuideNode<B>[] => {
    if (!Array.isArray(input) || input.length > GUIDE_LIMITS.nodes)
      throw new Error("Invalid guide nodes.");
    return input.map((value) => {
      if (++count > GUIDE_LIMITS.nodes || depth > GUIDE_LIMITS.depth)
        throw new Error("Guide node/depth limit exceeded.");
      const node = object(value, [
        "type",
        "value",
        "children",
        "depth",
        "ordered",
        "start",
        "url",
        "title",
        "lang",
        "skillId",
        "context",
        "id",
        "snapshot",
        "raw"
      ]);
      const type = node.type;
      const inline = ["text", "inlineCode", "emphasis", "strong", "link", "skill", "break"];
      if (position === "inline" && !inline.includes(String(type)))
        throw new Error("Block inside inline content.");
      if (position === "block" && inline.includes(String(type)))
        throw new Error("Inline content requires a paragraph.");
      if ((position === "item") !== (type === "listItem"))
        throw new Error("Invalid list structure.");
      switch (type) {
        case "text":
        case "inlineCode":
          object(node, ["type", "value"]);
          return { type, value: text(node.value) };
        case "break":
        case "thematicBreak":
          object(node, ["type"]);
          return { type };
        case "paragraph":
        case "emphasis":
        case "strong":
        case "blockquote":
        case "listItem":
          object(node, ["type", "children"]);
          return {
            type,
            children: list(
              node.children,
              depth + 1,
              type === "blockquote" || type === "listItem" ? "block" : "inline"
            )
          };
        case "heading":
          object(node, ["type", "depth", "children"]);
          if (!Number.isInteger(node.depth) || Number(node.depth) < 1 || Number(node.depth) > 6)
            throw new Error("Invalid heading level.");
          return {
            type,
            depth: Number(node.depth),
            children: list(node.children, depth + 1, "inline")
          };
        case "list":
          object(node, ["type", "ordered", "start", "children"]);
          if (
            typeof node.ordered !== "boolean" ||
            !Number.isSafeInteger(node.start) ||
            Number(node.start) < 1 ||
            Number(node.start) > 999999999
          )
            throw new Error("Invalid list start.");
          return {
            type,
            ordered: node.ordered,
            start: Number(node.start),
            children: list(node.children, depth + 1, "item")
          };
        case "link":
          object(node, ["type", "url", "title", "children"]);
          if (!safeGuideUrl(text(node.url, 2048))) throw new Error("Unsafe guide link.");
          return {
            type,
            url: node.url as string,
            title: node.title === null ? null : text(node.title, 2048),
            children: list(node.children, depth + 1, "inline")
          };
        case "code":
          object(node, ["type", "lang", "value"]);
          return {
            type,
            lang: node.lang === null ? null : text(node.lang, 80),
            value: text(node.value)
          };
        case "skill":
          object(node, ["type", "skillId", "context"]);
          if (
            ++mentions > GUIDE_LIMITS.mentions ||
            !/^catalog:skill:[A-Za-z0-9._:-]{1,160}$/.test(text(node.skillId, 174))
          )
            throw new Error("Invalid guide skill identity or mention limit.");
          return {
            type,
            skillId: node.skillId as string,
            context: validateGuideContext(node.context)
          };
        case "build": {
          object(node, ["type", "id", "snapshot"]);
          const identity = id(node.id);
          if (depth !== 1 || builds.has(identity) || builds.size >= GUIDE_LIMITS.builds)
            throw new Error("Duplicate, nested or excess guide build.");
          builds.add(identity);
          const snapshot = adapter.validate(node.snapshot);
          if (adapter.id(snapshot) !== identity)
            throw new Error("Embed and nested build identity must match.");
          return { type, id: identity, snapshot };
        }
        case "opaque":
          object(node, ["type", "raw"]);
          if (depth !== 1) throw new Error("Opaque content must be top-level.");
          return { type, raw: text(node.raw) };
        default:
          throw new Error("Unsupported guide node.");
      }
    });
  };
  const document = { metadata, nodes: list(root.nodes, 1, "block") };
  const source = serializeGuideMarkdown(document);
  if (utf8Bytes(source) > GUIDE_LIMITS.appliedBytes)
    throw new Error("Guide exceeds canonical source capacity.");
  const opaque = document.nodes.filter((node) => node.type === "opaque").map((node) => node.raw);
  if (opaque.length) {
    const parsed = parseGuideMarkdown(source, adapter, () => metadata.id);
    if (
      !parsed.ok ||
      JSON.stringify(
        parsed.document.nodes.filter((node) => node.type === "opaque").map((node) => node.raw)
      ) !== JSON.stringify(opaque)
    )
      throw new Error(
        "Opaque source cannot be safely reinserted here; retain the source document."
      );
  }
  return document;
}
