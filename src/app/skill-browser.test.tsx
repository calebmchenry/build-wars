import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { requireReadyCatalogs } from "./catalogs";
import { SkillBrowser } from "./components/SkillBrowser";
import { createBlankEditorState, editorReducer } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("SkillBrowser", () => {
  it("renders bounded results and recovers from no-result filters", () => {
    render(<Harness />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzz-no-skill" } });
    expect(screen.getByText("No matching skills")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.queryByText("No matching skills")).not.toBeInTheDocument();
  });

  it("can switch list and grid views", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "S" }));
    expect(screen.getByRole("button", { name: "S" })).toHaveAttribute("aria-pressed", "true");
  });
});

function Harness() {
  const [state, dispatch] = useReducer(editorReducer, undefined, () => createBlankEditorState());
  return <SkillBrowser state={state} catalogs={catalogs} dispatch={dispatch} />;
}
