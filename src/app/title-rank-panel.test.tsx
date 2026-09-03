import { fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import {
  requireTitleRankTestCatalogs,
  titleRankTestSkillIds
} from "../../test/fixtures/app/title-rank-catalogs";
import { TitleRankPanel } from "./components/TitleRankPanel";
import { selectTitleRankPanelView, selectValidationView } from "./editor-selectors";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";

const catalogs = requireTitleRankTestCatalogs();

describe("TitleRankPanel", () => {
  it("renders relevant controls first with an all-title disclosure", () => {
    render(<Harness />);

    expect(screen.getByRole("heading", { name: "Title Ranks" })).toBeInTheDocument();
    expect(screen.getByLabelText("Lightbringer")).toHaveValue(12);
    expect(screen.getByText("All title ranks")).toBeInTheDocument();
  });

  it("supports decrement, increment, direct integer entry, and reset", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Decrease Lightbringer" }));
    expect(screen.getByLabelText("Lightbringer")).toHaveValue(11);

    fireEvent.click(screen.getByRole("button", { name: "Increase Lightbringer" }));
    expect(screen.getByLabelText("Lightbringer")).toHaveValue(12);

    fireEvent.change(screen.getByLabelText("Lightbringer"), { target: { value: "4" } });
    fireEvent.blur(screen.getByLabelText("Lightbringer"));
    expect(screen.getByLabelText("Lightbringer")).toHaveValue(4);

    const row = screen.getByLabelText("Lightbringer").closest(".title-rank-row");
    expect(row).not.toBeNull();
    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Lightbringer")).toHaveValue(12);
    expect(screen.getByRole("status")).toHaveTextContent("Lightbringer title rank reset.");
  });

  it("restores malformed and out-of-range draft text on commit", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Lightbringer");

    fireEvent.change(input, { target: { value: "4.5" } });
    fireEvent.blur(input);
    expect(input).toHaveValue(12);

    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue(12);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Lightbringer title rank must be an exact integer from 0-12."
    );
  });
});

function Harness({ initialState = titleEditorState() }: { readonly initialState?: EditorState }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const validation = selectValidationView(state, catalogs);
  const panel = selectTitleRankPanelView(state, catalogs, validation.result);
  return (
    <>
      <TitleRankPanel view={panel} dispatch={dispatch} />
      <div role="status">{state.transient?.text ?? ""}</div>
    </>
  );
}

function titleEditorState(): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    build: {
      ...state.build,
      skillBar: [titleRankTestSkillIds.lightbringer, null, null, null, null, null, null, null]
    }
  };
}
