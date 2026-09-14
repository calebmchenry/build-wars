import { useId, useState, type Dispatch } from "react";
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
  const contentId = useId();
  return (
    <section className="assumed-effects" aria-label="Assumed attribute effects">
      <button
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
          {preview.effects
            .filter(
              (effect) => effect.definition.external || effect.present || effect.preference !== null
            )
            .map((effect) => (
              <EffectChoice
                key={effect.definition.id}
                effect={effect}
                catalogs={catalogs}
                dispatch={dispatch}
              />
            ))}
        </div>
      ) : null}
    </section>
  );
}

function EffectChoice({
  effect,
  catalogs,
  dispatch
}: {
  readonly effect: AssumedAttributeEffectState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const descriptionId = useId();
  const { definition, preference } = effect;
  const skill = catalogs.skills.find((value) =>
    definition.templateIds.includes(Number(value.templateId))
  );
  const status = effect.active
    ? `Active: +${effect.amount}.`
    : `Inactive. ${effect.reason ?? "Not assumed active."}`;
  const description = [
    definition.external ? "Supplied by another party member." : null,
    preference === null
      ? definition.external
        ? "Default: off."
        : "Automatic from skill bar."
      : `Preference: ${preference.preference}.`,
    status
  ]
    .filter(Boolean)
    .join(" ");
  const setPreference = (enabled: boolean, strength: RefrainStrength = effect.strength) =>
    dispatch({
      type: "set-assumed-effect",
      value:
        definition.id === "heroic-refrain"
          ? { effectId: definition.id, preference: enabled ? "on" : "off", strength }
          : { effectId: definition.id, preference: enabled ? "on" : "off" }
    });
  return (
    <div className="assumed-effect-row" data-inactive={effect.requested && !effect.active}>
      <label className="assumed-effect-choice" title={`${definition.label}. ${description}`}>
        <input
          type="checkbox"
          checked={effect.requested}
          aria-label={definition.label}
          aria-describedby={descriptionId}
          onChange={(event) => setPreference(event.currentTarget.checked)}
        />
        {skill === undefined ? (
          <span>{definition.label}</span>
        ) : (
          <CatalogIcon descriptor={catalogs.placeholders.skill(skill, "tooltip")} />
        )}
      </label>
      <span id={descriptionId} className="sr-only">
        {description}
      </span>
      {definition.external ? (
        <select
          className="refrain-strength"
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
      ) : null}
    </div>
  );
}
