import {
  lookupAttributeTemplateId,
  lookupProfessionTemplateId,
  lookupSkillTemplateSlot,
  templateAttributeId,
  templateProfessionId,
  templateSkillId,
  TEMPLATE_COMPATIBILITY_SCHEMA_VERSION,
  type ProfessionAttributeCatalog,
  type ResolvedSkillTemplateView,
  type SkillCatalog,
  type SkillTemplateDocument,
  type TemplateExportedCode,
  type TemplateExportOptions,
  type TemplateResult,
  type TemplateSkillBar
} from "../domain";
import type { AdapterSkillFields } from "./gw-templates-adapter";
import { decodeSkillTemplateBare, encodeSkillTemplateBare } from "./gw-templates-adapter";
import { formatTemplateChatCode, parseTemplateInput } from "./chat-code";
import { templateFingerprint } from "./fingerprint";
import { diagnostic, templateError, templateFailure, templateSuccess } from "./result";

export function decodeSkillTemplate(input: string): TemplateResult<SkillTemplateDocument> {
  const parsed = parseTemplateInput(input, "skill", "decode");
  if (!parsed.ok) {
    return parsed;
  }

  const decoded = decodeSkillTemplateBare(parsed.value.bareCode);
  if (!decoded.ok) {
    return decoded;
  }

  const fingerprint = skillTemplateFieldsFingerprint(decoded.value);
  const diagnostics = [...parsed.diagnostics];
  if (decoded.value.dependencyCode !== parsed.value.bareCode) {
    diagnostics.push(
      diagnostic({
        code: "DEPENDENCY_NORMALIZED_CODE",
        severity: "info",
        fieldPath: "code",
        message: "The dependency reported a normalized bare skill code."
      })
    );
  }

  const skillIds = skillBarFromNumbers(decoded.value.skillIds);
  if (!skillIds.ok) {
    return skillIds;
  }

  return templateSuccess(
    {
      kind: "skill",
      schemaVersion: TEMPLATE_COMPATIBILITY_SCHEMA_VERSION,
      source: {
        inputKind: parsed.value.inputKind,
        templateKind: "skill",
        originalInput: parsed.value.originalInput,
        originalBareCode: parsed.value.bareCode,
        normalizedDependencyInput:
          decoded.value.dependencyCode === parsed.value.bareCode
            ? null
            : decoded.value.dependencyCode,
        templateName: parsed.value.templateName,
        semanticFingerprint: fingerprint,
        fidelity: "exact-source"
      },
      primaryProfessionId: templateProfessionId(decoded.value.primaryProfessionId),
      secondaryProfessionId: templateProfessionId(decoded.value.secondaryProfessionId),
      attributes: decoded.value.attributes.map((attribute) => ({
        attributeId: templateAttributeId(attribute.attributeId),
        rank: attribute.rank
      })),
      skillIds: skillIds.value
    },
    diagnostics
  );
}

export function exportSkillTemplate(
  document: SkillTemplateDocument,
  options: TemplateExportOptions = {}
): TemplateResult<TemplateExportedCode> {
  const mode = options.mode ?? "auto";
  const templateName = options.templateName ?? document.source.templateName;
  const currentFingerprint = skillTemplateFingerprint(document);

  if (mode !== "canonical" && currentFingerprint === document.source.semanticFingerprint) {
    const formatted = formatTemplateChatCode(
      document.source.originalBareCode,
      templateName,
      "skill"
    );
    if (!formatted.ok) {
      return formatted;
    }

    return templateSuccess({
      kind: "skill",
      code: formatted.value,
      bareCode: document.source.originalBareCode,
      inputKind: templateName === null ? "bare" : "chat-code",
      templateName,
      fidelity: "exact-source",
      semanticFingerprint: currentFingerprint
    });
  }

  if (mode === "preserve-source") {
    return templateFailure(
      templateError({
        code: "SOURCE_CHANGED",
        operation: "encode",
        stage: "fidelity",
        expectedTemplateKind: "skill",
        message: "The skill template document no longer matches its source fingerprint."
      })
    );
  }

  const fields = skillFieldsFromDocument(document);
  const encoded = encodeSkillTemplateBare(fields);
  if (!encoded.ok) {
    return encoded;
  }

  const decoded = decodeSkillTemplateBare(encoded.value);
  if (!decoded.ok) {
    return decoded;
  }
  if (!skillFieldsEqual(fields, decoded.value)) {
    return lossySkillEncode("Canonical skill encode did not preserve every intended field.");
  }

  const formatted = formatTemplateChatCode(encoded.value, templateName, "skill");
  if (!formatted.ok) {
    return formatted;
  }

  return templateSuccess({
    kind: "skill",
    code: formatted.value,
    bareCode: encoded.value,
    inputKind: templateName === null ? "bare" : "chat-code",
    templateName,
    fidelity: "field-complete-normalized",
    semanticFingerprint: currentFingerprint
  });
}

