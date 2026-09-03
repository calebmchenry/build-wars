import { containsBuildSetDangerousKey } from "../domain";
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

export const PARTY_TRANSFER_KIND = "build-wars-party-transfer";
export const PARTY_TRANSFER_SCHEMA_VERSION = 1;
export const PARTY_TRANSFER_MAX_BYTES = 240_000;

export interface PartyTransferEnvelopeV1 {
  readonly schemaVersion: typeof PARTY_TRANSFER_SCHEMA_VERSION;
  readonly kind: typeof PARTY_TRANSFER_KIND;
  readonly exportedAt: string;
  readonly buildSet: PersistedBuildSetSnapshot;
  readonly metadata: {
    readonly declaredEntryCount: number;
    readonly declaredSlotCount: number;
  };
}

export type PartyTransferParseResult =
  | {
      readonly ok: true;
      readonly envelope: PartyTransferEnvelopeV1;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly serializedBytes: number;
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly serializedBytes: number;
    };

export interface PartyTransferPreview {
  readonly id: string;
  readonly envelope: PartyTransferEnvelopeV1;
  readonly diagnostics: readonly PersistenceDiagnostic[];
  readonly serializedBytes: number;
  readonly filename: string;
  readonly entryCount: number;
  readonly slotCount: number;
  readonly applied: boolean;
}

export type PartyTransferPreviewResult =
  | {
      readonly ok: true;
      readonly preview: PartyTransferPreview;
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly serializedBytes: number;
    };

export type PartyTransferApplyResult =
  | {
      readonly ok: true;
      readonly preview: PartyTransferPreview;
      readonly snapshot: PersistedBuildSetSnapshot;
    }
  | {
      readonly ok: false;
      readonly preview: PartyTransferPreview;
      readonly reason: string;
    };

const EMPTY_FACTS: PersistedCatalogFacts = {
  buildCatalogVersion: null,
  professionAttributeCatalogVersion: null,
  skillCatalogVersion: null,
  ruleEngineVersion: null
};

export function createPartyTransferEnvelope(input: {
  readonly buildSet: PersistedBuildSetSnapshot;
  readonly exportedAt: string;
}): PartyTransferEnvelopeV1 | null {
  if (input.buildSet.party?.enabled !== true) {
    return null;
  }
  const buildSet = clonePersistedBuildSetSnapshot(input.buildSet);
  return {
    schemaVersion: PARTY_TRANSFER_SCHEMA_VERSION,
    kind: PARTY_TRANSFER_KIND,
    exportedAt: input.exportedAt,
    buildSet,
    metadata: {
      declaredEntryCount: buildSet.entries.length,
      declaredSlotCount: buildSet.party?.slots.length ?? 0
    }
  };
}

export function serializePartyTransferEnvelope(envelope: PartyTransferEnvelopeV1): string {
  return JSON.stringify(stableJson(envelope), null, 2);
}

export function sanitizePartyTransferFilename(name: string, exportedAt: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  const date = exportedAt.slice(0, 10).replace(/[^0-9]/g, "") || "unknown-date";
  return `build-wars-${slug.length === 0 ? "party" : slug}-party-${date}.json`;
}

export function parsePartyTransferJson(text: string): PartyTransferParseResult {
  const serializedBytes = utf8ByteLength(text);
  if (serializedBytes > PARTY_TRANSFER_MAX_BYTES) {
    return {
      ok: false,
      serializedBytes,
      diagnostics: [
        diagnostic(
          "oversized-transfer",
          "$",
          `Party transfer JSON exceeds the ${PARTY_TRANSFER_MAX_BYTES} byte limit.`
        )
      ]
    };
  }
  try {
    return parsePartyTransferEnvelope(JSON.parse(text) as unknown, serializedBytes);
  } catch {
    return {
      ok: false,
      serializedBytes,
      diagnostics: [diagnostic("malformed-json", "$", "Party transfer JSON is malformed.")]
    };
  }
}

export function parsePartyTransferEnvelope(
  input: unknown,
  serializedBytes = utf8ByteLength(JSON.stringify(input))
): PartyTransferParseResult {
  if (containsBuildSetDangerousKey(input)) {
    return fail(
      serializedBytes,
      "dangerous-key",
      "$",
      "Party transfer data contains a key that is not accepted."
    );
  }
  if (!isRecord(input)) {
    return fail(serializedBytes, "invalid-object", "$", "Party transfer root must be an object.");
  }
  if (input.kind !== PARTY_TRANSFER_KIND) {
    return fail(
      serializedBytes,
      "invalid-kind",
      "$.kind",
      "JSON is not a Build Wars party transfer."
    );
  }
  if (input.schemaVersion !== PARTY_TRANSFER_SCHEMA_VERSION) {
    return fail(
      serializedBytes,
      "unsupported-schema-version",
      "$.schemaVersion",
      "Party transfer schema version is not supported."
    );
  }
  const exportedAt = typeof input.exportedAt === "string" ? input.exportedAt : null;
  if (exportedAt === null || Number.isNaN(Date.parse(exportedAt))) {
    return fail(
      serializedBytes,
      "invalid-timestamp",
      "$.exportedAt",
      "Party transfer timestamp is invalid."
    );
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
  if (buildSet.party?.enabled !== true) {
    return fail(
      serializedBytes,
      "party-not-enabled",
      "$.buildSet.party",
      "Party transfer requires an enabled party annotation."
    );
  }
  return {
    ok: true,
    serializedBytes,
    envelope: {
      schemaVersion: PARTY_TRANSFER_SCHEMA_VERSION,
      kind: PARTY_TRANSFER_KIND,
      exportedAt,
      buildSet,
      metadata: {
        declaredEntryCount: buildSet.entries.length,
        declaredSlotCount: buildSet.party.slots.length
      }
    },
    diagnostics: parsed.diagnostics
  };
}

export function previewPartyTransferJson(
  text: string,
  id = `party-transfer-${Date.now()}`
): PartyTransferPreviewResult {
  const parsed = parsePartyTransferJson(text);
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
      filename: sanitizePartyTransferFilename(
        parsed.envelope.buildSet.name,
        parsed.envelope.exportedAt
      ),
      entryCount: parsed.envelope.buildSet.entries.length,
      slotCount: parsed.envelope.buildSet.party?.slots.length ?? 0,
      applied: false
    }
  };
}

export function applyPartyTransferPreview(preview: PartyTransferPreview): PartyTransferApplyResult {
  if (preview.applied) {
    return { ok: false, preview, reason: "Party transfer preview has already been applied." };
  }
  return {
    ok: true,
    preview: { ...preview, applied: true },
    snapshot: clonePersistedBuildSetSnapshot(preview.envelope.buildSet)
  };
}

function fail(
  serializedBytes: number,
  code: string,
  path: string,
  message: string
): PartyTransferParseResult {
  return { ok: false, serializedBytes, diagnostics: [diagnostic(code, path, message)] };
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
