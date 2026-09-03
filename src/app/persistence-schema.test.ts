import { describe, expect, it } from "vitest";

import {
  BUILD_SCHEMA_VERSION,
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  unresolvedEquipmentSelection,
  type EquipmentLoadout,
  type RuneId,
  type WeaponId,
  type WeaponModifierId
} from "../domain";
import { createBlankEditorState } from "./editor-state";
import {
  corruptRecordEnvelopeFixture,
  duplicateIdEnvelopeFixture,
  oversizedEnvelopeFixture,
  unsupportedEnvelopeFixture,
  validLocalLibraryEnvelopeFixture,
  validPartyBuildSetSnapshotFixture,
  validSavedRecordFixture,
  validWorkingDraftFixture,
  validSnapshotFixture
} from "./library-fixtures";
import {
  LOCAL_LIBRARY_KIND,
  LOCAL_LIBRARY_STORAGE_KEY,
  PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION,
  createPersistedBuildSnapshot,
  fingerprintPersistedSnapshot,
  hydrateEditorFromSnapshot,
  parseLocalLibraryEnvelope,
  parseLocalLibraryJson,
  persistedBuildSetDocument,
  selectedPersistedBuildSnapshot,
  serializeLocalLibraryEnvelope,
  type PersistedSavedDocumentRecord,
  type PersistedBuildSetSnapshot,
  type PersistedWorkingDraft
} from "./persistence-schema";

