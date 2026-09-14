import { useId, useRef, useState, type Dispatch } from "react";
import type { AssumedAttributeEffectState, AttributePreview, RefrainStrength } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import type { EditorAction } from "../editor-state";
import { CatalogIcon } from "./CatalogIcon";

export function AssumedAttributeEffects({
  preview,
  catalogs,
  dispatch
}: {
  readonly preview: AttributePreview;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const [expanded, setExpanded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const contentId = useId();
  const row = (effect: AssumedAttributeEffectState) => (
    <EffectChoice
      key={effect.definition.id}
      effect={effect}
      catalogs={catalogs}
      dispatch={dispatch}
      onReset={() => {
        if (!effect.present && !effect.definition.external) trigger.current?.focus();
        dispatch({ type: "reset-assumed-effect", effectId: effect.definition.id });
      }}
    />
  );
  return (
    <section className="assumed-effects" aria-label="Assumed attribute effects">
      <button
        ref={trigger}
        type="button"
        className="assumed-effects-toggle"
        aria-expanded={expanded}
        aria-controls={expanded ? contentId : undefined}
        onClick={() => setExpanded((value) => !value)}
      >
        <span aria-hidden="true">{expanded ? "−" : "+"}</span> Assumed effects (
        {preview.activeEffectCount} active)
      </button>
      {expanded ? (
        <div id={contentId} className="assumed-effects-content">
          <p>
            Preview temporary bonuses while these effects are active. Purchased ranks and game
            template codes stay unchanged.
          </p>
          <div className="self-effects" aria-label="Effects from this skill bar">
            {preview.effects
              .filter(
                (effect) =>
                  !effect.definition.external && (effect.present || effect.preference !== null)
              )
              .map(row)}
          </div>
          <div className="external-effects" aria-label="External effects">
            <strong>External support</strong>
            <p>Assume another party member supplies Heroic Refrain at the chosen strength.</p>
            {preview.effects.filter((effect) => effect.definition.external).map(row)}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function EffectChoice({
  effect,
  catalogs,
  dispatch,
  onReset
}: {
  readonly effect: AssumedAttributeEffectState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
  readonly onReset: () => void;
}) {
  const descriptionId = useId();
  const { definition, preference } = effect;
  const skill = catalogs.skills.find((value) =>
    definition.templateIds.includes(Number(value.templateId))
  );
  const setPreference = (enabled: boolean, strength: RefrainStrength = effect.strength) =>
    dispatch({
      type: "set-assumed-effect",
      value:
        definition.id === "heroic-refrain"
          ? { effectId: definition.id, preference: enabled ? "on" : "off", strength }
          : { effectId: definition.id, preference: enabled ? "on" : "off" }
    });
  return (
    <div className="assumed-effect-row">
      <label className="assumed-effect-choice">
        <input
          type="checkbox"
          checked={effect.requested}
          aria-label={definition.label}
          aria-describedby={descriptionId}
          onChange={(event) => setPreference(event.currentTarget.checked)}
        />
        {skill === undefined ? null : (
          <CatalogIcon descriptor={catalogs.placeholders.skill(skill, "tooltip")} />
        )}
        <span>{definition.label}</span>
      </label>
      <div id={descriptionId} className="assumed-effect-status">
        <span>
          {preference === null
            ? definition.external
              ? "Default: off"
              : "Automatic"
            : `Preference: ${preference.preference}`}
        </span>
        <span>
          {effect.active
            ? `Active: +${effect.amount}`
            : `Inactive. ${effect.eligible && !effect.requested ? "Not assumed active." : (effect.reason ?? "Not assumed active.")}`}
        </span>
      </div>
      {definition.external ? (
        <label className="refrain-strength">
          Strength
          <select
            aria-label="Heroic Refrain strength"
            value={effect.strength}
            onChange={(event) =>
              setPreference(effect.requested, Number(event.currentTarget.value) as RefrainStrength)
            }
          >
            {[1, 2, 3, 4].map((strength) => (
              <option key={strength} value={strength}>
                +{strength}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {preference === null ? null : (
        <button type="button" onClick={onReset} aria-label={`Reset ${definition.label}`}>
          Reset
        </button>
      )}
    </div>
  );
}
