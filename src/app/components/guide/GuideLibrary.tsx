import { useState, type Dispatch } from "react";
import { serializeGuideMarkdown } from "../../../guide/markdown";
import { downloadGuide } from "../../guide-files";
import { localBuildRecordId, type LocalBuildRecordId } from "../../persistence-schema";
import {
  guideCatalogFacts,
  needsDirtyGuard,
  type WorkspaceAction,
  type WorkspaceState
} from "../../workspace-state";
import { BackupDialog, RestoreDialog } from "../LibraryDialogs";
import { GuideDialog } from "./GuideTransferDialog";

export function GuideLibrary({
  workspace,
  dispatch
}: {
  readonly workspace: WorkspaceState;
  readonly dispatch: Dispatch<WorkspaceAction>;
}) {
  const [nameDialog, setNameDialog] = useState<{
    name: string;
    rename: LocalBuildRecordId | null;
  } | null>(null);
  const [pendingOpen, setPendingOpen] = useState<LocalBuildRecordId | null>(null);
  const [backup, setBackup] = useState(false);
  const [restore, setRestore] = useState(false);
  if (workspace.document.kind !== "guide") return null;
  const guide = workspace.document;
  const document = guide.history.frame.document;
  const associated = workspace.library.records.find(
    (record) => record.id === workspace.draftSession.associatedRecordId
  );
  const readonly = guide.view === "read" || guide.composing;
  const now = () => new Date().toISOString();
  const open = (id: LocalBuildRecordId) =>
    dispatch({ type: "load-record", id, decision: "discard" });
  const save = () => {
    if (associated)
      dispatch({ type: "update-associated", now: now(), savedWith: guideCatalogFacts(workspace) });
    else setNameDialog({ name: document.metadata.title, rename: null });
  };
  return (
    <details className="guide-library">
      <summary>Local guide library ({workspace.library.records.length})</summary>
      <p>
        Saved guides keep independent complete builds and exact unapplied source. Game template
        files contain less information.{" "}
        {associated
          ? `Current record: ${associated.name}.`
          : "This guide has no named saved record."}
      </p>
      <div className="guide-actions">
        <button disabled={readonly} onClick={save}>
          Save guide
        </button>
        <button
          disabled={readonly}
          onClick={() =>
            setNameDialog({ name: `${document.metadata.title} Copy`.slice(0, 160), rename: null })
          }
        >
          Save guide as
        </button>
        <button onClick={() => setBackup(true)}>Backup local library</button>
        <button disabled={readonly} onClick={() => setRestore(true)}>
          Restore local library
        </button>
      </div>
      {workspace.storage.diagnostics.length > 0 && (
        <p role="status">{workspace.storage.diagnostics.map((item) => item.message).join(" ")}</p>
      )}
      {workspace.draftSession.durability === "write-blocked" && (
        <p>
          Stored data is protected. Download your guide or library backup before resolving rejected
          storage; no automatic overwrite is allowed.
        </p>
      )}
      {workspace.draftSession.durability === "conflict" && (
        <p>
          Another tab changed this library. Download your current work, then reload to inspect the
          latest stored data.
        </p>
      )}
      <ul>
        {workspace.library.records.map((record) => (
          <li key={record.id}>
            <strong>{record.name}</strong> <span>({record.document.kind})</span>
            {record.document.kind === "guide" && record.document.snapshot.recovery?.dirty && (
              <span> · source draft retained</span>
            )}
            <div className="guide-actions">
              <button
                disabled={guide.composing}
                onClick={() => {
                  if (needsDirtyGuard(workspace)) setPendingOpen(record.id);
                  else open(record.id);
                }}
              >
                Open {record.name}
              </button>
              <button
                disabled={readonly}
                onClick={() => setNameDialog({ name: record.name, rename: record.id })}
              >
                Rename {record.name}
              </button>
              <button
                disabled={readonly}
                onClick={() =>
                  dispatch({
                    type: "duplicate-record",
                    id: record.id,
                    newId: localBuildRecordId(crypto.randomUUID()),
                    now: now()
                  })
                }
              >
                Duplicate saved {record.name}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {pendingOpen && !nameDialog && (
        <GuideDialog title="Keep current guide before opening" onClose={() => setPendingOpen(null)}>
          <p>
            This guide has unsaved edits or unapplied source. Save or download them before replacing
            the working document.
          </p>
          <div className="guide-actions">
            <button
              onClick={() => {
                save();
                if (associated) {
                  open(pendingOpen);
                  setPendingOpen(null);
                }
              }}
            >
              Save then open
            </button>
            <button
              onClick={() =>
                downloadGuide(serializeGuideMarkdown(document), document.metadata.title)
              }
            >
              Download current applied guide
            </button>
            {guide.history.frame.recovery?.dirty && (
              <button
                onClick={() =>
                  downloadGuide(
                    guide.history.frame.recovery!.raw,
                    document.metadata.title + "-source"
                  )
                }
              >
                Download current source draft
              </button>
            )}
            <button
              onClick={() => {
                open(pendingOpen);
                setPendingOpen(null);
              }}
            >
              Discard current edits and open
            </button>
            <button autoFocus onClick={() => setPendingOpen(null)}>
              Cancel
            </button>
          </div>
        </GuideDialog>
      )}
      {nameDialog && (
        <GuideDialog
          title={nameDialog.rename ? "Rename saved document" : "Save guide as"}
          onClose={() => setNameDialog(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (nameDialog.rename)
                dispatch({
                  type: "rename-record",
                  id: nameDialog.rename,
                  name: nameDialog.name,
                  now: now(),
                  savedWith: guideCatalogFacts(workspace)
                });
              else
                dispatch({
                  type: "save-as-new",
                  name: nameDialog.name,
                  id: localBuildRecordId(crypto.randomUUID()),
                  now: now(),
                  savedWith: guideCatalogFacts(workspace)
                });
              setNameDialog(null);
              if (pendingOpen) {
                open(pendingOpen);
                setPendingOpen(null);
              }
            }}
          >
            <label>
              Saved document name
              <input
                autoFocus
                required
                maxLength={160}
                value={nameDialog.name}
                onChange={(event) => setNameDialog({ ...nameDialog, name: event.target.value })}
              />
            </label>
            <p>
              For guides, the saved name is the authored title. Renaming marks an existing source
              draft as based on an older revision without changing its raw bytes.
            </p>
            <div className="guide-actions">
              <button type="submit">Save named guide</button>
              <button type="button" onClick={() => setNameDialog(null)}>
                Cancel
              </button>
            </div>
          </form>
        </GuideDialog>
      )}
      <BackupDialog
        open={backup}
        workspace={workspace}
        currentFacts={guideCatalogFacts(workspace)}
        dispatch={dispatch}
        onClose={() => setBackup(false)}
      />
      <RestoreDialog
        open={restore}
        workspace={workspace}
        dispatch={dispatch}
        onClose={() => setRestore(false)}
      />
    </details>
  );
}
