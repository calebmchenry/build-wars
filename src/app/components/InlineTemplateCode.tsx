import {
  useState,
  type ClipboardEvent,
  type Dispatch,
  type FocusEvent,
  type KeyboardEvent
} from "react";

import { hasAuthoredTitleRankOverrides } from "../../domain";
import clipboardTextIcon from "../assets/clipboard-text.svg";
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
  requestDraftReplacement
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly validation: ValidationView;
  readonly dispatch: Dispatch<EditorAction>;
  readonly requestDraftReplacement: (() => "cancel" | "discard") | undefined;
}) {
  const preferred = preferredTemplateOutput(validation);
  const output = preferred?.code?.code ?? "";
  const blockedReasons =
    preferred === null ? allBlockedReasons(validation) : preferred.blockedReasons;
  const [templateDraft, setTemplateDraftState] = useState({ output, value: output });
  const visibleCode = templateDraft.output === output ? templateDraft.value : output;
  const setTemplateDraft = (value: string) => setTemplateDraftState({ output, value });

  const importCode = (input: string) => {
    const code = input.trim();
    if (code.length === 0) {
      setTemplateDraft(output);
      return;
    }
    setTemplateDraft(code);
    if (code === output) {
      return;
    }
    applyImport({
      input: code,
      state,
      catalogs,
      dispatch,
      requestDraftReplacement
    });
  };

  return (
    <section className="inline-template-panel" aria-labelledby="inline-template-title">
      <h2 id="inline-template-title" className="sr-only">
        Template Code
      </h2>
      <div className="inline-template-row">
        <label className="sr-only" htmlFor="inline-template-code">
          Template code
        </label>
        <input
          id="inline-template-code"
          className="template-code-input"
          value={visibleCode}
          aria-label="Template code"
          placeholder={blockedReasons[0] ?? "Paste skill template code"}
          spellCheck={false}
          onChange={(event) => setTemplateDraft(event.currentTarget.value)}
          onPaste={(event) => handleCodePaste(event, importCode)}
          onBlur={(event) => handleCodeBlur(event, output, importCode)}
          onKeyDown={(event) => handleCodeKeyDown(event, output, setTemplateDraft)}
        />
        <button
          type="button"
          className="icon-button template-copy-button"
          aria-label="Copy template code"
          disabled={output.length === 0}
          onClick={() => copyCode(output, dispatch)}
        >
          <img
            className="copy-icon"
            src={clipboardTextIcon}
            alt=""
            draggable={false}
            aria-hidden="true"
          />
        </button>
      </div>
      {blockedReasons.length > 0 && output.length === 0 ? (
        <ul className="inline-blocked-reasons">
          {blockedReasons.map((reason, index) => (
            <li key={`${index}:${reason}`}>{reason}</li>
          ))}
        </ul>
      ) : null}
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
  requestDraftReplacement
}: {
  readonly input: string;
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
  readonly requestDraftReplacement: (() => "cancel" | "discard") | undefined;
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
}

function handleCodePaste(
  event: ClipboardEvent<HTMLInputElement>,
  importCode: (input: string) => void
): void {
  const pasted = event.clipboardData.getData("text");
  if (pasted.trim().length === 0) {
    return;
  }
  event.preventDefault();
  importCode(pasted);
}

function handleCodeBlur(
  event: FocusEvent<HTMLInputElement>,
  output: string,
  importCode: (input: string) => void
): void {
  if (event.currentTarget.value.trim() !== output) {
    importCode(event.currentTarget.value);
  }
}

function handleCodeKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
  output: string,
  setTemplateDraft: (input: string) => void
): void {
  if (event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.blur();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    setTemplateDraft(output);
    event.currentTarget.blur();
  }
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
