import { useEffect, useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Editor } from "@tiptap/core";
import { guideBuilds } from "../../../domain/guide";
import { createGuideFixture } from "../../guide-fixture";
import {
  createRuntimeGuide,
  guideAddress,
  reduceGuide,
  type RuntimeGuideDocument
} from "../../guide-state";
import {
  GUIDE_CLIPBOARD_MIME,
  guideFragmentMarkdown,
  readGuideFragment,
  writeGuideFragment
} from "../../guide-clipboard";
import { GuideEditor } from "./GuideEditor";
let editor: Editor | null = null;
let latest: RuntimeGuideDocument;
function bind(value: Editor | null) {
  editor = value;
}
function Harness() {
  const [guide, setGuide] = useState(() =>
    createRuntimeGuide(createGuideFixture(), "clipboard-ui")
  );
  useEffect(() => {
    latest = guide;
  }, [guide]);
  return (
    <GuideEditor
      document={guide.history.frame.document}
      onEditor={bind}
      renderSkill={() => null}
      renderBuild={() => null}
      onComposition={() => {}}
      onHistory={(direction) =>
        setGuide((current) =>
          reduceGuide(current, { ...guideAddress(current), type: "history", direction })
        )
      }
      onChange={(document) => {
        const next = reduceGuide(guide, { ...guideAddress(guide), type: "edit", document });
        setGuide(next);
        return next.history !== guide.history;
      }}
      clipboard={{
        read: (raw) => readGuideFragment(raw, guide, () => "pasted-build"),
        write: (nodes) => ({
          json: writeGuideFragment(guide, nodes),
          markdown: guideFragmentMarkdown(nodes)
        }),
        message: () => {}
      }}
    />
  );
}
describe("native clipboard bridge (synthetic integration)", () => {
  it("copies complete semantic fragments and remaps contained builds and bound mentions on paste", async () => {
    render(<Harness />);
    await waitFor(() => expect(editor).not.toBeNull());
    act(() => {
      editor!.commands.selectAll();
    });
    const values = new Map<string, string>();
    const data = {
      get types() {
        return [...values.keys()];
      },
      getData: (key: string) => values.get(key) ?? "",
      setData: (key: string, value: string) => values.set(key, value)
    };
    fireEvent.copy(screen.getByRole("textbox", { name: "Guide document" }), {
      clipboardData: data
    });
    expect(values.get(GUIDE_CLIPBOARD_MIME)).toContain('"rawTemplate"');
    expect(values.get("text/plain")).not.toContain(":::bw-guide");
    act(() => {
      editor!.commands.setTextSelection(editor!.state.doc.content.size - 1);
    });
    fireEvent.paste(screen.getByRole("textbox", { name: "Guide document" }), {
      clipboardData: data
    });
    expect(guideBuilds(latest.history.frame.document).map((build) => build.id)).toEqual([
      "gb-flare",
      "pasted-build"
    ]);
    expect(JSON.stringify(latest.history.frame.document.nodes)).toContain(
      '"buildId":"pasted-build"'
    );
    expect(latest.history.past).toHaveLength(1);
  });
  it("ignores active HTML and oversized or malformed fragments without partial mutations", async () => {
    render(<Harness />);
    await waitFor(() => expect(editor).not.toBeNull());
    const before = latest.history;
    const box = screen.getByRole("textbox", { name: "Guide document" });
    fireEvent.paste(box, {
      clipboardData: { types: [GUIDE_CLIPBOARD_MIME], getData: () => '{"version":99}' }
    });
    expect(latest.history).toBe(before);
    fireEvent.paste(box, {
      clipboardData: {
        types: ["text/html"],
        getData: (kind: string) =>
          kind === "text/html" ? '<img src="https://invalid.example/probe" onerror="alert(1)">' : ""
      }
    });
    expect(latest.history).toBe(before);
    expect(document.querySelector('img[src*="invalid.example"]')).toBeNull();
  });
});
