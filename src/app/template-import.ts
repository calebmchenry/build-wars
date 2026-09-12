import type { Dispatch } from "react";

import { hasAuthoredTitleRankOverrides } from "../domain";
import type { AppCatalogViews } from "./catalogs";
import type { EditorAction, EditorState } from "./editor-state";
import { selectHasMeaningfulEquipment } from "./equipment-selectors";
import { importSkillTemplateToEditor } from "./template-workflow";

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
  const replacementWarnings = [
    ...(selectHasMeaningfulEquipment(state.build.equipment) ? ["authored equipment"] : []),
    ...(hasAuthoredTitleRankOverrides(state.build) ? ["authored title ranks"] : [])
  ];
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
