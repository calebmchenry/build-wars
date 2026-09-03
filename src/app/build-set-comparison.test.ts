import { describe, expect, it } from "vitest";

import { authoredDocumentId, buildSetEntryId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import {
  validBuildSetSnapshotFixture,
  validLocalLibraryEnvelopeFixture,
  validSnapshotFixture,
  validWorkingDraftFixture
} from "./library-fixtures";
import { persistedBuildSetDocument } from "./persistence-schema";
import { selectBuildSetComparisonView } from "./build-set-comparison";
import { createInitialWorkspaceState, workspaceReducer } from "./workspace-state";

const catalogs = requireReadyCatalogs();

describe("build set comparison", () => {
  it("emits stable changed rows with presentation labels and normalized equality", () => {
    const state = workspaceReducer(workspaceFromSnapshot(validBuildSetSnapshotFixture()), {
      type: "set-build-set-comparison-entry",
      entryId: buildSetEntryId("entry-fixture-2")
    });
    const view = selectBuildSetComparisonView(state, catalogs);

    expect(view.status).toBe("ready");
    if (view.status !== "ready") {
      throw new Error("Expected ready comparison view.");
    }
    expect(view.selectedLabel).toBe("Frontline");
    expect(view.comparisonLabel).toBe("Unresolved Variant");
    expect(view.changedGroups.map((group) => group.key)).toEqual([
      "identity",
      "professions",
      "mode",
      "skills",
      "attributes",
      "raw"
    ]);
    expect(view.allRows.map((row) => row.key)).toEqual(
      selectReadyComparison(state).allRows.map((row) => row.key)
    );
    expect(view.allRows.find((row) => row.key === "build.primaryProfessionId")?.left.label).toBe(
      "Warrior"
    );
    expect(view.allRows.find((row) => row.key === "raw.skillBar.1")?.right.status).toBe(
      "unresolved"
    );
  });

  it("reports no differences when semantic fields and entry metadata match", () => {
    const entryA = buildSetEntryId("entry-a");
    const entryB = buildSetEntryId("entry-b");
    const snapshot = validSnapshotFixture();
    const state = workspaceReducer(
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
              notes: "Shared note",
              snapshot
            },
            {
              id: entryB,
              label: "Same",
              kind: "build",
              notes: "Shared note",
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

    const view = selectBuildSetComparisonView(state, catalogs);
    expect(view.status).toBe("ready");
    if (view.status !== "ready") {
      throw new Error("Expected ready comparison view.");
    }
    expect(view.hasDifferences).toBe(false);
    expect(view.changedRowCount).toBe(0);
    expect(view.changedGroups).toEqual([]);
  });
});

function selectReadyComparison(state: ReturnType<typeof workspaceFromSnapshot>) {
  const view = selectBuildSetComparisonView(state, catalogs);
  if (view.status !== "ready") {
    throw new Error("Expected ready comparison view.");
  }
  return view;
}

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
