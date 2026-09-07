import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { authoredDocumentId, partySlotId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { BuildComposer } from "./components/BuildComposer";
import { selectValidationView } from "./editor-selectors";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  type WorkspaceState
} from "./workspace-state";

const catalogs = requireReadyCatalogs();
const CATALOG_RENDER_TIMEOUT_MS = 10_000;

describe("BuildComposer", () => {
  it(
    "renders the focused two-panel composer for a single-build draft",
    () => {
      render(<Harness />);

      expect(screen.getByRole("region", { name: "Focused build composer" })).toBeInTheDocument();
      expect(screen.getByLabelText("Build name")).toHaveValue("Untitled Build");
      expect(screen.getByRole("heading", { name: /^Attributes \(/ })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Skill Bar" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Template Code" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Skills Catalog" })).toBeInTheDocument();
    },
    CATALOG_RENDER_TIMEOUT_MS
  );

  it(
    "edits professions and build name without touching secondary labels",
    () => {
      render(<Harness />);

      fireEvent.change(screen.getByLabelText("Primary"), { target: { value: "1" } });
      fireEvent.change(screen.getByLabelText("Secondary"), { target: { value: "2" } });
      fireEvent.change(screen.getByLabelText("Build name"), { target: { value: "Focused Build" } });
      fireEvent.blur(screen.getByLabelText("Build name"));

      expect(screen.getByLabelText("Primary")).toHaveValue("1");
      expect(screen.getByLabelText("Secondary")).toHaveValue("2");
      expect(screen.getByLabelText("Build name")).toHaveValue("Focused Build");
    },
    CATALOG_RENDER_TIMEOUT_MS
  );

  it("syncs the default skill mode filter from the PvP checkbox without reverse updates", () => {
    render(<Harness />);

    const pvpToggle = screen.getByRole("checkbox", { name: "PvP" });
    fireEvent.click(screen.getByRole("button", { name: /Show skill filters/ }));
    const modeFilter = screen.getByLabelText("Mode");

    expect(pvpToggle).not.toBeChecked();
    expect(modeFilter).toHaveValue("pve");

    fireEvent.click(pvpToggle);

    expect(pvpToggle).toBeChecked();
    expect(modeFilter).toHaveValue("pvp");

    fireEvent.change(modeFilter, { target: { value: "pve" } });

    expect(pvpToggle).toBeChecked();
    expect(modeFilter).toHaveValue("pve");

    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(modeFilter).toHaveValue("pvp");

    fireEvent.click(pvpToggle);

    expect(pvpToggle).not.toBeChecked();
    expect(modeFilter).toHaveValue("pve");
  });

  it("renders an empty build-set no-loadout state until a loadout is explicitly created", () => {
    render(<Harness initialState={emptyBuildSetWorkspace()} />);

    expect(screen.getByRole("heading", { name: "No Selected Loadout" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Build name")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Loadout" }));

    expect(screen.getByLabelText("Build name")).toHaveValue("Loadout 1");
  });

  it("renders an empty selected party slot and creates a member only on command", () => {
    render(<Harness initialState={emptyPartySlotWorkspace()} />);

    expect(screen.getByRole("heading", { name: "No Selected Loadout" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Build name")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create Member" }));

    expect(screen.getByLabelText("Build name")).toHaveValue("New Party Member");
  });
});

function Harness({
  initialState = createInitialWorkspaceState()
}: {
  readonly initialState?: WorkspaceState;
}) {
  const [workspace, workspaceDispatch] = useReducer(workspaceReducer, initialState);
  const validation = selectValidationView(workspace.editor, catalogs);
  return (
    <BuildComposer
      workspace={workspace}
      catalogs={catalogs}
      validation={validation}
      editorDispatch={(action) => workspaceDispatch({ type: "editor", action })}
      workspaceDispatch={workspaceDispatch}
      requestDraftReplacement={() => "discard"}
    />
  );
}

function emptyBuildSetWorkspace(): WorkspaceState {
  return workspaceReducer(createInitialWorkspaceState(), {
    type: "new-build-set",
    setId: authoredDocumentId("build-set:test-empty"),
    name: "Empty Set",
    decision: "discard"
  });
}

function emptyPartySlotWorkspace(): WorkspaceState {
  const withSet = workspaceReducer(createInitialWorkspaceState(), {
    type: "new-build-set",
    setId: authoredDocumentId("build-set:test-party"),
    name: "Party Set",
    decision: "discard"
  });
  const withParty = workspaceReducer(withSet, {
    type: "enable-party-mode",
    slotIds: [partySlotId("slot:test-party-1"), partySlotId("slot:test-party-2")]
  });
  return workspaceReducer(withParty, {
    type: "select-party-slot",
    slotId: partySlotId("slot:test-party-2")
  });
}
