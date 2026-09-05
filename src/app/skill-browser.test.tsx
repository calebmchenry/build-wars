import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { requireReadyCatalogs } from "./catalogs";
import { SkillBrowser } from "./components/SkillBrowser";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("SkillBrowser", () => {
  it("renders complete results and recovers from no-result filters", () => {
    render(<Harness />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzz-no-skill" } });
    expect(screen.getByText("No matching skills")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.queryByText("No matching skills")).not.toBeInTheDocument();
  });

  it("can switch list and grid views", () => {
    render(<Harness initialState={stateWithBrowserQuery("Healing Signet")} />);

    fireEvent.click(screen.getByRole("button", { name: "Compact" }));
    expect(screen.getByRole("button", { name: "Compact" })).toHaveAttribute("aria-pressed", "true");
  });
});

function Harness({
  initialState = createBlankEditorState()
}: {
  readonly initialState?: EditorState;
}) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  return <SkillBrowser state={state} catalogs={catalogs} dispatch={dispatch} />;
}

function stateWithBrowserQuery(query: string): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    browser: {
      ...state.browser,
      filters: {
        ...state.browser.filters,
        query
      }
    }
  };
}
