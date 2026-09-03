import type { Dispatch } from "react";

import type { EquipmentPanelView } from "../equipment-selectors";
import type { EditorAction } from "../editor-state";
import { ArmorEquipmentEditor } from "./ArmorEquipmentEditor";
import { EquipmentSummary } from "./EquipmentSummary";
import { WeaponSetEditor } from "./WeaponSetEditor";

export function EquipmentPanel({
  view,
  dispatch
}: {
  readonly view: EquipmentPanelView;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  return (
    <section className="editor-panel equipment-panel" aria-labelledby="equipment-panel-title">
      <div className="panel-heading">
        <div>
          <h2 id="equipment-panel-title">Equipment</h2>
          <span>
            {view.buildName} - {view.validationIssueCount} equipment issues
          </span>
        </div>
        <button
          type="button"
          disabled={!view.hasMaterializedEquipment}
          onClick={() => {
            if (
              view.hasMeaningfulEquipment &&
              !window.confirm("Remove all authored equipment from this build?")
            ) {
              return;
            }
            dispatch({ type: "reset-equipment" });
          }}
        >
          Reset Equipment
        </button>
      </div>
      <div className="equipment-readiness" aria-label="Equipment catalog readiness">
        {view.readinessList.map((readiness) => (
          <div
            key={readiness.family}
            className={readiness.status === "ready" ? "readiness-chip" : "readiness-chip error"}
          >
            <strong>{readiness.label}</strong>
            <span>
              {readiness.status === "ready"
                ? `${readiness.recordCount} records`
                : readiness.issues.join("; ")}
            </span>
          </div>
        ))}
      </div>
      {!view.hasMaterializedEquipment ? (
        <p className="equipment-empty-note">
          No semantic equipment is authored for this build. Pick any armor or weapon value to start.
        </p>
      ) : view.hasMeaningfulEquipment ? null : (
        <p className="equipment-empty-note">
          Equipment state is empty; local saves will preserve the canonical empty loadout.
        </p>
      )}
      <EquipmentSummary summary={view.summary} />
      <ArmorEquipmentEditor slots={view.armorSlots} dispatch={dispatch} />
      <WeaponSetEditor sets={view.weaponSets} dispatch={dispatch} />
    </section>
  );
}
