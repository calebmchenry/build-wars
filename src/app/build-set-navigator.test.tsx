import { fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";

import { authoredDocumentId, buildSetEntryId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { BuildSetNavigator } from "./components/BuildSetNavigator";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  type WorkspaceState
} from "./workspace-state";

const catalogs = requireReadyCatalogs();

describe("BuildSetNavigator", () => {
  it("renders empty state and adds a loadout with accessible controls", () => {
    render(<Harness initial={emptySet()} />);

    expect(screen.getAllByRole("button", { name: "Add Loadout" })).toHaveLength(2);
    expect(screen.getByText("Empty build set")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Add Loadout" })[0]!);

    expect((screen.getByLabelText("Select loadout") as HTMLSelectElement).value).toContain(
      "entry-"
    );
    expect(screen.getByRole("button", { name: "Loadout 1" })).toBeInTheDocument();
  });

  it("selects, renames, reorders, promotes, removes, and opens transfer", () => {
    const onOpenTransfer = vi.fn();
    render(<Harness initial={twoEntrySet()} onOpenTransfer={onOpenTransfer} />);

    expect(screen.getByLabelText("Build set attention")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Review Untitled Build:/ }));
    expect(screen.getByRole("button", { name: "Untitled Build" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.change(screen.getByLabelText("Select loadout"), {
      target: { value: "entry-a" }
    });
    expect(screen.getByRole("button", { name: "Untitled Build" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.change(screen.getByLabelText("Label for Untitled Build"), {
      target: { value: "A long renamed loadout label" }
    });
    expect(
      screen.getByRole("button", { name: "A long renamed loadout label" })
    ).toBeInTheDocument();

    const renamedCard = screen
      .getByRole("button", { name: "A long renamed loadout label" })
      .closest("article");
    if (renamedCard === null) {
      throw new Error("Missing renamed card.");
    }
    fireEvent.change(within(renamedCard).getByLabelText("Kind for A long renamed loadout label"), {
      target: { value: "variant" }
    });
    fireEvent.click(within(renamedCard).getByRole("button", { name: "Promote" }));
    expect(within(renamedCard).getByText("build")).toBeInTheDocument();

    fireEvent.click(within(renamedCard).getByRole("button", { name: "Move Later" }));
    fireEvent.click(within(renamedCard).getByRole("button", { name: "Remove" }));
    expect(
      screen.queryByRole("button", { name: "A long renamed loadout label" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Transfer" }));
    expect(onOpenTransfer).toHaveBeenCalledTimes(1);
  });

  it("enables party mode from an empty set and creates a selected member", () => {
    const onOpenPartyTransfer = vi.fn();
    render(<Harness initial={emptySet()} onOpenPartyTransfer={onOpenPartyTransfer} />);

    fireEvent.click(screen.getByRole("button", { name: "Enable Party" }));

    expect(screen.getByRole("heading", { name: "Untitled Build Set" })).toBeInTheDocument();
    expect(screen.getByText("Selected Empty Slot")).toBeInTheDocument();
    expect(screen.getAllByText("Empty slot")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Create Member" }));

    expect(screen.getByRole("button", { name: /1\. Member 1/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByLabelText("Member label for slot 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Party JSON" }));
    expect(onOpenPartyTransfer).toHaveBeenCalledTimes(1);
  });
});

function emptySet(): WorkspaceState {
  return workspaceReducer(createInitialWorkspaceState(), {
    type: "new-build-set",
    setId: authoredDocumentId("set-empty"),
    decision: "discard"
  });
}

function twoEntrySet(): WorkspaceState {
  const entryA = buildSetEntryId("entry-a");
  const entryB = buildSetEntryId("entry-b");
  const set = workspaceReducer(createInitialWorkspaceState(), {
    type: "create-build-set-from-current",
    setId: authoredDocumentId("set-two"),
    entryId: entryA,
    decision: "discard"
  });
  return workspaceReducer(set, {
    type: "add-blank-build-set-entry",
    entryId: entryB,
    buildId: authoredDocumentId("build-b"),
    label: "Second"
  });
}

function Harness({
  initial,
  onOpenTransfer = () => undefined,
  onOpenPartyTransfer = () => undefined
}: {
  readonly initial: WorkspaceState;
  readonly onOpenTransfer?: () => void;
  readonly onOpenPartyTransfer?: () => void;
}) {
  const [workspace, dispatch] = useReducer(workspaceReducer, initial);
  return (
    <BuildSetNavigator
      workspace={workspace}
      catalogs={catalogs}
      dispatch={dispatch}
      onOpenTransfer={onOpenTransfer}
      onOpenPartyTransfer={onOpenPartyTransfer}
    />
  );
}
