import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type ReactNode
} from "react";

import {
  applyRestorePlan,
  createBackupEnvelope,
  createRestorePreviewPlan,
  parseBackupJson,
  serializeBackupEnvelope,
  type RestoreMode,
  type RestorePreviewPlan
} from "../backup-restore";
import {
  createWorkspaceEnvelope,
  generateLocalBuildRecordId,
  needsDirtyGuard,
  type WorkspaceAction,
  type WorkspaceState
} from "../workspace-state";
import type { PersistedCatalogFacts } from "../persistence-schema";

export function DeleteRecordDialog({
  recordName,
  onConfirm,
  onCancel
}: {
  readonly recordName: string | null;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  if (recordName === null) {
    return null;
  }
  return (
    <LibraryModal title="Delete saved build" onClose={onCancel}>
      <p>
        Delete <strong>{recordName}</strong> from the local library? The current draft stays open,
        but this saved record is removed after confirmation.
      </p>
      <div className="dialog-actions">
        <button type="button" className="danger-button" onClick={onConfirm}>
          Delete
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </LibraryModal>
  );
}

export function BackupDialog({
  open,
  workspace,
  currentFacts,
  dispatch,
  onClose
}: {
  readonly open: boolean;
  readonly workspace: WorkspaceState;
  readonly currentFacts: PersistedCatalogFacts;
  readonly dispatch: Dispatch<WorkspaceAction>;
  readonly onClose: () => void;
}) {
  const backupText = open
    ? serializeBackupEnvelope(
        createBackupEnvelope({
          exportedAt: new Date().toISOString(),
          savedBuilds: workspace.library.records,
          workingDraft: createWorkspaceEnvelope(workspace, currentFacts, new Date().toISOString())
            .workingDraft,
          savedWith: currentFacts
        })
      )
    : "";

  if (!open) {
    return null;
  }

  return (
    <LibraryModal title="Backup local library" onClose={onClose}>
      <label className="dialog-field">
        <span>Backup JSON</span>
        <textarea readOnly value={backupText} rows={10} />
      </label>
      <div className="dialog-actions">
        <button type="button" onClick={() => downloadBackup(backupText, dispatch)}>
          Download
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </LibraryModal>
  );
}

export function RestoreDialog({
  open,
  workspace,
  dispatch,
  onClose
}: {
  readonly open: boolean;
  readonly workspace: WorkspaceState;
  readonly dispatch: Dispatch<WorkspaceAction>;
  readonly onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<RestoreMode>("merge");
  const [restoreDraft, setRestoreDraft] = useState(false);
  const [preview, setPreview] = useState<RestorePreviewPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sequenceRef = useRef(1);

  if (!open) {
    return null;
  }

  const close = () => {
    setInput("");
    setPreview(null);
    setError(null);
    setRestoreDraft(false);
    setMode("merge");
    onClose();
  };

  return (
    <LibraryModal title="Restore local library" onClose={close}>
      <label className="dialog-field">
        <span>Backup JSON</span>
        <textarea
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          rows={10}
        />
      </label>
      <div className="restore-options">
        <label>
          <span>Restore mode</span>
          <select
            value={mode}
            onChange={(event) => setMode(event.currentTarget.value as RestoreMode)}
          >
            <option value="merge">Merge</option>
            <option value="replace">Replace</option>
          </select>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={restoreDraft}
            onChange={(event) => setRestoreDraft(event.currentTarget.checked)}
          />
          <span>Restore working draft</span>
        </label>
      </div>
      <div className="dialog-actions">
        <button
          type="button"
          onClick={() => {
            const parsed = parseBackupJson(input);
            if (!parsed.ok) {
              setPreview(null);
              setError(parsed.diagnostics[0]?.message ?? "Backup could not be parsed.");
              return;
            }
            setPreview(
              createRestorePreviewPlan({
                backup: parsed.backup,
                currentRecords: workspace.library.records,
                diagnostics: parsed.diagnostics,
                nextId: (sourceId) =>
                  generateLocalBuildRecordId(
                    `${new Date().toISOString()}-${sourceId}`,
                    sequenceRef.current++
                  )
              })
            );
            setError(null);
          }}
        >
          Preview
        </button>
      </div>
      {error === null ? null : <p className="warning-text">{error}</p>}
      {preview === null ? null : (
        <div className="restore-preview">
          <strong>Restore preview</strong>
          <dl>
            <div>
              <dt>Accepted</dt>
              <dd>{preview.acceptedRecords.length}</dd>
            </div>
            <div>
              <dt>Skipped</dt>
              <dd>{preview.skippedRecords.length}</dd>
            </div>
            <div>
              <dt>Conflicts</dt>
              <dd>{preview.currentIdConflicts.length}</dd>
            </div>
            <div>
              <dt>Remaps</dt>
              <dd>{preview.idRemaps.length}</dd>
            </div>
            <div>
              <dt>Final</dt>
              <dd>{mode === "merge" ? preview.mergeFinalCount : preview.replaceFinalCount}</dd>
            </div>
          </dl>
          <div className="dialog-actions">
            <button
              type="button"
              className={mode === "replace" ? "danger-button" : ""}
              onClick={() => {
                if (
                  (mode === "replace" || restoreDraft) &&
                  needsDirtyGuard(workspace) &&
                  !window.confirm("Discard unsaved draft changes?")
                ) {
                  return;
                }
                const applied = applyRestorePlan(preview, {
                  currentRecords: workspace.library.records,
                  mode,
                  restoreWorkingDraft: restoreDraft
                });
                if (!applied.ok) {
                  setError(applied.reason);
                  return;
                }
                dispatch({
                  type: "apply-restore",
                  records: applied.records,
                  draftEditor: applied.draftEditor,
                  draftAssociation: applied.draftAssociation,
                  decision: "discard"
                });
                setPreview(applied.plan);
                close();
              }}
            >
              Apply Restore
            </button>
            <button type="button" onClick={close}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </LibraryModal>
  );
}

export function LibraryModal({
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
    focusableElements(dialogRef.current)[0]?.focus();
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
        aria-labelledby="library-modal-title"
        onKeyDown={(event) => handleModalKeyDown(event, dialogRef.current, onClose)}
      >
        <div className="modal-heading">
          <h2 id="library-modal-title">{title}</h2>
          <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}>
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function downloadBackup(text: string, dispatch: Dispatch<WorkspaceAction>): void {
  try {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `build-wars-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    dispatch({
      type: "editor",
      action: {
        type: "set-message",
        tone: "success",
        text: "Library backup download started."
      }
    });
  } catch {
    dispatch({
      type: "editor",
      action: {
        type: "set-message",
        tone: "warning",
        text: "Download failed; backup JSON remains selectable."
      }
    });
  }
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
