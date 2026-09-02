import { describe, expect, it } from "vitest";

import {
  catalogId,
  templateAttributeId,
  templateProfessionId,
  templateSkillId,
  type ProfessionAttributeCatalog,
  type SkillCatalog,
  type SkillTemplateDocument
} from "../../src/domain";
import {
  decodeSkillTemplate,
  resolveSkillTemplateDocument
} from "../../src/template-compatibility";
import professionAttributeCatalogJson from "../fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json";
import skillCatalogJson from "../fixtures/data-ingestion/generated/fixture-skills.catalog.json";

const professionAttributeCatalog =
  professionAttributeCatalogJson as unknown as ProfessionAttributeCatalog;
const skillCatalog = skillCatalogJson as unknown as SkillCatalog;

describe("skill template catalog resolution", () => {
  it("resolves template facts through caller-supplied catalogs without mutating source", () => {
    const decoded = decodeSkillTemplate("OAAQIAAAAAAAAAAAAAAA");
    if (!decoded.ok) {
      throw new Error(decoded.error.message);
    }
    const document: SkillTemplateDocument = {
      ...decoded.value,
      primaryProfessionId: templateProfessionId(0),
      secondaryProfessionId: templateProfessionId(1),
      attributes: [
        { attributeId: templateAttributeId(0), rank: 12 },
        { attributeId: templateAttributeId(26), rank: 1 }
      ],
      skillIds: [
        templateSkillId(0),
        templateSkillId(1),
        templateSkillId(4),
        templateSkillId(999999),
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0)
      ]
    };
    const before = JSON.stringify(document);

    const result = resolveSkillTemplateDocument(document, professionAttributeCatalog, skillCatalog);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    expect(JSON.stringify(document)).toBe(before);
    expect(result.value.catalogVersions.professionAttributes).toBe(
      professionAttributeCatalog.catalogVersion
    );
    expect(result.value.catalogVersions.skills).toBe(skillCatalog.catalogVersion);
    expect(result.value.primaryProfession.kind).toBe("none");
    expect(result.value.secondaryProfession.kind).toBe("known");
    expect(result.value.attributes.map((entry) => entry.outcome.kind)).toEqual([
      "known",
      "reserved"
    ]);
    expect(result.value.skillSlots.map((slot) => slot.kind)).toEqual([
      "empty",
      "known",
      "known",
      "unknown",
      "empty",
      "empty",
      "empty",
      "empty"
    ]);
  });

  it("keeps dispositioned skill IDs distinct from unknown and empty slots", () => {
    const decoded = decodeSkillTemplate("OAAQIAAAAAAAAAAAAAAA");
    if (!decoded.ok) {
      throw new Error(decoded.error.message);
    }
    const dispositionedCatalog: SkillCatalog = {
      ...skillCatalog,
      dispositions: [
        ...skillCatalog.dispositions,
        {
          id: "disposition:template-skill-987",
          skillId: catalogId<"Skill">(987),
          templateId: templateSkillId(987),
          requestedTitle: "Synthetic Unsupported",
          kind: "unsupported",
          reason: "Synthetic disposition fixture.",
          reviewId: null,
          provenance: { sourceIds: [], claimIds: [], reviewIds: [], notes: null }
        }
      ]
    };
    const document: SkillTemplateDocument = {
      ...decoded.value,
      skillIds: [
        templateSkillId(0),
        templateSkillId(987),
        templateSkillId(987654),
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0),
        templateSkillId(0)
      ]
    };

    const result = resolveSkillTemplateDocument(
      document,
      professionAttributeCatalog,
      dispositionedCatalog
    );

    expect(result.ok && result.value.skillSlots.map((slot) => slot.kind).slice(0, 3)).toEqual([
      "empty",
      "dispositioned",
      "unknown"
    ]);
  });
});
