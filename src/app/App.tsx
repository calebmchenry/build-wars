import { useReducer } from "react";

import { promotedAppCatalogs } from "./catalogs";
import { AttributeEditor } from "./components/AttributeEditor";
import { CatalogAttribution } from "./components/CatalogAttribution";
import { ProfessionModeEditor } from "./components/ProfessionModeEditor";
import { SkillBar } from "./components/SkillBar";
import { SkillBrowser } from "./components/SkillBrowser";
import { SkillTooltip } from "./components/SkillTooltip";
import { TemplateControls } from "./components/TemplateDialogs";
import { ValidationPanel } from "./components/ValidationPanel";
import { selectSkillDisplay, selectValidationView } from "./editor-selectors";
import { createBlankEditorState, editorReducer } from "./editor-state";

export function App() {
  const catalogState = promotedAppCatalogs;
  const [state, dispatch] = useReducer(editorReducer, undefined, () => createBlankEditorState());

  if (catalogState.status === "error") {
    return (
      <main className="app-shell catalog-error-shell" aria-labelledby="app-title">
        <section className="editor-panel catalog-error-state">
          <p className="eyebrow">Catalog error</p>
          <h1 id="app-title">Build Wars</h1>
          <h2>Catalogs could not be adapted</h2>
          <ul>
            {catalogState.error.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  const catalogs = catalogState.catalogs;
  const validation = selectValidationView(state, catalogs);
  const tooltipView =
    state.tooltip.skillId === null
      ? null
      : selectSkillDisplay(catalogs, state, state.tooltip.skillId, "tooltip");

  return (
    <main className="app-shell editor-shell" aria-labelledby="app-title" data-catalog-state="ready">
      <CatalogAttribution attribution={catalogs.attribution} />
      <div className="workspace-layout">
        <div className="left-column">
          <ProfessionModeEditor
            state={state}
            catalogs={catalogs}
            validation={validation.result}
            dispatch={dispatch}
          />
          <AttributeEditor
            state={state}
            catalogs={catalogs}
            validation={validation}
            dispatch={dispatch}
          />
          <TemplateControls
            state={state}
            catalogs={catalogs}
            validation={validation}
            dispatch={dispatch}
          />
          <ValidationPanel validation={validation} />
        </div>
        <div className="main-column">
          <SkillBar state={state} catalogs={catalogs} dispatch={dispatch} />
          <SkillBrowser state={state} catalogs={catalogs} dispatch={dispatch} />
        </div>
        <SkillTooltip
          view={tooltipView}
          onClose={() => dispatch({ type: "set-tooltip", skillId: null, pinned: false })}
        />
      </div>
      <div className="live-region" role="status" aria-live="polite">
        {state.transient?.text ?? ""}
      </div>
    </main>
  );
}
