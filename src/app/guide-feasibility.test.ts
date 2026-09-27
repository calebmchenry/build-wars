import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { parseGuideMarkdown, serializeGuideMarkdown } from "../guide/markdown";
import { parseGuideJson } from "../guide/strict-json";
import { GUIDE_LIMITS, utf8Bytes } from "../guide/limits";
import { guideBuildAdapter } from "./guide-build-adapter";
import { createGuideFixture } from "./guide-fixture";
import { commitGuide, createGuideHistory, stepGuideHistory } from "./guide-history";
import { requireReadyCatalogs } from "./catalogs";
const adapter = guideBuildAdapter(requireReadyCatalogs());
const parse = (source: string) => parseGuideMarkdown(source, adapter, () => "guide-new");
describe("guide feasibility contracts", () => {
  it("round trips the complete snapshot and bound context", () => {
    const document = createGuideFixture();
    const parsed = parse(serializeGuideMarkdown(document));
    expect(parsed).toEqual({ ok: true, document, diagnostics: [] });
  });
  it("retains literal code and exact opaque CRLF slices after neighboring edits", () => {
    const opaque = ":::future\r\nunknown:  abc\r\n::: \r\n";
    const parsed = parse(
      "Before\n\n" + opaque + "\n\nAfter\n\n```md\n:::bw-build\n{}\n:::\n```\n\n\\:bw-skill[]"
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const document = {
      ...parsed.document,
      nodes: [
        { type: "paragraph" as const, children: [{ type: "text" as const, value: "Edited" }] },
        ...parsed.document.nodes.slice(1)
      ]
    };
    const output = serializeGuideMarkdown(document);
    expect(output).toContain(opaque);
    const roundtrip = parse(output);
    expect(roundtrip.ok && roundtrip.document).toEqual(document);
  });
  it("rejects duplicate JSON keys, nested hazards and conflicting payloads without partial data", () => {
    for (const raw of ['{"a":1,"a":2}', '{"a":{"__proto__":{}}}', '{"a":1e999}'])
      expect(() => parseGuideJson(raw)).toThrow();
    expect(
      parse(
        ':::bw-build\n{"version":1,"id":"gb-a","snapshotVersion":1,"snapshot":{},"template":"x"}\n:::'
      ).ok
    ).toBe(false);
    expect(parse("[unsafe](javascript:alert)\n").ok).toBe(false);
  });
  it("has one chronological undo for prose and build changes, rejects stale and no-op commits", () => {
    const initial = createGuideHistory(createGuideFixture(), "session");
    const text = {
      ...initial.frame.document,
      nodes: [
        ...initial.frame.document.nodes,
        { type: "paragraph" as const, children: [{ type: "text" as const, value: "Added" }] }
      ]
    };
    const first = commitGuide(initial, { document: text, recovery: null }, initial);
    const changed = {
      ...text,
      nodes: text.nodes.map((node) =>
        node.type === "build"
          ? {
              ...node,
              snapshot: {
                ...node.snapshot,
                build: { ...node.snapshot.build, mode: "pvp" as const }
              }
            }
          : node
      )
    };
    const second = commitGuide(first, { document: changed, recovery: null }, first);
    const undo = stepGuideHistory(second, "undo");
    expect(undo.frame.document).toEqual(text);
    expect(stepGuideHistory(undo, "undo").frame).toEqual(initial.frame);
    expect(stepGuideHistory(undo, "redo").frame.document).toEqual(changed);
    expect(commitGuide(second, initial.frame, initial)).toBe(second);
    expect(commitGuide(second, second.frame, second)).toBe(second);
    expect(commitGuide(undo, initial.frame, undo).future).toEqual([]);
  });
  it("measures representative parse/serialization and retains bounded whole history entries", () => {
    const fixture = createGuideFixture(true);
    const start = performance.now();
    const source = serializeGuideMarkdown(fixture);
    const serializedMs = performance.now() - start;
    const parseStart = performance.now();
    const parsed = parse(source);
    const parsedMs = performance.now() - parseStart;
    expect(parsed.ok && parsed.document).toEqual(fixture);
    expect(utf8Bytes(source)).toBeLessThan(GUIDE_LIMITS.appliedBytes);
    let history = createGuideHistory(fixture, "capacity");
    const historyStart = performance.now();
    for (let i = 0; i < 110; i++)
      history = commitGuide(
        history,
        {
          document: { ...fixture, metadata: { ...fixture.metadata, title: `Title ${i}` } },
          recovery: null
        },
        history
      );
    expect(history.past.length).toBeLessThanOrEqual(GUIDE_LIMITS.historyEntries);
    writeFileSync(
      "work/runs/SPRINT-021/partial-capacity.json",
      JSON.stringify({
        fixtureBytes: utf8Bytes(source),
        storageCodeUnits: source.length,
        serializedMs,
        parsedMs,
        historyMs: performance.now() - historyStart,
        retainedEntries: history.past.length
      })
    );
  });
});
