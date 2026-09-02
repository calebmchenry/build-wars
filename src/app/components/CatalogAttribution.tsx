import type { CatalogAttributionView } from "../catalogs";

export function CatalogAttribution({
  attribution
}: {
  readonly attribution: CatalogAttributionView;
}) {
  return (
    <aside className="catalog-attribution" aria-labelledby="catalog-attribution-title">
      <div>
        <p className="eyebrow">Local catalog</p>
        <h1 id="app-title">Build Wars</h1>
      </div>
      <div className="attribution-copy">
        <h2 id="catalog-attribution-title">{attribution.heading}</h2>
        <p>{attribution.notice}</p>
        <p className="catalog-version-note">Generated {attribution.generatedAt}</p>
        <nav aria-label="Catalog sources">
          {attribution.sourceLinks.map((source) =>
            source.url === null ? (
              <span key={source.id}>{source.label}</span>
            ) : (
              <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label}
              </a>
            )
          )}
        </nav>
      </div>
    </aside>
  );
}
