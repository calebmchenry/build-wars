import { useRef, type Dispatch } from "react";

import { type BuildSetEntryId, type PartySlotId } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import { selectComposerLoadoutContext } from "../composer-selectors";
import type { ValidationView } from "../editor-selectors";
import type { EditorAction } from "../editor-state";
import { selectPartyWorkspaceView } from "../party-selectors";
import {
  generateBuildSetEntryId,
  generateNestedBuildId,
  type WorkspaceAction,
  type WorkspaceState
} from "../workspace-state";
import { ComposerHeader } from "./ComposerHeader";
import { FocusedAttributeEditor } from "./FocusedAttributeEditor";
import { FocusedSkillCatalog } from "./FocusedSkillCatalog";
import { InlineTemplateCode } from "./InlineTemplateCode";
import { SkillBar } from "./SkillBar";

export function BuildComposer({
  workspace,
  catalogs,
  validation,
  editorDispatch,
  workspaceDispatch,
  requestDraftReplacement
}: {
  readonly workspace: WorkspaceState;
  readonly catalogs: AppCatalogViews;
  readonly validation: ValidationView;
  readonly editorDispatch: Dispatch<EditorAction>;
  readonly workspaceDispatch: Dispatch<WorkspaceAction>;
  readonly requestDraftReplacement: (() => "cancel" | "discard") | undefined;
}) {
  const sequenceRef = useRef(1);
  const context = selectComposerLoadoutContext(workspace);
  const nextEntryId = () =>
    generateBuildSetEntryId(new Date().toISOString(), sequenceRef.current++);

  if (!context.selected) {
    return (
      <section className="composer-layout no-selected-layout" aria-labelledby="composer-title">
        <NoSelectedLoadout
          workspace={workspace}
          catalogs={catalogs}
          onAddLoadout={(label) => {
            const entryId = nextEntryId();
            workspaceDispatch({
              type: "add-blank-build-set-entry",
              entryId,
              buildId: generateNestedBuildId(entryId),
              label
            });
          }}
          onCreatePartyMember={(slotId) => {
            const entryId = nextEntryId();
            workspaceDispatch({
              type: "create-party-member",
              slotId,
              entryId,
              buildId: generateNestedBuildId(entryId),
              label: "New Party Member"
            });
          }}
          onAssignPartyMember={(slotId, entryId) =>
            workspaceDispatch({ type: "assign-party-slot", slotId, entryId })
          }
        />
        <section className="catalog-panel no-selected-catalog" aria-labelledby="catalog-title">
          <h2 id="catalog-title">Skills Catalog</h2>
          <p>Select, create, or assign a loadout before placing catalog skills.</p>
        </section>
      </section>
    );
  }

  return (
    <section className="composer-layout" aria-label="Focused build composer">
      <div className="composer-build-panel">
        <ComposerHeader
          state={workspace.editor}
          catalogs={catalogs}
          validation={validation.result}
          context={context}
          dispatch={editorDispatch}
        />
        <FocusedAttributeEditor
          state={workspace.editor}
          catalogs={catalogs}
          validation={validation}
          dispatch={editorDispatch}
        />
        <SkillBar state={workspace.editor} catalogs={catalogs} dispatch={editorDispatch} />
        <InlineTemplateCode
          state={workspace.editor}
          catalogs={catalogs}
          validation={validation}
          dispatch={editorDispatch}
          requestDraftReplacement={requestDraftReplacement}
          selectedLoadoutOnly={context.selectedLoadoutOnly}
        />
      </div>
      <FocusedSkillCatalog state={workspace.editor} catalogs={catalogs} dispatch={editorDispatch} />
    </section>
  );
}

function NoSelectedLoadout({
  workspace,
  catalogs,
  onAddLoadout,
  onCreatePartyMember,
  onAssignPartyMember
}: {
  readonly workspace: WorkspaceState;
  readonly catalogs: AppCatalogViews;
  readonly onAddLoadout: (label: string) => void;
  readonly onCreatePartyMember: (slotId: PartySlotId) => void;
  readonly onAssignPartyMember: (slotId: PartySlotId, entryId: BuildSetEntryId) => void;
}) {
  const context = selectComposerLoadoutContext(workspace);
  const party = selectPartyWorkspaceView(workspace, catalogs);
  const slotId = context.kind === "empty-party-slot" ? context.selectedPartySlotId : null;

  return (
    <section className="composer-build-panel no-selected-panel" aria-labelledby="composer-title">
      <div className="empty-loadout-panel">
        <p className="eyebrow">{context.label}</p>
        <h1 id="composer-title">No Selected Loadout</h1>
        <p>
          Choose an existing loadout or create one before editing professions, attributes, skills,
          and template code.
        </p>
        {context.kind === "empty-build-set" ? (
          <button type="button" onClick={() => onAddLoadout("Loadout 1")}>
            Add Loadout
          </button>
        ) : null}
        {context.kind === "empty-party-slot" && slotId !== null ? (
          <div className="no-selected-actions">
            <button type="button" onClick={() => onCreatePartyMember(slotId)}>
              Create Member
            </button>
            {party?.unassignedEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onAssignPartyMember(slotId, entry.id)}
              >
                Assign {entry.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
