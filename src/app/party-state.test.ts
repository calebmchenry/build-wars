import { describe, expect, it } from "vitest";

import { authoredDocumentId, buildSetEntryId, catalogId, partySlotId } from "../domain";
import { fixtureCatalogFacts } from "./library-fixtures";
import {
  localBuildRecordId,
  selectedPersistedBuildSnapshot,
  type PersistedSavedDocumentRecord
} from "./persistence-schema";
import {
  createInitialWorkspaceState,
  generateNestedBuildId,
  materializeActiveBuildSetSnapshot,
  workspaceReducer
} from "./workspace-state";

const NOW = "2026-09-03T07:00:00Z";
const LATER = "2026-09-03T07:01:00Z";

describe("party runtime state", () => {
  it("selects empty slots without persisting a placeholder member", () => {
    const entryA = buildSetEntryId("entry-a");
    const entryB = buildSetEntryId("entry-b");
    const slotA = partySlotId("slot-a");
    const slotB = partySlotId("slot-b");
    const set = workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
      type: "create-build-set-from-current",
      setId: authoredDocumentId("set-party"),
      entryId: entryA,
      decision: "discard"
    });
    const edited = workspaceReducer(set, {
      type: "editor",
      action: {
        type: "set-profession",
        field: "primary",
        professionId: catalogId<"Profession">(1)
      }
    });
    const enabled = workspaceReducer(edited, {
      type: "enable-party-mode",
      slotIds: [slotA]
    });
    const grown = workspaceReducer(enabled, {
      type: "resize-party",
      size: 2,
      slotIds: [slotB]
    });
    const emptySelected = workspaceReducer(grown, {
      type: "select-party-slot",
      slotId: slotB
    });
    const snapshot = materializeActiveBuildSetSnapshot(emptySelected);

    expect(
      emptySelected.document.kind === "build-set" ? emptySelected.document.selectedEntryId : "build"
    ).toBeNull();
    expect(snapshot?.lastSelectedEntryId).toBeNull();
    expect(snapshot?.lastSelectedPartySlotId).toBe(slotB);
    expect(snapshot?.entries).toHaveLength(1);
    expect(snapshot?.entries[0]?.snapshot.build.primaryProfessionId).toBe(
      catalogId<"Profession">(1)
    );
    expect(snapshot?.party?.slots.map((slot) => slot.entryId)).toEqual([entryA, null]);

    const created = workspaceReducer(emptySelected, {
      type: "create-party-member",
      slotId: slotB,
      entryId: entryB,
      buildId: generateNestedBuildId(entryB),
      label: "Backline"
    });
    const createdSnapshot = materializeActiveBuildSetSnapshot(created);

    expect(createdSnapshot?.entries).toHaveLength(2);
    expect(createdSnapshot?.lastSelectedEntryId).toBe(entryB);
    expect(createdSnapshot?.party?.slots[1]?.entryId).toBe(entryB);
    expect(created.editor.build.name).toBe("Backline");
  });

  it("clears members as detach-only and keeps dormant/reset lifecycle reversible", () => {
    const entryA = buildSetEntryId("entry-a");
    const entryB = buildSetEntryId("entry-b");
    const slotA = partySlotId("slot-a");
    const slotB = partySlotId("slot-b");
    const state = workspaceReducer(
      workspaceReducer(
        workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
          type: "create-build-set-from-current",
          setId: authoredDocumentId("set-clear"),
          entryId: entryA,
          decision: "discard"
        }),
        {
          type: "add-blank-build-set-entry",
          entryId: entryB,
          buildId: generateNestedBuildId(entryB),
          label: "Second"
        }
      ),
      {
        type: "enable-party-mode",
        slotIds: [slotA, slotB]
      }
    );
    const selectedFirst = workspaceReducer(state, { type: "select-party-slot", slotId: slotA });
    const cleared = workspaceReducer(selectedFirst, { type: "clear-party-slot", slotId: slotA });
    const dormant = workspaceReducer(cleared, { type: "disable-party-mode" });
    const reset = workspaceReducer(dormant, { type: "reset-party-mode", confirmed: true });

    expect(materializeActiveBuildSetSnapshot(cleared)?.entries.map((entry) => entry.id)).toEqual([
      entryA,
      entryB
    ]);
    expect(materializeActiveBuildSetSnapshot(cleared)?.party?.slots[0]?.entryId).toBeNull();
    expect(dormant.document.kind === "build-set" ? dormant.document.party?.enabled : null).toBe(
      false
    );
    expect(materializeActiveBuildSetSnapshot(dormant)?.party?.slots[0]?.entryId).toBeNull();
    expect(materializeActiveBuildSetSnapshot(reset)?.party).toBeNull();
    expect(materializeActiveBuildSetSnapshot(reset)?.entries).toHaveLength(2);
  });

  it("assigns existing unassigned loadouts without changing neutral entry order", () => {
    const entryA = buildSetEntryId("entry-a");
    const entryB = buildSetEntryId("entry-b");
    const slotA = partySlotId("slot-a");
    const slotB = partySlotId("slot-b");
    const set = workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
      type: "create-build-set-from-current",
      setId: authoredDocumentId("set-assign"),
      entryId: entryA,
      decision: "discard"
    });
    const enabled = workspaceReducer(set, {
      type: "enable-party-mode",
      slotIds: [slotA]
    });
    const grown = workspaceReducer(enabled, {
      type: "resize-party",
      size: 2,
      slotIds: [slotB]
    });
    const copied = workspaceReducer(grown, {
      type: "add-blank-build-set-entry",
      entryId: entryB,
      buildId: generateNestedBuildId(entryB),
      label: "Unassigned"
    });
    const assigned = workspaceReducer(copied, {
      type: "assign-party-slot",
      slotId: slotB,
      entryId: entryB
    });

    expect(materializeActiveBuildSetSnapshot(assigned)?.entries.map((entry) => entry.id)).toEqual([
      entryA,
      entryB
    ]);
    expect(
      materializeActiveBuildSetSnapshot(assigned)?.party?.slots.map((slot) => slot.entryId)
    ).toEqual([entryA, entryB]);
    expect(
      assigned.document.kind === "build-set" ? assigned.document.selectedPartySlotId : null
    ).toBe(slotB);
  });

  it("duplicates saved party records with fresh graph IDs", () => {
    const entryA = buildSetEntryId("entry-a");
    const entryB = buildSetEntryId("entry-b");
    const slotA = partySlotId("slot-a");
    const slotB = partySlotId("slot-b");
    const partyDraft = workspaceReducer(
      workspaceReducer(
        workspaceReducer(createInitialWorkspaceState({ now: NOW }), {
          type: "create-build-set-from-current",
          setId: authoredDocumentId("set-duplicate"),
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
    const created = workspaceReducer(partyDraft, {
      type: "create-party-member",
      slotId: slotB,
      entryId: entryB,
      buildId: generateNestedBuildId(entryB),
      label: "Second"
    });
    const saved = workspaceReducer(created, {
      type: "save-new",
      id: localBuildRecordId("local-party"),
      name: "Saved Party",
      now: NOW,
      savedWith: fixtureCatalogFacts
    });
    const duplicated = workspaceReducer(saved, {
      type: "duplicate-record",
      id: localBuildRecordId("local-party"),
      newId: localBuildRecordId("local-party-copy"),
      now: LATER
    });
    const [source, copy] = duplicated.library.records as readonly [
      PersistedSavedDocumentRecord,
      PersistedSavedDocumentRecord
    ];
    const sourceSet = source.document.kind === "build-set" ? source.document.snapshot : null;
    const copySet = copy.document.kind === "build-set" ? copy.document.snapshot : null;

    expect(copySet?.id).not.toBe(sourceSet?.id);
    expect(copySet?.entries.map((entry) => entry.id)).not.toEqual(
      sourceSet?.entries.map((entry) => entry.id)
    );
    expect(copySet?.party?.slots.map((slot) => slot.id)).not.toEqual(
      sourceSet?.party?.slots.map((slot) => slot.id)
    );
    expect(copySet?.party?.slots.map((slot) => slot.entryId)).toEqual(
      copySet?.entries.map((entry) => entry.id)
    );
    expect(selectedPersistedBuildSnapshot(copy.document)?.build.id).not.toBe(
      selectedPersistedBuildSnapshot(source.document)?.build.id
    );
  });
});
