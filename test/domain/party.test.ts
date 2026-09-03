import { describe, expect, it } from "vitest";

import {
  PARTY_ANNOTATION_SCHEMA_VERSION,
  PARTY_SIZE_PRESETS,
  buildSetEntryId,
  createPartyAnnotationsForEntries,
  createPartySlotAnnotation,
  movePartySlot,
  partySizeForSlotCount,
  partySlotId,
  resizePartyAnnotations,
  setPartySlotKind,
  unassignedPartyEntryIds,
  validatePartyAnnotations
} from "../../src/domain";

describe("party annotations", () => {
  it("models party semantics as slot annotations over build-set entries", () => {
    const party = createPartyAnnotationsForEntries({
      entries: [
        { id: buildSetEntryId("entry-a"), label: "Frontline" },
        { id: buildSetEntryId("entry-b"), label: "Backline" }
      ],
      slotIds: [partySlotId("slot-a"), partySlotId("slot-b")]
    });

    expect(party).toEqual({
      schemaVersion: PARTY_ANNOTATION_SCHEMA_VERSION,
      enabled: true,
      size: { kind: "preset", size: 2 },
      slots: [
        {
          id: partySlotId("slot-a"),
          entryId: buildSetEntryId("entry-a"),
          memberLabel: "Frontline",
          role: null,
          memberKind: "unspecified",
          memberKindLabel: null,
          notes: null
        },
        {
          id: partySlotId("slot-b"),
          entryId: buildSetEntryId("entry-b"),
          memberLabel: "Backline",
          role: null,
          memberKind: "unspecified",
          memberKindLabel: null,
          notes: null
        }
      ]
    });
    expect(JSON.stringify(party)).not.toContain('"build"');
  });

  it("uses four empty slots for an empty set and custom sizing for non-preset counts", () => {
    const empty = createPartyAnnotationsForEntries({
      entries: [],
      slotIds: [
        partySlotId("slot-1"),
        partySlotId("slot-2"),
        partySlotId("slot-3"),
        partySlotId("slot-4")
      ]
    });
    const three = createPartyAnnotationsForEntries({
      entries: [
        { id: buildSetEntryId("entry-1") },
        { id: buildSetEntryId("entry-2") },
        { id: buildSetEntryId("entry-3") }
      ]
    });

    expect(PARTY_SIZE_PRESETS).toEqual([2, 4, 6, 8, 12]);
    expect(empty.size).toEqual({ kind: "preset", size: 4 });
    expect(empty.slots.map((slot) => slot.entryId)).toEqual([null, null, null, null]);
    expect(three.size).toEqual({ kind: "custom", size: 3 });
    expect(partySizeForSlotCount(12)).toEqual({ kind: "preset", size: 12 });
  });

  it("normalizes display-only member metadata without changing the entry reference", () => {
    const slot = createPartySlotAnnotation({
      id: partySlotId("slot"),
      index: 0,
      entryId: buildSetEntryId("entry"),
      memberLabel: "  " + "A".repeat(130),
      role: "  midline  ",
      memberKind: "freeform",
      memberKindLabel: "  ritualist helper  ",
      notes: "  bring fallback res  "
    });
    const normalized = setPartySlotKind(
      {
        schemaVersion: PARTY_ANNOTATION_SCHEMA_VERSION,
        enabled: true,
        size: { kind: "preset", size: 2 },
        slots: [slot, createPartySlotAnnotation({ id: partySlotId("slot-2"), index: 1 })]
      },
      partySlotId("slot"),
      "hero",
      "ignored freeform label"
    );

    expect(slot.memberLabel).toHaveLength(120);
    expect(slot.role).toBe("midline");
    expect(slot.memberKindLabel).toBe("ritualist helper");
    expect(normalized.slots[0]?.entryId).toBe(buildSetEntryId("entry"));
    expect(normalized.slots[0]?.memberKindLabel).toBeNull();
  });

  it("keeps party slot order independent from unassigned entry projection", () => {
    const party = createPartyAnnotationsForEntries({
      entries: [{ id: buildSetEntryId("entry-a") }, { id: buildSetEntryId("entry-b") }],
      slotIds: [partySlotId("slot-a"), partySlotId("slot-b")]
    });
    const moved = movePartySlot(party, partySlotId("slot-b"), "earlier");

    expect(moved.slots.map((slot) => slot.id)).toEqual([
      partySlotId("slot-b"),
      partySlotId("slot-a")
    ]);
    expect(
      unassignedPartyEntryIds(moved, [
        { id: buildSetEntryId("entry-a") },
        { id: buildSetEntryId("entry-b") },
        { id: buildSetEntryId("entry-c") }
      ])
    ).toEqual([buildSetEntryId("entry-c")]);
  });

  it("blocks destructive shrink when removed slots contain entries or metadata", () => {
    const party = createPartyAnnotationsForEntries({
      entries: [
        { id: buildSetEntryId("entry-a") },
        { id: buildSetEntryId("entry-b") },
        { id: buildSetEntryId("entry-c") },
        { id: buildSetEntryId("entry-d") }
      ]
    });
    const blocked = resizePartyAnnotations(party, { size: { kind: "preset", size: 2 } });
    const clearedTail = {
      ...party,
      slots: party.slots.map((slot, index) =>
        index < 2
          ? slot
          : {
              ...slot,
              entryId: null,
              memberLabel: `Member ${index + 1}`,
              role: null,
              memberKind: "unspecified" as const,
              memberKindLabel: null,
              notes: null
            }
      )
    };
    const shrunk = resizePartyAnnotations(clearedTail, { size: { kind: "preset", size: 2 } });

    expect(blocked.slots).toHaveLength(4);
    expect(shrunk.slots).toHaveLength(2);
  });

  it("diagnoses duplicate slots, duplicate assignments, missing references, and size drift", () => {
    const party = {
      schemaVersion: PARTY_ANNOTATION_SCHEMA_VERSION,
      enabled: true,
      size: { kind: "preset" as const, size: 4 as const },
      slots: [
        createPartySlotAnnotation({
          id: partySlotId("slot-a"),
          index: 0,
          entryId: buildSetEntryId("entry-a")
        }),
        createPartySlotAnnotation({
          id: partySlotId("slot-a"),
          index: 1,
          entryId: buildSetEntryId("entry-a")
        })
      ]
    } as const;

    expect(
      validatePartyAnnotations(party, {
        entries: [{ id: buildSetEntryId("entry-b") }],
        includeEmptySlotIssues: true
      }).map((issue) => issue.code)
    ).toEqual([
      "party-size-mismatch",
      "missing-party-entry-reference",
      "duplicate-party-entry-assignment",
      "missing-party-entry-reference",
      "duplicate-party-slot-id"
    ]);
  });
});
