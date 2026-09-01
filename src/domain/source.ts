import type { CatalogVersionId, SchemaVersion } from "./ids";

export const FOUNDATION_SCHEMA_VERSION = 1 satisfies SchemaVersion;

export interface SourceProvenance {
  readonly sourceName: string;
  readonly sourceUrl: string | null;
  readonly sourceRevision: string | number | null;
  readonly retrievedAt: string | null;
  readonly notes: string | null;
}

export interface CatalogVersionRef {
  readonly catalogVersion: CatalogVersionId | string | null;
  readonly generatedAt: string | null;
  readonly source: SourceProvenance | null;
}

export interface AuthoredDocumentRoot {
  readonly schemaVersion: SchemaVersion;
  readonly catalogVersion: CatalogVersionId | string | null;
}
