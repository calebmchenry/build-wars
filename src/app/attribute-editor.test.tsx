import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { createEmptyEquipmentLoadout, knownEquipmentSelection, type RuneId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { selectFocusedAttributeRows } from "./composer-selectors";
import { FocusedAttributeEditor } from "./components/FocusedAttributeEditor";
import { playableEditorFixture } from "./editor-fixtures";
import { selectValidationView } from "./editor-selectors";
import { editorReducer, type EditorState } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("FocusedAttributeEditor", () => {
  it("shows investment and refund costs from the shared point rules", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Attribute point spend")).toHaveTextContent("146/200");
    expect(screen.getByRole("button", { name: "Refund Strength" })).toHaveTextContent("-11");
    expect(screen.getByRole("button", { name: "Invest in Strength" })).toHaveTextContent("+13");

    fireEvent.click(screen.getByRole("button", { name: "Invest in Strength" }));

    expect(screen.getByLabelText("Attribute point spend")).toHaveTextContent("159/200");
  });

  it("marks effective ranks modified when equipment adjustments apply", () => {
    const state = stateWithStrengthRune();
    const validation = selectValidationView(state, catalogs);
    const strength = selectFocusedAttributeRows(state, catalogs, validation).find(
      (row) => row.label === "Strength"
    );

    expect(strength?.rank).toBe(9);
    expect(strength?.effectiveRank).toBe(10);
    expect(strength?.effectiveModified).toBe(true);
  });
});

function Harness({
  initialState = playableEditorFixture()
}: {
  readonly initialState?: EditorState;
}) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const validation = selectValidationView(state, catalogs);
  return (
    <FocusedAttributeEditor
      state={state}
      catalogs={catalogs}
      validation={validation}
      dispatch={dispatch}
    />
  );
}

function stateWithStrengthRune(): EditorState {
  const state = playableEditorFixture();
  const equipment = createEmptyEquipmentLoadout();
  return {
    ...state,
    build: {
      ...state.build,
      equipment: {
        ...equipment,
        armor: equipment.armor.map((piece) =>
          piece.slot === "head" ? { ...piece, rune: knownEquipmentSelection(40 as RuneId) } : piece
        )
      }
    }
  };
}
