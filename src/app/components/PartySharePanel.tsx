import { useMemo, type Dispatch } from "react";

import type { AppCatalogViews } from "../catalogs";
import { projectPartyMultiCodeText } from "../party-sharing";
import {
  materializeActiveBuildSetSnapshot,
  type WorkspaceAction,
  type WorkspaceState
} from "../workspace-state";

export function PartySharePanel({
  workspace,
  catalogs,
  dispatch
}: {
  readonly workspace: WorkspaceState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<WorkspaceAction>;
}) {
  const projection = useMemo(() => {
    const snapshot = materializeActiveBuildSetSnapshot(workspace);
    return snapshot === null ? null : projectPartyMultiCodeText(snapshot, catalogs);
  }, [catalogs, workspace]);

  if (projection === null) {
    return null;
  }

  return (
    <section className="party-share-panel" aria-labelledby="party-share-title">
      <div className="panel-heading">
        <div>
          <h3 id="party-share-title">Multi-Code Copy</h3>
          <span>
            {projection.availableCount} available / {projection.emptyCount} empty /{" "}
            {projection.unavailableCount} unavailable / {projection.lossyCount} lossy -{" "}
            {projection.bytes} bytes
          </span>
        </div>
      </div>
      {projection.blockedReason === null ? null : (
        <p className="warning-text">{projection.blockedReason}</p>
      )}
      <label className="dialog-field">
        <span>Party-order text</span>
        <textarea readOnly value={projection.text} rows={8} />
      </label>
      <div className="library-actions">
        <button
          type="button"
          disabled={!projection.ok}
          onClick={() => copyText(projection.text, dispatch)}
        >
          {projection.unavailableCount > 0 || projection.emptyCount > 0
            ? "Copy Partial Multi-Code"
            : "Copy Multi-Code"}
        </button>
      </div>
    </section>
  );
}

function copyText(text: string, dispatch: Dispatch<WorkspaceAction>): void {
  if (navigator.clipboard?.writeText === undefined) {
    dispatch({
      type: "editor",
      action: {
        type: "set-message",
        tone: "warning",
        text: "Clipboard API unavailable; party text remains selectable."
      }
    });
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() =>
      dispatch({
        type: "editor",
        action: { type: "set-message", tone: "success", text: "Party multi-code copied." }
      })
    )
    .catch(() =>
      dispatch({
        type: "editor",
        action: {
          type: "set-message",
          tone: "warning",
          text: "Copy was denied; party text remains selectable."
        }
      })
    );
}