describe("local persistence schema", () => {
  it("uses exactly one documented MVP storage key and a versioned envelope", () => {
    const parsed = parseLocalLibraryEnvelope(validLocalLibraryEnvelopeFixture());

    expect(LOCAL_LIBRARY_STORAGE_KEY).toBe("build-wars:v1");
    expect(parsed.ok ? parsed.envelope.kind : null).toBe(LOCAL_LIBRARY_KIND);
    expect(parsed.ok ? parsed.envelope.schemaVersion : null).toBe(2);
  });

  it("round-trips durable build, PvE budget, raw template source, and unresolved overlays", () => {
    const envelope = validLocalLibraryEnvelopeFixture();
    const text = serializeLocalLibraryEnvelope(envelope);
    const parsed = parseLocalLibraryJson(text);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const unresolved = parsed.envelope.savedDocuments.find(
      (record) => record.name === "Unresolved import"
    );
    const snapshot = recordSnapshot(unresolved);
    expect(snapshot?.pveBudget).toEqual({ level: 20, questBonus: "maximum-applicable" });
    expect(snapshot?.rawTemplate.source?.originalBareCode).toBe("OAAQIAAAAAAAAAAAAAAA");
    expect(snapshot?.rawTemplate.skillBar[1]?.templateId).toBe(999999);
    expect(Number(snapshot?.build.skillBar[1])).toBe(-200001);
    expect(unresolved?.savedWith.ruleEngineVersion).toBe("rule-engine:v3");
  });

  it("migrates schema-1 builds to runtime schema 2 without marking the library write-blocked", () => {
    const parsed = parseLocalLibraryEnvelope(legacySchemaOneEnvelopeFixture());

    expect(parsed.ok).toBe(true);
    expect(parsed.writeBlocked).toBe(false);
    expect(
      parsed.ok ? draftSnapshot(parsed.envelope.workingDraft)?.build.schemaVersion : null
    ).toBe(BUILD_SCHEMA_VERSION);
    expect(
      parsed.ok ? draftSnapshot(parsed.envelope.workingDraft)?.build.titleRankOverrides : null
    ).toEqual([]);
    expect(
      parsed.ok ? recordSnapshot(parsed.envelope.savedDocuments[0])?.build.titleRankOverrides : null
    ).toEqual([]);
  });

  it("hydrates durable snapshots into fresh editor UI defaults instead of persisted UI state", () => {
    const source = {
      ...createBlankEditorState("Browser State Must Not Persist"),
      browser: {
        ...createBlankEditorState().browser,
        filters: {
          ...createBlankEditorState().browser.filters,
          query: "transient search"
        },
        batchSize: 999
      },
      dialogs: {
        open: "import" as const,
        importInput: "transient",
        exportName: "transient"
      },
      selectedSlotIndex: 3
    };
    const snapshot = createPersistedBuildSnapshot(source);
    const hydrated = hydrateEditorFromSnapshot(snapshot);

    expect(hydrated.build.name).toBe("Browser State Must Not Persist");
    expect(hydrated.browser.filters.query).toBe("");
    expect(hydrated.browser.batchSize).toBe(48);
    expect(hydrated.dialogs.open).toBeNull();
    expect(hydrated.dialogs.importInput).toBe("");
    expect(hydrated.selectedSlotIndex).toBeNull();
  });

  it("deterministically serializes equivalent envelopes regardless of object key order", () => {
    const envelope = validLocalLibraryEnvelopeFixture();
    const reordered = {
      metadata: envelope.metadata,
      savedDocuments: envelope.savedDocuments,
      workingDraft: envelope.workingDraft,
      updatedAt: envelope.updatedAt,
      revision: envelope.revision,
      kind: envelope.kind,
      schemaVersion: envelope.schemaVersion
    };

    expect(serializeLocalLibraryEnvelope(envelope)).toBe(serializeLocalLibraryEnvelope(reordered));
  });

  it("rejects unsupported, dangerous, and oversized roots with bounded diagnostics", () => {
    const unsupported = parseLocalLibraryEnvelope(unsupportedEnvelopeFixture());
    const dangerous = parseLocalLibraryJson(
      JSON.stringify(validLocalLibraryEnvelopeFixture()).replace(
        '"savedDocuments":[',
        '"savedDocuments":[{"__proto__":"bad"},'
      )
    );
    const oversized = parseLocalLibraryEnvelope(oversizedEnvelopeFixture());

    expect(unsupported.ok).toBe(false);
    expect(unsupported.diagnostics[0]?.code).toBe("unsupported-schema-version");
    expect(dangerous.ok).toBe(false);
    expect(dangerous.diagnostics[0]?.code).toBe("dangerous-key");
    expect(oversized.ok).toBe(false);
    expect(oversized.diagnostics[0]?.code).toBe("oversized-collection");
    expect(oversized.diagnostics.length).toBeLessThanOrEqual(24);
  });

  it("partially recovers invalid subsets and duplicate IDs into write-blocked state", () => {
    const corruptRecord = parseLocalLibraryEnvelope(corruptRecordEnvelopeFixture());
    const duplicate = parseLocalLibraryEnvelope(duplicateIdEnvelopeFixture());

    expect(corruptRecord.ok).toBe(true);
    expect(corruptRecord.ok ? corruptRecord.envelope.savedDocuments : []).toHaveLength(1);
    expect(corruptRecord.writeBlocked).toBe(true);
    expect(duplicate.ok).toBe(true);
    expect(duplicate.ok ? duplicate.envelope.savedDocuments : []).toHaveLength(1);
    expect(duplicate.writeBlocked).toBe(true);
  });

  it("rejects malformed JSON without returning a replacement envelope", () => {
    const parsed = parseLocalLibraryJson("{");

    expect(parsed.ok).toBe(false);
    expect(parsed.diagnostics[0]?.code).toBe("malformed-json");
  });

  it("round-trips canonical semantic equipment through snapshots and parsing", () => {
    const state = createBlankEditorState();
    const equipment = canonicalEquipmentFixture();
    const snapshot = createPersistedBuildSnapshot({
      ...state,
      build: { ...state.build, equipment }
    });
    const parsed = parseLocalLibraryEnvelope(
      validLocalLibraryEnvelopeFixture({
        workingDraft: {
          ...validWorkingDraftFixture({ snapshot }),
          associatedRecordId: null
        },
        savedDocuments: [validSavedRecordFixture({ snapshot })]
      })
    );

    expect(snapshot.build.equipment).not.toBe(equipment);
    expect(snapshot.build.equipment?.armor[0]?.rune).toEqual(knownEquipmentSelection(101));
    expect(parsed.ok).toBe(true);
    expect(parsed.ok ? draftSnapshot(parsed.envelope.workingDraft)?.build.equipment : null).toEqual(
      snapshot.build.equipment
    );
    expect(
      parsed.ok ? recordSnapshot(parsed.envelope.savedDocuments[0])?.build.equipment : null
    ).toEqual(snapshot.build.equipment);
    expect(fingerprintPersistedSnapshot(snapshot)).not.toBe(
      fingerprintPersistedSnapshot(validSnapshotFixture())
    );
  });

  it("round-trips canonical title overrides through snapshots and parsing", () => {
    const state = createBlankEditorState();
    const snapshot = createPersistedBuildSnapshot({
      ...state,
      build: {
        ...state.build,
        titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }]
      }
    });
    const parsed = parseLocalLibraryEnvelope(
      validLocalLibraryEnvelopeFixture({
        workingDraft: {
          ...validWorkingDraftFixture({ snapshot }),
          associatedRecordId: null
        },
        savedDocuments: [validSavedRecordFixture({ snapshot })]
      })
    );

    expect(snapshot.build.titleRankOverrides).toEqual([
      { key: "title:lightbringer-rank", rank: 4 }
    ]);
    expect(parsed.ok).toBe(true);
    expect(
      parsed.ok ? draftSnapshot(parsed.envelope.workingDraft)?.build.titleRankOverrides : null
    ).toEqual(snapshot.build.titleRankOverrides);
    expect(
      parsed.ok ? recordSnapshot(parsed.envelope.savedDocuments[0])?.build.titleRankOverrides : null
    ).toEqual(snapshot.build.titleRankOverrides);
  });

  it("round-trips persisted build-set snapshot v2 party annotations", () => {
    const buildSet = validPartyBuildSetSnapshotFixture();
    const parsed = parseLocalLibraryEnvelope(
      validLocalLibraryEnvelopeFixture({
        workingDraft: validWorkingDraftFixture({
          document: persistedBuildSetDocument(buildSet)
        }),
        savedDocuments: [validSavedRecordFixture({ document: persistedBuildSetDocument(buildSet) })]
      })
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const draft =
      parsed.envelope.workingDraft?.document.kind === "build-set"
        ? parsed.envelope.workingDraft.document.snapshot
        : null;
    const record =
      parsed.envelope.savedDocuments[0]?.document.kind === "build-set"
        ? parsed.envelope.savedDocuments[0].document.snapshot
        : null;

    expect(draft?.schemaVersion).toBe(PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION);
    expect(draft?.party).toEqual(buildSet.party);
    expect(draft?.lastSelectedPartySlotId).toBe(buildSet.lastSelectedPartySlotId);
    expect(record?.party).toEqual(buildSet.party);
    expect(selectedPersistedBuildSnapshot(persistedBuildSetDocument(buildSet))?.build.name).toBe(
      buildSet.entries[0]?.snapshot.build.name
    );
  });

  it("migrates legacy neutral build-set snapshots to v2 without party data", () => {
    const legacy = legacyBuildSetSnapshotV1(validPartyBuildSetSnapshotFixture({ party: null }));
    const parsed = parseLocalLibraryEnvelope(
      validLocalLibraryEnvelopeFixture({
        workingDraft: validWorkingDraftFixture({
          document: {
            kind: "build-set",
            snapshot: legacy as PersistedBuildSetSnapshot
          }
        }),
        savedDocuments: []
      })
    );

    expect(parsed.ok).toBe(true);
    expect(parsed.writeBlocked).toBe(false);
    expect(
      parsed.ok && parsed.envelope.workingDraft?.document.kind === "build-set"
        ? parsed.envelope.workingDraft.document.snapshot
        : null
    ).toMatchObject({
      schemaVersion: PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION,
      party: null,
      lastSelectedPartySlotId: null
    });
  });

  it("rejects malformed party annotations instead of erasing them", () => {
    const malformed = {
      ...validPartyBuildSetSnapshotFixture(),
      party: {
        ...validPartyBuildSetSnapshotFixture().party,
        slots: [
          {
            ...validPartyBuildSetSnapshotFixture().party!.slots[0],
            entryId: "missing-entry"
          },
          validPartyBuildSetSnapshotFixture().party!.slots[1]
        ]
      }
    };
    const parsed = parseLocalLibraryEnvelope(
      validLocalLibraryEnvelopeFixture({
        savedDocuments: [
          validSavedRecordFixture({
            document: persistedBuildSetDocument(malformed as PersistedBuildSetSnapshot)
          })
        ]
      })
    );

    expect(parsed.ok).toBe(true);
    expect(parsed.writeBlocked).toBe(true);
    expect(parsed.ok ? parsed.envelope.savedDocuments : []).toHaveLength(0);
    expect(parsed.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      "missing-party-entry-reference"
    );
  });

  it("rejects malformed persisted title overrides with bounded diagnostics", () => {
    expect(
      parseSingleTitleOverrides([
        { key: "title:lightbringer-rank", rank: 1 },
        { key: "title:lightbringer-rank", rank: 2 }
      ]).codes
    ).toContain("duplicate-title-rank-override");
    expect(parseSingleTitleOverrides([{ key: "__proto__", rank: 1 }]).codes).toContain(
      "invalid-title-rank-key"
    );
    expect(
      parseSingleTitleOverrides([{ key: "title:lightbringer-rank", rank: 1.5 }]).codes
    ).toContain("invalid-number");
    expect(
      parseSingleTitleOverrides(
        Array.from({ length: 33 }, (_, index) => ({ key: `title:stale-${index}`, rank: 1 }))
      ).codes
    ).toContain("oversized-collection");
  });

  it("rejects malformed persisted equipment with bounded diagnostics", () => {
    expect(parseSingleEquipment({ anything: true }).codes).toContain("invalid-equipment-topology");
    expect(
      parseSingleEquipment({
        ...canonicalEquipmentFixture(),
        armor: canonicalEquipmentFixture().armor.toReversed()
      }).codes
    ).toContain("noncanonical-equipment-topology");
    expect(
      parseSingleEquipment({
        ...canonicalEquipmentFixture(),
        weaponSets: [
          {
            ...canonicalEquipmentFixture().weaponSets[0]!,
            mainHand: { weapon: null, modifiers: [], requirement: null }
          },
          ...canonicalEquipmentFixture().weaponSets.slice(1)
        ]
      }).codes
    ).toContain("noncanonical-equipment-topology");
    expect(
      parseSingleEquipment({
        ...canonicalEquipmentFixture(),
        weaponSets: [
          {
            ...canonicalEquipmentFixture().weaponSets[0]!,
            mainHand: {
              weapon: knownEquipmentSelection(301 as WeaponId),
              modifiers: [
                knownEquipmentSelection(401 as WeaponModifierId),
                knownEquipmentSelection(401 as WeaponModifierId)
              ],
              requirement: null
            }
          },
          ...canonicalEquipmentFixture().weaponSets.slice(1)
        ]
      }).codes
    ).toContain("duplicate-equipment-selection");
    expect(
      parseSingleEquipment({
        ...canonicalEquipmentFixture(),
        weaponSets: [
          {
            ...canonicalEquipmentFixture().weaponSets[0]!,
            mainHand: {
              weapon: knownEquipmentSelection(301 as WeaponId),
              modifiers: Array.from({ length: 17 }, (_, index) =>
                knownEquipmentSelection((401 + index) as WeaponModifierId)
              ),
              requirement: null
            }
          },
          ...canonicalEquipmentFixture().weaponSets.slice(1)
        ]
      }).codes
    ).toContain("oversized-collection");
  });
});

