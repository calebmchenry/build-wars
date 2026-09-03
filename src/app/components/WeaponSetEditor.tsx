import type { Dispatch } from "react";

import type { EditorAction } from "../editor-state";
import type { WeaponHandView, WeaponSetView } from "../equipment-selectors";
import { EquipmentCombobox } from "./EquipmentCombobox";
import { InlineIssues } from "./ProfessionModeEditor";

export function WeaponSetEditor({
  sets,
  dispatch
}: {
  readonly sets: readonly WeaponSetView[];
  readonly dispatch: Dispatch<EditorAction>;
}) {
  return (
    <section
      className="equipment-section weapon-equipment"
      aria-labelledby="weapon-equipment-title"
    >
      <div className="equipment-section-heading">
        <h3 id="weapon-equipment-title">Weapon Sets</h3>
        <span>Four sets</span>
      </div>
      <div className="weapon-set-list">
        {sets.map((set) => (
          <article key={set.slot} className="equipment-row weapon-set-row">
            <div className="equipment-row-heading">
              <div>
                <h4>{set.label}</h4>
                <span>{set.occupancy}</span>
              </div>
              <button
                type="button"
                disabled={!set.canClear}
                onClick={() => dispatch({ type: "clear-weapon-set", setSlot: set.slot })}
              >
                Clear Set
              </button>
            </div>
            <div className="weapon-hand-grid">
              <WeaponHandControls set={set} hand={set.mainHand} dispatch={dispatch} />
              <WeaponHandControls set={set} hand={set.offHand} dispatch={dispatch} />
            </div>
            <InlineIssues issues={set.issues} />
          </article>
        ))}
      </div>
    </section>
  );
}

function WeaponHandControls({
  set,
  hand,
  dispatch
}: {
  readonly set: WeaponSetView;
  readonly hand: WeaponHandView;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  return (
    <section className="weapon-hand" aria-label={`${set.label} ${hand.label}`}>
      <div className="weapon-hand-heading">
        <strong>{hand.label}</strong>
        <button
          type="button"
          disabled={!hand.canClear}
          onClick={() =>
            dispatch({ type: "clear-weapon-hand", setSlot: set.slot, hand: hand.hand })
          }
        >
          Clear Hand
        </button>
      </div>
      <EquipmentCombobox
        label={`${set.label} ${hand.label} weapon`}
        selected={hand.selectedWeapon}
        options={hand.weaponOptions}
        clearLabel={`Clear ${set.label} ${hand.label.toLowerCase()} weapon`}
        onSelect={(selection) =>
          dispatch({
            type: "set-weapon",
            setSlot: set.slot,
            hand: hand.hand,
            selection
          })
        }
        onClear={() => dispatch({ type: "clear-weapon", setSlot: set.slot, hand: hand.hand })}
      />
      {hand.requirementNotes.length === 0 ? null : (
        <ul className="equipment-note-list">
          {hand.requirementNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      {hand.modifierControls.length === 0 ? (
        <p className="selected-detail">No modifier slots available for this hand.</p>
      ) : (
        <div className="modifier-list">
          {hand.modifierControls.map((modifier) => (
            <EquipmentCombobox
              key={modifier.key}
              label={`${set.label} ${hand.label} ${modifier.label}`}
              selected={modifier.selected}
              options={modifier.options}
              disabled={modifier.disabled}
              disabledReason={modifier.disabledReason}
              clearLabel={`Clear ${set.label} ${hand.label.toLowerCase()} ${modifier.label.toLowerCase()}`}
              onSelect={(selection) =>
                dispatch({
                  type: "set-weapon-modifier",
                  setSlot: set.slot,
                  hand: hand.hand,
                  modifierIndex: modifier.modifierIndex,
                  selection
                })
              }
              onClear={() =>
                dispatch({
                  type: "clear-weapon-modifier",
                  setSlot: set.slot,
                  hand: hand.hand,
                  modifierIndex: modifier.modifierIndex
                })
              }
            />
          ))}
        </div>
      )}
      <InlineIssues issues={hand.issues} />
      {hand.modifierControls.map((modifier) => (
        <InlineIssues key={`${modifier.key}:issues`} issues={modifier.issues} />
      ))}
    </section>
  );
}
