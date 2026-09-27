import { useMemo, useRef, useState } from "react";
import type { EditorAction } from "../../editor-state";
import type { AppCatalogViews } from "../../catalogs";
import { selectAttributePreview } from "../../attribute-preview-selectors";
import { selectTitleRankPanelView, selectValidationView } from "../../editor-selectors";
import { createGuideTemplateOperation, copyGuideTemplate } from "../../guide-template";
import { hydrateEditorFromSnapshot, type PersistedBuildSnapshot } from "../../persistence-schema";
import type { RuntimeGuideDocument } from "../../guide-state";
import { applyTemplateImport } from "../../template-import";
import {
  downloadTemplateFile,
  readTemplateFile,
  templateFilename,
  templateFileError,
  type TemplateFolder
} from "../../template-files";
import { selectShareTemplateExport } from "../../template-workflow";
import { ComposerHeader } from "../ComposerHeader";
import { FocusedAttributeEditor } from "../FocusedAttributeEditor";
import { TitleRankPanel } from "../TitleRankPanel";
import { ValidationPanel } from "../ValidationPanel";
import { TemplateBrowserDialog } from "../TemplateBrowserDialog";
import type { GuideDispatch } from "./GuideWorkspace";
export function GuideBuildInspector({
  id,
  snapshot,
  catalogs,
  getGuide,
  send
}: {
  readonly id: string;
  readonly snapshot: PersistedBuildSnapshot;
  readonly catalogs: AppCatalogViews;
  readonly getGuide: () => RuntimeGuideDocument;
  readonly send: GuideDispatch;
}) {
  const state = useMemo(() => hydrateEditorFromSnapshot(snapshot), [snapshot]);
  const preview = useMemo(
    () => selectAttributePreview(state.build, catalogs),
    [state.build, catalogs]
  );
  const validation = useMemo(() => selectValidationView(state, catalogs), [state, catalogs]);
  const output = selectShareTemplateExport(validation.exportPolicy);
  const [template, setTemplate] = useState<{ id: string; value: string } | null>(null);
  const visibleTemplate = template?.id === id ? template.value : output.ok ? output.bareCode : "";
  const uploadCapture = useRef<ReturnType<typeof createGuideTemplateOperation>>(null);
  const [folder, setFolder] = useState<TemplateFolder | null>(null);
  const [operation, setOperation] = useState<{
    mode: "load" | "save";
    op: NonNullable<ReturnType<typeof createGuideTemplateOperation>>;
  } | null>(null);
  const edit = (action: EditorAction) => send({ type: "build", buildId: id, action });
  return (
    <section className="guide-inspector" aria-label="Selected build inspector">
      <h2>Editing {snapshot.build.name}</h2>
      <button onClick={() => send({ type: "select", buildId: null })}>Close build inspector</button>
      <ComposerHeader
        state={state}
        catalogs={catalogs}
        validation={validation.result}
        dispatch={edit}
      />
      <FocusedAttributeEditor
        state={state}
        catalogs={catalogs}
        preview={preview}
        validation={validation}
        dispatch={edit}
      />
      <details>
        <summary>Budget and title ranks</summary>
        <label>
          Character level
          <input
            type="number"
            min={1}
            max={20}
            value={state.pveBudget.level}
            onChange={(event) =>
              edit({ type: "set-pve-budget", level: Number(event.target.value) })
            }
          />
        </label>
        <label>
          Attribute quests
          <select
            value={state.pveBudget.questBonus}
            onChange={(event) =>
              edit({
                type: "set-pve-budget",
                questBonus: event.target.value as "none" | "maximum-applicable"
              })
            }
          >
            <option value="none">None</option>
            <option value="maximum-applicable">Maximum applicable</option>
          </select>
        </label>
        <TitleRankPanel
          view={selectTitleRankPanelView(state, catalogs, validation.result)}
          dispatch={edit}
        />
      </details>
      <label>
        Card template code
        <input
          aria-label="Card template code"
          value={visibleTemplate}
          onChange={(event) => setTemplate({ id, value: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Escape") setTemplate(null);
          }}
        />
      </label>
      <div className="guide-actions">
        <button
          onClick={() => {
            if (output.ok && visibleTemplate.trim() === output.bareCode) {
              setTemplate(null);
              return;
            }
            const op = createGuideTemplateOperation(getGuide, id, catalogs, send);
            if (!op) return;
            if (
              applyTemplateImport({
                input: visibleTemplate,
                state: op.state,
                catalogs,
                dispatch: op.dispatch,
                requestDraftReplacement: () =>
                  window.confirm(`Replace “${snapshot.build.name}” from this game code?`)
                    ? "discard"
                    : "cancel"
              })
            )
              setTemplate(null);
          }}
        >
          Apply card template
        </button>
        <button onClick={() => void copyGuideTemplate(getGuide, id, catalogs, send)}>
          Copy card template
        </button>
        {(["load", "save"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              const op = createGuideTemplateOperation(getGuide, id, catalogs, send);
              if (op) setOperation({ mode, op });
            }}
          >
            {mode === "load" ? "Load card template" : "Save card template"}
          </button>
        ))}
      </div>
      <div className="guide-actions">
        <button
          onClick={() => {
            const op = createGuideTemplateOperation(getGuide, id, catalogs, send);
            if (!op) return;
            if (!op.output.ok) {
              send({ type: "message", message: op.output.blockedReasons.join(" ") });
              return;
            }
            try {
              downloadTemplateFile(templateFilename(op.state.build.name), op.output.bareCode);
              send({
                type: "message",
                message: `Download started for captured “${op.state.build.name}” (${op.output.fidelity}). Game codes omit guide and bonus metadata.`
              });
            } catch (error) {
              send({ type: "message", message: templateFileError(error) });
            }
          }}
        >
          Download card template
        </button>
        <label>
          Upload card template
          <input
            type="file"
            accept=".txt,text/plain"
            onClick={() => {
              uploadCapture.current = createGuideTemplateOperation(getGuide, id, catalogs, send);
            }}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              const op = uploadCapture.current;
              event.currentTarget.value = "";
              if (!file || !op) return;
              void readTemplateFile(file)
                .then((code) => {
                  if (!op.guard.isCurrent()) {
                    op.guard.onStale(null);
                    return;
                  }
                  applyTemplateImport({
                    input: code,
                    name: file.name.replace(/\.txt$/i, ""),
                    state: op.state,
                    catalogs,
                    dispatch: op.dispatch,
                    requestDraftReplacement: () =>
                      window.confirm(`Replace captured “${op.state.build.name}”?`)
                        ? "discard"
                        : "cancel"
                  });
                })
                .catch((error) => send({ type: "message", message: templateFileError(error) }));
            }}
          />
        </label>
      </div>
      <p>
        Game codes contain professions, purchased ranks and skills. Guide text, references,
        rune/headgear, title and assumed-effect choices stay in Markdown/local guides.
      </p>
      {!output.ok && <p>{output.blockedReasons.join(" ")}</p>}
      <details>
        <summary>Build validation</summary>
        <ValidationPanel validation={validation} />
      </details>
      {operation && (
        <TemplateBrowserDialog
          mode={operation.mode}
          state={operation.op.state}
          catalogs={catalogs}
          validation={operation.op.validation}
          dispatch={operation.op.dispatch}
          operationGuard={operation.op.guard}
          folder={folder}
          onFolderChange={setFolder}
          onClose={() => setOperation(null)}
          requestDraftReplacement={() =>
            window.confirm(`Replace captured “${operation.op.state.build.name}”?`)
              ? "discard"
              : "cancel"
          }
        />
      )}
    </section>
  );
}
