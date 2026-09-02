import { EquipmentTemplate, PwndTemplate, SkillTemplate } from "@buildwars/gw-templates";

import type { TemplateResult } from "../domain";
import {
  dependencyFailure,
  dependencyMessage,
  templateError,
  templateFailure,
  templateSuccess
} from "./result";

export const GW_TEMPLATES_PACKAGE_VERSION = "1.1.1";
export const SKILL_TEMPLATE_PACKAGE_EXAMPLE = "OwFj0xfzITOMMMHMie4O0kxZ6PA";
export const EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE = "PkpxFP9FzSqIlpI90MlpIDLfopInVBgpILlLlpIFF";

export interface AdapterSkillAttribute {
  readonly attributeId: number;
  readonly rank: number;
}

export interface AdapterSkillFields {
  readonly dependencyCode: string;
  readonly primaryProfessionId: number;
  readonly secondaryProfessionId: number;
  readonly attributes: readonly AdapterSkillAttribute[];
  readonly skillIds: readonly number[];
}

export interface AdapterEquipmentItem {
  readonly slotId: number;
  readonly itemId: number;
  readonly colorId: number;
  readonly modifierIds: readonly number[];
}

export interface AdapterEquipmentFields {
  readonly items: readonly AdapterEquipmentItem[];
}

export interface PwndFeasibilityEvidence {
  readonly disposition: "candidate" | "deferred";
  readonly reason: string;
}

const SKILL_TEMPLATE_SLOT_COUNT = 8;
const MAX_SKILL_ATTRIBUTES = 16;
const MAX_EQUIPMENT_ITEMS = 7;
const MAX_EQUIPMENT_MODIFIERS_PER_ITEM = 8;
const MAX_EQUIPMENT_COLOR_ID = 15;

export function decodeSkillTemplateBare(bareCode: string): TemplateResult<AdapterSkillFields> {
  let decoded: unknown;
  try {
    decoded = new SkillTemplate().decode(bareCode);
  } catch (error) {
    return dependencyFailure(error, { operation: "decode", expectedTemplateKind: "skill" });
  }

  return copySkillTemplateFields(decoded);
}

export function encodeSkillTemplateBare(fields: AdapterSkillFields): TemplateResult<string> {
  const validation = validateSkillFields(fields);
  if (!validation.ok) {
    return validation;
  }

  const attributes: Record<string, number> = {};
  for (const attribute of fields.attributes) {
    attributes[String(attribute.attributeId)] = attribute.rank;
  }

  try {
    const encoded = new SkillTemplate().encode(
      fields.primaryProfessionId,
      fields.secondaryProfessionId,
      attributes,
      fields.skillIds
    );
    return templateSuccess(encoded);
  } catch (error) {
    return dependencyFailure(error, {
      operation: "encode",
      expectedTemplateKind: "skill",
      code: "UNSUPPORTED_BY_CODEC"
    });
  }
}

export function decodeEquipmentTemplateBare(
  bareCode: string
): TemplateResult<AdapterEquipmentFields> {
  let decoded: unknown;
  try {
    decoded = new EquipmentTemplate().decode(bareCode);
  } catch (error) {
    return dependencyFailure(error, { operation: "decode", expectedTemplateKind: "equipment" });
  }

  return copyEquipmentTemplateFields(decoded);
}

export function encodeEquipmentTemplateBare(
  fields: AdapterEquipmentFields
): TemplateResult<string> {
  const validation = validateEquipmentFields(fields);
  if (!validation.ok) {
    return validation;
  }

  const template = new EquipmentTemplate();
  try {
    for (const item of fields.items) {
      template.addItem(item.itemId, item.colorId, item.modifierIds);
    }
    return templateSuccess(template.encode());
  } catch (error) {
    return dependencyFailure(error, {
      operation: "encode",
      expectedTemplateKind: "equipment",
      code: "UNSUPPORTED_BY_CODEC"
    });
  }
}

export function probePwndTemplateFeasibility(): TemplateResult<PwndFeasibilityEvidence> {
  const nodeFloorFailure =
    "Node.js 22.11.0 package-entry probe failed minimal paw-ned2 encode with TypeError: $string.toBase64 is not a function.";
  try {
    const template = new PwndTemplate();
    template.addBuild(
      SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE,
      [],
      "name",
      "description",
      "player",
      [4, 0, 1, 1, 0],
      []
    );
    const encoded = template.encode();
    new PwndTemplate().decode(encoded);
    return templateFailure(
      templateError({
        code: "PAWNED2_DEFERRED",
        operation: "probe",
        stage: "dependency",
        expectedTemplateKind: "paw-ned2",
        message: `paw-ned2 support deferred: ${nodeFloorFailure}`
      })
    );
  } catch (error) {
    return templateFailure(
      templateError({
        code: "PAWNED2_DEFERRED",
        operation: "probe",
        stage: "dependency",
        expectedTemplateKind: "paw-ned2",
        message: `paw-ned2 support deferred: ${dependencyMessage(error)}`
      })
    );
  }
}

