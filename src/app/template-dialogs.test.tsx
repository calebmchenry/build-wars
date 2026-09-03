import { fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";

import { createEmptyEquipmentLoadout, knownEquipmentSelection, type RuneId } from "../domain";
import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import { requireReadyCatalogs } from "./catalogs";
import { TemplateControls } from "./components/TemplateDialogs";
import { selectValidationView } from "./editor-selectors";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("TemplateControls", () => {
  it("imports a wrapped skill template and then exposes exact-source export", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    const importDialog = screen.getByRole("dialog", { name: "Import skill template" });
    fireEvent.change(within(importDialog).getByLabelText("Skill template code"), {
      target: { value: `[Original Name;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]` }
    });
    fireEvent.click(within(importDialog).getByRole("button", { name: "Import" }));

    expect(screen.getByText("Exact-source replay available.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    const exportDialog = screen.getByRole("dialog", { name: "Export skill template" });
    expect(within(exportDialog).getByLabelText("Exact source output")).toHaveValue(
      `[Original Name;${SKILL_TEMPLATE_PACKAGE_EXAMPLE}]`
    );
  });

  it("leaves the previous state unchanged after invalid import", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    const dialog = screen.getByRole("dialog", { name: "Import skill template" });
    fireEvent.change(within(dialog).getByLabelText("Skill template code"), {
      target: { value: "not-a-code" }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Import" }));

    expect(screen.getByRole("status")).toHaveTextContent("Template code must use");
    expect(screen.getByText("Fresh build")).toBeInTheDocument();
  });

  it("warns on export when meaningful equipment will be omitted", () => {
    render(<Harness initialState={stateWithEquipment()} />);

    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(
      within(screen.getByRole("dialog", { name: "Export skill template" })).getByText(
        "Authored equipment is local-only and is not included in skill template output."
      )
    ).toBeInTheDocument();
  });

  it("warns on export when title overrides will be omitted", () => {
    render(<Harness initialState={stateWithTitleOverrides()} />);

    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(
      within(screen.getByRole("dialog", { name: "Export skill template" })).getByText(
        "Authored title ranks are local-only and are not included in skill template output."
      )
    ).toBeInTheDocument();
  });

  it("does not warn for canonical empty equipment on export", () => {
    const state = createBlankEditorState();
    render(
      <Harness
        initialState={{
          ...state,
          build: { ...state.build, equipment: createEmptyEquipmentLoadout() }
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(
      within(screen.getByRole("dialog", { name: "Export skill template" })).queryByText(
        "Authored equipment is local-only and is not included in skill template output."
      )
    ).not.toBeInTheDocument();
  });

  it("labels template actions as selected-loadout-only when used inside a build set", () => {
    render(<Harness selectedLoadoutOnly />);

    expect(screen.getByText("Selected loadout only")).toBeInTheDocument();
    expect(
      screen.getByText("Sibling loadouts and party metadata use native JSON transfer or backup.")
    ).toBeInTheDocument();
  });

  it("confirms before skill-template import discards meaningful equipment", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Harness initialState={stateWithEquipment()} />);

    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    const importDialog = screen.getByRole("dialog", { name: "Import skill template" });
    fireEvent.change(within(importDialog).getByLabelText("Skill template code"), {
      target: { value: SKILL_TEMPLATE_PACKAGE_EXAMPLE }
    });
    fireEvent.click(within(importDialog).getByRole("button", { name: "Import" }));

    expect(confirm).toHaveBeenCalledWith(
      "Importing a skill template will discard authored equipment from this draft."
    );
    expect(screen.getByText("Fresh build")).toBeInTheDocument();
  });

  it("confirms before skill-template import discards authored title ranks", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Harness initialState={stateWithTitleOverrides()} />);

    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    const importDialog = screen.getByRole("dialog", { name: "Import skill template" });
    fireEvent.change(within(importDialog).getByLabelText("Skill template code"), {
      target: { value: SKILL_TEMPLATE_PACKAGE_EXAMPLE }
    });
    fireEvent.click(within(importDialog).getByRole("button", { name: "Import" }));

    expect(confirm).toHaveBeenCalledWith(
      "Importing a skill template will discard authored title ranks from this draft."
    );
    expect(screen.getByText("Fresh build")).toBeInTheDocument();
  });
});

function Harness({
  initialState = createBlankEditorState(),
  selectedLoadoutOnly = false
}: {
  readonly initialState?: EditorState;
  readonly selectedLoadoutOnly?: boolean;
}) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const validation = selectValidationView(state, catalogs);
  return (
    <>
      <TemplateControls
        state={state}
        catalogs={catalogs}
        validation={validation}
        dispatch={dispatch}
        selectedLoadoutOnly={selectedLoadoutOnly}
      />
      <div role="status">{state.transient?.text ?? ""}</div>
    </>
  );
}

function stateWithEquipment(): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    build: {
      ...state.build,
      equipment: {
        schemaVersion: 1,
        armor: [
          {
            slot: "head",
            rune: knownEquipmentSelection(40 as RuneId),
            insignia: null,
            headgearAttribute: null
          },
          { slot: "chest", rune: null, insignia: null, headgearAttribute: null },
          { slot: "hands", rune: null, insignia: null, headgearAttribute: null },
          { slot: "legs", rune: null, insignia: null, headgearAttribute: null },
          { slot: "feet", rune: null, insignia: null, headgearAttribute: null }
        ],
        weaponSets: [
          { slot: "set-1", mainHand: null, offHand: null },
          { slot: "set-2", mainHand: null, offHand: null },
          { slot: "set-3", mainHand: null, offHand: null },
          { slot: "set-4", mainHand: null, offHand: null }
        ]
      }
    }
  };
}

function stateWithTitleOverrides(): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    build: {
      ...state.build,
      titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }]
    }
  };
}
