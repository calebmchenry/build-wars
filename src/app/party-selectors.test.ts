import { describe, expect, it } from "vitest";

import { authoredDocumentId, buildSetEntryId, partySlotId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { fixtureCatalogFacts } from "./library-fixtures";
import { fingerprintPersistedDocument } from "./persistence-schema";
import { selectPartyWorkspaceView } from "./party-selectors";
import {
  createInitialWorkspaceState,
  generateNestedBuildId,
  materializeActiveDocument,
  workspacePersistenceFingerprint,
  workspaceReducer
} from "./workspace-state";

const catalogs = requireReadyCatalogs();

describe("party selectors", () => {
  it("summarizes occupied, empty, selected, and unassigned party slots without mutation", () => {
    const entryA = buildSetEntryId("entry-a");
    const entryB = buildSetEntryId("entry-b");
    const slotA = partySlotId("slot-a");
    const slotB = partySlotId("slot-b");
    const party = workspaceReducer(
      workspaceReducer(
        workspaceReducer(createInitialWorkspaceState(), {
          type: "create-build-set-from-current",
          setId: authoredDocumentId("set-party-selector"),
          entryId: entryA,
          decision: "discard"
        }),
        {
          type: "enable-party-mode",
          slotIds: [slotA]
        }
      ),
      {
        type: "resize-party",
        size: 2,
        slotIds: [slotB]
      }
    );
    const withUnassigned = workspaceReducer(party, {
      type: "add-blank-build-set-entry",
      entryId: entryB,
      buildId: generateNestedBuildId(entryB),
      label: "Unassigned"
    });
    const selectedEmpty = workspaceReducer(withUnassigned, {
      type: "select-party-slot",
      slotId: slotB
    });
    const beforeDocument = fingerprintPersistedDocument(materializeActiveDocument(selectedEmpty));
    const beforeWorkspace = workspacePersistenceFingerprint(selectedEmpty, fixtureCatalogFacts);
    const view = selectPartyWorkspaceView(selectedEmpty, catalogs);
    const afterDocument = fingerprintPersistedDocument(materializeActiveDocument(selectedEmpty));
    const afterWorkspace = workspacePersistenceFingerprint(selectedEmpty, fixtureCatalogFacts);

    expect(view?.enabled).toBe(true);
    expect(view?.slotCount).toBe(2);
    expect(view?.occupiedCount).toBe(1);
    expect(view?.emptyCount).toBe(1);
    expect(view?.selectedSlotId).toBe(slotB);
    expect(view?.selectedEntryId).toBeNull();
    expect(view?.slots.map((slot) => [slot.id, slot.occupied, slot.selected])).toEqual([
      [slotA, true, false],
      [slotB, false, true]
    ]);
    expect(view?.unassignedEntries.map((entry) => entry.id)).toEqual([entryB]);
    expect(afterDocument).toBe(beforeDocument);
    expect(afterWorkspace).toBe(beforeWorkspace);
  });
});