export function resolveSkillTemplateDocument(
  document: SkillTemplateDocument,
  professionAttributeCatalog: ProfessionAttributeCatalog,
  skillCatalog: SkillCatalog
): TemplateResult<ResolvedSkillTemplateView> {
  return templateSuccess({
    kind: "skill-resolution",
    catalogVersions: {
      professionAttributes: professionAttributeCatalog.catalogVersion,
      skills: skillCatalog.catalogVersion
    },
    sourceFingerprint: document.source.semanticFingerprint,
    primaryProfession: lookupProfessionTemplateId(
      professionAttributeCatalog,
      document.primaryProfessionId
    ),
    secondaryProfession: lookupProfessionTemplateId(
      professionAttributeCatalog,
      document.secondaryProfessionId
    ),
    attributes: document.attributes.map((attribute) => ({
      attributeId: attribute.attributeId,
      rank: attribute.rank,
      outcome: lookupAttributeTemplateId(professionAttributeCatalog, attribute.attributeId)
    })),
    skillSlots: [
      lookupSkillTemplateSlot(skillCatalog, document.skillIds[0]),
      lookupSkillTemplateSlot(skillCatalog, document.skillIds[1]),
      lookupSkillTemplateSlot(skillCatalog, document.skillIds[2]),
      lookupSkillTemplateSlot(skillCatalog, document.skillIds[3]),
      lookupSkillTemplateSlot(skillCatalog, document.skillIds[4]),
      lookupSkillTemplateSlot(skillCatalog, document.skillIds[5]),
      lookupSkillTemplateSlot(skillCatalog, document.skillIds[6]),
      lookupSkillTemplateSlot(skillCatalog, document.skillIds[7])
    ]
  });
}

export function skillTemplateFingerprint(document: SkillTemplateDocument): string {
  return skillTemplateFieldsFingerprint(skillFieldsFromDocument(document));
}

function skillFieldsFromDocument(document: SkillTemplateDocument): AdapterSkillFields {
  return {
    dependencyCode: document.source.originalBareCode,
    primaryProfessionId: Number(document.primaryProfessionId),
    secondaryProfessionId: Number(document.secondaryProfessionId),
    attributes: document.attributes.map((attribute) => ({
      attributeId: Number(attribute.attributeId),
      rank: attribute.rank
    })),
    skillIds: document.skillIds.map((skillId) => Number(skillId))
  };
}

function skillTemplateFieldsFingerprint(fields: AdapterSkillFields): string {
  return templateFingerprint("skill-template", {
    primaryProfessionId: fields.primaryProfessionId,
    secondaryProfessionId: fields.secondaryProfessionId,
    attributes: canonicalSkillAttributes(fields.attributes).map((attribute) => ({
      attributeId: attribute.attributeId,
      rank: attribute.rank
    })),
    skillIds: fields.skillIds
  });
}

function skillFieldsEqual(left: AdapterSkillFields, right: AdapterSkillFields): boolean {
  return skillTemplateFieldsFingerprint(left) === skillTemplateFieldsFingerprint(right);
}

function canonicalSkillAttributes(
  attributes: AdapterSkillFields["attributes"]
): readonly AdapterSkillFields["attributes"][number][] {
  return [...attributes].sort((left, right) => left.attributeId - right.attributeId);
}

function skillBarFromNumbers(skillIds: readonly number[]): TemplateResult<TemplateSkillBar> {
  const [slot0, slot1, slot2, slot3, slot4, slot5, slot6, slot7, extra] = skillIds;
  if (
    slot0 === undefined ||
    slot1 === undefined ||
    slot2 === undefined ||
    slot3 === undefined ||
    slot4 === undefined ||
    slot5 === undefined ||
    slot6 === undefined ||
    slot7 === undefined ||
    extra !== undefined
  ) {
    return templateFailure(
      templateError({
        code: "INVALID_DECODED_SHAPE",
        operation: "decode",
        stage: "shape",
        expectedTemplateKind: "skill",
        fieldPath: "skillIds",
        message: "Skill templates must contain exactly eight skill slots."
      })
    );
  }

  return templateSuccess([
    templateSkillId(slot0),
    templateSkillId(slot1),
    templateSkillId(slot2),
    templateSkillId(slot3),
    templateSkillId(slot4),
    templateSkillId(slot5),
    templateSkillId(slot6),
    templateSkillId(slot7)
  ]);
}

function lossySkillEncode(message: string): TemplateResult<never> {
  return templateFailure(
    templateError({
      code: "LOSSY_ENCODE",
      operation: "encode",
      stage: "fidelity",
      expectedTemplateKind: "skill",
      message
    })
  );
}
