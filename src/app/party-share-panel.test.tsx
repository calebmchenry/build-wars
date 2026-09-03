import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authoredDocumentId, buildSetEntryId, partySlotId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { PartySharePanel } from "./components/PartySharePanel";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  type WorkspaceState
} from "./workspace-state";

const catalogs = requireReadyCatalogs();

describe("PartySharePanel", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  it("renders deterministic party-order text and copies partial multi-code output", () => {
    render(<Harness initial={partyDraft()} />);

    expect(screen.getByText("Multi-Code Copy")).toBeInTheDocument();
    expect(screen.getByText(/0 available \/ 1 empty \/ 1 unavailable/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Build Wars Party Codes/)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        /Primary profession must be selected before canonical skill-template export\./
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy Partial Multi-Code" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("Slot 2: Member 2")
    );
  });
});

function partyDraft(): WorkspaceState {
  const entry = buildSetEntryId("entry-party-share");
  return workspaceReducer(
    workspaceReducer(
      workspaceReducer(createInitialWorkspaceState(), {
        type: "create-build-set-from-current",
        setId: authoredDocumentId("set-party-share"),
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
  return <PartySharePanel workspace={workspace} catalogs={catalogs} dispatch={dispatch} />;
}
