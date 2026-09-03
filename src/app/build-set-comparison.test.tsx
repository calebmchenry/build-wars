import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { authoredDocumentId, buildSetEntryId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { BuildSetComparison } from "./components/BuildSetComparison";
import {
  validBuildSetSnapshotFixture,
  validLocalLibraryEnvelopeFixture,
  validSnapshotFixture,
  validWorkingDraftFixture
} from "./library-fixtures";
import { persistedBuildSetDocument } from "./persistence-schema";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  type WorkspaceState
} from "./workspace-state";

const catalogs = requireReadyCatalogs();

describe("BuildSetComparison", () => {
  it("renders changed groups by default", () => {
    render(<BuildSetComparison workspace={comparisonWorkspace()} catalogs={catalogs} />);

    expect(screen.getByLabelText("Build set comparison")).toBeInTheDocument();
    expect(screen.getByText("Frontline vs Unresolved Variant")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Raw Facts" })).toBeInTheDocument();
    expect(screen.getByText("Unknown skill 999999 (unknown)")).toBeInTheDocument();
  });

  it("renders a no-differences state", () => {
    render(<BuildSetComparison workspace={identicalWorkspace()} catalogs={catalogs} />);

    expect(screen.getByText("Same vs Same")).toBeInTheDocument();
    expect(screen.getByText("No differences")).toBeInTheDocument();
  });
});

function comparisonWorkspace(): WorkspaceState {
  return workspaceReducer(workspaceFromSnapshot(validBuildSetSnapshotFixture()), {
    type: "set-build-set-comparison-entry",
    entryId: buildSetEntryId("entry-fixture-2")
  });
}

function identicalWorkspace(): WorkspaceState {
  const entryA = buildSetEntryId("entry-a");
  const entryB = buildSetEntryId("entry-b");
  const snapshot = validSnapshotFixture();
  return workspaceReducer(
    workspaceFromSnapshot(
      validBuildSetSnapshotFixture({
        id: authoredDocumentId("set-identical"),
        name: "Identical Set",
        lastSelectedEntryId: entryA,
        entries: [
          {
            id: entryA,
            label: "Same",
            kind: "build",
            notes: null,
            snapshot
          },
          {
            id: entryB,
            label: "Same",
            kind: "build",
            notes: null,
            snapshot
          }
        ]
      })
    ),
    {
      type: "set-build-set-comparison-entry",
      entryId: entryB
    }
  );
}

function workspaceFromSnapshot(
  snapshot: ReturnType<typeof validBuildSetSnapshotFixture>
): WorkspaceState {
  return createInitialWorkspaceState({
    envelope: validLocalLibraryEnvelopeFixture({
      workingDraft: validWorkingDraftFixture({
        document: persistedBuildSetDocument(snapshot)
      }),
      savedDocuments: []
    })
  });
}
