import type { Brand } from "./ids";
import { MAX_BUILD_SET_ENTRIES, type BuildSetEntryId } from "./build-set";

export const PARTY_ANNOTATION_SCHEMA_VERSION = 1;
export const PARTY_SIZE_PRESETS = [2, 4, 6, 8, 12] as const;
export const MAX_PARTY_SLOTS = MAX_BUILD_SET_ENTRIES;
export const MIN_PARTY_SLOTS = 1;
export const DEFAULT_EMPTY_PARTY_SIZE = 4;
export const MAX_PARTY_MEMBER_LABEL_LENGTH = 120;
export const MAX_PARTY_ROLE_LENGTH = 120;
export const MAX_PARTY_MEMBER_KIND_LABEL_LENGTH = 80;
export const MAX_PARTY_SLOT_NOTES_LENGTH = 1_000;

export type PartySlotId = Brand<string, "PartySlotId">;
export type PartySizePreset = (typeof PARTY_SIZE_PRESETS)[number];
export type PartyMemberKind =
  "unspecified" | "player" | "hero" | "mercenary" | "guest" | "freeform";

export type PartySize =
  | {
      readonly kind: "preset";
      readonly size: PartySizePreset;
    }
  | {
      readonly kind: "custom";
      readonly size: number;
    };

export interface PartySlotAnnotation {
  readonly id: PartySlotId;
  readonly entryId: BuildSetEntryId | null;
  readonly memberLabel: string;
  readonly role: string | null;
  readonly memberKind: PartyMemberKind;
  readonly memberKindLabel: string | null;
  readonly notes: string | null;
}

export interface PartyAnnotations {
  readonly schemaVersion: typeof PARTY_ANNOTATION_SCHEMA_VERSION;
  readonly enabled: boolean;
  readonly size: PartySize;
  readonly slots: readonly PartySlotAnnotation[];
}

export type PartyStructuralIssueSeverity = "error" | "warning" | "info";

export interface PartyStructuralIssue {
  readonly code: string;
  readonly severity: PartyStructuralIssueSeverity;
  readonly path: string;
  readonly message: string;
  readonly slotId?: PartySlotId;
  readonly entryId?: BuildSetEntryId;
}

const PARTY_MEMBER_KINDS = new Set<PartyMemberKind>([
  "unspecified",
  "player",
  "hero",
  "mercenary",
  "guest",
  "freeform"
]);

export function partySlotId(value: string): PartySlotId {
  return value as PartySlotId;
}

export function isPartySizePreset(value: number): value is PartySizePreset {
  return PARTY_SIZE_PRESETS.includes(value as PartySizePreset);
}

export function isPartyMemberKind(value: string): value is PartyMemberKind {
  return PARTY_MEMBER_KINDS.has(value as PartyMemberKind);
}

export function partySizeValue(size: PartySize): number {
  return size.size;
}

export function partySizeForSlotCount(count: number): PartySize {
  const size = clampPartySize(count);
  return isPartySizePreset(size) ? { kind: "preset", size } : { kind: "custom", size };
}

export function normalizePartyMemberLabel(value: string, fallback = "Member"): string {
  const trimmed = value.trim();
  return (trimmed.length === 0 ? fallback : trimmed).slice(0, MAX_PARTY_MEMBER_LABEL_LENGTH);
}

export function normalizePartyRole(value: string | null): string | null {
  return normalizeNullablePartyText(value, MAX_PARTY_ROLE_LENGTH);
}

export function normalizePartyMemberKindLabel(
  memberKind: PartyMemberKind,
  value: string | null
): string | null {
  if (memberKind !== "freeform") {
    return null;
  }
  return normalizeNullablePartyText(value, MAX_PARTY_MEMBER_KIND_LABEL_LENGTH);
}

export function normalizePartySlotNotes(value: string | null): string | null {
  return normalizeNullablePartyText(value, MAX_PARTY_SLOT_NOTES_LENGTH);
}

export function defaultPartySlotLabel(index: number): string {
  return `Member ${index + 1}`;
}

export function createPartySlotAnnotation(input: {
  readonly id: PartySlotId;
  readonly index: number;
  readonly entryId?: BuildSetEntryId | null;
  readonly memberLabel?: string;
  readonly role?: string | null;
  readonly memberKind?: PartyMemberKind;
  readonly memberKindLabel?: string | null;
  readonly notes?: string | null;
}): PartySlotAnnotation {
  const memberKind = input.memberKind ?? "unspecified";
  return {
    id: input.id,
    entryId: input.entryId ?? null,
    memberLabel: normalizePartyMemberLabel(
      input.memberLabel ?? defaultPartySlotLabel(input.index),
      defaultPartySlotLabel(input.index)
    ),
    role: normalizePartyRole(input.role ?? null),
    memberKind,
    memberKindLabel: normalizePartyMemberKindLabel(memberKind, input.memberKindLabel ?? null),
    notes: normalizePartySlotNotes(input.notes ?? null)
  };
}

