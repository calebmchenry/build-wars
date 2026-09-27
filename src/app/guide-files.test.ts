import { describe, expect, it } from "vitest";
import { requireReadyCatalogs } from "./catalogs";
import { createGuideFixture } from "./guide-fixture";
import { createRuntimeGuide, guideAddress, reduceGuide } from "./guide-state";
import { captureGuideDocument, readGuideMarkdownFile, validateGuideIntake } from "./guide-files";
import { GUIDE_LIMITS } from "../guide/limits";
import { serializeGuideMarkdown } from "../guide/markdown";
const catalogs = requireReadyCatalogs();
describe("guarded whole-guide Markdown transfer", () => {
  it("recognizes a source buffer restored by native text Undo without adding semantic history", () => {
    let state = createRuntimeGuide(createGuideFixture(), "buffer");
    state = reduceGuide(state, { ...guideAddress(state), type: "source-open" });
    const original = state.history.frame.recovery!.raw;
    state = reduceGuide(state, {
      ...guideAddress(state),
      type: "source-edit",
      raw: original + "x"
    });
    expect(state.history.frame.recovery?.dirty).toBe(true);
    state = reduceGuide(state, { ...guideAddress(state), type: "source-edit", raw: original });
    expect(state.history.frame.recovery?.dirty).toBe(false);
    expect(state.history.past).toHaveLength(0);
  });
  it("rejects stale file completion after edit, Undo, Apply or document switch", async () => {
    for (const change of ["edit", "undo", "apply", "switch"] as const) {
      let state = createRuntimeGuide(createGuideFixture(), "file");
      state = reduceGuide(state, {
        ...guideAddress(state),
        type: "metadata",
        metadata: { ...state.history.frame.document.metadata, title: "Before read" }
      });
      const capture = captureGuideDocument(state);
      let finish!: (value: ArrayBuffer) => void;
      const bytes = new TextEncoder().encode(serializeGuideMarkdown(createGuideFixture()));
      const result = readGuideMarkdownFile(
        {
          size: bytes.byteLength,
          arrayBuffer: () =>
            new Promise((resolve) => {
              finish = resolve;
            })
        },
        () => state,
        capture,
        catalogs
      );
      const rejected = expect(result).rejects.toThrow("guide changed");
      if (change === "switch") state = createRuntimeGuide(createGuideFixture(), "other-session");
      if (change === "undo")
        state = reduceGuide(state, { ...guideAddress(state), type: "history", direction: "undo" });
      if (change === "edit")
        state = reduceGuide(state, {
          ...guideAddress(state),
          type: "metadata",
          metadata: { ...state.history.frame.document.metadata, title: "During read" }
        });
      if (change === "apply") {
        state = reduceGuide(state, {
          ...guideAddress(state),
          type: "source-edit",
          raw: "# Changed while reading"
        });
        state = reduceGuide(state, { ...guideAddress(state), type: "source-apply" }, catalogs);
      }
      finish(bytes.buffer);
      await rejected;
    }
  });
  it("bounds file bytes before reading, rejects invalid UTF-8, and allows catalog-independent snapshots", async () => {
    const state = createRuntimeGuide(createGuideFixture(), "file");
    const capture = captureGuideDocument(state);
    await expect(
      readGuideMarkdownFile(
        {
          size: GUIDE_LIMITS.rawBytes + 1,
          arrayBuffer: () => {
            throw Error("must not read");
          }
        },
        () => state,
        capture,
        null
      )
    ).rejects.toThrow("2 MiB");
    await expect(
      readGuideMarkdownFile(
        { size: 1, arrayBuffer: async () => Uint8Array.of(255).buffer },
        () => state,
        capture,
        null
      )
    ).rejects.toThrow();
    const raw = serializeGuideMarkdown(state.history.frame.document);
    const bytes = new TextEncoder().encode(raw);
    expect(
      await readGuideMarkdownFile(
        { size: bytes.length, arrayBuffer: async () => bytes.buffer },
        () => state,
        capture,
        null
      )
    ).toBe(raw);
    expect(validateGuideIntake(raw, null, "new")).toEqual(state.history.frame.document);
  });
  it("imports once, restores the previous invalid source exactly on Undo, and leaves failures untouched", () => {
    let state = createRuntimeGuide(createGuideFixture(), "file");
    state = reduceGuide(state, {
      ...guideAddress(state),
      type: "source-edit",
      raw: ":::bw-guide\r\n{invalid  \r\n"
    });
    const before = state.history.frame;
    const rejected = reduceGuide(
      state,
      { ...guideAddress(state), type: "import-source", raw: ':::bw-guide\n{"version":99}\n:::' },
      catalogs
    );
    expect(rejected.history).toBe(state.history);
    state = reduceGuide(
      state,
      {
        ...guideAddress(state),
        type: "import-source",
        raw: "# Imported\n\nLiteral `:bw-skill[]{skill=bad}`."
      },
      catalogs
    );
    expect(state.history.past).toHaveLength(1);
    expect(state.history.frame.recovery).toBeNull();
    state = reduceGuide(
      state,
      { ...guideAddress(state), type: "history", direction: "undo" },
      catalogs
    );
    expect(state.history.frame).toEqual(before);
    expect(state.view).toBe("source");
  });
});
