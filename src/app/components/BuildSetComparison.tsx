import type { AppCatalogViews } from "../catalogs";
import {
  selectBuildSetComparisonView,
  type BuildSetComparisonValue,
  type BuildSetComparisonView
} from "../build-set-comparison";
import type { WorkspaceState } from "../workspace-state";

export function BuildSetComparison({
  workspace,
  catalogs
}: {
  readonly workspace: WorkspaceState;
  readonly catalogs: AppCatalogViews;
}) {
  const view = selectBuildSetComparisonView(workspace, catalogs);
  if (view.status === "not-build-set") {
    return null;
  }
  if (view.status === "missing-selection") {
    return (
      <section className="build-set-comparison" aria-label="Build set comparison">
        <strong>No selected loadout</strong>
      </section>
    );
  }
  if (view.status === "missing-comparison") {
    return (
      <section className="build-set-comparison" aria-label="Build set comparison">
        <strong>Choose another loadout to compare</strong>
      </section>
    );
  }
  return (
    <section className="build-set-comparison" aria-label="Build set comparison">
      <ReadyComparison view={view} />
    </section>
  );
}

function ReadyComparison({
  view
}: {
  readonly view: Extract<BuildSetComparisonView, { readonly status: "ready" }>;
}) {
  return (
    <>
      <div className="comparison-heading">
        <strong>
          {view.selectedLabel} vs {view.comparisonLabel}
        </strong>
        <span>
          {view.changedRowCount} changed field{view.changedRowCount === 1 ? "" : "s"}
        </span>
      </div>
      {view.hasDifferences ? (
        <div className="comparison-group-list">
          {view.changedGroups.map((group) => (
            <section key={group.key} className="comparison-group" aria-label={group.label}>
              <h3>{group.label}</h3>
              <div className="comparison-rows">
                {group.rows.map((row) => (
                  <div key={row.key} className="comparison-row">
                    <span className="comparison-field">{row.label}</span>
                    <ComparisonValue value={row.left} />
                    <ComparisonValue value={row.right} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="comparison-empty">No differences</div>
      )}
    </>
  );
}

function ComparisonValue({ value }: { readonly value: BuildSetComparisonValue }) {
  return (
    <span className={`comparison-value ${value.status}`}>
      <span className="comparison-status">{value.status}</span>
      <span>{value.label}</span>
    </span>
  );
}
