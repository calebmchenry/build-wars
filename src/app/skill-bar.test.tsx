import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { requireReadyCatalogs } from "./catalogs";
import { SkillBar } from "./components/SkillBar";
import { playableEditorFixture } from "./editor-fixtures";
import { editorReducer } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("SkillBar", () => {
  it("renders exactly eight skill slots without organizing controls", () => {
    render(<Harness />);

    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getAllByRole("button", { name: /Skill slot/ })).toHaveLength(8);
    expect(screen.queryByRole("button", { name: /Move/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Place/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Clear/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel keyboard pick" })).not.toBeInTheDocument();
    expect(screen.queryByText("Remove skill")).not.toBeInTheDocument();
  });

  it("shows skill tooltips above filled skill slots", () => {
    render(<Harness />);

    fireEvent.mouseEnter(screen.getAllByRole("listitem")[0]!);

    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveClass("from-skillbar");
    expect(tooltip).toHaveTextContent("Healing Signet");
    expect(tooltip).toHaveTextContent("(Attrib: Tactics)");
  });

  it("moves skills between slots with drag and drop", () => {
    render(<Harness />);

    const dataTransfer = createDataTransfer();
    const slotButtons = screen.getAllByRole("button", { name: /Skill slot/ });
    const slotItems = screen.getAllByRole("listitem");

    fireEvent.dragStart(slotButtons[0]!, { dataTransfer });
    fireEvent.dragOver(slotItems[2]!, { dataTransfer });
    fireEvent.drop(slotItems[2]!, { dataTransfer });
    fireEvent.dragEnd(slotButtons[0]!, { dataTransfer });

    expect(
      screen.getByRole("button", { name: /Skill slot 3: Healing Signet/ })
    ).toBeInTheDocument();
  });

  it("removes a skill when a slot drag ends without an accepted drop", () => {
    render(<Harness />);

    const dataTransfer = createDataTransfer();
    const slotButtons = screen.getAllByRole("button", { name: /Skill slot/ });

    fireEvent.dragStart(slotButtons[0]!, { dataTransfer });
    fireEvent.dragEnd(slotButtons[0]!, { dataTransfer });

    expect(screen.getByRole("button", { name: /Skill slot 1: Empty/ })).toBeInTheDocument();
  });
});

function Harness() {
  const [state, dispatch] = useReducer(editorReducer, undefined, () => playableEditorFixture());
  return <SkillBar state={state} catalogs={catalogs} dispatch={dispatch} />;
}

function createDataTransfer() {
  const data = new Map<string, string>();
  return {
    dropEffect: "none",
    effectAllowed: "all",
    setData: (type: string, value: string) => data.set(type, value),
    getData: (type: string) => data.get(type) ?? ""
  };
}
