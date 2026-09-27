import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkDirective from "remark-directive";
import type { Root, RootContent } from "mdast";
import type { Literal } from "unist";
interface GuideRawNode extends Literal {
  type: "guideRaw";
  value: string;
}
declare module "mdast" {
  interface RootContentMap {
    guideRaw: GuideRawNode;
  }
}
import type { GuideDocument, GuideMetadata, GuideNode, GuideSkillContext } from "../domain/guide";
import { GUIDE_LIMITS, safeGuideUrl, utf8Bytes, validGuideId } from "./limits";
import { parseGuideJson } from "./strict-json";

export interface GuideBuildAdapter<B> {
  readonly validate: (input: unknown) => B;
  readonly id: (snapshot: B) => string;
  readonly expandTemplate: (code: string, id: string, mode: "pve" | "pvp") => B;
}
export interface GuideDiagnostic {
  readonly message: string;
  readonly line: number;
  readonly column: number;
}
export type GuideParseResult<B> =
  | {
      readonly ok: true;
      readonly document: GuideDocument<B>;
      readonly diagnostics: readonly GuideDiagnostic[];
    }
  | { readonly ok: false; readonly diagnostics: readonly GuideDiagnostic[]; readonly raw: string };
const parser = unified().use(remarkParse).use(remarkDirective);
const writer = unified()
  .use(remarkStringify, {
    bullet: "-",
    emphasis: "*",
    strong: "*",
    fences: true,
    handlers: { guideRaw: (node) => (node as GuideRawNode).value }
  })
  .use(remarkDirective);
