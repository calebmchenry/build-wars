import type { Dispatch, DragEvent } from "react";

import { type SkillId } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { BUILD_WARS_DRAG_MIME, parseDragPayload, slotDragPayload } from "../drag-payload";
import { selectSkillSlotDisplays } from "../editor-selectors";
import type { EditorAction, EditorState } from "../editor-state";
import { applySkillBarIntent } from "../skill-bar-actions";
import type { SkillBarWorkflowIntent } from "../skill-bar-workflow";
import { SkillDisplay } from "./SkillDisplay";

export function SkillBar({
  state,
  catalogs,
  dispatch
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const slots = selectSkillSlotDisplays(state, catalogs);
  const applyIntent = (intent: SkillBarWorkflowIntent) =>
    applySkillBarIntent(state, catalogs, dispatch, intent);

  return (
    <section className="skillbar-panel" aria-labelledby="skillbar-title">
      <div className="panel-heading">
        <div>
          <h2 id="skillbar-title">Skill Bar</h2>
          <span>Eight fixed slots</span>
        </div>
        <button type="button" onClick={() => dispatch({ type: "cancel-keyboard" })}>
          Cancel keyboard pick
        </button>
      </div>
      <div className="keyboard-status" aria-live="polite">
        {state.keyboardPlacement === null
          ? "No keyboard placement selected."
          : state.keyboardPlacement.kind === "browser-skill"
            ? "Keyboard skill picked. Choose a slot."
            : `Slot ${state.keyboardPlacement.slotIndex + 1} picked. Choose a destination.`}
      </div>
      <div className="skillbar" role="list" aria-label="Eight skill slots">
        {slots.map((slot, index) => {
          const selected = state.selectedSlotIndex === index;
          const filled = state.build.skillBar[index] !== null;
          return (
            <div
              key={index}
              role="listitem"
              className={selected ? "skill-slot-card selected-slot" : "skill-slot-card"}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, index, state, catalogs, dispatch)}
            >
              <button
                type="button"
                className="slot-button"
                draggable={filled}
                aria-label={`Skill slot ${index + 1}: ${slot.title}`}
                onClick={() => dispatch({ type: "select-slot", slotIndex: index })}
                onKeyDown={(event) => {
                  if (event.key === "Delete" || event.key === "Backspace") {
                    applyIntent({ kind: "remove-slot", fromIndex: index });
                  }
                  if (event.key === "Enter" && state.keyboardPlacement !== null) {
                    applyKeyboardPlacement(state, catalogs, dispatch, index);
                  }
                  if (event.key === "Escape") {
                    dispatch({ type: "cancel-keyboard" });
                  }
                }}
                onDragStart={(event) => {
                  if (!filled) {
                    event.preventDefault();
                    return;
                  }
                  event.dataTransfer.setData(BUILD_WARS_DRAG_MIME, slotDragPayload(index));
                  setLocalDragImage(event, slot.title);
                  dispatch({ type: "start-drag", drag: { kind: "skill-slot", slotIndex: index } });
                }}
                onDragEnd={() => dispatch({ type: "cancel-drag" })}
              >
                <SkillDisplay view={slot} compact />
              </button>
              <div className="slot-actions">
                <button
                  type="button"
                  aria-label={`Pick slot ${index + 1} for keyboard movement`}
                  disabled={!filled}
                  onClick={() =>
                    dispatch({
                      type: "pick-keyboard",
                      placement: { kind: "skill-slot", slotIndex: index }
                    })
                  }
                >
                  Move
                </button>
                <button
                  type="button"
                  aria-label={`Place keyboard selection in slot ${index + 1}`}
                  disabled={state.keyboardPlacement === null}
                  onClick={() => applyKeyboardPlacement(state, catalogs, dispatch, index)}
                >
                  Place
                </button>
                <button
                  type="button"
                  aria-label={`Clear slot ${index + 1}`}
                  onClick={() => applyIntent({ kind: "remove-slot", fromIndex: index })}
                >
                  Clear
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="skill-removal-target"
        data-active={state.drag?.kind === "skill-slot" ? "true" : "false"}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleRemovalDrop(event, state, catalogs, dispatch)}
      >
        <strong>Remove skill</strong>
        <span>Drop a filled slot here or use a slot Clear button.</span>
      </div>
    </section>
  );
}

function handleDrop(
  event: DragEvent<HTMLDivElement>,
  slotIndex: number,
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>
): void {
  event.preventDefault();
  const payload = parseDragPayload(event.dataTransfer.getData(BUILD_WARS_DRAG_MIME));
  if (payload === null) {
    dispatch({ type: "set-message", tone: "warning", text: "Invalid skill drag payload." });
    dispatch({ type: "cancel-drag" });
    return;
  }
  if (payload.kind === "browser-skill") {
    applySkillBarIntent(state, catalogs, dispatch, {
      kind: "catalog-skill",
      skillId: payload.skillId as SkillId,
      toIndex: slotIndex
    });
  } else {
    applySkillBarIntent(state, catalogs, dispatch, {
      kind: "bar-slot",
      fromIndex: payload.slotIndex,
      toIndex: slotIndex
    });
  }
  dispatch({ type: "cancel-drag" });
}

function handleRemovalDrop(
  event: DragEvent<HTMLDivElement>,
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>
): void {
  event.preventDefault();
  const payload = parseDragPayload(event.dataTransfer.getData(BUILD_WARS_DRAG_MIME));
  if (payload?.kind !== "skill-slot") {
    dispatch({
      type: "set-message",
      tone: "warning",
      text: "Only skill-bar slots can be removed."
    });
    dispatch({ type: "cancel-drag" });
    return;
  }
  applySkillBarIntent(state, catalogs, dispatch, {
    kind: "remove-slot",
    fromIndex: payload.slotIndex
  });
  dispatch({ type: "cancel-drag" });
}

function applyKeyboardPlacement(
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>,
  slotIndex: number
): void {
  if (state.keyboardPlacement === null) {
    return;
  }
  const placement = state.keyboardPlacement;
  const intent =
    placement.kind === "browser-skill"
      ? ({ kind: "catalog-skill", skillId: placement.skillId, toIndex: slotIndex } as const)
      : ({ kind: "bar-slot", fromIndex: placement.slotIndex, toIndex: slotIndex } as const);
  applySkillBarIntent(state, catalogs, dispatch, intent);
  dispatch({ type: "cancel-keyboard" });
}

function setLocalDragImage(event: DragEvent<HTMLElement>, label: string): void {
  if (event.dataTransfer.setDragImage === undefined || typeof document === "undefined") {
    return;
  }
  const preview = document.createElement("div");
  preview.className = "drag-preview";
  preview.textContent = label;
  document.body.append(preview);
  event.dataTransfer.setDragImage(preview, 18, 18);
  window.setTimeout(() => preview.remove(), 0);
}
