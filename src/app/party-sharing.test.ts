import { describe, expect, it } from "vitest";

import { partySlotId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { validPartyBuildSetSnapshotFixture } from "./library-fixtures";
import { PARTY_MULTI_CODE_MAX_BYTES, projectPartyMultiCodeText } from "./party-sharing";

const catalogs = requireReadyCatalogs();

describe("party sharing", () => {
  it("projects every party slot with explicit code, empty, unavailable, and omission facts", () => {
    const projection = projectPartyMultiCodeText(validPartyBuildSetSnapshotFixture(), catalogs);

    expect(projection.ok).toBe(true);
    expect(projection.availableCount).toBe(1);
    expect(projection.emptyCount).toBe(1);
    expect(projection.unavailableCount).toBe(0);
    expect(projection.lossyCount).toBeGreaterThan(0);
    expect(projection.text).toContain("Build Wars Party Codes");
    expect(projection.text).toContain("Slot 1: Leader");
    expect(projection.text).toContain("Code:");
    expect(projection.text).toContain("Slot 2: Open Slot");
    expect(projection.text).toContain("State: EMPTY");
    expect(projection.text).toContain("Omitted: sibling members, party metadata");
    expect(projection.bytes).toBeLessThan(PARTY_MULTI_CODE_MAX_BYTES);
  });

  it("normalizes authored line breaks and reports missing references as unavailable", () => {
    const snapshot = validPartyBuildSetSnapshotFixture({
      name: "Party\r\nName",
      party: {
        ...validPartyBuildSetSnapshotFixture().party!,
        slots: [
          {
            ...validPartyBuildSetSnapshotFixture().party!.slots[0]!,
            memberLabel: "Leader\nForged",
            entryId: "missing-entry" as never
          },
          {
            ...validPartyBuildSetSnapshotFixture().party!.slots[1]!,
            id: partySlotId("slot-empty")
          }
        ]
      }
    });
    const projection = projectPartyMultiCodeText(snapshot, catalogs);

    expect(projection.ok).toBe(true);
    expect(projection.unavailableCount).toBe(1);
    expect(projection.text).toContain("Party: Party Name");
    expect(projection.text).toContain("Slot 1: Leader Forged");
    expect(projection.text).toContain("missing-entry-reference");
    expect(projection.text).not.toContain("\r");
  });
});
