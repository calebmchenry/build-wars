import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  catalogId,
  lookupSkillTemplateId,
  templateSkillId,
  type SkillTemplateDocument
} from "../domain";
import {
  decodeSkillTemplate,
  exportSkillTemplate,
  resolveSkillTemplateDocument,
  SKILL_TEMPLATE_PACKAGE_EXAMPLE
} from "../template-compatibility";
import { requireReadyCatalogs } from "./catalogs";
import { selectSkillBrowser, selectValidationView } from "./editor-selectors";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";
import icons from "./skill-icon-assets.generated.json";

const catalogs = requireReadyCatalogs();

describe("promoted skill identities", () => {
  it("has unique selectable names and preserves excluded template IDs as dispositions", () => {
    expect(new Set(catalogs.skills.map((skill) => skill.normalizedName)).size).toBe(
      catalogs.skills.length
    );
    expect(
      catalogs.skills.filter((skill) => skill.name === "Pain").map((skill) => skill.id)
    ).toEqual([1247]);
    for (const id of [3042, 3043, 562, 1319, 3065, 3066, 2628]) {
      const result = lookupSkillTemplateId(catalogs.skillCatalog, templateSkillId(id));
      expect(result).toMatchObject({ kind: "dispositioned", templateId: id });
      expect(catalogs.skills.some((skill) => Number(skill.id) === id)).toBe(false);
    }
  });

  it("gives every faction pair distinct square icon files and matching title dependencies", () => {
    expect(icons.sourceCatalogVersion).toBe(catalogs.skillCatalog.catalogVersion);
    const luxonSkills = catalogs.skills.filter((skill) => skill.name.endsWith(" (Luxon)"));
    expect(luxonSkills).toHaveLength(10);
    for (const luxon of luxonSkills) {
      const kurzick = catalogs.skills.find(
        (skill) => skill.name === luxon.name.replace(/\(Luxon\)$/, "(Kurzick)")
      );
      expect(kurzick).toBeDefined();
      const files = [luxon, kurzick!].map((skill) => {
        const faction = skill.name.endsWith(" (Luxon)") ? "luxon" : "kurzick";
        const series = catalogs.skillCatalog.progressionSeries.filter((candidate) =>
          skill.progressionSeriesIds.includes(candidate.id)
        );
        expect(
          series.some((candidate) => candidate.dependency.titleKey === `allegiance:${faction}`)
        ).toBe(true);
        const asset = catalogs.placeholders.skill(skill, "skill-browser").asset;
        expect(asset?.src).toContain(`-${faction}.jpg`);
        expect(asset?.width).toBe(64);
        expect(asset?.height).toBe(64);
        return readFileSync(resolve("public", asset!.src.replace(/^\//, "")));
      });
      expect(files[0]!.equals(files[1]!)).toBe(false);
    }
    for (const asset of Object.values(icons.assetsBySkillId)) {
      expect(asset.width).toBe(asset.height);
    }
  });

  it("preserves excluded IDs through template resolution and export", () => {
    const decoded = decodeSkillTemplate(SKILL_TEMPLATE_PACKAGE_EXAMPLE);
    if (!decoded.ok) throw new Error(decoded.error.message);
    const document: SkillTemplateDocument = {
      ...decoded.value,
      skillIds: [
        templateSkillId(3042),
        decoded.value.skillIds[1],
        decoded.value.skillIds[2],
        decoded.value.skillIds[3],
        decoded.value.skillIds[4],
        decoded.value.skillIds[5],
        decoded.value.skillIds[6],
        decoded.value.skillIds[7]
      ]
    };
    const encoded = exportSkillTemplate(document, { mode: "canonical" });
    if (!encoded.ok) throw new Error(encoded.error.message);
    const imported = decodeSkillTemplate(encoded.value.code);
    if (!imported.ok) throw new Error(imported.error.message);
    const resolved = resolveSkillTemplateDocument(
      imported.value,
      catalogs.professionAttributeCatalog,
      catalogs.skillCatalog
    );
    expect(resolved.ok).toBe(true);
    expect(imported.value.skillIds[0]).toBe(3042);
    const exported = exportSkillTemplate(imported.value);
    expect(exported.ok && exported.value.code).toBe(encoded.value.code);
  });

  it("shows exactly the requested version of each split skill in either mode", () => {
    const base = createBlankEditorState();
    for (const mode of ["pve", "pvp"] as const) {
      const state = editorReducer(
        { ...base, build: { ...base.build, mode } },
        { type: "set-browser-filters", filters: { professionScope: { kind: "all" } } }
      );
      const visible = new Set(
        selectSkillBrowser(state, catalogs).groups.flatMap((group) =>
          group.skills.map((skill) => Number(skill.id))
        )
      );
      expect(catalogs.skillCatalog.splitGroups.length).toBeGreaterThan(100);
      for (const group of catalogs.skillCatalog.splitGroups) {
        expect(group.members).toHaveLength(2);
        for (const member of group.members) {
          expect(visible.has(Number(member.skillId))).toBe(member.mode === mode);
        }
      }
      expect(visible.has(1247)).toBe(mode === "pve");
      expect(visible.has(3007)).toBe(mode === "pvp");
    }
  });

  it("does not count normal PvE split versions toward the three PvE-only skill limit", () => {
    const base = createBlankEditorState();
    const state = {
      ...base,
      build: {
        ...base.build,
        mode: "pve",
        primaryProfessionId: catalogId<"Profession">(8),
        skillBar: [
          catalogId<"Skill">(1247),
          catalogId<"Skill">(911),
          catalogId<"Skill">(871),
          catalogId<"Skill">(982),
          null,
          null,
          null,
          null
        ]
      }
    } satisfies EditorState;
    const issues = selectValidationView(state, catalogs).result.issues;
    expect(issues.some((issue) => issue.code === "skill.pve-only-limit")).toBe(false);
    expect(issues.some((issue) => issue.code === "skill.mode-metadata-conflict")).toBe(false);
  });
});
