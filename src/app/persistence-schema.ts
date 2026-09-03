import {
  authoredDocumentId,
  BUILD_SCHEMA_VERSION,
  catalogId,
  EQUIPMENT_LOADOUT_SCHEMA_VERSION,
  ARMOR_SLOTS,
  TITLE_RANK_OVERRIDE_LIMIT,
  WEAPON_SET_SLOTS,
  MAX_MODIFIERS_PER_HAND_TO_VALIDATE,
  isCanonicalTitleRankKey,
  normalizeTitleRankKey,
  type AttributeId,
  type ArmorPiece,
  type AuthoredWeaponRequirement,
  type Build,
  type EquipmentLoadout,
  type EquipmentSelectionState,
  type GameMode,
  type InsigniaId,
  type RuneId,
  type SkillBar,
  type SkillId,
  type TemplateFidelity,
  type TemplateInputKind,
  type TemplateKind,
  type TemplateSourceEnvelope,
  type TitleRankOverride,
  type ValidationResult,
  type WeaponHandSelection,
  type WeaponId,
  type WeaponModifierId,
  type WeaponSet
} from "../domain";
import {
  createBlankEditorState,
  type EditorState,
  type PveBudgetState,
  type RawOverlayNamespace,
  type RawOverlayOutcomeKind,
  type RawSkillBarOverlay,
  type RawTemplateOverlay,
  type RawTemplateOverlayEntry
} from "./editor-state";

export const LOCAL_LIBRARY_STORAGE_KEY = "build-wars:v1";
export const LOCAL_LIBRARY_KIND = "build-wars-local-library";
export const LOCAL_LIBRARY_SCHEMA_VERSION = 1;

export type LocalBuildRecordId = string & { readonly __brand: "LocalBuildRecordId" };

export interface PersistedCatalogFacts {
  readonly buildCatalogVersion: string | null;
  readonly professionAttributeCatalogVersion: string | null;
  readonly skillCatalogVersion: string | null;
  readonly runeCatalogVersion?: string | null;
  readonly insigniaCatalogVersion?: string | null;
  readonly weaponCatalogVersion?: string | null;
  readonly weaponModifierCatalogVersion?: string | null;
  readonly weaponCatalogSetVersion?: string | null;
  readonly weaponCatalogSetDigest?: string | null;
  readonly weaponModifierCatalogSetVersion?: string | null;
  readonly weaponModifierCatalogSetDigest?: string | null;
  readonly ruleEngineVersion: string | null;
}

export interface PersistedBuildSnapshot {
  readonly build: Build;
  readonly pveBudget: PveBudgetState;
  readonly rawTemplate: RawTemplateOverlay;
}

export interface PersistedWorkingDraft {
  readonly snapshot: PersistedBuildSnapshot;
  readonly associatedRecordId: LocalBuildRecordId | null;
  readonly savedWith: PersistedCatalogFacts;
}

export interface PersistedSavedBuildRecord {
  readonly id: LocalBuildRecordId;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly favorite: boolean;
  readonly tags: readonly string[];
  readonly notes: string | null;
  readonly snapshot: PersistedBuildSnapshot;
  readonly savedWith: PersistedCatalogFacts;
}

export interface LocalLibraryMetadata {
  readonly lastWriteReason: string | null;
  readonly lastCompactedAt: string | null;
}

export interface LocalLibraryEnvelopeV1 {
  readonly schemaVersion: typeof LOCAL_LIBRARY_SCHEMA_VERSION;
  readonly kind: typeof LOCAL_LIBRARY_KIND;
  readonly revision: number;
  readonly updatedAt: string;
  readonly workingDraft: PersistedWorkingDraft | null;
  readonly savedBuilds: readonly PersistedSavedBuildRecord[];
  readonly metadata: LocalLibraryMetadata;
}

export interface PersistenceDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export type LocalLibraryParseResult =
  | {
      readonly ok: true;
      readonly envelope: LocalLibraryEnvelopeV1;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly writeBlocked: boolean;
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly PersistenceDiagnostic[];
      readonly writeBlocked: true;
    };

const MAX_RECORDS = 250;
const MAX_ATTRIBUTES = 16;
const MAX_TAGS = 24;
const MAX_STRING = 2_048;
const MAX_NAME = 120;
const MAX_SELECTION_REASON = 240;
const MAX_TAG = 40;
const MAX_NOTES = 1_000;
const MAX_DIAGNOSTICS = 24;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const GAME_MODES = new Set<GameMode>(["pve", "pvp", "unknown"]);
const TEMPLATE_INPUT_KINDS = new Set<TemplateInputKind>(["bare", "chat-code"]);
const TEMPLATE_KINDS = new Set<TemplateKind>(["skill", "equipment", "paw-ned2"]);
const TEMPLATE_FIDELITIES = new Set<TemplateFidelity>([
  "exact-source",
  "field-complete-normalized",
  "unsupported-or-lossy"
]);
const RAW_NAMESPACES = new Set<RawOverlayNamespace>(["profession", "attribute", "skill"]);
const RAW_OUTCOMES = new Set<RawOverlayOutcomeKind>([
  "none",
  "empty",
  "known",
  "reserved",
  "unsupported",
  "dispositioned",
  "unknown"
]);

export function localBuildRecordId(value: string): LocalBuildRecordId {
  return value as LocalBuildRecordId;
}

export function emptyLocalLibraryEnvelope(now: string, revision = 0): LocalLibraryEnvelopeV1 {
  return {
    schemaVersion: LOCAL_LIBRARY_SCHEMA_VERSION,
    kind: LOCAL_LIBRARY_KIND,
    revision,
    updatedAt: now,
    workingDraft: null,
    savedBuilds: [],
    metadata: {
      lastWriteReason: null,
      lastCompactedAt: null
    }
  };
}

export function persistedCatalogFactsFromValidation(
  validation: ValidationResult
): PersistedCatalogFacts {
  return {
    buildCatalogVersion: validation.validatedAgainst.buildCatalogVersion,
    professionAttributeCatalogVersion:
      validation.validatedAgainst.professionAttributeCatalogVersion,
    skillCatalogVersion: validation.validatedAgainst.skillCatalogVersion,
    runeCatalogVersion: validation.validatedAgainst.runeCatalogVersion ?? null,
    insigniaCatalogVersion: validation.validatedAgainst.insigniaCatalogVersion ?? null,
    weaponCatalogVersion: validation.validatedAgainst.weaponCatalogVersion ?? null,
    weaponModifierCatalogVersion: validation.validatedAgainst.weaponModifierCatalogVersion ?? null,
    weaponCatalogSetVersion: validation.validatedAgainst.weaponCatalogSetVersion ?? null,
    weaponCatalogSetDigest: validation.validatedAgainst.weaponCatalogSetDigest ?? null,
    weaponModifierCatalogSetVersion:
      validation.validatedAgainst.weaponModifierCatalogSetVersion ?? null,
    weaponModifierCatalogSetDigest:
      validation.validatedAgainst.weaponModifierCatalogSetDigest ?? null,
    ruleEngineVersion: validation.validatedAgainst.ruleEngineVersion
  };
}

