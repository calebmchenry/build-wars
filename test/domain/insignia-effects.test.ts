import { describe, expect, it } from "vitest";

import {
  resolveInsigniaEffectsForArmorSlot,
  type CatalogInsigniaRecord,
  type InsigniaCatalog
} from "../../src/domain";
import golden from "../fixtures/data-ingestion/generated/fixture-insignias.catalog.json";

const catalog = golden as unknown as InsigniaCatalog;

function record(name: string): CatalogInsigniaRecord {
  const insignia = catalog.insignias.find((candidate) => candidate.name === name);
  if (insignia === undefined) {
    throw new Error(`Missing ${name}`);
  }
  return insignia;
}

describe("insignia armor slot projection", () => {
  it("resolves exact per-slot numeric outcomes without evaluating legality or conditions", () => {
    const result = resolveInsigniaEffectsForArmorSlot(record("Survivor Insignia"), "chest");

    expect(result.unresolved).toEqual([]);
    expect(result.effects[0]?.outcome).toMatchObject({
      kind: "value",
      amount: 15,
      unit: "health"
    });
  });

  it("preserves note-only and unknown effects as unresolved facts", () => {
    const note = resolveInsigniaEffectsForArmorSlot(record("Bloodstained Insignia"), "head");

    expect(note.effects[0]?.kind).toBe("note-only");
    expect(note.effects[0]?.outcome).toBeNull();
    expect(note.unresolved.map((item) => item.code)).toEqual(["note-only-effect"]);
  });

  it("reports inapplicable slots and malformed numeric outcomes without mutating input", () => {
    const survivor = record("Survivor Insignia");
    const modified = {
      ...survivor,
      applicableSlots: ["chest"],
      effects: survivor.effects.map((effect) =>
        "slotOutcomes" in effect
          ? {
              ...effect,
              slotOutcomes: {
                ...effect.slotOutcomes,
                head: {
                  kind: "unresolved" as const,
                  reason: "fixture unresolved",
                  provenance: effect.provenance
                }
              }
            }
          : effect
      )
    } satisfies CatalogInsigniaRecord;
    const before = JSON.stringify(modified);

    const result = resolveInsigniaEffectsForArmorSlot(modified, "head");

    expect(result.unresolved.map((item) => item.code)).toEqual([
      "inapplicable-slot",
      "numeric-effect-unresolved"
    ]);
    expect(JSON.stringify(modified)).toBe(before);
  });
});
