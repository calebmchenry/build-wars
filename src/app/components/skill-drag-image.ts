import type { DragEvent } from "react";

const FALLBACK_SKILL_BAR_DRAG_IMAGE_SIZE = 76;

export function setSkillIconDragImage(event: DragEvent<HTMLElement>): void {
  const setDragImage = event.dataTransfer.setDragImage;
  if (
    typeof setDragImage !== "function" ||
    typeof document === "undefined" ||
    typeof window === "undefined"
  ) {
    return;
  }

  const source = event.currentTarget.querySelector<HTMLElement>(".catalog-icon");
  if (source === null) {
    return;
  }

  const size = currentSkillBarSlotSize();
  const preview = document.createElement("span");
  preview.className = "skill-drag-preview-icon";
  preview.style.width = `${size}px`;
  preview.style.height = `${size}px`;

  const icon = source.cloneNode(true);
  if (icon instanceof HTMLElement) {
    icon.setAttribute("aria-hidden", "true");
    icon.removeAttribute("title");
  }
  preview.append(icon);
  document.body.append(preview);

  const hotspot = Math.round(size / 2);
  setDragImage.call(event.dataTransfer, preview, hotspot, hotspot);
  window.setTimeout(() => preview.remove(), 0);
}

function currentSkillBarSlotSize(): number {
  const slot = document.querySelector<HTMLElement>(".skill-slot-card");
  const rect = slot?.getBoundingClientRect();
  const size = rect === undefined ? 0 : Math.min(rect.width, rect.height);
  return size > 0 ? Math.round(size) : FALLBACK_SKILL_BAR_DRAG_IMAGE_SIZE;
}