function copySkillTemplateFields(decoded: unknown): TemplateResult<AdapterSkillFields> {
  const record = plainRecord(decoded, "$", "skill");
  if (!record.ok) {
    return record;
  }

  const keys = assertExactKeys(
    record.value,
    ["attributes", "code", "prof_pri", "prof_sec", "skills"],
    "$",
    "skill"
  );
  if (!keys.ok) {
    return keys;
  }

  const dependencyCode = readString(record.value, "code", "code", "skill");
  if (!dependencyCode.ok) {
    return dependencyCode;
  }
  const primaryProfessionId = readSafeInteger(
    record.value,
    "prof_pri",
    "primaryProfessionId",
    "skill"
  );
  if (!primaryProfessionId.ok) {
    return primaryProfessionId;
  }
  const secondaryProfessionId = readSafeInteger(
    record.value,
    "prof_sec",
    "secondaryProfessionId",
    "skill"
  );
  if (!secondaryProfessionId.ok) {
    return secondaryProfessionId;
  }

  const attributesRecord = plainRecord(record.value["attributes"], "attributes", "skill");
  if (!attributesRecord.ok) {
    return attributesRecord;
  }
  if (Object.keys(attributesRecord.value).length > MAX_SKILL_ATTRIBUTES) {
    return invalidDecodedShape(
      "skill",
      "attributes",
      "Skill templates exceeded the attribute limit."
    );
  }

  const attributes: AdapterSkillAttribute[] = [];
  for (const [key, value] of Object.entries(attributesRecord.value).sort(
    ([left], [right]) => Number(left) - Number(right)
  )) {
    const attributeId = parseNonNegativeIntegerKey(key, `attributes.${key}`, "skill");
    if (!attributeId.ok) {
      return attributeId;
    }
    const rank = safeIntegerFromValue(value, `attributes.${key}`, "skill");
    if (!rank.ok) {
      return rank;
    }
    attributes.push({ attributeId: attributeId.value, rank: rank.value });
  }

  const skills = record.value["skills"];
  if (!Array.isArray(skills) || skills.length !== SKILL_TEMPLATE_SLOT_COUNT) {
    return invalidDecodedShape(
      "skill",
      "skillIds",
      "Skill templates must contain exactly eight skill slots."
    );
  }

  const skillIds: number[] = [];
  for (let index = 0; index < skills.length; index += 1) {
    const skillId = safeIntegerFromValue(skills[index], `skillIds.${index}`, "skill");
    if (!skillId.ok) {
      return skillId;
    }
    skillIds.push(skillId.value);
  }

  return templateSuccess({
    dependencyCode: dependencyCode.value,
    primaryProfessionId: primaryProfessionId.value,
    secondaryProfessionId: secondaryProfessionId.value,
    attributes,
    skillIds
  });
}

