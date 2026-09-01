# Data Scripts

Future ingestion and QA scripts live here. They may import public contracts from `src/domain`,
read raw snapshots from `data/source-snapshots`, write normalized artifacts to `data/generated`,
and publish validation reports under `data/qa`.

The intended flow is fetch, snapshot, normalize, validate, and publish. Runtime app code must not
import from this directory.
