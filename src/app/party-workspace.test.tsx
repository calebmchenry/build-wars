import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";

import { authoredDocumentId, partySlotId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { PartyWorkspace } from "./components/PartyWorkspace";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  type WorkspaceState
} from "./workspace-state";

const catalogs = requireReadyCatalogs();

describe("PartyWorkspace", () => {
  it("renders empty party slots and creates a selected member", () => {
    const onOpenPartyTransfer = vi.fn();
    render(<Harness initial={emptyParty()} onOpenPartyTransfer={onOpenPartyTransfer} />);

    expect(screen.getByText("Selected Empty Slot")).toBeInTheDocument();
    expect(screen.getAllByText("Empty slot")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Create Member" }));

    expect(screen.getByRole("button", { name: /1\. Member 1/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("Multi-Code Copy")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Party JSON" }));
    expect(onOpenPartyTransfer).toHaveBeenCalledTimes(1);
  });
});

function emptyParty(): WorkspaceState {
  return workspaceReducer(
    workspaceReducer(createInitialWorkspaceState(), {
      type: "new-build-set",
      setId: authoredDocumentId("set-party-workspace"),
      decision: "discard"
    }),
    {
      type: "enable-party-mode",
      slotIds: [
        partySlotId("slot-1"),
        partySlotId("slot-2"),
        partySlotId("slot-3"),
        partySlotId("slot-4")
      ]
    }
  );
}

function Harness({
  initial,
  onOpenPartyTransfer
}: {
  readonly initial: WorkspaceState;
  readonly onOpenPartyTransfer: () => void;
}) {
  const [workspace, dispatch] = useReducer(workspaceReducer, initial);
  return (
    <PartyWorkspace
      workspace={workspace}
      catalogs={catalogs}
      dispatch={dispatch}
      onOpenPartyTransfer={onOpenPartyTransfer}
    />
  );
}
