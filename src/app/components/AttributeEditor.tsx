import type { Dispatch } from "react";

import { catalogId, type AttributeId } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { legalAttributesForSelectedProfessions } from "../attribute-eligibility";
import {
  selectAttributeBudgetView,
  selectAttributeRows,
  type ValidationView
} from "../editor-selectors";
import type { EditorAction, EditorState } from "../editor-state";
import { InlineIssues } from "./ProfessionModeEditor";

export function AttributeEditor({
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
  const rows = selectAttributeRows(state, catalogs, validation.result);
  const ranks = catalogs.professionAttributeCatalog.attributePointRules.purchasedRankCosts;
  const allocatedAttributeIds = new Set(
    state.build.attributes.map((attribute) => Number(attribute.attributeId))
  );
  const addableAttributes = legalAttributesForSelectedProfessions(state, catalogs).filter(
    (attribute) => !allocatedAttributeIds.has(Number(attribute.id))
  );

  return (
    <section className="editor-panel attribute-panel" aria-labelledby="attributes-title">
      <div className="panel-heading">
        <h2 id="attributes-title">Attributes</h2>
        <span>
          {budget.mode === "evaluated" ? `${budget.remaining ?? 0} pts left` : budget.policyLabel}
        </span>
      </div>
      <div className="budget-row">
        <output aria-label="Attribute points">
          {budget.mode === "evaluated"
            ? `${budget.spend}/${budget.budget ?? 0}`
            : `Spend ${budget.spend}`}
        </output>
      </div>
      <div className="attribute-list">
        {rows.map((row) => (
          <div
            key={row.key}
            className={row.retained ? "attribute-row retained-row" : "attribute-row"}
          >
            <div>
              <strong>{row.label}</strong>
              <span>{row.professionLabel}</span>
            </div>
            <label>
              <span>Rank</span>
              <select
                value={row.rank}
                disabled={row.attributeId === null}
                onChange={(event) => {
                  if (row.attributeId === null) {
                    return;
                  }
                  const rank = Number(event.currentTarget.value);
                  if (row.buildIndex === null) {
                    dispatch({
                      type: "set-attribute-rank",
                      attributeId: row.attributeId,
                      rank
                    });
                  } else {
                    dispatch({
                      type: "set-attribute-row",
                      index: row.buildIndex,
                      attributeId: row.attributeId,
                      rank
                    });
                  }
                }}
              >
                {ranks.map((rank) => (
                  <option key={rank.purchasedRank} value={rank.purchasedRank}>
                    {rank.purchasedRank} ({rank.cumulativeCost})
                  </option>
                ))}
              </select>
            </label>
            {row.buildIndex === null ? null : (
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${row.label}`}
                onClick={() =>
                  row.buildIndex === null
                    ? undefined
                    : dispatch({ type: "remove-attribute-row", index: row.buildIndex })
                }
              >
                x
              </button>
            )}
            <InlineIssues issues={row.issues} />
          </div>
        ))}
      </div>
      <label className="manual-attribute">
        <span>Add attribute</span>
        <select
          defaultValue=""
          onChange={(event) => {
            if (event.currentTarget.value.length === 0) {
              return;
            }
            dispatch({
              type: "set-attribute-rank",
              attributeId: catalogId<"Attribute">(Number(event.currentTarget.value)) as AttributeId,
              rank: 1
            });
            event.currentTarget.value = "";
          }}
        >
          <option value="">Choose attribute</option>
          {addableAttributes.map((attribute) => (
            <option key={Number(attribute.id)} value={Number(attribute.id)}>
              {attribute.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
