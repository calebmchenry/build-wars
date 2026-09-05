import { useState, type Dispatch, type KeyboardEvent } from "react";

import { catalogId, isSkillTypeId, type SkillId } from "../../domain";
import filterIcon from "../assets/funnel.svg";
import type { AppCatalogViews } from "../catalogs";
import { BUILD_WARS_DRAG_MIME, browserSkillDragPayload } from "../drag-payload";
import { selectSkillBrowser, selectSkillDisplay } from "../editor-selectors";
import type {
  BrowserAvailabilityFilter,
  BrowserEliteFilter,
  BrowserFilters,
  BrowserProfessionScope,
  BrowserSortMode,
  EditorAction,
  EditorState
} from "../editor-state";
import { applySkillBarIntent } from "../skill-bar-actions";
import { SkillDisplay } from "./SkillDisplay";
import { SkillMetadataFilterControls } from "./SkillMetadataFilterControls";
import { setSkillIconDragImage } from "./skill-drag-image";
import { SkillTooltipTrigger } from "./SkillTooltip";

const ELITE_FILTER_OPTIONS: readonly {
  readonly value: BrowserEliteFilter;
  readonly label: string;
}[] = [
  { value: "any", label: "Any" },
  { value: "elite", label: "Elite" },
  { value: "non-elite", label: "Non-elite" }
];

