import type { Dispatch } from "react";

import { catalogId, type AttributeId } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { selectFocusedAttributeRows } from "../composer-selectors";
import { selectAttributeBudgetView, type ValidationView } from "../editor-selectors";
import type { EditorAction, EditorState } from "../editor-state";
import { InlineIssues } from "./ProfessionModeEditor";

export function FocusedAttributeEditor({
  state,
  catalogs,
  validation,
  dispatch
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly validation: ValidationView;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const budget = selectAttributeBudgetView(state, catalogs);
  const rows = selectFocusedAttributeRows(state, catalogs, validation);
  const levels = catalogs.professionAttributeCatalog.attributePointRules.levelPointTotals;

  return (
    <section className="focused-attribute-panel" aria-labelledby="focused-attributes-title">
      <div className="panel-heading compact-heading">
        <div>
          <h2 id="focused-attributes-title">Attributes</h2>
          <span>
            {budget.mode === "evaluated"
              ? `${budget.remaining ?? 0} points left`
              : budget.policyLabel}
          </span>
        </div>
        <output aria-label="Attribute point spend">
          {budget.mode === "evaluated"
            ? `${budget.spend}/${budget.budget ?? 0}`
            : `Spend ${budget.spend}`}
        </output>
      </div>
      <div className="composer-budget-controls">
        <label>
          <span>Level</span>
          <select
            value={state.pveBudget.level}
            disabled={state.build.mode !== "pve"}
            onChange={(event) =>
              dispatch({ type: "set-pve-budget", level: Number(event.currentTarget.value) })
            }
          >
            {levels.map((level) => (
              <option key={level.level} value={level.level}>
                {level.level}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Quest bonus</span>
          <select
            value={state.pveBudget.questBonus}
            disabled={state.build.mode !== "pve"}
            onChange={(event) =>
              dispatch({
                type: "set-pve-budget",
                questBonus: event.currentTarget.value === "none" ? "none" : "maximum-applicable"
              })
            }
          >
            <option value="maximum-applicable">Maximum</option>
            <option value="none">None</option>
          </select>
        </label>
      </div>
      <div className="focused-attribute-list">
        {rows.map((row) => (
          <AttributeRow key={row.key} row={row} dispatch={dispatch} />
        ))}
      </div>
      <label className="manual-attribute">
        <span>Add retained attribute</span>
        <select
          defaultValue=""
          onChange={(event) => {
            if (event.currentTarget.value.length === 0) {
              return;
            }
            dispatch({
              type: "set-attribute-rank",
              attributeId: catalogId<"Attribute">(Number(event.currentTarget.value)),
              rank: 1
            });
            event.currentTarget.value = "";
          }}
        >
          <option value="">Choose attribute</option>
          {catalogs.attributes.map((attribute) => (
            <option key={Number(attribute.id)} value={Number(attribute.id)}>
              {attribute.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function AttributeRow({
  row,
  dispatch
}: {
  readonly row: ReturnType<typeof selectFocusedAttributeRows>[number];
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const buildIndex = row.buildIndex;
  return (
    <div
      className={`focused-attribute-row${row.retained ? " retained-row" : ""}`}
      data-effective={row.effectiveModified ? "modified" : "base"}
    >
      <button
        type="button"
        className="attribute-step"
        aria-label={`Refund ${row.label}`}
        title={row.decrement.disabledReason ?? `Refund ${row.decrement.cost ?? 0} points`}
        disabled={!row.decrement.visible || row.decrement.disabled}
        onClick={() => applyRank(row.buildIndex, row.attributeId, row.rank - 1, dispatch)}
      >
        <span aria-hidden="true">-</span>
        <small>{row.decrement.cost ?? 0}</small>
      </button>
      <div className="attribute-rank" aria-label={row.effectiveRankLabel}>
        <strong>{row.rank}</strong>
        <span>{row.effectiveRank === null ? "?" : row.effectiveRank}</span>
      </div>
      <button
        type="button"
        className="attribute-step"
        aria-label={`Invest in ${row.label}`}
        title={row.increment.disabledReason ?? `Invest ${row.increment.cost ?? 0} points`}
        disabled={!row.increment.visible || row.increment.disabled}
        onClick={() => applyRank(row.buildIndex, row.attributeId, row.rank + 1, dispatch)}
      >
        <span aria-hidden="true">+</span>
        <small>{row.increment.cost ?? 0}</small>
      </button>
      <div className="attribute-copy">
        <strong>{row.label}</strong>
        <span>{row.professionLabel}</span>
      </div>
      {buildIndex === null ? null : (
        <button
          type="button"
          className="icon-button clear-row-button"
          aria-label={`Remove ${row.label}`}
          onClick={() => dispatch({ type: "remove-attribute-row", index: buildIndex })}
        >
          Clear
        </button>
      )}
      <InlineIssues issues={row.issues} />
    </div>
  );
}

function applyRank(
  buildIndex: number | null,
  attributeId: AttributeId | null,
  rank: number,
  dispatch: Dispatch<EditorAction>
): void {
  if (attributeId === null || rank < 0) {
    return;
  }
  if (buildIndex === null) {
    dispatch({ type: "set-attribute-rank", attributeId, rank });
    return;
  }
  dispatch({ type: "set-attribute-row", index: buildIndex, attributeId, rank });
}
