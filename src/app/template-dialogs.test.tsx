import { fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";
import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import { requireReadyCatalogs } from "./catalogs";
import { TemplateControls } from "./components/TemplateDialogs";
import { selectValidationView } from "./editor-selectors";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";

import { adjustmentProfileFixture } from "./attribute-adjustment-fixtures";

const catalogs = requireReadyCatalogs();

describe("TemplateControls", () => {
  it("mentions authored adjustments in the existing confirmation and omission notice", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const blank = createBlankEditorState();
    render(
      <Harness
        initialState={{
          ...blank,
          build: { ...blank.build, attributeAdjustments: adjustmentProfileFixture(true) }
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    const dialog = screen.getByRole("dialog", { name: "Import skill template" });
    fireEvent.change(within(dialog).getByLabelText("Skill template code"), {
      target: { value: SKILL_TEMPLATE_PACKAGE_EXAMPLE }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Import" }));
    expect(confirm).toHaveBeenCalledWith(
      "Importing a skill template will discard authored attribute adjustments from this draft."
    );
    expect(screen.getByText("Fresh build")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByText(/Rune, headgear, and assumed-effect choices stay/)).toBeInTheDocument();
  });
  it("imports a wrapped skill template and then exposes exact-source export", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    const importDialog = screen.getByRole("dialog", { name: "Import skill template" });
    fireEvent.change(within(importDialog).getByLabelText("Skill template code"), {
      target: { value: `[Original Name;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]` }
    });
    fireEvent.click(within(importDialog).getByRole("button", { name: "Import" }));

    expect(screen.getByText("Exact-source replay available.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    const exportDialog = screen.getByRole("dialog", { name: "Export skill template" });
    expect(within(exportDialog).getByLabelText("Exact source output")).toHaveValue(
      `[Original Name;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]`
    );
  });

  it("leaves the previous state unchanged after invalid import", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    const dialog = screen.getByRole("dialog", { name: "Import skill template" });
    fireEvent.change(within(dialog).getByLabelText("Skill template code"), {
      target: { value: "not-a-code" }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Import" }));

    expect(screen.getByRole("status")).toHaveTextContent("Template code must use");
    expect(screen.getByText("Fresh build")).toBeInTheDocument();
  });

  it("warns on export when title overrides will be omitted", () => {
    render(<Harness initialState={stateWithTitleOverrides()} />);

    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(
      within(screen.getByRole("dialog", { name: "Export skill template" })).getByText(
        "Authored title ranks are local-only and are not included in skill template output."
      )
    ).toBeInTheDocument();
  });

  it("labels template actions as selected-loadout-only when used inside a build set", () => {
    render(<Harness selectedLoadoutOnly />);

    expect(screen.getByText("Selected loadout only")).toBeInTheDocument();
    expect(
      screen.getByText("Sibling loadouts and party metadata use native JSON transfer or backup.")
    ).toBeInTheDocument();
  });

  it("confirms before skill-template import discards authored title ranks", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Harness initialState={stateWithTitleOverrides()} />);

    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    const importDialog = screen.getByRole("dialog", { name: "Import skill template" });
    fireEvent.change(within(importDialog).getByLabelText("Skill template code"), {
      target: { value: SKILL_TEMPLATE_PACKAGE_EXAMPLE }
    });
    fireEvent.click(within(importDialog).getByRole("button", { name: "Import" }));

    expect(confirm).toHaveBeenCalledWith(
      "Importing a skill template will discard authored title ranks from this draft."
    );
    expect(screen.getByText("Fresh build")).toBeInTheDocument();
  });
});

function Harness({
  initialState = createBlankEditorState(),
  selectedLoadoutOnly = false
}: {
  readonly initialState?: EditorState;
  readonly selectedLoadoutOnly?: boolean;
}) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const validation = selectValidationView(state, catalogs);
  return (
    <>
      <TemplateControls
        state={state}
        catalogs={catalogs}
        validation={validation}
        dispatch={dispatch}
        selectedLoadoutOnly={selectedLoadoutOnly}
      />
      <div role="status">{state.transient?.text ?? ""}</div>
    </>
  );
}

function stateWithTitleOverrides(): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    build: {
      ...state.build,
      titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }]
    }
  };
}
