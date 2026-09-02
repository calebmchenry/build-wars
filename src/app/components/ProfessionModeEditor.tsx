import type { Dispatch } from "react";

import { catalogId, type ProfessionId, type ValidationResult } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { issuesForLocation } from "../editor-selectors";
import type { EditorAction, EditorState } from "../editor-state";

export function ProfessionModeEditor({
  state,
  catalogs,
  validation,
  dispatch
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly validation: ValidationResult;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const primaryIssues = issuesForLocation(validation.issues, {
    kind: "profession",
    field: "primary"
  });
  const secondaryIssues = issuesForLocation(validation.issues, {
    kind: "profession",
    field: "secondary"
  });

  return (
    <section className="editor-panel character-panel" aria-labelledby="character-title">
      <div className="panel-heading">
        <h2 id="character-title">Character</h2>
        <span>{state.build.mode.toUpperCase()}</span>
      </div>
      <div className="control-grid">
        <label>
          <span>Primary</span>
          <select
            value={idValue(state.build.primaryProfessionId)}
            onChange={(event) =>
              dispatch({
                type: "set-profession",
                field: "primary",
                professionId: professionValue(event.currentTarget.value)
              })
            }
          >
            <option value="">None</option>
            {catalogs.professions.map((profession) => (
              <option key={Number(profession.id)} value={Number(profession.id)}>
                {profession.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Secondary</span>
          <select
            value={idValue(state.build.secondaryProfessionId)}
            onChange={(event) =>
              dispatch({
                type: "set-profession",
                field: "secondary",
                professionId: professionValue(event.currentTarget.value)
              })
            }
          >
            <option value="">None</option>
            {catalogs.professions.map((profession) => (
              <option key={Number(profession.id)} value={Number(profession.id)}>
                {profession.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="segmented-control">
        <legend>Mode</legend>
        {(["pve", "pvp", "unknown"] as const).map((mode) => (
          <label key={mode}>
            <input
              type="radio"
              name="build-mode"
              checked={state.build.mode === mode}
              onChange={() => dispatch({ type: "set-mode", mode })}
            />
            <span>{mode.toUpperCase()}</span>
          </label>
        ))}
      </fieldset>
      <InlineIssues issues={[...primaryIssues, ...secondaryIssues]} />
    </section>
  );
}

export function InlineIssues({
  issues
}: {
  readonly issues: readonly { readonly message: string }[];
}) {
  return (
    <div className="inline-issues" aria-live="polite">
      {issues.map((issue, index) => (
        <p key={`${issue.message}-${index}`}>{issue.message}</p>
      ))}
    </div>
  );
}

function professionValue(value: string): ProfessionId | null {
  return value.length === 0 ? null : catalogId<"Profession">(Number(value));
}

function idValue(value: ProfessionId | null): string {
  return value === null ? "" : String(Number(value));
}