export function createPartyAnnotationsForEntries(input: {
  readonly entries: readonly { readonly id: BuildSetEntryId; readonly label?: string }[];
  readonly slotIds?: readonly PartySlotId[];
  readonly enabled?: boolean;
}): PartyAnnotations {
  const count =
    input.entries.length === 0 ? DEFAULT_EMPTY_PARTY_SIZE : clampPartySize(input.entries.length);
  const slots = Array.from({ length: count }, (_, index) => {
    const entry = input.entries[index] ?? null;
    return createPartySlotAnnotation({
      id: input.slotIds?.[index] ?? partySlotId(`party-slot-${index + 1}`),
      index,
      entryId: entry?.id ?? null,
      memberLabel: entry?.label ?? defaultPartySlotLabel(index)
    });
  });
  return {
    schemaVersion: PARTY_ANNOTATION_SCHEMA_VERSION,
    enabled: input.enabled ?? true,
    size: partySizeForSlotCount(count),
    slots
  };
}

export function clonePartyAnnotations(party: PartyAnnotations): PartyAnnotations {
  return {
    schemaVersion: PARTY_ANNOTATION_SCHEMA_VERSION,
    enabled: party.enabled,
    size: { ...party.size },
    slots: party.slots.map((slot) => ({ ...slot }))
  };
}

export function setPartyEnabled(party: PartyAnnotations, enabled: boolean): PartyAnnotations {
  return { ...clonePartyAnnotations(party), enabled };
}

export function renamePartySlot(
  party: PartyAnnotations,
  slotId: PartySlotId,
  memberLabel: string
): PartyAnnotations {
  return mapPartySlot(party, slotId, (slot, index) => ({
    ...slot,
    memberLabel: normalizePartyMemberLabel(memberLabel, defaultPartySlotLabel(index))
  }));
}

export function setPartySlotRole(
  party: PartyAnnotations,
  slotId: PartySlotId,
  role: string | null
): PartyAnnotations {
  return mapPartySlot(party, slotId, (slot) => ({ ...slot, role: normalizePartyRole(role) }));
}

export function setPartySlotKind(
  party: PartyAnnotations,
  slotId: PartySlotId,
  memberKind: PartyMemberKind,
  memberKindLabel: string | null = null
): PartyAnnotations {
  return mapPartySlot(party, slotId, (slot) => ({
    ...slot,
    memberKind,
    memberKindLabel: normalizePartyMemberKindLabel(memberKind, memberKindLabel)
  }));
}

export function setPartySlotNotes(
  party: PartyAnnotations,
  slotId: PartySlotId,
  notes: string | null
): PartyAnnotations {
  return mapPartySlot(party, slotId, (slot) => ({
    ...slot,
    notes: normalizePartySlotNotes(notes)
  }));
}

export function assignPartySlotEntry(
  party: PartyAnnotations,
  slotId: PartySlotId,
  entryId: BuildSetEntryId
): PartyAnnotations {
  if (party.slots.some((slot) => slot.id !== slotId && slot.entryId === entryId)) {
    return party;
  }
  return mapPartySlot(party, slotId, (slot) => ({ ...slot, entryId }));
}

export function clearPartySlotEntry(
  party: PartyAnnotations,
  slotId: PartySlotId
): PartyAnnotations {
  return mapPartySlot(party, slotId, (slot) => ({ ...slot, entryId: null }));
}

export function clearPartyEntryReferences(
  party: PartyAnnotations,
  entryId: BuildSetEntryId
): PartyAnnotations {
  return {
    ...party,
    slots: party.slots.map((slot) =>
      slot.entryId === entryId ? { ...slot, entryId: null } : { ...slot }
    )
  };
}

export function duplicatePartySlotMetadata(
  party: PartyAnnotations,
  sourceSlotId: PartySlotId,
  targetSlotId: PartySlotId
): PartyAnnotations {
  const source = party.slots.find((slot) => slot.id === sourceSlotId);
  if (source === undefined) {
    return party;
  }
  return mapPartySlot(party, targetSlotId, (slot) => ({
    ...slot,
    memberLabel: source.memberLabel,
    role: source.role,
    memberKind: source.memberKind,
    memberKindLabel: source.memberKindLabel,
    notes: source.notes
  }));
}

