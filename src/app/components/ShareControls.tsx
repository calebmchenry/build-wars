import { useMemo, type Dispatch } from "react";

import { hasAuthoredTitleRankOverrides } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { selectValidationView } from "../editor-selectors";
import { selectHasMeaningfulEquipment } from "../equipment-selectors";
import {
  hydrateEditorFromSnapshot,
  selectedPersistedBuildSnapshot,
  type PersistedSavedDocumentRecord
} from "../persistence-schema";
import { buildShareUrl } from "../share-url";
import { selectShareTemplateExport } from "../template-workflow";
import type { WorkspaceAction, WorkspaceState } from "../workspace-state";

export function ShareControls({
  workspace,
  catalogs,
  shareRecordId,
  dispatch
}: {
  readonly workspace: WorkspaceState;
  readonly catalogs: AppCatalogViews;
  readonly shareRecordId: string | null;
  readonly dispatch: Dispatch<WorkspaceAction>;
}) {
  const targetRecord =
    shareRecordId === null
      ? null
      : (workspace.library.records.find((record) => record.id === shareRecordId) ?? null);
  const shareSnapshot =
    targetRecord === null
      ? selectedWorkspaceSnapshot(workspace)
      : selectedRecordSnapshot(targetRecord);
  const targetEditor = shareSnapshot === null ? null : hydrateEditorFromSnapshot(shareSnapshot);
  const targetLabel = targetRecord === null ? "Current draft" : targetRecord.name;
  const share = useMemo(() => {
    if (targetEditor === null) {
      return { ok: false as const, blockedReasons: ["No selected loadout is available to share."] };
    }
    const validation = selectValidationView(targetEditor, catalogs);
    const selected = selectShareTemplateExport(validation.exportPolicy);
    if (!selected.ok) {
      return selected;
    }
    return {
      ...selected,
      url: buildShareUrl({
        baseUrl: browserBaseUrl(),
        bareCode: selected.bareCode,
        mode: targetEditor.build.mode
      })
    };
  }, [catalogs, targetEditor]);

  return (
    <section className="editor-panel share-panel" aria-labelledby="share-title">
      <div className="panel-heading">
        <div>
          <h2 id="share-title">Sharing</h2>
          <span>{targetLabel}</span>
        </div>
      </div>
      {!workspace.draftSession.allowWorkingDraftAutosave &&
      workspace.draftSession.hydrationSource === "share-url" ? (
        <div className="share-warning">
          <strong>Shared draft is not replacing stored draft</strong>
          <button type="button" onClick={() => dispatch({ type: "allow-working-draft-autosave" })}>
            Use as Draft
          </button>
        </div>
      ) : null}
      {workspace.document.kind === "build-set" ? (
        <div className="share-warning">
          <strong>Selected loadout only</strong>
          <p>Sibling entries and entry notes use build-set transfer or backup JSON.</p>
        </div>
      ) : null}
      {share.ok && targetEditor !== null ? (
        <>
          {selectHasMeaningfulEquipment(targetEditor.build.equipment) ? (
            <div className="share-warning">
              <strong>Equipment omitted from skill template sharing</strong>
              <p>Authored equipment remains in local saves and backups.</p>
            </div>
          ) : null}
          {hasAuthoredTitleRankOverrides(targetEditor.build) ? (
            <div className="share-warning">
              <strong>Title ranks omitted from skill template sharing</strong>
              <p>Authored title ranks remain in local saves and backups.</p>
            </div>
          ) : null}
          {share.url.ok ? (
            <label className="dialog-field">
              <span>Share URL</span>
              <textarea readOnly value={share.url.value} rows={3} />
            </label>
          ) : (
            <div className="blocked-option">
              <strong>Share URL unavailable</strong>
              <p>{share.url.error.message}</p>
            </div>
          )}
          <label className="dialog-field">
            <span>Template text</span>
            <textarea readOnly value={share.templateText} rows={3} />
          </label>
          <div className="library-actions">
            <button
              type="button"
              disabled={!share.url.ok}
              onClick={() => {
                if (share.url.ok) {
                  copyText(share.url.value, "Share URL copied.", dispatch);
                }
              }}
            >
              Copy URL
            </button>
            <button
              type="button"
              onClick={() => copyText(share.templateText, "Template text copied.", dispatch)}
            >
              Copy Template
            </button>
          </div>
        </>
      ) : (
        <div className="blocked-option">
          <strong>Sharing blocked</strong>
          <ul>
            {shareBlockedReasons(share).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function shareBlockedReasons(share: {
  readonly ok: boolean;
  readonly blockedReasons?: readonly string[];
}): readonly string[] {
  return share.ok ? ["No selected loadout is available to share."] : (share.blockedReasons ?? []);
}

function selectedWorkspaceSnapshot(workspace: WorkspaceState) {
  if (workspace.document.kind === "build") {
    return {
      build: workspace.editor.build,
      pveBudget: workspace.editor.pveBudget,
      rawTemplate: workspace.editor.rawTemplate
    };
  }
  if (workspace.document.selectedEntryId === null) {
    return null;
  }
  return {
    build: workspace.editor.build,
    pveBudget: workspace.editor.pveBudget,
    rawTemplate: workspace.editor.rawTemplate
  };
}

function selectedRecordSnapshot(record: PersistedSavedDocumentRecord) {
  return selectedPersistedBuildSnapshot(record.document);
}

function browserBaseUrl(): string {
  if (typeof window === "undefined") {
    return "http://localhost/";
  }
  return window.location.href;
}

function copyText(text: string, success: string, dispatch: Dispatch<WorkspaceAction>): void {
  if (navigator.clipboard?.writeText === undefined) {
    dispatch({
      type: "editor",
      action: {
        type: "set-message",
        tone: "warning",
        text: "Clipboard API unavailable; text remains selectable."
      }
    });
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() =>
      dispatch({
        type: "editor",
        action: { type: "set-message", tone: "success", text: success }
      })
    )
    .catch(() =>
      dispatch({
        type: "editor",
        action: {
          type: "set-message",
          tone: "warning",
          text: "Copy was denied; text remains selectable."
        }
      })
    );
}
