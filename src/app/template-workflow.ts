import {
  catalogId,
  templateAttributeId,
  templateProfessionId,
  templateSkillId,
  type AttributeId,
  type ProfessionId,
  type ResolvedSkillTemplateAttribute,
  type ResolvedSkillTemplateView,
  type SkillId,
  type SkillBar,
  type SkillTemplateDocument,
  type TemplateCompatibilityError,
  type TemplateDiagnostic,
  type TemplateExportedCode,
  type TemplateSkillBar,
  type ValidationResult
} from "../domain";
import {
  decodeSkillTemplate,
  exportSkillTemplate,
  resolveSkillTemplateDocument,
  skillTemplateFingerprint
} from "../template-compatibility";
import type { AppCatalogViews } from "./catalogs";
import {
  createBlankEditorState,
  createRawOverlayEntry,
  emptySkillBar,
  emptyRawSkillBarOverlay,
  unresolvedAttributeIdForIndex,
  unresolvedSkillIdForIndex,
  type EditorState,
  type RawSkillBarOverlay,
  type RawTemplateOverlay,
  type RawTemplateOverlayEntry
} from "./editor-state";

export type TemplateProjectionDiagnosticCode =
  | "missing-profession-template-id"
  | "missing-attribute-template-id"
  | "missing-skill-template-id"
  | "unresolved-raw-field"
  | "invalid-field-value";

export interface TemplateProjectionDiagnostic {
  readonly code: TemplateProjectionDiagnosticCode;
  readonly location: string;
  readonly message: string;
}

export interface TemplateProjectionResult {
  readonly document: SkillTemplateDocument | null;
  readonly diagnostics: readonly TemplateProjectionDiagnostic[];
  readonly fingerprint: string | null;
}

export type ImportWorkflowResult =
  | {
      readonly ok: true;
      readonly state: EditorState;
      readonly document: SkillTemplateDocument;
      readonly resolution: ResolvedSkillTemplateView;
      readonly diagnostics: readonly TemplateDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly state: EditorState;
      readonly error: TemplateCompatibilityError;
    };

export interface ExportOptionView {
  readonly available: boolean;
  readonly label: string;
  readonly code: TemplateExportedCode | null;
  readonly blockedReasons: readonly string[];
}

export interface ExportWorkflowView {
  readonly exactSource: ExportOptionView;
  readonly canonical: ExportOptionView;
  readonly projectionDiagnostics: readonly TemplateProjectionDiagnostic[];
}

export type ShareTemplateExportResult =
  | {
      readonly ok: true;
      readonly source: "exact-source" | "canonical";
      readonly bareCode: string;
      readonly templateText: string;
      readonly fidelity: string;
    }
  | {
      readonly ok: false;
      readonly blockedReasons: readonly string[];
    };

export function importSkillTemplateToEditor(
  input: string,
  currentState: EditorState,
  catalogs: AppCatalogViews
): ImportWorkflowResult {
  const decoded = decodeSkillTemplate(input);
  if (!decoded.ok) {
    return { ok: false, state: currentState, error: decoded.error };
  }

  const resolved = resolveSkillTemplateDocument(
    decoded.value,
    catalogs.professionAttributeCatalog,
    catalogs.skillCatalog
  );
  if (!resolved.ok) {
    return { ok: false, state: currentState, error: resolved.error };
  }

  return {
    ok: true,
    state: editorStateFromTemplate(decoded.value, resolved.value, catalogs),
    document: decoded.value,
    resolution: resolved.value,
    diagnostics: decoded.diagnostics
  };
}

export function evaluateTemplateExport(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationResult
): ExportWorkflowView {
  const exactProjection = projectEditorToSkillTemplate(state, catalogs, {
    allowRawOverlay: true
  });
  const canonicalProjection = projectEditorToSkillTemplate(state, catalogs, {
    allowRawOverlay: false
  });
  const exact = exactSourceOption(state, exactProjection);
  const canonical = canonicalOption(state, canonicalProjection, validation);

  return {
    exactSource: exact,
    canonical,
    projectionDiagnostics: canonicalProjection.diagnostics
  };
}

export function selectShareTemplateExport(policy: ExportWorkflowView): ShareTemplateExportResult {
  if (policy.exactSource.available && policy.exactSource.code !== null) {
    return {
      ok: true,
      source: "exact-source",
      bareCode: policy.exactSource.code.bareCode,
      templateText: policy.exactSource.code.code,
      fidelity: policy.exactSource.code.fidelity
    };
  }
  if (policy.canonical.available && policy.canonical.code !== null) {
    return {
      ok: true,
      source: "canonical",
      bareCode: policy.canonical.code.bareCode,
      templateText: policy.canonical.code.code,
      fidelity: policy.canonical.code.fidelity
    };
  }
  return {
    ok: false,
    blockedReasons: [
      ...policy.exactSource.blockedReasons,
      ...policy.canonical.blockedReasons,
      ...policy.projectionDiagnostics.map((diagnostic) => diagnostic.message)
    ]
  };
}

