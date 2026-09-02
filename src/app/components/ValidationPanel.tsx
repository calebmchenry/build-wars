import type { ValidationView } from "../editor-selectors";

export function ValidationPanel({ validation }: { readonly validation: ValidationView }) {
  const result = validation.result;
  const globalIssues = result.issues.filter((issue) => issue.location === null);

  return (
    <section className="editor-panel validation-panel" aria-labelledby="validation-title">
      <div className="panel-heading">
        <div>
          <h2 id="validation-title">Validation</h2>
          <span>
            {result.counts.error} errors / {result.counts.warning} warnings / {result.counts.info}{" "}
            info
          </span>
        </div>
      </div>
      <dl className="validation-flags">
        <div>
          <dt>Valid</dt>
          <dd>{String(result.valid)}</dd>
        </div>
        <div>
          <dt>Complete</dt>
          <dd>{String(result.complete)}</dd>
        </div>
        <div>
          <dt>Resolved</dt>
          <dd>{String(result.resolved)}</dd>
        </div>
        <div>
          <dt>Exhaustive</dt>
          <dd>{String(result.exhaustive)}</dd>
        </div>
      </dl>
      <p className="catalog-version-note">
        PA {result.validatedAgainst.professionAttributeCatalogVersion ?? "none"} / Skills{" "}
        {result.validatedAgainst.skillCatalogVersion ?? "none"}
      </p>
      {result.truncation === null ? null : (
        <p className="warning-text">
          Validation truncated {result.truncation.observed} items at {result.truncation.limit}.
        </p>
      )}
      {[...globalIssues, ...validation.appDiagnostics].length === 0 ? (
        <p>No global issues.</p>
      ) : (
        <ul className="issue-list">
          {globalIssues.map((issue) => (
            <li key={`${issue.code}:${issue.path.join(".")}`}>{issue.message}</li>
          ))}
          {validation.appDiagnostics.map((diagnostic) => (
            <li key={`${diagnostic.location}:${diagnostic.message}`}>{diagnostic.message}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