export function createPersistedBuildSnapshot(state: EditorState): PersistedBuildSnapshot {
  return {
    build: cloneBuild(state.build),
    pveBudget: { ...state.pveBudget },
    rawTemplate: cloneRawTemplateOverlay(state.rawTemplate)
  };
}

export function hydrateEditorFromSnapshot(snapshot: PersistedBuildSnapshot): EditorState {
  return {
    ...createBlankEditorState(snapshot.build.name),
    build: cloneBuild(snapshot.build),
    pveBudget: { ...snapshot.pveBudget },
    rawTemplate: cloneRawTemplateOverlay(snapshot.rawTemplate),
    dialogs: {
      open: null,
      importInput: "",
      exportName: snapshot.rawTemplate.templateName
    }
  };
}

export function createWorkingDraft(
  state: EditorState,
  associatedRecordId: LocalBuildRecordId | null,
  savedWith: PersistedCatalogFacts
): PersistedWorkingDraft {
  return {
    snapshot: createPersistedBuildSnapshot(state),
    associatedRecordId,
    savedWith
  };
}

export function prepareEnvelopeForWrite(
  envelope: LocalLibraryEnvelopeV1,
  now: string,
  reason: string
): LocalLibraryEnvelopeV1 {
  return {
    ...envelope,
    revision: envelope.revision + 1,
    updatedAt: now,
    metadata: {
      ...envelope.metadata,
      lastWriteReason: boundString(reason, MAX_NAME)
    }
  };
}

export function parseLocalLibraryJson(text: string): LocalLibraryParseResult {
  try {
    return parseLocalLibraryEnvelope(JSON.parse(text) as unknown);
  } catch {
    const diagnostics = [
      diagnostic("malformed-json", "$", "Stored local library JSON is malformed.")
    ];
    return { ok: false, diagnostics, writeBlocked: true };
  }
}

export function parseLocalLibraryEnvelope(input: unknown): LocalLibraryParseResult {
  const diagnostics: PersistenceDiagnostic[] = [];
  if (containsDangerousKey(input)) {
    addDiagnostic(
      diagnostics,
      "dangerous-key",
      "$",
      "Stored data contains a key that is not accepted in Build Wars local data."
    );
    return { ok: false, diagnostics, writeBlocked: true };
  }

  const migrated = migrateLocalLibraryEnvelope(input, diagnostics);
  if (!migrated.ok) {
    return { ok: false, diagnostics, writeBlocked: true };
  }

  const root = asRecord(migrated.value, "$", diagnostics);
  if (root === null) {
    return { ok: false, diagnostics, writeBlocked: true };
  }
  if (root.kind !== LOCAL_LIBRARY_KIND) {
    addDiagnostic(
      diagnostics,
      "invalid-kind",
      "$.kind",
      "Stored data is not a Build Wars library."
    );
    return { ok: false, diagnostics, writeBlocked: true };
  }
  if (root.schemaVersion !== LOCAL_LIBRARY_SCHEMA_VERSION) {
    addDiagnostic(
      diagnostics,
      "unsupported-schema-version",
      "$.schemaVersion",
      "Stored local library schema version is not supported."
    );
    return { ok: false, diagnostics, writeBlocked: true };
  }

  const revision = safeInteger(root.revision, "$.revision", diagnostics, { min: 0 });
  const updatedAt = timestamp(root.updatedAt, "$.updatedAt", diagnostics);
  const metadata = validateMetadata(root.metadata, "$.metadata", diagnostics);
  const savedBuilds = validateSavedBuilds(root.savedBuilds, diagnostics);
  const workingDraft = validateWorkingDraft(root.workingDraft, "$.workingDraft", diagnostics);

  if (revision === null || updatedAt === null || metadata === null || savedBuilds === null) {
    return { ok: false, diagnostics, writeBlocked: true };
  }

  const envelope: LocalLibraryEnvelopeV1 = {
    schemaVersion: LOCAL_LIBRARY_SCHEMA_VERSION,
    kind: LOCAL_LIBRARY_KIND,
    revision,
    updatedAt,
    workingDraft,
    savedBuilds,
    metadata
  };
  const writeBlocked = diagnostics.some((item) =>
    ["invalid-record", "duplicate-record-id", "invalid-working-draft"].includes(item.code)
  );
  return { ok: true, envelope, diagnostics, writeBlocked };
}

export function serializeLocalLibraryEnvelope(envelope: LocalLibraryEnvelopeV1): string {
  return JSON.stringify(stableJson(envelope));
}

export function fingerprintPersistedSnapshot(snapshot: PersistedBuildSnapshot): string {
  return JSON.stringify(stableJson(snapshot));
}

export function fingerprintSavedRecord(record: PersistedSavedBuildRecord): string {
  return JSON.stringify(stableJson(record));
}

function migrateLocalLibraryEnvelope(
  input: unknown,
  diagnostics: PersistenceDiagnostic[]
): { readonly ok: true; readonly value: unknown } | { readonly ok: false } {
  const root = asRecord(input, "$", diagnostics);
  if (root === null) {
    return { ok: false };
  }
  if (root.schemaVersion === LOCAL_LIBRARY_SCHEMA_VERSION) {
    return { ok: true, value: input };
  }
  addDiagnostic(
    diagnostics,
    "unsupported-schema-version",
    "$.schemaVersion",
    "No migration exists for this local library schema version."
  );
  return { ok: false };
}

function validateWorkingDraft(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): PersistedWorkingDraft | null {
  if (input === null) {
    return null;
  }
  const startCount = diagnostics.length;
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    addDiagnostic(diagnostics, "invalid-working-draft", path, "Working draft is invalid.");
    return null;
  }
  const snapshot = validateSnapshot(record.snapshot, `${path}.snapshot`, diagnostics);
  const associatedRecordId = nullableRecordId(
    record.associatedRecordId,
    `${path}.associatedRecordId`,
    diagnostics
  );
  const savedWith = validateCatalogFacts(record.savedWith, `${path}.savedWith`, diagnostics);
  if (snapshot === null || associatedRecordId === undefined || savedWith === null) {
    addDiagnostic(diagnostics, "invalid-working-draft", path, "Working draft was skipped.");
    return null;
  }
  if (diagnostics.length > startCount) {
    return null;
  }
  return { snapshot, associatedRecordId, savedWith };
}

