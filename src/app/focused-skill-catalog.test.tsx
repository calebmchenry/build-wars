import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";

import { catalogId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { FocusedSkillCatalog } from "./components/FocusedSkillCatalog";
import { BUILD_WARS_DRAG_MIME, parseDragPayload } from "./drag-payload";
import { selectSkillBrowser } from "./editor-selectors";
import { createBlankEditorState, editorReducer, type EditorState } from "./editor-state";

const catalogs = requireReadyCatalogs();

describe("FocusedSkillCatalog", () => {
  it("renders the full all-playable view when both professions are Any", () => {
    render(<Harness />);

    expect(screen.getByRole("tab", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skills Catalog" })).toBeInTheDocument();
    expect(screen.queryByText(/shown from/)).not.toBeInTheDocument();
    expect(screen.queryByText(/[0-9]+ visible/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/\([0-9]+ Skills\)$/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Resurrection Signet").length).toBeLessThanOrEqual(1);
    expect(screen.queryByRole("button", { name: /Pick/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Details/ })).not.toBeInTheDocument();
  });

  it("keeps search compact and expands filters from the icon button", () => {
    const { container } = render(<Harness initialState={stateWithBrowserQuery("Energy Drain")} />);

    expect(screen.getByPlaceholderText("Search by name...")).toBeInTheDocument();
    expect(screen.queryByText("Search")).not.toBeInTheDocument();
    expect(screen.queryByText("Professions")).not.toBeInTheDocument();

    const filterButton = screen.getByRole("button", { name: "Show skill filters" });
    expect(filterButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(filterButton);

    expect(screen.getByRole("button", { name: "Hide skill filters" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByLabelText("Professions")).toBeInTheDocument();
    expect(screen.getByLabelText("Attribute")).toBeInTheDocument();
    expect(screen.getByLabelText("Mode")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Build mode" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "PvE + PvP" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Any" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Elite" }));

    expect(screen.getByRole("button", { name: "Hide skill filters (1 active)" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(container.querySelector(".filter-active-count")).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByRole("button", { name: "Hide skill filters" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByRole("button", { name: "Any" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".filter-active-count")).toBeNull();
  });

  it("renders all matching skills without a show-more button", () => {
    const initialState = createBlankEditorState();
    const expectedCount = selectSkillBrowser(initialState, catalogs).matchingCount;
    const { container } = render(<Harness initialState={initialState} />);

    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(expectedCount);

    const results = container.querySelector(".focused-skill-results");
    expect(results).not.toBeNull();
    fireEvent.scroll(results!);

    expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(expectedCount);
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