interface ParsedNode {
  type: string;
  value?: string;
  name?: string;
  attributes?: Record<string, string>;
  children?: ParsedNode[];
  depth?: number;
  ordered?: boolean;
  start?: number | null;
  url?: string;
  title?: string | null;
  lang?: string | null;
  position?: { start: { offset?: number; line: number; column: number }; end: { offset?: number } };
}
function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Expected an object.");
  return input as Record<string, unknown>;
}
function keys(input: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(input).some((key) => !allowed.includes(key)))
    throw new Error("Unsupported annotation field.");
}
function string(input: unknown, max = 2048): string {
  if (typeof input !== "string" || input.length > max)
    throw new Error("Invalid annotation string.");
  return input;
}
function identity(input: unknown): string {
  if (!validGuideId(input)) throw new Error("Invalid portable identity.");
  return input;
}
// Read only an already parsed directive span. Never rewrite arbitrary Markdown.
// remark-directive normalizes duplicate attributes, so validate the original bytes first.
function skillAttributes(source: string): Record<string, string> {
  const prefix = /^:bw-skill(?:\[\])?\{/.exec(source);
  if (!prefix || !source.endsWith("}")) throw new Error("Invalid skill directive delimiter.");
  const body = source.slice(prefix[0].length, -1);
  const result: Record<string, string> = {};
  let offset = 0;
  while (offset < body.length) {
    const token = /^\s*([a-zA-Z]+)="([^"\r\n]*)"/.exec(body.slice(offset));
    if (!token) throw new Error("Skill fields require double-quoted values.");
    const key = token[1]!;
    if (Object.hasOwn(result, key)) throw new Error("Duplicate skill annotation field.");
    // The directive parser decodes entities; reject ambiguous escape syntax here.
    if (token[2]!.includes("\\")) throw new Error("Use character entities in skill fields.");
    result[key] = token[2]!;
    offset += token[0].length;
    if (/^\s*$/.test(body.slice(offset))) break;
    if (!/\s/.test(body[offset] ?? "")) throw new Error("Skill fields require a separator.");
  }
  return result;
}
export function validateGuideMetadata(input: unknown): GuideMetadata {
  const meta = record(input);
  keys(meta, ["version", "id", "title", "summary", "tags", "sources"]);
  if (meta.version !== 1)
    throw new Error("Unsupported guide version; keep the source for recovery.");
  if (utf8Bytes(JSON.stringify(meta)) > GUIDE_LIMITS.metadataBytes)
    throw new Error("Guide metadata exceeds the byte limit.");
  if (
    !Array.isArray(meta.tags) ||
    meta.tags.length > 24 ||
    !Array.isArray(meta.sources) ||
    meta.sources.length > GUIDE_LIMITS.sources
  )
    throw new Error("Invalid guide tags or sources.");
  return {
    version: 1,
    id: identity(meta.id),
    title: string(meta.title, 160),
    summary: meta.summary === null ? null : string(meta.summary),
    tags: meta.tags.map((tag) => string(tag, 80)),
    sources: meta.sources.map((value) => {
      const source = record(value);
      keys(source, ["label", "url", "attribution", "license", "licenseUrl", "revision", "notes"]);
      const url = string(source.url);
      if (!safeGuideUrl(url)) throw new Error("Unsafe source URL.");
      const result: Record<string, string> = { label: string(source.label), url };
      for (const key of ["attribution", "license", "licenseUrl", "revision", "notes"]) {
        if (source[key] !== undefined) result[key] = string(source[key]);
      }
      if (result.licenseUrl && !safeGuideUrl(result.licenseUrl))
        throw new Error("Unsafe license URL.");
      return { ...result, label: result.label!, url };
    })
  };
}
export function emptyGuide<B>(id: string): GuideDocument<B> {
  return {
    metadata: { version: 1, id, title: "Untitled Guide", summary: null, tags: [], sources: [] },
    nodes: [{ type: "paragraph", children: [] }]
  };
}
export function parseGuideMarkdown<B>(
  raw: string,
  adapter: GuideBuildAdapter<B>,
  newId: () => string,
  verifyReinsertion = true
): GuideParseResult<B> {
  let location = { line: 1, column: 1 };
  try {
    if (utf8Bytes(raw) > GUIDE_LIMITS.rawBytes)
      throw new Error("Source exceeds the raw byte limit; the existing document is unchanged.");
    const tree = parser.parse(raw) as ParsedNode;
    let count = 0;
    let builds = 0;
    let mentions = 0;
    let hasMetadata = false;
    const ids = new Set<string>();
    let metadata = emptyGuide<B>(newId()).metadata;
    const slice = (node: ParsedNode) =>
      raw.slice(node.position?.start.offset, node.position?.end.offset);
    const opaqueSlice = (node: ParsedNode) => {
      const start = node.position?.start.offset ?? 0;
      let end = node.position?.end.offset ?? raw.length;
      if (raw[end - 1] !== "\n") end += /^[ \t]*(?:\r?\n|$)/.exec(raw.slice(end))?.[0].length ?? 0;
      return raw.slice(start, end);
    };
    const directiveJson = (node: ParsedNode) => {
      const source = slice(node);
      const first = source.indexOf("\n");
      const last = source.lastIndexOf("\n");
      if (
        first < 0 ||
        last <= first ||
        !new RegExp(`^:::${node.name}[ \\t]*\\r?$`).test(source.slice(0, first)) ||
        !/^:::[ \t]*\r?$/.test(source.slice(last + 1))
      )
        throw new Error("A block directive requires its own closing ::: line.");
      return record(parseGuideJson(source.slice(first + 1, last)));
    };
    const convert = (node: ParsedNode, depth: number): GuideNode<B> => {
      location = node.position?.start ?? location;
      if (++count > GUIDE_LIMITS.nodes || depth > GUIDE_LIMITS.depth)
        throw new Error("Document node/depth limit exceeded.");
      if (
        node.name?.startsWith("bw-") &&
        node.type !== "textDirective" &&
        node.type !== "containerDirective"
      )
        throw new Error("Reserved annotations require a supported directive form.");
      const children = () => {
        const result: GuideNode<B>[] = [];
        for (const child of node.children ?? []) {
          const next = convert(child, depth + 1);
          const prior = result.at(-1);
          if (next.type === "text" && prior?.type === "text")
            result[result.length - 1] = { type: "text", value: prior.value + next.value };
          else result.push(next);
        }
        return result;
      };
      switch (node.type) {
        case "text":
        case "inlineCode":
          return { type: node.type, value: node.value ?? "" };
        case "paragraph":
        case "emphasis":
        case "strong":
        case "blockquote":
        case "listItem":
          return { type: node.type, children: children() };
        case "heading":
          return { type: "heading", depth: node.depth ?? 1, children: children() };
        case "list":
          return {
            type: "list",
            ordered: node.ordered ?? false,
            start: node.start ?? 1,
            children: children()
          };
        case "code":
          return { type: "code", lang: node.lang ?? null, value: node.value ?? "" };
        case "break":
        case "thematicBreak":
          return { type: node.type };
        case "link":
          if (!safeGuideUrl(node.url ?? ""))
            throw new Error("Unsafe link; edit the retained source to repair it.");
          return { type: "link", url: node.url!, title: node.title ?? null, children: children() };
        case "textDirective": {
          if (node.name !== "bw-skill") {
            if (
              node.name?.startsWith("bw-") ||
              node.children?.length ||
              Object.keys(node.attributes ?? {}).length
            )
              throw new Error("Unsupported inline directive; source retained intact.");
            return { type: "text", value: slice(node) };
          }
          if (++mentions > GUIDE_LIMITS.mentions) throw new Error("Mention limit exceeded.");
          skillAttributes(slice(node));
          const attrs = node.attributes ?? {};
          keys(attrs, ["skill", "context", "build", "guide", "reason"]);
          if (
            !/^catalog:skill:[A-Za-z0-9._:-]{1,160}$/.test(attrs.skill ?? "") ||
            node.children?.length
          )
            throw new Error("Invalid skill annotation.");
          let context: GuideSkillContext;
          if (attrs.context === "generic" && Object.keys(attrs).length === 2)
            context = { kind: "generic" };
          else if (attrs.build && !attrs.context && Object.keys(attrs).length === 2)
            context = { kind: "local", buildId: identity(attrs.build) };
          else if (attrs.context === "detached" && Object.keys(attrs).length === 5)
            context = {
              kind: "detached",
              buildId: identity(attrs.build),
              guideId: identity(attrs.guide),
              reason: string(attrs.reason)
            };
          else throw new Error("Conflicting or incomplete skill context.");
          return { type: "skill", skillId: attrs.skill!, context };
        }
        case "containerDirective": {
          if (depth !== 1)
            throw new Error("Block annotations must be top-level; source retained intact.");
          if (node.name === "bw-guide")
            throw new Error("Guide metadata must appear once at the start.");
          if (node.name === "bw-build") {
            if (++builds > GUIDE_LIMITS.builds) throw new Error("Build limit exceeded.");
            const data = directiveJson(node);
            keys(data, ["version", "id", "snapshotVersion", "snapshot", "template", "mode"]);
            if (data.version !== 1) throw new Error("Unsupported build directive version.");
            const id = identity(data.id);
            if (ids.has(id)) throw new Error("Duplicate guide build identity.");
            ids.add(id);
            let snapshot: B;
            if ("template" in data) {
              if ("snapshot" in data || "snapshotVersion" in data)
                throw new Error("Template and snapshot representations conflict.");
              if (data.mode !== undefined && data.mode !== "pve" && data.mode !== "pvp")
                throw new Error("Invalid template mode.");
              snapshot = adapter.expandTemplate(string(data.template), id, data.mode ?? "pve");
            } else {
              if (data.snapshotVersion !== 1 || "mode" in data)
                throw new Error("Unsupported snapshot version or redundant mode.");
              snapshot = adapter.validate(data.snapshot);
            }
            if (adapter.id(snapshot) !== id)
              throw new Error("Embed and nested build identity must match.");
            return { type: "build", id, snapshot };
          }
          if (node.name?.startsWith("bw-"))
            throw new Error("Unsupported reserved annotation; keep whole source for recovery.");
          return { type: "opaque", raw: opaqueSlice(node) };
        }
        default:
          if (depth !== 1)
            throw new Error(`Unsupported nested ${node.type}; whole source retained intact.`);
          return { type: "opaque", raw: opaqueSlice(node) };
      }
    };
    const nodes: GuideNode<B>[] = [];
    for (const [index, node] of (tree.children ?? []).entries()) {
      if (node.type === "containerDirective" && node.name === "bw-guide") {
        if (index !== 0 || hasMetadata)
          throw new Error("Guide metadata must appear once at the start.");
        hasMetadata = true;
        metadata = validateGuideMetadata(directiveJson(node));
      } else nodes.push(convert(node, 1));
    }
    const document = { metadata, nodes };
    const canonical = serializeGuideMarkdown(document);
    if (utf8Bytes(canonical) > GUIDE_LIMITS.appliedBytes)
      throw new Error("Canonical document exceeds applied byte limit.");
    if (verifyReinsertion) {
      const checked = parseGuideMarkdown(canonical, adapter, newId, false);
      if (!checked.ok || JSON.stringify(checked.document) !== JSON.stringify(document))
        throw new Error(
          "Source context cannot be safely reinserted; keep the whole source for recovery."
        );
    }
    return { ok: true, document, diagnostics: [] };
  } catch (error) {
    return {
      ok: false,
      raw,
      diagnostics: [
        {
          message: error instanceof Error ? error.message : "Invalid guide.",
          line: location.line,
          column: location.column
        }
      ]
    };
  }
}
export function serializeGuideMarkdown<B>(document: GuideDocument<B>): string {
  const cached = sourceCache.get(document);
  if (cached !== undefined) return cached;
  const convert = (node: GuideNode<B>): unknown => {
    if (node.type === "build")
      return {
        type: "guideRaw",
        value: `:::bw-build\n${JSON.stringify({ version: 1, id: node.id, snapshotVersion: 1, snapshot: node.snapshot })}\n:::`
      };
    if (node.type === "opaque") return { type: "guideRaw", value: node.raw };
    if (node.type === "skill") {
      const context = node.context;
      const attrs =
        context.kind === "generic"
          ? { skill: node.skillId, context: "generic" }
          : context.kind === "local"
            ? { skill: node.skillId, build: context.buildId }
            : {
                skill: node.skillId,
                context: "detached",
                build: context.buildId,
                guide: context.guideId,
                reason: context.reason
              };
      const quote = (value: string) =>
        value
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/\\/g, "&#x5C;")
          .replace(/\r/g, "&#13;")
          .replace(/\n/g, "&#10;");
      return {
        type: "guideRaw",
        value: `:bw-skill{${Object.entries(attrs)
          .map(([key, value]) => `${key}="${quote(value)}"`)
          .join(" ")}}`
      };
    }
    return "children" in node ? { ...node, children: node.children.map(convert) } : { ...node };
  };
  const root = {
    type: "root",
    children: document.nodes.map(convert) as RootContent[]
  } satisfies Root;
  const source = `:::bw-guide\n${JSON.stringify(document.metadata)}\n:::\n\n${writer.stringify(root)}`;
  sourceCache.set(document, source);
  return source;
}
const sourceCache = new WeakMap<object, string>();