function validateSavedBuilds(
  input: unknown,
  diagnostics: PersistenceDiagnostic[]
): readonly PersistedSavedBuildRecord[] | null {
  if (!Array.isArray(input)) {
    addDiagnostic(
      diagnostics,
      "invalid-saved-builds",
      "$.savedBuilds",
      "Saved builds must be an array."
    );
    return null;
  }
  if (input.length > MAX_RECORDS) {
    addDiagnostic(
      diagnostics,
      "oversized-collection",
      "$.savedBuilds",
      `Saved build count exceeds the ${MAX_RECORDS} record limit.`
    );
    return null;
  }

  const records: PersistedSavedBuildRecord[] = [];
  const seen = new Set<string>();
  input.forEach((item, index) => {
    const path = `$.savedBuilds[${index}]`;
    const record = validateSavedRecord(item, path, diagnostics);
    if (record === null) {
      addDiagnostic(diagnostics, "invalid-record", path, "Saved build record was skipped.");
      return;
    }
    if (seen.has(record.id)) {
      addDiagnostic(
        diagnostics,
        "duplicate-record-id",
        `${path}.id`,
        "Duplicate local saved-build record ID was skipped."
      );
      return;
    }
    seen.add(record.id);
    records.push(record);
  });
  return records;
}

function validateSavedRecord(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): PersistedSavedBuildRecord | null {
  const startCount = diagnostics.length;
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    return null;
  }
  const id = recordId(record.id, `${path}.id`, diagnostics);
  const name = stringField(record.name, `${path}.name`, diagnostics, MAX_NAME, {
    allowEmpty: false
  });
  const createdAt = timestamp(record.createdAt, `${path}.createdAt`, diagnostics);
  const updatedAt = timestamp(record.updatedAt, `${path}.updatedAt`, diagnostics);
  const favorite = booleanField(record.favorite, `${path}.favorite`, diagnostics);
  const tags = tagsField(record.tags, `${path}.tags`, diagnostics);
  const notes = nullableString(record.notes, `${path}.notes`, diagnostics, MAX_NOTES);
  const snapshot = validateSnapshot(record.snapshot, `${path}.snapshot`, diagnostics);
  const savedWith = validateCatalogFacts(record.savedWith, `${path}.savedWith`, diagnostics);

  if (
    diagnostics.length > startCount ||
    id === null ||
    name === null ||
    createdAt === null ||
    updatedAt === null ||
    favorite === null ||
    tags === null ||
    notes === undefined ||
    snapshot === null ||
    savedWith === null
  ) {
    return null;
  }

  return {
    id,
    name,
    createdAt,
    updatedAt,
    favorite,
    tags,
    notes,
    snapshot,
    savedWith
  };
}

function validateSnapshot(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): PersistedBuildSnapshot | null {
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    return null;
  }
  const build = validateBuild(record.build, `${path}.build`, diagnostics);
  const pveBudget = validatePveBudget(record.pveBudget, `${path}.pveBudget`, diagnostics);
  const rawTemplate = validateRawTemplate(record.rawTemplate, `${path}.rawTemplate`, diagnostics);
  if (build === null || pveBudget === null || rawTemplate === null) {
    return null;
  }
  return { build, pveBudget, rawTemplate };
}

function validateBuild(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): Build | null {
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    return null;
  }
  const schemaVersion = safeInteger(record.schemaVersion, `${path}.schemaVersion`, diagnostics, {
    min: 1,
    max: BUILD_SCHEMA_VERSION
  });
  const catalogVersion = nullableString(
    record.catalogVersion,
    `${path}.catalogVersion`,
    diagnostics,
    MAX_STRING
  );
  const id = stringField(record.id, `${path}.id`, diagnostics, MAX_STRING, { allowEmpty: false });
  const name = stringField(record.name, `${path}.name`, diagnostics, MAX_NAME, {
    allowEmpty: false
  });
  const mode = enumField(record.mode, `${path}.mode`, diagnostics, GAME_MODES);
  const primaryProfessionId = nullableCatalogId<"Profession">(
    record.primaryProfessionId,
    `${path}.primaryProfessionId`,
    diagnostics
  );
  const secondaryProfessionId = nullableCatalogId<"Profession">(
    record.secondaryProfessionId,
    `${path}.secondaryProfessionId`,
    diagnostics
  );
  const attributes = validateAttributes(record.attributes, `${path}.attributes`, diagnostics);
  const skillBar = validateSkillBar(record.skillBar, `${path}.skillBar`, diagnostics);
  const titleRankOverrides =
    schemaVersion === 1
      ? []
      : validateTitleRankOverrides(
          record.titleRankOverrides,
          `${path}.titleRankOverrides`,
          diagnostics
        );
  const equipment = validateEquipmentLoadout(record.equipment, `${path}.equipment`, diagnostics);

  if (
    schemaVersion === null ||
    catalogVersion === undefined ||
    id === null ||
    name === null ||
    mode === null ||
    primaryProfessionId === undefined ||
    secondaryProfessionId === undefined ||
    attributes === null ||
    skillBar === null ||
    titleRankOverrides === null ||
    equipment === undefined
  ) {
    return null;
  }
  return {
    schemaVersion: BUILD_SCHEMA_VERSION,
    catalogVersion,
    id: authoredDocumentId(id),
    name,
    mode,
    primaryProfessionId,
    secondaryProfessionId,
    attributes,
    skillBar,
    titleRankOverrides,
    equipment
  };
}

function validateEquipmentLoadout(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): EquipmentLoadout | null | undefined {
  if (input === null) {
    return null;
  }
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    return undefined;
  }
  if (!hasOnlyKeys(record, ["armor", "schemaVersion", "weaponSets"])) {
    addDiagnostic(
      diagnostics,
      "invalid-equipment-topology",
      path,
      "Equipment loadout contains unsupported fields."
    );
    return undefined;
  }
  const schemaVersion = safeInteger(record.schemaVersion, `${path}.schemaVersion`, diagnostics, {
    min: EQUIPMENT_LOADOUT_SCHEMA_VERSION,
    max: EQUIPMENT_LOADOUT_SCHEMA_VERSION
  });
  const armor = validateEquipmentArmor(record.armor, `${path}.armor`, diagnostics);
  const weaponSets = validateEquipmentWeaponSets(
    record.weaponSets,
    `${path}.weaponSets`,
    diagnostics
  );
  if (schemaVersion === null || armor === null || weaponSets === null) {
    return undefined;
  }
  return {
    schemaVersion: EQUIPMENT_LOADOUT_SCHEMA_VERSION,
    armor,
    weaponSets
  };
}

