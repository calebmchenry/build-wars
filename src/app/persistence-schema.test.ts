import { describe, expect, it } from "vitest";

import { createBlankEditorState } from "./editor-state";
import {
  corruptRecordEnvelopeFixture,
  duplicateIdEnvelopeFixture,
  oversizedEnvelopeFixture,
  unsupportedEnvelopeFixture,
  validLocalLibraryEnvelopeFixture,
  validSnapshotFixture
} from "./library-fixtures";
import {
  LOCAL_LIBRARY_KIND,
  LOCAL_LIBRARY_STORAGE_KEY,
  createPersistedBuildSnapshot,
  hydrateEditorFromSnapshot,
  parseLocalLibraryEnvelope,
  parseLocalLibraryJson,
  serializeLocalLibraryEnvelope
} from "./persistence-schema";

describe("local persistence schema", () => {
  it("uses exactly one documented MVP storage key and a versioned envelope", () => {
    const parsed = parseLocalLibraryEnvelope(validLocalLibraryEnvelopeFixture());

    expect(LOCAL_LIBRARY_STORAGE_KEY).toBe("build-wars:v1");
    expect(parsed.ok ? parsed.envelope.kind : null).toBe(LOCAL_LIBRARY_KIND);
    expect(parsed.ok ? parsed.envelope.schemaVersion : null).toBe(1);
  });

  it("round-trips durable build, PvE budget, raw template source, and unresolved overlays", () => {
    const envelope = validLocalLibraryEnvelopeFixture();
    const text = serializeLocalLibraryEnvelope(envelope);
    const parsed = parseLocalLibraryJson(text);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const unresolved = parsed.envelope.savedBuilds.find(
      (record) => record.name === "Unresolved import"
    );
    expect(unresolved?.snapshot.pveBudget).toEqual({ level: 20, questBonus: "maximum-applicable" });
    expect(unresolved?.snapshot.rawTemplate.source?.originalBareCode).toBe("OAAQIAAAAAAAAAAAAAAA");
    expect(unresolved?.snapshot.rawTemplate.skillBar[1]?.templateId).toBe(999999);
    expect(Number(unresolved?.snapshot.build.skillBar[1])).toBe(-200001);
    expect(unresolved?.savedWith.ruleEngineVersion).toBe("rule-engine:v2");
  });

  it("hydrates durable snapshots into fresh editor UI defaults instead of persisted UI state", () => {
    const source = {
      ...createBlankEditorState("Browser State Must Not Persist"),
      browser: {
        ...createBlankEditorState().browser,
        filters: {
          ...createBlankEditorState().browser.filters,
          query: "transient search"
        },
        batchSize: 999
      },
      dialogs: {
        open: "import" as const,
        importInput: "transient",
        exportName: "transient"
      },
      selectedSlotIndex: 3
    };
    const snapshot = createPersistedBuildSnapshot(source);
    const hydrated = hydrateEditorFromSnapshot(snapshot);

    expect(hydrated.build.name).toBe("Browser State Must Not Persist");
    expect(hydrated.browser.filters.query).toBe("");
    expect(hydrated.browser.batchSize).toBe(48);
    expect(hydrated.dialogs.open).toBeNull();
    expect(hydrated.dialogs.importInput).toBe("");
    expect(hydrated.selectedSlotIndex).toBeNull();
  });

  it("deterministically serializes equivalent envelopes regardless of object key order", () => {
    const envelope = validLocalLibraryEnvelopeFixture();
    const reordered = {
      metadata: envelope.metadata,
      savedBuilds: envelope.savedBuilds,
      workingDraft: envelope.workingDraft,
      updatedAt: envelope.updatedAt,
      revision: envelope.revision,
      kind: envelope.kind,
      schemaVersion: envelope.schemaVersion
    };

    expect(serializeLocalLibraryEnvelope(envelope)).toBe(serializeLocalLibraryEnvelope(reordered));
  });

  it("rejects unsupported, dangerous, and oversized roots with bounded diagnostics", () => {
    const unsupported = parseLocalLibraryEnvelope(unsupportedEnvelopeFixture());
    const dangerous = parseLocalLibraryJson(
      JSON.stringify(validLocalLibraryEnvelopeFixture()).replace(
        '"savedBuilds":[',
        '"savedBuilds":[{"__proto__":"bad"},'
      )
    );
    const oversized = parseLocalLibraryEnvelope(oversizedEnvelopeFixture());

    expect(unsupported.ok).toBe(false);
    expect(unsupported.diagnostics[0]?.code).toBe("unsupported-schema-version");
    expect(dangerous.ok).toBe(false);
    expect(dangerous.diagnostics[0]?.code).toBe("dangerous-key");
    expect(oversized.ok).toBe(false);
    expect(oversized.diagnostics[0]?.code).toBe("oversized-collection");
    expect(oversized.diagnostics.length).toBeLessThanOrEqual(24);
  });

  it("partially recovers invalid subsets and duplicate IDs into write-blocked state", () => {
    const corruptRecord = parseLocalLibraryEnvelope(corruptRecordEnvelopeFixture());
    const duplicate = parseLocalLibraryEnvelope(duplicateIdEnvelopeFixture());

    expect(corruptRecord.ok).toBe(true);
    expect(corruptRecord.ok ? corruptRecord.envelope.savedBuilds : []).toHaveLength(1);
    expect(corruptRecord.writeBlocked).toBe(true);
    expect(duplicate.ok).toBe(true);
    expect(duplicate.ok ? duplicate.envelope.savedBuilds : []).toHaveLength(1);
    expect(duplicate.writeBlocked).toBe(true);
  });

  it("rejects malformed JSON without returning a replacement envelope", () => {
    const parsed = parseLocalLibraryJson("{");

    expect(parsed.ok).toBe(false);
    expect(parsed.diagnostics[0]?.code).toBe("malformed-json");
  });

  it("rejects unsupported equipment in persisted single-character builds", () => {
    const snapshot = validSnapshotFixture();
    const parsed = parseLocalLibraryEnvelope(
      validLocalLibraryEnvelopeFixture({
        savedBuilds: [
          {
            ...validLocalLibraryEnvelopeFixture().savedBuilds[0]!,
            snapshot: {
              ...snapshot,
              build: {
                ...snapshot.build,
                equipment: { anything: true } as unknown as null
              }
            }
          }
        ]
      })
    );

    expect(parsed.ok).toBe(true);
    expect(parsed.writeBlocked).toBe(true);
    expect(parsed.diagnostics.some((issue) => issue.code === "unsupported-equipment")).toBe(true);
  });
});