function copyEquipmentTemplateFields(decoded: unknown): TemplateResult<AdapterEquipmentFields> {
  const record = plainRecord(decoded, "$", "equipment");
  if (!record.ok) {
    return record;
  }

  const items: AdapterEquipmentItem[] = [];
  const keys = Object.keys(record.value).sort((left, right) => Number(left) - Number(right));
  if (keys.length > MAX_EQUIPMENT_ITEMS) {
    return invalidDecodedShape(
      "equipment",
      "items",
      "Equipment templates exceeded the item limit."
    );
  }

  for (const key of keys) {
    const itemRecord = plainRecord(record.value[key], `items.${key}`, "equipment");
    if (!itemRecord.ok) {
      return itemRecord;
    }
    const exactKeys = assertExactKeys(
      itemRecord.value,
      ["color", "id", "mods", "slot"],
      `items.${key}`,
      "equipment"
    );
    if (!exactKeys.ok) {
      return exactKeys;
    }

    const slotFromKey = parseNonNegativeIntegerKey(key, `items.${key}`, "equipment");
    if (!slotFromKey.ok) {
      return slotFromKey;
    }
    const slotId = readSafeInteger(itemRecord.value, "slot", `items.${key}.slotId`, "equipment");
    if (!slotId.ok) {
      return slotId;
    }
    if (slotId.value !== slotFromKey.value) {
      return invalidDecodedShape(
        "equipment",
        `items.${key}.slotId`,
        "Equipment item slot key did not match its slot value."
      );
    }

    const itemId = readSafeInteger(itemRecord.value, "id", `items.${key}.itemId`, "equipment");
    if (!itemId.ok) {
      return itemId;
    }
    const colorId = readSafeInteger(itemRecord.value, "color", `items.${key}.colorId`, "equipment");
    if (!colorId.ok) {
      return colorId;
    }
    const mods = itemRecord.value["mods"];
    if (!Array.isArray(mods) || mods.length > MAX_EQUIPMENT_MODIFIERS_PER_ITEM) {
      return invalidDecodedShape(
        "equipment",
        `items.${key}.modifierIds`,
        "Equipment modifier count is outside the supported limit."
      );
    }

    const modifierIds: number[] = [];
    for (let index = 0; index < mods.length; index += 1) {
      const modifierId = safeIntegerFromValue(
        mods[index],
        `items.${key}.modifierIds.${index}`,
        "equipment"
      );
      if (!modifierId.ok) {
        return modifierId;
      }
      modifierIds.push(modifierId.value);
    }

    items.push({
      slotId: slotId.value,
      itemId: itemId.value,
      colorId: colorId.value,
      modifierIds
    });
  }

  return templateSuccess({ items });
}

function validateSkillFields(fields: AdapterSkillFields): TemplateResult<AdapterSkillFields> {
  const values = [
    ["primaryProfessionId", fields.primaryProfessionId],
    ["secondaryProfessionId", fields.secondaryProfessionId]
  ] as const;
  for (const [fieldPath, value] of values) {
    const validated = safeIntegerFromValue(value, fieldPath, "skill", "encode");
    if (!validated.ok) {
      return validated;
    }
  }

  if (fields.attributes.length > MAX_SKILL_ATTRIBUTES) {
    return invalidFieldValue(
      "skill",
      "attributes",
      "Skill templates cannot encode more than 16 attributes."
    );
  }
  const attributeIds = new Set<number>();
  for (const attribute of fields.attributes) {
    const attributeId = safeIntegerFromValue(
      attribute.attributeId,
      "attributes.attributeId",
      "skill",
      "encode"
    );
    if (!attributeId.ok) {
      return attributeId;
    }
    const rank = safeIntegerFromValue(attribute.rank, "attributes.rank", "skill", "encode");
    if (!rank.ok) {
      return rank;
    }
    if (attributeIds.has(attribute.attributeId)) {
      return invalidFieldValue(
        "skill",
        "attributes",
        "Duplicate attribute IDs cannot be canonically encoded."
      );
    }
    attributeIds.add(attribute.attributeId);
  }

  if (fields.skillIds.length !== SKILL_TEMPLATE_SLOT_COUNT) {
    return invalidFieldValue(
      "skill",
      "skillIds",
      "Skill templates must encode exactly eight skill slots."
    );
  }
  for (let index = 0; index < fields.skillIds.length; index += 1) {
    const skillId = safeIntegerFromValue(
      fields.skillIds[index],
      `skillIds.${index}`,
      "skill",
      "encode"
    );
    if (!skillId.ok) {
      return skillId;
    }
  }

  return templateSuccess(fields);
}

function validateEquipmentFields(
  fields: AdapterEquipmentFields
): TemplateResult<AdapterEquipmentFields> {
  if (fields.items.length > MAX_EQUIPMENT_ITEMS) {
    return invalidFieldValue(
      "equipment",
      "items",
      "Equipment templates cannot encode more than seven items."
    );
  }

  const slots = new Set<number>();
  for (const item of fields.items) {
    const slotId = safeIntegerFromValue(item.slotId, "items.slotId", "equipment", "encode");
    if (!slotId.ok) {
      return slotId;
    }
    if (slotId.value > 6) {
      return invalidFieldValue(
        "equipment",
        "items.slotId",
        "Equipment slots must be in the raw 0-6 range."
      );
    }
    if (slots.has(slotId.value)) {
      return invalidFieldValue(
        "equipment",
        "items.slotId",
        "Duplicate equipment slots cannot be canonically encoded."
      );
    }
    slots.add(slotId.value);

    const itemId = safeIntegerFromValue(item.itemId, "items.itemId", "equipment", "encode");
    if (!itemId.ok) {
      return itemId;
    }
    const colorId = safeIntegerFromValue(item.colorId, "items.colorId", "equipment", "encode");
    if (!colorId.ok) {
      return colorId;
    }
    if (colorId.value > MAX_EQUIPMENT_COLOR_ID) {
      return invalidFieldValue(
        "equipment",
        "items.colorId",
        "Equipment color IDs must be in the raw 0-15 range."
      );
    }
    if (item.modifierIds.length > MAX_EQUIPMENT_MODIFIERS_PER_ITEM) {
      return invalidFieldValue(
        "equipment",
        "items.modifierIds",
        "Equipment items cannot encode more than eight modifiers."
      );
    }
    for (let index = 0; index < item.modifierIds.length; index += 1) {
      const modifierId = safeIntegerFromValue(
        item.modifierIds[index],
        `items.modifierIds.${index}`,
        "equipment",
        "encode"
      );
      if (!modifierId.ok) {
        return modifierId;
      }
    }
  }

  return templateSuccess(fields);
}

