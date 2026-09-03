import { describe, expect, it } from "vitest";

import { authoredDocumentId, buildSetEntryId, catalogId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { fixtureCatalogFacts } from "./library-fixtures";
import { fingerprintPersistedDocument } from "./persistence-schema";
import {
  createInitialWorkspaceState,
  materializeActiveDocument,
  workspacePersistenceFingerprint,
  workspaceReducer
} from "./workspace-state";
import { selectBuildSetNavigatorView } from "./build-set-selectors";

const catalogs = requireReadyCatalogs();

describe("build set selectors", () => {
  it("summarizes active and inactive entries without mutating materialized state", () => {
    const entryA = buildSetEntryId("entry-a");
    const entryB = buildSetEntryId("entry-b");
    const set = workspaceReducer(createInitialWorkspaceState(), {
      type: "create-build-set-from-current",
      setId: authoredDocumentId("set-summary"),
      entryId: entryA,
      decision: "discard",
      name: "Summary Set"
    });
    const edited = workspaceReducer(set, {
      type: "editor",
      action: {
        type: "set-profession",
        field: "primary",
        professionId: catalogId<"Profession">(1)
      }
    });
    const withSecond = workspaceReducer(edited, {
      type: "add-blank-build-set-entry",
      entryId: entryB,
      buildId: authoredDocumentId("build-second"),
      label: "Second"
    });
    const beforeDocument = fingerprintPersistedDocument(materializeActiveDocument(withSecond));
    const beforeWorkspace = workspacePersistenceFingerprint(withSecond, fixtureCatalogFacts);
    const view = selectBuildSetNavigatorView(withSecond, catalogs);
    const afterDocument = fingerprintPersistedDocument(materializeActiveDocument(withSecond));
    const afterWorkspace = workspacePersistenceFingerprint(withSecond, fixtureCatalogFacts);

    expect(view).toMatchObject({
      name: "Summary Set",
      entryCount: 2,
      empty: false
    });
    expect(view?.entries.map((entry) => entry.label)).toEqual(["Untitled Build", "Second"]);
    expect(view?.entries[0]?.professionPair).toContain("Warrior");
    expect(view?.entries[1]?.selected).toBe(true);
    expect(view?.entries[1]?.skills).toHaveLength(8);
    expect(view?.aggregate.incompleteEntries).toBeGreaterThan(0);
    expect(afterDocument).toBe(beforeDocument);
    expect(afterWorkspace).toBe(beforeWorkspace);
  });

  it("returns an empty build-set view without a phantom selected entry", () => {
    const state = workspaceReducer(createInitialWorkspaceState(), {
      type: "new-build-set",
      setId: authoredDocumentId("set-empty"),
      decision: "discard"
    });
    const view = selectBuildSetNavigatorView(state, catalogs);

    expect(view?.empty).toBe(true);
    expect(view?.selectedEntryId).toBeNull();
    expect(view?.entries).toEqual([]);
    expect(view?.aggregate.summary).toBe("empty set");
  });
});
