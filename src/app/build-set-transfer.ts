import { containsBuildSetDangerousKey, type BuildSetEntryId } from "../domain";
import {
  LOCAL_LIBRARY_KIND,
  LOCAL_LIBRARY_SCHEMA_VERSION,
  clonePersistedBuildSetSnapshot,
  parseLocalLibraryEnvelope,
  persistedBuildSetDocument,
  type PersistenceDiagnostic,
  type PersistedBuildSetSnapshot,
  type PersistedCatalogFacts
} from "./persistence-schema";

export const BUILD_SET_TRANSFER_KIND = "build-wars-build-set-transfer";
export const BUILD_SET_TRANSFER_SCHEMA_VERSION = 1;
export const BUILD_SET_TRANSFER_MAX_BYTES = 240_000;

export interface BuildSetTransferEnvelopeV1 {
  readonly schemaVersion: typeof BUILD_SET_TRANSFER_SCHEMA_VERSION;
  readonly kind: typeof BUILD_SET_TRANSFER_KIND;
  readonly exportedAt: string;
  readonly buildSet: PersistedBuildSetSnapshot;
  readonly metadata: {
    readonly declaredEntryCount: number;
  };
}

export type BuildSetTransferParseResult =
  | {
      readonly ok: true;
      readonly envelope: BuildSetTransferEnvelopeV1;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly serializedBytes: number;
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly serializedBytes: number;
    };

export interface BuildSetTransferPreview {
  readonly id: string;
  readonly envelope: BuildSetTransferEnvelopeV1;
  readonly diagnostics: readonly PersistenceDiagnostic[];
  readonly serializedBytes: number;
  readonly filename: string;
  readonly entryCount: number;
  readonly selectedEntryId: BuildSetEntryId | null;
  readonly applied: boolean;
}

export type BuildSetTransferPreviewResult =
  | {
      readonly ok: true;
      readonly preview: BuildSetTransferPreview;
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly serializedBytes: number;
    };

export type BuildSetTransferApplyResult =
  | {
      readonly ok: true;
      readonly preview: BuildSetTransferPreview;
      readonly snapshot: PersistedBuildSetSnapshot;
    }
  | {
      readonly ok: false;
      readonly preview: BuildSetTransferPreview;
      readonly reason: string;
    };

const EMPTY_FACTS: PersistedCatalogFacts = {
  buildCatalogVersion: null,
  professionAttributeCatalogVersion: null,
  skillCatalogVersion: null,
  ruleEngineVersion: null
};

export function createBuildSetTransferEnvelope(input: {
  readonly buildSet: PersistedBuildSetSnapshot;
  readonly exportedAt: string;
}): BuildSetTransferEnvelopeV1 {
  const buildSet = clonePersistedBuildSetSnapshot(input.buildSet);
  return {
    schemaVersion: BUILD_SET_TRANSFER_SCHEMA_VERSION,
    kind: BUILD_SET_TRANSFER_KIND,
    exportedAt: input.exportedAt,
    buildSet,
    metadata: {
      declaredEntryCount: buildSet.entries.length
    }
  };
}

export function serializeBuildSetTransferEnvelope(envelope: BuildSetTransferEnvelopeV1): string {
  return JSON.stringify(stableJson(envelope), null, 2);
}

export function sanitizeBuildSetTransferFilename(name: string, exportedAt: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  const date = exportedAt.slice(0, 10).replace(/[^0-9]/g, "") || "unknown-date";
  return `build-wars-${slug.length === 0 ? "build-set" : slug}-${date}.json`;
}

export function parseBuildSetTransferJson(text: string): BuildSetTransferParseResult {
  const serializedBytes = utf8ByteLength(text);
  if (serializedBytes > BUILD_SET_TRANSFER_MAX_BYTES) {
    return {
      ok: false,
      serializedBytes,
      diagnostics: [
        diagnostic(
          "oversized-transfer",
          "$",
          `Build-set transfer JSON exceeds the ${BUILD_SET_TRANSFER_MAX_BYTES} byte limit.`
        )
      ]
    };
  }
  try {
    return parseBuildSetTransferEnvelope(JSON.parse(text) as unknown, serializedBytes);
  } catch {
    return {
      ok: false,
      serializedBytes,
      diagnostics: [diagnostic("malformed-json", "$", "Build-set transfer JSON is malformed.")]
    };
  }
}

