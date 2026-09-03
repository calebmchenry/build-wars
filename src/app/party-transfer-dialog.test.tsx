import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";

import { authoredDocumentId, buildSetEntryId, partySlotId } from "../domain";
import { PartyTransferDialog } from "./components/PartyTransferDialog";
import { createPartyTransferEnvelope, serializePartyTransferEnvelope } from "./party-transfer";
import {
  createInitialWorkspaceState,
  materializeActiveBuildSetSnapshot,
  workspaceReducer,
  type WorkspaceState
} from "./workspace-state";

const NOW = "2026-09-03T07:20:00Z";

describe("PartyTransferDialog", () => {
  it("renders native party JSON export and previews party import", () => {
    const workspace = partyDraft();
    const snapshot = materializeActiveBuildSetSnapshot(workspace);
    const envelope =
      snapshot === null
        ? null
        : createPartyTransferEnvelope({ buildSet: snapshot, exportedAt: NOW });

    expect(envelope).not.toBeNull();
    if (envelope === null) {
      return;
    }
    const importText = serializePartyTransferEnvelope(envelope);
    render(<Harness initial={workspace} />);

    expect(screen.getByRole("dialog", { name: "Party Transfer" })).toBeInTheDocument();
    expect(screen.getByDisplayValue(/build-wars-party-transfer/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Native party JSON input"), {
      target: { value: importText }
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview Import" }));

    expect(screen.getByText("Untitled Build Set")).toBeInTheDocument();
    expect(screen.getAllByText(/2 slots \/ 1 loadouts/)).toHaveLength(2);
  });
});

function partyDraft(): WorkspaceState {
  const entry = buildSetEntryId("entry-party-transfer");
  return workspaceReducer(
    workspaceReducer(
      workspaceReducer(createInitialWorkspaceState(), {
        type: "create-build-set-from-current",
        setId: authoredDocumentId("set-party-transfer"),
        entryId: entry,
        decision: "discard"
      }),
      {
        type: "enable-party-mode",
        slotIds: [partySlotId("slot-1")]
      }
    ),
    {
      type: "resize-party",
      size: 2,
      slotIds: [partySlotId("slot-2")]
    }
  );
}

function Harness({ initial }: { readonly initial: WorkspaceState }) {
  const [workspace, dispatch] = useReducer(workspaceReducer, initial);
  return <PartyTransferDialog open workspace={workspace} dispatch={dispatch} onClose={vi.fn()} />;
}
