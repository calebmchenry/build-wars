import type { Dispatch, UIEvent } from "react";

import type { EditorAction } from "../editor-state";

const LOAD_MORE_THRESHOLD_PX = 240;

export function loadMoreBrowserResultsOnScroll(
  event: UIEvent<HTMLElement>,
  hasMore: boolean,
  dispatch: Dispatch<EditorAction>
): void {
  if (!hasMore) {
    return;
  }

  const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
  if (scrollHeight - scrollTop - clientHeight <= LOAD_MORE_THRESHOLD_PX) {
    dispatch({ type: "show-more-browser-results" });
  }
}
