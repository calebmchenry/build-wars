import type { Dispatch } from "react";

import type { AppCatalogViews } from "./catalogs";
import type { EditorAction, EditorState } from "./editor-state";
import { planSkillBarWorkflow, type SkillBarWorkflowIntent } from "./skill-bar-workflow";

export function applySkillBarIntent(
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>,
  intent: SkillBarWorkflowIntent
): void {
  const result = planSkillBarWorkflow(state, catalogs, intent);
  if (!result.ok) {
    dispatch({ type: "set-message", tone: result.tone, text: result.announcement });
    return;
  }
  dispatch({
    type: "apply-skill-bar-plan",
    skillBar: result.plan.skillBar,
    rawSkillBar: result.plan.rawSkillBar,
    selectedSlotIndex: result.plan.selectedSlotIndex
  });
  dispatch({ type: "set-message", tone: result.plan.tone, text: result.plan.announcement });
}
