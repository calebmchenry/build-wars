import type { Dispatch } from "react";

import type { EditorAction } from "../editor-state";
import type { ArmorEquipmentSlotView } from "../equipment-selectors";
import { EquipmentCombobox } from "./EquipmentCombobox";
import { InlineIssues } from "./ProfessionModeEditor";

export function ArmorEquipmentEditor({
  slots,
  dispatch
}: {
  readonly slots: readonly ArmorEquipmentSlotView[];
  readonly dispatch: Dispatch<EditorAction>;
}) {
  return (
    <section className="equipment-section armor-equipment" aria-labelledby="armor-equipment-title">
      <div className="equipment-section-heading">
        <h3 id="armor-equipment-title">Armor</h3>
        <span>Five slots</span>
      </div>
      <div className="armor-slot-list">
        {slots.map((slot) => (
          <article key={slot.slot} className="equipment-row armor-row">
            <div className="equipment-row-heading">
              <div>
                <h4>{slot.label}</h4>
                <span>{slot.summary.length === 0 ? "No upgrades" : slot.summary.join(" / ")}</span>
              </div>
            </div>
            <div className="equipment-control-grid">
              <EquipmentCombobox
                label={`${slot.label} rune`}
                selected={slot.rune}
                options={slot.runeOptions}
                clearLabel={`Clear ${slot.label.toLowerCase()} rune`}
                onSelect={(selection) =>
                  dispatch({ type: "set-armor-rune", slot: slot.slot, selection })
                }
                onClear={() =>
                  dispatch({ type: "clear-armor-field", slot: slot.slot, field: "rune" })
                }
              />
              <EquipmentCombobox
                label={`${slot.label} insignia`}
                selected={slot.insignia}
                options={slot.insigniaOptions}
                clearLabel={`Clear ${slot.label.toLowerCase()} insignia`}
                onSelect={(selection) =>
                  dispatch({ type: "set-armor-insignia", slot: slot.slot, selection })
                }
                onClear={() =>
                  dispatch({ type: "clear-armor-field", slot: slot.slot, field: "insignia" })
                }
              />
              {slot.headgearAvailable ? (
                <EquipmentCombobox
                  label="Headgear bonus"
                  selected={slot.headgearAttribute}
                  options={slot.headgearOptions}
                  disabled={
                    slot.headgearOptions.length === 0 && slot.headgearAttribute.state === "empty"
                  }
                  disabledReason="Select a primary profession before choosing a headgear bonus."
                  clearLabel="Clear headgear bonus"
                  onSelect={(selection) => dispatch({ type: "set-headgear-attribute", selection })}
                  onClear={() =>
                    dispatch({
                      type: "clear-armor-field",
                      slot: slot.slot,
                      field: "headgearAttribute"
                    })
                  }
                />
              ) : null}
            </div>
            <InlineIssues issues={slot.issues} />
          </article>
        ))}
      </div>
    </section>
  );
}
