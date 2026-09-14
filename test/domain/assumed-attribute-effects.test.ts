import { describe, expect, it } from "vitest";
import {
  catalogId,
  projectAttributePreview,
  type Build,
  type AssumedEffectId
} from "../../src/domain";
import {
  elementalBuild,
  adjustmentPreviewInput,
  fireId
} from "../fixtures/attribute-adjustment-builds";
const id = (n: number) => catalogId<"Skill">(n);
const preview = (build: Build) => projectAttributePreview(adjustmentPreviewInput(build));
const effect = (build: Build, key: AssumedEffectId) =>
  preview(build).effects.find((e) => e.definition.id === key)!;
describe("bounded assumed attribute effects", () => {
  it("deduplicates factions and slots while ignoring unrelated invalid skills", () => {
    const build = elementalBuild({
      skillBar: [id(198), id(198), id(1951), id(2094), id(-123), null, null, null]
    });
    expect(preview(build).activeEffectCount).toBe(2);
    expect(preview(build).ranks.get(fireId)?.effective).toBe(19);
  });
  it("permits secondary elemental targets but no Energy Storage or secondary gear", () => {
    const build = elementalBuild({
      primaryProfessionId: catalogId<"Profession">(1),
      secondaryProfessionId: catalogId<"Profession">(6),
      skillBar: [id(198), id(1951), null, null, null, null, null, null]
    });
    expect(preview(build).ranks.get(fireId)).toMatchObject({ effective: 15, gearEligible: false });
    expect(preview(build).ranks.get(catalogId<"Attribute">(12))?.effective).toBe(0);
  });
  it.each(["pve", "pvp", "unknown"] as const)(
    "resolves Masochism in %s without granting Soul Reaping to secondary Necromancer",
    (mode) => {
      const build = elementalBuild({
        mode,
        skillBar: [id(3054), null, null, null, null, null, null, null]
      });
      expect(effect(build, "masochism").active).toBe(mode === "pve");
      expect(preview(build).ranks.get(catalogId<"Attribute">(5))?.effective).toBe(
        mode === "pve" ? 2 : 0
      );
      expect(preview(build).ranks.get(catalogId<"Attribute">(6))?.effective).toBe(0);
    }
  );
  it("remembers off and inactive on, and resumes automatic only when reset", () => {
    const build = elementalBuild({ skillBar: [id(198), null, null, null, null, null, null, null] });
    const off = {
      ...build,
      attributeAdjustments: {
        ...build.attributeAdjustments!,
        effectPreferences: [
          { effectId: "glyph-of-elemental-power" as const, preference: "off" as const }
        ]
      }
    };
    expect(effect(off, "glyph-of-elemental-power")).toMatchObject({
      requested: false,
      automatic: true,
      active: false
    });
    const missing = { ...off, skillBar: elementalBuild().skillBar };
    expect(effect(missing, "glyph-of-elemental-power")).toMatchObject({
      requested: false,
      present: false,
      active: false
    });
    const on = {
      ...missing,
      attributeAdjustments: {
        ...missing.attributeAdjustments,
        effectPreferences: [
          { effectId: "glyph-of-elemental-power" as const, preference: "on" as const }
        ]
      }
    };
    expect(effect(on, "glyph-of-elemental-power")).toMatchObject({
      requested: true,
      active: false
    });
    expect(effect(build, "glyph-of-elemental-power").active).toBe(true);
  });
  it("never infers Refrain from its own bar and gates external assumptions by mode/recipient scope", () => {
    const build = elementalBuild({
      skillBar: [id(3431), null, null, null, null, null, null, null]
    });
    expect(effect(build, "heroic-refrain")).toMatchObject({
      requested: false,
      active: false,
      strength: 4
    });
    const on = {
      ...build,
      attributeAdjustments: {
        ...build.attributeAdjustments!,
        effectPreferences: [
          { effectId: "heroic-refrain" as const, preference: "on" as const, strength: 4 as const }
        ]
      }
    };
    expect(effect(on, "heroic-refrain").active).toBe(true);
    expect(effect({ ...on, mode: "pvp" }, "heroic-refrain")).toMatchObject({
      requested: true,
      active: false,
      strength: 4
    });
    expect(effect({ ...on, primaryProfessionId: null }, "heroic-refrain").active).toBe(false);
  });
  it("matches template identity when authored catalog identity differs", () => {
    const build = elementalBuild({
      skillBar: [id(800198), null, null, null, null, null, null, null]
    });
    const input = adjustmentPreviewInput(build);
    const skillCatalog = {
      ...input.skillCatalog,
      skills: input.skillCatalog.skills.map((s) =>
        Number(s.templateId) === 198 ? { ...s, id: id(800198) } : s
      )
    };
    expect(projectAttributePreview({ ...input, skillCatalog }).activeEffectCount).toBe(1);
  });
  it.each(["skill-id", "template-id", "split-group", "split-member", "missing-counterpart"])(
    "rejects ambiguous or incomplete %s",
    (kind) => {
      const input = adjustmentPreviewInput(
        elementalBuild({
          skillBar: [
            id(kind.startsWith("split") || kind === "missing-counterpart" ? 2139 : 198),
            null,
            null,
            null,
            null,
            null,
            null,
            null
          ]
        })
      );
      let skillCatalog = input.skillCatalog;
      const glyph = skillCatalog.skills.find((s) => Number(s.id) === 198)!;
      const split = skillCatalog.splitGroups.find((g) => g.id === "split:skill:2139")!;
      if (kind === "skill-id")
        skillCatalog = { ...skillCatalog, skills: [...skillCatalog.skills, glyph] };
      if (kind === "template-id")
        skillCatalog = {
          ...skillCatalog,
          skills: [...skillCatalog.skills, { ...glyph, id: id(800198) }]
        };
      if (kind === "split-group")
        skillCatalog = { ...skillCatalog, splitGroups: [...skillCatalog.splitGroups, split] };
      if (kind === "split-member")
        skillCatalog = {
          ...skillCatalog,
          splitGroups: skillCatalog.splitGroups.map((g) =>
            g === split ? { ...g, members: [...g.members, g.members[0]!] } : g
          )
        };
      if (kind === "missing-counterpart")
        skillCatalog = {
          ...skillCatalog,
          skills: skillCatalog.skills.filter((s) => Number(s.id) !== 3054)
        };
      expect(projectAttributePreview({ ...input, skillCatalog }).activeEffectCount).toBe(0);
    }
  );
});
