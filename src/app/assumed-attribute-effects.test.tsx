import { fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";
import { ASSUMED_ATTRIBUTE_EFFECTS, catalogId } from "../domain";
import {
  elementalBuild,
  adjustmentCatalogs as catalogs
} from "../../test/fixtures/attribute-adjustment-builds";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";
import { FocusedAttributeEditor } from "./components/FocusedAttributeEditor";
import { selectValidationView } from "./editor-selectors";
import { fingerprintPersistedSnapshot, createPersistedBuildSnapshot } from "./persistence-schema";
function Harness({ initial }: { readonly initial?: EditorState }) {
  const [state, dispatch] = useReducer(
    editorReducer,
    initial ?? {
      ...createBlankEditorState(),
      build: elementalBuild({
        skillBar: [
          catalogId<"Skill">(198),
          catalogId<"Skill">(1951),
          null,
          null,
          null,
          null,
          null,
          null
        ]
      })
    }
  );
  return (
    <>
      <FocusedAttributeEditor
        state={state}
        catalogs={catalogs}
        validation={selectValidationView(state, catalogs)}
        dispatch={dispatch}
      />
      <output aria-label="Fingerprint">
        {fingerprintPersistedSnapshot(createPersistedBuildSnapshot(state))}
      </output>
      <output aria-label="Profile">{JSON.stringify(state.build.attributeAdjustments)}</output>
      <button onClick={() => dispatch({ type: "clear-skill-slot", slotIndex: 0 })}>
        Remove Glyph
      </button>
      <button
        onClick={() =>
          dispatch({ type: "place-skill", slotIndex: 0, skillId: catalogId<"Skill">(198) })
        }
      >
        Add Glyph
      </button>
      <button
        onClick={() =>
          dispatch({ type: "place-skill", slotIndex: 1, skillId: catalogId<"Skill">(2094) })
        }
      >
        Kurzick Lord
      </button>
      <button
        onClick={() =>
          dispatch({ type: "set-mode", mode: state.build.mode === "pvp" ? "pve" : "pvp" })
        }
      >
        Change mode
      </button>
      <button
        onClick={() =>
          dispatch({
            type: "set-profession",
            field: "primary",
            professionId: catalogId<"Profession">(1)
          })
        }
      >
        Warrior primary
      </button>
    </>
  );
}
function open() {
  fireEvent.click(screen.getByRole("button", { name: /Assumed effects/ }));
}
function check(name: string) {
  return screen.getByRole("checkbox", { name });
}
describe("assumed effects controls", () => {
  it("shows every supported boost with unavailable self effects disabled", () => {
    render(<Harness initial={{ ...createBlankEditorState(), build: elementalBuild() }} />);
    const before = screen.getByLabelText("Fingerprint").textContent;
    open();
    expect(screen.getAllByRole("checkbox")).toHaveLength(17);
    for (const effect of ASSUMED_ATTRIBUTE_EFFECTS.filter((e) => !e.external)) {
      expect(check(effect.label)).toBeDisabled();
      expect(check(effect.label)).not.toBeChecked();
    }
    for (const name of ["Glyph of Elemental Power", "Elemental Lord", "Masochism"]) {
      expect(check(name)).toBeDisabled();
      expect(check(name)).not.toBeChecked();
      expect(check(name)).toHaveAccessibleDescription(/Required legal skill is absent/);
    }
    expect(check("Heroic Refrain")).toBeEnabled();
    expect(screen.getByRole("combobox", { name: "Heroic Refrain strength" })).toBeEnabled();
    expect(screen.getByLabelText("Fingerprint").textContent).toBe(before);
    fireEvent.click(check("Heroic Refrain"));
    expect(screen.getByRole("button", { name: "Assumed effects (1 active)" })).toBeInTheDocument();
  });
  it("keeps automatic boosts visible and updates availability as skills leave and return", () => {
    render(<Harness />);
    open();
    fireEvent.click(screen.getByRole("button", { name: "Remove Glyph" }));
    expect(check("Glyph of Elemental Power")).toBeDisabled();
    expect(check("Glyph of Elemental Power")).not.toBeChecked();
    expect(check("Glyph of Elemental Power")).toHaveAccessibleDescription(
      /Required legal skill is absent/
    );
    expect(screen.getByRole("button", { name: "Assumed effects (1 active)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Glyph" }));
    expect(check("Glyph of Elemental Power")).toBeEnabled();
    expect(check("Glyph of Elemental Power")).toBeChecked();
    expect(screen.getByRole("button", { name: "Assumed effects (2 active)" })).toBeInTheDocument();
  });
  it("uses independent automatic preferences and shared counts without authoring disclosure state", () => {
    render(<Harness />);
    const before = screen.getByLabelText("Fingerprint").textContent;
    expect(screen.getByRole("button", { name: "Assumed effects (2 active)" })).toBeInTheDocument();
    open();
    expect(screen.getByLabelText("Fingerprint").textContent).toBe(before);
    expect(check("Glyph of Elemental Power")).toBeChecked();
    expect(check("Elemental Lord")).toBeChecked();
    fireEvent.click(check("Glyph of Elemental Power"));
    expect(check("Elemental Lord")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Kurzick Lord" }));
    expect(check("Elemental Lord")).toBeChecked();
    expect(screen.getByRole("button", { name: "Assumed effects (1 active)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Collapse attributes" }));
    expect(screen.getByRole("heading", { name: /1 assumed effects active/ })).toBeInTheDocument();
  });
  it("disables an absent boost while retaining its preference for re-addition", () => {
    render(<Harness />);
    open();
    fireEvent.click(check("Glyph of Elemental Power"));
    fireEvent.click(check("Glyph of Elemental Power"));
    fireEvent.click(screen.getByRole("button", { name: "Remove Glyph" }));
    expect(check("Glyph of Elemental Power")).toBeChecked();
    expect(check("Glyph of Elemental Power")).toBeDisabled();
    expect(check("Glyph of Elemental Power")).toHaveAccessibleDescription(
      /Required legal skill is absent/
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Glyph" }));
    expect(check("Glyph of Elemental Power")).toBeEnabled();
    expect(check("Glyph of Elemental Power")).toBeChecked();
    fireEvent.click(check("Glyph of Elemental Power"));
    fireEvent.click(screen.getByRole("button", { name: "Remove Glyph" }));
    expect(check("Glyph of Elemental Power")).toBeDisabled();
    expect(check("Glyph of Elemental Power")).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Add Glyph" }));
    expect(check("Glyph of Elemental Power")).toBeEnabled();
    expect(check("Glyph of Elemental Power")).not.toBeChecked();
  });
  it("gates remembered preferences by mode and profession while preserving them", () => {
    render(<Harness />);
    open();
    fireEvent.click(check("Elemental Lord"));
    fireEvent.click(check("Elemental Lord"));
    fireEvent.click(screen.getByRole("button", { name: "Change mode" }));
    expect(check("Elemental Lord")).toBeChecked();
    expect(check("Elemental Lord")).toBeDisabled();
    expect(check("Glyph of Elemental Power")).toBeEnabled();
    expect(check("Heroic Refrain")).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Heroic Refrain strength" })).toBeDisabled();
    expect(check("Elemental Lord")).toHaveAccessibleDescription(
      /Unavailable in the current game mode/
    );
    expect(screen.getByRole("button", { name: "Assumed effects (1 active)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change mode" }));
    expect(check("Elemental Lord")).toBeEnabled();
    expect(check("Heroic Refrain")).toBeEnabled();
    expect(screen.getByRole("combobox", { name: "Heroic Refrain strength" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Assumed effects (2 active)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Warrior primary" }));
    expect(screen.getByRole("button", { name: "Assumed effects (0 active)" })).toBeInTheDocument();
    expect(check("Elemental Lord")).toBeChecked();
    expect(check("Elemental Lord")).toBeDisabled();
    expect(check("Glyph of Elemental Power")).toBeDisabled();
    expect(check("Elemental Lord")).toHaveAccessibleDescription(/No eligible attributes/);
    expect(check("Heroic Refrain")).toBeEnabled();
  });
  it("keeps external strength independent, retained while off, and counts a cap-clipped contribution", () => {
    render(<Harness />);
    open();
    expect(check("Heroic Refrain")).not.toBeChecked();
    expect(check("Heroic Refrain")).toBeEnabled();
    const strength = screen.getByRole("combobox", { name: "Heroic Refrain strength" });
    expect(strength).toHaveValue("4");
    fireEvent.click(check("Heroic Refrain"));
    expect(screen.getByRole("button", { name: "Assumed effects (3 active)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Fire Magic: effective rank 20/ }));
    expect(
      within(screen.getByRole("dialog", { name: "Fire Magic rank breakdown" })).getByText(
        /Uncapped total: 23/
      )
    ).toBeInTheDocument();
    fireEvent.click(check("Heroic Refrain"));
    expect(strength).toHaveValue("4");
    fireEvent.change(strength, { target: { value: "2" } });
    expect(check("Heroic Refrain")).not.toBeChecked();
    fireEvent.click(check("Heroic Refrain"));
    expect(strength).toHaveValue("2");
  });
  it("shows no active count when an external request has no eligible targets", () => {
    const blank = createBlankEditorState();
    const initial: EditorState = {
      ...blank,
      build: {
        ...blank.build,
        primaryProfessionId: catalogId<"Profession">(999),
        attributeAdjustments: {
          headgearAttributeId: null,
          runes: [],
          effectPreferences: [{ effectId: "heroic-refrain", preference: "on", strength: 4 }]
        }
      }
    };
    render(<Harness initial={initial} />);
    open();
    expect(check("Heroic Refrain")).toBeChecked();
    expect(check("Heroic Refrain")).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Heroic Refrain strength" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Assumed effects (0 active)" })).toBeInTheDocument();
    expect(check("Heroic Refrain")).toHaveAccessibleDescription(/No eligible attributes/);
  });
});
