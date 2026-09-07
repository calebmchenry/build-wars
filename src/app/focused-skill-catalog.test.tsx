import { fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";

import { catalogId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { FocusedSkillCatalog } from "./components/FocusedSkillCatalog";
import { BUILD_WARS_DRAG_MIME, parseDragPayload } from "./drag-payload";
import { selectSkillBrowser } from "./editor-selectors";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";

const catalogs = requireReadyCatalogs();
const CATALOG_RENDER_TIMEOUT_MS = 10_000;

describe("FocusedSkillCatalog", () => {
  it(
    "renders the full all-playable view when both professions are Any",
    () => {
      render(<Harness />);

      expect(screen.getByRole("tab", { name: "Skills" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Skills Catalog" })).toBeInTheDocument();
      expect(screen.queryByText(/shown from/)).not.toBeInTheDocument();
      expect(screen.queryByText(/[0-9]+ visible/)).not.toBeInTheDocument();
      expect(screen.getAllByText(/\([0-9]+ Skills\)$/).length).toBeGreaterThan(0);
      expect(screen.queryAllByText("Resurrection Signet").length).toBeLessThanOrEqual(1);
      expect(screen.queryByRole("button", { name: /Pick/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Details/ })).not.toBeInTheDocument();
    },
    CATALOG_RENDER_TIMEOUT_MS
  );

  it("keeps search compact and expands filters from the icon button", () => {
    const { container } = render(<Harness initialState={stateWithBrowserQuery("Energy Drain")} />);

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    expect(screen.queryByText("Search")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Profession" })).not.toBeInTheDocument();

    const filterButton = screen.getByRole("button", { name: "Show skill filters (1 active)" });
    expect(filterButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(filterButton);

    expect(screen.getByRole("button", { name: "Hide skill filters (1 active)" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByRole("button", { name: "Profession" })).toBeInTheDocument();
    expect(screen.getByLabelText("Text")).toBeInTheDocument();
    expect(screen.getByLabelText("Mode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cost filters" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inflicts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Removes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deals Damage" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Attribute")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Advanced filters (0)" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByLabelText("Burning")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Inflicts" }));
    expect(screen.getByRole("group", { name: "Inflicts filters" })).toBeInTheDocument();
    expect(screen.getByLabelText("Burning")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "All modes" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "PvE" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Both modes only" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Advanced filters (0)" }));

    expect(screen.getByRole("button", { name: "Advanced filters (0)" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByLabelText("Attribute")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Any" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "Reset filters" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Elite" }));

    expect(screen.getByRole("button", { name: "Hide skill filters (2 active)" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByRole("button", { name: "Advanced filters (1)" })).toHaveClass("active");
    expect(container.querySelector(".filter-active-count")).toHaveTextContent("2");
    expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Burning"));

    expect(screen.getByRole("button", { name: "Hide skill filters (3 active)" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    fireEvent.change(screen.getByLabelText("Text"), { target: { value: "nearby dead boss" } });

    expect(screen.getByRole("button", { name: "Hide skill filters (4 active)" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Reset filters" })[0]!);

    expect(screen.getByRole("button", { name: "Hide skill filters (1 active)" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByRole("button", { name: "Any" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Advanced filters (0)" })).not.toHaveClass("active");
    expect(screen.getByLabelText("Burning")).not.toBeChecked();
    expect(screen.getByLabelText("Text")).toHaveValue("");
    expect(container.querySelector(".filter-active-count")).toHaveTextContent("1");
    expect(screen.queryByRole("button", { name: "Reset filters" })).not.toBeInTheDocument();
  });

  it("switches skill display modes from the icon button beside filters", () => {
    const { container } = render(
      <Harness initialState={stateWithBrowserQuery("Healing Signet")} />
    );

    const searchRow = container.querySelector(".focused-catalog-search-row");
    expect(searchRow?.children[1]).toHaveClass("display-mode-control");
    expect(searchRow?.children[2]).toHaveClass("catalog-filter-button");

    fireEvent.click(screen.getByRole("button", { name: "Skill display: Rows" }));

    expect(screen.getByRole("menu", { name: "Skill display modes" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Rows" })).toHaveAttribute(
      "aria-checked",
      "true"
    );

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Small icons" }));

    expect(screen.getByRole("button", { name: "Skill display: Small icons" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(container.querySelector(".focused-skill-list")).toHaveClass(
      "focused-skill-icon-grid",
      "small-icon-grid"
    );
    expect(screen.getByRole("button", { name: "Add Healing Signet to slot 1" })).toHaveClass(
      "focused-skill-icon-tile"
    );
    expect(screen.getByRole("button", { name: "Add Healing Signet to slot 1" })).toHaveAttribute(
      "data-view-mode",
      "small-grid"
    );

    fireEvent.click(screen.getByRole("button", { name: "Skill display: Small icons" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Large icons" }));

    expect(container.querySelector(".focused-skill-list")).toHaveClass(
      "focused-skill-icon-grid",
      "large-icon-grid"
    );
    expect(screen.getByRole("button", { name: "Add Healing Signet to slot 1" })).toHaveAttribute(
      "data-view-mode",
      "large-grid"
    );
  });

  it("marks dropdown filter buttons active when their group has selected filters", () => {
    const { container } = render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Show skill filters (1 active)" }));

    const filterPanel = container.querySelector("#focused-skill-filters");
    if (filterPanel === null) {
      throw new Error("Missing focused skill filters");
    }
    const filters = within(filterPanel as HTMLElement);
    const costButton = filters.getByRole("button", { name: "Cost filters" });
    const inflictsButton = filters.getByRole("button", { name: "Inflicts" });
    const professionButton = filters.getByRole("button", { name: "Profession" });

    expect(costButton).not.toHaveClass("active");
    expect(inflictsButton).not.toHaveClass("active");
    expect(professionButton).not.toHaveClass("active");

    fireEvent.click(costButton);
    fireEvent.click(filters.getByLabelText("Energy"));

    expect(costButton).toHaveClass("active");
    expect(costButton).toHaveTextContent("Cost (1)");

    fireEvent.click(costButton);
    fireEvent.click(inflictsButton);
    fireEvent.click(filters.getByLabelText("Burning"));

    expect(inflictsButton).toHaveClass("active");
  });

  it("renders build default filters as removable chips and reset restores them", () => {
    render(<Harness initialState={stateWithBuildProfessions(1, 2)} />);

    expect(screen.getByRole("button", { name: "Remove Warrior filter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Ranger filter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Mode: PvE filter" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove Warrior filter" }));

    expect(screen.queryByRole("button", { name: "Remove Warrior filter" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Ranger filter" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show skill filters (2 active)" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByRole("button", { name: "Remove Warrior filter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Ranger filter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Mode: PvE filter" })).toBeInTheDocument();
  });

  it("collapses extra active filters behind an overflow chip", () => {
    const base = stateWithBuildProfessions(1, 2);

    render(
      <Harness
        initialState={{
          ...base,
          browser: {
            ...base.browser,
            filters: {
              ...base.browser.filters,
              elite: "elite",
              metadata: ["applies:burning"] as const
            }
          }
        }}
      />
    );

    expect(screen.getByRole("button", { name: "2 hidden skill filters" })).toHaveTextContent(
      "+2 filters"
    );

    fireEvent.click(screen.getByRole("button", { name: "2 hidden skill filters" }));

    expect(screen.getByRole("button", { name: "Remove Elite filter" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Inflicts: Burning filter" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove Elite filter" }));

    expect(screen.getByRole("button", { name: "1 hidden skill filters" })).toHaveTextContent(
      "+1 filters"
    );
    expect(
      screen.getByRole("button", { name: "Remove Inflicts: Burning filter" })
    ).toBeInTheDocument();
  });

  it("dismisses button-opened filter menus on outside clicks", () => {
    const base = stateWithBuildProfessions(1, 2);

    render(
      <>
        <Harness
          initialState={{
            ...base,
            browser: {
              ...base.browser,
              filters: {
                ...base.browser.filters,
                elite: "elite",
                metadata: ["applies:burning"] as const
              }
            }
          }}
        />
        <button type="button">Outside</button>
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "2 hidden skill filters" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show skill filters (5 active)" }));
    fireEvent.click(screen.getByRole("button", { name: "Profession" }));
    expect(screen.getByRole("group", { name: "Profession filters" })).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("group", { name: "Profession filters" })).not.toBeInTheDocument();
  });

  it(
    "renders all matching skills without a show-more button",
    () => {
      const initialState = createBlankEditorState();
      const expectedCount = selectSkillBrowser(initialState, catalogs).matchingCount;
      const { container } = render(<Harness initialState={initialState} />);

      expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(expectedCount);

      const results = container.querySelector(".focused-skill-results");
      expect(results).not.toBeNull();
      fireEvent.scroll(results!);

      expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(expectedCount);
    },
    CATALOG_RENDER_TIMEOUT_MS
  );

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

    fireEvent.click(screen.getByRole("button", { name: "Add Healing Signet to slot 1" }));

    expect(screen.getByRole("status")).toHaveTextContent("Healing Signet placed in slot 1.");
  });

  it("opens skill names as wiki links without taking over row placement", () => {
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

    const link = screen.getByRole("link", { name: "Healing Signet" });
    expect(link).toHaveAttribute("href", "https://wiki.guildwars.com/wiki/Healing_Signet");
    expect(link).toHaveAttribute("target", "_blank");

    fireEvent.click(link);

    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("starts focused catalog drags from the skill icon", () => {
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

    const row = screen.getByRole("button", { name: "Add Healing Signet to slot 1" });
    const dataTransfer = createDataTransfer();

    expect(row).not.toHaveAttribute("draggable", "true");
    fireEvent.dragStart(screen.getByTitle("Drag Healing Signet"), { dataTransfer });

    expect(parseDragPayload(dataTransfer.getData(BUILD_WARS_DRAG_MIME))).toEqual({
      kind: "browser-skill",
      skillId: catalogId<"Skill">(1)
    });
    expect(dataTransfer.setDragImage).toHaveBeenCalledTimes(1);
    const [preview, hotspotX, hotspotY] = dataTransfer.setDragImage.mock.calls[0]!;
    expect(preview).toBeInstanceOf(HTMLSpanElement);
    expect((preview as HTMLElement).className).toBe("skill-drag-preview-icon");
    expect((preview as HTMLElement).style.width).toBe("76px");
    expect((preview as HTMLElement).querySelector(".catalog-icon")).not.toBeNull();
    expect(hotspotX).toBe(38);
    expect(hotspotY).toBe(38);
  });

  it("shows skill tooltips beside skill menu rows", () => {
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

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Add Healing Signet to slot 1" }));

    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveClass("from-skill-menu");
    expect(tooltip).toHaveTextContent("Healing Signet");
    expect(tooltip).toHaveTextContent("(Attrib: Tactics)");
  });

  it("collapses and expands attribute groups as UI-only state", () => {
    render(<Harness initialState={stateWithBrowserQuery("Healing Signet")} />);

    const firstGroup = screen.getAllByRole("button", { expanded: true })[0]!;
    fireEvent.click(firstGroup);
    expect(firstGroup).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(firstGroup);
    expect(firstGroup).toHaveAttribute("aria-expanded", "true");
  });

  it("expands and collapses all visible attribute groups", () => {
    const { container } = render(<Harness initialState={stateWithBrowserQuery("Signet")} />);
    const results = container.querySelector(".focused-skill-results");
    if (results === null) {
      throw new Error("Missing focused skill results");
    }
    const resultControls = within(results as HTMLElement);

    const collapseAll = screen.getByRole("button", { name: "Collapse all" });
    const expandAll = screen.getByRole("button", { name: "Expand all" });

    expect(resultControls.getAllByRole("button", { expanded: true }).length).toBeGreaterThan(1);
    expect(expandAll).toBeDisabled();
    expect(collapseAll).not.toBeDisabled();

    fireEvent.click(collapseAll);

    expect(resultControls.queryAllByRole("button", { expanded: true })).toHaveLength(0);
    expect(resultControls.getAllByRole("button", { expanded: false }).length).toBeGreaterThan(1);
    expect(collapseAll).toBeDisabled();
    expect(expandAll).not.toBeDisabled();

    fireEvent.click(expandAll);

    expect(resultControls.getAllByRole("button", { expanded: true }).length).toBeGreaterThan(1);
    expect(resultControls.queryAllByRole("button", { expanded: false })).toHaveLength(0);
    expect(expandAll).toBeDisabled();
    expect(collapseAll).not.toBeDisabled();
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

function stateWithBuildProfessions(primary: number, secondary: number | null): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    build: {
      ...state.build,
      primaryProfessionId: catalogId<"Profession">(primary),
      secondaryProfessionId: secondary === null ? null : catalogId<"Profession">(secondary)
    }
  };
}

function createDataTransfer() {
  const data = new Map<string, string>();
  return {
    dropEffect: "none",
    effectAllowed: "all",
    setData: (type: string, value: string) => data.set(type, value),
    getData: (type: string) => data.get(type) ?? "",
    setDragImage: vi.fn()
  };
}