function canonicalEquipmentFixture(): EquipmentLoadout {
  const base = createEmptyEquipmentLoadout();
  return {
    ...base,
    armor: base.armor.map((piece) =>
      piece.slot === "head"
        ? {
            ...piece,
            rune: knownEquipmentSelection(101 as RuneId),
            headgearAttribute: unresolvedEquipmentSelection({
              label: "Retained attribute",
              reason: "catalog unresolved",
              candidateCatalogId: 17
            })
          }
        : piece
    ),
    weaponSets: base.weaponSets.map((set) =>
      set.slot === "set-1"
        ? {
            ...set,
            mainHand: {
              weapon: knownEquipmentSelection(301 as WeaponId),
              modifiers: [knownEquipmentSelection(401 as WeaponModifierId)],
              requirement: null
            }
          }
        : set
    )
  };
}

function legacySchemaOneEnvelopeFixture(): unknown {
  const current = validLocalLibraryEnvelopeFixture();
  const envelope = {
    schemaVersion: 1,
    kind: current.kind,
    revision: current.revision,
    updatedAt: current.updatedAt,
    workingDraft:
      current.workingDraft === null
        ? null
        : {
            snapshot: draftSnapshot(current.workingDraft),
            associatedRecordId: current.workingDraft.associatedRecordId,
            savedWith: current.workingDraft.savedWith
          },
    savedBuilds: current.savedDocuments.map((record) => ({
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      favorite: record.favorite,
      tags: record.tags,
      notes: record.notes,
      snapshot: recordSnapshot(record),
      savedWith: record.savedWith
    })),
    metadata: current.metadata
  } as {
    workingDraft: { snapshot: { build: Record<string, unknown> } | null } | null;
    savedBuilds: { snapshot: { build: Record<string, unknown> } | null }[];
  } & Record<string, unknown>;
  const builds = [
    ...(envelope.workingDraft?.snapshot?.build === undefined
      ? []
      : [envelope.workingDraft.snapshot.build]),
    ...envelope.savedBuilds.flatMap((record) =>
      record.snapshot?.build === undefined ? [] : [record.snapshot.build]
    )
  ] as Record<string, unknown>[];
  for (const build of builds) {
    build.schemaVersion = 1;
    delete build.titleRankOverrides;
  }
  return envelope;
}