export function resetPartySlotMetadata(
  party: PartyAnnotations,
  slotId: PartySlotId
): PartyAnnotations {
  return mapPartySlot(party, slotId, (slot, index) => ({
    ...slot,
    memberLabel: defaultPartySlotLabel(index),
    role: null,
    memberKind: "unspecified",
    memberKindLabel: null,
    notes: null
  }));
}

export function movePartySlot(
  party: PartyAnnotations,
  slotId: PartySlotId,
  direction: "earlier" | "later"
): PartyAnnotations {
  const index = party.slots.findIndex((slot) => slot.id === slotId);
  const target = direction === "earlier" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= party.slots.length) {
    return party;
  }
  const slots = party.slots.map((slot) => ({ ...slot }));
  const [removed] = slots.splice(index, 1);
  if (removed === undefined) {
    return party;
  }
  slots.splice(target, 0, removed);
  return {
    ...party,
    slots
  };
}

export function resizePartyAnnotations(
  party: PartyAnnotations,
  input: {
    readonly size: PartySize;
    readonly slotIds?: readonly PartySlotId[];
  }
): PartyAnnotations {
  const targetSize = partySizeValue(input.size);
  if (targetSize === party.slots.length) {
    return {
      ...party,
      size: partySizeForSlotCount(targetSize),
      slots: party.slots.map((slot) => ({ ...slot }))
    };
  }
  if (targetSize > party.slots.length) {
    const added = Array.from({ length: targetSize - party.slots.length }, (_, offset) => {
      const index = party.slots.length + offset;
      return createPartySlotAnnotation({
        id: input.slotIds?.[offset] ?? partySlotId(`party-slot-${index + 1}`),
        index
      });
    });
    return {
      ...party,
      size: partySizeForSlotCount(targetSize),
      slots: [...party.slots.map((slot) => ({ ...slot })), ...added]
    };
  }
  const removed = party.slots.slice(targetSize);
  if (!removed.every((slot, offset) => isDefaultEmptyPartySlot(slot, targetSize + offset))) {
    return party;
  }
  return {
    ...party,
    size: partySizeForSlotCount(targetSize),
    slots: party.slots.slice(0, targetSize).map((slot) => ({ ...slot }))
  };
}

export function unassignedPartyEntryIds(
  party: PartyAnnotations | null,
  entries: readonly { readonly id: BuildSetEntryId }[]
): readonly BuildSetEntryId[] {
  const assigned = new Set(
    (party?.slots ?? []).flatMap((slot) => (slot.entryId === null ? [] : [slot.entryId]))
  );
  return entries.flatMap((entry) => (assigned.has(entry.id) ? [] : [entry.id]));
}

export function repairSelectedPartySlotId(
  party: PartyAnnotations | null,
  selectedSlotId: PartySlotId | null
): PartySlotId | null {
  if (party === null || party.slots.length === 0) {
    return null;
  }
  if (selectedSlotId !== null && party.slots.some((slot) => slot.id === selectedSlotId)) {
    return selectedSlotId;
  }
  return party.slots[0]?.id ?? null;
}

