import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { catalogId } from "../domain";
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
    "renders default availability as the current build mode",
    () => {
      render(<Harness initialState={stateWithBuildMode("pvp")} />);

      expect(screen.getByLabelText("Mode")).toHaveValue("pvp");
    },
    CATALOG_RENDER_TIMEOUT_MS
  );

  it("collapses lower-priority filters behind advanced filters", () => {
    render(<Harness initialState={stateWithAdvancedFilters()} />);

    expect(screen.getByLabelText("Text")).toBeInTheDocument();
    expect(screen.getByLabelText("Mode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cost filters" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inflicts" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Attribute")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Advanced filters (2)" }));

    expect(screen.getByLabelText("Attribute")).toHaveValue("0");
    expect(screen.getByLabelText("Elite")).toHaveValue("elite");
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

function stateWithBuildMode(mode: "pve" | "pvp"): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    build: {
      ...state.build,
      mode
    },
    browser: {
      ...state.browser,
      filters: {
        ...state.browser.filters,
        query: "zzzz-no-skill"
      }
    }
  };
}

function stateWithAdvancedFilters(): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    browser: {
      ...state.browser,
      filters: {
        ...state.browser.filters,
        attributeId: catalogId<"Attribute">(0),
        elite: "elite"
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
