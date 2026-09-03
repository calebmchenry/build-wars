import {
  PARTY_ANNOTATION_SCHEMA_VERSION,
  authoredDocumentId,
  buildSetEntryId,
  catalogId,
  partySlotId
} from "../domain";
import { importedUnresolvedEditorFixture, playableEditorFixture } from "./editor-fixtures";
import {
  LOCAL_LIBRARY_KIND,
  LOCAL_LIBRARY_SCHEMA_VERSION,
  PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION,
  createPersistedBuildSnapshot,
  emptyLocalLibraryEnvelope,
  localBuildRecordId,
  persistedBuildDocument,
  type LocalLibraryEnvelopeV1,
  type PersistedDocument,
  type PersistedBuildSetSnapshot,
  type PersistedBuildSnapshot,
  type PersistedCatalogFacts,
  type PersistedSavedBuildRecord,
  type PersistedWorkingDraft
} from "./persistence-schema";

export const FIXED_LIBRARY_NOW = "2026-09-02T19:25:41Z";

export const fixtureCatalogFacts: PersistedCatalogFacts = {
  buildCatalogVersion: "fixture-builds",
  professionAttributeCatalogVersion: "fixture-professions-attributes",
  skillCatalogVersion: "fixture-skills",
  runeCatalogVersion: "fixture-runes",
  insigniaCatalogVersion: "fixture-insignias",
  weaponCatalogVersion: "fixture-weapons",
  weaponModifierCatalogVersion: "fixture-weapon-mods",
  weaponCatalogSetVersion: "fixture-weapon-set",
  weaponCatalogSetDigest: "fixture-weapon-set-digest",
  weaponModifierCatalogSetVersion: "fixture-weapon-set",
  weaponModifierCatalogSetDigest: "fixture-weapon-set-digest",
  ruleEngineVersion: "rule-engine:v3"
};

export function validSnapshotFixture(): PersistedBuildSnapshot {
  return createPersistedBuildSnapshot(playableEditorFixture());
}

export function unresolvedSnapshotFixture(): PersistedBuildSnapshot {
  return createPersistedBuildSnapshot(importedUnresolvedEditorFixture());
}

export function validBuildSetSnapshotFixture(
  overrides: Partial<PersistedBuildSetSnapshot> = {}
): PersistedBuildSetSnapshot {
  const first = validSnapshotFixture();
  const second = unresolvedSnapshotFixture();
  return {
    schemaVersion: PERSISTED_BUILD_SET_SNAPSHOT_SCHEMA_VERSION,
    id: overrides.id ?? authoredDocumentId("build-set-fixture"),
    name: overrides.name ?? "Fixture Build Set",
    lastSelectedEntryId: overrides.lastSelectedEntryId ?? buildSetEntryId("entry-fixture-1"),
    party: overrides.party ?? null,
    lastSelectedPartySlotId: overrides.lastSelectedPartySlotId ?? null,
    entries: overrides.entries ?? [
      {
        id: buildSetEntryId("entry-fixture-1"),
        label: "Frontline",
        kind: "build",
        notes: "Main loadout",
        snapshot: first
      },
      {
        id: buildSetEntryId("entry-fixture-2"),
        label: "Unresolved Variant",
        kind: "variant",
        notes: null,
        snapshot: second
      }
    ]
  };
}

export function validPartyBuildSetSnapshotFixture(
  overrides: Partial<PersistedBuildSetSnapshot> = {}
): PersistedBuildSetSnapshot {
  const snapshot = validBuildSetSnapshotFixture(overrides);
  return {
    ...snapshot,
    party: overrides.party ?? {
      schemaVersion: PARTY_ANNOTATION_SCHEMA_VERSION,
      enabled: true,
      size: { kind: "preset", size: 2 },
      slots: [
        {
          id: partySlotId("slot-fixture-1"),
          entryId: buildSetEntryId("entry-fixture-1"),
          memberLabel: "Leader",
          role: "Frontline",
          memberKind: "player",
          memberKindLabel: null,
          notes: "Pulls first."
        },
        {
          id: partySlotId("slot-fixture-2"),
          entryId: null,
          memberLabel: "Open Slot",
          role: null,
          memberKind: "unspecified",
          memberKindLabel: null,
          notes: null
        }
      ]
    },
    lastSelectedPartySlotId: overrides.lastSelectedPartySlotId ?? partySlotId("slot-fixture-1")
  };
}

