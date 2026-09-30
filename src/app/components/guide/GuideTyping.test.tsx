import { useEffect, useReducer } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Editor } from "@tiptap/core";
import { createGuideFixture } from "../../guide-fixture";
import { guideBuilds } from "../../../domain/guide";
import { requireReadyCatalogs } from "../../catalogs";
import * as guideSelectors from "../../guide-selectors";
import * as projection from "../../guide-editor-adapter";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  type WorkspaceState
} from "../../workspace-state";
import { guideAddress, reduceGuide } from "../../guide-state";
import GuideWorkspace from "./GuideWorkspace";

const catalogs = requireReadyCatalogs();
let latest: WorkspaceState;
function Harness() {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, () =>
    workspaceReducer(createInitialWorkspaceState(), {
      type: "replace-guide",
      document: createGuideFixture(true),
      session: "typing",
      decision: "discard"
    })
  );
  useEffect(() => {
    latest = workspace;
  }, [workspace]);
  if (workspace.document.kind !== "guide") throw Error("fixture");
  return (
    <GuideWorkspace
      workspace={workspace}
      guide={workspace.document}
      catalogs={catalogs}
      dispatch={dispatch}
    />
  );
}
afterEach(() => vi.restoreAllMocks());
describe("guide typing work", () => {
  it("keeps 16 embeds and 601 mentions out of prose rerenders and reuses the accepted editor projection", async () => {
    const mention = vi.spyOn(guideSelectors, "selectGuideSkill");
    const project = vi.spyOn(projection, "projectGuideNodes");
    render(<Harness />);
    const input = await screen.findByRole("textbox", { name: "Guide document" });
    // Tiptap publishes its owning Editor on the mounted view DOM.
    const editor = (input as HTMLElement & { editor: Editor }).editor;
    await waitFor(() => expect(editor).toBeDefined());
    if (latest.document.kind !== "guide") throw Error("fixture");
    const builds = guideBuilds(latest.document.history.frame.document);
    expect(mention).toHaveBeenCalled();
    mention.mockClear();
    project.mockClear();
    const start = performance.now();
    for (let i = 0; i < 20; i++)
      act(() => {
        editor.commands.insertContentAt(1 + i, "x");
      });
    const elapsed = performance.now() - start;
    console.info(
      `Long guide: 20 prose edits in ${elapsed.toFixed(1)} ms; 16 builds, 601 mentions.`
    );
    expect(input.querySelector("h1")).toHaveTextContent("x".repeat(20) + "Practice guide");
    expect(mention).not.toHaveBeenCalled();
    expect(project).not.toHaveBeenCalled();
    expect(guideBuilds(latest.document.history.frame.document)).toEqual(builds);
    // The synchronous acceptance check and workspace reducer share one result.
    const state = latest.document;
    const command = {
      ...guideAddress(state),
      type: "metadata" as const,
      metadata: { ...state.history.frame.document.metadata, title: "Updated" }
    };
    expect(reduceGuide(state, command, catalogs)).toBe(reduceGuide(state, command, catalogs));
  });
});
