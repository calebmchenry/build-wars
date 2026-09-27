import { describe, expect, it, vi } from "vitest";
import { createGuideFixture } from "./guide-fixture";
import { guideAddress } from "./guide-state";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  createWorkspaceEnvelope,
  materializeActiveDocument
} from "./workspace-state";
import {
  FIXED_LIBRARY_NOW as now,
  fixtureCatalogFacts,
  validSavedRecordFixture,
  validBuildSetSavedRecordFixture,
  validPartyBuildSetSnapshotFixture,
  validLocalLibraryEnvelopeFixture,
  legacyLocalLibraryEnvelopeV1Fixture
} from "./library-fixtures";
import {
  localBuildRecordId,
  parseLocalLibraryEnvelope,
  parseLocalLibraryJson,
  serializeLocalLibraryEnvelope,
  type PersistedGuideSnapshot,
  type PersistedSavedDocumentRecord
} from "./persistence-schema";
import {
  createBackupEnvelope,
  parseBackupJson,
  serializeBackupEnvelope,
  createRestorePreviewPlan,
  applyRestorePlan
} from "./backup-restore";
import { readLocalLibrary, writeLocalLibrary } from "./local-storage";
import { serializeGuideMarkdown } from "../guide/markdown";
const raw = ':::bw-guide\r\n{ "version": 1, broken  \r\n';
function snapshot(): PersistedGuideSnapshot {
  return {
    schemaVersion: 1,
    document: createGuideFixture(),
    recovery: { raw, baseRevision: 4, dirty: true },
    appliedRevision: 6
  };
}
function record(): PersistedSavedDocumentRecord {
  const guide = snapshot();
  return {
    ...validSavedRecordFixture(),
    id: localBuildRecordId("saved-guide"),
    name: guide.document.metadata.title,
    tags: guide.document.metadata.tags,
    document: { kind: "guide", snapshot: guide }
  };
}
function mixed() {
  const guide = record();
  return validLocalLibraryEnvelopeFixture({
    savedDocuments: [
      validSavedRecordFixture(),
      validBuildSetSavedRecordFixture({
        id: localBuildRecordId("party-fixture"),
        snapshot: validPartyBuildSetSnapshotFixture()
      }),
      guide
    ],
    workingDraft: {
      document: guide.document,
      associatedRecordId: guide.id,
      savedWith: fixtureCatalogFacts
    }
  });
}
describe("v3 guide library durability", () => {
  it("round-trips mixed legacy, party and guide records and hydrates exact invalid source with fresh diagnostics", () => {
    const original = mixed();
    const parsed = parseLocalLibraryJson(serializeLocalLibraryEnvelope(original));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw Error("fixture");
    expect(parsed.writeBlocked).toBe(false);
    expect(parsed.envelope).toEqual(original);
    const hydrated = createInitialWorkspaceState({ envelope: parsed.envelope });
    expect(hydrated.document.kind).toBe("guide");
    if (hydrated.document.kind !== "guide") throw Error("fixture");
    expect(hydrated.document.view).toBe("source");
    expect(hydrated.document.diagnostics.length).toBeGreaterThan(0);
    expect(hydrated.document.history.frame.recovery?.raw).toBe(raw);
    expect(hydrated.document.history.past).toHaveLength(0);
    expect(hydrated.document.history.revision).toBe(6);
    expect(materializeActiveDocument(hydrated)).toEqual(original.workingDraft?.document);
  });
  it("reads v1/v2 without writing and rejects invented v2 or future guides without wiping stored payloads", () => {
    for (const input of [
      legacyLocalLibraryEnvelopeV1Fixture(),
      { ...validLocalLibraryEnvelopeFixture(), schemaVersion: 2 }
    ]) {
      const storage = { getItem: () => JSON.stringify(input), setItem: vi.fn() };
      expect(readLocalLibrary(storage, now).status).toBe("loaded");
      expect(storage.setItem).not.toHaveBeenCalled();
    }
    for (const input of [
      { ...mixed(), schemaVersion: 2 },
      { ...mixed(), schemaVersion: 99 }
    ]) {
      const stored = JSON.stringify(input);
      const storage = { getItem: () => stored, setItem: vi.fn() };
      expect(readLocalLibrary(storage, now).writeBlocked).toBe(true);
      expect(
        writeLocalLibrary(storage, mixed(), { now, reason: "test", expectedRevision: null }).ok
      ).toBe(false);
      expect(storage.setItem).not.toHaveBeenCalled();
    }
    const malformed = mixed();
    const bad = {
      ...malformed,
      savedDocuments: [
        { ...record(), document: { kind: "guide", snapshot: { ...snapshot(), schemaVersion: 2 } } }
      ]
    };
    const parsed = parseLocalLibraryEnvelope(bad);
    expect(parsed.ok && parsed.writeBlocked).toBe(true);
    expect(
      parseLocalLibraryEnvelope({
        ...mixed(),
        workingDraft: {
          ...mixed().workingDraft,
          document: { kind: "guide", snapshot: { ...snapshot(), history: [] } }
        }
      }).writeBlocked
    ).toBe(true);
  });
  it("preserves invalid raw and internal identities on duplicate and backup conflict, then repairs after reload", () => {
    let state = createInitialWorkspaceState({ envelope: mixed() });
    state = workspaceReducer(state, {
      type: "duplicate-record",
      id: record().id,
      newId: localBuildRecordId("copy"),
      now
    });
    const copied = state.library.records.at(-1)!;
    expect(copied.document).toEqual(record().document);
    const backup = createBackupEnvelope({
      exportedAt: now,
      savedDocuments: state.library.records,
      workingDraft: createWorkspaceEnvelope(state, null, now).workingDraft,
      savedWith: fixtureCatalogFacts
    });
    const parsed = parseBackupJson(serializeBackupEnvelope(backup));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw Error("fixture");
    const plan = createRestorePreviewPlan({
      backup: parsed.backup,
      currentRecords: state.library.records,
      nextId: (id) => localBuildRecordId(`${id}-conflict`)
    });
    const restored = applyRestorePlan(plan, {
      currentRecords: state.library.records,
      mode: "merge",
      restoreWorkingDraft: true
    });
    expect(restored.ok).toBe(true);
    if (!restored.ok) throw Error("fixture");
    expect(restored.records.find((r) => r.id === "copy-conflict")?.document).toEqual(
      copied.document
    );
    state = workspaceReducer(state, { type: "load-record", id: copied.id, decision: "discard" });
    const envelope = createWorkspaceEnvelope(state, null, now);
    const roundTrip = parseLocalLibraryJson(serializeLocalLibraryEnvelope(envelope));
    if (!roundTrip.ok) throw Error("fixture");
    state = createInitialWorkspaceState({ envelope: roundTrip.envelope });
    if (state.document.kind !== "guide") throw Error("fixture");
    expect(state.document.history.frame.recovery?.raw).toBe(raw);
    state = workspaceReducer(state, {
      type: "guide",
      command: {
        ...guideAddress(state.document),
        type: "source-edit",
        raw: serializeGuideMarkdown(snapshot().document)
      }
    });
    if (state.document.kind !== "guide") throw Error("fixture");
    state = workspaceReducer(state, {
      type: "guide",
      command: {
        ...guideAddress(state.document),
        type: "source-apply",
        acknowledgeReplacement: true
      }
    });
    if (state.document.kind !== "guide") throw Error("fixture");
    expect(state.document.history.frame.recovery).toBeNull();
    expect(state.document.history.frame.document).toEqual(snapshot().document);
  });
  it("maps Save As and saved rename to authored metadata while retaining stale raw and unknown audit facts", () => {
    let state = workspaceReducer(createInitialWorkspaceState(), {
      type: "replace-guide",
      document: createGuideFixture(),
      session: "named",
      decision: "discard"
    });
    if (state.document.kind !== "guide") throw Error("fixture");
    state = workspaceReducer(state, {
      type: "guide",
      command: { ...guideAddress(state.document), type: "source-edit", raw }
    });
    state = workspaceReducer(state, {
      type: "save-as-new",
      name: "Saved name",
      id: localBuildRecordId("named"),
      now,
      savedWith: fixtureCatalogFacts
    });
    expect(state.library.records[0]?.savedWith.skillCatalogVersion).toBeNull();
    state = workspaceReducer(state, {
      type: "rename-record",
      id: localBuildRecordId("named"),
      name: "Renamed",
      now,
      savedWith: fixtureCatalogFacts
    });
    const saved = state.library.records[0]!;
    if (saved.document.kind !== "guide" || state.document.kind !== "guide") throw Error("fixture");
    expect(saved.name).toBe(saved.document.snapshot.document.metadata.title);
    expect(state.document.history.frame.document.metadata.title).toBe("Renamed");
    expect(saved.document.snapshot.recovery?.raw).toBe(raw);
    expect(saved.document.snapshot.recovery!.baseRevision).toBeLessThan(
      saved.document.snapshot.appliedRevision
    );
    expect(
      parseLocalLibraryJson(
        serializeLocalLibraryEnvelope(createWorkspaceEnvelope(state, null, now))
      ).ok
    ).toBe(true);
  });
  it("keeps quota, aggregate overflow and cross-tab conflicts visible without writing or losing guides", () => {
    const original = mixed();
    const serialized = serializeLocalLibraryEnvelope(original);
    const storage = {
      getItem: () => serialized,
      setItem: vi.fn(() => {
        throw new DOMException("Full", "QuotaExceededError");
      })
    };
    expect(
      writeLocalLibrary(storage, original, {
        now,
        reason: "quota",
        expectedRevision: original.revision
      }).status
    ).toBe("quota-exceeded");
    storage.setItem.mockClear();
    expect(
      writeLocalLibrary(storage, original, {
        now,
        reason: "conflict",
        expectedRevision: original.revision + 1
      }).status
    ).toBe("conflict");
    expect(storage.setItem).not.toHaveBeenCalled();
    const huge = {
      ...original,
      savedDocuments: Array.from({ length: 5 }, (_, i) => {
        const value = record();
        if (value.document.kind !== "guide") throw Error("fixture");
        return {
          ...value,
          id: localBuildRecordId(`large-${i}`),
          document: {
            ...value.document,
            snapshot: {
              ...value.document.snapshot,
              recovery: { ...value.document.snapshot.recovery!, raw: "x".repeat(2 * 1024 * 1024) }
            }
          }
        };
      })
    };
    expect(
      writeLocalLibrary(storage, huge, {
        now,
        reason: "aggregate",
        expectedRevision: original.revision
      }).status
    ).toBe("quota-exceeded");
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(huge.savedDocuments).toHaveLength(5);
  });
});
