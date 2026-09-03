import { useState, type Dispatch } from "react";

import type { AppCatalogViews } from "../catalogs";
import { selectComposerLoadoutContext } from "../composer-selectors";
import { selectEquipmentPanelView } from "../equipment-selectors";
import { selectTitleRankPanelView, type ValidationView } from "../editor-selectors";
import type { EditorAction } from "../editor-state";
import type { PersistedCatalogFacts } from "../persistence-schema";
import { needsDirtyGuard, type WorkspaceAction, type WorkspaceState } from "../workspace-state";
import { BuildSetNavigator } from "./BuildSetNavigator";
import { EditorWorkspaceTabs, type EditorWorkspaceTab } from "./EditorWorkspaceTabs";
import { EquipmentPanel } from "./EquipmentPanel";
import { LibraryPanel } from "./LibraryPanel";
import { ShareControls } from "./ShareControls";
import { TemplateControls } from "./TemplateDialogs";
import { TitleRankPanel } from "./TitleRankPanel";
import { ValidationPanel } from "./ValidationPanel";

export function ComposerSecondaryTools({
  workspace,
  catalogs,
  validation,
  currentFacts,
  editorDispatch,
  workspaceDispatch,
  workspaceTab,
  onWorkspaceTabChange,
  shareRecordId,
  onShareRecord,
  onOpenBackup,
  onOpenRestore,
  onOpenTransfer,
  onOpenPartyTransfer
}: {
  readonly workspace: WorkspaceState;
  readonly catalogs: AppCatalogViews;
  readonly validation: ValidationView;
  readonly currentFacts: PersistedCatalogFacts;
  readonly editorDispatch: Dispatch<EditorAction>;
  readonly workspaceDispatch: Dispatch<WorkspaceAction>;
  readonly workspaceTab: EditorWorkspaceTab;
  readonly onWorkspaceTabChange: (tab: EditorWorkspaceTab) => void;
  readonly shareRecordId: string | null;
  readonly onShareRecord: (recordId: string | null) => void;
  readonly onOpenBackup: () => void;
  readonly onOpenRestore: () => void;
  readonly onOpenTransfer: () => void;
  readonly onOpenPartyTransfer: () => void;
}) {
  const [open, setOpen] = useState(false);
  const context = selectComposerLoadoutContext(workspace);
  const equipmentView = selectEquipmentPanelView(workspace.editor, catalogs, validation.result);
  const titleRankPanelView = selectTitleRankPanelView(
    workspace.editor,
    catalogs,
    validation.result
  );

  return (
    <section className="secondary-tools-shell" aria-labelledby="secondary-tools-title">
      <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary
          id="secondary-tools-title"
          onClick={(event) => {
            event.preventDefault();
            setOpen((current) => !current);
          }}
        >
          Secondary tools
        </summary>
        {open ? (
          <div className="secondary-tools-grid">
            <LibraryPanel
              workspace={workspace}
              catalogs={catalogs}
              currentFacts={currentFacts}
              dispatch={workspaceDispatch}
              onShareRecord={onShareRecord}
              onOpenBackup={onOpenBackup}
              onOpenRestore={onOpenRestore}
            />
            <BuildSetNavigator
              workspace={workspace}
              catalogs={catalogs}
              dispatch={workspaceDispatch}
              onOpenTransfer={onOpenTransfer}
              onOpenPartyTransfer={onOpenPartyTransfer}
            />
            {context.selected ? (
              <>
                <TemplateControls
                  state={workspace.editor}
                  catalogs={catalogs}
                  validation={validation}
                  dispatch={editorDispatch}
                  requestDraftReplacement={() =>
                    needsDirtyGuard(workspace) && !window.confirm("Discard unsaved draft changes?")
                      ? "cancel"
                      : "discard"
                  }
                  selectedLoadoutOnly={context.selectedLoadoutOnly}
                />
                <ShareControls
                  workspace={workspace}
                  catalogs={catalogs}
                  shareRecordId={shareRecordId}
                  dispatch={workspaceDispatch}
                />
                <ValidationPanel validation={validation} />
                <EditorWorkspaceTabs
                  activeTab={workspaceTab}
                  onChange={onWorkspaceTabChange}
                  skills={<TitleRankPanel view={titleRankPanelView} dispatch={editorDispatch} />}
                  equipment={<EquipmentPanel view={equipmentView} dispatch={editorDispatch} />}
                />
              </>
            ) : null}
          </div>
        ) : null}
      </details>
    </section>
  );
}
