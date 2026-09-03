import { describe, expect, it } from "vitest";

import {
  authoredDocumentId,
  buildSetEntryId,
  catalogId,
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  type RuneId
} from "../domain";
import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import { requireReadyCatalogs } from "./catalogs";
import { playableEditorFixture } from "./editor-fixtures";
import { selectValidationView } from "./editor-selectors";
import { createBlankEditorState, editorReducer } from "./editor-state";
import {
  evaluateTemplateExport,
  importSkillTemplateToEditor,
  projectEditorToSkillTemplate,
  selectShareTemplateExport
} from "./template-workflow";
import {
  createInitialWorkspaceState,
  materializeActiveBuildSetSnapshot,
  workspaceReducer
} from "./workspace-state";

const catalogs = requireReadyCatalogs();

describe("template workflow", () => {
  it("imports bare codes transactionally and exposes exact-source replay", () => {
    const initial = createBlankEditorState();
    const imported = importSkillTemplateToEditor(SKILL_TEMPLATE_PACKAGE_EXAMPLE, initial, catalogs);

    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      throw new Error(imported.error.message);
    }
    expect(imported.state.build.mode).toBe("unknown");
    expect(Number(imported.state.build.primaryProfessionId)).toBe(7);

    const validation = selectValidationView(imported.state, catalogs);
    expect(validation.exportPolicy.exactSource.available).toBe(true);
    expect(validation.exportPolicy.exactSource.code?.bareCode).toBe(SKILL_TEMPLATE_PACKAGE_EXAMPLE);

    const failed = importSkillTemplateToEditor("not-a-code", imported.state, catalogs);
    expect(failed.ok).toBe(false);
    expect(failed.state).toBe(imported.state);
  });

  it("derives exact eligibility from reconstructed template fields", () => {
    const imported = importSkillTemplateToEditor(
      SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      createBlankEditorState(),
      catalogs
    );
    if (!imported.ok) {
      throw new Error(imported.error.message);
    }
    const edited = editorReducer(imported.state, {
      type: "place-skill",
      slotIndex: 0,
      skillId: catalogId<"Skill">(1)
    });
    const reverted = editorReducer(edited, {
      type: "place-skill",
      slotIndex: 0,
      skillId: catalogId<"Skill">(782)
    });

    expect(selectValidationView(edited, catalogs).exportPolicy.exactSource.available).toBe(false);
    expect(selectValidationView(reverted, catalogs).exportPolicy.exactSource.available).toBe(true);
  });

  it("allows canonical export only after projection and validation gates pass", () => {
    const state = playableEditorFixture();
    const validation = selectValidationView(state, catalogs);
    const exportView = evaluateTemplateExport(state, catalogs, validation.result);

    expect(exportView.canonical.available).toBe(true);
    expect(exportView.canonical.code?.bareCode.startsWith("O")).toBe(true);

    const blocked = editorReducer(state, {
      type: "place-skill",
      slotIndex: 0,
      skillId: catalogId<"Skill">(-200001)
    });
    const projection = projectEditorToSkillTemplate(blocked, catalogs, { allowRawOverlay: false });
    expect(projection.document).toBeNull();
    expect(projection.diagnostics[0]?.code).toBe("missing-skill-template-id");
  });

  it("blocks primary Any from canonical export while preserving secondary Any semantics", () => {
    const primaryAny = createBlankEditorState();
    const primaryProjection = projectEditorToSkillTemplate(primaryAny, catalogs, {
      allowRawOverlay: false
    });

    expect(primaryProjection.document).toBeNull();
    expect(primaryProjection.diagnostics).toContainEqual({
      code: "invalid-field-value",
      location: "primaryProfession",
      message: "Primary profession must be selected before canonical skill-template export."
    });

    const primarySelected = editorReducer(createBlankEditorState(), {
      type: "set-profession",
      field: "primary",
      professionId: catalogId<"Profession">(1)
    });
    const secondaryAny = {
      ...primarySelected,
      build: {
        ...primarySelected.build,
        secondaryProfessionId: null
      }
    };
    const secondaryValidation = selectValidationView(secondaryAny, catalogs);

    expect(secondaryValidation.exportPolicy.canonical.available).toBe(true);
  });

  it("selects share output from exact source first, then proven canonical output", () => {
    const imported = importSkillTemplateToEditor(
      SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      createBlankEditorState(),
      catalogs
    );
    if (!imported.ok) {
      throw new Error(imported.error.message);
    }

    const exact = selectShareTemplateExport(
      selectValidationView(imported.state, catalogs).exportPolicy
    );
    const canonical = selectShareTemplateExport(
      selectValidationView(playableEditorFixture(), catalogs).exportPolicy
    );
    const blocked = selectShareTemplateExport(
      selectValidationView(
        editorReducer(playableEditorFixture(), {
          type: "place-skill",
          slotIndex: 0,
          skillId: catalogId<"Skill">(-200001)
        }),
        catalogs
      ).exportPolicy
    );

    expect(exact).toMatchObject({
      ok: true,
      source: "exact-source",
      bareCode: SKILL_TEMPLATE_PACKAGE_EXAMPLE
    });
    expect(canonical.ok ? canonical.source : null).toBe("canonical");
    expect(blocked.ok).toBe(false);
    expect(blocked.ok ? [] : blocked.blockedReasons.length).toBeGreaterThan(0);
  });

  it("does not block canonical skill-template export on equipment-only validation errors", () => {
    const base = playableEditorFixture();
    const equipment = createEmptyEquipmentLoadout();
    const state = {
      ...base,
      build: {
        ...base.build,
        equipment: {
          ...equipment,
          armor: equipment.armor.map((piece) =>
            piece.slot === "head"
              ? { ...piece, rune: knownEquipmentSelection(catalogId<"Rune">(9999) as RuneId) }
              : piece
          )
        }
      }
    };
    const validation = selectValidationView(state, catalogs);

    expect(validation.result.issues.some((issue) => issue.code.startsWith("equipment."))).toBe(
      true
    );
    expect(validation.exportPolicy.canonical.available).toBe(true);
    expect(selectShareTemplateExport(validation.exportPolicy).ok).toBe(true);
  });

  it("replaces only the selected build-set entry snapshot on template import", () => {
    const entryId = buildSetEntryId("entry-template");
    const blankSet = workspaceReducer(createInitialWorkspaceState(), {
      type: "new-build-set",
      setId: authoredDocumentId("set-template"),
      decision: "discard"
    });
    const selected = workspaceReducer(blankSet, {
      type: "add-blank-build-set-entry",
      entryId,
      buildId: authoredDocumentId("build-selected"),
      label: "Original Label"
    });
    const withMetadata = workspaceReducer(
      workspaceReducer(selected, {
        type: "set-build-set-entry-kind",
        entryId,
        kind: "variant"
      }),
      {
        type: "set-build-set-entry-notes",
        entryId,
        notes: "Entry note"
      }
    );
    const imported = importSkillTemplateToEditor(
      SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      withMetadata.editor,
      catalogs
    );
    if (!imported.ok) {
      throw new Error(imported.error.message);
    }
    const replaced = workspaceReducer(withMetadata, {
      type: "editor",
      action: { type: "replace-state", state: imported.state }
    });
    const entry = materializeActiveBuildSetSnapshot(replaced)?.entries[0];

    expect(entry?.id).toBe(entryId);
    expect(entry?.label).toBe("Original Label");
    expect(entry?.kind).toBe("variant");
    expect(entry?.notes).toBe("Entry note");
    expect(entry?.snapshot.build.id).toBe(authoredDocumentId("build-selected"));
    expect(replaced.draftSession.associatedRecordId).toBeNull();
  });
});
