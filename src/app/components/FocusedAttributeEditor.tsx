import {
  AttributeAdjustmentControls,
  AttributeAdjustmentRecovery
} from "./AttributeAdjustmentControls";
import { AttributeRankBreakdown } from "./AttributeRankBreakdown";
import { AssumedAttributeEffects } from "./AssumedAttributeEffects";
import { selectAttributePreview } from "../attribute-preview-selectors";
import type { AttributePreview } from "../../domain";
import { useId, useMemo, useState, type Dispatch } from "react";

import type { AttributeId } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { selectFocusedAttributeRows } from "../composer-selectors";
import { selectAttributeBudgetView, type ValidationView } from "../editor-selectors";
import type { EditorAction, EditorState } from "../editor-state";
import { InlineIssues } from "./ProfessionModeEditor";

export function FocusedAttributeEditor({
  state,
  catalogs,
  preview,
  validation,
  dispatch
}: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly preview?: AttributePreview;
  readonly validation: ValidationView;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const resolvedPreview = useMemo(
    () => preview ?? selectAttributePreview(state.build, catalogs),
    [preview, state.build, catalogs]
  );
  const headgearName = useId();
  const budget = selectAttributeBudgetView(state, catalogs);
  const rows = selectFocusedAttributeRows(state, catalogs, validation, resolvedPreview);
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
        <h2 id="focused-attributes-title">
          Attributes ({attributeBudgetLabel(budget)})
          {collapsed ? ` · ${resolvedPreview.activeEffectCount} assumed effects active` : ""}
        </h2>
        <output className="sr-only" aria-label="Attribute point spend">
          {budget.mode === "evaluated"
            ? `${budget.spend}/${budget.budget ?? 0}`
            : `Spend ${budget.spend}`}
        </output>
      </div>
      {collapsed ? null : (
        <div id={listId} className="focused-attribute-content">
          {resolvedPreview.availableAttributes.some(
            (a) => a.professionId === state.build.primaryProfessionId
          ) ? (
            <div className="attribute-gear-heading">
              <span>Runes / headgear +1</span>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "set-attribute-headgear", override: { kind: "none" } })
                }
              >
                Clear headgear
              </button>
              {state.build.attributeAdjustments?.headgearOverride != null ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "set-attribute-headgear", override: null })}
                >
                  Use equipped headgear
                </button>
              ) : null}
            </div>
          ) : null}
          <AttributeAdjustmentRecovery
            build={state.build}
            catalogs={catalogs}
            dispatch={dispatch}
          />
          <div className="focused-attribute-list" role="group" aria-label="Headgear bonus choices">
            {rows.map((row) => (
              <AttributeRow
                key={row.key}
                row={row}
                dispatch={dispatch}
                state={state}
                catalogs={catalogs}
                headgearName={headgearName}
              />
            ))}
          </div>
          <AssumedAttributeEffects
            preview={resolvedPreview}
            catalogs={catalogs}
            dispatch={dispatch}
          />
        </div>
      )}
    </section>
  );
}

function AttributeRow({
  row,
  dispatch,
  state,
  catalogs,
  headgearName
}: {
  readonly row: ReturnType<typeof selectFocusedAttributeRows>[number];
  readonly dispatch: Dispatch<EditorAction>;
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly headgearName: string;
}) {
  return (
    <div
      className={`focused-attribute-row${row.retained ? " retained-row" : ""}`}
      data-effective={row.effectiveModified ? "modified" : "base"}
      data-attribute-id={row.attributeId ?? undefined}
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
      <AttributeRankBreakdown rank={row.previewRank} label={row.label} fallback={row.rank} />
      <div className="attribute-copy" title={row.professionLabel}>
        <strong>{row.label}</strong>
        <span className="sr-only">{row.professionLabel}</span>
      </div>
      {row.previewRank?.gearEligible && !row.retained ? (
        <AttributeAdjustmentControls
          rank={row.previewRank}
          label={row.label}
          build={state.build}
          catalogs={catalogs}
          headgearName={headgearName}
          dispatch={dispatch}
        />
      ) : null}
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
