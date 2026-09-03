import {
  authoredDocumentId,
  buildSetEntryId,
  containsBuildSetDangerousKey,
  partySlotId
} from "../domain";
import {
  LOCAL_LIBRARY_KIND,
  LOCAL_LIBRARY_SCHEMA_VERSION,
  localBuildRecordId,
  parseLocalLibraryEnvelope,
  type LocalBuildRecordId,
  type PersistenceDiagnostic,
  type PersistedCatalogFacts,
  type PersistedDocument,
  type PersistedSavedDocumentRecord,
  type PersistedWorkingDraft
} from "./persistence-schema";

export const BACKUP_KIND = "build-wars-library-backup";
export const BACKUP_SCHEMA_VERSION = 2;
export const LEGACY_BACKUP_SCHEMA_VERSION = 1;

export type RestoreMode = "merge" | "replace";

export interface LocalLibraryBackupEnvelopeV1 {
  readonly schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  readonly kind: typeof BACKUP_KIND;
  readonly exportedAt: string;
  readonly savedDocuments: readonly PersistedSavedDocumentRecord[];
  readonly workingDraft: PersistedWorkingDraft | null;
  readonly savedWith: PersistedCatalogFacts;
  readonly metadata: {
    readonly sourceStorageKey: "build-wars:v1";
    readonly declaredRecordCount: number;
  };
}

export type BackupParseResult =
  | {
      readonly ok: true;
      readonly backup: LocalLibraryBackupEnvelopeV1;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly declaredRecordCount: number;
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly PersistenceDiagnostic[];
    };

export interface RestoreIdRemap {
  readonly from: LocalBuildRecordId;
  readonly to: LocalBuildRecordId;
  readonly reason: "current-id-conflict" | "duplicate-backup-id";
}

export interface RestorePreviewPlan {
  readonly id: string;
  readonly backup: LocalLibraryBackupEnvelopeV1;
  readonly acceptedRecords: readonly PersistedSavedDocumentRecord[];
  readonly skippedRecords: readonly PersistenceDiagnostic[];
  readonly duplicateBackupIds: readonly LocalBuildRecordId[];
  readonly currentIdConflicts: readonly LocalBuildRecordId[];
  readonly idRemaps: readonly RestoreIdRemap[];
  readonly importedDraftAvailable: boolean;
  readonly declaredRecordCount: number;
  readonly mergeFinalCount: number;
  readonly replaceFinalCount: number;
  readonly applied: boolean;
}

export type RestoreApplyResult =
  | {
      readonly ok: true;
      readonly plan: RestorePreviewPlan;
      readonly records: readonly PersistedSavedDocumentRecord[];
      readonly draftDocument: PersistedDocument | null;
      readonly draftAssociation: LocalBuildRecordId | null;
      readonly importedCount: number;
      readonly remappedCount: number;
      readonly skippedCount: number;
    }
  | {
      readonly ok: false;
      readonly plan: RestorePreviewPlan;
      readonly reason: string;
    };

export function createBackupEnvelope(input: {
  readonly exportedAt: string;
  readonly savedDocuments?: readonly PersistedSavedDocumentRecord[];
  readonly savedBuilds?: readonly PersistedSavedDocumentRecord[];
  readonly workingDraft: PersistedWorkingDraft | null;
  readonly savedWith: PersistedCatalogFacts;
}): LocalLibraryBackupEnvelopeV1 {
  const savedDocuments = input.savedDocuments ?? input.savedBuilds ?? [];
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    kind: BACKUP_KIND,
    exportedAt: input.exportedAt,
    savedDocuments,
    workingDraft: input.workingDraft,
    savedWith: input.savedWith,
    metadata: {
      sourceStorageKey: "build-wars:v1",
      declaredRecordCount: savedDocuments.length
    }
  };
}

export function serializeBackupEnvelope(backup: LocalLibraryBackupEnvelopeV1): string {
  return JSON.stringify(stableJson(backup), null, 2);
}

