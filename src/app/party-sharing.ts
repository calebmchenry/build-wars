import { hasAuthoredTitleRankOverrides } from "../domain";
import type { AppCatalogViews } from "./catalogs";
import { selectValidationView } from "./editor-selectors";
import { selectHasMeaningfulEquipment } from "./equipment-selectors";
import { hydrateEditorFromSnapshot, type PersistedBuildSetSnapshot } from "./persistence-schema";
import { selectShareTemplateExport } from "./template-workflow";

export const PARTY_MULTI_CODE_MAX_BYTES = 32_000;

export interface PartyMultiCodeSlotResult {
  readonly ordinal: number;
  readonly label: string;
  readonly state: "available" | "empty" | "unavailable";
  readonly text: string;
  readonly omitted: readonly string[];
  readonly reasonCodes: readonly string[];
}

export interface PartyMultiCodeProjection {
  readonly ok: boolean;
  readonly text: string;
  readonly bytes: number;
  readonly availableCount: number;
  readonly emptyCount: number;
  readonly unavailableCount: number;
  readonly lossyCount: number;
  readonly slots: readonly PartyMultiCodeSlotResult[];
  readonly blockedReason: string | null;
}

export function projectPartyMultiCodeText(
  snapshot: PersistedBuildSetSnapshot,
  catalogs: AppCatalogViews
): PartyMultiCodeProjection {
  if (snapshot.party?.enabled !== true) {
    return blocked("Current build set is not an enabled party.");
  }
  const slots = snapshot.party.slots.map((slot, index): PartyMultiCodeSlotResult => {
    const prefix = `Slot ${index + 1}: ${sanitizeLine(slot.memberLabel)}`;
    if (slot.entryId === null) {
      return {
        ordinal: index + 1,
        label: slot.memberLabel,
        state: "empty",
        text: `${prefix}\nState: EMPTY`,
        omitted: [],
        reasonCodes: ["empty-slot"]
      };
    }
    const entry = snapshot.entries.find((candidate) => candidate.id === slot.entryId);
    if (entry === undefined) {
      return {
        ordinal: index + 1,
        label: slot.memberLabel,
        state: "unavailable",
        text: `${prefix}\nState: UNAVAILABLE\nReason: missing-entry-reference`,
        omitted: [],
        reasonCodes: ["missing-entry-reference"]
      };
    }
    const editor = hydrateEditorFromSnapshot(entry.snapshot);
    const validation = selectValidationView(editor, catalogs);
    const exportResult = selectShareTemplateExport(validation.exportPolicy);
    const omitted = [
      "sibling members",
      "party metadata",
      ...(selectHasMeaningfulEquipment(editor.build.equipment) ? ["equipment"] : []),
      ...(hasAuthoredTitleRankOverrides(editor.build) ? ["title ranks"] : []),
      ...(entry.notes !== null ? ["entry notes"] : []),
      ...(slot.notes !== null ? ["slot notes"] : [])
    ];
    if (!exportResult.ok) {
      return {
        ordinal: index + 1,
        label: slot.memberLabel,
        state: "unavailable",
        text: [
          prefix,
          `Entry: ${sanitizeLine(entry.label)}`,
          "State: UNAVAILABLE",
          `Reason: ${sanitizeLine(exportResult.blockedReasons.join("; "))}`,
          `Omitted: ${omitted.join(", ")}`
        ].join("\n"),
        omitted,
        reasonCodes: ["template-export-blocked"]
      };
    }
    return {
      ordinal: index + 1,
      label: slot.memberLabel,
      state: "available",
      text: [
        prefix,
        `Entry: ${sanitizeLine(entry.label)}`,
        `Mode: ${editor.build.mode}`,
        `Fidelity: ${sanitizeLine(exportResult.fidelity)}`,
        `Code: ${sanitizeLine(exportResult.templateText)}`,
        `Omitted: ${omitted.join(", ")}`
      ].join("\n"),
      omitted,
      reasonCodes: []
    };
  });
  const text = normalizeLines(
    [
      "Build Wars Party Codes",
      `Party: ${sanitizeLine(snapshot.name)}`,
      "Format: lossy multi-code projection; use native party JSON for full fidelity.",
      "",
      ...slots.flatMap((slot) => [slot.text, ""])
    ].join("\n")
  ).trimEnd();
  const bytes = utf8ByteLength(text);
  const lossyCount = slots.filter((slot) => slot.omitted.length > 0).length;
  return {
    ok: bytes <= PARTY_MULTI_CODE_MAX_BYTES,
    text,
    bytes,
    availableCount: slots.filter((slot) => slot.state === "available").length,
    emptyCount: slots.filter((slot) => slot.state === "empty").length,
    unavailableCount: slots.filter((slot) => slot.state === "unavailable").length,
    lossyCount,
    slots,
    blockedReason:
      bytes <= PARTY_MULTI_CODE_MAX_BYTES
        ? null
        : `Party multi-code text exceeds the ${PARTY_MULTI_CODE_MAX_BYTES} byte limit.`
  };
}

function blocked(reason: string): PartyMultiCodeProjection {
  return {
    ok: false,
    text: "",
    bytes: 0,
    availableCount: 0,
    emptyCount: 0,
    unavailableCount: 0,
    lossyCount: 0,
    slots: [],
    blockedReason: reason
  };
}

function sanitizeLine(value: string): string {
  return value
    .replace(/[\r\n\t]+/g, " ")
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("")
    .trim();
}

function normalizeLines(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function utf8ByteLength(text: string): number {
  return typeof TextEncoder === "undefined" ? text.length : new TextEncoder().encode(text).length;
}
