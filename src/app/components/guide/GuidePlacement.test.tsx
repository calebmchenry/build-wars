import { useEffect, useReducer } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { guideBuilds } from "../../../domain/guide";
import { cloneGuideBuild } from "../../guide-build-adapter";
import { requireReadyCatalogs } from "../../catalogs";
import { createGuideFixture } from "../../guide-fixture";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  type WorkspaceState
} from "../../workspace-state";
import GuideWorkspace from "./GuideWorkspace";
import { GUIDE_SKILL_MIME } from "../../guide-placement";
const catalogs = requireReadyCatalogs();
let latest: WorkspaceState;
function Harness() {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () => {
    const document = createGuideFixture();
    const build = guideBuilds(document)[0]!;
    return workspaceReducer(createInitialWorkspaceState(), {
      type: "replace-guide",
      document: {
        ...document,
        nodes: [
          ...document.nodes,
          {
            ...build,
            id: "inactive",
            snapshot: {
              ...cloneGuideBuild(build.snapshot, "inactive"),
              build: { ...cloneGuideBuild(build.snapshot, "inactive").build, name: "Inactive" }
            }
          }
        ]
      },
      session: "placement-ui",
      decision: "discard"
    });
  });
  useEffect(() => {
    latest = state;
  }, [state]);
  if (state.document.kind !== "guide") throw Error("fixture");
  return (
    <GuideWorkspace
      workspace={state}
      guide={state.document}
      catalogs={catalogs}
      dispatch={dispatch}
    />
  );
}
function guide() {
  if (latest.document.kind !== "guide") throw Error("fixture");
  return latest.document;
}
function transfer() {
  const values = new Map<string, string>();
  return {
    get types() {
      return [...values.keys()];
    },
    setData: (type: string, value: string) => values.set(type, value),
    getData: (type: string) => values.get(type) ?? "",
    effectAllowed: "none",
    dropEffect: "none"
  };
}
describe("guide placement component boundaries", () => {
  it("consumes a nested inactive-slot drop once and preserves the source after dragend none", async () => {
    render(<Harness />);
    const source = await screen.findByRole("button", { name: "Flare practice slot 1: Flare" });
    const destination = screen.getByRole("button", { name: "Inactive slot 8: Empty" });
    const before = guide();
    const data = transfer();
    fireEvent.dragStart(source, { dataTransfer: data });
    expect(data.getData(GUIDE_SKILL_MIME)).toContain('"buildId":"gb-flare"');
    fireEvent.dragOver(destination.firstChild!, { dataTransfer: data });
    fireEvent.drop(destination.firstChild!, { dataTransfer: data });
    data.dropEffect = "none";
    fireEvent.dragEnd(source, { dataTransfer: data });
    expect(guide().history.past).toHaveLength(before.history.past.length + 1);
    const builds = guideBuilds(guide().history.frame.document);
    expect(builds[0]).toEqual(guideBuilds(before.history.frame.document)[0]);
    expect(builds[1]!.snapshot.build.skillBar[7]).toBe(194);
    expect(builds[1]!.snapshot.build.skillBar[0]).toBeNull();
  });
  it("supports explicit pick then click placement and zero-history Escape/outside/malformed cancellation", async () => {
    render(<Harness />);
    const source = await screen.findByRole("button", { name: "Flare practice slot 1: Flare" });
    fireEvent.click(source);
    fireEvent.click(screen.getByRole("button", { name: "Pick selected slot" }));
    fireEvent.keyDown(source, { key: "Escape" });
    expect(guide().history.past).toHaveLength(0);
    const data = transfer();
    fireEvent.dragStart(source, { dataTransfer: data });
    fireEvent.dragEnd(source, { dataTransfer: data });
    expect(guide().history.past).toHaveLength(0);
    const invalid = transfer();
    invalid.setData(GUIDE_SKILL_MIME, '{"version":2}');
    fireEvent.drop(screen.getByRole("button", { name: "Inactive slot 8: Empty" }), {
      dataTransfer: invalid
    });
    expect(guide().history.past).toHaveLength(0);
    fireEvent.click(source);
    fireEvent.click(screen.getByRole("button", { name: "Pick selected slot" }));
    fireEvent.click(screen.getByRole("button", { name: "Inactive slot 8: Empty" }));
    expect(guide().history.past).toHaveLength(1);
    expect(guideBuilds(guide().history.frame.document)[0]!.snapshot.build.skillBar[0]).toBe(194);
  });
});
