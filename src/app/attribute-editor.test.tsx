import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import {
  catalogId,
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  type RuneId
} from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { selectFocusedAttributeRows } from "./composer-selectors";
import { FocusedAttributeEditor } from "./components/FocusedAttributeEditor";
import { playableEditorFixture } from "./editor-fixtures";
import { selectValidationView } from "./editor-selectors";
import { setProfessionWithAttributeCleanup } from "./attribute-eligibility";
import { editorReducer, type EditorState } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("FocusedAttributeEditor", () => {
  it("defaults expanded and toggles attribute rows closed and open", () => {
    render(<Harness />);

    const collapseButton = screen.getByRole("button", { name: "Collapse attributes" });
    expect(collapseButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Decrease Strength" })).toBeInTheDocument();

    fireEvent.click(collapseButton);

    const expandButton = screen.getByRole("button", { name: "Expand attributes" });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Decrease Strength" })).not.toBeInTheDocument();

    fireEvent.click(expandButton);

    expect(screen.getByRole("button", { name: "Collapse attributes" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByRole("button", { name: "Decrease Strength" })).toBeInTheDocument();
  });

  it("shows investment and refund costs from the shared point rules", () => {
    render(<Harness />);

    expect(
      screen.getByRole("heading", { name: "Attributes (54 unused points)" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Attribute point spend")).toHaveTextContent("146/200");
    const decrease = screen.getByRole("button", { name: "Decrease Strength" });
    const increase = screen.getByRole("button", { name: "Increase Strength" });
    expect(decrease).toHaveTextContent("11");
    expect(increase).toHaveTextContent("13");
    expect(
      decrease.compareDocumentPosition(increase) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(increase);

    expect(screen.getByLabelText("Attribute point spend")).toHaveTextContent("159/200");
  });

  it("hides capped and zero-rank triangle controls while disabling unaffordable increments", () => {
    render(<Harness initialState={cappedAndOverBudgetState()} />);

    expect(screen.queryByRole("button", { name: "Decrease Strength" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase Strength" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrease Hammer Mastery" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Increase Hammer Mastery" })
    ).not.toBeInTheDocument();
  });

  it("keeps focused attribute rows in static primary-then-secondary order after investment", () => {
    const state = playableEditorFixture();
    const expectedOrder = [
      "Strength",
      "Axe Mastery",
      "Hammer Mastery",
      "Swordsmanship",
      "Tactics",
      "Beast Mastery",
      "Wilderness Survival",
      "Marksmanship"
    ];

    expect(focusedAttributeLabels(state)).toEqual(expectedOrder);

    const axeMastery = catalogs.attributes.find((attribute) => attribute.name === "Axe Mastery");
    if (axeMastery === undefined) {
      throw new Error("Missing Axe Mastery fixture attribute.");
    }
    const invested = editorReducer(state, {
      type: "set-attribute-rank",
      attributeId: axeMastery.id,
      rank: 1
    });

    expect(focusedAttributeLabels(invested)).toEqual(expectedOrder);
  });

  it("omits the primary attribute of the secondary profession", () => {
    const base = playableEditorFixture();
    const state = {
      ...base,
      build: {
        ...base.build,
        primaryProfessionId: catalogId<"Profession">(3),
        secondaryProfessionId: catalogId<"Profession">(1),
        attributes: []
      },
      rawTemplate: {
        ...base.rawTemplate,
        attributes: []
      }
    };

    expect(focusedAttributeLabels(state)).toEqual([
      "Healing Prayers",
      "Smiting Prayers",
      "Protection Prayers",
      "Divine Favor",
      "Axe Mastery",
      "Hammer Mastery",
      "Swordsmanship",
      "Tactics"
    ]);
  });

  it("clears allocated attributes that stop being legal when a profession changes", () => {
    const state = playableEditorFixture();
    const next = editorReducer(
      state,
      setProfessionWithAttributeCleanup(state, catalogs, "secondary", catalogId<"Profession">(3))
    );

    expect(Number(next.build.secondaryProfessionId)).toBe(3);
    expect(next.build.attributes.map((attribute) => Number(attribute.attributeId))).toEqual([
      17, 19
    ]);
    expect(next.rawTemplate.attributes).toHaveLength(2);
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

function focusedAttributeLabels(state: EditorState): readonly string[] {
  const validation = selectValidationView(state, catalogs);
  return selectFocusedAttributeRows(state, catalogs, validation).map((row) => row.label);
}

function cappedAndOverBudgetState(): EditorState {
  const state = playableEditorFixture();
  return {
    ...state,
    pveBudget: { level: 1, questBonus: "none" },
    build: {
      ...state.build,
      attributes: [
        { attributeId: catalogId<"Attribute">(17), rank: 0 },
        { attributeId: catalogId<"Attribute">(18), rank: 12 },
        { attributeId: catalogId<"Attribute">(19), rank: 12 },
        { attributeId: catalogId<"Attribute">(25), rank: 12 }
      ]
    }
  };
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
