import { useMemo, useState, type Dispatch, type DragEvent } from "react";

import { catalogId } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { BUILD_WARS_DRAG_MIME, browserSkillDragPayload } from "../drag-payload";
import { selectSkillBrowser, selectSkillDisplay } from "../editor-selectors";
import type {
  BrowserAvailabilityFilter,
  BrowserEliteFilter,
  BrowserProfessionScope,
  BrowserSortMode,
  EditorAction,
  EditorState
} from "../editor-state";
import { applySkillBarIntent } from "../skill-bar-actions";
import { SkillDisplay } from "./SkillDisplay";

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
  const targetSlot = selectedOrFirstEmptySlot(state);
  const renderedSkillCount = useMemo(
    () =>
      browser.groups.reduce(
        (total, group) => (collapsedGroups.has(group.id) ? total : total + group.skills.length),
        0
      ),
    [browser.groups, collapsedGroups]
  );

  return (
    <section className="catalog-panel focused-skill-catalog" aria-labelledby="catalog-title">
      <div className="catalog-tabs" role="tablist" aria-label="Catalog tabs">
        <button type="button" role="tab" aria-selected="true" id="catalog-title">
          Skills
        </button>
      </div>
      <div className="panel-heading compact-heading">
        <div>
          <h2>Skills Catalog</h2>
          <span>
            {browser.renderedCount}/{browser.matchingCount} shown from {browser.totalCount}
          </span>
        </div>
        <span className="catalog-batch-note">{renderedSkillCount} visible</span>
      </div>
      <div className="focused-catalog-controls">
        <label className="wide-control">
          <span>Search</span>
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
        <label>
          <span>Scope</span>
          <select
            value={professionScopeValue(state)}
            onChange={(event) =>
              dispatch({
                type: "set-browser-filters",
                filters: { professionScope: professionScopeFromValue(event.currentTarget.value) }
              })
            }
          >
            <option value="default">Selected professions</option>
            <option value="all">All professions</option>
            {catalogs.professions.map((profession) => (
              <option key={Number(profession.id)} value={`profession:${Number(profession.id)}`}>
                {profession.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <details className="catalog-filter-disclosure">
        <summary>Filters</summary>
        <div className="focused-catalog-controls advanced-controls">
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
              onChange={(event) =>
                dispatch({
                  type: "set-browser-filters",
                  filters: { skillType: event.currentTarget.value || null }
                })
              }
            >
              <option value="">Any</option>
              {browser.availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
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
            <span>Availability</span>
            <select
              value={state.browser.filters.availability}
              onChange={(event) =>
                dispatch({
                  type: "set-browser-filters",
                  filters: { availability: event.currentTarget.value as BrowserAvailabilityFilter }
                })
              }
            >
              <option value="default">Mode default</option>
              <option value="both">Both</option>
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
        </div>
      </details>
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
            return (
              <section key={group.id} className="focused-skill-group">
                <button
                  type="button"
                  className="skill-group-toggle"
                  aria-expanded={!collapsed}
                  onClick={() =>
                    setCollapsedGroups((current) => toggledGroupSet(current, group.id))
                  }
                >
                  <span>{group.label}</span>
                  <small>{group.skills.length}</small>
                </button>
                {collapsed ? null : (
                  <div className="focused-skill-list">
                    {group.skills.map((skill) => {
                      const view = selectSkillDisplay(catalogs, state, skill.id, "skill-browser");
                      return (
                        <div
                          key={Number(skill.id)}
                          className="focused-skill-row"
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData(
                              BUILD_WARS_DRAG_MIME,
                              browserSkillDragPayload(skill.id)
                            );
                            setLocalDragImage(event, skill.name);
                            dispatch({
                              type: "start-drag",
                              drag: { kind: "browser-skill", skillId: skill.id }
                            });
                          }}
                          onDragEnd={() => dispatch({ type: "cancel-drag" })}
                        >
                          <SkillDisplay
                            view={view}
                            compact
                            action={
                              <div className="skill-actions">
                                <button
                                  type="button"
                                  aria-label={`Place ${skill.name} in slot ${targetSlot + 1}`}
                                  onClick={() =>
                                    applySkillBarIntent(state, catalogs, dispatch, {
                                      kind: "catalog-skill",
                                      skillId: skill.id,
                                      toIndex: targetSlot
                                    })
                                  }
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
                                    dispatch({
                                      type: "set-tooltip",
                                      skillId: skill.id,
                                      pinned: true
                                    })
                                  }
                                >
                                  Details
                                </button>
                              </div>
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
          {browser.hasMore ? (
            <button
              type="button"
              className="show-more"
              onClick={() => dispatch({ type: "show-more-browser-results" })}
            >
              Show more
            </button>
          ) : null}
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

function selectedOrFirstEmptySlot(state: EditorState): number {
  if (state.selectedSlotIndex !== null) {
    return state.selectedSlotIndex;
  }
  const emptyIndex = state.build.skillBar.findIndex((slot) => slot === null);
  return emptyIndex >= 0 ? emptyIndex : 0;
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

function setLocalDragImage(event: DragEvent<HTMLElement>, label: string): void {
  if (event.dataTransfer.setDragImage === undefined || typeof document === "undefined") {
    return;
  }
  const preview = document.createElement("div");
  preview.className = "drag-preview";
  preview.textContent = label;
  document.body.append(preview);
  event.dataTransfer.setDragImage(preview, 18, 18);
  window.setTimeout(() => preview.remove(), 0);
}
