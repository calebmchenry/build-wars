import { authoredDocumentId } from "../domain";
import type { GuideBuildAdapter } from "../guide/markdown";
import type { AppCatalogViews } from "./catalogs";
import { createBlankEditorState } from "./editor-state";
import {
  createPersistedBuildSnapshot,
  clonePersistedBuildSnapshot,
  validateGuideBuildSnapshot,
  type PersistedBuildSnapshot
} from "./persistence-schema";
import { importSkillTemplateToEditor } from "./template-workflow";
const validatedSnapshots = new WeakMap<object, PersistedBuildSnapshot>();
export function cloneGuideBuild(
  snapshot: PersistedBuildSnapshot,
  id: string
): PersistedBuildSnapshot {
  const copy = clonePersistedBuildSnapshot(snapshot);
  return { ...copy, build: { ...copy.build, id: authoredDocumentId(id) } };
}
export function guideBuildAdapter(
  catalogs: AppCatalogViews | null
): GuideBuildAdapter<PersistedBuildSnapshot> {
  return {
    validate(input) {
      if (input && typeof input === "object") {
        const cached = validatedSnapshots.get(input);
        if (cached) return cached;
        const validated = validateGuideBuildSnapshot(input);
        validatedSnapshots.set(input, validated);
        validatedSnapshots.set(validated, validated);
        return validated;
      }
      return validateGuideBuildSnapshot(input);
    },
    id: (snapshot) => snapshot.build.id,
    expandTemplate(code, id, mode) {
      if (!catalogs)
        throw new Error("Template expansion needs catalogs; complete snapshots remain readable.");
      const result = importSkillTemplateToEditor(
        code,
        { ...createBlankEditorState(), build: { ...createBlankEditorState().build, mode } },
        catalogs
      );
      if (!result.ok) throw new Error(result.error.message);
      const snapshot = createPersistedBuildSnapshot(result.state);
      return { ...snapshot, build: { ...snapshot.build, id: authoredDocumentId(id), mode } };
    }
  };
}
