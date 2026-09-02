import type {
  CatalogVersionId,
  SchemaVersion,
  TemplateAttributeId,
  TemplateEquipmentColorId,
  TemplateEquipmentItemId,
  TemplateEquipmentModifierId,
  TemplateEquipmentSlotId,
  TemplateProfessionId,
  TemplateSkillId
} from "./ids";
import type {
  AttributeTemplateLookupOutcome,
  ProfessionTemplateLookupOutcome,
  SkillTemplateSlotLookupOutcome
} from "./catalog-lookup";

export const TEMPLATE_COMPATIBILITY_SCHEMA_VERSION = 1 satisfies SchemaVersion;

export type TemplateKind = "skill" | "equipment" | "paw-ned2";
export type TemplateInputKind = "bare" | "chat-code";
export type TemplateFidelity =
  "exact-source" | "field-complete-normalized" | "unsupported-or-lossy";
export type TemplateDiagnosticSeverity = "info" | "warning";
export type TemplateOperation = "parse" | "decode" | "encode" | "resolve" | "probe";
export type TemplateErrorStage =
  "input" | "wrapper" | "kind" | "dependency" | "shape" | "validation" | "fidelity" | "boundary";
export type TemplateErrorCode =
  | "INPUT_TOO_LARGE"
  | "EMPTY_INPUT"
  | "INVALID_CHARACTER_SET"
  | "INVALID_CHAT_WRAPPER"
  | "UNSAFE_TEMPLATE_NAME"
  | "WRONG_TEMPLATE_KIND"
  | "UNSUPPORTED_VERSION"
  | "MALFORMED_TEMPLATE"
  | "INVALID_DECODED_SHAPE"
  | "INVALID_FIELD_VALUE"
  | "SOURCE_CHANGED"
  | "UNSUPPORTED_BY_CODEC"
  | "LOSSY_ENCODE"
  | "DEPENDENCY_FAILURE"
  | "PAWNED2_DEFERRED";

export interface TemplateDiagnostic {
  readonly code: string;
  readonly severity: TemplateDiagnosticSeverity;
  readonly message: string;
  readonly fieldPath: string | null;
}

export interface TemplateCompatibilityError {
  readonly code: TemplateErrorCode;
  readonly operation: TemplateOperation;
  readonly stage: TemplateErrorStage;
  readonly expectedTemplateKind: TemplateKind | null;
  readonly fieldPath: string | null;
  readonly message: string;
}

export type TemplateResult<Value> =
  | {
      readonly ok: true;
      readonly value: Value;
      readonly diagnostics: readonly TemplateDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly error: TemplateCompatibilityError;
    };

export interface TemplateSourceEnvelope {
  readonly inputKind: TemplateInputKind;
  readonly templateKind: TemplateKind;
  readonly originalInput: string;
  readonly originalBareCode: string;
  readonly normalizedDependencyInput: string | null;
  readonly templateName: string | null;
  readonly semanticFingerprint: string;
  readonly fidelity: TemplateFidelity;
}

export interface SkillTemplateAttributeRank {
  readonly attributeId: TemplateAttributeId;
  readonly rank: number;
}

export type TemplateSkillBar = readonly [
  TemplateSkillId,
  TemplateSkillId,
  TemplateSkillId,
  TemplateSkillId,
  TemplateSkillId,
  TemplateSkillId,
  TemplateSkillId,
  TemplateSkillId
];

export interface SkillTemplateDocument {
  readonly kind: "skill";
  readonly schemaVersion: typeof TEMPLATE_COMPATIBILITY_SCHEMA_VERSION;
  readonly source: TemplateSourceEnvelope;
  readonly primaryProfessionId: TemplateProfessionId;
  readonly secondaryProfessionId: TemplateProfessionId;
  readonly attributes: readonly SkillTemplateAttributeRank[];
  readonly skillIds: TemplateSkillBar;
}

export interface EquipmentTemplateItem {
  readonly slotId: TemplateEquipmentSlotId;
  readonly itemId: TemplateEquipmentItemId;
  readonly colorId: TemplateEquipmentColorId;
  readonly modifierIds: readonly TemplateEquipmentModifierId[];
}

export interface EquipmentTemplateDocument {
  readonly kind: "equipment";
  readonly schemaVersion: typeof TEMPLATE_COMPATIBILITY_SCHEMA_VERSION;
  readonly source: TemplateSourceEnvelope;
  readonly items: readonly EquipmentTemplateItem[];
}

export type TemplateExportMode = "auto" | "preserve-source" | "canonical";

export interface TemplateExportOptions {
  readonly mode?: TemplateExportMode;
  readonly templateName?: string | null;
}

export interface TemplateExportedCode {
  readonly kind: Exclude<TemplateKind, "paw-ned2">;
  readonly code: string;
  readonly bareCode: string;
  readonly inputKind: TemplateInputKind;
  readonly templateName: string | null;
  readonly fidelity: TemplateFidelity;
  readonly semanticFingerprint: string;
}

export interface ResolvedSkillTemplateAttribute {
  readonly attributeId: TemplateAttributeId;
  readonly rank: number;
  readonly outcome: AttributeTemplateLookupOutcome;
}

export interface ResolvedSkillTemplateView {
  readonly kind: "skill-resolution";
  readonly catalogVersions: {
    readonly professionAttributes: CatalogVersionId | string;
    readonly skills: CatalogVersionId | string;
  };
  readonly sourceFingerprint: string;
  readonly primaryProfession: ProfessionTemplateLookupOutcome;
  readonly secondaryProfession: ProfessionTemplateLookupOutcome;
  readonly attributes: readonly ResolvedSkillTemplateAttribute[];
  readonly skillSlots: readonly [
    SkillTemplateSlotLookupOutcome,
    SkillTemplateSlotLookupOutcome,
    SkillTemplateSlotLookupOutcome,
    SkillTemplateSlotLookupOutcome,
    SkillTemplateSlotLookupOutcome,
    SkillTemplateSlotLookupOutcome,
    SkillTemplateSlotLookupOutcome,
    SkillTemplateSlotLookupOutcome
  ];
}