function plainRecord(
  value: unknown,
  fieldPath: string,
  expectedTemplateKind: "skill" | "equipment"
): TemplateResult<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return invalidDecodedShape(
      expectedTemplateKind,
      fieldPath,
      "Template dependency returned a non-object value."
    );
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return invalidDecodedShape(
      expectedTemplateKind,
      fieldPath,
      "Template dependency returned a non-plain object."
    );
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) {
    return invalidDecodedShape(
      expectedTemplateKind,
      fieldPath,
      "Template dependency returned accessors."
    );
  }

  return templateSuccess(value as Record<string, unknown>);
}

function assertExactKeys(
  record: Record<string, unknown>,
  expectedKeys: readonly string[],
  fieldPath: string,
  expectedTemplateKind: "skill" | "equipment"
): TemplateResult<Record<string, unknown>> {
  const expected = new Set(expectedKeys);
  const actual = Object.keys(record);
  if (actual.length !== expectedKeys.length || actual.some((key) => !expected.has(key))) {
    return invalidDecodedShape(
      expectedTemplateKind,
      fieldPath,
      "Template dependency returned unsupported fields."
    );
  }

  return templateSuccess(record);
}

function readString(
  record: Record<string, unknown>,
  key: string,
  fieldPath: string,
  expectedTemplateKind: "skill" | "equipment"
): TemplateResult<string> {
  const value = record[key];
  if (typeof value !== "string") {
    return invalidDecodedShape(
      expectedTemplateKind,
      fieldPath,
      "Template dependency returned a non-string field."
    );
  }
  return templateSuccess(value);
}

function readSafeInteger(
  record: Record<string, unknown>,
  key: string,
  fieldPath: string,
  expectedTemplateKind: "skill" | "equipment"
): TemplateResult<number> {
  return safeIntegerFromValue(record[key], fieldPath, expectedTemplateKind);
}

function parseNonNegativeIntegerKey(
  key: string,
  fieldPath: string,
  expectedTemplateKind: "skill" | "equipment"
): TemplateResult<number> {
  if (!/^(0|[1-9][0-9]*)$/.test(key)) {
    return invalidDecodedShape(
      expectedTemplateKind,
      fieldPath,
      "Template dependency returned a non-numeric key."
    );
  }

  return safeIntegerFromValue(Number(key), fieldPath, expectedTemplateKind);
}

function safeIntegerFromValue(
  value: unknown,
  fieldPath: string,
  expectedTemplateKind: "skill" | "equipment",
  operation: "decode" | "encode" = "decode"
): TemplateResult<number> {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    if (operation === "encode") {
      return invalidFieldValue(
        expectedTemplateKind,
        fieldPath,
        "Template fields must be finite non-negative safe integers."
      );
    }
    return invalidDecodedShape(
      expectedTemplateKind,
      fieldPath,
      "Template dependency returned a non-finite integer."
    );
  }

  return templateSuccess(value);
}

function invalidDecodedShape(
  expectedTemplateKind: "skill" | "equipment",
  fieldPath: string,
  message: string
): TemplateResult<never> {
  return templateFailure(
    templateError({
      code: "INVALID_DECODED_SHAPE",
      operation: "decode",
      stage: "shape",
      expectedTemplateKind,
      fieldPath,
      message
    })
  );
}

function invalidFieldValue(
  expectedTemplateKind: "skill" | "equipment",
  fieldPath: string,
  message: string
): TemplateResult<never> {
  return templateFailure(
    templateError({
      code: "INVALID_FIELD_VALUE",
      operation: "encode",
      stage: "validation",
      expectedTemplateKind,
      fieldPath,
      message
    })
  );
}
