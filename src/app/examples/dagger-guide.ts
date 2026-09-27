import source from "./dagger-guide.md?raw";
import { parseGuideMarkdown } from "../../guide/markdown";
import { guideBuildAdapter } from "../guide-build-adapter";
/** Bundled, original, complete snapshots: no network or catalog dependency. */
export function loadDaggerExample() {
  const parsed = parseGuideMarkdown(
    source,
    guideBuildAdapter(null),
    () => "dagger-workshop-example"
  );
  if (!parsed.ok)
    throw new Error(
      `Invalid bundled example: ${parsed.diagnostics.map((item) => item.message).join(" ")}`
    );
  return parsed.document;
}