export function staleCatalogFactsFixture(): PersistedCatalogFacts {
  return {
    ...fixtureCatalogFacts,
    professionAttributeCatalogVersion: "fixture-professions-attributes:old",
    skillCatalogVersion: "fixture-skills:old"
  };
}

export function validSavedRecordFixture(
  overrides: Partial<PersistedSavedBuildRecord> & {
    readonly snapshot?: PersistedBuildSnapshot;
    readonly document?: PersistedDocument;
  } = {}
): PersistedSavedBuildRecord {
  const document =
    overrides.document ?? persistedBuildDocument(overrides.snapshot ?? validSnapshotFixture());
  return {
    id: overrides.id ?? localBuildRecordId("local-fixture-1"),
    name: overrides.name ?? documentName(document),
    createdAt: overrides.createdAt ?? FIXED_LIBRARY_NOW,
    updatedAt: overrides.updatedAt ?? FIXED_LIBRARY_NOW,
    favorite: overrides.favorite ?? false,
    tags: overrides.tags ?? ["farm", "warrior"],
    notes: hasOwn(overrides, "notes") ? (overrides.notes ?? null) : "Fixture record",
    document,
    savedWith: overrides.savedWith ?? fixtureCatalogFacts
  };
}

export function staleSavedRecordFixture(): PersistedSavedBuildRecord {
  return validSavedRecordFixture({
    id: localBuildRecordId("local-fixture-stale"),
    name: "Stale but valid",
    savedWith: staleCatalogFactsFixture()
  });
}

export function unresolvedSavedRecordFixture(): PersistedSavedBuildRecord {
  return validSavedRecordFixture({
    id: localBuildRecordId("local-fixture-unresolved"),
    name: "Unresolved import",
    snapshot: unresolvedSnapshotFixture(),
    tags: ["imported"],
    notes: null
  });
}

export function validBuildSetSavedRecordFixture(
  overrides: Partial<PersistedSavedBuildRecord> & {
    readonly snapshot?: PersistedBuildSetSnapshot;
  } = {}
): PersistedSavedBuildRecord {
  const { snapshot: buildSetSnapshot, ...recordOverrides } = overrides;
  const document: PersistedDocument = {
    kind: "build-set",
    snapshot: buildSetSnapshot ?? validBuildSetSnapshotFixture()
  };
  return validSavedRecordFixture({
    ...recordOverrides,
    document,
    name: recordOverrides.name ?? document.snapshot.name,
    tags: recordOverrides.tags ?? ["variants"],
    notes: hasOwn(recordOverrides, "notes") ? (recordOverrides.notes ?? null) : "Fixture set"
  });
}

export function validWorkingDraftFixture(
  overrides: Partial<PersistedWorkingDraft> & {
    readonly snapshot?: PersistedBuildSnapshot;
    readonly document?: PersistedDocument;
  } = {}
): PersistedWorkingDraft {
  return {
    document:
      overrides.document ?? persistedBuildDocument(overrides.snapshot ?? validSnapshotFixture()),
    associatedRecordId: overrides.associatedRecordId ?? null,
    savedWith: overrides.savedWith ?? fixtureCatalogFacts
  };
}

export function validLocalLibraryEnvelopeFixture(
  overrides: Partial<LocalLibraryEnvelopeV1> & {
    readonly savedBuilds?: readonly PersistedSavedBuildRecord[];
  } = {}
): LocalLibraryEnvelopeV1 {
  const workingDraft = hasOwn(overrides, "workingDraft")
    ? (overrides.workingDraft ?? null)
    : validWorkingDraftFixture();
  return {
    ...emptyLocalLibraryEnvelope(overrides.updatedAt ?? FIXED_LIBRARY_NOW),
    revision: overrides.revision ?? 3,
    workingDraft,
    savedDocuments: overrides.savedDocuments ??
      overrides.savedBuilds ?? [
        validSavedRecordFixture(),
        unresolvedSavedRecordFixture(),
        staleSavedRecordFixture()
      ],
    metadata: overrides.metadata ?? {
      lastWriteReason: "fixture",
      lastCompactedAt: null
    }
  };
}

