import { describe, expect, it } from "vitest";
import {
  authoredDocumentId,
  buildSetEntryId,
  catalogId,
  cloneBuildForBuildSetEntry,
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  type AttributeAdjustments
} from "../domain";
import { adjustmentProfileFixture } from "./attribute-adjustment-fixtures";
import {
  validLocalLibraryEnvelopeFixture,
  validPartyBuildSetSnapshotFixture,
  validSavedRecordFixture,
  fixtureCatalogFacts,
  validWorkingDraftFixture
} from "./library-fixtures";
import {
  clonePersistedBuildSetSnapshot,
  parseLocalLibraryEnvelope,
  parseLocalLibraryJson,
  serializeLocalLibraryEnvelope,
  persistedBuildSetDocument
} from "./persistence-schema";
import {
  createBuildSetTransferEnvelope,
  parseBuildSetTransferJson,
  serializeBuildSetTransferEnvelope,
  BUILD_SET_TRANSFER_MAX_BYTES
} from "./build-set-transfer";
import {
  createPartyTransferEnvelope,
  parsePartyTransferJson,
  serializePartyTransferEnvelope,
  PARTY_TRANSFER_MAX_BYTES
} from "./party-transfer";
import { createBackupEnvelope, parseBackupJson, serializeBackupEnvelope } from "./backup-restore";

const NOW = "2026-09-14T01:50:00Z";
function transformBuilds(
  input: unknown,
  change: (build: Record<string, unknown>) => void
): unknown {
  const copy: unknown = JSON.parse(JSON.stringify(input));
  function visit(value: unknown) {
    if (typeof value !== "object" || value === null) return;
    const record = value as Record<string, unknown>;
    if ("equipment" in record && "skillBar" in record) change(record);
    Object.values(record).forEach(visit);
  }
  visit(copy);
  return copy;
}

