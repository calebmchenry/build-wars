import type { SkillDisplayView } from "../editor-selectors";
import { SkillDisplay } from "./SkillDisplay";

export function SkillTooltip({
  view,
  onClose
}: {
  readonly view: SkillDisplayView | null;
  readonly onClose: () => void;
}) {
  if (view === null) {
    return null;
  }

  return (
    <aside className="skill-tooltip" aria-label="Skill details">
      <button
        type="button"
        className="icon-button close-button"
        aria-label="Close tooltip"
        onClick={onClose}
      >
        x
      </button>
      <SkillDisplay view={view} />
      {view.kind === "known" ? (
        <>
          <section>
            <h3>Description</h3>
            <p>{view.tooltipText}</p>
            {view.tooltipDetail === null ? null : <p>{view.tooltipDetail}</p>}
          </section>
          {view.assumptions.length === 0 ? null : (
            <section>
              <h3>Assumptions</h3>
              {view.assumptions.map((assumption) => (
                <p key={assumption}>{assumption}</p>
              ))}
            </section>
          )}
          {view.progression.length === 0 ? null : (
            <section>
              <h3>Progression</h3>
              {view.progression.map((series) => (
                <details key={series.id}>
                  <summary>{series.dependencyLabel}</summary>
                  <div className="progression-grid">
                    {series.rows.map((row) => (
                      <span key={`${series.id}:${row.rank}`}>
                        {row.rank}: {row.values.join(", ")}
                      </span>
                    ))}
                  </div>
                </details>
              ))}
            </section>
          )}
        </>
      ) : null}
    </aside>
  );
}
