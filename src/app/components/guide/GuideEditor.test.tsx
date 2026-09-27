import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Editor } from "@tiptap/core";
import { createGuideFixture } from "../../guide-fixture";
import { GuideEditor } from "./GuideEditor";

describe("guide editor composition bridge (synthetic unit coverage)", () => {
  it("cancels candidates without publishing and separates atomic insertions from typing", async () => {
    let editor: Editor | null = null;
    const onChange = vi.fn();
    render(
      <GuideEditor
        document={createGuideFixture()}
        renderBuild={() => null}
        renderSkill={() => null}
        onChange={onChange}
        onHistory={vi.fn()}
        onComposition={vi.fn()}
        onEditor={(value) => {
          editor = value;
        }}
      />
    );
    await waitFor(() => expect(editor).not.toBeNull());
    const input = screen.getByRole("textbox", { name: "Guide document" });
    fireEvent.compositionStart(input);
    act(() => {
      editor!.commands.insertContentAt(1, "candidate");
      editor!.commands.deleteRange({ from: 1, to: 10 });
    });
    fireEvent.compositionEnd(input, { data: "" });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });
    expect(onChange).not.toHaveBeenCalled();
    act(() => {
      editor!.commands.insertContentAt(1, {
        type: "guideSkill",
        attrs: { skillId: "catalog:skill:194", context: { kind: "generic" } }
      });
    });
    expect(onChange).toHaveBeenLastCalledWith(expect.anything(), false);
    act(() => {
      editor!.commands.insertContent("a");
    });
    expect(onChange).toHaveBeenLastCalledWith(expect.anything(), true);
  });
  it("routes one keyboard history command without bubbling a second workspace command", () => {
    const parentHistory = vi.fn();
    const onHistory = vi.fn();
    render(
      <div onKeyDown={parentHistory}>
        <GuideEditor
          document={createGuideFixture()}
          renderBuild={() => null}
          renderSkill={() => null}
          onChange={vi.fn()}
          onHistory={onHistory}
          onComposition={vi.fn()}
          onEditor={() => undefined}
        />
      </div>
    );
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Guide document" }), {
      key: "z",
      metaKey: true,
      shiftKey: true
    });
    expect(onHistory.mock.calls).toEqual([["redo"]]);
    expect(parentHistory).not.toHaveBeenCalled();
  });

  it("publishes only the final candidate once and prevents native-history routing during composition", async () => {
    let editor: Editor | null = null;
    const onChange = vi.fn();
    const onHistory = vi.fn();
    const onComposition = vi.fn();
    render(
      <GuideEditor
        document={createGuideFixture()}
        renderBuild={() => null}
        renderSkill={() => null}
        onChange={onChange}
        onHistory={onHistory}
        onComposition={onComposition}
        onEditor={(value) => {
          editor = value;
        }}
      />
    );
    await waitFor(() => expect(editor).not.toBeNull());
    const input = screen.getByRole("textbox", { name: "Guide document" });
    fireEvent.compositionStart(input);
    act(() => {
      editor!.commands.insertContent("´");
    });
    expect(onChange).not.toHaveBeenCalled();
    input.dispatchEvent(
      new InputEvent("beforeinput", { inputType: "historyUndo", bubbles: true, cancelable: true })
    );
    expect(onHistory).not.toHaveBeenCalled();
    act(() => {
      editor!.commands.insertContentAt({ from: 1, to: 2 }, "é");
    });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input, { data: "é" });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0]![1]).toBe(false);
    expect(JSON.stringify(onChange.mock.calls[0]![0])).toContain("éPractice guide");
    expect(JSON.stringify(onChange.mock.calls[0]![0])).not.toContain("´");
    expect(onComposition.mock.calls).toEqual([[true], [false]]);
    input.dispatchEvent(
      new InputEvent("beforeinput", { inputType: "historyUndo", bubbles: true, cancelable: true })
    );
    expect(onHistory).toHaveBeenCalledWith("undo");
  });
});
