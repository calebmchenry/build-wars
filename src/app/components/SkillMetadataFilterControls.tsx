import { useState, type Dispatch } from "react";

import {
  SKILL_METADATA_FILTER_GROUPS,
  type SkillMetadataFilterGroup,
  type SkillMetadataToken
} from "../../domain";
import type { EditorAction } from "../editor-state";
import { useOutsidePointerDown } from "./useOutsidePointerDown";
import { useViewportAwarePopover } from "./useViewportAwarePopover";

export function SkillMetadataFilterControls({
  selected,
  dispatch
}: {
  readonly selected: readonly SkillMetadataToken[];
  readonly dispatch: Dispatch<EditorAction>;
}) {
  return (
    <div className="skill-metadata-filters" aria-label="Skill metadata filters">
      {SKILL_METADATA_FILTER_GROUPS.map((group) => (
        <SkillMetadataFilterGroupControl
          key={group.id}
          group={group}
          selected={selected}
          dispatch={dispatch}
        />
      ))}
    </div>
  );
}

function SkillMetadataFilterGroupControl({
  group,
  selected,
  dispatch
}: {
  readonly group: SkillMetadataFilterGroup;
  readonly selected: readonly SkillMetadataToken[];
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const [open, setOpen] = useState(false);
  const { anchorRef, popoverRef } = useViewportAwarePopover(open);
  const selectedTokens = new Set(selected);
  const active = group.options.some((option) => selectedTokens.has(option.token));

  useOutsidePointerDown(open, anchorRef, () => setOpen(false));

  return (
    <div ref={anchorRef} className="filter-menu-control skill-metadata-filter-group">
      <span>{group.label}</span>
      <button
        type="button"
        className={`filter-menu-button${active ? " active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {group.label}
      </button>
      {open ? (
        <div
          ref={popoverRef}
          className="filter-menu-popover metadata-filter-menu"
          data-filter-group={group.id}
          role="group"
          aria-label={`${group.label} filters`}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
            }
          }}
        >
          {group.options.map((option) => (
            <label key={option.token} className="filter-menu-checkbox">
              <input
                type="checkbox"
                checked={selectedTokens.has(option.token)}
                onChange={() =>
                  dispatch({
                    type: "set-browser-filters",
                    filters: { metadata: toggledMetadataToken(selected, option.token) }
                  })
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function toggledMetadataToken(
  selected: readonly SkillMetadataToken[],
  token: SkillMetadataToken
): readonly SkillMetadataToken[] {
  return selected.includes(token)
    ? selected.filter((selectedToken) => selectedToken !== token)
    : [...selected, token];
}
