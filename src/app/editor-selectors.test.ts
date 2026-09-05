import { describe, expect, it } from "vitest";

import { catalogId, type SkillBar } from "../domain";
import {
  requireTitleRankTestCatalogs,
  titleRankTestSkillIds
} from "../../test/fixtures/app/title-rank-catalogs";
import { requireReadyCatalogs } from "./catalogs";
import { playableEditorFixture } from "./editor-fixtures";
import {
  selectCatalogFreshnessView,
  selectAttributeBudgetPolicy,
  selectAttributeBudgetView,
  selectAttributeRows,
  selectSkillBrowser,
  selectSkillDisplay,
  selectTitleRankPanelView,
  selectValidationView
} from "./editor-selectors";
import {
  createBlankEditorState,
  createRawOverlayEntry,
  editorReducer,
  type EditorState
} from "./editor-state";

const catalogs = requireReadyCatalogs();
const titleRankCatalogs = requireTitleRankTestCatalogs();

describe("editor selectors", () => {
  it("uses the same PvE budget policy for display and validation input", () => {
    const state = playableEditorFixture();
    const validation = selectValidationView(state, catalogs);
    const budget = selectAttributeBudgetView(state, catalogs);

    expect(selectAttributeBudgetPolicy(state)).toEqual({
      kind: "level",
      level: 20,
      questBonus: "maximum-applicable"
    });
    expect(validation.input.options?.attributeBudget).toEqual(selectAttributeBudgetPolicy(state));
    expect(budget.budget).toBe(200);

    const pvp = editorReducer(state, { type: "set-mode", mode: "pvp" });
    expect(selectAttributeBudgetPolicy(pvp)).toEqual({
      kind: "level",
      level: 20,
      questBonus: "maximum-applicable"
    });
    expect(selectAttributeBudgetView(pvp, catalogs).budget).toBe(200);
  });

  it("retains authored and unresolved attribute rows beside normal selected rows", () => {
    const base = createBlankEditorState();
    const state: EditorState = {
      ...base,
      build: {
        ...base.build,
        primaryProfessionId: catalogId<"Profession">(1),
        secondaryProfessionId: catalogId<"Profession">(2),
        attributes: [
          { attributeId: catalogId<"Attribute">(17), rank: 9 },
          { attributeId: catalogId<"Attribute">(-100001), rank: 1 }
        ]
      },
      rawTemplate: {
        ...base.rawTemplate,
        attributes: [
          null,
          createRawOverlayEntry({
            namespace: "attribute",
            templateId: 26,
            catalogId: null,
            outcomeKind: "reserved",
            label: "Reserved attribute 26",
            reason: "Reserved template attribute gap."
          })
        ]
      }
    };
    const validation = selectValidationView(state, catalogs);
    const rows = selectAttributeRows(state, catalogs, validation.result);

    expect(rows.some((row) => row.label === "Strength")).toBe(true);
    expect(rows.some((row) => row.label === "Reserved attribute 26" && row.retained)).toBe(true);
    expect(
      validation.appDiagnostics.some((diagnostic) => diagnostic.message.includes("reserved"))
    ).toBe(true);
  });

  it("filters, sorts, groups, and returns all matching browser results deterministically", () => {
    const state = editorReducer(
      editorReducer(playableEditorFixture(), {
        type: "set-browser-filters",
        filters: { query: "shot", sortMode: "name" }
      }),
      { type: "set-browser-view", viewMode: "small-grid" }
    );
    const browser = selectSkillBrowser(state, catalogs);

    expect(browser.matchingCount).toBeGreaterThan(0);
    expect(browser.groups.flatMap((group) => group.skills)).toHaveLength(browser.matchingCount);
    expect(browser.groups[0]?.label).toBe("All skills");
    expect(browser.groups[0]?.skills[0]?.normalizedName).toContain("shot");
  });

  it("applies explicit attribute and resource filters without matching no-attribute skills", () => {
    const state = editorReducer(
      editorReducer(createBlankEditorState(), {
        type: "set-browser-filters",
        filters: {
          attributeId: catalogId<"Attribute">(0),
          professionScope: { kind: "all" }
        }
      }),
      {
        type: "set-resource-filter",
        resource: "energy",
        value: "number"
      }
    );
    const browser = selectSkillBrowser(state, catalogs);

    expect(
      browser.groups.flatMap((group) => group.skills).every((skill) => skill.attributeId !== null)
    ).toBe(true);
    expect(
      browser.groups
        .flatMap((group) => group.skills)
        .every((skill) => skill.costs.energy.state === "number")
    ).toBe(true);
  });

  it("filters skill types through the taxonomy while keeping exact Skill separate", () => {
    const base = createBlankEditorState();
    const attacks = selectSkillBrowser(
      editorReducer(base, {
        type: "set-browser-filters",
        filters: { professionScope: { kind: "all" }, skillType: "attack" }
      }),
      catalogs
    ).groups.flatMap((group) => group.skills);
    const exactSkills = selectSkillBrowser(
      editorReducer(base, {
        type: "set-browser-filters",
        filters: { professionScope: { kind: "all" }, skillType: "skill" }
      }),
      catalogs
    ).groups.flatMap((group) => group.skills);

    expect(attacks.some((skill) => skill.typeId === "axe-attack")).toBe(true);
    expect(attacks.every((skill) => skill.typeId.includes("attack"))).toBe(true);
    expect(exactSkills.length).toBeGreaterThan(0);
    expect(exactSkills.every((skill) => skill.typeId === "skill")).toBe(true);
  });

  it("uses default and authored title ranks for title-scaled skill display", () => {
    const state = playableEditorFixture();
    const view = selectSkillDisplay(
      titleRankCatalogs,
      state,
      titleRankTestSkillIds.lightbringer,
      "tooltip"
    );
    const lowered = selectSkillDisplay(
      titleRankCatalogs,
      {
        ...state,
        build: {
          ...state.build,
          titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }]
        }
      },
      titleRankTestSkillIds.lightbringer,
      "tooltip"
    );

    expect(view.kind).toBe("known");
    expect(view.kind === "known" ? view.assumptions.join(" ") : "").not.toContain("maximum");
    expect(view.kind === "known" ? view.facts : []).toContainEqual({
      label: "Title: Lightbringer",
      value: "rank 12 default",
      state: "title:lightbringer-rank",
      icon: "title"
    });
    expect(lowered.kind === "known" ? lowered.facts : []).toContainEqual({
      label: "Title: Lightbringer",
      value: "rank 4 configured",
      state: "title:lightbringer-rank",
      icon: "title"
    });
  });

  it("groups PvE title skills by title track while keeping profession-gated visibility", () => {
    const base = {
      ...createBlankEditorState(),
      build: {
        ...createBlankEditorState().build,
        mode: "pve",
        primaryProfessionId: catalogId<"Profession">(9),
        secondaryProfessionId: catalogId<"Profession">(1)
      }
    } satisfies EditorState;
    const titleTrackBrowser = selectSkillBrowser(
      editorReducer(base, {
        type: "set-browser-filters",
        filters: { query: "Lightbringer Signet", sortMode: "attribute" }
      }),
      titleRankCatalogs
    );
    const allegianceBrowser = selectSkillBrowser(
      editorReducer(base, {
        type: "set-browser-filters",
        filters: { query: "Allegiance Fixture", sortMode: "attribute" }
      }),
      titleRankCatalogs
    );

    expect(titleTrackBrowser.groups.map((group) => group.label)).toEqual(["Lightbringer"]);
    expect(allegianceBrowser.groups.map((group) => group.label)).toEqual(["Kurzick", "Luxon"]);
    expect(
      allegianceBrowser.groups.flatMap((group) => group.skills).map((skill) => skill.name)
    ).toEqual(["Kurzick Allegiance Fixture", "Luxon Allegiance Fixture"]);
  });

  it("shows profession-gated PvE-only sections for a Paragon/Warrior build", () => {
    const base = createBlankEditorState();
    const state = {
      ...base,
      build: {
        ...base.build,
        mode: "pve",
        primaryProfessionId: catalogId<"Profession">(9),
        secondaryProfessionId: catalogId<"Profession">(1)
      }
    } satisfies EditorState;
    const browser = selectSkillBrowser(state, catalogs);
    const visibleSkills = browser.groups.flatMap((group) => group.skills);
    const visibleNames = visibleSkills.map((skill) => skill.name);

    expect(visibleNames).toContain("Spear of Fury");
    expect(visibleNames).toContain('"Save Yourselves!"');
    expect(visibleNames).toContain("Whirlwind Attack");
    expect(visibleNames).toContain('"There\'s Nothing to Fear!"');
    expect(browser.groups.map((group) => group.label)).toEqual(
      expect.arrayContaining(["Kurzick", "Luxon", "Sunspear"])
    );
  });

  it("shows relevant title controls before all-title controls and retained stale overrides", () => {
    const state = {
      ...playableEditorFixture(),
      build: {
        ...playableEditorFixture().build,
        skillBar: [
          titleRankTestSkillIds.lightbringer,
          titleRankTestSkillIds.asura,
          null,
          null,
          null,
          null,
          null,
          null
        ] satisfies SkillBar,
        titleRankOverrides: [
          { key: "title:lightbringer-rank", rank: 4 },
          { key: "title:stale-rank", rank: 2 }
        ]
      }
    };
    const validation = selectValidationView(state, titleRankCatalogs);
    const panel = selectTitleRankPanelView(state, titleRankCatalogs, validation.result);

    expect(panel.relevantRows.map((row) => row.label)).toEqual(["Lightbringer", "Asura"]);
    expect(panel.relevantRows[0]).toMatchObject({
      key: "title:lightbringer-rank",
      value: 4,
      currentText: "Rank 4 configured",
      resettable: true
    });
    expect(panel.allRows.some((row) => row.key === "title:stale-rank" && row.resettable)).toBe(
      true
    );
  });

  it("separates catalog freshness from validity and resolution checks", () => {
    const current = {
      buildCatalogVersion: null,
      professionAttributeCatalogVersion: "pa-current",
      skillCatalogVersion: "skills-current",
      ruleEngineVersion: "rule-engine:v3"
    };

    expect(selectCatalogFreshnessView(current, current).status).toBe("fresh");
    expect(
      selectCatalogFreshnessView(
        {
          ...current,
          skillCatalogVersion: "skills-old"
        },
        current
      ).status
    ).toBe("stale");
    expect(
      selectCatalogFreshnessView(
        {
          ...current,
          skillCatalogVersion: null
        },
        current
      ).status
    ).toBe("unknown");

    const equipmentCurrent = {
      ...current,
      runeCatalogVersion: "runes-current",
      insigniaCatalogVersion: "insignias-current",
      weaponCatalogVersion: "weapons-current",
      weaponModifierCatalogVersion: "weapon-mods-current"
    };
    const equipmentOld = {
      ...equipmentCurrent,
      runeCatalogVersion: "runes-old"
    };
    expect(selectCatalogFreshnessView(equipmentOld, equipmentCurrent).status).toBe("fresh");
    expect(
      selectCatalogFreshnessView(equipmentOld, equipmentCurrent, { includeEquipment: true }).status
    ).toBe("stale");
  });
});