function validateEquipmentArmor(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): readonly ArmorPiece[] | null {
  if (!denseArray(input, path, diagnostics) || input.length !== ARMOR_SLOTS.length) {
    addDiagnostic(
      diagnostics,
      "noncanonical-equipment-topology",
      path,
      "Equipment armor must contain the five canonical armor slots."
    );
    return null;
  }
  const armor: ArmorPiece[] = [];
  for (const [index, expectedSlot] of ARMOR_SLOTS.entries()) {
    const item = input[index];
    const itemPath = `${path}[${index}]`;
    const record = asRecord(item, itemPath, diagnostics);
    if (
      record === null ||
      !hasOnlyKeys(record, ["headgearAttribute", "insignia", "rune", "slot"])
    ) {
      addDiagnostic(
        diagnostics,
        "invalid-equipment-topology",
        itemPath,
        "Equipment armor row has an unsupported shape."
      );
      return null;
    }
    if (record.slot !== expectedSlot) {
      addDiagnostic(
        diagnostics,
        "noncanonical-equipment-topology",
        `${itemPath}.slot`,
        "Equipment armor rows must be in canonical slot order."
      );
      return null;
    }
    const rune = validateEquipmentSelection<RuneId>(record.rune, `${itemPath}.rune`, diagnostics);
    const insignia = validateEquipmentSelection<InsigniaId>(
      record.insignia,
      `${itemPath}.insignia`,
      diagnostics
    );
    const headgearAttribute = validateEquipmentSelection<AttributeId>(
      record.headgearAttribute,
      `${itemPath}.headgearAttribute`,
      diagnostics
    );
    if (
      rune === undefined ||
      insignia === undefined ||
      headgearAttribute === undefined ||
      (expectedSlot !== "head" && headgearAttribute !== null)
    ) {
      if (expectedSlot !== "head" && headgearAttribute !== null) {
        addDiagnostic(
          diagnostics,
          "invalid-equipment-topology",
          `${itemPath}.headgearAttribute`,
          "Only the head armor slot can persist a headgear attribute bonus."
        );
      }
      return null;
    }
    armor.push({
      slot: expectedSlot,
      rune,
      insignia,
      headgearAttribute
    });
  }
  return armor;
}

function validateEquipmentWeaponSets(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): readonly WeaponSet[] | null {
  if (!denseArray(input, path, diagnostics) || input.length !== WEAPON_SET_SLOTS.length) {
    addDiagnostic(
      diagnostics,
      "noncanonical-equipment-topology",
      path,
      "Equipment weaponSets must contain the four canonical weapon sets."
    );
    return null;
  }
  const sets: WeaponSet[] = [];
  for (const [index, expectedSlot] of WEAPON_SET_SLOTS.entries()) {
    const item = input[index];
    const itemPath = `${path}[${index}]`;
    const record = asRecord(item, itemPath, diagnostics);
    if (record === null || !hasOnlyKeys(record, ["mainHand", "offHand", "slot"])) {
      addDiagnostic(
        diagnostics,
        "invalid-equipment-topology",
        itemPath,
        "Equipment weapon-set row has an unsupported shape."
      );
      return null;
    }
    if (record.slot !== expectedSlot) {
      addDiagnostic(
        diagnostics,
        "noncanonical-equipment-topology",
        `${itemPath}.slot`,
        "Equipment weapon sets must be in canonical slot order."
      );
      return null;
    }
    const mainHand = validateWeaponHand(record.mainHand, `${itemPath}.mainHand`, diagnostics);
    const offHand = validateWeaponHand(record.offHand, `${itemPath}.offHand`, diagnostics);
    if (mainHand === undefined || offHand === undefined) {
      return null;
    }
    sets.push({
      slot: expectedSlot,
      mainHand,
      offHand
    });
  }
  return sets;
}

function validateWeaponHand(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): WeaponHandSelection | null | undefined {
  if (input === null) {
    return null;
  }
  const record = asRecord(input, path, diagnostics);
  if (record === null || !hasOnlyKeys(record, ["modifiers", "requirement", "weapon"])) {
    addDiagnostic(
      diagnostics,
      "invalid-equipment-topology",
      path,
      "Equipment weapon hand has an unsupported shape."
    );
    return undefined;
  }
  const weapon = validateEquipmentSelection<WeaponId>(record.weapon, `${path}.weapon`, diagnostics);
  const modifiers = validateWeaponModifiers(record.modifiers, `${path}.modifiers`, diagnostics);
  const requirement = validateWeaponRequirement(
    record.requirement,
    `${path}.requirement`,
    diagnostics
  );
  if (weapon === undefined || modifiers === null || requirement === undefined) {
    return undefined;
  }
  if (weapon === null && modifiers.length === 0 && requirement === null) {
    addDiagnostic(
      diagnostics,
      "noncanonical-equipment-topology",
      path,
      "Empty weapon hands must persist as null."
    );
    return undefined;
  }
  return {
    weapon,
    modifiers,
    requirement
  };
}

function validateWeaponModifiers(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): readonly EquipmentSelectionState<WeaponModifierId>[] | null {
  if (!denseArray(input, path, diagnostics)) {
    return null;
  }
  if (input.length > MAX_MODIFIERS_PER_HAND_TO_VALIDATE) {
    addDiagnostic(
      diagnostics,
      "oversized-collection",
      path,
      `Weapon modifiers exceed the ${MAX_MODIFIERS_PER_HAND_TO_VALIDATE} modifier limit.`
    );
    return null;
  }
  const modifiers: EquipmentSelectionState<WeaponModifierId>[] = [];
  const knownIds = new Set<number>();
  for (const [index, item] of input.entries()) {
    const selection = validateEquipmentSelection<WeaponModifierId>(
      item,
      `${path}[${index}]`,
      diagnostics
    );
    if (selection === null || selection === undefined) {
      addDiagnostic(
        diagnostics,
        "invalid-equipment-selection",
        `${path}[${index}]`,
        "Weapon modifier entries must be non-null equipment selections."
      );
      return null;
    }
    if (selection.kind === "known") {
      if (knownIds.has(Number(selection.id))) {
        addDiagnostic(
          diagnostics,
          "duplicate-equipment-selection",
          `${path}[${index}].id`,
          "Duplicate known weapon modifier IDs are not accepted in persisted hands."
        );
        return null;
      }
      knownIds.add(Number(selection.id));
    }
    modifiers.push(selection);
  }
  return modifiers;
}