function draftSnapshot(draft: PersistedWorkingDraft | null | undefined) {
  return draft === null || draft === undefined
    ? null
    : selectedPersistedBuildSnapshot(draft.document);
}

function recordSnapshot(record: PersistedSavedDocumentRecord | undefined) {
  return record === undefined ? null : selectedPersistedBuildSnapshot(record.document);
}

function legacyBuildSetSnapshotV1(snapshot: PersistedBuildSetSnapshot): unknown {
  return {
    schemaVersion: 1,
    id: snapshot.id,
    name: snapshot.name,
    entries: snapshot.entries,
    lastSelectedEntryId: snapshot.lastSelectedEntryId
  };
}

function parseSingleTitleOverrides(overrides: unknown): { readonly codes: readonly string[] } {
  const snapshot = validSnapshotFixture();
  const parsed = parseLocalLibraryEnvelope(
    validLocalLibraryEnvelopeFixture({
      savedDocuments: [
        validSavedRecordFixture({
          snapshot: {
            ...snapshot,
            build: {
              ...snapshot.build,
              titleRankOverrides: overrides as never
            }
          }
        })
      ]
    })
  );

  expect(parsed.ok).toBe(true);
  expect(parsed.writeBlocked).toBe(true);
  return { codes: parsed.diagnostics.map((issue) => issue.code) };
}

function parseSingleEquipment(equipment: unknown): { readonly codes: readonly string[] } {
  const snapshot = validSnapshotFixture();
  const parsed = parseLocalLibraryEnvelope(
    validLocalLibraryEnvelopeFixture({
      savedDocuments: [
        validSavedRecordFixture({
          snapshot: {
            ...snapshot,
            build: {
              ...snapshot.build,
              equipment: equipment as EquipmentLoadout
            }
          }
        })
      ]
    })
  );

  expect(parsed.ok).toBe(true);
  expect(parsed.writeBlocked).toBe(true);
  return { codes: parsed.diagnostics.map((issue) => issue.code) };
}