export function parseBackupJson(text: string): BackupParseResult {
  try {
    return parseBackupEnvelope(JSON.parse(text) as unknown);
  } catch {
    return {
      ok: false,
      diagnostics: [
        {
          code: "malformed-json",
          path: "$",
          message: "Backup JSON is malformed."
        }
      ]
    };
  }
}

export function parseBackupEnvelope(input: unknown): BackupParseResult {
  if (containsBuildSetDangerousKey(input)) {
    return fail(
      "dangerous-key",
      "$",
      "Backup contains a key that is not accepted in Build Wars local data."
    );
  }
  if (!isRecord(input)) {
    return fail("invalid-object", "$", "Backup root must be an object.");
  }
  if (input.kind !== BACKUP_KIND) {
    return fail("invalid-kind", "$.kind", "Backup is not a Build Wars library backup.");
  }
  if (
    input.schemaVersion !== BACKUP_SCHEMA_VERSION &&
    input.schemaVersion !== LEGACY_BACKUP_SCHEMA_VERSION
  ) {
    return fail(
      "unsupported-schema-version",
      "$.schemaVersion",
      "Backup schema version is not supported."
    );
  }
  const exportedAt = typeof input.exportedAt === "string" ? input.exportedAt : null;
  if (exportedAt === null || Number.isNaN(Date.parse(exportedAt))) {
    return fail(
      "invalid-timestamp",
      "$.exportedAt",
      "Backup exportedAt must be a valid timestamp."
    );
  }
  const savedDocuments =
    input.schemaVersion === LEGACY_BACKUP_SCHEMA_VERSION
      ? migrateLegacyBackupRecords(input.savedBuilds)
      : input.savedDocuments;
  const workingDraft =
    input.schemaVersion === LEGACY_BACKUP_SCHEMA_VERSION
      ? migrateLegacyBackupDraft(input.workingDraft)
      : input.workingDraft;
  const declaredRecordCount = Array.isArray(savedDocuments) ? savedDocuments.length : 0;
  const parsed = parseLocalLibraryEnvelope({
    schemaVersion: LOCAL_LIBRARY_SCHEMA_VERSION,
    kind: LOCAL_LIBRARY_KIND,
    revision: 0,
    updatedAt: exportedAt,
    workingDraft: workingDraft ?? null,
    savedDocuments,
    metadata: {}
  });
  if (!parsed.ok) {
    return { ok: false, diagnostics: parsed.diagnostics };
  }
  const savedWith = catalogFactsFromBackup(input.savedWith);
  return {
    ok: true,
    backup: {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      kind: BACKUP_KIND,
      exportedAt,
      savedDocuments: parsed.envelope.savedDocuments,
      workingDraft: parsed.envelope.workingDraft,
      savedWith,
      metadata: {
        sourceStorageKey: "build-wars:v1",
        declaredRecordCount
      }
    },
    diagnostics: parsed.diagnostics,
    declaredRecordCount
  };
}

