import { describe, expect, it } from "vitest";

import {
  validBuildSetSnapshotFixture,
  validPartyBuildSetSnapshotFixture
} from "./library-fixtures";
import {
  PARTY_TRANSFER_KIND,
  PARTY_TRANSFER_MAX_BYTES,
  applyPartyTransferPreview,
  createPartyTransferEnvelope,
  parsePartyTransferJson,
  previewPartyTransferJson,
  sanitizePartyTransferFilename,
  serializePartyTransferEnvelope
} from "./party-transfer";

const NOW = "2026-09-03T07:10:00Z";

describe("party transfer", () => {
  it("serializes enabled party JSON as an inert deterministic envelope", () => {
    const snapshot = validPartyBuildSetSnapshotFixture({ name: "Balanced / Team!" });
    const envelope = createPartyTransferEnvelope({ buildSet: snapshot, exportedAt: NOW });

    expect(envelope).not.toBeNull();
    if (envelope === null) {
      return;
    }
    const text = serializePartyTransferEnvelope(envelope);
    const parsed = parsePartyTransferJson(text);

    expect(text).toBe(serializePartyTransferEnvelope(envelope));
    expect(text).toContain(`"kind": "${PARTY_TRANSFER_KIND}"`);
    expect(text).not.toContain("<script");
    expect(sanitizePartyTransferFilename(snapshot.name, NOW)).toBe(
      "build-wars-balanced-team-party-20260903.json"
    );
    expect(parsed.ok ? parsed.envelope.buildSet.party : null).toEqual(snapshot.party);
  });

  it("previews and applies native party transfers once", () => {
    const envelope = createPartyTransferEnvelope({
      buildSet: validPartyBuildSetSnapshotFixture(),
      exportedAt: NOW
    });

    expect(envelope).not.toBeNull();
    if (envelope === null) {
      return;
    }
    const preview = previewPartyTransferJson(serializePartyTransferEnvelope(envelope), "party");

    expect(preview.ok).toBe(true);
    if (!preview.ok) {
      throw new Error("Expected valid party transfer preview.");
    }
    expect(preview.preview.slotCount).toBe(2);
    expect(preview.preview.entryCount).toBe(2);

    const applied = applyPartyTransferPreview(preview.preview);
    expect(applied.ok).toBe(true);
    if (!applied.ok) {
      throw new Error(applied.reason);
    }
    expect(applied.snapshot).toEqual(envelope.buildSet);
    expect(applyPartyTransferPreview(applied.preview).ok).toBe(false);
  });

  it("rejects malformed, disabled, neutral, and oversized party transfers", () => {
    expect(
      createPartyTransferEnvelope({ buildSet: validBuildSetSnapshotFixture(), exportedAt: NOW })
    ).toBeNull();
    expect(parsePartyTransferJson("{").ok).toBe(false);
    expect(
      parsePartyTransferJson(
        `{"kind":"${PARTY_TRANSFER_KIND}","schemaVersion":1,"exportedAt":"${NOW}","buildSet":{"__proto__":"bad"}}`
      ).ok
    ).toBe(false);

    const disabled = validPartyBuildSetSnapshotFixture({
      party: {
        ...validPartyBuildSetSnapshotFixture().party!,
        enabled: false
      }
    });
    expect(
      parsePartyTransferJson(
        JSON.stringify({
          kind: PARTY_TRANSFER_KIND,
          schemaVersion: 1,
          exportedAt: NOW,
          buildSet: disabled
        })
      ).ok
    ).toBe(false);
    expect(parsePartyTransferJson("x".repeat(PARTY_TRANSFER_MAX_BYTES + 1)).ok).toBe(false);
  });
});
