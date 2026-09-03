import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { catalogId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { FocusedSkillCatalog } from "./components/FocusedSkillCatalog";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("FocusedSkillCatalog", () => {
  it("renders a bounded all-playable view when both professions are Any", () => {
    render(<Harness />);

    expect(screen.getByRole("heading", { name: "Skills Catalog" })).toBeInTheDocument();
    expect(screen.getByText(/48\/[0-9]+ shown from/)).toBeInTheDocument();
    expect(screen.queryAllByText("Resurrection Signet").length).toBeLessThanOrEqual(1);
  });

  it("filters through selected professions and places a skill with shared bar policy", () => {
    render(
      <Harness
        initialState={{
          ...createBlankEditorState(),
          build: {
            ...createBlankEditorState().build,
            primaryProfessionId: catalogId<"Profession">(1)
          },
          browser: {
            ...createBlankEditorState().browser,
            filters: { ...createBlankEditorState().browser.filters, query: "Healing Signet" }
          }
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Place Healing Signet in slot 1" }));

    expect(screen.getByRole("status")).toHaveTextContent("Healing Signet placed in slot 1.");
  });

  it("collapses and expands attribute groups as UI-only state", () => {
    render(<Harness />);

    const firstGroup = screen.getAllByRole("button", { expanded: true })[0]!;
    fireEvent.click(firstGroup);
    expect(firstGroup).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(firstGroup);
    expect(firstGroup).toHaveAttribute("aria-expanded", "true");
  });
});

function Harness({
  initialState = createBlankEditorState()
}: {
  readonly initialState?: EditorState;
}) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  return (
    <>
      <FocusedSkillCatalog state={state} catalogs={catalogs} dispatch={dispatch} />
      <div role="status">{state.transient?.text ?? ""}</div>
    </>
  );
}
