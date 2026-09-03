import { useState, type Dispatch } from "react";

import { hasAuthoredTitleRankOverrides } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import type { ValidationView } from "../editor-selectors";
import { selectHasMeaningfulEquipment } from "../equipment-selectors";
import type { EditorAction, EditorState } from "../editor-state";
import { importSkillTemplateToEditor } from "../template-workflow";

export function InlineTemplateCode({
  state,
  catalogs,
  validation,
  dispatch,
  requestDraftReplacement,
  selectedLoadoutOnly
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly validation: ValidationView;
  readonly dispatch: Dispatch<EditorAction>;
  readonly requestDraftReplacement: (() => "cancel" | "discard") | undefined;
  readonly selectedLoadoutOnly: boolean;
}) {
  const [importDraft, setImportDraft] = useState("");
  const preferred = preferredTemplateOutput(validation);
  const output = preferred?.code?.code ?? "";
  const blockedReasons =
    preferred === null ? allBlockedReasons(validation) : preferred.blockedReasons;

  return (
    <section className="inline-template-panel" aria-labelledby="inline-template-title">
      <div className="panel-heading compact-heading">
        <div>
          <h2 id="inline-template-title">Template Code</h2>
          <span>{preferred?.label ?? "Export blocked"}</span>
        </div>
        <button
          type="button"
          aria-label="Copy template code"
          disabled={output.length === 0}
          onClick={() => copyCode(output, dispatch)}
        >
          Copy
        </button>
      </div>
      <label>
        <span>Current template output</span>
        <textarea
          readOnly
          value={output}
          rows={2}
          aria-label="Current template output"
          placeholder={blockedReasons[0] ?? "No proven template output"}
        />
      </label>
      {blockedReasons.length > 0 && output.length === 0 ? (
        <ul className="inline-blocked-reasons">
          {blockedReasons.map((reason, index) => (
            <li key={`${index}:${reason}`}>{reason}</li>
          ))}
        </ul>
      ) : null}
      {selectedLoadoutOnly ? (
        <div className="share-warning">
          <strong>Selected loadout only</strong>
          <p>
            Sibling loadouts, party metadata, equipment, title ranks, and notes use JSON transfer or
            backup.
          </p>
        </div>
      ) : null}
      <label>
        <span>Import skill template code</span>
        <textarea
          value={importDraft}
          rows={3}
          onChange={(event) => setImportDraft(event.currentTarget.value)}
          onPaste={(event) =>
            setImportDraft(event.currentTarget.value || event.clipboardData.getData("text"))
          }
        />
      </label>
      <div className="template-inline-actions">
        <button
          type="button"
          onClick={() =>
            applyImport({
              input: importDraft,
              state,
              catalogs,
              dispatch,
              requestDraftReplacement,
              onImported: () => setImportDraft("")
            })
          }
        >
          Apply
        </button>
        <button type="button" onClick={() => setImportDraft(output)} disabled={output.length === 0}>
          Reset to current
        </button>
      </div>
    </section>
  );
}

function preferredTemplateOutput(validation: ValidationView) {
  if (
    validation.exportPolicy.exactSource.available &&
    validation.exportPolicy.exactSource.code !== null
  ) {
    return validation.exportPolicy.exactSource;
  }
  if (
    validation.exportPolicy.canonical.available &&
    validation.exportPolicy.canonical.code !== null
  ) {
    return validation.exportPolicy.canonical;
  }
  return null;
}

function allBlockedReasons(validation: ValidationView): readonly string[] {
  return uniqueMessages([
    ...validation.exportPolicy.exactSource.blockedReasons,
    ...validation.exportPolicy.canonical.blockedReasons,
    ...validation.exportPolicy.projectionDiagnostics.map((diagnostic) => diagnostic.message)
  ]);
}

function uniqueMessages(messages: readonly string[]): readonly string[] {
  return [...new Set(messages)];
}

function applyImport({
  input,
  state,
  catalogs,
  dispatch,
  requestDraftReplacement,
  onImported
}: {
  readonly input: string;
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
  readonly requestDraftReplacement: (() => "cancel" | "discard") | undefined;
  readonly onImported: () => void;
}): void {
  const imported = importSkillTemplateToEditor(input, state, catalogs);
  if (!imported.ok) {
    dispatch({ type: "set-message", tone: "error", text: imported.error.message });
    return;
  }
  const replacementWarnings = [
    ...(selectHasMeaningfulEquipment(state.build.equipment) ? ["authored equipment"] : []),
    ...(hasAuthoredTitleRankOverrides(state.build) ? ["authored title ranks"] : [])
  ];
  if (
    replacementWarnings.length > 0 &&
    !window.confirm(
      `Importing a skill template will discard ${replacementWarnings.join(" and ")} from this draft.`
    )
  ) {
    return;
  }
  if ((requestDraftReplacement?.() ?? "discard") === "cancel") {
    return;
  }
  dispatch({ type: "replace-state", state: imported.state });
  dispatch({ type: "set-message", tone: "success", text: "Skill template imported." });
  onImported();
}

function copyCode(code: string, dispatch: Dispatch<EditorAction>): void {
  if (typeof navigator === "undefined" || navigator.clipboard?.writeText === undefined) {
    dispatch({
      type: "set-message",
      tone: "warning",
      text: "Clipboard API unavailable; template text remains selectable."
    });
    return;
  }
  navigator.clipboard
    .writeText(code)
    .then(() =>
      dispatch({
        type: "set-message",
        tone: "success",
        text: "Template code copied."
      })
    )
    .catch(() =>
      dispatch({
        type: "set-message",
        tone: "warning",
        text: "Copy was denied; template text remains selectable."
      })
    );
}
