import { useState, type Dispatch } from "react";

import type { AttributeId } from "../../domain";
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
  const [collapsed, setCollapsed] = useState(false);
  const listId = "focused-attribute-list";

  return (
    <section className="focused-attribute-panel" aria-labelledby="focused-attributes-title">
      <div className="attribute-section-heading">
        <button
          type="button"
          className="attribute-section-toggle"
          aria-label={`${collapsed ? "Expand" : "Collapse"} attributes`}
          aria-expanded={!collapsed}
          aria-controls={collapsed ? undefined : listId}
          onClick={() => setCollapsed((current) => !current)}
        >
          <span className="skill-group-symbol" aria-hidden="true">
            {collapsed ? "+" : "-"}
          </span>
        </button>
        <h2 id="focused-attributes-title">Attributes ({attributeBudgetLabel(budget)})</h2>
        <output className="sr-only" aria-label="Attribute point spend">
          {budget.mode === "evaluated"
            ? `${budget.spend}/${budget.budget ?? 0}`
            : `Spend ${budget.spend}`}
        </output>
      </div>
      {collapsed ? null : (
        <div id={listId} className="focused-attribute-content">
          <div className="focused-attribute-list">
            {rows.map((row) => (
              <AttributeRow key={row.key} row={row} dispatch={dispatch} />
            ))}
          </div>
        </div>
      )}
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
  return (
    <div
      className={`focused-attribute-row${row.retained ? " retained-row" : ""}`}
      data-effective={row.effectiveModified ? "modified" : "base"}
    >
      <AttributeStepButton
        kind="decrement"
        visible={row.decrement.visible}
        cost={row.decrement.cost}
        disabled={row.decrement.disabled}
        disabledReason={row.decrement.disabledReason}
        label={`Decrease ${row.label}`}
        titlePrefix="Refund"
        onClick={() => applyRank(row.buildIndex, row.attributeId, row.rank - 1, dispatch)}
      />
      <AttributeStepButton
        kind="increment"
        visible={row.increment.visible}
        cost={row.increment.cost}
        disabled={row.increment.disabled}
        disabledReason={row.increment.disabledReason}
        label={`Increase ${row.label}`}
        titlePrefix="Invest"
        onClick={() => applyRank(row.buildIndex, row.attributeId, row.rank + 1, dispatch)}
      />
      <div className="attribute-rank" aria-label={row.effectiveRankLabel}>
        <strong>{row.effectiveRank ?? row.rank}</strong>
      </div>
      <div className="attribute-copy" title={row.professionLabel}>
        <strong>{row.label}</strong>
        <span className="sr-only">{row.professionLabel}</span>
      </div>
      {row.issues.length > 0 ? <InlineIssues issues={row.issues} /> : null}
    </div>
  );
}

function AttributeStepButton({
  kind,
  visible,
  cost,
  disabled,
  disabledReason,
  label,
  titlePrefix,
  onClick
}: {
  readonly kind: "decrement" | "increment";
  readonly visible: boolean;
  readonly cost: number | null;
  readonly disabled: boolean;
  readonly disabledReason: string | null;
  readonly label: string;
  readonly titlePrefix: "Refund" | "Invest";
  readonly onClick: () => void;
}) {
  if (!visible) {
    return <span className="attribute-step-placeholder" aria-hidden="true" />;
  }
  return (
    <button
      type="button"
      className={`attribute-step ${kind}`}
      aria-label={label}
      title={disabledReason ?? `${titlePrefix} ${cost ?? 0} points`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="attribute-step-triangle" aria-hidden="true" />
      <small>{cost ?? 0}</small>
    </button>
  );
}

function attributeBudgetLabel(budget: ReturnType<typeof selectAttributeBudgetView>): string {
  if (budget.mode !== "evaluated") {
    return budget.policyLabel;
  }
  const remaining = budget.remaining ?? 0;
  return `${remaining} unused ${remaining === 1 ? "point" : "points"}`;
}

function applyRank(
  buildIndex: number | null,
  attributeId: AttributeId | null,
  rank: number,
  dispatch: Dispatch<EditorAction>
): void {
  if (attributeId === null) {
    return;
  }
  if (rank <= 0) {
    if (buildIndex !== null) {
      dispatch({ type: "remove-attribute-row", index: buildIndex });
    }
    return;
  }
  if (buildIndex === null) {
    dispatch({ type: "set-attribute-rank", attributeId, rank });
    return;
  }
  dispatch({ type: "set-attribute-row", index: buildIndex, attributeId, rank });
}
