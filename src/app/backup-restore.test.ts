import { describe, expect, it } from "vitest";

import { createEmptyEquipmentLoadout, knownEquipmentSelection, type RuneId } from "../domain";
import { localBuildRecordId, selectedPersistedBuildSnapshot } from "./persistence-schema";
import {
  corruptRecordEnvelopeFixture,
  fixtureCatalogFacts,
  validBuildSetSavedRecordFixture,
  validSavedRecordFixture,
  validWorkingDraftFixture
} from "./library-fixtures";
import {
  applyRestorePlan,
  createBackupEnvelope,
  createRestorePreviewPlan,
  parseBackupEnvelope,
  parseBackupJson,
  serializeBackupEnvelope
} from "./backup-restore";

const NOW = "2026-09-02T19:25:41Z";

describe("backup and restore", () => {
  it("exports and parses inert whole-library JSON without executable fields", () => {
    const backup = createBackupEnvelope({
      exportedAt: NOW,
      savedBuilds: [validSavedRecordFixture()],
      workingDraft: validWorkingDraftFixture(),
      savedWith: fixtureCatalogFacts
    });
    const text = serializeBackupEnvelope(backup);
    const parsed = parseBackupJson(text);

    expect(text).toContain('"kind": "build-wars-library-backup"');
    expect(text).not.toContain("<script");
    expect(text).not.toContain(["data", "source-snapshots"].join("/"));
    expect(parsed.ok ? parsed.backup.savedDocuments.length : 0).toBe(1);
    expect(parsed.ok ? draftSnapshot(parsed.backup.workingDraft)?.build.name : null).toBe(
      "Hammer and Bow"
    );
  });

  it("round-trips semantic equipment and partially skips malformed backup records", () => {
    const equipment = createEmptyEquipmentLoadout();
    const record = validSavedRecordFixture({
      snapshot: {
        ...recordSnapshot(validSavedRecordFixture())!,
        build: {
          ...recordSnapshot(validSavedRecordFixture())!.build,
          equipment: {
            ...equipment,
            armor: equipment.armor.map((piece) =>
              piece.slot === "head"
                ? { ...piece, rune: knownEquipmentSelection(40 as RuneId) }
                : piece
            )
          }
        }
      }
    });
    const corrupt = corruptRecordEnvelopeFixture() as {
      readonly savedDocuments: readonly unknown[];
    };
    const parsed = parseBackupEnvelope({
      kind: "build-wars-library-backup",
      schemaVersion: 2,
      exportedAt: NOW,
      savedDocuments: [record, corrupt.savedDocuments[1]],
      savedWith: fixtureCatalogFacts
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.ok ? parsed.backup.savedDocuments : []).toHaveLength(1);
    expect(
      parsed.ok ? recordSnapshot(parsed.backup.savedDocuments[0])?.build.equipment : null
    ).toEqual(recordSnapshot(record)?.build.equipment);
    expect(parsed.diagnostics.some((issue) => issue.code === "invalid-record")).toBe(true);
  });

  it("round-trips title overrides through backup parse and draft restore", () => {
    const record = validSavedRecordFixture({
      snapshot: {
        ...recordSnapshot(validSavedRecordFixture())!,
        build: {
          ...recordSnapshot(validSavedRecordFixture())!.build,
          titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }]
        }
      }
    });
    const backup = createBackupEnvelope({
      exportedAt: NOW,
      savedBuilds: [record],
      workingDraft: validWorkingDraftFixture({
        snapshot: recordSnapshot(record)!,
        associatedRecordId: record.id
      }),
      savedWith: fixtureCatalogFacts
    });
    const parsed = parseBackupEnvelope(backup);

    expect(
      parsed.ok ? recordSnapshot(parsed.backup.savedDocuments[0])?.build.titleRankOverrides : null
    ).toEqual([{ key: "title:lightbringer-rank", rank: 4 }]);
    if (!parsed.ok) {
      return;
    }
    const plan = createRestorePreviewPlan({
      backup: parsed.backup,
      currentRecords: [],
      nextId: (sourceId) => sourceId,
      id: "restore-title"
    });
    const restored = applyRestorePlan(plan, {
      currentRecords: [],
      mode: "replace",
      restoreWorkingDraft: true
    });

    expect(
      restored.ok
        ? selectedPersistedBuildSnapshot(restored.draftDocument!)?.build.titleRankOverrides
        : null
    ).toEqual([{ key: "title:lightbringer-rank", rank: 4 }]);
  });

  it("round-trips mixed schema-2 build and build-set backups", () => {
    const build = validSavedRecordFixture({ id: localBuildRecordId("local-build") });
    const buildSet = validBuildSetSavedRecordFixture({
      id: localBuildRecordId("local-set"),
      name: "Saved build set"
    });
    const backup = createBackupEnvelope({
      exportedAt: NOW,
      savedDocuments: [build, buildSet],
      workingDraft: validWorkingDraftFixture({
        document: buildSet.document,
        associatedRecordId: buildSet.id
      }),
      savedWith: fixtureCatalogFacts
    });
    const parsed = parseBackupEnvelope(backup);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.backup.savedDocuments.map((record) => record.document.kind)).toEqual([
      "build",
      "build-set"
    ]);
    const plan = createRestorePreviewPlan({
      backup: parsed.backup,
      currentRecords: [],
      nextId: (sourceId) => sourceId,
      id: "restore-mixed"
    });
    const restored = applyRestorePlan(plan, {
      currentRecords: [],
      mode: "replace",
      restoreWorkingDraft: true
    });

    expect(restored.ok ? restored.draftDocument?.kind : null).toBe("build-set");
    expect(restored.ok ? restored.records.length : 0).toBe(2);
  });

  it("rejects malformed, unsupported, and dangerous backup inputs with bounded diagnostics", () => {
    expect(parseBackupJson("{").ok).toBe(false);
    expect(parseBackupEnvelope({ kind: "other", schemaVersion: 1, exportedAt: NOW }).ok).toBe(
      false
    );
    expect(
      parseBackupEnvelope({
        kind: "build-wars-library-backup",
        schemaVersion: 999,
        exportedAt: NOW,
        savedBuilds: []
      }).ok
    ).toBe(false);
    const dangerous = parseBackupJson(
      `{"kind":"build-wars-library-backup","schemaVersion":1,"exportedAt":"${NOW}","savedBuilds":[{"__proto__":"bad"}]}`
    );
    expect(dangerous.ok).toBe(false);
  });

  it("previews skipped records, current ID conflicts, remaps, and final counts before apply", () => {
    const current = [validSavedRecordFixture({ id: localBuildRecordId("local-a") })];
    const incoming = validSavedRecordFixture({
      id: localBuildRecordId("local-a"),
      name: "Incoming collision"
    });
    const corrupt = corruptRecordEnvelopeFixture() as {
      readonly savedDocuments: readonly unknown[];
    };
    const parsed = parseBackupEnvelope({
      ...corrupt,
      kind: "build-wars-library-backup",
      schemaVersion: 2,
      exportedAt: NOW,
      savedDocuments: [incoming, ...corrupt.savedDocuments]
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const plan = createRestorePreviewPlan({
      backup: parsed.backup,
      currentRecords: current,
      nextId: (sourceId) => localBuildRecordId(`${sourceId}-remap`),
      diagnostics: parsed.diagnostics,
      id: "restore-fixture"
    });

    expect(plan.acceptedRecords).toHaveLength(2);
    expect(plan.skippedRecords.some((issue) => issue.code === "invalid-record")).toBe(true);
    expect(plan.currentIdConflicts).toEqual(["local-a"]);
    expect(plan.idRemaps).toEqual([
      { from: "local-a", to: "local-a-remap", reason: "current-id-conflict" }
    ]);
    expect(plan.mergeFinalCount).toBe(3);
    expect(plan.replaceFinalCount).toBe(2);
  });

  it("applies merge and replace plans with draft restoration as a separate opt-in", () => {
    const current = [validSavedRecordFixture({ id: localBuildRecordId("local-current") })];
    const backup = createBackupEnvelope({
      exportedAt: NOW,
      savedBuilds: [validSavedRecordFixture({ id: localBuildRecordId("local-incoming") })],
      workingDraft: validWorkingDraftFixture({
        associatedRecordId: localBuildRecordId("local-incoming")
      }),
      savedWith: fixtureCatalogFacts
    });
    const plan = createRestorePreviewPlan({
      backup,
      currentRecords: current,
      nextId: (sourceId) => localBuildRecordId(`${sourceId}-copy`),
      id: "restore-apply"
    });

    const merged = applyRestorePlan(plan, {
      currentRecords: current,
      mode: "merge",
      restoreWorkingDraft: false
    });
    const replaced = applyRestorePlan(plan, {
      currentRecords: current,
      mode: "replace",
      restoreWorkingDraft: true
    });

    expect(merged.ok ? merged.records.map((record) => record.id) : []).toEqual([
      "local-current",
      "local-incoming"
    ]);
    expect(merged.ok ? merged.draftDocument : "error").toBeNull();
    expect(replaced.ok ? replaced.records.map((record) => record.id) : []).toEqual([
      "local-incoming"
    ]);
    expect(replaced.ok ? replaced.draftAssociation : null).toBe("local-incoming");
    expect(
      replaced.ok ? selectedPersistedBuildSnapshot(replaced.draftDocument!)?.build.name : null
    ).toBe("Hammer and Bow");
  });

  it("blocks all-invalid destructive replace and marks applied plans as one-time", () => {
    const backup = createBackupEnvelope({
      exportedAt: NOW,
      savedBuilds: [],
      workingDraft: null,
      savedWith: fixtureCatalogFacts
    });
    const invalidPlan = createRestorePreviewPlan({
      backup: {
        ...backup,
        metadata: {
          ...backup.metadata,
          declaredRecordCount: 2
        }
      },
      currentRecords: [validSavedRecordFixture()],
      nextId: (sourceId) => sourceId,
      id: "restore-invalid"
    });

    const blocked = applyRestorePlan(invalidPlan, {
      currentRecords: [validSavedRecordFixture()],
      mode: "replace",
      restoreWorkingDraft: false
    });
    const plan = createRestorePreviewPlan({
      backup,
      currentRecords: [],
      nextId: (sourceId) => sourceId,
      id: "restore-once"
    });
    const first = applyRestorePlan(plan, {
      currentRecords: [],
      mode: "merge",
      restoreWorkingDraft: false
    });
    const second = applyRestorePlan(first.ok ? first.plan : plan, {
      currentRecords: [],
      mode: "merge",
      restoreWorkingDraft: false
    });

    expect(blocked.ok).toBe(false);
    expect(blocked.ok ? null : blocked.reason).toContain("cannot wipe");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(second.ok ? null : second.reason).toContain("already");
  });
});

function draftSnapshot(draft: ReturnType<typeof validWorkingDraftFixture> | null | undefined) {
  return draft === null || draft === undefined
    ? null
    : selectedPersistedBuildSnapshot(draft.document);
}

function recordSnapshot(record: ReturnType<typeof validSavedRecordFixture> | undefined) {
  return record === undefined ? null : selectedPersistedBuildSnapshot(record.document);
}
