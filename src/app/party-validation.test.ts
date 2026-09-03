import { describe, expect, it } from "vitest";

import { buildSetEntryId, partySlotId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { validPartyBuildSetSnapshotFixture } from "./library-fixtures";
import { selectPartyValidationView } from "./party-validation";

const catalogs = requireReadyCatalogs();

describe("party validation", () => {
  it("reports structural empty slots separately from per-loadout validation", () => {
    const view = selectPartyValidationView(validPartyBuildSetSnapshotFixture(), catalogs);

    expect(view?.counts.emptySlots).toBe(1);
    expect(view?.issues.map((issue) => issue.code)).toContain("empty-party-slot");
    expect(view?.members[0]?.entryId).toBe(buildSetEntryId("entry-fixture-1"));
    expect(view?.members[1]?.status).toBe("empty");
  });

  it("diagnoses mixed known modes without adding composition advice", () => {
    const snapshot = validPartyBuildSetSnapshotFixture({
      party: {
        schemaVersion: 1,
        enabled: true,
        size: { kind: "preset", size: 2 },
        slots: [
          {
            id: partySlotId("slot-a"),
            entryId: buildSetEntryId("entry-fixture-1"),
            memberLabel: "PvE",
            role: null,
            memberKind: "player",
            memberKindLabel: null,
            notes: null
          },
          {
            id: partySlotId("slot-b"),
            entryId: buildSetEntryId("entry-fixture-2"),
            memberLabel: "PvP",
            role: null,
            memberKind: "guest",
            memberKindLabel: null,
            notes: null
          }
        ]
      }
    });
    const mixed = {
      ...snapshot,
      entries: snapshot.entries.map((entry) =>
        entry.id === buildSetEntryId("entry-fixture-2")
          ? {
              ...entry,
              snapshot: {
                ...entry.snapshot,
                build: {
                  ...entry.snapshot.build,
                  mode: "pvp" as const
                }
              }
            }
          : entry
      )
    };
    const view = selectPartyValidationView(mixed, catalogs);
    const codes = view?.issues.map((issue) => issue.code) ?? [];

    expect(codes).toContain("party-mixed-known-modes");
    expect(codes.some((code) => code.includes("synergy") || code.includes("recommend"))).toBe(
      false
    );
  });
});
