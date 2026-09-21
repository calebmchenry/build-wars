import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";
import {
  catalogId,
  renderSkillTooltipText,
  type Build,
  type AssumedEffectPreference
} from "../domain";
import {
  adjustmentCatalogs as catalogs,
  elementalBuild
} from "../../test/fixtures/attribute-adjustment-builds";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";
import { selectSkillDisplay, selectValidationView } from "./editor-selectors";
import { selectAttributePreview } from "./attribute-preview-selectors";
import { FocusedAttributeEditor } from "./components/FocusedAttributeEditor";
import { createPersistedBuildSnapshot, hydrateEditorFromSnapshot } from "./persistence-schema";

function state(
  primary: number,
  secondary: number,
  skills: number[],
  attributes: [number, number][],
  effectPreferences: AssumedEffectPreference[] = []
): EditorState {
  return {
    ...createBlankEditorState(),
    build: elementalBuild({
      primaryProfessionId: catalogId<"Profession">(primary),
      secondaryProfessionId: catalogId<"Profession">(secondary),
      attributes: attributes.map(([id, rank]) => ({
        attributeId: catalogId<"Attribute">(id),
        rank
      })),
      skillBar: [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
        skills[i] === undefined ? null : catalogId<"Skill">(skills[i])
      ) as unknown as Build["skillBar"],
      attributeAdjustments: { headgearAttributeId: null, runes: [], effectPreferences }
    })
  };
}
function view(s: EditorState, name: string) {
  const skill = catalogs.skills.find((skill) => skill.name === name)!;
  const result = selectSkillDisplay(catalogs, s, skill.id, "tooltip");
  if (result.kind !== "known") throw Error("Expected a known skill");
  return result;
}
function Harness({ initial }: { readonly initial: EditorState }) {
  const [s, dispatch] = useReducer(editorReducer, initial);
  return (
    <>
      <FocusedAttributeEditor
        state={s}
        catalogs={catalogs}
        validation={selectValidationView(s, catalogs)}
        dispatch={dispatch}
      />
      <output aria-label="Fireball preview">{view(s, "Fireball").tooltipText}</output>
      <button onClick={() => dispatch({ type: "clear-skill-slot", slotIndex: 0 })}>
        Remove source
      </button>
    </>
  );
}