function validateWeaponRequirement(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): AuthoredWeaponRequirement | null | undefined {
  if (input === null) {
    return null;
  }
  const record = asRecord(input, path, diagnostics);
  if (record === null || !hasOnlyKeys(record, ["attribute", "rank", "reason"])) {
    addDiagnostic(
      diagnostics,
      "invalid-equipment-topology",
      path,
      "Authored weapon requirement has an unsupported shape."
    );
    return undefined;
  }
  const attribute = validateEquipmentSelection<AttributeId>(
    record.attribute,
    `${path}.attribute`,
    diagnostics
  );
  const rank =
    record.rank === null
      ? null
      : (safeInteger(record.rank, `${path}.rank`, diagnostics, { min: 0, max: 20 }) ?? undefined);
  const reason = enumField(
    record.reason,
    `${path}.reason`,
    diagnostics,
    new Set<AuthoredWeaponRequirement["reason"]>(["catalog-unresolved", "user-visible-placeholder"])
  );
  if (attribute === undefined || rank === undefined || reason === null) {
    return undefined;
  }
  return {
    attribute,
    rank,
    reason
  };
}

function validateEquipmentSelection<Id>(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): EquipmentSelectionState<Id> | null | undefined {
  if (input === null) {
    return null;
  }
  const record = asRecord(input, path, diagnostics);
  if (record === null || typeof record.kind !== "string") {
    addDiagnostic(
      diagnostics,
      "invalid-equipment-selection",
      path,
      "Equipment selection must be null, known, or unresolved."
    );
    return undefined;
  }
  if (record.kind === "known") {
    if (!hasOnlyKeys(record, ["id", "kind"])) {
      addDiagnostic(
        diagnostics,
        "invalid-equipment-selection",
        path,
        "Known equipment selection contains unsupported fields."
      );
      return undefined;
    }
    const id = safeInteger(record.id, `${path}.id`, diagnostics, { min: 0 });
    return id === null ? undefined : { kind: "known", id: catalogId<"Equipment">(id) as Id };
  }
  if (record.kind === "unresolved") {
    if (!hasOnlyKeys(record, ["candidateCatalogId", "kind", "label", "reason"])) {
      addDiagnostic(
        diagnostics,
        "invalid-equipment-selection",
        path,
        "Unresolved equipment selection contains unsupported fields."
      );
      return undefined;
    }
    const label = nullableString(record.label, `${path}.label`, diagnostics, MAX_NAME);
    const reason = stringField(record.reason, `${path}.reason`, diagnostics, MAX_SELECTION_REASON, {
      allowEmpty: false
    });
    const candidateCatalogId = nullableSafeInteger(
      record.candidateCatalogId,
      `${path}.candidateCatalogId`,
      diagnostics
    );
    if (label === undefined || reason === null || candidateCatalogId === undefined) {
      return undefined;
    }
    return {
      kind: "unresolved",
      label,
      reason,
      candidateCatalogId
    };
  }
  addDiagnostic(
    diagnostics,
    "invalid-equipment-selection",
    `${path}.kind`,
    "Equipment selection kind is not accepted."
  );
  return undefined;
}

function validateAttributes(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): readonly { readonly attributeId: AttributeId; readonly rank: number }[] | null {
  if (!Array.isArray(input)) {
    addDiagnostic(diagnostics, "invalid-array", path, "Attributes must be an array.");
    return null;
  }
  if (input.length > MAX_ATTRIBUTES) {
    addDiagnostic(
      diagnostics,
      "oversized-collection",
      path,
      `Attribute rows exceed the ${MAX_ATTRIBUTES} row limit.`
    );
    return null;
  }
  const attributes: { readonly attributeId: AttributeId; readonly rank: number }[] = [];
  input.forEach((item, index) => {
    const record = asRecord(item, `${path}[${index}]`, diagnostics);
    if (record === null) {
      return;
    }
    const attributeId = safeInteger(
      record.attributeId,
      `${path}[${index}].attributeId`,
      diagnostics
    );
    const rank = safeInteger(record.rank, `${path}[${index}].rank`, diagnostics, {
      min: 0,
      max: 20
    });
    if (attributeId !== null && rank !== null) {
      attributes.push({ attributeId: catalogId<"Attribute">(attributeId), rank });
    }
  });
  return attributes.length === input.length ? attributes : null;
}

function validateSkillBar(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): SkillBar | null {
  if (!Array.isArray(input) || input.length !== 8) {
    addDiagnostic(
      diagnostics,
      "invalid-skill-bar",
      path,
      "Skill bar must contain exactly 8 slots."
    );
    return null;
  }
  const slots = input.map((value, index) =>
    nullableCatalogId<"Skill">(value, `${path}[${index}]`, diagnostics)
  );
  if (slots.some((slot) => slot === undefined)) {
    return null;
  }
  return tupleSkillBar(slots as readonly (SkillId | null)[]);
}

function validateTitleRankOverrides(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): readonly TitleRankOverride[] | null {
  if (!denseArray(input, path, diagnostics)) {
    return null;
  }
  if (input.length > TITLE_RANK_OVERRIDE_LIMIT) {
    addDiagnostic(
      diagnostics,
      "oversized-collection",
      path,
      `Title rank overrides exceed the ${TITLE_RANK_OVERRIDE_LIMIT} override limit.`
    );
    return null;
  }
  const overrides: TitleRankOverride[] = [];
  const seen = new Set<string>();
  for (const [index, item] of input.entries()) {
    const itemPath = `${path}[${index}]`;
    const record = asRecord(item, itemPath, diagnostics);
    if (record === null || !hasOnlyKeys(record, ["key", "rank"])) {
      addDiagnostic(
        diagnostics,
        "invalid-title-rank-override",
        itemPath,
        "Title rank override entries must contain only key and rank."
      );
      return null;
    }
    const rawKey = stringField(record.key, `${itemPath}.key`, diagnostics, 80, {
      allowEmpty: false
    });
    const rank = safeInteger(record.rank, `${itemPath}.rank`, diagnostics);
    if (rawKey === null || rank === null) {
      return null;
    }
    const key = normalizeTitleRankKey(rawKey);
    if (key === null || !isCanonicalTitleRankKey(key)) {
      addDiagnostic(
        diagnostics,
        "invalid-title-rank-key",
        `${itemPath}.key`,
        "Title rank override key is not a supported canonical title key."
      );
      return null;
    }
    if (seen.has(key)) {
      addDiagnostic(
        diagnostics,
        "duplicate-title-rank-override",
        `${itemPath}.key`,
        "Duplicate title rank override keys are not accepted."
      );
      return null;
    }
    seen.add(key);
    overrides.push({ key, rank });
  }
  return overrides.sort((left, right) => left.key.localeCompare(right.key, "en-US"));
}

function validatePveBudget(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): PveBudgetState | null {
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    return null;
  }
  const level = safeInteger(record.level, `${path}.level`, diagnostics, { min: 1, max: 20 });
  const questBonus = enumField(
    record.questBonus,
    `${path}.questBonus`,
    diagnostics,
    new Set<PveBudgetState["questBonus"]>(["none", "maximum-applicable"])
  );
  return level === null || questBonus === null ? null : { level, questBonus };
}

