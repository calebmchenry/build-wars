import { describe, expect, it } from "vitest";

import {
  catalogId,
  createSkillMetadataIndex,
  SKILL_METADATA_OVERLAY_KIND,
  SKILL_METADATA_OVERLAY_SCHEMA_VERSION,
  type SkillBar,
  type SkillMetadataToken
} from "../domain";
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

  it("filters skill browser results by full skill text phrase", () => {
    const state = editorReducer(createBlankEditorState(), {
      type: "set-browser-filters",
      filters: {
        professionScope: { kind: "all" },
        textQuery: "nearby dead Boss",
        sortMode: "name"
      }
    });
    const skills = selectSkillBrowser(state, catalogs).groups.flatMap((group) => group.skills);

    expect(skills.map((skill) => skill.name)).toEqual(["Signet of Capture"]);

    const reorderedWords = editorReducer(createBlankEditorState(), {
      type: "set-browser-filters",
      filters: {
        professionScope: { kind: "all" },
        textQuery: "nearby Boss dead"
      }
    });

    expect(selectSkillBrowser(reorderedWords, catalogs).matchingCount).toBe(0);
  });

  it("resolves default skill mode filtering from the build mode", () => {
    const base = editorReducer(createBlankEditorState(), {
      type: "set-browser-filters",
      filters: { professionScope: { kind: "all" } }
    });
    const pveSkills = selectSkillBrowser(base, catalogs).groups.flatMap((group) => group.skills);
    const pvpState = editorReducer(base, { type: "set-mode", mode: "pvp" });
    const pvpSkills = selectSkillBrowser(pvpState, catalogs).groups.flatMap(
      (group) => group.skills
    );

    expect(pveSkills.some((skill) => skill.classification.modeAvailability === "pve-only")).toBe(
      true
    );
    expect(pveSkills.every((skill) => skill.classification.modeAvailability !== "pvp-only")).toBe(
      true
    );
    expect(pvpSkills.some((skill) => skill.classification.modeAvailability === "pvp-only")).toBe(
      true
    );
    expect(pvpSkills.every((skill) => skill.classification.modeAvailability !== "pve-only")).toBe(
      true
    );

    const explicitPveFilter = editorReducer(pvpState, {
      type: "set-browser-filters",
      filters: { availability: "pve" }
    });
    const explicitPveSkills = selectSkillBrowser(explicitPveFilter, catalogs).groups.flatMap(
      (group) => group.skills
    );

    expect(explicitPveFilter.build.mode).toBe("pvp");
    expect(explicitPveFilter.browser.filters.availability).toBe("pve");
    expect(
      explicitPveSkills.every((skill) => skill.classification.modeAvailability !== "pvp-only")
    ).toBe(true);
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

  it("matches any selected cost within the resource filter group", () => {
    const state = editorReducer(
      editorReducer(
        editorReducer(createBlankEditorState(), {
          type: "set-browser-filters",
          filters: { professionScope: { kind: "all" } }
        }),
        {
          type: "set-resource-filter",
          resource: "energy",
          value: "explicit"
        }
      ),
      {
        type: "set-resource-filter",
        resource: "adrenaline",
        value: "explicit"
      }
    );
    const skills = selectSkillBrowser(state, catalogs).groups.flatMap((group) => group.skills);
    const hasExplicitCost = (state: string) =>
      state === "zero" || state === "number" || state === "percentage" || state === "special";

    expect(skills.length).toBeGreaterThan(0);
    expect(
      skills.every(
        (skill) =>
          hasExplicitCost(skill.costs.energy.state) || hasExplicitCost(skill.costs.adrenaline.state)
      )
    ).toBe(true);
    expect(
      skills.some(
        (skill) =>
          hasExplicitCost(skill.costs.energy.state) &&
          !hasExplicitCost(skill.costs.adrenaline.state)
      )
    ).toBe(true);
    expect(
      skills.some(
        (skill) =>
          hasExplicitCost(skill.costs.adrenaline.state) &&
          !hasExplicitCost(skill.costs.energy.state)
      )
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

  it("filters skill browser results by authored metadata", () => {
    const catalogsWithMetadata = {
      ...catalogs,
      skillMetadata: createSkillMetadataIndex(
        skillMetadataOverlay([
          ["Immolate", ["applies:burning", "deals:fire"]],
          ["Inspired Hex", ["removes:hex"]]
        ]),
        catalogs.skills
      )
    };
    const state = editorReducer(createBlankEditorState(), {
      type: "set-browser-filters",
      filters: {
        professionScope: { kind: "all" },
        metadata: ["applies:burning", "deals:fire"]
      }
    });
    const skills = selectSkillBrowser(state, catalogsWithMetadata).groups.flatMap(
      (group) => group.skills
    );

    expect(skills.map((skill) => skill.name)).toContain("Immolate");
    expect(skills).toHaveLength(1);

    const removesHex = selectSkillBrowser(
      editorReducer(createBlankEditorState(), {
        type: "set-browser-filters",
        filters: {
          professionScope: { kind: "all" },
          metadata: ["removes:hex"]
        }
      }),
      catalogsWithMetadata
    ).groups.flatMap((group) => group.skills);

    expect(removesHex.map((skill) => skill.name)).toContain("Inspired Hex");
  });

  it("matches any metadata option within a group and requires selected groups", () => {
    const catalogsWithMetadata = {
      ...catalogs,
      skillMetadata: createSkillMetadataIndex(
        skillMetadataOverlay([
          ["Body Blow", ["applies:deep_wound", "deals:damage"]],
          ["Immolate", ["applies:burning", "deals:fire"]],
          ["Inspired Hex", ["removes:hex"]]
        ]),
        catalogs.skills
      )
    };
    const inflicted = selectSkillBrowser(
      editorReducer(createBlankEditorState(), {
        type: "set-browser-filters",
        filters: {
          professionScope: { kind: "all" },
          metadata: ["applies:burning", "applies:deep_wound"]
        }
      }),
      catalogsWithMetadata
    ).groups.flatMap((group) => group.skills);
    const burningFire = selectSkillBrowser(
      editorReducer(createBlankEditorState(), {
        type: "set-browser-filters",
        filters: {
          professionScope: { kind: "all" },
          metadata: ["applies:burning", "applies:deep_wound", "deals:fire"]
        }
      }),
      catalogsWithMetadata
    ).groups.flatMap((group) => group.skills);

    expect(inflicted.map((skill) => skill.name)).toEqual(
      expect.arrayContaining(["Body Blow", "Immolate"])
    );
    expect(inflicted.map((skill) => skill.name)).not.toContain("Inspired Hex");
    expect(burningFire.map((skill) => skill.name)).toContain("Immolate");
    expect(burningFire.map((skill) => skill.name)).not.toContain("Body Blow");
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

function skillMetadataOverlay(
  records: readonly (readonly [string, readonly SkillMetadataToken[]])[]
): unknown {
  return {
    schemaVersion: SKILL_METADATA_OVERLAY_SCHEMA_VERSION,
    kind: SKILL_METADATA_OVERLAY_KIND,
    records: records.map(([name, metadata]) => {
      const skill = catalogs.skills.find((candidate) => candidate.name === name);
      if (skill === undefined) {
        throw new Error(`Missing skill fixture: ${name}`);
      }
      return {
        skillId: skill.id,
        name: skill.name,
        sourceTextDigest: skill.description.sourceTextDigest,
        metadata
      };
    })
  };
}
