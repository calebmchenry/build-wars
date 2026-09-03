import { describe, expect, it } from "vitest";

import { catalogId, type SkillBar } from "../domain";
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
    expect(selectAttributeBudgetPolicy(pvp)).toEqual({ kind: "none" });
    expect(selectAttributeBudgetView(pvp, catalogs).mode).toBe("not-evaluated");
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

  it("filters, sorts, groups, and bounds browser results deterministically", () => {
    const state = editorReducer(
      editorReducer(playableEditorFixture(), {
        type: "set-browser-filters",
        filters: { query: "shot", sortMode: "name" }
      }),
      { type: "set-browser-view", viewMode: "small-grid" }
    );
    const browser = selectSkillBrowser(state, catalogs);

    expect(browser.matchingCount).toBeGreaterThan(0);
    expect(browser.renderedCount).toBeLessThanOrEqual(state.browser.batchSize);
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

  it("uses default and authored title ranks for title-scaled skill display", () => {
    const state = playableEditorFixture();
    const view = selectSkillDisplay(catalogs, state, catalogId<"Skill">(1815), "tooltip");
    const lowered = selectSkillDisplay(
      catalogs,
      {
        ...state,
        build: {
          ...state.build,
          titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }]
        }
      },
      catalogId<"Skill">(1815),
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

  it("shows relevant title controls before all-title controls and retained stale overrides", () => {
    const state = {
      ...playableEditorFixture(),
      build: {
        ...playableEditorFixture().build,
        skillBar: [
          catalogId<"Skill">(1815),
          catalogId<"Skill">(2224),
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
    const validation = selectValidationView(state, catalogs);
    const panel = selectTitleRankPanelView(state, catalogs, validation.result);

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
