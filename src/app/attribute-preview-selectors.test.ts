import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogId, renderSkillTooltipText, validateBuild } from "../domain";
import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import {
  adjustmentCatalogs as catalogs,
  elementalBuild
} from "../../test/fixtures/attribute-adjustment-builds";
import * as previewSelectors from "./attribute-preview-selectors";
import { createBlankEditorState } from "./editor-state";
import { selectSkillDisplay, selectValidationView } from "./editor-selectors";
import { importSkillTemplateToEditor } from "./template-workflow";
import { App } from "./App";
import { SkillBrowser } from "./components/SkillBrowser";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});
describe("shared preview consumers", () => {
  it("drives linked descriptions and inherent energy calculations from the same context", () => {
    const state = {
      ...createBlankEditorState(),
      build: elementalBuild({
        primaryProfessionId: catalogId<"Profession">(2),
        secondaryProfessionId: catalogId<"Profession">(4),
        attributes: [{ attributeId: catalogId<"Attribute">(23), rank: 12 }],
        attributeAdjustments: {
          headgearOverride: null,
          runeOverrides: [],
          effectPreferences: [{ effectId: "heroic-refrain", preference: "on", strength: 4 }]
        }
      })
    };
    const skill = catalogs.skills.find((s) => s.name === "Vampiric Touch")!;
    const context = previewSelectors.selectAttributePreview(state.build, catalogs);
    const view = selectSkillDisplay(catalogs, state, skill.id, "tooltip", null, context);
    expect(view.kind).toBe("known");
    if (view.kind !== "known") return;
    expect(view.facts.find((f) => f.icon === "energy")?.attributeEffect?.rank).toBe(16);
    const expected = renderSkillTooltipText(catalogs.skillCatalog, skill.id, {
      mode: "pve",
      ranks: { "attribute:4": 4 }
    });
    expect(view.tooltipText).toBe(expected.kind === "rendered" ? expected.text : null);
    expect(skill.costs.energy.value).toBe(15);
  });
  it("omits unresolved ranks instead of fabricating zero and leaves title dependencies independent", () => {
    const base = createBlankEditorState();
    const state = {
      ...base,
      build: elementalBuild({
        attributeAdjustments: {
          headgearOverride: null,
          runeOverrides: [
            { attributeId: catalogId<"Attribute">(10), runeId: catalogId<"Rune">(99999) }
          ],
          effectPreferences: []
        }
      })
    };
    const skill = catalogs.skills.find((s) => s.name === "Fireball")!;
    const view = selectSkillDisplay(catalogs, state, skill.id, "tooltip");
    expect(view.kind === "known" ? view.tooltipState : null).toBe("unresolved");
    const lord = selectSkillDisplay(catalogs, state, catalogId<"Skill">(1951), "tooltip");
    expect(lord.kind === "known" ? lord.tooltipState : null).toBe("rendered");
    const zero = selectSkillDisplay(catalogs, base, skill.id, "tooltip");
    expect(zero.kind === "known" ? zero.tooltipState : null).toBe("rendered");
  });
  it("keeps exact source and permanent equipment validation independent from previews", () => {
    const imported = importSkillTemplateToEditor(
      SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      createBlankEditorState(),
      catalogs
    );
    if (!imported.ok) throw Error(imported.error.message);
    const before = imported.state;
    const after = {
      ...before,
      build: { ...before.build, attributeAdjustments: elementalBuild().attributeAdjustments }
    };
    expect(selectValidationView(after, catalogs).exportPolicy).toEqual(
      selectValidationView(before, catalogs).exportPolicy
    );
    const validation = (state: typeof after) =>
      validateBuild({
        build: state.build,
        professionAttributes: catalogs.validation.professionAttributes,
        skills: catalogs.validation.skills,
        equipmentCatalogs: catalogs.equipment.validation
      });
    expect(validation(after)).toEqual(validation(before));
  });
  it("computes once for mounted consumers, reuses across filters, and invalidates for Build changes", () => {
    localStorage.clear();
    const spy = vi.spyOn(previewSelectors, "selectAttributePreview");
    render(createElement(App));
    expect(spy).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "Fireball" } });
    expect(spy).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("checkbox", { name: "PvP" }));
    expect(spy).toHaveBeenCalledTimes(2);
  });
  it("computes once per alternate browser owner rather than per visible skill", () => {
    const state = createBlankEditorState();
    const spy = vi.spyOn(previewSelectors, "selectAttributePreview");
    const { rerender } = render(
      createElement(SkillBrowser, { state, catalogs, dispatch: () => undefined })
    );
    expect(spy).toHaveBeenCalledTimes(1);
    rerender(
      createElement(SkillBrowser, {
        state: {
          ...state,
          browser: { ...state.browser, filters: { ...state.browser.filters, query: "fire" } }
        },
        catalogs,
        dispatch: () => undefined
      })
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
