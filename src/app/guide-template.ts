import { authoredDocumentId } from "../domain";
import type { AppCatalogViews } from "./catalogs";
import { selectValidationView } from "./editor-selectors";
import type { EditorAction } from "./editor-state";
import { captureGuideBuild, isCurrentGuideBuild, type RuntimeGuideDocument } from "./guide-state";
import { hydrateEditorFromSnapshot } from "./persistence-schema";
import { selectShareTemplateExport } from "./template-workflow";
import type { GuideDispatch } from "./components/guide/GuideWorkspace";
export function createGuideTemplateOperation(
  getGuide: () => RuntimeGuideDocument,
  buildId: string,
  catalogs: AppCatalogViews,
  send: GuideDispatch
) {
  const capture = captureGuideBuild(getGuide(), buildId);
  if (!capture) return null;
  const state = hydrateEditorFromSnapshot(capture.snapshot);
  const validation = selectValidationView(state, catalogs);
  const output = selectShareTemplateExport(validation.exportPolicy);
  const label = capture.snapshot.build.name;
  let applied = false;
  const guard = {
    isCurrent: () => isCurrentGuideBuild(getGuide(), capture),
    description: `Captured “${label}” (${output.ok ? output.fidelity : "not exportable"})`,
    onStale: (written: string | null) =>
      send({
        type: "message",
        message: written
          ? `Wrote captured “${label}” to “${written}”. The target changed; no guide rename was applied.`
          : "Template operation ignored because its target changed. Reopen it for the current build."
      })
  };
  const dispatch = (action: EditorAction) => {
    if (action.type === "set-message") {
      if (applied || guard.isCurrent()) send({ type: "message", message: action.text });
      return;
    }
    if (!guard.isCurrent()) {
      guard.onStale(null);
      return;
    }
    const addressed =
      action.type === "replace-state"
        ? {
            ...action,
            state: {
              ...action.state,
              build: { ...action.state.build, id: authoredDocumentId(buildId) }
            }
          }
        : action;
    applied = send({ type: "build", buildId, action: addressed });
  };
  return { capture, state, validation, output, guard, dispatch };
}
export async function copyGuideTemplate(
  getGuide: () => RuntimeGuideDocument,
  buildId: string,
  catalogs: AppCatalogViews,
  send: GuideDispatch,
  write: (code: string) => Promise<void> = (code) => navigator.clipboard.writeText(code)
) {
  const op = createGuideTemplateOperation(getGuide, buildId, catalogs, send);
  if (!op) return;
  if (!op.output.ok) {
    send({ type: "message", message: op.output.blockedReasons.join(" ") });
    return;
  }
  try {
    await write(op.output.bareCode);
    if (!op.guard.isCurrent()) {
      op.guard.onStale("clipboard");
      return;
    }
    send({
      type: "message",
      message: `Copied captured “${op.state.build.name}” (${op.output.fidelity}). Game codes omit guide text, context and bonus choices.`
    });
  } catch {
    send({
      type: "message",
      message: "Clipboard permission was denied. Template text remains selectable in the inspector."
    });
  }
}
