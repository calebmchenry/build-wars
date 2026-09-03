import { useId, useState, type Dispatch, type KeyboardEvent } from "react";

import type { EditorAction } from "../editor-state";
import type { TitleRankControlView, TitleRankPanelView } from "../title-rank-selectors";

export function TitleRankPanel({
  view,
  dispatch
}: {
  readonly view: TitleRankPanelView;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  if (!view.hasDefinitions) {
    return null;
  }

  return (
    <section className="editor-panel title-rank-panel" aria-labelledby="title-rank-title">
      <div className="panel-heading">
        <div>
          <h2 id="title-rank-title">Title Ranks</h2>
          <span>
            {view.relevantRows.length} relevant /{" "}
            {view.hasConfiguredOverrides ? "configured" : "default"}
          </span>
        </div>
      </div>
      {view.relevantRows.length === 0 ? (
        <p className="catalog-version-note">No selected title ranks.</p>
      ) : (
        <div className="title-rank-list">
          {view.relevantRows.map((row) => (
            <TitleRankRow key={row.key} row={row} dispatch={dispatch} />
          ))}
        </div>
      )}
      {view.allRows.length === 0 ? null : (
        <details className="title-rank-disclosure">
          <summary>All title ranks</summary>
          <div className="title-rank-list">
            {view.allRows.map((row) => (
              <TitleRankRow key={row.key} row={row} dispatch={dispatch} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function TitleRankRow({
  row,
  dispatch
}: {
  readonly row: TitleRankControlView;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const inputId = useId();
  const statusId = `${inputId}-status`;
  const issueId = `${inputId}-issues`;
  const [draftState, setDraftState] = useState(() => ({
    key: row.key,
    value: row.value,
    text: String(row.value)
  }));
  const draft =
    draftState.key === row.key && draftState.value === row.value
      ? draftState.text
      : String(row.value);
  const setDraft = (text: string) => setDraftState({ key: row.key, value: row.value, text });
  const setCommittedDraft = (rank: number) =>
    setDraftState({ key: row.key, value: rank, text: String(rank) });

  const canDecrement = !row.disabled && row.value > row.min;
  const canIncrement = !row.disabled && row.value < row.max;

  return (
    <div className={`title-rank-row ${row.status}`} data-relevant={row.relevant}>
      <div className="title-rank-copy">
        <label htmlFor={inputId}>{row.label}</label>
        <span id={statusId}>
          {row.currentText} / {row.rangeText}
        </span>
      </div>
      <div className="title-rank-controls">
        <button
          type="button"
          aria-label={`Decrease ${row.label}`}
          disabled={!canDecrement}
          onClick={() => commitRank(row.value - 1, row, dispatch, setDraft, setCommittedDraft)}
        >
          -
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={row.min}
          max={row.max}
          step={1}
          value={draft}
          disabled={row.disabled}
          aria-describedby={row.issues.length === 0 ? statusId : `${statusId} ${issueId}`}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={() => commitDraft(draft, row, dispatch, setDraft, setCommittedDraft)}
          onKeyDown={(event) =>
            handleInputKey(event, draft, row, dispatch, setDraft, setCommittedDraft)
          }
        />
        <button
          type="button"
          aria-label={`Increase ${row.label}`}
          disabled={!canIncrement}
          onClick={() => commitRank(row.value + 1, row, dispatch, setDraft, setCommittedDraft)}
        >
          +
        </button>
        <button
          type="button"
          disabled={!row.resettable}
          onClick={() => {
            dispatch({ type: "reset-title-rank-override", key: row.key });
            dispatch({
              type: "set-message",
              tone: "success",
              text: `${row.label} title rank reset.`
            });
          }}
        >
          Reset
        </button>
      </div>
      {row.issues.length === 0 ? null : (
        <div id={issueId} className="inline-issues title-rank-issues">
          {row.issues.map((issue) => (
            <p key={`${issue.code}:${issue.message}`}>{issue.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function handleInputKey(
  event: KeyboardEvent<HTMLInputElement>,
  draft: string,
  row: TitleRankControlView,
  dispatch: Dispatch<EditorAction>,
  setDraft: (value: string) => void,
  setCommittedDraft: (rank: number) => void
): void {
  if (event.key === "Enter") {
    event.preventDefault();
    commitDraft(draft, row, dispatch, setDraft, setCommittedDraft);
  }
  if (event.key === "Escape") {
    event.preventDefault();
    setDraft(String(row.value));
  }
}

function commitDraft(
  draft: string,
  row: TitleRankControlView,
  dispatch: Dispatch<EditorAction>,
  setDraft: (value: string) => void,
  setCommittedDraft: (rank: number) => void
): void {
  const trimmed = draft.trim();
  if (!/^\d+$/.test(trimmed)) {
    rejectDraft(row, dispatch, setDraft);
    return;
  }
  const rank = Number(trimmed);
  commitRank(rank, row, dispatch, setDraft, setCommittedDraft);
}

function commitRank(
  rank: number,
  row: TitleRankControlView,
  dispatch: Dispatch<EditorAction>,
  setDraft: (value: string) => void,
  setCommittedDraft: (rank: number) => void
): void {
  if (
    row.mutationFacts === null ||
    !Number.isSafeInteger(rank) ||
    !row.mutationFacts.editableRanks.includes(rank)
  ) {
    rejectDraft(row, dispatch, setDraft);
    return;
  }
  setCommittedDraft(rank);
  dispatch({ type: "set-title-rank-override", facts: row.mutationFacts, rank });
  dispatch({
    type: "set-message",
    tone: "success",
    text: `${row.label} title rank set to ${rank}.`
  });
}

function rejectDraft(
  row: TitleRankControlView,
  dispatch: Dispatch<EditorAction>,
  setDraft: (value: string) => void
): void {
  setDraft(String(row.value));
  dispatch({
    type: "set-message",
    tone: "warning",
    text: `${row.label} title rank must be an exact integer from ${row.rangeText}.`
  });
}