function validateRawTemplate(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): RawTemplateOverlay | null {
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    return null;
  }
  const source = validateTemplateSource(record.source, `${path}.source`, diagnostics);
  const templateName = nullableString(
    record.templateName,
    `${path}.templateName`,
    diagnostics,
    MAX_NAME
  );
  const primaryProfession = validateNullableRawEntry(
    record.primaryProfession,
    `${path}.primaryProfession`,
    diagnostics
  );
  const secondaryProfession = validateNullableRawEntry(
    record.secondaryProfession,
    `${path}.secondaryProfession`,
    diagnostics
  );
  const attributes = validateRawAttributes(record.attributes, `${path}.attributes`, diagnostics);
  const skillBar = validateRawSkillBar(record.skillBar, `${path}.skillBar`, diagnostics);
  if (
    source === undefined ||
    templateName === undefined ||
    primaryProfession === undefined ||
    secondaryProfession === undefined ||
    attributes === null ||
    skillBar === null
  ) {
    return null;
  }
  return {
    source,
    templateName,
    primaryProfession,
    secondaryProfession,
    attributes,
    skillBar
  };
}

function validateTemplateSource(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): TemplateSourceEnvelope | null | undefined {
  if (input === null) {
    return null;
  }
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    return undefined;
  }
  const inputKind = enumField(
    record.inputKind,
    `${path}.inputKind`,
    diagnostics,
    TEMPLATE_INPUT_KINDS
  );
  const templateKind = enumField(
    record.templateKind,
    `${path}.templateKind`,
    diagnostics,
    TEMPLATE_KINDS
  );
  const originalInput = stringField(
    record.originalInput,
    `${path}.originalInput`,
    diagnostics,
    MAX_STRING,
    { allowEmpty: false }
  );
  const originalBareCode = stringField(
    record.originalBareCode,
    `${path}.originalBareCode`,
    diagnostics,
    MAX_STRING,
    { allowEmpty: false }
  );
  const normalizedDependencyInput = nullableString(
    record.normalizedDependencyInput,
    `${path}.normalizedDependencyInput`,
    diagnostics,
    MAX_STRING
  );
  const templateName = nullableString(
    record.templateName,
    `${path}.templateName`,
    diagnostics,
    MAX_NAME
  );
  const semanticFingerprint = stringField(
    record.semanticFingerprint,
    `${path}.semanticFingerprint`,
    diagnostics,
    MAX_STRING,
    { allowEmpty: false }
  );
  const fidelity = enumField(record.fidelity, `${path}.fidelity`, diagnostics, TEMPLATE_FIDELITIES);
  if (
    inputKind === null ||
    templateKind === null ||
    originalInput === null ||
    originalBareCode === null ||
    normalizedDependencyInput === undefined ||
    templateName === undefined ||
    semanticFingerprint === null ||
    fidelity === null
  ) {
    return undefined;
  }
  return {
    inputKind,
    templateKind,
    originalInput,
    originalBareCode,
    normalizedDependencyInput,
    templateName,
    semanticFingerprint,
    fidelity
  };
}

function validateRawAttributes(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): readonly (RawTemplateOverlayEntry | null)[] | null {
  if (!Array.isArray(input)) {
    addDiagnostic(diagnostics, "invalid-array", path, "Raw template attributes must be an array.");
    return null;
  }
  if (input.length > MAX_ATTRIBUTES) {
    addDiagnostic(
      diagnostics,
      "oversized-collection",
      path,
      `Raw template attributes exceed the ${MAX_ATTRIBUTES} row limit.`
    );
    return null;
  }
  const entries = input.map((item, index) =>
    validateNullableRawEntry(item, `${path}[${index}]`, diagnostics)
  );
  return entries.some((entry) => entry === undefined)
    ? null
    : (entries as readonly (RawTemplateOverlayEntry | null)[]);
}

function validateRawSkillBar(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): RawSkillBarOverlay | null {
  if (!Array.isArray(input) || input.length !== 8) {
    addDiagnostic(
      diagnostics,
      "invalid-raw-skill-bar",
      path,
      "Raw template skill bar must contain exactly 8 slots."
    );
    return null;
  }
  const entries = input.map((item, index) =>
    validateNullableRawEntry(item, `${path}[${index}]`, diagnostics)
  );
  if (entries.some((entry) => entry === undefined)) {
    return null;
  }
  return tupleRawSkillBar(entries as readonly (RawTemplateOverlayEntry | null)[]);
}

function validateNullableRawEntry(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): RawTemplateOverlayEntry | null | undefined {
  if (input === null) {
    return null;
  }
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    return undefined;
  }
  const namespace = enumField(record.namespace, `${path}.namespace`, diagnostics, RAW_NAMESPACES);
  const templateId = safeInteger(record.templateId, `${path}.templateId`, diagnostics, { min: 0 });
  const catalog = nullableSafeInteger(record.catalogId, `${path}.catalogId`, diagnostics);
  const outcomeKind = enumField(
    record.outcomeKind,
    `${path}.outcomeKind`,
    diagnostics,
    RAW_OUTCOMES
  );
  const label = stringField(record.label, `${path}.label`, diagnostics, MAX_NAME, {
    allowEmpty: false
  });
  const reason = nullableString(record.reason, `${path}.reason`, diagnostics, MAX_STRING);
  if (
    namespace === null ||
    templateId === null ||
    catalog === undefined ||
    outcomeKind === null ||
    label === null ||
    reason === undefined
  ) {
    return undefined;
  }
  return {
    namespace,
    templateId,
    catalogId: catalog,
    outcomeKind,
    label,
    reason
  };
}

