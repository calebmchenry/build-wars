import type { Dispatch } from "react";

import {
  hasAuthoredTitleRankOverrides,
  hasAuthoredAttributeAdjustments,
  type Build
} from "../domain";
import type { AppCatalogViews } from "./catalogs";
import type { EditorAction, EditorState } from "./editor-state";
import { importSkillTemplateToEditor } from "./template-workflow";

export const ATTRIBUTE_ADJUSTMENT_OMISSION =
  "Rune, headgear, and assumed-effect choices stay in this browser draft. Game codes and template files contain purchased ranks and skills only.";

export function templateReplacementWarnings(build: Build): readonly string[] {
  return [
    ...(hasAuthoredTitleRankOverrides(build) ? ["authored title ranks"] : []),
    ...(hasAuthoredAttributeAdjustments(build.attributeAdjustments)
      ? ["authored attribute adjustments"]
      : [])
  ];
}

export function applyTemplateImport({
  input,
  name,
  state,
  catalogs,
  dispatch,
  requestDraftReplacement
}: {
  readonly input: string;
  readonly name?: string;
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
  readonly requestDraftReplacement: (() => "cancel" | "discard") | undefined;
}): boolean {
  const imported = importSkillTemplateToEditor(input, state, catalogs);
  if (!imported.ok) {
    dispatch({ type: "set-message", tone: "error", text: imported.error.message });
    return false;
  }
  const replacementWarnings = templateReplacementWarnings(state.build);
  if (
    replacementWarnings.length > 0 &&
    !window.confirm(
      `Importing a skill template will discard ${replacementWarnings.join(" and ")} from this draft.`
    )
  )
    return false;
  if ((requestDraftReplacement?.() ?? "discard") === "cancel") return false;
  const next =
    name === undefined
      ? imported.state
      : {
          ...imported.state,
          build: { ...imported.state.build, name }
        };
  dispatch({ type: "replace-state", state: next });
  dispatch({
    type: "set-message",
    tone: "success",
    text: name === undefined ? "Skill template imported." : `Loaded “${name}”.`
  });
  return true;
}
