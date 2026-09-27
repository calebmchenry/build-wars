import { useEffect, useRef } from "react";
/**
 * Chromium emits native menu history input only when its editing manager has a
 * target. Seed a tiny, non-authored target for guides created only with controls.
 * Both native directions are intercepted by the semantic history owner. This
 * element never enters the guide, clipboard, snapshots, or persistence.
 */
export function useNativeGuideHistory(enabled: boolean, session: string, redoCount: number) {
  const host = useRef<HTMLSpanElement | null>(null);
  const priming = useRef(false);
  useEffect(() => {
    const element = host.current;
    if (!enabled || !element || typeof document.execCommand !== "function") return;
    const active = document.activeElement;
    const selection = window.getSelection();
    const ranges = selection
      ? Array.from({ length: selection.rangeCount }, (_, index) =>
          selection.getRangeAt(index).cloneRange()
        )
      : [];
    priming.current = true;
    try {
      element.removeAttribute("aria-hidden");
      element.textContent = "";
      element.focus({ preventScroll: true });
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("insertHTML", false, "<span>1</span>");
      document.execCommand("insertHTML", false, "<span>2</span>");
      document.execCommand("undo");
    } finally {
      const restore =
        active instanceof HTMLElement &&
        active.isConnected &&
        active !== document.body &&
        active !== element
          ? active
          : element.closest(".guide-workspace")?.querySelector<HTMLElement>(".tiptap");
      restore?.focus({ preventScroll: true });
      selection?.removeAllRanges();
      for (const range of ranges)
        if (range.startContainer.isConnected && range.endContainer.isConnected)
          selection?.addRange(range);
      element.setAttribute("aria-hidden", "true");
      priming.current = false;
    }
  }, [enabled, session, redoCount]);
  return { host, priming };
}
