import { catalogId, type Build } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { createBlankEditorState, type EditorState } from "./editor-state";
import { importSkillTemplateToEditor } from "./template-workflow";

export function playableEditorFixture(): EditorState {
  const state = createBlankEditorState("Hammer and Bow");
  return {
    ...state,
    build: {
      ...state.build,
      name: "Hammer and Bow",
      mode: "pve",
      primaryProfessionId: catalogId<"Profession">(1),
      secondaryProfessionId: catalogId<"Profession">(2),
      attributes: [
        { attributeId: catalogId<"Attribute">(17), rank: 9 },
        { attributeId: catalogId<"Attribute">(19), rank: 10 },
        { attributeId: catalogId<"Attribute">(25), rank: 8 }
      ],
      skillBar: [
        catalogId<"Skill">(1),
        catalogId<"Skill">(316),
        catalogId<"Skill">(319),
        catalogId<"Skill">(331),
        catalogId<"Skill">(351),
        catalogId<"Skill">(391),
        catalogId<"Skill">(392),
        catalogId<"Skill">(398)
      ],
      titleRankOverrides: []
    },
    rawTemplate: {
      ...state.rawTemplate,
      attributes: [null, null, null]
    },
    browser: {
      ...state.browser,
      filters: {
        ...state.browser.filters,
        query: "shot"
      }
    },
    dialogs: {
      ...state.dialogs,
      exportName: "Hammer and Bow"
    }
  } satisfies EditorState;
}

export function incompleteEditorFixture(): EditorState {
  return createBlankEditorState("Incomplete Build");
}

export function importedUnresolvedEditorFixture(): EditorState {
  const catalogs = requireReadyCatalogs();
  const imported = importSkillTemplateToEditor(
    "OAAQIAAAAAAAAAAAAAAA",
    createBlankEditorState(),
    catalogs
  );
  if (!imported.ok) {
    throw new Error(imported.error.message);
  }
  return {
    ...imported.state,
    build: {
      ...imported.state.build,
      attributes: [
        ...imported.state.build.attributes,
        { attributeId: catalogId<"Attribute">(-100_001), rank: 1 }
      ],
      skillBar: [
        imported.state.build.skillBar[0],
        catalogId<"Skill">(-200_001),
        imported.state.build.skillBar[2],
        imported.state.build.skillBar[3],
        imported.state.build.skillBar[4],
        imported.state.build.skillBar[5],
        imported.state.build.skillBar[6],
        imported.state.build.skillBar[7]
      ]
    },
    rawTemplate: {
      ...imported.state.rawTemplate,
      attributes: [
        ...imported.state.rawTemplate.attributes,
        {
          namespace: "attribute",
          templateId: 26,
          catalogId: null,
          outcomeKind: "reserved",
          label: "Reserved attribute 26",
          reason: "Reserved template attribute gap."
        }
      ],
      skillBar: [
        imported.state.rawTemplate.skillBar[0],
        {
          namespace: "skill",
          templateId: 999999,
          catalogId: null,
          outcomeKind: "unknown",
          label: "Unknown skill 999999",
          reason: null
        },
        imported.state.rawTemplate.skillBar[2],
        imported.state.rawTemplate.skillBar[3],
        imported.state.rawTemplate.skillBar[4],
        imported.state.rawTemplate.skillBar[5],
        imported.state.rawTemplate.skillBar[6],
        imported.state.rawTemplate.skillBar[7]
      ]
    }
  };
}

export function playableBuildFixture(): Build {
  return playableEditorFixture().build;
}