export function parseBuildSetTransferEnvelope(
  input: unknown,
  serializedBytes = utf8ByteLength(JSON.stringify(input))
): BuildSetTransferParseResult {
  if (containsBuildSetDangerousKey(input)) {
    return {
      ok: false,
      serializedBytes,
      diagnostics: [
        diagnostic(
          "dangerous-key",
          "$",
          "Build-set transfer data contains a key that is not accepted."
        )
      ]
    };
  }
  if (!isRecord(input)) {
    return {
      ok: false,
      serializedBytes,
      diagnostics: [diagnostic("invalid-object", "$", "Build-set transfer root must be an object.")]
    };
  }
  if (input.kind !== BUILD_SET_TRANSFER_KIND) {
    return {
      ok: false,
      serializedBytes,
      diagnostics: [
        diagnostic("invalid-kind", "$.kind", "JSON is not a Build Wars build-set transfer.")
      ]
    };
  }
  if (input.schemaVersion !== BUILD_SET_TRANSFER_SCHEMA_VERSION) {
    return {
      ok: false,
      serializedBytes,
      diagnostics: [
        diagnostic(
          "unsupported-schema-version",
          "$.schemaVersion",
          "Build-set transfer schema version is not supported."
        )
      ]
    };
  }
  const exportedAt = typeof input.exportedAt === "string" ? input.exportedAt : null;
  if (exportedAt === null || Number.isNaN(Date.parse(exportedAt))) {
    return {
      ok: false,
      serializedBytes,
      diagnostics: [
        diagnostic("invalid-timestamp", "$.exportedAt", "Build-set transfer timestamp is invalid.")
      ]
    };
  }
  const parsed = parseLocalLibraryEnvelope({
    schemaVersion: LOCAL_LIBRARY_SCHEMA_VERSION,
    kind: LOCAL_LIBRARY_KIND,
    revision: 0,
    updatedAt: exportedAt,
    workingDraft: {
      document: persistedBuildSetDocument(input.buildSet as PersistedBuildSetSnapshot),
      associatedRecordId: null,
      savedWith: EMPTY_FACTS
    },
    savedDocuments: [],
    metadata: {}
  });
  if (!parsed.ok || parsed.envelope.workingDraft?.document.kind !== "build-set") {
    return { ok: false, serializedBytes, diagnostics: parsed.diagnostics };
  }
  const buildSet = parsed.envelope.workingDraft.document.snapshot;
  return {
    ok: true,
    serializedBytes,
    envelope: {
      schemaVersion: BUILD_SET_TRANSFER_SCHEMA_VERSION,
      kind: BUILD_SET_TRANSFER_KIND,
      exportedAt,
      buildSet,
      metadata: {
        declaredEntryCount: buildSet.entries.length
      }
    },
    diagnostics: parsed.diagnostics
  };
}

export function previewBuildSetTransferJson(
  text: string,
  id = `build-set-transfer-${Date.now()}`
): BuildSetTransferPreviewResult {
  const parsed = parseBuildSetTransferJson(text);
  if (!parsed.ok) {
    return parsed;
  }
  return {
    ok: true,
    preview: {
      id,
      envelope: parsed.envelope,
      diagnostics: parsed.diagnostics,
      serializedBytes: parsed.serializedBytes,
      filename: sanitizeBuildSetTransferFilename(
        parsed.envelope.buildSet.name,
        parsed.envelope.exportedAt
      ),
      entryCount: parsed.envelope.buildSet.entries.length,
      selectedEntryId: parsed.envelope.buildSet.lastSelectedEntryId,
      applied: false
    }
  };
}

export function applyBuildSetTransferPreview(
  preview: BuildSetTransferPreview
): BuildSetTransferApplyResult {
  if (preview.applied) {
    return { ok: false, preview, reason: "Build-set transfer preview has already been applied." };
  }
  return {
    ok: true,
    preview: { ...preview, applied: true },
    snapshot: clonePersistedBuildSetSnapshot(preview.envelope.buildSet)
  };
}

function diagnostic(code: string, path: string, message: string): PersistenceDiagnostic {
  return { code, path, message };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function utf8ByteLength(text: string): number {
  return typeof TextEncoder === "undefined" ? text.length : new TextEncoder().encode(text).length;
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
