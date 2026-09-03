import { describe, expect, it } from "vitest";

import {
  catalogId,
  lookupSkillByName,
  lookupSkillTemplateId,
  renderSkillTooltipText,
  resolveSkillModeVariant,
  SOURCE_POLICY_SCHEMA_VERSION,
  templateSkillId,
  type SkillCatalog
} from "../../src/domain";
import golden from "../fixtures/data-ingestion/generated/fixture-skills.catalog.json";

const catalog = golden as unknown as SkillCatalog;

describe("skill catalog contracts", () => {
  it("keeps template skill IDs distinct and unknown authored IDs representable", () => {
    const known = lookupSkillTemplateId(catalog, templateSkillId(1));
    const unknown = lookupSkillTemplateId(catalog, templateSkillId(987654321));

    expect(known.kind).toBe("known");
    expect(known.catalogId).toBe(1);
    expect(unknown.kind).toBe("unknown");
    expect(unknown.templateId).toBe(987654321);
  });

  it("loads the Python-generated fixture through the runtime-safe wire contract", () => {
    expect(catalog.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(catalog.profile.id).toBe("epic-04-skills");
    expect(catalog.sourceSet.indexTitle).toBe("Guild Wars Wiki:Game integration/Skills");
    expect(catalog.sourceSet.acceptedSeedCount).toBe(6);
    expect(catalog.skills.map((skill) => Number(skill.id))).toEqual([1, 2, 3, 4, 5, 6]);

    const healingSignet = catalog.skills[0];
    expect(healingSignet?.templateId).toBe(1);
    expect(healingSignet?.costs.energy.state).toBe("absent");
    expect(healingSignet?.timings.activation.value).toBe(2);
    expect(healingSignet?.description.state).toBe("structured-only");
    expect(healingSignet?.description.searchText).toContain("Healing Signet");
    expect(JSON.stringify(catalog)).not.toContain("Fixture trainer prose");
    expect(catalog.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
  });

  it("performs collision-safe skill name lookups", () => {
    expect(lookupSkillByName(catalog, "flare")?.id).toBe(2);

    const duplicate = {
      ...catalog,
      skills: [
        ...catalog.skills,
        {
          ...catalog.skills[1],
          id: 999,
          templateId: 999
        }
      ]
    } as SkillCatalog;
    expect(() => lookupSkillByName(duplicate, "Flare")).toThrow(/Ambiguous skill/);
  });

  it("keeps PvE/PvP split selection explicit for unknown mode", () => {
    const pve = lookupSkillByName(catalog, "Training Beacon (PvE)");
    if (pve === null) {
      throw new Error("Missing split fixture");
    }

    const unknown = resolveSkillModeVariant(catalog, pve, "unknown");
    const pvp = resolveSkillModeVariant(catalog, pve, "pvp");

    expect(unknown.kind).toBe("ambiguous-mode");
    expect(pvp.kind).toBe("variant");
    expect(pvp.skill.name).toBe("Training Beacon (PvP)");
  });

  it("renders tooltip text only from catalog tokens and caller-supplied ranks", () => {
    const withProgressionToken = {
      ...catalog,
      skills: catalog.skills.map((skill) =>
        Number(skill.id) === 1
          ? {
              ...skill,
              description: {
                ...skill.description,
                tokens: [
                  { kind: "literal", value: "Heal " },
                  {
                    kind: "progression-reference",
                    seriesId: "progression:skill:1:1",
                    valueSlot: 0
                  }
                ]
              }
            }
          : skill
      )
    } as SkillCatalog;

    const rendered = renderSkillTooltipText(withProgressionToken, catalogId<"Skill">(1), {
      mode: "pve",
      ranks: { "attribute:21": 15 }
    });
    const missingRank = renderSkillTooltipText(withProgressionToken, catalogId<"Skill">(1), {
      mode: "pve",
      ranks: {}
    });

    if (rendered.kind !== "rendered") {
      throw new Error(`Expected rendered tooltip, got ${rendered.kind}`);
    }
    if (missingRank.kind !== "unresolved") {
      throw new Error(`Expected unresolved tooltip, got ${missingRank.kind}`);
    }
    expect(rendered.text).toBe("Heal 172");
    expect(rendered.segments).toEqual([
      { text: "Heal ", tone: "normal" },
      { text: "172", tone: "variable" }
    ]);
    expect(missingRank.reason).toBe("missing-rank");
  });
});
