import type { EditorState } from "./editor-state";
import {
  LOCAL_LIBRARY_KIND,
  LOCAL_LIBRARY_SCHEMA_VERSION,
  hydrateEditorFromSnapshot,
  localBuildRecordId,
  parseLocalLibraryEnvelope,
  type LocalBuildRecordId,
  type PersistenceDiagnostic,
  type PersistedCatalogFacts,
  type PersistedSavedBuildRecord,
  type PersistedWorkingDraft
} from "./persistence-schema";

export const BACKUP_KIND = "build-wars-library-backup";
export const BACKUP_SCHEMA_VERSION = 1;

export type RestoreMode = "merge" | "replace";

export interface LocalLibraryBackupEnvelopeV1 {
  readonly schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  readonly kind: typeof BACKUP_KIND;
  readonly exportedAt: string;
  readonly savedBuilds: readonly PersistedSavedBuildRecord[];
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
  readonly acceptedRecords: readonly PersistedSavedBuildRecord[];
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
      readonly records: readonly PersistedSavedBuildRecord[];
      readonly draftEditor: EditorState | null;
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
  readonly savedBuilds: readonly PersistedSavedBuildRecord[];
  readonly workingDraft: PersistedWorkingDraft | null;
  readonly savedWith: PersistedCatalogFacts;
}): LocalLibraryBackupEnvelopeV1 {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    kind: BACKUP_KIND,
    exportedAt: input.exportedAt,
    savedBuilds: input.savedBuilds,
    workingDraft: input.workingDraft,
    savedWith: input.savedWith,
    metadata: {
      sourceStorageKey: "build-wars:v1",
      declaredRecordCount: input.savedBuilds.length
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
  if (!isRecord(input)) {
    return fail("invalid-object", "$", "Backup root must be an object.");
  }
  if (input.kind !== BACKUP_KIND) {
    return fail("invalid-kind", "$.kind", "Backup is not a Build Wars library backup.");
  }
  if (input.schemaVersion !== BACKUP_SCHEMA_VERSION) {
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
  const declaredRecordCount = Array.isArray(input.savedBuilds) ? input.savedBuilds.length : 0;
  const parsed = parseLocalLibraryEnvelope({
    schemaVersion: LOCAL_LIBRARY_SCHEMA_VERSION,
    kind: LOCAL_LIBRARY_KIND,
    revision: 0,
    updatedAt: exportedAt,
    workingDraft: input.workingDraft ?? null,
    savedBuilds: input.savedBuilds,
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
      savedBuilds: parsed.envelope.savedBuilds,
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
  readonly currentRecords: readonly PersistedSavedBuildRecord[];
  readonly nextId: (sourceId: LocalBuildRecordId) => LocalBuildRecordId;
  readonly diagnostics?: readonly PersistenceDiagnostic[];
  readonly id?: string;
}): RestorePreviewPlan {
  const currentIds = new Set(input.currentRecords.map((record) => record.id));
  const seenIncoming = new Set<string>();
  const duplicateBackupIds: LocalBuildRecordId[] = [];
  const currentIdConflicts: LocalBuildRecordId[] = [];
  const idRemaps: RestoreIdRemap[] = [];
  const acceptedRecords = input.backup.savedBuilds.map((record) => {
    if (seenIncoming.has(record.id)) {
      duplicateBackupIds.push(record.id);
      const to = input.nextId(record.id);
      idRemaps.push({ from: record.id, to, reason: "duplicate-backup-id" });
      seenIncoming.add(to);
      return { ...record, id: to };
    }
    seenIncoming.add(record.id);
    if (currentIds.has(record.id)) {
      currentIdConflicts.push(record.id);
      const to = input.nextId(record.id);
      idRemaps.push({ from: record.id, to, reason: "current-id-conflict" });
      return { ...record, id: to };
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
    readonly currentRecords: readonly PersistedSavedBuildRecord[];
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
    draftEditor: restoredDraft === null ? null : hydrateEditorFromSnapshot(restoredDraft.snapshot),
    draftAssociation: restoredDraft?.associatedRecordId ?? null,
    importedCount: plan.acceptedRecords.length,
    remappedCount: plan.idRemaps.length,
    skippedCount: plan.skippedRecords.length
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