describe("Build v3 persistence and complete-document boundaries", () => {
  it.each([1, 2])(
    "migrates nested v%i neutrally while preserving other authored evidence",
    (version) => {
      const original = validLocalLibraryEnvelopeFixture();
      const input = transformBuilds(original, (b) => {
        b.schemaVersion = version;
        delete b.attributeAdjustments;
        if (version === 1) delete b.titleRankOverrides;
      });
      const parsed = parseLocalLibraryEnvelope(input);
      expect(parsed.ok).toBe(true);
      expect(parsed.writeBlocked).toBe(false);
      const expected = transformBuilds(original, (b) => {
        b.attributeAdjustments = null;
        if (version === 1) b.titleRankOverrides = [];
      });
      expect(parsed.ok ? parsed.envelope : null).toEqual(expected);
    }
  );
  it.each([
    (b: Record<string, unknown>) => {
      b.schemaVersion = 4;
    },
    (b: Record<string, unknown>) => {
      delete b.attributeAdjustments;
    },
    (b: Record<string, unknown>) => {
      b.schemaVersion = 2;
    },
    (b: Record<string, unknown>) => {
      b.attributeAdjustments = { ...adjustmentProfileFixture(), unsupported: true };
    },
    (b: Record<string, unknown>) => {
      b.attributeAdjustments = {
        ...adjustmentProfileFixture(),
        effectPreferences: [{ effectId: "heroic-refrain", preference: "on", strength: 5 }]
      };
    }
  ])("blocks unsafe writes for corrupt/future fields %#", (change) => {
    const input = transformBuilds(validLocalLibraryEnvelopeFixture(), change);
    const parsed = parseLocalLibraryEnvelope(input);
    expect(parsed.writeBlocked).toBe(true);
    expect(parsed.diagnostics.length).toBeGreaterThan(0);
  });
  it("clones non-default active/inactive state independently and rejects future inactive transfers", () => {
    const snapshot = validPartyBuildSetSnapshotFixture();
    const cloned = clonePersistedBuildSetSnapshot(snapshot);
    expect(cloned).toEqual(snapshot);
    expect(cloned.entries[1]?.snapshot.build.attributeAdjustments).not.toBe(
      snapshot.entries[1]?.snapshot.build.attributeAdjustments
    );
    const build = snapshot.entries[0]!.snapshot.build;
    expect(
      cloneBuildForBuildSetEntry(build, authoredDocumentId("copy")).attributeAdjustments
    ).toEqual(build.attributeAdjustments);
    const transfer = createBuildSetTransferEnvelope({ buildSet: snapshot, exportedAt: NOW });
    const invalid = {
      ...transfer,
      buildSet: {
        ...snapshot,
        entries: snapshot.entries.map((entry, index) =>
          index === 1
            ? {
                ...entry,
                snapshot: {
                  ...entry.snapshot,
                  build: { ...entry.snapshot.build, schemaVersion: 4 }
                }
              }
            : entry
        )
      }
    };
    expect(parseBuildSetTransferJson(JSON.stringify(invalid)).ok).toBe(false);
  });
  it("round-trips 16 maximum-size profiles with representative equipment/title/raw metadata through both transfers and backups", () => {
    const profile: AttributeAdjustments = {
      headgearOverride: { kind: "none" },
      runeOverrides: Array.from({ length: 64 }, (_, i) => ({
        attributeId: catalogId<"Attribute">(i),
        runeId: i % 2 === 0 ? null : catalogId<"Rune">(90000 + i)
      })),
      effectPreferences: [
        { effectId: "glyph-of-elemental-power", preference: "off" },
        { effectId: "elemental-lord", preference: "on" },
        { effectId: "masochism", preference: "off" },
        { effectId: "heroic-refrain", preference: "on", strength: 4 }
      ]
    };
    const seed = validPartyBuildSetSnapshotFixture();
    const snapshot = {
      ...seed,
      entries: Array.from({ length: 16 }, (_, index) => ({
        ...seed.entries[index % 2]!,
        id: buildSetEntryId(`max-${index}`),
        label: `Loadout ${index}`,
        notes: "Retained notes",
        snapshot: {
          ...seed.entries[index % 2]!.snapshot,
          build: {
            ...seed.entries[index % 2]!.snapshot.build,
            equipment: {
              ...createEmptyEquipmentLoadout(),
              armor: createEmptyEquipmentLoadout().armor.map((piece) =>
                piece.slot === "head"
                  ? {
                      ...piece,
                      headgearAttribute: knownEquipmentSelection(catalogId<"Attribute">(0)),
                      rune: knownEquipmentSelection(catalogId<"Rune">(22))
                    }
                  : piece
              )
            },
            id: authoredDocumentId(`max-build-${index}`),
            attributeAdjustments: profile,
            titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 3 }]
          }
        }
      })),
      lastSelectedEntryId: buildSetEntryId("max-0"),
      party: {
        ...seed.party!,
        slots: seed.party!.slots.map((slot, index) => ({
          ...slot,
          entryId: buildSetEntryId(`max-${index}`)
        }))
      }
    };
    const buildSetText = serializeBuildSetTransferEnvelope(
      createBuildSetTransferEnvelope({ buildSet: snapshot, exportedAt: NOW })
    );
    const partyText = serializePartyTransferEnvelope(
      createPartyTransferEnvelope({ buildSet: snapshot, exportedAt: NOW })!
    );
    expect(new TextEncoder().encode(buildSetText).length).toBeLessThan(
      BUILD_SET_TRANSFER_MAX_BYTES
    );
    expect(new TextEncoder().encode(partyText).length).toBeLessThan(PARTY_TRANSFER_MAX_BYTES);
    const a = parseBuildSetTransferJson(buildSetText);
    const b = parsePartyTransferJson(partyText);
    expect(a.ok, JSON.stringify(a.diagnostics)).toBe(true);
    expect(a.ok ? a.envelope.buildSet : null).toEqual(snapshot);
    expect(b.ok ? b.envelope.buildSet : null).toEqual(snapshot);
    const document = persistedBuildSetDocument(snapshot);
    const backup = createBackupEnvelope({
      exportedAt: NOW,
      savedDocuments: [validSavedRecordFixture({ document })],
      workingDraft: validWorkingDraftFixture({ document }),
      savedWith: fixtureCatalogFacts
    });
    const parsed = parseBackupJson(serializeBackupEnvelope(backup));
    expect(parsed.ok ? parsed.backup.savedDocuments[0]?.document : null).toEqual(document);
    expect(
      parseBuildSetTransferJson(buildSetText + " ".repeat(BUILD_SET_TRANSFER_MAX_BYTES)).ok
    ).toBe(false);
    expect(parsePartyTransferJson(partyText + " ".repeat(PARTY_TRANSFER_MAX_BYTES)).ok).toBe(false);
  });
  it("retains distinct profiles including explicit zero/None/off through local JSON", () => {
    const envelope = validLocalLibraryEnvelopeFixture();
    const parsed = parseLocalLibraryJson(serializeLocalLibraryEnvelope(envelope));
    expect(parsed.ok ? parsed.envelope : null).toEqual(envelope);
  });
});