function validateCatalogFacts(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): PersistedCatalogFacts | null {
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    return null;
  }
  const buildCatalogVersion = nullableString(
    record.buildCatalogVersion,
    `${path}.buildCatalogVersion`,
    diagnostics,
    MAX_STRING
  );
  const professionAttributeCatalogVersion = nullableString(
    record.professionAttributeCatalogVersion,
    `${path}.professionAttributeCatalogVersion`,
    diagnostics,
    MAX_STRING
  );
  const skillCatalogVersion = nullableString(
    record.skillCatalogVersion,
    `${path}.skillCatalogVersion`,
    diagnostics,
    MAX_STRING
  );
  const runeCatalogVersion = nullableString(
    record.runeCatalogVersion === undefined ? null : record.runeCatalogVersion,
    `${path}.runeCatalogVersion`,
    diagnostics,
    MAX_STRING
  );
  const insigniaCatalogVersion = nullableString(
    record.insigniaCatalogVersion === undefined ? null : record.insigniaCatalogVersion,
    `${path}.insigniaCatalogVersion`,
    diagnostics,
    MAX_STRING
  );
  const weaponCatalogVersion = nullableString(
    record.weaponCatalogVersion === undefined ? null : record.weaponCatalogVersion,
    `${path}.weaponCatalogVersion`,
    diagnostics,
    MAX_STRING
  );
  const weaponModifierCatalogVersion = nullableString(
    record.weaponModifierCatalogVersion === undefined ? null : record.weaponModifierCatalogVersion,
    `${path}.weaponModifierCatalogVersion`,
    diagnostics,
    MAX_STRING
  );
  const weaponCatalogSetVersion = nullableString(
    record.weaponCatalogSetVersion === undefined ? null : record.weaponCatalogSetVersion,
    `${path}.weaponCatalogSetVersion`,
    diagnostics,
    MAX_STRING
  );
  const weaponCatalogSetDigest = nullableString(
    record.weaponCatalogSetDigest === undefined ? null : record.weaponCatalogSetDigest,
    `${path}.weaponCatalogSetDigest`,
    diagnostics,
    MAX_STRING
  );
  const weaponModifierCatalogSetVersion = nullableString(
    record.weaponModifierCatalogSetVersion === undefined
      ? null
      : record.weaponModifierCatalogSetVersion,
    `${path}.weaponModifierCatalogSetVersion`,
    diagnostics,
    MAX_STRING
  );
  const weaponModifierCatalogSetDigest = nullableString(
    record.weaponModifierCatalogSetDigest === undefined
      ? null
      : record.weaponModifierCatalogSetDigest,
    `${path}.weaponModifierCatalogSetDigest`,
    diagnostics,
    MAX_STRING
  );
  const ruleEngineVersion = nullableString(
    record.ruleEngineVersion,
    `${path}.ruleEngineVersion`,
    diagnostics,
    MAX_STRING
  );
  if (
    buildCatalogVersion === undefined ||
    professionAttributeCatalogVersion === undefined ||
    skillCatalogVersion === undefined ||
    runeCatalogVersion === undefined ||
    insigniaCatalogVersion === undefined ||
    weaponCatalogVersion === undefined ||
    weaponModifierCatalogVersion === undefined ||
    weaponCatalogSetVersion === undefined ||
    weaponCatalogSetDigest === undefined ||
    weaponModifierCatalogSetVersion === undefined ||
    weaponModifierCatalogSetDigest === undefined ||
    ruleEngineVersion === undefined
  ) {
    return null;
  }
  return {
    buildCatalogVersion,
    professionAttributeCatalogVersion,
    skillCatalogVersion,
    runeCatalogVersion,
    insigniaCatalogVersion,
    weaponCatalogVersion,
    weaponModifierCatalogVersion,
    weaponCatalogSetVersion,
    weaponCatalogSetDigest,
    weaponModifierCatalogSetVersion,
    weaponModifierCatalogSetDigest,
    ruleEngineVersion
  };
}

function validateMetadata(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): LocalLibraryMetadata | null {
  if (input === undefined) {
    return { lastWriteReason: null, lastCompactedAt: null };
  }
  const record = asRecord(input, path, diagnostics);
  if (record === null) {
    return null;
  }
  const lastWriteReason = nullableString(
    record.lastWriteReason === undefined ? null : record.lastWriteReason,
    `${path}.lastWriteReason`,
    diagnostics,
    MAX_NAME
  );
  const lastCompactedAt = nullableString(
    record.lastCompactedAt === undefined ? null : record.lastCompactedAt,
    `${path}.lastCompactedAt`,
    diagnostics,
    MAX_NAME
  );
  if (lastWriteReason === undefined || lastCompactedAt === undefined) {
    return null;
  }
  return { lastWriteReason, lastCompactedAt };
}

function recordId(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): LocalBuildRecordId | null {
  const value = stringField(input, path, diagnostics, 96, { allowEmpty: false });
  if (value === null) {
    return null;
  }
  if (!/^[A-Za-z0-9:_-]+$/.test(value)) {
    addDiagnostic(
      diagnostics,
      "invalid-id",
      path,
      "Local record ID contains unsupported characters."
    );
    return null;
  }
  return localBuildRecordId(value);
}

function nullableRecordId(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): LocalBuildRecordId | null | undefined {
  if (input === null) {
    return null;
  }
  return recordId(input, path, diagnostics) ?? undefined;
}

function tagsField(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): readonly string[] | null {
  if (!Array.isArray(input)) {
    addDiagnostic(diagnostics, "invalid-array", path, "Tags must be an array.");
    return null;
  }
  if (input.length > MAX_TAGS) {
    addDiagnostic(
      diagnostics,
      "oversized-collection",
      path,
      `Tags exceed the ${MAX_TAGS} tag limit.`
    );
    return null;
  }
  const tags: string[] = [];
  for (const [index, item] of input.entries()) {
    const tag = stringField(item, `${path}[${index}]`, diagnostics, MAX_TAG, { allowEmpty: false });
    if (tag === null) {
      return null;
    }
    tags.push(tag);
  }
  return tags;
}

function asRecord(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): Record<string, unknown> | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    addDiagnostic(diagnostics, "invalid-object", path, "Expected an object.");
    return null;
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    addDiagnostic(diagnostics, "invalid-object", path, "Expected a plain object.");
    return null;
  }
  return input as Record<string, unknown>;
}

function denseArray(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): input is readonly unknown[] {
  if (!Array.isArray(input)) {
    addDiagnostic(diagnostics, "invalid-array", path, "Expected an array.");
    return false;
  }
  for (let index = 0; index < input.length; index += 1) {
    if (!(index in input)) {
      addDiagnostic(
        diagnostics,
        "invalid-array",
        `${path}[${index}]`,
        "Sparse arrays are not accepted."
      );
      return false;
    }
  }
  return true;
}

function hasOnlyKeys(record: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(record).every((key) => allowed.has(key));
}

function stringField(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[],
  max: number,
  options: { readonly allowEmpty: boolean }
): string | null {
  if (typeof input !== "string") {
    addDiagnostic(diagnostics, "invalid-string", path, "Expected a string.");
    return null;
  }
  if (!options.allowEmpty && input.length === 0) {
    addDiagnostic(diagnostics, "invalid-string", path, "String cannot be empty.");
    return null;
  }
  if (input.length > max) {
    addDiagnostic(
      diagnostics,
      "oversized-string",
      path,
      `String exceeds the ${max} character limit.`
    );
    return null;
  }
  return input;
}

function nullableString(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[],
  max: number
): string | null | undefined {
  if (input === null) {
    return null;
  }
  return stringField(input, path, diagnostics, max, { allowEmpty: true }) ?? undefined;
}

