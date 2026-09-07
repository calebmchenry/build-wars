import {
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent,
  type ReactNode
} from "react";

import type { CatalogProfessionRecord } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import type {
  EditorAction,
  EditorState,
  ResourceFilterKind,
  ResourceFilterValue
} from "../editor-state";
import {
  availabilityControlValue,
  availabilityFilterFromControlValue,
  professionIdsForFilterEditing,
  removeSkillFilterChip,
  RESOURCE_FILTER_LABELS,
  RESOURCE_FILTERS,
  selectActiveSkillFilterChips,
  toggleProfessionFilter,
  type SkillFilterChip
} from "../skill-filter-state";
import { CatalogIcon } from "./CatalogIcon";
import { useOutsidePointerDown } from "./useOutsidePointerDown";
import { useViewportAwarePopover } from "./useViewportAwarePopover";

const MAX_VISIBLE_FILTER_CHIPS = 3;

export function SkillAdvancedFilterSection({
  id,
  activeCount,
  expanded,
  onToggle,
  children
}: {
  readonly id: string;
  readonly activeCount: number;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}) {
  return (
    <div className="advanced-filter-section">
      <button
        type="button"
        className={`advanced-filter-toggle${activeCount > 0 ? " active" : ""}`}
        aria-expanded={expanded}
        aria-controls={id}
        onClick={onToggle}
      >
        {`Advanced filters (${activeCount})`}
      </button>
      {expanded ? (
        <div id={id} className="advanced-filter-grid">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function SkillFilterSearchInput({
  state,
  catalogs,
  dispatch
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chips = selectActiveSkillFilterChips(state, catalogs);
  const visibleChips = chips.slice(0, MAX_VISIBLE_FILTER_CHIPS);
  const overflowChips = chips.slice(MAX_VISIBLE_FILTER_CHIPS);

  useOutsidePointerDown(overflowOpen, rootRef, () => setOverflowOpen(false));

  return (
    <div
      ref={rootRef}
      className="skill-token-search"
      data-has-chips={chips.length > 0 ? "true" : "false"}
    >
      {visibleChips.map((chip) => (
        <SkillFilterChipView
          key={chip.key}
          chip={chip}
          catalogs={catalogs}
          onRemove={() => removeSkillFilterChip(chip, state, catalogs, dispatch)}
        />
      ))}
      {overflowChips.length > 0 ? (
        <>
          <button
            type="button"
            className="skill-filter-overflow-chip"
            aria-label={`${overflowChips.length} hidden skill filters`}
            aria-expanded={overflowOpen}
            onClick={() => setOverflowOpen((open) => !open)}
          >
            +{overflowChips.length} filters
          </button>
          {overflowOpen ? (
            <div className="skill-filter-overflow-popover" role="menu">
              {overflowChips.map((chip) => (
                <SkillFilterChipView
                  key={chip.key}
                  chip={chip}
                  catalogs={catalogs}
                  onRemove={() => removeSkillFilterChip(chip, state, catalogs, dispatch)}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
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
        onKeyDown={(event) => removeLastFilterOnBackspace(event, chips, state, catalogs, dispatch)}
        placeholder={chips.length > 0 ? "Search..." : "Search by name..."}
      />
    </div>
  );
}

export function SkillProfessionFilterMenu({
  state,
  catalogs,
  dispatch
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const [open, setOpen] = useState(false);
  const { anchorRef, popoverRef } = useViewportAwarePopover(open);
  const selectedProfessionIds = new Set(
    professionIdsForFilterEditing(state, catalogs).map((professionId) => Number(professionId))
  );
  const active = selectedProfessionIds.size > 0;

  useOutsidePointerDown(open, anchorRef, () => setOpen(false));

  return (
    <div ref={anchorRef} className="filter-menu-control">
      <span>Profession</span>
      <button
        type="button"
        className={`filter-menu-button${active ? " active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        Profession
      </button>
      {open ? (
        <div
          ref={popoverRef}
          className="filter-menu-popover profession-filter-menu"
          role="group"
          aria-label="Profession filters"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
            }
          }}
        >
          {catalogs.professions.map((profession) => (
            <label key={Number(profession.id)} className="filter-menu-checkbox">
              <input
                type="checkbox"
                checked={selectedProfessionIds.has(Number(profession.id))}
                onChange={() => toggleProfessionFilter(state, catalogs, dispatch, profession)}
              />
              <CatalogIcon
                descriptor={catalogs.placeholders.profession(profession)}
                className="filter-menu-profession-icon"
              />
              <span>{profession.name}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SkillModeFilterControl({
  state,
  dispatch
}: {
  readonly state: EditorState;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  return (
    <label>
      <span>Mode</span>
      <select
        value={availabilityControlValue(state)}
        onChange={(event) =>
          dispatch({
            type: "set-browser-filters",
            filters: {
              availability: availabilityFilterFromControlValue(event.currentTarget.value, state)
            }
          })
        }
      >
        <option value="all">All modes</option>
        <option value="pve">PvE</option>
        <option value="pvp">PvP</option>
        <option value="both">Both modes only</option>
        <option value="pve-only">PvE-only skills</option>
        <option value="pvp-only">PvP-only skills</option>
        <option value="unknown">Unknown</option>
      </select>
    </label>
  );
}

export function SkillResourceFilterControls({
  filters,
  dispatch
}: {
  readonly filters: Readonly<Record<ResourceFilterKind, ResourceFilterValue>>;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const [open, setOpen] = useState(false);
  const { anchorRef, popoverRef } = useViewportAwarePopover(open);
  const selectedCount = RESOURCE_FILTERS.filter((resource) => filters[resource] !== "any").length;
  const active = selectedCount > 0;

  useOutsidePointerDown(open, anchorRef, () => setOpen(false));

  return (
    <div ref={anchorRef} className="filter-menu-control">
      <span>Cost</span>
      <button
        type="button"
        className={`filter-menu-button${active ? " active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={selectedCount === 0 ? "Cost filters" : `${selectedCount} cost filters selected`}
        onClick={() => setOpen((current) => !current)}
      >
        {selectedCount === 0 ? "Cost" : `Cost (${selectedCount})`}
      </button>
      {open ? (
        <div
          ref={popoverRef}
          className="filter-menu-popover cost-filter-menu"
          role="group"
          aria-label="Cost filters"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
            }
          }}
        >
          {RESOURCE_FILTERS.map((resource) => (
            <label key={resource} className="filter-menu-checkbox">
              <input
                type="checkbox"
                checked={filters[resource] !== "any"}
                onChange={() =>
                  dispatch({
                    type: "set-resource-filter",
                    resource,
                    value: filters[resource] === "any" ? "explicit" : "any"
                  })
                }
              />
              <span>{RESOURCE_FILTER_LABELS[resource]}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SkillFilterChipView({
  chip,
  catalogs,
  onRemove
}: {
  readonly chip: SkillFilterChip;
  readonly catalogs: AppCatalogViews;
  readonly onRemove: () => void;
}) {
  const chipStyle = chip.kind === "profession" ? professionChipStyle(chip.profession) : undefined;
  return (
    <span
      className="skill-filter-chip"
      data-chip-kind={chip.kind}
      title={chip.label}
      style={chipStyle}
    >
      {chip.kind === "profession" ? (
        <CatalogIcon
          descriptor={catalogs.placeholders.profession(chip.profession)}
          className="skill-filter-chip-icon"
        />
      ) : null}
      <span className="skill-filter-chip-label">{chip.label}</span>
      <button
        type="button"
        className="skill-filter-chip-remove"
        aria-label={`Remove ${chip.label} filter`}
        onClick={onRemove}
      >
        x
      </button>
    </span>
  );
}

function removeLastFilterOnBackspace(
  event: KeyboardEvent<HTMLInputElement>,
  chips: readonly SkillFilterChip[],
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>
): void {
  if (event.key !== "Backspace" || event.currentTarget.value.length > 0 || chips.length === 0) {
    return;
  }
  event.preventDefault();
  removeSkillFilterChip(chips[chips.length - 1]!, state, catalogs, dispatch);
}

function professionChipStyle(profession: CatalogProfessionRecord): CSSProperties {
  const colors = PROFESSION_CHIP_COLORS[profession.name] ?? DEFAULT_PROFESSION_CHIP_COLORS;
  return {
    "--skill-filter-chip-bg": colors.background,
    "--skill-filter-chip-border": colors.border,
    "--skill-filter-chip-text": colors.text
  } as CSSProperties;
}

const DEFAULT_PROFESSION_CHIP_COLORS = {
  background: "#36433c",
  border: "#aeb8b1",
  text: "#f4ead2"
};

const PROFESSION_CHIP_COLORS: Readonly<
  Record<string, { readonly background: string; readonly border: string; readonly text: string }>
> = {
  Warrior: { background: "#5b4626", border: "#d7b84f", text: "#fff08b" },
  Ranger: { background: "#334b2d", border: "#9fd367", text: "#dbff9d" },
  Monk: { background: "#304861", border: "#8ebbe5", text: "#e2f2ff" },
  Necromancer: { background: "#263f34", border: "#78bd8a", text: "#d6f7df" },
  Mesmer: { background: "#49325c", border: "#c691ef", text: "#f2ddff" },
  Elementalist: { background: "#5b342c", border: "#e48761", text: "#ffe1d2" },
  Assassin: { background: "#4f2449", border: "#ff5fbd", text: "#ffd9ef" },
  Ritualist: { background: "#284851", border: "#72cddd", text: "#ddf9ff" },
  Paragon: { background: "#594928", border: "#d7b65d", text: "#ffedb2" },
  Dervish: { background: "#2d3448", border: "#8ea7d5", text: "#e7efff" }
};
