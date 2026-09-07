import { useState, type Dispatch } from "react";

import { catalogId, isSkillTypeId } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { selectSkillBrowser, selectSkillDisplay } from "../editor-selectors";
import type {
  BrowserEliteFilter,
  BrowserProfessionScope,
  BrowserSortMode,
  BrowserViewMode,
  EditorAction,
  EditorState
} from "../editor-state";
import { BUILD_WARS_DRAG_MIME, browserSkillDragPayload } from "../drag-payload";
import { applySkillBarIntent } from "../skill-bar-actions";
import { advancedSkillFilterCount } from "../skill-filter-state";
import { SkillDisplay } from "./SkillDisplay";
import {
  SkillAdvancedFilterSection,
  SkillModeFilterControl,
  SkillResourceFilterControls
} from "./SkillFilterSearch";
import { SkillMetadataFilterControls } from "./SkillMetadataFilterControls";
import { setSkillIconDragImage } from "./skill-drag-image";
import { SkillTooltipTrigger } from "./SkillTooltip";

export function SkillBrowser({
  state,
  catalogs,
  dispatch
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const browser = selectSkillBrowser(state, catalogs);
  const targetSlot = selectedOrFirstEmptySlot(state);
  const [advancedFiltersExpanded, setAdvancedFiltersExpanded] = useState(false);
  const hiddenAdvancedFilterCount = advancedSkillFilterCount(state.browser.filters);

  return (
    <section className="editor-panel browser-panel" aria-labelledby="browser-title">
      <div className="panel-heading">
        <div>
          <h2 id="browser-title">Skill Browser</h2>
          <span>
            {browser.matchingCount}/{browser.totalCount} shown
          </span>
        </div>
        <div className="view-buttons" aria-label="Browser view">
          {(["list", "small-grid", "large-grid"] as readonly BrowserViewMode[]).map((view) => (
            <button
              key={view}
              type="button"
              className={state.browser.viewMode === view ? "active" : ""}
              aria-pressed={state.browser.viewMode === view}
              onClick={() => dispatch({ type: "set-browser-view", viewMode: view })}
            >
              {viewLabel(view)}
            </button>
          ))}
        </div>
      </div>
      <div className="browser-filters">
        <label className="wide-control">
          <span>Name</span>
          <input
            type="search"
            value={state.browser.filters.query}
            onChange={(event) =>
              dispatch({
                type: "set-browser-filters",
                filters: { query: event.currentTarget.value }
              })
            }
            placeholder="Skill name"
          />
        </label>
        <label className="wide-control">
          <span>Text</span>
          <input
            type="search"
            value={state.browser.filters.textQuery}
            onChange={(event) =>
              dispatch({
                type: "set-browser-filters",
                filters: { textQuery: event.currentTarget.value }
              })
            }
            placeholder="Text contains"
          />
        </label>
        <label>
          <span>Profession</span>
          <select
            value={professionScopeValue(state)}
            onChange={(event) =>
              dispatch({
                type: "set-browser-filters",
                filters: { professionScope: professionScopeFromValue(event.currentTarget.value) }
              })
            }
          >
            {state.browser.filters.professionScope.kind === "custom" &&
            state.browser.filters.professionScope.professionIds.length !== 1 ? (
              <option value="custom">Custom</option>
            ) : null}
            <option value="default">Selected professions</option>
            <option value="all">All</option>
            {catalogs.professions.map((profession) => (
              <option key={Number(profession.id)} value={`profession:${Number(profession.id)}`}>
                {profession.name}
              </option>
            ))}
          </select>
        </label>
        <SkillModeFilterControl state={state} dispatch={dispatch} />
        <SkillResourceFilterControls
          filters={state.browser.filters.resources}
          dispatch={dispatch}
        />
        <SkillMetadataFilterControls
          selected={state.browser.filters.metadata}
          dispatch={dispatch}
        />
        <SkillAdvancedFilterSection
          id="browser-advanced-skill-filters"
          activeCount={hiddenAdvancedFilterCount}
          expanded={advancedFiltersExpanded}
          onToggle={() => setAdvancedFiltersExpanded((expanded) => !expanded)}
        >
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
          <label>
            <span>Elite</span>
            <select
              value={state.browser.filters.elite}
              onChange={(event) =>
                dispatch({
                  type: "set-browser-filters",
                  filters: { elite: event.currentTarget.value as BrowserEliteFilter }
                })
              }
            >
              <option value="any">Any</option>
              <option value="elite">Elite</option>
              <option value="non-elite">Non-elite</option>
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
        </SkillAdvancedFilterSection>
      </div>
      {browser.matchingCount === 0 ? (
        <div className="empty-state">
          <strong>No matching skills</strong>
          <button type="button" onClick={() => dispatch({ type: "clear-browser-filters" })}>
            Reset filters
          </button>
        </div>
      ) : (
        <div className={`skill-results ${state.browser.viewMode}`}>
          {browser.groups.map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <h3 id={`group-${group.id}`}>{group.label}</h3>
              <div className="skill-result-grid">
                {group.skills.map((skill) => {
                  const view = selectSkillDisplay(catalogs, state, skill.id, "skill-browser");
                  return (
                    <SkillTooltipTrigger key={Number(skill.id)} view={view} placement="left">
                      <SkillDisplay
                        view={view}
                        compact={state.browser.viewMode !== "list"}
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
                        action={
                          <div className="skill-actions">
                            <button
                              type="button"
                              aria-label={`Place ${skill.name} in slot ${targetSlot + 1}`}
                              onClick={() => {
                                applySkillBarIntent(state, catalogs, dispatch, {
                                  kind: "catalog-skill",
                                  skillId: skill.id,
                                  toIndex: targetSlot
                                });
                              }}
                            >
                              Place
                            </button>
                            <button
                              type="button"
                              aria-label={`Pick ${skill.name} for keyboard placement`}
                              onClick={() =>
                                dispatch({
                                  type: "pick-keyboard",
                                  placement: { kind: "browser-skill", skillId: skill.id }
                                })
                              }
                            >
                              Pick
                            </button>
                            <button
                              type="button"
                              aria-label={`Open ${skill.name} details`}
                              onClick={() =>
                                dispatch({ type: "set-tooltip", skillId: skill.id, pinned: true })
                              }
                            >
                              Details
                            </button>
                          </div>
                        }
                      />
                    </SkillTooltipTrigger>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function selectedOrFirstEmptySlot(state: EditorState): number {
  if (state.selectedSlotIndex !== null) {
    return state.selectedSlotIndex;
  }
  const emptyIndex = state.build.skillBar.findIndex((slot) => slot === null);
  return emptyIndex >= 0 ? emptyIndex : 0;
}

function professionScopeValue(state: EditorState): string {
  const scope = state.browser.filters.professionScope;
  if (scope.kind === "custom") {
    return scope.professionIds.length === 1
      ? `profession:${Number(scope.professionIds[0])}`
      : "custom";
  }
  return scope.kind;
}

function professionScopeFromValue(value: string): BrowserProfessionScope {
  if (value === "default" || value === "all") {
    return { kind: value };
  }
  if (value === "custom") {
    return { kind: "all" };
  }
  const numericId = Number(value.replace("profession:", ""));
  return { kind: "custom", professionIds: [catalogId<"Profession">(numericId)] };
}

function viewLabel(view: BrowserViewMode): string {
  if (view === "small-grid") {
    return "Compact";
  }
  if (view === "large-grid") {
    return "Expanded";
  }
  return "List";
}
