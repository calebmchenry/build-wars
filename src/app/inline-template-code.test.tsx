import { act, fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";

import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import { requireReadyCatalogs } from "./catalogs";
import { InlineTemplateCode } from "./components/InlineTemplateCode";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";
import { selectValidationView } from "./editor-selectors";
import { importSkillTemplateToEditor } from "./template-workflow";

import { adjustmentProfileFixture } from "./attribute-adjustment-fixtures";
import { elementalBuild } from "../../test/fixtures/attribute-adjustment-builds";
import { templateReplacementWarnings } from "./template-import";

const catalogs = requireReadyCatalogs();

describe("InlineTemplateCode", () => {
  it("warns for explicit None/off choices, preserves canceled state, and resets on accepted import", () => {
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
    const paste = () =>
      fireEvent.paste(screen.getByLabelText("Template code"), {
        clipboardData: { getData: () => SKILL_TEMPLATE_PACKAGE_EXAMPLE }
      });
    paste();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith(
      "Importing a skill template will discard authored attribute adjustments from this draft."
    );
    expect(screen.getByLabelText("Profile")).toHaveTextContent(
      JSON.stringify(adjustmentProfileFixture(true))
    );
    confirm.mockReturnValue(true);
    paste();
    expect(screen.getByLabelText("Profile")).toHaveTextContent("null");
  });
  it("does not warn for automatic inference alone", () => {
    expect(templateReplacementWarnings(elementalBuild({ attributeAdjustments: null }))).toEqual([]);
  });
  it("imports valid template text when pasted", () => {
    render(<Harness />);

    expect(screen.getByTestId("primary-profession")).toHaveTextContent("Any");
    fireEvent.paste(screen.getByLabelText("Template code"), {
      clipboardData: { getData: () => SKILL_TEMPLATE_PACKAGE_EXAMPLE }
    });

    expect(screen.getByRole("status")).toHaveTextContent("Skill template imported.");
    expect(screen.getByTestId("primary-profession")).not.toHaveTextContent("Any");
    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
  });

  it("leaves previous state unchanged after invalid input", () => {
    render(<Harness />);

    fireEvent.paste(screen.getByLabelText("Template code"), {
      clipboardData: { getData: () => "not-a-template" }
    });

    expect(screen.getByRole("status")).toHaveTextContent("Template code must use");
    expect(screen.getByTestId("build-name")).toHaveTextContent("Untitled Build");
  });

  it("leaves selectable text when clipboard writes fail", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) }
    });
    render(<Harness initialState={importedState()} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy template code" }));
    await act(async () => Promise.resolve());

    expect(screen.getByRole("status")).toHaveTextContent(
      "Copy was denied; template text remains selectable."
    );
    expect(screen.getByLabelText("Template code")).toHaveValue(SKILL_TEMPLATE_PACKAGE_EXAMPLE);
  });
});

function Harness({
  initialState = createBlankEditorState()
}: {
  readonly initialState?: EditorState;
}) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const validation = selectValidationView(state, catalogs);
  return (
    <>
      <InlineTemplateCode
        state={state}
        catalogs={catalogs}
        validation={validation}
        dispatch={dispatch}
        requestDraftReplacement={() => "discard"}
      />
      <output role="note" aria-label="Profile">
        {JSON.stringify(state.build.attributeAdjustments)}
      </output>
      <div data-testid="build-name">{state.build.name}</div>
      <div data-testid="primary-profession">
        {state.build.primaryProfessionId === null ? "Any" : Number(state.build.primaryProfessionId)}
      </div>
      <div role="status">{state.transient?.text ?? ""}</div>
    </>
  );
}

function importedState(): EditorState {
  const imported = importSkillTemplateToEditor(
    SKILL_TEMPLATE_PACKAGE_EXAMPLE,
    createBlankEditorState(),
    catalogs
  );
  if (!imported.ok) {
    throw new Error(imported.error.message);
  }
  return imported.state;
}
