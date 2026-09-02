import { fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import { requireReadyCatalogs } from "./catalogs";
import { TemplateControls } from "./components/TemplateDialogs";
import { selectValidationView } from "./editor-selectors";
import { createBlankEditorState, editorReducer } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("TemplateControls", () => {
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
});

function Harness() {
  const [state, dispatch] = useReducer(editorReducer, undefined, () => createBlankEditorState());
  const validation = selectValidationView(state, catalogs);
  return (
    <>
      <TemplateControls
        state={state}
        catalogs={catalogs}
        validation={validation}
        dispatch={dispatch}
      />
      <div role="status">{state.transient?.text ?? ""}</div>
    </>
  );
}
