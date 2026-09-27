import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { authoredDocumentId, catalogId } from "../domain";
import type { GuideNode } from "../domain/guide";
import { parseGuideMarkdown, serializeGuideMarkdown } from "../guide/markdown";
import { validateGuideDocument } from "../guide/validation";
import { GUIDE_LIMITS } from "../guide/limits";
import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import { guideBuildAdapter, cloneGuideBuild } from "./guide-build-adapter";
import { createGuideFixture } from "./guide-fixture";
import { adjustmentProfileFixture } from "./attribute-adjustment-fixtures";
import { requireReadyCatalogs } from "./catalogs";
import { createBlankEditorState } from "./editor-state";
import { createPersistedBuildSnapshot, type PersistedBuildSnapshot } from "./persistence-schema";
const adapter = guideBuildAdapter(requireReadyCatalogs());
const parse = (raw: string) => parseGuideMarkdown(raw, adapter, () => "guide-new");
describe("portable guide model and full snapshot codec", () => {
  it("escapes every portable detached reason without changing its meaning", () => {
    const fixture = createGuideFixture();
    const document = {
      ...fixture,
      nodes: [
        {
          type: "paragraph" as const,
          children: [
            {
              type: "skill" as const,
              skillId: "catalog:skill:194",
              context: {
                kind: "detached" as const,
                guideId: "other",
                buildId: "gb-a",
                reason: 'A "quote", & entity and \\ slash\nnew line'
              }
            }
          ]
        }
      ]
    };
    expect(parse(serializeGuideMarkdown(document))).toEqual({
      ok: true,
      document,
      diagnostics: []
    });
  });
  it("round trips the original ordinary Markdown golden fixture", () => {
    const input = readFileSync("test/fixtures/guides/ordinary.md", "utf8");
    const parsed = parse(input);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parse(serializeGuideMarkdown(parsed.document))).toEqual(parsed);
  });
  it("preserves complete distinct variants, rich metadata, unknown facts and detached contexts without catalogs", () => {
    const fixture = createGuideFixture();
    const snapshot = adapter.expandTemplate(
      `[Practice;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]`,
      "gb-one",
      "pvp"
    );
    const first = createPersistedBuildSnapshot({
      ...createBlankEditorState(),
      ...snapshot,
      build: {
        ...snapshot.build,
        titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }],
        attributeAdjustments: adjustmentProfileFixture()
      },
      pveBudget: { level: 17, questBonus: "none" }
    });
    const second = {
      ...cloneGuideBuild(first, "gb-two"),
      build: {
        ...first.build,
        id: authoredDocumentId("gb-two"),
        name: "Second",
        mode: "pve" as const,
        attributeAdjustments: {
          headgearAttributeId: catalogId<"Attribute">(999),
          runes: [{ attributeId: catalogId<"Attribute">(999), runeId: catalogId<"Rune">(999) }],
          effectPreferences: []
        }
      }
    };
    const document = {
      ...fixture,
      metadata: {
        ...fixture.metadata,
        title: "Two independent variants",
        summary: "Original tests",
        tags: ["timing", "practice"],
        sources: [
          {
            label: "Skill reference",
            url: "https://wiki.guildwars.com/wiki/Skill",
            attribution: "Linked reference",
            license: "No copied prose",
            licenseUrl: "https://example.com/terms",
            revision: "2026-09-27",
            notes: "Original authored content"
          }
        ]
      },
      nodes: [
        { type: "build" as const, id: "gb-one", snapshot: first },
        { type: "build" as const, id: "gb-two", snapshot: second },
        {
          type: "paragraph" as const,
          children: [
            {
              type: "skill" as const,
              skillId: "catalog:skill:999999",
              context: {
                kind: "detached" as const,
                guideId: "external",
                buildId: "gb-one",
                reason: "Different document"
              }
            }
          ]
        }
      ]
    };
    const source = serializeGuideMarkdown(document);
    const result = parseGuideMarkdown(source, guideBuildAdapter(null), () => "other");
    expect(result).toEqual({ ok: true, document, diagnostics: [] });
    expect(validateGuideDocument(document, adapter)).toEqual(document);
    expect(first.rawTemplate.source).not.toBeNull();
    expect(source).not.toContain('"template":');
  });
  it("expands input shorthand once in its own mode and exports only full snapshots", () => {
    for (const mode of ["pvp", "pve"] as const) {
      const parsed = parse(
        `:::bw-build\n${JSON.stringify({ version: 1, id: "gb-template", template: SKILL_TEMPLATE_PACKAGE_EXAMPLE, mode })}\n:::`
      );
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) continue;
      const build = parsed.document.nodes[0];
      expect(build).toMatchObject({
        type: "build",
        id: "gb-template",
        snapshot: { build: { mode, id: "gb-template" } }
      });
      const output = serializeGuideMarkdown(parsed.document);
      expect(output).toContain('"snapshotVersion":1');
      expect(output).not.toContain('"template":');
      expect(parse(output)).toEqual(parsed);
    }
    expect(
      parseGuideMarkdown(
        `:::bw-build\n${JSON.stringify({ version: 1, id: "gb-template", template: SKILL_TEMPLATE_PACKAGE_EXAMPLE })}\n:::`,
        guideBuildAdapter(null),
        () => "x"
      ).ok
    ).toBe(false);
  });
  it("rejects unknown or future snapshot fields without silently stripping them", () => {
    const snapshot = createPersistedBuildSnapshot(createBlankEditorState());
    expect(() => adapter.validate({ ...snapshot, extra: true })).toThrow();
    expect(() =>
      adapter.validate({ ...snapshot, build: { ...snapshot.build, schemaVersion: 5 } })
    ).toThrow();
    expect(() =>
      adapter.validate({ ...snapshot, rawTemplate: { ...snapshot.rawTemplate, extra: true } })
    ).toThrow();
    expect(() =>
      validateGuideDocument({ ...createGuideFixture(), extra: true }, adapter)
    ).toThrow();
  });
  it("enforces exact build and mention bounds on all semantic intake", () => {
    const fixture = createGuideFixture();
    const snapshot = createPersistedBuildSnapshot(createBlankEditorState());
    const nodes: GuideNode<PersistedBuildSnapshot>[] = Array.from({ length: 32 }, (_, i) => ({
      type: "build",
      id: `gb-${i}`,
      snapshot: cloneGuideBuild(snapshot, `gb-${i}`)
    }));
    expect(validateGuideDocument({ ...fixture, nodes }, adapter).nodes).toHaveLength(32);
    expect(() =>
      validateGuideDocument(
        {
          ...fixture,
          nodes: [
            ...nodes,
            { type: "build", id: "gb-extra", snapshot: cloneGuideBuild(snapshot, "gb-extra") }
          ]
        },
        adapter
      )
    ).toThrow();
    const mention = {
      type: "skill" as const,
      skillId: "catalog:skill:194",
      context: { kind: "generic" as const }
    };
    const mentions = (length: number) => [
      { type: "paragraph", children: Array.from({ length }, () => mention) }
    ];
    expect(validateGuideDocument({ ...fixture, nodes: mentions(2000) }, adapter)).toBeTruthy();
    expect(() => validateGuideDocument({ ...fixture, nodes: mentions(2001) }, adapter)).toThrow();
  });
  it("bounds deep trees, metadata and malformed inline/block structures", () => {
    const fixture = createGuideFixture();
    let node: unknown = { type: "paragraph", children: [] };
    for (let i = 0; i < 33; i++) node = { type: "blockquote", children: [node] };
    expect(() => validateGuideDocument({ ...fixture, nodes: [node] }, adapter)).toThrow();
    expect(() =>
      validateGuideDocument(
        {
          ...fixture,
          nodes: [{ type: "paragraph", children: [fixture.nodes.find((n) => n.type === "build")] }]
        },
        adapter
      )
    ).toThrow();
    expect(() =>
      validateGuideDocument(
        {
          ...fixture,
          metadata: { ...fixture.metadata, tags: Array.from({ length: 25 }, () => "tag") }
        },
        adapter
      )
    ).toThrow();
    expect(() =>
      validateGuideDocument(
        {
          ...fixture,
          nodes: Array.from({ length: GUIDE_LIMITS.nodes + 1 }, () => ({
            type: "paragraph",
            children: []
          }))
        },
        adapter
      )
    ).toThrow();
  });
});