export function FocusedSkillCatalog({
  state,
  catalogs,
  dispatch
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const browser = selectSkillBrowser(state, catalogs);
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(() => new Set());
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const targetSlot = selectedOrFirstEmptySlot(state);
  const activeFilterCount = focusedFilterActiveCount(state.browser.filters);
  const filterButtonLabel =
    activeFilterCount === 0
      ? filtersExpanded
        ? "Hide skill filters"
        : "Show skill filters"
      : `${filtersExpanded ? "Hide" : "Show"} skill filters (${activeFilterCount} active)`;

  return (
    <section className="catalog-panel focused-skill-catalog" aria-labelledby="catalog-title">
      <h2 id="catalog-title" className="sr-only">
        Skills Catalog
      </h2>
      <div className="catalog-tabs" role="tablist" aria-label="Catalog tabs">
        <button type="button" role="tab" aria-selected="true">
          Skills
        </button>
      </div>
      <div className="focused-catalog-search-row">
        <input
          type="search"
          value={state.browser.filters.query}
          aria-label="Search"
          onChange={(event) =>
            dispatch({
              type: "set-browser-filters",
              filters: { query: event.currentTarget.value }
            })
          }
          placeholder="Search by name..."
        />
        <button
          type="button"
          className="icon-button catalog-filter-button"
          aria-label={filterButtonLabel}
          aria-expanded={filtersExpanded}
          aria-controls="focused-skill-filters"
          onClick={() => setFiltersExpanded((expanded) => !expanded)}
        >
          <img
            className="filter-icon"
            src={filterIcon}
            alt=""
            draggable={false}
            aria-hidden="true"
          />
          {activeFilterCount > 0 ? (
            <span className="filter-active-count" aria-hidden="true">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>
      {filtersExpanded ? (
        <div id="focused-skill-filters" className="focused-catalog-controls advanced-controls">
          <label>
            <span>Text</span>
            <input
              type="search"
              value={state.browser.filters.textQuery}
              aria-label="Text"
              onChange={(event) =>
                dispatch({
                  type: "set-browser-filters",
                  filters: { textQuery: event.currentTarget.value }
                })
              }
              placeholder="Text contains..."
            />
          </label>
          <label>
            <span>Professions</span>
            <select
              value={professionScopeValue(state)}
              onChange={(event) =>
                dispatch({
                  type: "set-browser-filters",
                  filters: { professionScope: professionScopeFromValue(event.currentTarget.value) }
                })
              }
            >
              <option value="default">Build professions</option>
              <option value="all">All professions</option>
              {catalogs.professions.map((profession) => (
                <option key={Number(profession.id)} value={`profession:${Number(profession.id)}`}>
                  {profession.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Attribute</span>
            <select
              value={
                state.browser.filters.attributeId === null
                  ? ""
                  : Number(state.browser.filters.attributeId)
              }
              onChange={(event) =>
                dispatch({
                  type: "set-browser-filters",
                  filters: {
                    attributeId:
                      event.currentTarget.value.length === 0
                        ? null
                        : catalogId<"Attribute">(Number(event.currentTarget.value))
                  }
                })
              }
            >
              <option value="">Any</option>
              {browser.availableAttributes.map((attribute) => (
                <option key={Number(attribute.id)} value={Number(attribute.id)}>
                  {attribute.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Type</span>
            <select
              value={state.browser.filters.skillType ?? ""}
              onChange={(event) => {
                const value = event.currentTarget.value;
                dispatch({
                  type: "set-browser-filters",
                  filters: { skillType: isSkillTypeId(value) ? value : null }
                });
              }}
            >
              <option value="">Any</option>
              {browser.availableTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="focused-filter-segment">
            <legend>Elite</legend>
            <div className="filter-segment-buttons">
              {ELITE_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={state.browser.filters.elite === option.value ? "active" : ""}
                  aria-pressed={state.browser.filters.elite === option.value}
                  onClick={() =>
                    dispatch({
                      type: "set-browser-filters",
                      filters: { elite: option.value }
                    })
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            <span>Mode</span>
            <select
              value={state.browser.filters.availability}
              onChange={(event) =>
                dispatch({
                  type: "set-browser-filters",
                  filters: { availability: event.currentTarget.value as BrowserAvailabilityFilter }
                })
              }
            >
              <option value="default">Build mode</option>
              <option value="both">PvE + PvP</option>
              <option value="pve-only">PvE only</option>
              <option value="pvp-only">PvP only</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select
              value={state.browser.filters.sortMode}
              onChange={(event) =>
                dispatch({
                  type: "set-browser-filters",
                  filters: { sortMode: event.currentTarget.value as BrowserSortMode }
                })
              }
            >
              <option value="attribute">Attribute</option>
              <option value="name">Name</option>
              <option value="type">Type</option>
            </select>
          </label>
          <SkillMetadataFilterControls
            selected={state.browser.filters.metadata}
            dispatch={dispatch}
          />
          {activeFilterCount > 0 ? (
            <button
              type="button"
              className="clear-focused-filters-button"
              onClick={() => clearFocusedCatalogFilters(dispatch)}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}
      {browser.matchingCount === 0 ? (
        <div className="empty-state">
          <strong>No matching skills</strong>
          <button type="button" onClick={() => dispatch({ type: "clear-browser-filters" })}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="focused-skill-results">
          {browser.groups.map((group) => {
            const collapsed = collapsedGroups.has(group.id);
            const skillCountLabel = `${group.skills.length} ${
              group.skills.length === 1 ? "Skill" : "Skills"
            }`;
            return (
              <section key={group.id} className="focused-skill-group">
                <button
                  type="button"
                  className="skill-group-toggle"
                  aria-expanded={!collapsed}
                  aria-label={`${collapsed ? "Expand" : "Collapse"} ${group.label} (${skillCountLabel})`}
                  onClick={() =>
                    setCollapsedGroups((current) => toggledGroupSet(current, group.id))
                  }
                >
                  <span className="skill-group-symbol" aria-hidden="true">
                    {collapsed ? "+" : "-"}
                  </span>
                  <span className="skill-group-label">
                    {group.label} ({skillCountLabel})
                  </span>
                </button>
                {collapsed ? null : (
                  <div className="focused-skill-list">
                    {group.skills.map((skill) => {
                      const view = selectSkillDisplay(catalogs, state, skill.id, "skill-browser");
                      return (
                        <SkillTooltipTrigger
                          key={Number(skill.id)}
                          view={view}
                          placement="left"
                          className="focused-skill-row"
                          role="button"
                          tabIndex={0}
                          aria-label={`Add ${skill.name} to slot ${targetSlot + 1}`}
                          onClick={() =>
                            placeCatalogSkill(state, catalogs, dispatch, skill.id, targetSlot)
                          }
                          onKeyDown={(event) =>
                            placeCatalogSkillFromKeyboard(
                              event,
                              state,
                              catalogs,
                              dispatch,
                              skill.id,
                              targetSlot
                            )
                          }
                        >
                          <SkillDisplay
                            view={view}
                            compact
                            iconDragHandle={{
                              label: `Drag ${skill.name}`,
                              onDragStart: (event) => {
                                event.dataTransfer.setData(
                                  BUILD_WARS_DRAG_MIME,
                                  browserSkillDragPayload(skill.id)
                                );
                                setSkillIconDragImage(event);
                                dispatch({
                                  type: "start-drag",
                                  drag: { kind: "browser-skill", skillId: skill.id }
                                });
                              },
                              onDragEnd: () => dispatch({ type: "cancel-drag" })
                            }}
                          />
                        </SkillTooltipTrigger>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

function toggledGroupSet(current: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

function focusedFilterActiveCount(filters: BrowserFilters): number {
  return [
    filters.textQuery.trim().length > 0,
    filters.professionScope.kind !== "default",
    filters.attributeId !== null,
    filters.skillType !== null,
    filters.elite !== "any",
    filters.availability !== "default",
    ...filters.metadata.map(() => true),
    filters.sortMode !== "attribute"
  ].filter(Boolean).length;
}

function clearFocusedCatalogFilters(dispatch: Dispatch<EditorAction>): void {
  dispatch({
    type: "set-browser-filters",
    filters: {
      textQuery: "",
      professionScope: { kind: "default" },
      attributeId: null,
      skillType: null,
      elite: "any",
      availability: "default",
      metadata: [],
      sortMode: "attribute"
    }
  });
}

function selectedOrFirstEmptySlot(state: EditorState): number {
  if (state.selectedSlotIndex !== null) {
    return state.selectedSlotIndex;
  }
  const emptyIndex = state.build.skillBar.findIndex((slot) => slot === null);
  return emptyIndex >= 0 ? emptyIndex : 0;
}

function placeCatalogSkill(
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>,
  skillId: SkillId,
  targetSlot: number
): void {
  applySkillBarIntent(state, catalogs, dispatch, {
    kind: "catalog-skill",
    skillId,
    toIndex: targetSlot
  });
}

function placeCatalogSkillFromKeyboard(
  event: KeyboardEvent<HTMLElement>,
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>,
  skillId: SkillId,
  targetSlot: number
): void {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  event.preventDefault();
  placeCatalogSkill(state, catalogs, dispatch, skillId, targetSlot);
}

function professionScopeValue(state: EditorState): string {
  const scope = state.browser.filters.professionScope;
  return scope.kind === "profession" ? `profession:${Number(scope.professionId)}` : scope.kind;
}

function professionScopeFromValue(value: string): BrowserProfessionScope {
  if (value === "default" || value === "all") {
    return { kind: value };
  }
  const numericId = Number(value.replace("profession:", ""));
  return { kind: "profession", professionId: catalogId<"Profession">(numericId) };
}
