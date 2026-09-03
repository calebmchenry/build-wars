import type { ReactNode } from "react";

export type EditorWorkspaceTab = "equipment" | "skills";

export function EditorWorkspaceTabs({
  activeTab,
  onChange,
  skills,
  equipment
}: {
  readonly activeTab: EditorWorkspaceTab;
  readonly onChange: (tab: EditorWorkspaceTab) => void;
  readonly skills: ReactNode;
  readonly equipment: ReactNode;
}) {
  return (
    <section className="workspace-tabs" aria-label="Editor workspace">
      <div className="workspace-tab-list" role="tablist" aria-label="Workspace tabs">
        <button
          id="workspace-tab-skills"
          type="button"
          role="tab"
          aria-selected={activeTab === "skills"}
          aria-controls="workspace-panel-skills"
          className={activeTab === "skills" ? "active" : ""}
          onClick={() => onChange("skills")}
        >
          Skills
        </button>
        <button
          id="workspace-tab-equipment"
          type="button"
          role="tab"
          aria-selected={activeTab === "equipment"}
          aria-controls="workspace-panel-equipment"
          className={activeTab === "equipment" ? "active" : ""}
          onClick={() => onChange("equipment")}
        >
          Equipment
        </button>
      </div>
      <div
        id="workspace-panel-skills"
        role="tabpanel"
        aria-labelledby="workspace-tab-skills"
        hidden={activeTab !== "skills"}
      >
        {skills}
      </div>
      <div
        id="workspace-panel-equipment"
        role="tabpanel"
        aria-labelledby="workspace-tab-equipment"
        hidden={activeTab !== "equipment"}
      >
        {equipment}
      </div>
    </section>
  );
}
