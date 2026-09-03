import type { Dispatch, DragEvent } from "react";

import { type SkillId } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { BUILD_WARS_DRAG_MIME, parseDragPayload, slotDragPayload } from "../drag-payload";
import { selectSkillSlotDisplays } from "../editor-selectors";
import type { EditorAction, EditorState } from "../editor-state";
import { applySkillBarIntent } from "../skill-bar-actions";
import { CatalogIcon } from "./CatalogIcon";
import { SkillTooltipTrigger } from "./SkillTooltip";

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
    <section className="skillbar-panel" aria-labelledby="skillbar-title">
      <h2 id="skillbar-title" className="sr-only">
        Skill Bar
      </h2>
      <div className="skillbar" role="list" aria-label="Eight skill slots">
        {slots.map((slot, index) => {
          const selected = state.selectedSlotIndex === index;
          const filled = state.build.skillBar[index] !== null;
          return (
            <SkillTooltipTrigger
              key={index}
              view={slot}
              placement="above"
              role="listitem"
              className={selected ? "skill-slot-card selected-slot" : "skill-slot-card"}
              onDragOver={handleSlotDragOver}
              onDrop={(event) => handleDrop(event, index, state, catalogs, dispatch)}
            >
              <button
                type="button"
                className="slot-button"
                draggable={filled}
                aria-label={`Skill slot ${index + 1}: ${slot.title}`}
                onClick={() => dispatch({ type: "select-slot", slotIndex: index })}
                onDragStart={(event) => {
                  if (!filled) {
                    event.preventDefault();
                    return;
                  }
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData(BUILD_WARS_DRAG_MIME, slotDragPayload(index));
                  setLocalDragImage(event, slot.title);
                  dispatch({ type: "start-drag", drag: { kind: "skill-slot", slotIndex: index } });
                }}
                onDragEnd={(event) => handleSlotDragEnd(event, index, state, catalogs, dispatch)}
              >
                <span className="skill-slot-art" data-state={slot.kind}>
                  {slot.kind === "empty" ? null : <CatalogIcon descriptor={slot.placeholder} />}
                </span>
                <span className="skill-slot-number" aria-hidden="true">
                  {index + 1}
                </span>
              </button>
            </SkillTooltipTrigger>
          );
        })}
      </div>
    </section>
  );
}

function handleSlotDragOver(event: DragEvent<HTMLDivElement>): void {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleDrop(
  event: DragEvent<HTMLDivElement>,
  slotIndex: number,
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>
): void {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
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

function handleSlotDragEnd(
  event: DragEvent<HTMLButtonElement>,
  slotIndex: number,
  state: EditorState,
  catalogs: AppCatalogViews,
  dispatch: Dispatch<EditorAction>
): void {
  if (event.dataTransfer.dropEffect === "none") {
    applySkillBarIntent(state, catalogs, dispatch, { kind: "remove-slot", fromIndex: slotIndex });
  }
  dispatch({ type: "cancel-drag" });
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
