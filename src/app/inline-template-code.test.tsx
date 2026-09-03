import { act, fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";

import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import { requireReadyCatalogs } from "./catalogs";
import { InlineTemplateCode } from "./components/InlineTemplateCode";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";
import { selectValidationView } from "./editor-selectors";
import { importSkillTemplateToEditor } from "./template-workflow";

const catalogs = requireReadyCatalogs();

describe("InlineTemplateCode", () => {
  it("imports valid template text only after Apply", () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText("Import skill template code"), {
      target: { value: SKILL_TEMPLATE_PACKAGE_EXAMPLE }
    });
    expect(screen.getByTestId("primary-profession")).toHaveTextContent("Any");

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(screen.getByRole("status")).toHaveTextContent("Skill template imported.");
    expect(screen.getByTestId("primary-profession")).not.toHaveTextContent("Any");
  });

  it("leaves previous state unchanged after invalid input", () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText("Import skill template code"), {
      target: { value: "not-a-template" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

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
    expect(screen.getByLabelText("Current template output")).toHaveValue(
      SKILL_TEMPLATE_PACKAGE_EXAMPLE
    );
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
        selectedLoadoutOnly={false}
      />
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