describe("skill-specific tooltip previews", () => {
  it("extends only verified linear progressions beyond rank 15", () => {
    const skill = catalogs.skills.find((s) => s.name === "Fireball")!;
    const high = { mode: "pve" as const, ranks: { "attribute:10": 20 } };
    const rendered = renderSkillTooltipText(catalogs.skillCatalog, skill.id, high);
    expect(rendered.kind === "rendered" ? rendered.text : null).toContain("147 fire damage");
    const custom = {
      ...catalogs.skillCatalog,
      progressionSeries: catalogs.skillCatalog.progressionSeries.map((series) =>
        series.skillId !== skill.id
          ? series
          : {
              ...series,
              values: series.values.map((row) => (row.rank === 7 ? { ...row, values: [999] } : row))
            }
      )
    };
    expect(renderSkillTooltipText(custom, skill.id, high).kind).toBe("unresolved");
  });
  it("uses boosted Illusion Magic for spells without changing their real attributes or inherent effects", () => {
    let s = state(
      5,
      6,
      [1346],
      [
        [1, 12],
        [0, 8]
      ]
    );
    const rune = catalogs.equipment.runes.find(
      (r) => Number(r.affectedAttributeId) === 1 && r.familyRank === "superior"
    )!;
    s = editorReducer(s, {
      type: "set-attribute-headgear",
      attributeId: catalogId<"Attribute">(1)
    });
    s = editorReducer(s, {
      type: "set-attribute-rune",
      attributeId: catalogId<"Attribute">(1),
      runeId: rune.id
    });
    const fireball = view(s, "Fireball");
    expect(fireball.tooltipState).toBe("rendered");
    expect(fireball.tooltipText).toContain("119 fire damage");
    expect(fireball.assumptions).toContain("Uses Illusion Magic 16 · Signet of Illusions.");
    const p = selectAttributePreview(s.build, catalogs);
    expect(p.ranks.get(catalogId<"Attribute">(10))?.effective).toBe(0);
    expect(p.ranks.get(catalogId<"Attribute">(0))?.effective).toBe(8);
    const off = editorReducer(s, {
      type: "set-assumed-effect",
      value: { effectId: "signet-of-illusions", preference: "off" }
    });
    expect(view(off, "Fireball").tooltipText).toContain("7 fire damage");
    expect(view(off, "Fireball").facts).toEqual(fireball.facts);
    for (const name of ["Conjure Phantasm", "Healing Signet", "Pain", "Vampiric Touch"])
      expect(view(s, name).tooltipText).toBe(view(off, name).tooltipText);
    expect(view(s, "Conjure Phantasm").assumptions).toEqual([]);
    expect(view(s, "Slippery Ground").tooltipText).toContain(
      "50% failure chance unless Water Magic greater than 4"
    );
  });

  it("substitutes a lower rank too, and uses title-skill attribute endpoints without editing titles", () => {
    const s = state(
      5,
      6,
      [1346],
      [
        [1, 3],
        [10, 12]
      ]
    );
    expect(view(s, "Fireball").tooltipText).toContain("28 fire damage");
    const titleSpell = view(s, "Pain Inverter");
    expect(titleSpell.tooltipState).toBe("rendered");
    expect(titleSpell.tooltipText).toContain("108%");
    expect(titleSpell.assumptions).toContain("Uses Illusion Magic 3 · Signet of Illusions.");
    expect(s.build.titleRankOverrides).toEqual([]);
  });

  it("lets Symbolic Celerity change Signet of Illusions charges while spells still use Illusion Magic", () => {
    const s = state(
      5,
      6,
      [1346, 1340],
      [
        [0, 12],
        [1, 3]
      ]
    );
    expect(view(s, "Signet of Illusions").tooltipText).toContain("next 3 non-Illusion");
    expect(view(s, "Fireball").tooltipText).toContain("28 fire damage");
    expect(view(s, "Healing Signet").tooltipText).toContain("154 Health");
    expect(view(s, "Healing Signet").assumptions).toContain(
      "Uses Fast Casting 12 · Symbolic Celerity."
    );
    expect(view(s, "Vampiric Touch").tooltipText).toContain("29 Health");
    expect(
      selectAttributePreview(s.build, catalogs).ranks.get(catalogId<"Attribute">(1))?.effective
    ).toBe(3);
  });

  it("applies Ritual Lord to Ritualist spells, rituals, and signets without altering inherent ranks", () => {
    const s = state(
      8,
      5,
      [1217],
      [
        [36, 12],
        [32, 12],
        [33, 12]
      ]
    );
    expect(view(s, "Pain").tooltipText).toContain("level 13 spirit");
    expect(view(s, "Spirit Light").tooltipText).toContain("188");
    expect(view(s, "Signet of Creation").assumptions).toContain(
      "Next skill: +4 to its attribute scaling · Ritual Lord."
    );
    expect(view(s, "Ritual Lord").assumptions).toEqual([]);
    expect(view(s, "Fireball").assumptions).toEqual([]);
    expect(
      selectAttributePreview(s.build, catalogs).ranks.get(catalogId<"Attribute">(36))?.effective
    ).toBe(12);
    const secondary = state(5, 8, [1217], [[0, 12]]);
    expect(view(secondary, "Signet of Creation").assumptions).toContain(
      "Next skill: +2 to its attribute scaling · Ritual Lord."
    );
  });

  it("updates tooltips when toggled, retains preferences through reload, and disables removed sources", () => {
    const initial = state(5, 6, [1346], [[1, 12]]);
    render(<Harness initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: "Assumed effects (1 active)" }));
    const toggle = screen.getByRole("checkbox", { name: "Signet of Illusions" });
    expect(toggle).toBeChecked();
    expect(screen.getByLabelText("Fireball preview")).toHaveTextContent("91 fire damage");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Fireball preview")).toHaveTextContent("7 fire damage");
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Remove source" }));
    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
    expect(screen.getByLabelText("Fireball preview")).toHaveTextContent("7 fire damage");
    const saved = editorReducer(initial, {
      type: "set-assumed-effect",
      value: { effectId: "signet-of-illusions", preference: "off" }
    });
    const restored = hydrateEditorFromSnapshot(createPersistedBuildSnapshot(saved));
    expect(view(restored, "Fireball").tooltipText).toContain("7 fire damage");
    expect(restored.build.attributeAdjustments?.effectPreferences).toEqual([
      { effectId: "signet-of-illusions", preference: "off" }
    ]);
  });

  it("shows Seven Weapons Stance grants without offering allocation controls for another profession", () => {
    render(<Harness initial={state(1, 6, [3426], [[17, 12]])} />);
    expect(
      screen.getByRole("button", { name: /Dagger Mastery: effective rank 12, base 0/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Increase Dagger Mastery" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase Axe Mastery" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove source" }));
    expect(
      screen.queryByRole("button", { name: /Dagger Mastery: effective rank/ })
    ).not.toBeInTheDocument();
  });

  it("switches competing glyph preferences and persists the selected glyph", () => {
    const s = state(6, 4, [198, 199], [[12, 12]]);
    const changed = editorReducer(s, {
      type: "set-assumed-effect",
      value: { effectId: "glyph-of-energy", preference: "on" }
    });
    const restored = hydrateEditorFromSnapshot(createPersistedBuildSnapshot(changed));
    const p = selectAttributePreview(restored.build, catalogs);
    expect(p.effects.find((e) => e.definition.id === "glyph-of-elemental-power")?.active).toBe(
      false
    );
    expect(p.effects.find((e) => e.definition.id === "glyph-of-energy")?.active).toBe(true);
    expect(p.activeEffectCount).toBe(1);
  });
});
