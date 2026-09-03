import { describe, expect, it } from "vitest";

import { authoredDocumentId, buildSetEntryId } from "../domain";
import { validBuildSetSnapshotFixture, validSnapshotFixture } from "./library-fixtures";
import {
  BUILD_SET_TRANSFER_KIND,
  BUILD_SET_TRANSFER_MAX_BYTES,
  applyBuildSetTransferPreview,
  createBuildSetTransferEnvelope,
  parseBuildSetTransferJson,
  previewBuildSetTransferJson,
  sanitizeBuildSetTransferFilename,
  serializeBuildSetTransferEnvelope
} from "./build-set-transfer";

const NOW = "2026-09-03T06:10:00Z";

describe("build set transfer", () => {
  it("serializes deterministic inert JSON with a sanitized filename", () => {
    const snapshot = validBuildSetSnapshotFixture({ name: "Frontline / Variants!" });
    const envelope = createBuildSetTransferEnvelope({ buildSet: snapshot, exportedAt: NOW });
    const text = serializeBuildSetTransferEnvelope(envelope);
    const reparsed = parseBuildSetTransferJson(text);

    expect(text).toBe(serializeBuildSetTransferEnvelope(envelope));
    expect(text).toContain(`"kind": "${BUILD_SET_TRANSFER_KIND}"`);
    expect(text).not.toContain("<script");
    expect(sanitizeBuildSetTransferFilename(snapshot.name, NOW)).toBe(
      "build-wars-frontline-variants-20260903.json"
    );
    expect(reparsed.ok ? reparsed.envelope.buildSet.name : null).toBe("Frontline / Variants!");
  });

  it("previews valid JSON and applies it once as an independent build-set snapshot", () => {
    const envelope = createBuildSetTransferEnvelope({
      buildSet: validBuildSetSnapshotFixture(),
      exportedAt: NOW
    });
    const preview = previewBuildSetTransferJson(
      serializeBuildSetTransferEnvelope(envelope),
      "xfer"
    );

    expect(preview.ok).toBe(true);
    if (!preview.ok) {
      throw new Error("Expected valid preview.");
    }
    expect(preview.preview.entryCount).toBe(2);
    expect(preview.preview.applied).toBe(false);

    const applied = applyBuildSetTransferPreview(preview.preview);
    expect(applied.ok).toBe(true);
    if (!applied.ok) {
      throw new Error(applied.reason);
    }
    expect(applied.snapshot).toEqual(envelope.buildSet);
    expect(applied.snapshot).not.toBe(envelope.buildSet);

    const second = applyBuildSetTransferPreview(applied.preview);
    expect(second.ok).toBe(false);
    expect(second.ok ? null : second.reason).toContain("already");
  });

  it("rejects malformed, dangerous, duplicate-entry, over-limit, and oversized transfers", () => {
    expect(parseBuildSetTransferJson("{").ok).toBe(false);
    expect(
      parseBuildSetTransferJson(
        `{"kind":"${BUILD_SET_TRANSFER_KIND}","schemaVersion":1,"exportedAt":"${NOW}","buildSet":{"__proto__":"bad"}}`
      ).ok
    ).toBe(false);

    const duplicate = validBuildSetSnapshotFixture({
      entries: [
        ...validBuildSetSnapshotFixture().entries,
        {
          ...validBuildSetSnapshotFixture().entries[0]!,
          label: "Duplicate"
        }
      ]
    });
    expect(
      parseBuildSetTransferJson(
        serializeBuildSetTransferEnvelope(
          createBuildSetTransferEnvelope({ buildSet: duplicate, exportedAt: NOW })
        )
      ).ok
    ).toBe(false);

    const overLimit = validBuildSetSnapshotFixture({
      entries: Array.from({ length: 17 }, (_, index) => ({
        id: buildSetEntryId(`entry-${index}`),
        label: `Entry ${index}`,
        kind: "build" as const,
        notes: null,
        snapshot: validSnapshotFixture()
      }))
    });
    expect(
      parseBuildSetTransferJson(
        serializeBuildSetTransferEnvelope(
          createBuildSetTransferEnvelope({ buildSet: overLimit, exportedAt: NOW })
        )
      ).ok
    ).toBe(false);
    expect(parseBuildSetTransferJson("x".repeat(BUILD_SET_TRANSFER_MAX_BYTES + 1)).ok).toBe(false);
  });

  it("accepts the maximum valid 16-entry build-set transfer", () => {
    const snapshot = validBuildSetSnapshotFixture({
      id: authoredDocumentId("set-max"),
      lastSelectedEntryId: buildSetEntryId("entry-0"),
      entries: Array.from({ length: 16 }, (_, index) => ({
        id: buildSetEntryId(`entry-${index}`),
        label: `Loadout ${index}`,
        kind: index === 0 ? "build" : "variant",
        notes: index % 2 === 0 ? `Notes ${index}` : null,
        snapshot: validSnapshotFixture()
      }))
    });
    const text = serializeBuildSetTransferEnvelope(
      createBuildSetTransferEnvelope({ buildSet: snapshot, exportedAt: NOW })
    );
    const parsed = parseBuildSetTransferJson(text);

    expect(parsed.ok).toBe(true);
    expect(parsed.serializedBytes).toBeLessThan(BUILD_SET_TRANSFER_MAX_BYTES);
    expect(parsed.ok ? parsed.envelope.metadata.declaredEntryCount : null).toBe(16);
  });
});
