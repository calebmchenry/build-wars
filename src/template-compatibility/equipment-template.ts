import {
  templateEquipmentColorId,
  templateEquipmentItemId,
  templateEquipmentModifierId,
  templateEquipmentSlotId,
  TEMPLATE_COMPATIBILITY_SCHEMA_VERSION,
  type EquipmentTemplateDocument,
  type TemplateExportedCode,
  type TemplateExportOptions,
  type TemplateResult
} from "../domain";
import type { AdapterEquipmentFields, AdapterEquipmentItem } from "./gw-templates-adapter";
import { decodeEquipmentTemplateBare, encodeEquipmentTemplateBare } from "./gw-templates-adapter";
import { formatTemplateChatCode, parseTemplateInput } from "./chat-code";
import { templateFingerprint } from "./fingerprint";
import { templateError, templateFailure, templateSuccess } from "./result";

export function decodeEquipmentTemplate(input: string): TemplateResult<EquipmentTemplateDocument> {
  const parsed = parseTemplateInput(input, "equipment", "decode");
  if (!parsed.ok) {
    return parsed;
  }

  const decoded = decodeEquipmentTemplateBare(parsed.value.bareCode);
  if (!decoded.ok) {
    return decoded;
  }

  const fingerprint = equipmentTemplateFieldsFingerprint(decoded.value);
  return templateSuccess(
    {
      kind: "equipment",
      schemaVersion: TEMPLATE_COMPATIBILITY_SCHEMA_VERSION,
      source: {
        inputKind: parsed.value.inputKind,
        templateKind: "equipment",
        originalInput: parsed.value.originalInput,
        originalBareCode: parsed.value.bareCode,
        normalizedDependencyInput: null,
        templateName: parsed.value.templateName,
        semanticFingerprint: fingerprint,
        fidelity: "exact-source"
      },
      items: decoded.value.items.map((item) => ({
        slotId: templateEquipmentSlotId(item.slotId),
        itemId: templateEquipmentItemId(item.itemId),
        colorId: templateEquipmentColorId(item.colorId),
        modifierIds: item.modifierIds.map(templateEquipmentModifierId)
      }))
    },
    parsed.diagnostics
  );
}

export function exportEquipmentTemplate(
  document: EquipmentTemplateDocument,
  options: TemplateExportOptions = {}
): TemplateResult<TemplateExportedCode> {
  const mode = options.mode ?? "auto";
  const templateName = options.templateName ?? document.source.templateName;
  const currentFingerprint = equipmentTemplateFingerprint(document);

  if (mode !== "canonical" && currentFingerprint === document.source.semanticFingerprint) {
    const formatted = formatTemplateChatCode(
      document.source.originalBareCode,
      templateName,
      "equipment"
    );
    if (!formatted.ok) {
      return formatted;
    }

    return templateSuccess({
      kind: "equipment",
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
        expectedTemplateKind: "equipment",
        message: "The equipment template document no longer matches its source fingerprint."
      })
    );
  }

  const fields = equipmentFieldsFromDocument(document);
  const encoded = encodeEquipmentTemplateBare(fields);
  if (!encoded.ok) {
    return encoded;
  }

  const decoded = decodeEquipmentTemplateBare(encoded.value);
  if (!decoded.ok) {
    return decoded;
  }
  if (!equipmentFieldsEqual(fields, decoded.value)) {
    return lossyEquipmentEncode("Canonical equipment encode did not preserve every modeled field.");
  }

  const formatted = formatTemplateChatCode(encoded.value, templateName, "equipment");
  if (!formatted.ok) {
    return formatted;
  }

  return templateSuccess({
    kind: "equipment",
    code: formatted.value,
    bareCode: encoded.value,
    inputKind: templateName === null ? "bare" : "chat-code",
    templateName,
    fidelity: "field-complete-normalized",
    semanticFingerprint: currentFingerprint
  });
}

export function equipmentTemplateFingerprint(document: EquipmentTemplateDocument): string {
  return equipmentTemplateFieldsFingerprint(equipmentFieldsFromDocument(document));
}

function equipmentFieldsFromDocument(document: EquipmentTemplateDocument): AdapterEquipmentFields {
  return {
    items: document.items.map((item) => ({
      slotId: Number(item.slotId),
      itemId: Number(item.itemId),
      colorId: Number(item.colorId),
      modifierIds: item.modifierIds.map((modifierId) => Number(modifierId))
    }))
  };
}

function equipmentTemplateFieldsFingerprint(fields: AdapterEquipmentFields): string {
  return templateFingerprint("equipment-template", {
    items: fields.items.map((item) => ({
      slotId: item.slotId,
      itemId: item.itemId,
      colorId: item.colorId,
      modifierIds: item.modifierIds
    }))
  });
}

function equipmentFieldsEqual(
  left: AdapterEquipmentFields,
  right: AdapterEquipmentFields
): boolean {
  return (
    equipmentTemplateFieldsFingerprint(normalizeEquipmentFields(left)) ===
    equipmentTemplateFieldsFingerprint(normalizeEquipmentFields(right))
  );
}

function normalizeEquipmentFields(fields: AdapterEquipmentFields): AdapterEquipmentFields {
  return {
    items: [...fields.items]
      .map((item): AdapterEquipmentItem => ({
        slotId: item.slotId,
        itemId: item.itemId,
        colorId: item.colorId,
        modifierIds: [...item.modifierIds]
      }))
      .sort((left, right) => left.slotId - right.slotId)
  };
}

function lossyEquipmentEncode(message: string): TemplateResult<never> {
  return templateFailure(
    templateError({
      code: "LOSSY_ENCODE",
      operation: "encode",
      stage: "fidelity",
      expectedTemplateKind: "equipment",
      message
    })
  );
}
