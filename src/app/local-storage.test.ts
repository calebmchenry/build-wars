import { describe, expect, it } from "vitest";

import { LOCAL_LIBRARY_STORAGE_KEY, serializeLocalLibraryEnvelope } from "./persistence-schema";
import {
  corruptLocalLibraryJsonFixture,
  validLocalLibraryEnvelopeFixture
} from "./library-fixtures";
import { readLocalLibrary, writeLocalLibrary, type LocalStoragePort } from "./local-storage";

describe("local storage adapter", () => {
  it("reads empty and loaded envelopes through the single app-owned key", () => {
    const storage = new MemoryStorage();
    const empty = readLocalLibrary(storage, "2026-09-02T19:25:41Z");
    expect(empty.status).toBe("empty");

    const envelope = validLocalLibraryEnvelopeFixture();
    storage.setItem(LOCAL_LIBRARY_STORAGE_KEY, serializeLocalLibraryEnvelope(envelope));

    const loaded = readLocalLibrary(storage);
    expect(loaded.status).toBe("loaded");
    expect(loaded.envelope.revision).toBe(envelope.revision);
    expect([...storage.keys]).toEqual([LOCAL_LIBRARY_STORAGE_KEY]);
  });

  it("reports unavailable storage without crashing or claiming durability", () => {
    const read = readLocalLibrary(null, "2026-09-02T19:25:41Z");
    const write = writeLocalLibrary(null, validLocalLibraryEnvelopeFixture(), {
      now: "2026-09-02T19:25:42Z",
      reason: "test",
      expectedRevision: 3
    });

    expect(read.status).toBe("unavailable");
    expect(read.writeBlocked).toBe(false);
    expect(write.ok).toBe(false);
    expect(write.status).toBe("unavailable");
  });

  it("does not overwrite malformed storage unless explicitly allowed", () => {
    const storage = new MemoryStorage();
    storage.setItem(LOCAL_LIBRARY_STORAGE_KEY, corruptLocalLibraryJsonFixture());

    const read = readLocalLibrary(storage);
    const write = writeLocalLibrary(storage, validLocalLibraryEnvelopeFixture(), {
      now: "2026-09-02T19:25:42Z",
      reason: "autosave",
      expectedRevision: null
    });

    expect(read.status).toBe("corrupt");
    expect(read.writeBlocked).toBe(true);
    expect(write.ok).toBe(false);
    expect(write.status).toBe("write-blocked");
    expect(storage.getItem(LOCAL_LIBRARY_STORAGE_KEY)).toBe(corruptLocalLibraryJsonFixture());
  });

  it("writes explicit recovery when write-blocked data is confirmed", () => {
    const storage = new MemoryStorage();
    storage.setItem(LOCAL_LIBRARY_STORAGE_KEY, corruptLocalLibraryJsonFixture());

    const write = writeLocalLibrary(storage, validLocalLibraryEnvelopeFixture(), {
      now: "2026-09-02T19:25:42Z",
      reason: "confirmed replace",
      expectedRevision: null,
      allowWriteBlocked: true
    });

    expect(write.ok).toBe(true);
    expect(readLocalLibrary(storage).status).toBe("loaded");
  });

  it("detects stale revision conflicts before writing", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_LIBRARY_STORAGE_KEY,
      serializeLocalLibraryEnvelope(validLocalLibraryEnvelopeFixture({ revision: 4 }))
    );

    const write = writeLocalLibrary(storage, validLocalLibraryEnvelopeFixture({ revision: 3 }), {
      now: "2026-09-02T19:25:42Z",
      reason: "autosave",
      expectedRevision: 3
    });

    expect(write.ok).toBe(false);
    expect(write.status).toBe("conflict");
    expect(readLocalLibrary(storage).envelope.revision).toBe(4);
  });

  it("reports quota errors as memory-only writes", () => {
    const storage: LocalStoragePort = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      }
    };

    const write = writeLocalLibrary(storage, validLocalLibraryEnvelopeFixture(), {
      now: "2026-09-02T19:25:42Z",
      reason: "autosave",
      expectedRevision: null
    });

    expect(write.ok).toBe(false);
    expect(write.status).toBe("quota-exceeded");
  });
});

class MemoryStorage implements LocalStoragePort {
  public readonly keys = new Set<string>();
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.keys.add(key);
    this.values.set(key, value);
  }
}
