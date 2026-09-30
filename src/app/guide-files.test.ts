import { describe, expect, it } from "vitest";
import { requireReadyCatalogs } from "./catalogs";
import { createGuideFixture } from "./guide-fixture";
import { createRuntimeGuide, guideAddress, reduceGuide } from "./guide-state";
import { captureGuideDocument, readGuideMarkdownFile, validateGuideIntake } from "./guide-files";
import { GUIDE_LIMITS } from "../guide/limits";
import { serializeGuideMarkdown } from "../guide/markdown";
const catalogs = requireReadyCatalogs();
describe("guarded whole-guide Markdown transfer", () => {
  it("rejects stale file completion after edit, Undo, import or document switch", async () => {
    for (const change of ["edit", "undo", "import", "switch"] as const) {
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
      if (change === "import") {
        state = reduceGuide(state, {
          ...guideAddress(state),
          type: "import-markdown",
          raw: "# Changed while reading"
        });
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
  it("imports once, restores the previous guide on Undo, and leaves failures untouched", () => {
    let state = createRuntimeGuide(createGuideFixture(), "file");
    const before = state.history.frame;
    const rejected = reduceGuide(
      state,
      { ...guideAddress(state), type: "import-markdown", raw: ':::bw-guide\n{"version":99}\n:::' },
      catalogs
    );
    expect(rejected.history).toBe(state.history);
    state = reduceGuide(
      state,
      {
        ...guideAddress(state),
        type: "import-markdown",
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
  });
});
