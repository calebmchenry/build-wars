import { useEffect, useRef, type Dispatch, type KeyboardEvent, type ReactNode } from "react";

import { hasAuthoredTitleRankOverrides } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import type { ValidationView } from "../editor-selectors";
import { selectHasMeaningfulEquipment } from "../equipment-selectors";
import type { EditorAction, EditorState } from "../editor-state";
import { importSkillTemplateToEditor } from "../template-workflow";

export function TemplateControls({
  state,
  catalogs,
  validation,
  dispatch,
  requestDraftReplacement,
  selectedLoadoutOnly = false
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly validation: ValidationView;
  readonly dispatch: Dispatch<EditorAction>;
  readonly requestDraftReplacement?: () => "cancel" | "discard";
  readonly selectedLoadoutOnly?: boolean;
}) {
  return (
    <section className="editor-panel template-panel" aria-labelledby="template-title">
      <div className="panel-heading">
        <div>
          <h2 id="template-title">Templates</h2>
          <span>{state.rawTemplate.source === null ? "Fresh build" : "Imported source"}</span>
        </div>
        <div className="template-buttons">
          <button type="button" onClick={() => dispatch({ type: "open-dialog", dialog: "import" })}>
            Import
          </button>
          <button type="button" onClick={() => dispatch({ type: "open-dialog", dialog: "export" })}>
            Export
          </button>
        </div>
      </div>
      <p>
        {validation.exportPolicy.exactSource.available
          ? "Exact-source replay available."
          : validation.exportPolicy.canonical.available
            ? "Canonical export available."
            : "Canonical export blocked until validation and projection gates pass."}
      </p>
      {selectedLoadoutOnly ? (
        <div className="share-warning">
          <strong>Selected loadout only</strong>
          <p>Sibling loadouts use build-set transfer or backup JSON.</p>
        </div>
      ) : null}
      <ImportDialog
        state={state}
        catalogs={catalogs}
        dispatch={dispatch}
        requestDraftReplacement={requestDraftReplacement}
      />
      <ExportDialog state={state} validation={validation} dispatch={dispatch} />
    </section>
  );
}

function ImportDialog({
  state,
  catalogs,
  dispatch,
  requestDraftReplacement
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
  readonly requestDraftReplacement: (() => "cancel" | "discard") | undefined;
}) {
  if (state.dialogs.open !== "import") {
    return null;
  }

  return (
    <Modal title="Import skill template" onClose={() => dispatch({ type: "close-dialog" })}>
      <label className="dialog-field">
        <span>Skill template code</span>
        <textarea
          value={state.dialogs.importInput}
          onChange={(event) =>
            dispatch({ type: "set-import-input", input: event.currentTarget.value })
          }
          rows={6}
        />
      </label>
      <div className="dialog-actions">
        <button
          type="button"
          onClick={() => {
            const imported = importSkillTemplateToEditor(
              state.dialogs.importInput,
              state,
              catalogs
            );
            if (imported.ok) {
              const replacementWarnings = [
                ...(selectHasMeaningfulEquipment(state.build.equipment)
                  ? ["authored equipment"]
                  : []),
                ...(hasAuthoredTitleRankOverrides(state.build) ? ["authored title ranks"] : [])
              ];
              if (
                replacementWarnings.length > 0 &&
                !window.confirm(importWarning(replacementWarnings))
              ) {
                return;
              }
              if ((requestDraftReplacement?.() ?? "discard") === "cancel") {
                return;
              }
              dispatch({
                type: "replace-state",
                state: { ...imported.state, dialogs: { ...imported.state.dialogs, open: null } }
              });
              dispatch({
                type: "set-message",
                tone: "success",
                text: "Skill template imported."
              });
            } else {
              dispatch({ type: "set-message", tone: "error", text: imported.error.message });
            }
          }}
        >
          Import
        </button>
        <button type="button" onClick={() => dispatch({ type: "close-dialog" })}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function ExportDialog({
  state,
  validation,
  dispatch
}: {
  readonly state: EditorState;
  readonly validation: ValidationView;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  if (state.dialogs.open !== "export") {
    return null;
  }

  const exact = validation.exportPolicy.exactSource;
  const canonical = validation.exportPolicy.canonical;

  return (
    <Modal title="Export skill template" onClose={() => dispatch({ type: "close-dialog" })}>
      {selectHasMeaningfulEquipment(state.build.equipment) ? (
        <p className="warning-text">
          Authored equipment is local-only and is not included in skill template output.
        </p>
      ) : null}
      {hasAuthoredTitleRankOverrides(state.build) ? (
        <p className="warning-text">
          Authored title ranks are local-only and are not included in skill template output.
        </p>
      ) : null}
      <label className="dialog-field">
        <span>Wrapper name</span>
        <input
          value={state.rawTemplate.templateName ?? ""}
          onChange={(event) =>
            dispatch({
              type: "set-export-name",
              name: event.currentTarget.value.length === 0 ? null : event.currentTarget.value
            })
          }
        />
      </label>
      <ExportOption
        title="Exact source"
        available={exact.available}
        code={exact.code?.code ?? null}
        blockedReasons={exact.blockedReasons}
        onCopy={(code) => copyCode(code, dispatch)}
      />
      <ExportOption
        title="Canonical"
        available={canonical.available}
        code={canonical.code?.code ?? null}
        blockedReasons={canonical.blockedReasons}
        onCopy={(code) => copyCode(code, dispatch)}
      />
      <div className="dialog-actions">
        <button type="button" onClick={() => dispatch({ type: "close-dialog" })}>
          Close
        </button>
      </div>
    </Modal>
  );
}

function importWarning(warnings: readonly string[]): string {
  return `Importing a skill template will discard ${warnings.join(" and ")} from this draft.`;
}

function ExportOption({
  title,
  available,
  code,
  blockedReasons,
  onCopy
}: {
  readonly title: string;
  readonly available: boolean;
  readonly code: string | null;
  readonly blockedReasons: readonly string[];
  readonly onCopy: (code: string) => void;
}) {
  return (
    <section className={available ? "export-option" : "export-option blocked-option"}>
      <h3>{title}</h3>
      {available && code !== null ? (
        <>
          <textarea readOnly value={code} rows={3} aria-label={`${title} output`} />
          <button type="button" onClick={() => onCopy(code)}>
            Copy
          </button>
        </>
      ) : (
        <ul>
          {blockedReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Modal({
  title,
  children,
  onClose
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = focusableElements(dialogRef.current)[0];
    first?.focus();
    return () => {
      restoreFocusRef.current?.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop">
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={(event) => handleModalKeyDown(event, dialogRef.current, onClose)}
      >
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}>
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function handleModalKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  dialog: HTMLDivElement | null,
  onClose: () => void
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    onClose();
    return;
  }
  if (event.key !== "Tab") {
    return;
  }
  const focusables = focusableElements(dialog);
  if (focusables.length === 0) {
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

function focusableElements(root: HTMLElement | null): readonly HTMLElement[] {
  if (root === null) {
    return [];
  }
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )
  );
}

function copyCode(code: string, dispatch: Dispatch<EditorAction>): void {
  if (navigator.clipboard?.writeText === undefined) {
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
