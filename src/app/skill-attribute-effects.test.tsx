import { fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";
import { catalogId, createEmptyEquipmentLoadout, knownEquipmentSelection } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { FocusedAttributeEditor } from "./components/FocusedAttributeEditor";
import { SkillBar } from "./components/SkillBar";
import { SkillDisplay } from "./components/SkillDisplay";
import { SkillTooltip, SkillTooltipTrigger } from "./components/SkillTooltip";
import { selectSkillDisplay, selectValidationView } from "./editor-selectors";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("attribute-adjusted skill display", () => {
  it("resolves the primary rank independently from the skill's linked attribute", () => {
    const view = skillView(attributeState(2, 23, 12), "Vampiric Touch");
    expect(view.facts.find((fact) => fact.icon === "energy")).toMatchObject({
      value: "8",
      attributeEffect: { baseValue: 15, attribute: "expertise", rank: 12 }
    });
    expect(view.skill.costs.energy.value).toBe(15);
    expect(view.facts.find((fact) => fact.icon === "activation")?.value).toBe("3/4");
  });

  it("includes headgear and runes and excludes retained secondary primary ranks", () => {
    const state = attributeState(2, 23, 11);
    const empty = createEmptyEquipmentLoadout();
    const equipped: EditorState = {
      ...state,
      build: {
        ...state.build,
        equipment: {
          ...empty,
          armor: empty.armor.map((piece) =>
            piece.slot === "head"
              ? {
                  ...piece,
                  headgearAttribute: knownEquipmentSelection(catalogId<"Attribute">(23)),
                  rune: knownEquipmentSelection(catalogId<"Rune">(45))
                }
              : piece
          )
        }
      }
    };
    expect(
      skillView(equipped, "Distracting Shot").facts.find((fact) => fact.icon === "energy")
    ).toMatchObject({ value: "2", attributeEffect: { rank: 13 } });
    const secondary: EditorState = {
      ...equipped,
      build: {
        ...equipped.build,
        primaryProfessionId: catalogId<"Profession">(4),
        secondaryProfessionId: catalogId<"Profession">(2)
      }
    };
    expect(
      skillView(secondary, "Distracting Shot").facts.find((fact) => fact.icon === "energy")
    ).toMatchObject({ value: "5" });
    expect(
      skillView(secondary, "Distracting Shot").facts.every(
        (fact) => fact.attributeEffect === undefined
      )
    ).toBe(true);
  });

  it("applies Mysticism to flash enchantments without inventing an activation time", () => {
    const view = skillView(attributeState(10, 44, 12), "Whirling Charge");
    expect(view.facts.find((fact) => fact.icon === "energy")).toMatchObject({
      value: "3",
      attributeEffect: { attribute: "mysticism" }
    });
    expect(view.facts.find((fact) => fact.icon === "activation")).toBeUndefined();
  });

  it("uses the selected mode's base timings and only applies recharge reduction in PvE", () => {
    const pve = attributeState(5, 0, 12);
    const pvp: EditorState = { ...pve, build: { ...pve.build, mode: "pvp" } };
    const pveView = skillView(pve, "Accumulated Pain (PvP)");
    const pvpView = skillView(pvp, "Accumulated Pain");
    expect(pveView.title).toBe("Accumulated Pain");
    expect(pveView.facts.find((fact) => fact.icon === "recharge")).toMatchObject({
      value: "8",
      attributeEffect: { baseValue: 12 }
    });
    expect(pvpView.title).toBe("Accumulated Pain (PvP)");
    expect(pvpView.facts.find((fact) => fact.icon === "recharge")).toMatchObject({ value: "15" });
    expect(pvpView.facts.find((fact) => fact.icon === "recharge")?.attributeEffect).toBeUndefined();
    expect(pvpView.facts.find((fact) => fact.icon === "activation")?.attributeEffect).toBeDefined();
  });

  it("keeps base values and explains unresolved ranks", () => {
    const state = attributeState(2, 23, 12);
    const invalid: EditorState = {
      ...state,
      build: { ...state.build, attributes: [...state.build.attributes, ...state.build.attributes] }
    };
    const view = skillView(invalid, "Distracting Shot");
    expect(view.facts.find((fact) => fact.icon === "energy")).toMatchObject({
      value: "5",
      effectNote: "Base value; attribute rank is unresolved."
    });
    render(<SkillTooltip view={view} onClose={() => undefined} />);
    expect(
      screen.getByText("Energy: Base value; attribute rank is unresolved.")
    ).toBeInTheDocument();
    expect(document.querySelector(".skill-fact-modified")).toBeNull();
  });

  it("marks only changed numbers and explains adjustments on hover and keyboard focus", () => {
    const view = skillView(attributeState(2, 23, 12), "Vampiric Touch");
    render(
      <SkillTooltipTrigger
        view={view}
        placement="left"
        role="button"
        tabIndex={0}
        aria-label="Inspect Vampiric Touch"
      >
        <SkillDisplay view={view} compact />
      </SkillTooltipTrigger>
    );
    expect(document.querySelectorAll(".skill-fact-modified")).toHaveLength(1);
    expect(
      screen.getByLabelText(/Cost: Energy 8\. Energy: 15 → 8 · Expertise 12/)
    ).toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Inspect Vampiric Touch" });
    fireEvent.mouseEnter(trigger);
    let tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(tooltip.querySelector(".gw-skill-tooltip-facts .skill-fact-modified")).toHaveTextContent(
      "8"
    );
    expect(within(tooltip).getByText("Energy: 15 → 8 · Expertise 12")).toBeInTheDocument();
    fireEvent.mouseLeave(trigger);
    fireEvent.focus(trigger);
    tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
    expect(tooltip).toHaveTextContent("Energy: 15 → 8 · Expertise 12");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  });

  it("opens on touch without consuming the skill action and dismisses on outside touch", () => {
    const view = skillView(attributeState(5, 0, 12), "Energy Surge");
    let actions = 0;
    render(
      <SkillTooltipTrigger view={view} placement="above">
        <button onClick={() => actions++}>Inspect Energy Surge</button>
      </SkillTooltipTrigger>
    );
    const button = screen.getByRole("button", { name: "Inspect Energy Surge" });
    const touch = new Event("pointerdown", { bubbles: true });
    Object.defineProperty(touch, "pointerType", { value: "touch" });
    fireEvent(button, touch);
    fireEvent.click(button);
    expect(actions).toBe(1);
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
      "Recharge: 15s → 10s · Fast Casting 12 · PvE"
    );
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  });

  it("updates adjusted numbers and their explanations while editing an attribute", () => {
    render(<AttributeEffectsHarness />);
    const effect = () =>
      document.querySelector(".skill-display [data-skill-attribute='expertise']");
    expect(effect()).toHaveTextContent("4");
    const increment = screen.getByRole("button", { name: "Increase Expertise" });
    fireEvent.focus(increment);
    expect(increment.closest("[data-attribute-id]")).toHaveAttribute("data-attribute-id", "23");
    fireEvent.click(increment);
    expect(effect()).toHaveTextContent("3");
    const slot = screen.getByRole("button", { name: "Skill slot 1: Distracting Shot" });
    expect(slot.closest("[data-skill-attributes]")).toHaveAttribute(
      "data-skill-attributes",
      "expertise"
    );
    fireEvent.focus(slot);
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
      "Energy: 5 → 3 · Expertise 8"
    );
  });

  it("does not mark or explain a discount that rounds to the base cost", () => {
    const view = skillView(attributeState(2, 23, 2), "Distracting Shot");
    render(<SkillTooltip view={view} onClose={() => undefined} />);
    expect(document.querySelector(".skill-fact-modified")).toBeNull();
    expect(screen.queryByLabelText("Attribute effects")).toBeNull();
  });
});