function booleanField(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): boolean | null {
  if (typeof input !== "boolean") {
    addDiagnostic(diagnostics, "invalid-boolean", path, "Expected a boolean.");
    return null;
  }
  return input;
}

function enumField<Value extends string>(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[],
  allowed: ReadonlySet<Value>
): Value | null {
  if (typeof input !== "string" || !allowed.has(input as Value)) {
    addDiagnostic(diagnostics, "invalid-enum", path, "Value is not in the accepted set.");
    return null;
  }
  return input as Value;
}

function timestamp(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): string | null {
  const value = stringField(input, path, diagnostics, MAX_NAME, { allowEmpty: false });
  if (value === null) {
    return null;
  }
  if (!ISO_TIMESTAMP_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    addDiagnostic(
      diagnostics,
      "invalid-timestamp",
      path,
      "Timestamp must be a valid UTC ISO string."
    );
    return null;
  }
  return value;
}

function safeInteger(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[],
  bounds: { readonly min?: number; readonly max?: number } = {}
): number | null {
  if (!Number.isSafeInteger(input)) {
    addDiagnostic(diagnostics, "invalid-number", path, "Expected a finite safe integer.");
    return null;
  }
  const value = input as number;
  if (bounds.min !== undefined && value < bounds.min) {
    addDiagnostic(diagnostics, "invalid-number", path, `Number must be at least ${bounds.min}.`);
    return null;
  }
  if (bounds.max !== undefined && value > bounds.max) {
    addDiagnostic(diagnostics, "invalid-number", path, `Number must be at most ${bounds.max}.`);
    return null;
  }
  return value;
}

function nullableSafeInteger(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): number | null | undefined {
  if (input === null) {
    return null;
  }
  return safeInteger(input, path, diagnostics) ?? undefined;
}

function nullableCatalogId<Scope extends string>(
  input: unknown,
  path: string,
  diagnostics: PersistenceDiagnostic[]
): ReturnType<typeof catalogId<Scope>> | null | undefined {
  const value = nullableSafeInteger(input, path, diagnostics);
  return value === undefined ? undefined : value === null ? null : catalogId<Scope>(value);
}

function cloneBuild(build: Build): Build {
  return {
    schemaVersion: build.schemaVersion,
    catalogVersion: build.catalogVersion,
    id: build.id,
    name: build.name,
    mode: build.mode,
    primaryProfessionId: build.primaryProfessionId,
    secondaryProfessionId: build.secondaryProfessionId,
    attributes: build.attributes.map((attribute) => ({ ...attribute })),
    skillBar: tupleSkillBar(build.skillBar),
    titleRankOverrides: build.titleRankOverrides.map((override) => ({ ...override })),
    equipment: cloneEquipmentLoadout(build.equipment)
  };
}

function cloneEquipmentLoadout(equipment: EquipmentLoadout | null): EquipmentLoadout | null {
  if (equipment === null) {
    return null;
  }
  return {
    schemaVersion: EQUIPMENT_LOADOUT_SCHEMA_VERSION,
    armor: equipment.armor.map((piece) => ({
      slot: piece.slot,
      rune: cloneSelection(piece.rune),
      insignia: cloneSelection(piece.insignia),
      headgearAttribute: cloneSelection(piece.headgearAttribute)
    })),
    weaponSets: equipment.weaponSets.map((set) => ({
      slot: set.slot,
      mainHand: cloneWeaponHand(set.mainHand),
      offHand: cloneWeaponHand(set.offHand)
    }))
  };
}

function cloneWeaponHand(hand: WeaponHandSelection | null): WeaponHandSelection | null {
  if (hand === null) {
    return null;
  }
  return {
    weapon: cloneSelection(hand.weapon),
    modifiers: hand.modifiers.map((modifier) => cloneRequiredSelection(modifier)),
    requirement:
      hand.requirement === null
        ? null
        : {
            attribute: cloneSelection(hand.requirement.attribute),
            rank: hand.requirement.rank,
            reason: hand.requirement.reason
          }
  };
}

function cloneSelection<Id>(
  selection: EquipmentSelectionState<Id> | null
): EquipmentSelectionState<Id> | null {
  return selection === null ? null : { ...selection };
}

function cloneRequiredSelection<Id>(
  selection: EquipmentSelectionState<Id>
): EquipmentSelectionState<Id> {
  return { ...selection };
}

function cloneRawTemplateOverlay(rawTemplate: RawTemplateOverlay): RawTemplateOverlay {
  return {
    source: rawTemplate.source === null ? null : { ...rawTemplate.source },
    templateName: rawTemplate.templateName,
    primaryProfession:
      rawTemplate.primaryProfession === null ? null : { ...rawTemplate.primaryProfession },
    secondaryProfession:
      rawTemplate.secondaryProfession === null ? null : { ...rawTemplate.secondaryProfession },
    attributes: rawTemplate.attributes.map((entry) => (entry === null ? null : { ...entry })),
    skillBar: tupleRawSkillBar(
      rawTemplate.skillBar.map((entry) => (entry === null ? null : { ...entry }))
    )
  };
}

function tupleSkillBar(values: readonly (SkillId | null)[]): SkillBar {
  return [
    values[0] ?? null,
    values[1] ?? null,
    values[2] ?? null,
    values[3] ?? null,
    values[4] ?? null,
    values[5] ?? null,
    values[6] ?? null,
    values[7] ?? null
  ];
}

function tupleRawSkillBar(values: readonly (RawTemplateOverlayEntry | null)[]): RawSkillBarOverlay {
  return [
    values[0] ?? null,
    values[1] ?? null,
    values[2] ?? null,
    values[3] ?? null,
    values[4] ?? null,
    values[5] ?? null,
    values[6] ?? null,
    values[7] ?? null
  ];
}

function stableJson(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => stableJson(item));
  }
  if (typeof input === "object" && input !== null) {
    return Object.keys(input)
      .sort((left, right) => left.localeCompare(right, "en-US"))
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = stableJson((input as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return input;
}

function containsDangerousKey(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some((item) => containsDangerousKey(item));
  }
  if (typeof input !== "object" || input === null) {
    return false;
  }
  return Object.keys(input).some(
    (key) =>
      DANGEROUS_KEYS.has(key) || containsDangerousKey((input as Record<string, unknown>)[key])
  );
}

function addDiagnostic(
  diagnostics: PersistenceDiagnostic[],
  code: string,
  path: string,
  message: string
): void {
  if (diagnostics.length >= MAX_DIAGNOSTICS) {
    return;
  }
  diagnostics.push(diagnostic(code, path, message));
}

function diagnostic(code: string, path: string, message: string): PersistenceDiagnostic {
  return { code, path, message };
}

function boundString(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}
