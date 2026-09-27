import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authoredDocumentId } from "../domain";
import { guideBuilds } from "../domain/guide";
import { App } from "./App";
import { requireReadyCatalogs } from "./catalogs";
import { GuideReader } from "./components/guide/GuideReader";
import { createGuideFixture } from "./guide-fixture";
import { guideNavigation, matchingGuideAnchor } from "./guide-navigation";
import { createRuntimeGuide, guideAddress, reduceGuide, type GuideCommand } from "./guide-state";
import { validLocalLibraryEnvelopeFixture, fixtureCatalogFacts } from "./library-fixtures";
import { LOCAL_LIBRARY_STORAGE_KEY, serializeLocalLibraryEnvelope } from "./persistence-schema";
import { parseShareFragment } from "./share-url";
import { copyGuideTemplate } from "./guide-template";
const catalogs = requireReadyCatalogs();
function fixture() {
  const document = createGuideFixture();
  const build = guideBuilds(document)[0]!;
  return {
    ...document,
    nodes: [
      ...document.nodes,
      document.nodes[0]!,
      {
        ...build,
        id: "second",
        snapshot: {
          ...build.snapshot,
          build: {
            ...build.snapshot.build,
            id: authoredDocumentId("second"),
            name: "Second variant",
            attributes: []
          }
        }
      },
      {
        type: "paragraph" as const,
        children: [
          {
            type: "skill" as const,
            skillId: "catalog:skill:194",
            context: { kind: "local" as const, buildId: "gone" }
          },
          {
            type: "skill" as const,
            skillId: "catalog:skill:194",
            context: { kind: "generic" as const }
          }
        ]
      }
    ]
  };
}
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  history.replaceState(null, "", "/");
});
describe("applied guide reading and navigation", () => {
  it("uses unique namespaced anchors, shares projections and exposes no editing or remote-media elements", () => {
    const document = fixture();
    const copy = vi.fn();
    const { container } = render(
      <GuideReader document={document} catalogs={catalogs} onCopy={copy} />
    );
    const ids = guideNavigation(document).map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(container.querySelector(`[id="${id}"]`)).not.toBeNull();
    expect(
      matchingGuideAnchor(
        { ...document, metadata: { ...document.metadata, id: "other" } },
        `#${ids[0]}`
      )
    ).toBeNull();
    expect(parseShareFragment(`#${ids[0]}`)).toEqual({ ok: true, value: null });
    expect(parseShareFragment("#bw-guide:other:section:bw=1&code=fake")).toEqual({
      ok: true,
      value: null
    });
    expect(
      container.querySelector('[contenteditable], input, textarea, select, [draggable="true"]')
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /Edit |Duplicate |Delete / })).toBeNull();
    fireEvent.focus(screen.getByRole("button", { name: "Flare — Flare practice" }));
    expect(screen.getByRole("tooltip").textContent).toContain("Context: Flare practice");
    expect(screen.getByRole("button", { name: /Flare — Missing build/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Flare — Generic" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy Second variant template" }));
    expect(copy).toHaveBeenCalledWith("second");
  });
  it("blocks authored commands in read mode, retains exact raw and copies each addressed template without history", async () => {
    let state = createRuntimeGuide(fixture(), "reader");
    state = reduceGuide(state, { ...guideAddress(state), type: "source-open" });
    state = reduceGuide(state, {
      ...guideAddress(state),
      type: "source-edit",
      raw: ":::bw-guide\n{unfinished  \n"
    });
    state = reduceGuide(state, { type: "view", view: "read" });
    const before = state.history;
    const commands = [
      { type: "source-edit", raw: "lost" },
      { type: "source-discard" },
      { type: "source-apply" },
      { type: "import-source", raw: "# Lost" },
      { type: "history", direction: "undo" },
      { type: "metadata", metadata: { ...state.history.frame.document.metadata, title: "lost" } }
    ] as const;
    for (const command of commands) {
      state = reduceGuide(state, { ...guideAddress(state), ...command } as GuideCommand, catalogs);
      expect(state.history).toBe(before);
    }
    const write = vi.fn().mockResolvedValue(undefined);
    await copyGuideTemplate(
      () => state,
      "gb-flare",
      catalogs,
      () => true,
      write
    );
    await copyGuideTemplate(
      () => state,
      "second",
      catalogs,
      () => true,
      write
    );
    expect(write).toHaveBeenCalledTimes(2);
    expect(write.mock.calls[0]![0]).not.toBe(write.mock.calls[1]![0]);
    expect(state.history).toBe(before);
    state = reduceGuide(state, { ...guideAddress(state), type: "source-open" });
    expect(state.history.frame.recovery?.raw).toBe(":::bw-guide\n{unfinished  \n");
  });
  it("restores only a matching guide anchor, retains unfinished source and never writes on read navigation", async () => {
    const document = fixture();
    const envelope = validLocalLibraryEnvelopeFixture({
      savedDocuments: [],
      workingDraft: {
        document: {
          kind: "guide",
          snapshot: {
            schemaVersion: 1,
            document,
            recovery: { raw: ":::bw-guide\n{unfinished", baseRevision: 0, dirty: true },
            appliedRevision: 0
          }
        },
        associatedRecordId: null,
        savedWith: fixtureCatalogFacts
      }
    });
    const stored = serializeLocalLibraryEnvelope(envelope);
    localStorage.setItem(LOCAL_LIBRARY_STORAGE_KEY, stored);
    const hash = `#${guideNavigation(document).at(-1)!.id}`;
    history.replaceState(null, "", hash);
    const write = vi.spyOn(Storage.prototype, "setItem");
    render(<App />);
    await screen.findByRole("article", { name: "Guide reading pane" });
    expect(window.location.hash).toBe(hash);
    expect(screen.getByText(/Reading the last applied guide\. Unapplied source/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Undo guide" })).toBeNull();
    expect(screen.queryByRole("complementary", { name: "Guide catalog" })).toBeNull();
    fireEvent.keyDown(screen.getByRole("region", { name: "Guide workspace" }), {
      key: "z",
      metaKey: true
    });
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(write.mock.calls.filter((call) => call[0] === LOCAL_LIBRARY_STORAGE_KEY)).toHaveLength(
      0
    );
    expect(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY)).toBe(stored);
    fireEvent.click(screen.getByRole("button", { name: "Write" }));
    expect(await screen.findByRole("textbox", { name: "Markdown source" })).toHaveValue(
      ":::bw-guide\n{unfinished"
    );
    expect(screen.getByRole("textbox", { name: "Markdown source" })).toHaveFocus();
    const textarea = screen.getByRole("textbox", {
      name: "Markdown source"
    }) as HTMLTextAreaElement;
    textarea.setSelectionRange(7, 12);
    fireEvent.select(textarea);
    fireEvent.click(screen.getByRole("button", { name: "Read" }));
    fireEvent.click(screen.getByRole("button", { name: "Source" }));
    const restored = screen.getByRole("textbox", {
      name: "Markdown source"
    }) as HTMLTextAreaElement;
    expect([restored.selectionStart, restored.selectionEnd]).toEqual([7, 12]);
    expect(restored).toHaveFocus();
  });
});