export function validatePartyAnnotations(
  party: PartyAnnotations,
  options: {
    readonly entries?: readonly { readonly id: BuildSetEntryId }[];
    readonly includeEmptySlotIssues?: boolean;
  } = {}
): readonly PartyStructuralIssue[] {
  const issues: PartyStructuralIssue[] = [];
  const size = partySizeValue(party.size);
  if (party.schemaVersion !== PARTY_ANNOTATION_SCHEMA_VERSION) {
    issues.push(
      issue(
        "unsupported-party-version",
        "error",
        "$.schemaVersion",
        "Party annotation schema version is not supported."
      )
    );
  }
  if (size < MIN_PARTY_SLOTS || size > MAX_PARTY_SLOTS) {
    issues.push(
      issue("invalid-party-size", "error", "$.size.size", "Party size is outside accepted bounds.")
    );
  }
  if (party.slots.length > MAX_PARTY_SLOTS) {
    issues.push(
      issue(
        "too-many-party-slots",
        "error",
        "$.slots",
        `Parties support at most ${MAX_PARTY_SLOTS} slots.`
      )
    );
  }
  if (party.slots.length !== size) {
    issues.push(
      issue(
        "party-size-mismatch",
        "error",
        "$.slots",
        "Party slot count must match the declared party size."
      )
    );
  }
  const entryIds =
    options.entries === undefined ? null : new Set(options.entries.map((entry) => entry.id));
  const seenSlots = new Set<string>();
  const seenAssignments = new Set<string>();
  party.slots.forEach((slot, index) => {
    const path = `$.slots[${index}]`;
    if (seenSlots.has(slot.id)) {
      issues.push({
        ...issue(
          "duplicate-party-slot-id",
          "error",
          `${path}.id`,
          "Party slot IDs must be unique."
        ),
        slotId: slot.id
      });
    }
    seenSlots.add(slot.id);
    if (slot.memberLabel.length === 0 || slot.memberLabel.length > MAX_PARTY_MEMBER_LABEL_LENGTH) {
      issues.push({
        ...issue(
          "invalid-party-member-label",
          "error",
          `${path}.memberLabel`,
          "Party member label is outside accepted bounds."
        ),
        slotId: slot.id
      });
    }
    if (slot.role !== null && slot.role.length > MAX_PARTY_ROLE_LENGTH) {
      issues.push({
        ...issue(
          "invalid-party-role",
          "error",
          `${path}.role`,
          "Party role is outside accepted bounds."
        ),
        slotId: slot.id
      });
    }
    if (!isPartyMemberKind(slot.memberKind)) {
      issues.push({
        ...issue(
          "invalid-party-member-kind",
          "error",
          `${path}.memberKind`,
          "Party member kind is not supported."
        ),
        slotId: slot.id
      });
    }
    if (
      slot.memberKind === "freeform" &&
      (slot.memberKindLabel === null || slot.memberKindLabel.length === 0)
    ) {
      issues.push({
        ...issue(
          "missing-party-member-kind-label",
          "warning",
          `${path}.memberKindLabel`,
          "Freeform party member kind needs a label."
        ),
        slotId: slot.id
      });
    }
    if (
      slot.memberKindLabel !== null &&
      slot.memberKindLabel.length > MAX_PARTY_MEMBER_KIND_LABEL_LENGTH
    ) {
      issues.push({
        ...issue(
          "invalid-party-member-kind-label",
          "error",
          `${path}.memberKindLabel`,
          "Party member kind label is outside accepted bounds."
        ),
        slotId: slot.id
      });
    }
    if (slot.notes !== null && slot.notes.length > MAX_PARTY_SLOT_NOTES_LENGTH) {
      issues.push({
        ...issue(
          "invalid-party-slot-notes",
          "error",
          `${path}.notes`,
          "Party slot notes are outside accepted bounds."
        ),
        slotId: slot.id
      });
    }
    if (slot.entryId === null) {
      if (options.includeEmptySlotIssues === true) {
        issues.push({
          ...issue("empty-party-slot", "info", `${path}.entryId`, "Party slot is empty."),
          slotId: slot.id
        });
      }
      return;
    }
    if (seenAssignments.has(slot.entryId)) {
      issues.push({
        ...issue(
          "duplicate-party-entry-assignment",
          "error",
          `${path}.entryId`,
          "A build-set entry can be assigned to at most one party slot."
        ),
        slotId: slot.id,
        entryId: slot.entryId
      });
    }
    seenAssignments.add(slot.entryId);
    if (entryIds !== null && !entryIds.has(slot.entryId)) {
      issues.push({
        ...issue(
          "missing-party-entry-reference",
          "error",
          `${path}.entryId`,
          "Party slot references a missing build-set entry."
        ),
        slotId: slot.id,
        entryId: slot.entryId
      });
    }
  });
  return issues.sort(
    (left, right) =>
      left.path.localeCompare(right.path, "en-US") || left.code.localeCompare(right.code, "en-US")
  );
}

function clampPartySize(size: number): number {
  if (!Number.isFinite(size)) {
    return DEFAULT_EMPTY_PARTY_SIZE;
  }
  return Math.min(MAX_PARTY_SLOTS, Math.max(MIN_PARTY_SLOTS, Math.trunc(size)));
}

function normalizeNullablePartyText(value: string | null, max: number): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed.slice(0, max);
}

function isDefaultEmptyPartySlot(slot: PartySlotAnnotation, index: number): boolean {
  return (
    slot.entryId === null &&
    slot.memberLabel === defaultPartySlotLabel(index) &&
    slot.role === null &&
    slot.memberKind === "unspecified" &&
    slot.memberKindLabel === null &&
    slot.notes === null
  );
}

function mapPartySlot(
  party: PartyAnnotations,
  slotId: PartySlotId,
  mutate: (slot: PartySlotAnnotation, index: number) => PartySlotAnnotation
): PartyAnnotations {
  let changed = false;
  const slots = party.slots.map((slot, index) => {
    if (slot.id !== slotId) {
      return { ...slot };
    }
    changed = true;
    return mutate(slot, index);
  });
  return changed ? { ...party, slots } : party;
}

function issue(
  code: string,
  severity: PartyStructuralIssueSeverity,
  path: string,
  message: string
): PartyStructuralIssue {
  return { code, severity, path, message };
}
