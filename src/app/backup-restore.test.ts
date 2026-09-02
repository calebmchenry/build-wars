import { describe, expect, it } from "vitest";

import { localBuildRecordId } from "./persistence-schema";
import {
  corruptRecordEnvelopeFixture,
  fixtureCatalogFacts,
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
    expect(parsed.ok ? parsed.backup.savedBuilds.length : 0).toBe(1);
    expect(parsed.ok ? parsed.backup.workingDraft?.snapshot.build.name : null).toBe(
      "Hammer and Bow"
    );
  });

  it("rejects malformed, unsupported, and dangerous backup inputs with bounded diagnostics", () => {
    expect(parseBackupJson("{").ok).toBe(false);
    expect(parseBackupEnvelope({ kind: "other", schemaVersion: 1, exportedAt: NOW }).ok).toBe(
      false
    );
    expect(
      parseBackupEnvelope({
        kind: "build-wars-library-backup",
        schemaVersion: 2,
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
    const corrupt = corruptRecordEnvelopeFixture() as { readonly savedBuilds: readonly unknown[] };
    const parsed = parseBackupEnvelope({
      ...corrupt,
      kind: "build-wars-library-backup",
      schemaVersion: 1,
      exportedAt: NOW,
      savedBuilds: [incoming, ...corrupt.savedBuilds]
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
    expect(merged.ok ? merged.draftEditor : "error").toBeNull();
    expect(replaced.ok ? replaced.records.map((record) => record.id) : []).toEqual([
      "local-incoming"
    ]);
    expect(replaced.ok ? replaced.draftAssociation : null).toBe("local-incoming");
    expect(replaced.ok ? replaced.draftEditor?.build.name : null).toBe("Hammer and Bow");
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
