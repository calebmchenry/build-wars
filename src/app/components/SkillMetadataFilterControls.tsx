import type { Dispatch } from "react";

import {
  SKILL_METADATA_FILTER_GROUPS,
  type SkillMetadataFilterGroup,
  type SkillMetadataToken
} from "../../domain";
import type { EditorAction } from "../editor-state";

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
  const selectedTokens = new Set(selected);
  return (
    <fieldset className="skill-metadata-filter-group">
      <legend>{group.label}</legend>
      <div className="skill-metadata-filter-options">
        {group.options.map((option) => (
          <label key={option.token} className="metadata-checkbox-row">
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
    </fieldset>
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
