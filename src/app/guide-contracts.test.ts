import { describe, it, expect, vi } from "vitest";
import { guideBuildAdapter } from "./guide-build-adapter";
import { createGuideFixture } from "./guide-fixture";
import { commitGuide, createGuideHistory } from "./guide-history";
import { createGuideAutosave } from "./guide-autosave";
import { GUIDE_LIMITS } from "../guide/limits";
import { parseGuideMarkdown, serializeGuideMarkdown } from "../guide/markdown";
import frozenLongSource from "../../test/fixtures/guides/long-v1.md?raw";
const parse = (raw: string) =>
  parseGuideMarkdown(raw, guideBuildAdapter(null), () => "guide-import");

describe("frozen guide grammar and capacity contracts", () => {
  it("keeps the versioned long browser fixture semantically identical to the measured factory", () => {
    const parsed = parse(frozenLongSource);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.document).toEqual(createGuideFixture(true));
    expect(serializeGuideMarkdown(createGuideFixture(true))).toBe(frozenLongSource);
  });
  it.each([
    "# Heading\n\nA **strong** and *emphasized* [link](https://example.com) with `code`.\n\n> Quote\n\n- One\n- Two\n\n3. Three\n4. Four\n\n```js\nconst value = 1;\n```\n",
    ':bw-skill[]{skill="catalog:skill:194" context="generic"}',
    ':bw-skill{skill="catalog:skill:194" build="missing"}',
    ':bw-skill{skill="catalog:skill:unknown" context="detached" guide="guide-other" build="gb-a" reason="External &amp; unresolved"}',
    '\\:bw-skill[]{skill="catalog:skill:194" context="generic"}',
    '`:::bw-guide`\n\n```md\n:::bw-guide\n{"version":99}\n:::\n```',
    "before\n\n:::future\r\nopaque:  exact\r\n:::\n\nafter",
    "<script>alert(1)</script>\n"
  ])("round trips supported meaning or an inert top-level opaque span: %s", (raw) => {
    const result = parse(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(parse(serializeGuideMarkdown(result.document))).toEqual(result);
  });
  it.each([
    ':bw-skill{skill="catalog:skill:194" skill="catalog:skill:195" context="generic"}',
    ':bw-skill[label]{skill="catalog:skill:194" context="generic"}',
    ':bw-skill{skill="194" context="generic"}',
    ':bw-skill{skill="catalog:skill:194" context="generic" build="gb-a"}',
    ':bw-skill{skill="catalog:skill:194" build="bad/id"}',
    ':::bw-future\n{"version":9}\n:::',
    ':::bw-guide\n{"version":9}\n:::',
    ':::bw-guide[x]\n{"version":1}\n:::',
    '> :::bw-build\n> {"version":1}\n> :::',
    "[unsafe](JaVaScRiPt:alert)",
    "[unsafe](data:text/html,x)",
    "![remote](https://example.com/pixel.png)",
    'Text <img src="https://example.com/pixel.png">',
    ':::bw-build\n{"version":1,"id":"gb-a","template":"code","snapshot":{}}\n:::'
  ])("retains the entire rejected source without a partial document: %s", (raw) => {
    const result = parse(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.raw).toBe(raw);
      expect(result.diagnostics[0]?.line).toBeGreaterThan(0);
    }
  });
  it("preserves full snapshots without catalogs and rejects duplicate embed identity", () => {
    const doc = createGuideFixture();
    const source = serializeGuideMarkdown(doc);
    expect(parse(source).ok).toBe(true);
    const build = doc.nodes.find((n) => n.type === "build")!;
    expect(parse(serializeGuideMarkdown({ ...doc, nodes: [...doc.nodes, build] })).ok).toBe(false);
  });
  it("rejects raw intake and canonical expansion before mutation", () => {
    const raw = "x".repeat(GUIDE_LIMITS.rawBytes + 1);
    expect(parse(raw).ok).toBe(false);
    const h = createGuideHistory(createGuideFixture(), "capacity");
    expect(commitGuide(h, { ...h.frame, recovery: { raw, baseRevision: 0, dirty: true } }, h)).toBe(
      h
    );
    const doc = {
      ...h.frame.document,
      nodes: [
        {
          type: "paragraph" as const,
          children: [{ type: "text" as const, value: "x".repeat(GUIDE_LIMITS.appliedBytes) }]
        }
      ]
    };
    expect(commitGuide(h, { document: doc, recovery: null }, h)).toBe(h);
  });
  it("debounces durable revisions, serializes once, and flushes pending work on pagehide", () => {
    vi.useFakeTimers();
    const flush = vi.fn();
    const autosave = createGuideAutosave(flush);
    autosave.schedule(1);
    autosave.schedule(2);
    autosave.schedule(2);
    expect(flush).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(flush.mock.calls).toEqual([[2]]);
    autosave.schedule(2);
    autosave.flush();
    expect(flush).toHaveBeenCalledTimes(1);
    autosave.schedule(3);
    autosave.flush();
    vi.runAllTimers();
    expect(flush.mock.calls).toEqual([[2], [3]]);
    autosave.dispose();
    vi.useRealTimers();
  });
});