export function createRestorePreviewPlan(input: {
  readonly backup: LocalLibraryBackupEnvelopeV1;
  readonly currentRecords: readonly PersistedSavedDocumentRecord[];
  readonly nextId: (sourceId: LocalBuildRecordId) => LocalBuildRecordId;
  readonly diagnostics?: readonly PersistenceDiagnostic[];
  readonly id?: string;
}): RestorePreviewPlan {
  const currentIds = new Set(input.currentRecords.map((record) => record.id));
  const seenIncoming = new Set<string>();
  const duplicateBackupIds: LocalBuildRecordId[] = [];
  const currentIdConflicts: LocalBuildRecordId[] = [];
  const idRemaps: RestoreIdRemap[] = [];
  const acceptedRecords = input.backup.savedDocuments.map((record) => {
    if (seenIncoming.has(record.id)) {
      duplicateBackupIds.push(record.id);
      const to = input.nextId(record.id);
      idRemaps.push({ from: record.id, to, reason: "duplicate-backup-id" });
      seenIncoming.add(to);
      return { ...record, id: to, document: remapRecordDocument(record.document, to) };
    }
    seenIncoming.add(record.id);
    if (currentIds.has(record.id)) {
      currentIdConflicts.push(record.id);
      const to = input.nextId(record.id);
      idRemaps.push({ from: record.id, to, reason: "current-id-conflict" });
      return { ...record, id: to, document: remapRecordDocument(record.document, to) };
    }
    return record;
  });
  return {
    id: input.id ?? `restore-${Date.now()}`,
    backup: input.backup,
    acceptedRecords,
    skippedRecords: input.diagnostics ?? [],
    duplicateBackupIds,
    currentIdConflicts,
    idRemaps,
    importedDraftAvailable: input.backup.workingDraft !== null,
    declaredRecordCount: input.backup.metadata.declaredRecordCount,
    mergeFinalCount: input.currentRecords.length + acceptedRecords.length,
    replaceFinalCount: acceptedRecords.length,
    applied: false
  };
}

export function applyRestorePlan(
  plan: RestorePreviewPlan,
  input: {
    readonly currentRecords: readonly PersistedSavedDocumentRecord[];
    readonly mode: RestoreMode;
    readonly restoreWorkingDraft: boolean;
  }
): RestoreApplyResult {
  if (plan.applied) {
    return { ok: false, plan, reason: "Restore plan has already been applied." };
  }
  if (
    input.mode === "replace" &&
    plan.declaredRecordCount > 0 &&
    plan.acceptedRecords.length === 0
  ) {
    return {
      ok: false,
      plan,
      reason:
        "Replace restore cannot wipe the library because all declared backup records failed validation."
    };
  }
  const records =
    input.mode === "merge"
      ? [...input.currentRecords, ...plan.acceptedRecords]
      : [...plan.acceptedRecords];
  const restoredDraft = input.restoreWorkingDraft
    ? rewriteDraft(plan.backup.workingDraft, plan)
    : null;
  return {
    ok: true,
    plan: { ...plan, applied: true },
    records,
    draftDocument: restoredDraft === null ? null : restoredDraft.document,
    draftAssociation: restoredDraft?.associatedRecordId ?? null,
    importedCount: plan.acceptedRecords.length,
    remappedCount: plan.idRemaps.length,
    skippedCount: plan.skippedRecords.length
  };
}

function migrateLegacyBackupRecords(input: unknown): unknown {
  if (!Array.isArray(input)) {
    return input;
  }
  return input.map((item) => {
    const record = isRecord(item) ? item : null;
    if (record === null) {
      return item;
    }
    return {
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      favorite: record.favorite,
      tags: record.tags,
      notes: record.notes,
      document: {
        kind: "build",
        snapshot: record.snapshot
      },
      savedWith: record.savedWith
    };
  });
}

function migrateLegacyBackupDraft(input: unknown): unknown {
  if (input === null || input === undefined) {
    return null;
  }
  const record = isRecord(input) ? input : null;
  if (record === null) {
    return input;
  }
  return {
    document: {
      kind: "build",
      snapshot: record.snapshot
    },
    associatedRecordId: record.associatedRecordId,
    savedWith: record.savedWith
  };
}

function rewriteDraft(
  draft: PersistedWorkingDraft | null,
  plan: RestorePreviewPlan
): PersistedWorkingDraft | null {
  if (draft === null || draft.associatedRecordId === null) {
    return draft;
  }
  const remap = plan.idRemaps.find((candidate) => candidate.from === draft.associatedRecordId);
  return remap === undefined ? draft : { ...draft, associatedRecordId: remap.to };
}