export function projectEditorToSkillTemplate(
  state: EditorState,
  catalogs: AppCatalogViews,
  options: {
    readonly allowRawOverlay: boolean;
  }
): TemplateProjectionResult {
  const diagnostics: TemplateProjectionDiagnostic[] = [];
  const primaryProfessionId = templateProfessionField(
    "primaryProfession",
    state.build.primaryProfessionId,
    state.rawTemplate.primaryProfession,
    catalogs,
    options.allowRawOverlay,
    diagnostics
  );
  const secondaryProfessionId = templateProfessionField(
    "secondaryProfession",
    state.build.secondaryProfessionId,
    state.rawTemplate.secondaryProfession,
    catalogs,
    options.allowRawOverlay,
    diagnostics
  );
  const attributes = state.build.attributes.map((attribute, index) => {
    const templateId = templateAttributeField(
      index,
      attribute.attributeId,
      state.rawTemplate.attributes[index] ?? null,
      catalogs,
      options.allowRawOverlay,
      diagnostics
    );
    return templateId === null
      ? null
      : {
          attributeId: templateAttributeId(templateId),
          rank: attribute.rank
        };
  });
  const skillIds = state.build.skillBar.map((skillId, index) =>
    templateSkillField(
      index,
      skillId,
      state.rawTemplate.skillBar[index] ?? null,
      catalogs,
      options.allowRawOverlay,
      diagnostics
    )
  );

  if (
    primaryProfessionId === null ||
    secondaryProfessionId === null ||
    attributes.some((attribute) => attribute === null) ||
    skillIds.some((skillId) => skillId === null)
  ) {
    return { document: null, diagnostics, fingerprint: null };
  }

  const document: SkillTemplateDocument = {
    kind: "skill",
    schemaVersion: 1,
    source: state.rawTemplate.source ?? {
      inputKind: "bare",
      templateKind: "skill",
      originalInput: "OAAQIAAAAAAAAAAAAAAA",
      originalBareCode: "OAAQIAAAAAAAAAAAAAAA",
      normalizedDependencyInput: null,
      templateName: null,
      semanticFingerprint: "skill-template:v1:fresh-editor",
      fidelity: "unsupported-or-lossy"
    },
    primaryProfessionId: templateProfessionId(primaryProfessionId),
    secondaryProfessionId: templateProfessionId(secondaryProfessionId),
    attributes: attributes.flatMap((attribute) => (attribute === null ? [] : [attribute])),
    skillIds: tupleTemplateSkillBar(skillIds)
  };

  return {
    document,
    diagnostics,
    fingerprint: skillTemplateFingerprint(document)
  };
}

function editorStateFromTemplate(
  document: SkillTemplateDocument,
  resolution: ResolvedSkillTemplateView,
  catalogs: AppCatalogViews
): EditorState {
  const state = createBlankEditorState(document.source.templateName ?? "Imported Build");
  const primary = professionFromResolution(resolution.primaryProfession);
  const secondary = professionFromResolution(resolution.secondaryProfession);
  const attributeRows = resolution.attributes.map((attribute, index) =>
    attributeAllocationFromResolution(attribute, index)
  );
  const skillSlots = resolution.skillSlots.map((slot, index) =>
    skillIdFromResolutionSlot(slot, index)
  );
  const rawTemplate: RawTemplateOverlay = {
    source: document.source,
    templateName: document.source.templateName,
    primaryProfession: rawProfessionEntry(resolution.primaryProfession),
    secondaryProfession: rawProfessionEntry(resolution.secondaryProfession),
    attributes: resolution.attributes.map((attribute) => rawAttributeEntry(attribute)),
    skillBar: rawSkillBarFromResolution(resolution)
  };

  return {
    ...state,
    build: {
      ...state.build,
      name: document.source.templateName ?? state.build.name,
      catalogVersion: `${catalogs.versions.professionAttributes}+${catalogs.versions.skills}`,
      mode: "unknown",
      primaryProfessionId: primary,
      secondaryProfessionId: secondary,
      attributes: attributeRows,
      skillBar: tupleSkillBar(skillSlots)
    },
    rawTemplate,
    dialogs: {
      ...state.dialogs,
      importInput: document.source.originalInput,
      exportName: document.source.templateName
    }
  };
}

