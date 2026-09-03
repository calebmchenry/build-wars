import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BuildSetTransferDialog } from "./components/BuildSetTransferDialog";
import {
  createBuildSetTransferEnvelope,
  serializeBuildSetTransferEnvelope
} from "./build-set-transfer";
import {
  validBuildSetSnapshotFixture,
  validLocalLibraryEnvelopeFixture,
  validWorkingDraftFixture
} from "./library-fixtures";
import { persistedBuildSetDocument } from "./persistence-schema";
import { createInitialWorkspaceState, type WorkspaceAction } from "./workspace-state";

const NOW = "2026-09-03T06:20:00Z";

describe("BuildSetTransferDialog", () => {
  it("previews and applies a valid build-set import through workspace dispatch", () => {
    const dispatch = vi.fn<(action: WorkspaceAction) => void>();
    const onClose = vi.fn();
    const snapshot = validBuildSetSnapshotFixture({ name: "Imported Set" });
    const text = serializeBuildSetTransferEnvelope(
      createBuildSetTransferEnvelope({ buildSet: snapshot, exportedAt: NOW })
    );

    render(
      <BuildSetTransferDialog
        open
        workspace={workspaceFromSnapshot(validBuildSetSnapshotFixture())}
        dispatch={dispatch}
        onClose={onClose}
      />
    );

    const dialog = screen.getByRole("dialog", { name: "Build Set Transfer" });
    expect(
      (within(dialog).getByLabelText("Build-set JSON") as HTMLTextAreaElement).value
    ).toContain("build-wars-build-set-transfer");

    fireEvent.change(within(dialog).getByLabelText("Build-set JSON input"), {
      target: { value: text }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Preview Import" }));
    expect(within(dialog).getByText("Imported Set")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Apply Import" }));
    expect(dispatch).toHaveBeenCalledWith({
      type: "replace-build-set-draft",
      snapshot,
      source: "build-set-transfer",
      decision: "discard"
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: "editor",
      action: { type: "set-message", tone: "success", text: "Build set imported." }
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows blocked diagnostics for malformed transfer JSON", () => {
    render(
      <BuildSetTransferDialog
        open
        workspace={workspaceFromSnapshot(validBuildSetSnapshotFixture())}
        dispatch={() => undefined}
        onClose={() => undefined}
      />
    );

    const dialog = screen.getByRole("dialog", { name: "Build Set Transfer" });
    fireEvent.change(within(dialog).getByLabelText("Build-set JSON input"), {
      target: { value: "{" }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Preview Import" }));

    expect(within(dialog).getByText("Import blocked")).toBeInTheDocument();
    expect(within(dialog).getByText("Build-set transfer JSON is malformed.")).toBeInTheDocument();
  });
});

function workspaceFromSnapshot(snapshot: ReturnType<typeof validBuildSetSnapshotFixture>) {
  return createInitialWorkspaceState({
    envelope: validLocalLibraryEnvelopeFixture({
      workingDraft: validWorkingDraftFixture({
        document: persistedBuildSetDocument(snapshot)
      }),
      savedDocuments: []
    })
  });
}