function remapRecordDocument(
  document: PersistedDocument,
  newId: LocalBuildRecordId
): PersistedDocument {
  if (document.kind === "build") {
    return {
      kind: "build",
      snapshot: {
        ...document.snapshot,
        build: {
          ...document.snapshot.build,
          id: authoredDocumentId(`build:${newId}`)
        }
      }
    };
  }
  const entryIdPairs = document.snapshot.entries.map((entry, index) => ({
    from: entry.id,
    to: buildSetEntryId(`${newId}:entry-${index + 1}`)
  }));
  const entryIdMap = new Map(entryIdPairs.map((pair) => [pair.from, pair.to]));
  const slotIdMap = new Map(
    (document.snapshot.party?.slots ?? []).map((slot, index) => [
      slot.id,
      partySlotId(`${newId}:slot-${index + 1}`)
    ])
  );
  return {
    kind: "build-set",
    snapshot: {
      ...document.snapshot,
      id: authoredDocumentId(`build-set:${newId}`),
      entries: document.snapshot.entries.map((entry, index) => ({
        ...entry,
        id: entryIdPairs[index]?.to ?? buildSetEntryId(`${newId}:entry-${index + 1}`),
        snapshot: {
          ...entry.snapshot,
          build: {
            ...entry.snapshot.build,
            id: authoredDocumentId(`build:${newId}:entry-${index + 1}`)
          }
        }
      })),
      lastSelectedEntryId:
        document.snapshot.lastSelectedEntryId === null
          ? null
          : (entryIdMap.get(document.snapshot.lastSelectedEntryId) ?? null),
      party:
        document.snapshot.party === null
          ? null
          : {
              ...document.snapshot.party,
              slots: document.snapshot.party.slots.map((slot) => ({
                ...slot,
                id: slotIdMap.get(slot.id) ?? slot.id,
                entryId: slot.entryId === null ? null : (entryIdMap.get(slot.entryId) ?? null)
              }))
            },
      lastSelectedPartySlotId:
        document.snapshot.lastSelectedPartySlotId === null
          ? null
          : (slotIdMap.get(document.snapshot.lastSelectedPartySlotId) ?? null)
    }
  };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function catalogFactsFromBackup(input: unknown): PersistedCatalogFacts {
  if (!isRecord(input)) {
    return {
      buildCatalogVersion: null,
      professionAttributeCatalogVersion: null,
      skillCatalogVersion: null,
      ruleEngineVersion: null
    };
  }
  return {
    buildCatalogVersion: optionalString(input.buildCatalogVersion),
    professionAttributeCatalogVersion: optionalString(input.professionAttributeCatalogVersion),
    skillCatalogVersion: optionalString(input.skillCatalogVersion),
    runeCatalogVersion: optionalString(input.runeCatalogVersion),
    insigniaCatalogVersion: optionalString(input.insigniaCatalogVersion),
    weaponCatalogVersion: optionalString(input.weaponCatalogVersion),
    weaponModifierCatalogVersion: optionalString(input.weaponModifierCatalogVersion),
    weaponCatalogSetVersion: optionalString(input.weaponCatalogSetVersion),
    weaponCatalogSetDigest: optionalString(input.weaponCatalogSetDigest),
    weaponModifierCatalogSetVersion: optionalString(input.weaponModifierCatalogSetVersion),
    weaponModifierCatalogSetDigest: optionalString(input.weaponModifierCatalogSetDigest),
    ruleEngineVersion: optionalString(input.ruleEngineVersion)
  };
}

function optionalString(input: unknown): string | null {
  return typeof input === "string" ? input : null;
}

function fail(code: string, path: string, message: string): BackupParseResult {
  return {
    ok: false,
    diagnostics: [
      {
        code,
        path,
        message
      }
    ]
  };
}

function stableJson(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => stableJson(item));
  }
  if (typeof input === "object" && input !== null) {
    return Object.keys(input)
      .sort((left, right) => left.localeCompare(right, "en-US"))
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = stableJson((input as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return input;
}

export function restoreIdForTest(value: string): LocalBuildRecordId {
  return localBuildRecordId(value);
}
