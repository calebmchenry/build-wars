import { useMemo, useState, type Dispatch } from "react";

import {
  applyPartyTransferPreview,
  createPartyTransferEnvelope,
  previewPartyTransferJson,
  sanitizePartyTransferFilename,
  serializePartyTransferEnvelope,
  type PartyTransferPreviewResult
} from "../party-transfer";
import {
  materializeActiveBuildSetSnapshot,
  needsDirtyGuard,
  type WorkspaceAction,
  type WorkspaceState
} from "../workspace-state";

export function PartyTransferDialog({
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
  const [importText, setImportText] = useState("");
  const [preview, setPreview] = useState<PartyTransferPreviewResult | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const exportPackage = useMemo(() => {
    const buildSet = materializeActiveBuildSetSnapshot(workspace);
    if (buildSet === null) {
      return null;
    }
    const exportedAt = new Date().toISOString();
    const envelope = createPartyTransferEnvelope({ buildSet, exportedAt });
    if (envelope === null) {
      return null;
    }
    return {
      text: serializePartyTransferEnvelope(envelope),
      filename: sanitizePartyTransferFilename(buildSet.name, exportedAt),
      entryCount: buildSet.entries.length,
      slotCount: buildSet.party?.slots.length ?? 0
    };
  }, [workspace]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div
        className="modal build-set-transfer-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="party-transfer-title"
      >
        <div className="modal-heading">
          <h2 id="party-transfer-title">Party Transfer</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <section className="transfer-section" aria-label="Export party">
          <h3>Export</h3>
          {exportPackage === null ? (
            <p>Current build set is not an enabled party.</p>
          ) : (
            <>
              <p>
                {exportPackage.slotCount} slots / {exportPackage.entryCount} loadouts
              </p>
              <label className="dialog-field">
                <span>Native party JSON</span>
                <textarea readOnly value={exportPackage.text} rows={8} />
              </label>
              <button
                type="button"
                onClick={() => downloadJson(exportPackage.filename, exportPackage.text)}
              >
                Download JSON
              </button>
            </>
          )}
        </section>
        <section className="transfer-section" aria-label="Import party">
          <h3>Import</h3>
          <label className="dialog-field">
            <span>Native party JSON input</span>
            <textarea
              value={importText}
              rows={8}
              onChange={(event) => {
                setImportText(event.currentTarget.value);
                setPreview(null);
                setApplyError(null);
              }}
            />
          </label>
          <div className="dialog-actions">
            <button
              type="button"
              onClick={() => {
                setPreview(previewPartyTransferJson(importText));
                setApplyError(null);
              }}
            >
              Preview Import
            </button>
            <button
              type="button"
              disabled={preview === null || !preview.ok || preview.preview.applied}
              onClick={() => {
                if (preview === null || !preview.ok) {
                  return;
                }
                if (
                  needsDirtyGuard(workspace) &&
                  !window.confirm("Discard unsaved draft changes?")
                ) {
                  return;
                }
                const applied = applyPartyTransferPreview(preview.preview);
                setPreview(applied.ok ? { ok: true, preview: applied.preview } : preview);
                if (!applied.ok) {
                  setApplyError(applied.reason);
                  return;
                }
                dispatch({
                  type: "replace-build-set-draft",
                  snapshot: applied.snapshot,
                  source: "build-set-transfer",
                  decision: "discard"
                });
                dispatch({
                  type: "editor",
                  action: {
                    type: "set-message",
                    tone: "success",
                    text: "Party imported."
                  }
                });
                onClose();
              }}
            >
              Apply Import
            </button>
          </div>
          <PartyTransferPreview preview={preview} applyError={applyError} />
        </section>
      </div>
    </div>
  );
}

function PartyTransferPreview({
  preview,
  applyError
}: {
  readonly preview: PartyTransferPreviewResult | null;
  readonly applyError: string | null;
}) {
  if (preview === null) {
    return null;
  }
  if (!preview.ok) {
    return (
      <div className="blocked-option">
        <strong>Import blocked</strong>
        <ul>
          {preview.diagnostics.map((diagnostic) => (
            <li key={`${diagnostic.path}:${diagnostic.code}`}>{diagnostic.message}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="transfer-preview">
      <strong>{preview.preview.envelope.buildSet.name}</strong>
      <span>
        {preview.preview.slotCount} slots / {preview.preview.entryCount} loadouts /{" "}
        {preview.preview.serializedBytes} bytes
      </span>
      <span>{preview.preview.filename}</span>
      {preview.preview.diagnostics.length > 0 ? (
        <ul>
          {preview.preview.diagnostics.map((diagnostic) => (
            <li key={`${diagnostic.path}:${diagnostic.code}`}>{diagnostic.message}</li>
          ))}
        </ul>
      ) : null}
      {preview.preview.applied ? <span>Applied</span> : null}
      {applyError === null ? null : <span>{applyError}</span>}
    </div>
  );
}

function downloadJson(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