function attributeState(profession: number, attribute: number, rank: number): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    build: {
      ...state.build,
      mode: "pve",
      primaryProfessionId: catalogId<"Profession">(profession),
      secondaryProfessionId: catalogId<"Profession">(4),
      attributes: [{ attributeId: catalogId<"Attribute">(attribute), rank }]
    }
  };
}

function skillView(state: EditorState, name: string) {
  const skill = catalogs.skills.find((entry) => entry.name === name);
  if (skill === undefined) throw new Error(`Missing fixture ${name}`);
  const view = selectSkillDisplay(catalogs, state, skill.id, "tooltip");
  if (view.kind !== "known") throw new Error(`Unresolved fixture ${name}`);
  return view;
}

function AttributeEffectsHarness() {
  const initial = attributeState(2, 23, 7);
  const [state, dispatch] = useReducer(editorReducer, {
    ...initial,
    build: {
      ...initial.build,
      skillBar: [catalogId<"Skill">(399), null, null, null, null, null, null, null]
    }
  });
  const view = skillView(state, "Distracting Shot");
  return (
    <div className="composer-layout">
      <FocusedAttributeEditor
        state={state}
        catalogs={catalogs}
        validation={selectValidationView(state, catalogs)}
        dispatch={dispatch}
      />
      <SkillDisplay view={view} compact />
      <SkillBar state={state} catalogs={catalogs} dispatch={dispatch} />
    </div>
  );
}
