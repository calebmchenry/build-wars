import type { AuthoredDocumentId, Brand } from "./ids";
import { authoredDocumentId } from "./ids";
import type { Build } from "./build";

export const BUILD_SET_SCHEMA_VERSION = 1;
export const MAX_BUILD_SET_ENTRIES = 16;
export const MAX_BUILD_SET_NAME_LENGTH = 120;
export const MAX_BUILD_SET_ENTRY_LABEL_LENGTH = 120;
export const MAX_BUILD_SET_ENTRY_NOTES_LENGTH = 1_000;

export type BuildSetEntryId = Brand<string, "BuildSetEntryId">;
export type BuildSetEntryKind = "build" | "variant" | "freeform";

export interface BuildSetEntry<Payload = Build> {
  readonly id: BuildSetEntryId;
  readonly label: string;
  readonly kind: BuildSetEntryKind;
  readonly notes: string | null;
  readonly build: Payload;
}

export interface BuildSet<Payload = Build> {
  readonly schemaVersion: typeof BUILD_SET_SCHEMA_VERSION;
  readonly id: AuthoredDocumentId;
  readonly name: string;
  readonly entries: readonly BuildSetEntry<Payload>[];
}

export interface BuildSetValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

const ENTRY_KINDS = new Set<BuildSetEntryKind>(["build", "variant", "freeform"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function buildSetEntryId(value: string): BuildSetEntryId {
  return value as BuildSetEntryId;
}

export function createBlankBuildSet<Payload>(
  input: {
    readonly id?: AuthoredDocumentId;
    readonly name?: string;
    readonly entries?: readonly BuildSetEntry<Payload>[];
  } = {}
): BuildSet<Payload> {
  return {
    schemaVersion: BUILD_SET_SCHEMA_VERSION,
    id: input.id ?? authoredDocumentId("build-set:workspace"),
    name: normalizeBuildSetName(input.name ?? "Untitled Build Set"),
    entries: input.entries ?? []
  };
}

export function createBuildSetEntry<Payload>(input: {
  readonly id: BuildSetEntryId;
  readonly label: string;
  readonly kind?: BuildSetEntryKind;
  readonly notes?: string | null;
  readonly build: Payload;
}): BuildSetEntry<Payload> {
  return {
    id: input.id,
    label: normalizeBuildSetEntryLabel(input.label),
    kind: input.kind ?? "build",
    notes: normalizeBuildSetEntryNotes(input.notes ?? null),
    build: input.build
  };
}

export function normalizeBuildSetName(value: string): string {
  const trimmed = value.trim();
  return (trimmed.length === 0 ? "Untitled Build Set" : trimmed).slice(
    0,
    MAX_BUILD_SET_NAME_LENGTH
  );
}

export function normalizeBuildSetEntryLabel(value: string): string {
  const trimmed = value.trim();
  return (trimmed.length === 0 ? "Untitled Loadout" : trimmed).slice(
    0,
    MAX_BUILD_SET_ENTRY_LABEL_LENGTH
  );
}

export function normalizeBuildSetEntryNotes(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed.slice(0, MAX_BUILD_SET_ENTRY_NOTES_LENGTH);
}

export function isBuildSetEntryKind(value: string): value is BuildSetEntryKind {
  return ENTRY_KINDS.has(value as BuildSetEntryKind);
}

export function insertBuildSetEntry<Payload>(
  entries: readonly BuildSetEntry<Payload>[],
  entry: BuildSetEntry<Payload>,
  afterEntryId: BuildSetEntryId | null = null
): readonly BuildSetEntry<Payload>[] {
  if (entries.length >= MAX_BUILD_SET_ENTRIES || entries.some((item) => item.id === entry.id)) {
    return entries;
  }
  if (afterEntryId === null) {
    return [...entries, entry];
  }
  const index = entries.findIndex((item) => item.id === afterEntryId);
  if (index < 0) {
    return [...entries, entry];
  }
  return [...entries.slice(0, index + 1), entry, ...entries.slice(index + 1)];
}

export function removeBuildSetEntry<Payload>(
  entries: readonly BuildSetEntry<Payload>[],
  entryId: BuildSetEntryId
): readonly BuildSetEntry<Payload>[] {
  return entries.filter((entry) => entry.id !== entryId);
}

export function moveBuildSetEntry<Payload>(
  entries: readonly BuildSetEntry<Payload>[],
  entryId: BuildSetEntryId,
  direction: "earlier" | "later"
): readonly BuildSetEntry<Payload>[] {
  const index = entries.findIndex((entry) => entry.id === entryId);
  const target = direction === "earlier" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= entries.length) {
    return entries;
  }
  const copy = [...entries];
  const [removed] = copy.splice(index, 1);
  if (removed === undefined) {
    return entries;
  }
  copy.splice(target, 0, removed);
  return copy;
}

export function renameBuildSetEntry<Payload>(
  entries: readonly BuildSetEntry<Payload>[],
  entryId: BuildSetEntryId,
  label: string
): readonly BuildSetEntry<Payload>[] {
  return mapBuildSetEntry(entries, entryId, (entry) => ({
    ...entry,
    label: normalizeBuildSetEntryLabel(label)
  }));
}

export function setBuildSetEntryNotes<Payload>(
  entries: readonly BuildSetEntry<Payload>[],
  entryId: BuildSetEntryId,
  notes: string | null
): readonly BuildSetEntry<Payload>[] {
  return mapBuildSetEntry(entries, entryId, (entry) => ({
    ...entry,
    notes: normalizeBuildSetEntryNotes(notes)
  }));
}

export function setBuildSetEntryKind<Payload>(
  entries: readonly BuildSetEntry<Payload>[],
  entryId: BuildSetEntryId,
  kind: BuildSetEntryKind
): readonly BuildSetEntry<Payload>[] {
  return mapBuildSetEntry(entries, entryId, (entry) => ({ ...entry, kind }));
}

export function promoteBuildSetEntry<Payload>(
  entries: readonly BuildSetEntry<Payload>[],
  entryId: BuildSetEntryId
): readonly BuildSetEntry<Payload>[] {
  return setBuildSetEntryKind(entries, entryId, "build");
}

export function duplicateBuildSetEntry<Payload>(
  entries: readonly BuildSetEntry<Payload>[],
  sourceEntryId: BuildSetEntryId,
  input: {
    readonly id: BuildSetEntryId;
    readonly build: Payload;
    readonly label?: string;
  }
): readonly BuildSetEntry<Payload>[] {
  const source = entries.find((entry) => entry.id === sourceEntryId);
  if (source === undefined) {
    return entries;
  }
  return insertBuildSetEntry(
    entries,
    {
      id: input.id,
      label: uniqueBuildSetEntryLabel(entries, input.label ?? `${source.label} Variant`, input.id),
      kind: "variant",
      notes: source.notes,
      build: input.build
    },
    sourceEntryId
  );
}

export function repairSelectedBuildSetEntryId<Payload>(
  entries: readonly BuildSetEntry<Payload>[],
  selectedEntryId: BuildSetEntryId | null
): BuildSetEntryId | null {
  if (entries.length === 0) {
    return null;
  }
  if (selectedEntryId !== null && entries.some((entry) => entry.id === selectedEntryId)) {
    return selectedEntryId;
  }
  return entries[0]?.id ?? null;
}

export function cloneBuildForBuildSetEntry(build: Build, id: AuthoredDocumentId): Build {
  return {
    schemaVersion: build.schemaVersion,
    catalogVersion: build.catalogVersion,
    id,
    name: build.name,
    mode: build.mode,
    primaryProfessionId: build.primaryProfessionId,
    secondaryProfessionId: build.secondaryProfessionId,
    attributes: build.attributes.map((attribute) => ({ ...attribute })),
    skillBar: [
      build.skillBar[0],
      build.skillBar[1],
      build.skillBar[2],
      build.skillBar[3],
      build.skillBar[4],
      build.skillBar[5],
      build.skillBar[6],
      build.skillBar[7]
    ],
    titleRankOverrides: build.titleRankOverrides.map((override) => ({ ...override })),
    equipment:
      build.equipment === null
        ? null
        : {
            schemaVersion: build.equipment.schemaVersion,
            armor: build.equipment.armor.map((piece) => ({
              slot: piece.slot,
              rune: piece.rune === null ? null : { ...piece.rune },
              insignia: piece.insignia === null ? null : { ...piece.insignia },
              headgearAttribute:
                piece.headgearAttribute === null ? null : { ...piece.headgearAttribute }
            })),
            weaponSets: build.equipment.weaponSets.map((set) => ({
              slot: set.slot,
              mainHand:
                set.mainHand === null
                  ? null
                  : {
                      weapon: set.mainHand.weapon === null ? null : { ...set.mainHand.weapon },
                      modifiers: set.mainHand.modifiers.map((modifier) => ({ ...modifier })),
                      requirement:
                        set.mainHand.requirement === null
                          ? null
                          : {
                              attribute:
                                set.mainHand.requirement.attribute === null
                                  ? null
                                  : { ...set.mainHand.requirement.attribute },
                              rank: set.mainHand.requirement.rank,
                              reason: set.mainHand.requirement.reason
                            }
                    },
              offHand:
                set.offHand === null
                  ? null
                  : {
                      weapon: set.offHand.weapon === null ? null : { ...set.offHand.weapon },
                      modifiers: set.offHand.modifiers.map((modifier) => ({ ...modifier })),
                      requirement:
                        set.offHand.requirement === null
                          ? null
                          : {
                              attribute:
                                set.offHand.requirement.attribute === null
                                  ? null
                                  : { ...set.offHand.requirement.attribute },
                              rank: set.offHand.requirement.rank,
                              reason: set.offHand.requirement.reason
                            }
                    }
            }))
          }
  };
}

export function uniqueBuildSetEntryLabel(
  entries: readonly { readonly id: BuildSetEntryId; readonly label: string }[],
  preferred: string,
  ignoredEntryId: BuildSetEntryId | null = null
): string {
  const normalized = normalizeBuildSetEntryLabel(preferred);
  const existing = new Set(
    entries
      .filter((entry) => entry.id !== ignoredEntryId)
      .map((entry) => entry.label.toLocaleLowerCase("en-US"))
  );
  if (!existing.has(normalized.toLocaleLowerCase("en-US"))) {
    return normalized;
  }
  for (let suffix = 2; suffix < 1_000; suffix += 1) {
    const candidate = normalizeBuildSetEntryLabel(`${normalized} ${suffix}`);
    if (!existing.has(candidate.toLocaleLowerCase("en-US"))) {
      return candidate;
    }
  }
  return normalized;
}

export function validateBuildSetShape<Payload>(
  set: BuildSet<Payload>,
  options: {
    readonly payloadIsPresent?: (payload: Payload) => boolean;
  } = {}
): readonly BuildSetValidationIssue[] {
  const issues: BuildSetValidationIssue[] = [];
  if (set.schemaVersion !== BUILD_SET_SCHEMA_VERSION) {
    issues.push({
      code: "unsupported-build-set-version",
      path: "$.schemaVersion",
      message: "Build set schema version is not supported."
    });
  }
  if (set.name.length === 0 || set.name.length > MAX_BUILD_SET_NAME_LENGTH) {
    issues.push({
      code: "invalid-build-set-name",
      path: "$.name",
      message: "Build set name is outside accepted bounds."
    });
  }
  if (set.entries.length > MAX_BUILD_SET_ENTRIES) {
    issues.push({
      code: "too-many-build-set-entries",
      path: "$.entries",
      message: `Build sets support at most ${MAX_BUILD_SET_ENTRIES} entries.`
    });
  }
  const seen = new Set<string>();
  set.entries.forEach((entry, index) => {
    const path = `$.entries[${index}]`;
    if (seen.has(entry.id)) {
      issues.push({
        code: "duplicate-build-set-entry-id",
        path: `${path}.id`,
        message: "Build set entry IDs must be unique within a set."
      });
    }
    seen.add(entry.id);
    if (!isBuildSetEntryKind(entry.kind)) {
      issues.push({
        code: "invalid-build-set-entry-kind",
        path: `${path}.kind`,
        message: "Build set entry kind is not supported."
      });
    }
    if (entry.label.length === 0 || entry.label.length > MAX_BUILD_SET_ENTRY_LABEL_LENGTH) {
      issues.push({
        code: "invalid-build-set-entry-label",
        path: `${path}.label`,
        message: "Build set entry label is outside accepted bounds."
      });
    }
    if (entry.notes !== null && entry.notes.length > MAX_BUILD_SET_ENTRY_NOTES_LENGTH) {
      issues.push({
        code: "invalid-build-set-entry-notes",
        path: `${path}.notes`,
        message: "Build set entry notes are outside accepted bounds."
      });
    }
    if (options.payloadIsPresent?.(entry.build) === false) {
      issues.push({
        code: "missing-build-set-entry-payload",
        path: `${path}.build`,
        message: "Build set entries must carry a payload."
      });
    }
  });
  return issues;
}

export function containsBuildSetDangerousKey(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some((item) => containsBuildSetDangerousKey(item));
  }
  if (typeof input !== "object" || input === null) {
    return false;
  }
  return Object.keys(input).some(
    (key) =>
      DANGEROUS_KEYS.has(key) ||
      containsBuildSetDangerousKey((input as Record<string, unknown>)[key])
  );
}

function mapBuildSetEntry<Payload>(
  entries: readonly BuildSetEntry<Payload>[],
  entryId: BuildSetEntryId,
  mutate: (entry: BuildSetEntry<Payload>) => BuildSetEntry<Payload>
): readonly BuildSetEntry<Payload>[] {
  let changed = false;
  const next = entries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    changed = true;
    return mutate(entry);
  });
  return changed ? next : entries;
}
