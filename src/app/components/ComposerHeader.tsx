import { useState, type Dispatch, type KeyboardEvent } from "react";

import type { ValidationResult } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { issuesForLocation } from "../editor-selectors";
import type { EditorAction, EditorState } from "../editor-state";
import { InlineIssues } from "./ProfessionModeEditor";
import { ProfessionIconPicker } from "./ProfessionIconPicker";

export function ComposerHeader({
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
  const professionIssues = [
    ...issuesForLocation(validation.issues, { kind: "profession", field: "primary" }),
    ...issuesForLocation(validation.issues, { kind: "profession", field: "secondary" })
  ];

  return (
    <section className="composer-header" aria-label="Build header">
      <BuildNameField
        key={`${state.build.id}:${state.build.name}`}
        name={state.build.name}
        onCommit={(name) => dispatch({ type: "set-build-name", name })}
      />
      <div className="profession-pair">
        <ProfessionIconPicker
          label="Primary"
          value={state.build.primaryProfessionId}
          raw={state.rawTemplate.primaryProfession}
          resetKey={state.build.id}
          catalogs={catalogs}
          onChange={(professionId) =>
            dispatch({ type: "set-profession", field: "primary", professionId })
          }
        />
        <span className="profession-pair-separator" aria-hidden="true">
          /
        </span>
        <ProfessionIconPicker
          label="Secondary"
          value={state.build.secondaryProfessionId}
          raw={state.rawTemplate.secondaryProfession}
          resetKey={state.build.id}
          catalogs={catalogs}
          onChange={(professionId) =>
            dispatch({ type: "set-profession", field: "secondary", professionId })
          }
        />
      </div>
      {professionIssues.length > 0 ? <InlineIssues issues={professionIssues} /> : null}
    </section>
  );
}

function BuildNameField({
  name,
  onCommit
}: {
  readonly name: string;
  readonly onCommit: (name: string) => void;
}) {
  const [nameDraft, setNameDraft] = useState(name);
  const commitName = () => onCommit(nameDraft);
  const cancelName = () => setNameDraft(name);

  return (
    <div className="build-name-field">
      <input
        aria-label="Build name"
        value={nameDraft}
        maxLength={120}
        onChange={(event) => setNameDraft(event.currentTarget.value)}
        onBlur={commitName}
        onKeyDown={(event) => handleNameKeyDown(event, commitName, cancelName)}
      />
    </div>
  );
}

function handleNameKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
  commitName: () => void,
  cancelName: () => void
): void {
  if (event.key === "Enter") {
    event.preventDefault();
    commitName();
    event.currentTarget.blur();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    cancelName();
    event.currentTarget.blur();
  }
}
