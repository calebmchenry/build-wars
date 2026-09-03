import { useState, type Dispatch, type KeyboardEvent } from "react";

import type { GameMode, ValidationResult } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { issuesForLocation } from "../editor-selectors";
import type { EditorAction, EditorState } from "../editor-state";
import type { ComposerLoadoutContext } from "../composer-selectors";
import { InlineIssues } from "./ProfessionModeEditor";
import { ProfessionIconPicker } from "./ProfessionIconPicker";

export function ComposerHeader({
  state,
  catalogs,
  validation,
  context,
  dispatch
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly validation: ValidationResult;
  readonly context: ComposerLoadoutContext;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const professionIssues = [
    ...issuesForLocation(validation.issues, { kind: "profession", field: "primary" }),
    ...issuesForLocation(validation.issues, { kind: "profession", field: "secondary" })
  ];

  return (
    <section className="composer-header" aria-label="Build header">
      <div className="composer-title-block">
        <p className="eyebrow">{contextLabel(context)}</p>
        <BuildNameField
          key={`${state.build.id}:${state.build.name}`}
          name={state.build.name}
          onCommit={(name) => dispatch({ type: "set-build-name", name })}
        />
      </div>
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
      <fieldset className="segmented-control composer-mode-control">
        <legend>Mode</legend>
        {(["pve", "pvp", "unknown"] as const).map((mode) => (
          <label key={mode}>
            <input
              type="radio"
              name="composer-build-mode"
              checked={state.build.mode === mode}
              onChange={() => dispatch({ type: "set-mode", mode })}
            />
            <span>{modeLabel(mode)}</span>
          </label>
        ))}
      </fieldset>
      <InlineIssues issues={professionIssues} />
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
    <label className="build-name-field">
      <span>Build name</span>
      <input
        value={nameDraft}
        maxLength={120}
        onChange={(event) => setNameDraft(event.currentTarget.value)}
        onBlur={commitName}
        onKeyDown={(event) => handleNameKeyDown(event, commitName, cancelName)}
      />
    </label>
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

function contextLabel(context: ComposerLoadoutContext): string {
  if (context.kind === "single-build") {
    return "Focused composer";
  }
  if (context.kind === "party-slot") {
    return `Party slot - ${context.label}`;
  }
  if (context.kind === "build-set-entry") {
    return `Build-set loadout - ${context.label}`;
  }
  return context.label;
}

function modeLabel(mode: GameMode): string {
  return mode === "unknown" ? "Unknown" : mode.toUpperCase();
}
