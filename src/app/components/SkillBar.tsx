import type { Dispatch, DragEvent } from "react";

import { type SkillId } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { BUILD_WARS_DRAG_MIME, parseDragPayload, slotDragPayload } from "../drag-payload";
import { selectSkillSlotDisplays } from "../editor-selectors";
import type { EditorAction, EditorState } from "../editor-state";
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

  return (
    <section className="editor-panel skillbar-panel" aria-labelledby="skillbar-title">
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
              onDrop={(event) => handleDrop(event, index, dispatch)}
            >
              <button
                type="button"
                className="slot-button"
                draggable={filled}
                aria-label={`Skill slot ${index + 1}: ${slot.title}`}
                onClick={() => dispatch({ type: "select-slot", slotIndex: index })}
                onKeyDown={(event) => {
                  if (event.key === "Delete" || event.key === "Backspace") {
                    dispatch({ type: "clear-skill-slot", slotIndex: index });
                  }
                  if (event.key === "Enter" && state.keyboardPlacement !== null) {
                    dispatch({ type: "place-keyboard", slotIndex: index });
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
                  k
                </button>
                <button
                  type="button"
                  aria-label={`Place keyboard selection in slot ${index + 1}`}
                  disabled={state.keyboardPlacement === null}
                  onClick={() => dispatch({ type: "place-keyboard", slotIndex: index })}
                >
                  v
                </button>
                <button
                  type="button"
                  aria-label={`Clear slot ${index + 1}`}
                  onClick={() => dispatch({ type: "clear-skill-slot", slotIndex: index })}
                >
                  x
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function handleDrop(
  event: DragEvent<HTMLDivElement>,
  slotIndex: number,
  dispatch: Dispatch<EditorAction>
): void {
  event.preventDefault();
  const payload = parseDragPayload(event.dataTransfer.getData(BUILD_WARS_DRAG_MIME));
  if (payload === null) {
    dispatch({ type: "cancel-drag" });
    return;
  }
  if (payload.kind === "browser-skill") {
    dispatch({
      type: "place-skill",
      slotIndex,
      skillId: payload.skillId as SkillId
    });
  } else {
    dispatch({ type: "move-skill-slot", fromIndex: payload.slotIndex, toIndex: slotIndex });
  }
  dispatch({ type: "cancel-drag" });
}
