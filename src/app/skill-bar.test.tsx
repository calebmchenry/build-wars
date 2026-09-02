import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { requireReadyCatalogs } from "./catalogs";
import { SkillBar } from "./components/SkillBar";
import { playableEditorFixture } from "./editor-fixtures";
import { editorReducer } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("SkillBar", () => {
  it("renders exactly eight stable slots and clears a slot", () => {
    render(<Harness />);

    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "Clear slot 1" }));
    expect(screen.getByRole("button", { name: /Skill slot 1: Empty/ })).toBeInTheDocument();
  });

  it("supports keyboard pick and place movement", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Pick slot 1 for keyboard movement" }));
    fireEvent.click(screen.getByRole("button", { name: "Place keyboard selection in slot 3" }));

    expect(
      screen.getByRole("button", { name: /Skill slot 3: Healing Signet/ })
    ).toBeInTheDocument();
  });
});

function Harness() {
  const [state, dispatch] = useReducer(editorReducer, undefined, () => playableEditorFixture());
  return <SkillBar state={state} catalogs={catalogs} dispatch={dispatch} />;
}