function exactSourceOption(
  state: EditorState,
  projection: TemplateProjectionResult
): ExportOptionView {
  if (state.rawTemplate.source === null) {
    return {
      available: false,
      label: "No imported source",
      code: null,
      blockedReasons: ["Exact-source export is available only after importing a skill template."]
    };
  }
  if (
    projection.document === null ||
    projection.fingerprint !== state.rawTemplate.source.semanticFingerprint
  ) {
    return {
      available: false,
      label: "Edited since import",
      code: null,
      blockedReasons: ["Current template fields no longer match the imported source fingerprint."]
    };
  }

  const exported = exportSkillTemplate(projection.document, {
    templateName: state.rawTemplate.templateName
  });
  if (!exported.ok) {
    return {
      available: false,
      label: "Exact replay blocked",
      code: null,
      blockedReasons: [exported.error.message]
    };
  }

  return {
    available: true,
    label: "Exact source",
    code: exported.value,
    blockedReasons: []
  };
}

function canonicalOption(
  state: EditorState,
  projection: TemplateProjectionResult,
  validation: ValidationResult
): ExportOptionView {
  const validationErrors = validation.issues.filter((issue) => issue.severity === "error");
  if (validationErrors.length > 0) {
    return {
      available: false,
      label: "Canonical blocked by validation",
      code: null,
      blockedReasons: validationErrors.map((issue) => issue.message)
    };
  }
  if (projection.document === null || projection.diagnostics.length > 0) {
    return {
      available: false,
      label: "Canonical blocked by representation",
      code: null,
      blockedReasons: projection.diagnostics.map((diagnostic) => diagnostic.message)
    };
  }

  const exported = exportSkillTemplate(projection.document, {
    mode: "canonical",
    templateName: state.rawTemplate.templateName
  });
  if (!exported.ok) {
    return {
      available: false,
      label: "Canonical codec proof failed",
      code: null,
      blockedReasons: [exported.error.message]
    };
  }

  return {
    available: true,
    label: exported.value.fidelity,
    code: exported.value,
    blockedReasons: []
  };
}

function professionFromResolution(
  outcome: ResolvedSkillTemplateView["primaryProfession"]
): ProfessionId | null {
  return outcome.kind === "known" ? outcome.catalogId : null;
}

function attributeAllocationFromResolution(
  attribute: ResolvedSkillTemplateAttribute,
  index: number
): {
  readonly attributeId: AttributeId;
  readonly rank: number;
} {
  return {
    attributeId:
      attribute.outcome.kind === "known"
        ? attribute.outcome.catalogId
        : unresolvedAttributeIdForIndex(index),
    rank: attribute.rank
  };
}

function skillIdFromResolutionSlot(
  slot: ResolvedSkillTemplateView["skillSlots"][number],
  index: number
): SkillId | null {
  if (slot.kind === "empty") {
    return null;
  }
  if (slot.kind === "known") {
    return slot.catalogId;
  }
  if (slot.kind === "dispositioned") {
    return catalogId<"Skill">(Number(slot.disposition.skillId));
  }
  return unresolvedSkillIdForIndex(index);
}

function rawProfessionEntry(
  outcome: ResolvedSkillTemplateView["primaryProfession"]
): RawTemplateOverlayEntry {
  if (outcome.kind === "known") {
    return createRawOverlayEntry({
      namespace: "profession",
      templateId: Number(outcome.templateId),
      catalogId: Number(outcome.catalogId),
      outcomeKind: "known",
      label: outcome.record.name
    });
  }
  if (outcome.kind === "none") {
    return createRawOverlayEntry({
      namespace: "profession",
      templateId: Number(outcome.templateId),
      catalogId: null,
      outcomeKind: "none",
      label: outcome.record.name
    });
  }
  return createRawOverlayEntry({
    namespace: "profession",
    templateId: Number(outcome.templateId),
    catalogId: null,
    outcomeKind: outcome.kind,
    label: `${outcome.kind} profession ${Number(outcome.templateId)}`,
    reason: "fact" in outcome ? outcome.fact.reason : null
  });
}

function rawAttributeEntry(attribute: ResolvedSkillTemplateAttribute): RawTemplateOverlayEntry {
  const outcome = attribute.outcome;
  if (outcome.kind === "known") {
    return createRawOverlayEntry({
      namespace: "attribute",
      templateId: Number(outcome.templateId),
      catalogId: Number(outcome.catalogId),
      outcomeKind: "known",
      label: outcome.record.name
    });
  }
  return createRawOverlayEntry({
    namespace: "attribute",
    templateId: Number(outcome.templateId),
    catalogId: null,
    outcomeKind: outcome.kind,
    label: `${outcome.kind} attribute ${Number(outcome.templateId)}`,
    reason: "fact" in outcome ? outcome.fact.reason : null
  });
}

