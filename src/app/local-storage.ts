import {
  LOCAL_LIBRARY_STORAGE_KEY,
  emptyLocalLibraryEnvelope,
  parseLocalLibraryJson,
  prepareEnvelopeForWrite,
  serializeLocalLibraryEnvelope,
  type LocalLibraryEnvelopeV1,
  type PersistenceDiagnostic
} from "./persistence-schema";

export interface LocalStoragePort {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
}

export type LocalLibraryReadStatus = "empty" | "loaded" | "corrupt" | "unsupported" | "unavailable";
export type LocalLibraryWriteStatus =
  "written" | "unavailable" | "quota-exceeded" | "write-blocked" | "conflict";

export interface LocalLibraryReadResult {
  readonly status: LocalLibraryReadStatus;
  readonly envelope: LocalLibraryEnvelopeV1;
  readonly diagnostics: readonly PersistenceDiagnostic[];
  readonly writeBlocked: boolean;
}

export type LocalLibraryWriteResult =
  | {
      readonly ok: true;
      readonly status: "written";
      readonly envelope: LocalLibraryEnvelopeV1;
    }
  | {
      readonly ok: false;
      readonly status: Exclude<LocalLibraryWriteStatus, "written">;
      readonly envelope: LocalLibraryEnvelopeV1;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly message: string;
    };

export function browserLocalStorage(): LocalStoragePort | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readLocalLibrary(
  storage: LocalStoragePort | null | undefined = browserLocalStorage(),
  now = new Date().toISOString()
): LocalLibraryReadResult {
  const empty = emptyLocalLibraryEnvelope(now);
  if (storage === null || storage === undefined) {
    return {
      status: "unavailable",
      envelope: empty,
      diagnostics: [
        {
          code: "storage-unavailable",
          path: "$",
          message: "Browser localStorage is unavailable; edits remain in memory."
        }
      ],
      writeBlocked: false
    };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(LOCAL_LIBRARY_STORAGE_KEY);
  } catch {
    return {
      status: "unavailable",
      envelope: empty,
      diagnostics: [
        {
          code: "storage-unavailable",
          path: "$",
          message: "Browser localStorage could not be read; edits remain in memory."
        }
      ],
      writeBlocked: false
    };
  }
  if (raw === null) {
    return { status: "empty", envelope: empty, diagnostics: [], writeBlocked: false };
  }

  const parsed = parseLocalLibraryJson(raw);
  if (parsed.ok) {
    return {
      status: "loaded",
      envelope: parsed.envelope,
      diagnostics: parsed.diagnostics,
      writeBlocked: parsed.writeBlocked
    };
  }
  return {
    status: parsed.diagnostics.some(
      (diagnostic) => diagnostic.code === "unsupported-schema-version"
    )
      ? "unsupported"
      : "corrupt",
    envelope: empty,
    diagnostics: parsed.diagnostics,
    writeBlocked: true
  };
}

export function writeLocalLibrary(
  storage: LocalStoragePort | null | undefined,
  envelope: LocalLibraryEnvelopeV1,
  options: {
    readonly now: string;
    readonly reason: string;
    readonly expectedRevision: number | null;
    readonly allowWriteBlocked?: boolean;
  }
): LocalLibraryWriteResult {
  const next = prepareEnvelopeForWrite(envelope, options.now, options.reason);
  if (storage === null || storage === undefined) {
    return writeFailure(
      "unavailable",
      next,
      "Browser localStorage is unavailable; edits remain in memory."
    );
  }

  const current = readLocalLibrary(storage, options.now);
  if (current.writeBlocked && options.allowWriteBlocked !== true) {
    return writeFailure(
      "write-blocked",
      next,
      "Stored local data needs explicit recovery before Build Wars will overwrite it.",
      current.diagnostics
    );
  }
  if (
    options.expectedRevision !== null &&
    current.status !== "unavailable" &&
    current.envelope.revision !== options.expectedRevision
  ) {
    return writeFailure(
      "conflict",
      next,
      "Stored local data changed before this write completed; review before overwriting.",
      current.diagnostics
    );
  }

  try {
    storage.setItem(LOCAL_LIBRARY_STORAGE_KEY, serializeLocalLibraryEnvelope(next));
  } catch (error) {
    if (isQuotaError(error)) {
      return writeFailure(
        "quota-exceeded",
        next,
        "Browser storage quota was exceeded; edits remain in memory."
      );
    }
    return writeFailure("unavailable", next, "Browser localStorage could not be written.");
  }
  return { ok: true, status: "written", envelope: next };
}

function writeFailure(
  status: Exclude<LocalLibraryWriteStatus, "written">,
  envelope: LocalLibraryEnvelopeV1,
  message: string,
  diagnostics: readonly PersistenceDiagnostic[] = []
): LocalLibraryWriteResult {
  return {
    ok: false,
    status,
    envelope,
    diagnostics:
      diagnostics.length > 0
        ? diagnostics
        : [
            {
              code: status,
              path: "$",
              message
            }
          ],
    message
  };
}

function isQuotaError(error: unknown): boolean {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED";
  }
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const record = error as { readonly name?: unknown; readonly code?: unknown };
  return record.name === "QuotaExceededError" || record.code === 22 || record.code === 1014;
}
