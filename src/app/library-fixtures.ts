import { catalogId } from "../domain";
import { importedUnresolvedEditorFixture, playableEditorFixture } from "./editor-fixtures";
import {
  LOCAL_LIBRARY_KIND,
  LOCAL_LIBRARY_SCHEMA_VERSION,
  createPersistedBuildSnapshot,
  emptyLocalLibraryEnvelope,
  localBuildRecordId,
  type LocalLibraryEnvelopeV1,
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
  ruleEngineVersion: "rule-engine:v2"
};

export function validSnapshotFixture(): PersistedBuildSnapshot {
  return createPersistedBuildSnapshot(playableEditorFixture());
}

export function unresolvedSnapshotFixture(): PersistedBuildSnapshot {
  return createPersistedBuildSnapshot(importedUnresolvedEditorFixture());
}

export function staleCatalogFactsFixture(): PersistedCatalogFacts {
  return {
    ...fixtureCatalogFacts,
    professionAttributeCatalogVersion: "fixture-professions-attributes:old",
    skillCatalogVersion: "fixture-skills:old"
  };
}

export function validSavedRecordFixture(
  overrides: Partial<PersistedSavedBuildRecord> = {}
): PersistedSavedBuildRecord {
  const snapshot = overrides.snapshot ?? validSnapshotFixture();
  return {
    id: overrides.id ?? localBuildRecordId("local-fixture-1"),
    name: overrides.name ?? snapshot.build.name,
    createdAt: overrides.createdAt ?? FIXED_LIBRARY_NOW,
    updatedAt: overrides.updatedAt ?? FIXED_LIBRARY_NOW,
    favorite: overrides.favorite ?? false,
    tags: overrides.tags ?? ["farm", "warrior"],
    notes: hasOwn(overrides, "notes") ? (overrides.notes ?? null) : "Fixture record",
    snapshot,
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

export function validWorkingDraftFixture(
  overrides: Partial<PersistedWorkingDraft> = {}
): PersistedWorkingDraft {
  return {
    snapshot: overrides.snapshot ?? validSnapshotFixture(),
    associatedRecordId: overrides.associatedRecordId ?? null,
    savedWith: overrides.savedWith ?? fixtureCatalogFacts
  };
}

export function validLocalLibraryEnvelopeFixture(
  overrides: Partial<LocalLibraryEnvelopeV1> = {}
): LocalLibraryEnvelopeV1 {
  const workingDraft = hasOwn(overrides, "workingDraft")
    ? (overrides.workingDraft ?? null)
    : validWorkingDraftFixture();
  return {
    ...emptyLocalLibraryEnvelope(overrides.updatedAt ?? FIXED_LIBRARY_NOW),
    revision: overrides.revision ?? 3,
    workingDraft,
    savedBuilds: overrides.savedBuilds ?? [
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
    savedBuilds: [first, second]
  };
}

export function unsupportedEnvelopeFixture(): unknown {
  return {
    schemaVersion: 999,
    kind: LOCAL_LIBRARY_KIND,
    revision: 1,
    updatedAt: FIXED_LIBRARY_NOW,
    workingDraft: null,
    savedBuilds: [],
    metadata: {}
  };
}

export function corruptRecordEnvelopeFixture(): unknown {
  return {
    ...validLocalLibraryEnvelopeFixture(),
    savedBuilds: [
      validSavedRecordFixture(),
      {
        id: "bad",
        name: "",
        createdAt: FIXED_LIBRARY_NOW,
        updatedAt: "not-a-date",
        favorite: false,
        tags: [],
        notes: null,
        snapshot: null,
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
    savedBuilds: Array.from({ length: 251 }, (_, index) =>
      validSavedRecordFixture({ id: localBuildRecordId(`local-${index}`) })
    ),
    metadata: {}
  };
}

export function largeLibraryEnvelopeFixture(count = 25): LocalLibraryEnvelopeV1 {
  return validLocalLibraryEnvelopeFixture({
    savedBuilds: Array.from({ length: count }, (_, index) =>
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
