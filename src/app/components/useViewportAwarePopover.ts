import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

const VIEWPORT_MARGIN_PX = 16;
const MENU_GAP_PX = 4;

export function useViewportAwarePopover(open: boolean): {
  readonly anchorRef: RefObject<HTMLDivElement | null>;
  readonly popoverRef: RefObject<HTMLDivElement | null>;
} {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!open || anchor === null || popover === null) {
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;

    if (popoverRect.width <= 0 || popoverRect.height <= 0 || viewportWidth <= 0) {
      return;
    }

    const maxLeft = Math.max(
      VIEWPORT_MARGIN_PX,
      viewportWidth - popoverRect.width - VIEWPORT_MARGIN_PX
    );
    const left = clamp(anchorRect.left, VIEWPORT_MARGIN_PX, maxLeft);

    const availableBelow = viewportHeight - anchorRect.bottom - MENU_GAP_PX - VIEWPORT_MARGIN_PX;
    const availableAbove = anchorRect.top - MENU_GAP_PX - VIEWPORT_MARGIN_PX;
    const openAbove = popoverRect.height > availableBelow && availableAbove > availableBelow;
    const availableHeight = Math.max(0, openAbove ? availableAbove : availableBelow);
    const renderedHeight = Math.min(popoverRect.height, availableHeight);
    const top = openAbove
      ? Math.max(VIEWPORT_MARGIN_PX, anchorRect.top - MENU_GAP_PX - renderedHeight)
      : anchorRect.bottom + MENU_GAP_PX;
    const nextPosition = {
      left: `${Math.round(left)}px`,
      maxHeight: `${Math.round(availableHeight)}px`,
      position: "fixed",
      top: `${Math.round(top)}px`
    };

    Object.assign(popover.style, nextPosition);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
    const frameId = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return {
    anchorRef,
    popoverRef
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
