import { fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";
import { catalogId } from "../domain";
import {
  elementalBuild,
  adjustmentCatalogs as catalogs
} from "../../test/fixtures/attribute-adjustment-builds";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";
import { selectValidationView } from "./editor-selectors";
import { FocusedAttributeEditor } from "./components/FocusedAttributeEditor";
import { selectShareTemplateExport } from "./template-workflow";
function Harness({
  initial = { ...createBlankEditorState(), build: elementalBuild() }
}: {
  readonly initial?: EditorState;
}) {
  const [state, dispatch] = useReducer(editorReducer, initial);
  const validation = selectValidationView(state, catalogs);
  const code = selectShareTemplateExport(validation.exportPolicy);
  return (
    <>
      <FocusedAttributeEditor
        state={state}
        catalogs={catalogs}
        validation={validation}
        dispatch={dispatch}
      />
      <output aria-label="Authored profile">
        {JSON.stringify(state.build.attributeAdjustments)}
      </output>
      <output aria-label="Base code">{JSON.stringify(code)}</output>
    </>
  );
}
describe("inline attribute choices", () => {
  it("selects one rune per row and one headgear globally without changing points or game code", () => {
    render(<Harness />);
    const code = screen.getByLabelText("Base code").textContent;
    const spend = screen.getByLabelText("Attribute point spend").textContent;
    const group = screen.getByRole("group", { name: "Fire Magic rune" });
    expect(within(group).getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("radio", { name: /Rune of Superior Fire Magic \+3/ })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: /Rune of Minor Fire Magic \+1/ }));
    expect(
      within(group)
        .getAllByRole("radio")
        .filter((r) => (r as HTMLInputElement).checked)
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole("radio", { name: "Air Magic headgear +1" }));
    expect(screen.getByRole("radio", { name: "Fire Magic headgear +1" })).not.toBeChecked();
    const heads = screen
      .getAllByRole("radio")
      .filter((r) => r.getAttribute("aria-label")?.includes("headgear"));
    expect(new Set(heads.map((r) => r.getAttribute("name"))).size).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Clear headgear" }));
    expect(heads.some((r) => (r as HTMLInputElement).checked)).toBe(false);
    expect(screen.getByLabelText("Base code").textContent).toBe(code);
    expect(screen.getByLabelText("Attribute point spend").textContent).toBe(spend);
  });
  it("keeps zero-base gear editable and removes overrides independently", () => {
    render(
      <Harness
        initial={{ ...createBlankEditorState(), build: elementalBuild({ attributes: [] }) }}
      />
    );
    fireEvent.click(screen.getByRole("radio", { name: /Rune of Superior Air Magic \+3/ }));
    expect(
      screen.getByRole("button", { name: /Air Magic: effective rank 3, base 0/ })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use equipped rune for Air Magic" }));
    expect(screen.getByRole("radio", { name: "Air Magic rune None" })).toBeChecked();
    expect(screen.getByLabelText("Attribute point spend")).toHaveTextContent("0/200");
  });
  it("omits secondary equipment groups and exposes orphaned retained selections", () => {
    render(
      <Harness
        initial={{
          ...createBlankEditorState(),
          build: elementalBuild({
            attributeAdjustments: {
              headgearOverride: { kind: "attribute", attributeId: catalogId<"Attribute">(999) },
              runeOverrides: [
                { attributeId: catalogId<"Attribute">(888), runeId: catalogId<"Rune">(9999) }
              ],
              effectPreferences: []
            }
          })
        }}
      />
    );
    expect(screen.queryByRole("group", { name: "Death Magic rune" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove retained headgear" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove retained rune for attribute 888" }));
    expect(screen.queryByLabelText("Unresolved attribute adjustments")).not.toBeInTheDocument();
  });
  it("keeps numeric controls usable after image errors and supports attribute zero", () => {
    const { container } = render(
      <Harness
        initial={{
          ...createBlankEditorState(),
          build: elementalBuild({
            primaryProfessionId: catalogId<"Profession">(5),
            attributes: [],
            attributeAdjustments: null
          })
        }}
      />
    );
    container.querySelectorAll(".rune-icon").forEach((img) => fireEvent.error(img));
    const rune = screen.getByRole("radio", { name: /Rune of Superior Fast Casting \+3/ });
    fireEvent.click(rune);
    expect(rune).toBeChecked();
    expect(
      screen.getByRole("button", { name: /Fast Casting: effective rank 3, base 0/ })
    ).toBeInTheDocument();
  });
});
