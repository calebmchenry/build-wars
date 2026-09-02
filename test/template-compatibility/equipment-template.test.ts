import { describe, expect, it } from "vitest";

import {
  templateEquipmentColorId,
  templateEquipmentItemId,
  type EquipmentTemplateDocument
} from "../../src/domain";
import {
  decodeEquipmentTemplate,
  EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE,
  exportEquipmentTemplate
} from "../../src/template-compatibility";
import equipmentCases from "../fixtures/template-compatibility/equipment-cases.json";

describe("equipment template compatibility", () => {
  it("decodes supported equipment fixtures into deterministic raw item order", () => {
    for (const fixture of equipmentCases.valid) {
      const result = decodeEquipmentTemplate(fixture.input);
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      expect(result.value.kind).toBe("equipment");
      expect(
        result.value.items.map((item) => ({
          slotId: Number(item.slotId),
          itemId: Number(item.itemId),
          colorId: Number(item.colorId),
          modifierIds: item.modifierIds.map(Number)
        }))
      ).toEqual(fixture.expected.items);
      expect(result.value.source.semanticFingerprint).toMatch(/^equipment-template:v1:/);
    }
  });

  it("exact-replays raw package equipment that the dependency cannot canonically re-add", () => {
    const decoded = decodeEquipmentTemplate(`[;${EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE}]`);
    if (!decoded.ok) {
      throw new Error(decoded.error.message);
    }

    const replay = exportEquipmentTemplate(decoded.value);
    const canonical = exportEquipmentTemplate(decoded.value, { mode: "canonical" });

    expect(replay.ok && replay.value).toMatchObject({
      code: `[;${EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE}]`,
      bareCode: EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE,
      templateName: "",
      fidelity: "exact-source"
    });
    expect(canonical.ok ? canonical.value.code : canonical.error.code).toBe("UNSUPPORTED_BY_CODEC");
  });

  it("canonically exports only when decoded raw fields match", () => {
    const decoded = decodeEquipmentTemplate("PkZwFP9FzSKA");
    if (!decoded.ok) {
      throw new Error(decoded.error.message);
    }

    const canonical = exportEquipmentTemplate(decoded.value, { mode: "canonical" });

    expect(canonical.ok && canonical.value).toMatchObject({
      bareCode: "PkZwFP9FzSKA",
      fidelity: "field-complete-normalized"
    });
  });

  it("rejects unsupported edits and invalid raw values without a code", () => {
    const decoded = decodeEquipmentTemplate("PkZwFP9FzSKA");
    if (!decoded.ok) {
      throw new Error(decoded.error.message);
    }
    const firstItem = decoded.value.items[0];
    if (firstItem === undefined) {
      throw new Error("Missing equipment fixture item");
    }

    const invalidColor: EquipmentTemplateDocument = {
      ...decoded.value,
      items: [
        {
          ...firstItem,
          colorId: templateEquipmentColorId(999)
        }
      ]
    };
    const unsupportedItem: EquipmentTemplateDocument = {
      ...decoded.value,
      items: [
        {
          ...firstItem,
          itemId: templateEquipmentItemId(0)
        }
      ]
    };
    const unsupportedResult = exportEquipmentTemplate(unsupportedItem, { mode: "canonical" });

    expect(exportEquipmentTemplate(invalidColor, { mode: "canonical" }).ok).toBe(false);
    expect(unsupportedResult.ok ? null : unsupportedResult.error.code).toBe("UNSUPPORTED_BY_CODEC");
  });

  it("returns typed failures for invalid equipment fixtures", () => {
    for (const fixture of equipmentCases.invalid) {
      const result = decodeEquipmentTemplate(fixture.input);
      expect(result.ok ? null : result.error.code).toBe(fixture.expectedError);
    }
  });
});