function hasOwn(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function duplicateIdEnvelopeFixture(): unknown {
  const first = validSavedRecordFixture({ id: localBuildRecordId("local-duplicate") });
  const second = validSavedRecordFixture({
    id: localBuildRecordId("local-duplicate"),
    name: "Duplicate ID"
  });
  return {
    ...validLocalLibraryEnvelopeFixture(),
    savedDocuments: [first, second]
  };
}

export function unsupportedEnvelopeFixture(): unknown {
  return {
    schemaVersion: 999,
    kind: LOCAL_LIBRARY_KIND,
    revision: 1,
    updatedAt: FIXED_LIBRARY_NOW,
    workingDraft: null,
    savedDocuments: [],
    metadata: {}
  };
}

export function corruptRecordEnvelopeFixture(): unknown {
  return {
    ...validLocalLibraryEnvelopeFixture(),
    savedDocuments: [
      validSavedRecordFixture(),
      {
        id: "bad",
        name: "",
        createdAt: FIXED_LIBRARY_NOW,
        updatedAt: "not-a-date",
        favorite: false,
        tags: [],
        notes: null,
        document: null,
        savedWith: fixtureCatalogFacts
      }
    ]
  };
}

export function oversizedEnvelopeFixture(): unknown {
  return {
    schemaVersion: LOCAL_LIBRARY_SCHEMA_VERSION,
    kind: LOCAL_LIBRARY_KIND,
    revision: 1,
    updatedAt: FIXED_LIBRARY_NOW,
    workingDraft: null,
    savedDocuments: Array.from({ length: 251 }, (_, index) =>
      validSavedRecordFixture({ id: localBuildRecordId(`local-${index}`) })
    ),
    metadata: {}
  };
}

export function largeLibraryEnvelopeFixture(count = 25): LocalLibraryEnvelopeV1 {
  return validLocalLibraryEnvelopeFixture({
    savedDocuments: Array.from({ length: count }, (_, index) =>
      validSavedRecordFixture({
        id: localBuildRecordId(`local-large-${index}`),
        name: `Fixture Build ${index.toString().padStart(2, "0")}`,
        updatedAt: `2026-09-02T19:${String(index).padStart(2, "0")}:00Z`,
        favorite: index % 2 === 0,
        tags: index % 2 === 0 ? ["farm"] : ["support"],
        snapshot: {
          ...validSnapshotFixture(),
          build: {
            ...validSnapshotFixture().build,
            name: `Fixture Build ${index.toString().padStart(2, "0")}`,
            primaryProfessionId: catalogId<"Profession">((index % 2) + 1)
          }
        }
      })
    )
  });
}

export function corruptLocalLibraryJsonFixture(): string {
  return "{not-json";
}

export function legacyLocalLibraryEnvelopeV1Fixture(): unknown {
  const envelope = validLocalLibraryEnvelopeFixture();
  const legacyWorkingDraft =
    envelope.workingDraft === null
      ? null
      : {
          snapshot:
            envelope.workingDraft.document.kind === "build"
              ? envelope.workingDraft.document.snapshot
              : envelope.workingDraft.document.snapshot.entries[0]?.snapshot,
          associatedRecordId: envelope.workingDraft.associatedRecordId,
          savedWith: envelope.workingDraft.savedWith
        };
  return {
    schemaVersion: 1,
    kind: LOCAL_LIBRARY_KIND,
    revision: envelope.revision,
    updatedAt: envelope.updatedAt,
    workingDraft: legacyWorkingDraft,
    savedBuilds: envelope.savedDocuments.map((record) => ({
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      favorite: record.favorite,
      tags: record.tags,
      notes: record.notes,
      snapshot:
        record.document.kind === "build"
          ? record.document.snapshot
          : record.document.snapshot.entries[0]?.snapshot,
      savedWith: record.savedWith
    })),
    metadata: envelope.metadata
  };
}

function documentName(document: PersistedDocument): string {
  return document.kind === "build" ? document.snapshot.build.name : document.snapshot.name;
}