function rawSkillBarFromResolution(resolution: ResolvedSkillTemplateView): RawSkillBarOverlay {
  const entries = resolution.skillSlots.map((slot) => {
    if (slot.kind === "empty") {
      return createRawOverlayEntry({
        namespace: "skill",
        templateId: Number(slot.templateId),
        catalogId: null,
        outcomeKind: "empty",
        label: "Empty"
      });
    }
    if (slot.kind === "known") {
      return createRawOverlayEntry({
        namespace: "skill",
        templateId: Number(slot.templateId),
        catalogId: Number(slot.catalogId),
        outcomeKind: "known",
        label: slot.record.name
      });
    }
    if (slot.kind === "dispositioned") {
      return createRawOverlayEntry({
        namespace: "skill",
        templateId: Number(slot.templateId),
        catalogId: Number(slot.disposition.skillId),
        outcomeKind: "dispositioned",
        label: slot.disposition.requestedTitle,
        reason: slot.disposition.reason
      });
    }
    return createRawOverlayEntry({
      namespace: "skill",
      templateId: Number(slot.templateId),
      catalogId: null,
      outcomeKind: "unknown",
      label: `Unknown skill ${Number(slot.templateId)}`
    });
  });
  return tupleRawSkillBar(entries);
}

function templateProfessionField(
  location: string,
  professionId: ProfessionId | null,
  raw: RawTemplateOverlayEntry | null,
  catalogs: AppCatalogViews,
  allowRawOverlay: boolean,
  diagnostics: TemplateProjectionDiagnostic[]
): number | null {
  if (professionId === null) {
    if (allowRawOverlay && raw !== null) {
      return raw.templateId;
    }
    return 0;
  }
  const templateId = catalogs.crosswalk.professionTemplateIdFromCatalogId(professionId);
  if (templateId !== null) {
    return Number(templateId);
  }
  if (allowRawOverlay && raw !== null && raw.outcomeKind !== "known") {
    return raw.templateId;
  }
  diagnostics.push({
    code: raw === null ? "missing-profession-template-id" : "unresolved-raw-field",
    location,
    message: `Profession at ${location} cannot be represented as a canonical skill-template profession.`
  });
  return null;
}

function templateAttributeField(
  index: number,
  attributeId: AttributeId,
  raw: RawTemplateOverlayEntry | null,
  catalogs: AppCatalogViews,
  allowRawOverlay: boolean,
  diagnostics: TemplateProjectionDiagnostic[]
): number | null {
  const templateId = catalogs.crosswalk.attributeTemplateIdFromCatalogId(attributeId);
  if (templateId !== null) {
    return Number(templateId);
  }
  if (allowRawOverlay && raw !== null) {
    return raw.templateId;
  }
  diagnostics.push({
    code: raw === null ? "missing-attribute-template-id" : "unresolved-raw-field",
    location: `attributes[${index}]`,
    message: `Attribute row ${index + 1} cannot be represented as a canonical skill-template attribute.`
  });
  return null;
}

function templateSkillField(
  index: number,
  skillId: SkillId | null,
  raw: RawTemplateOverlayEntry | null,
  catalogs: AppCatalogViews,
  allowRawOverlay: boolean,
  diagnostics: TemplateProjectionDiagnostic[]
): number | null {
  if (skillId === null) {
    return 0;
  }
  const templateId = catalogs.crosswalk.skillTemplateIdFromCatalogId(skillId);
  if (templateId !== null) {
    return Number(templateId);
  }
  if (allowRawOverlay && raw !== null) {
    return raw.templateId;
  }
  diagnostics.push({
    code: raw === null ? "missing-skill-template-id" : "unresolved-raw-field",
    location: `skillBar[${index}]`,
    message: `Skill slot ${index + 1} cannot be represented as a canonical skill-template skill.`
  });
  return null;
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

function tupleTemplateSkillBar(values: readonly (number | null)[]): TemplateSkillBar {
  return [
    templateSkillId(values[0] ?? 0),
    templateSkillId(values[1] ?? 0),
    templateSkillId(values[2] ?? 0),
    templateSkillId(values[3] ?? 0),
    templateSkillId(values[4] ?? 0),
    templateSkillId(values[5] ?? 0),
    templateSkillId(values[6] ?? 0),
    templateSkillId(values[7] ?? 0)
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

export function clearTemplateImport(state: EditorState): EditorState {
  return {
    ...state,
    rawTemplate: {
      source: null,
      templateName: null,
      primaryProfession: null,
      secondaryProfession: null,
      attributes: state.build.attributes.map(() => null),
      skillBar: emptyRawSkillBarOverlay()
    }
  };
}

export function createFreshTemplateEditorState(): EditorState {
  return {
    ...createBlankEditorState(),
    build: {
      ...createBlankEditorState().build,
      skillBar: emptySkillBar()
    }
  };
}
