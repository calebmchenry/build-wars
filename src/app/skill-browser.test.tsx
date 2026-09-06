import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { requireReadyCatalogs } from "./catalogs";
import { SkillBrowser } from "./components/SkillBrowser";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";

const catalogs = requireReadyCatalogs();
const CATALOG_RENDER_TIMEOUT_MS = 10_000;

describe("SkillBrowser", () => {
  it(
    "renders complete results and recovers from no-result filters",
    () => {
      const { container } = render(<Harness />);

      fireEvent.change(requiredSearchInput(container, 0), { target: { value: "zzzz-no-skill" } });
      expect(screen.getByText("No matching skills")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
      expect(screen.queryByText("No matching skills")).not.toBeInTheDocument();
    },
    CATALOG_RENDER_TIMEOUT_MS
  );

  it("can switch list and grid views", () => {
    render(<Harness initialState={stateWithBrowserQuery("Healing Signet")} />);

    fireEvent.click(screen.getByRole("button", { name: "Compact" }));
    expect(screen.getByRole("button", { name: "Compact" })).toHaveAttribute("aria-pressed", "true");
  });

  it(
    "filters by skill text separately from name search",
    () => {
      render(<Harness initialState={stateWithBrowserTextQuery("nearby dead boss")} />);

      expect(screen.getByText("Signet of Capture")).toBeInTheDocument();
      expect(screen.queryByText("Healing Signet")).not.toBeInTheDocument();
    },
    CATALOG_RENDER_TIMEOUT_MS
  );
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

function stateWithBrowserTextQuery(textQuery: string): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    browser: {
      ...state.browser,
      filters: {
        ...state.browser.filters,
        textQuery
      }
    }
  };
}

function requiredSearchInput(container: HTMLElement, index: number): HTMLInputElement {
  const input = container.querySelectorAll<HTMLInputElement>("input[type='search']")[index];
  if (input === undefined) {
    throw new Error(`Missing search input ${index}`);
  }
  return input;
}
