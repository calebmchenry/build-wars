import type { Dispatch } from "react";
import type { AttributePreviewRank, Build } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import type { EditorAction } from "../editor-state";
import { runeTierOptions } from "../rune-icons";
import { RuneIcon } from "./RuneIcon";

export function AttributeAdjustmentControls({
  rank,
  label,
  build,
  catalogs,
  headgearName,
  dispatch
}: {
  readonly rank: AttributePreviewRank;
  readonly label: string;
  readonly build: Build;
  readonly catalogs: AppCatalogViews;
  readonly headgearName: string;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  if (!rank.gearEligible || build.primaryProfessionId === null) return null;
  const override = build.attributeAdjustments?.runeOverrides.find(
    (row) => row.attributeId === rank.attributeId
  );
  const options = runeTierOptions(
    catalogs.equipment.runes,
    build.primaryProfessionId,
    rank.attributeId
  );
  const inherited = rank.contributions.find((c) => c.kind === "rune" && c.active);
  const unresolvedRune = rank.diagnostics.some(
    (d) => d.contribution === "rune" && d.uncertain && !d.suppressed
  );
  const headSelected = rank.contributions.some((c) => c.kind === "headgear" && c.active);
  const noneSelected =
    override !== undefined ? override.runeId === null : !unresolvedRune && inherited === undefined;
  return (
    <div className="attribute-gear-controls">
      <fieldset className="rune-options">
        <legend className="sr-only">{label} rune</legend>
        <label className="rune-segment" title="No rune bonus">
          <input
            className="sr-only"
            type="radio"
            name={`rune-${headgearName}-${rank.attributeId}`}
            aria-label={`${label} rune None`}
            checked={noneSelected}
            onChange={() =>
              dispatch({ type: "set-attribute-rune", attributeId: rank.attributeId, runeId: null })
            }
          />
          <span>None</span>
        </label>
        {options.map((option) => (
          <label
            key={option.amount}
            className="rune-segment"
            title={
              option.reason ??
              `${option.rune?.name}: +${option.amount}; ${option.healthPenalty} maximum Health`
            }
          >
            <input
              className="sr-only"
              type="radio"
              name={`rune-${headgearName}-${rank.attributeId}`}
              aria-label={`${option.rune?.name ?? `${label} rune`} +${option.amount}; ${option.healthPenalty ?? "unknown"} maximum Health`}
              disabled={option.rune === null}
              checked={
                option.rune !== null &&
                (override === undefined
                  ? !unresolvedRune && inherited?.amount === option.amount
                  : override.runeId === option.rune.id)
              }
              onChange={() => {
                if (option.rune !== null)
                  dispatch({
                    type: "set-attribute-rune",
                    attributeId: rank.attributeId,
                    runeId: option.rune.id
                  });
              }}
            />
            <RuneIcon asset={option.icon} />
            <span>+{option.amount}</span>
          </label>
        ))}
      </fieldset>
      <label className="headgear-option" title={`${label} headgear +1`}>
        <input
          type="radio"
          name={headgearName}
          aria-label={`${label} headgear +1`}
          checked={headSelected}
          onChange={() =>
            dispatch({
              type: "set-attribute-headgear",
              override: { kind: "attribute", attributeId: rank.attributeId }
            })
          }
        />
        <span>
          +1<span className="sr-only"> headgear</span>
        </span>
      </label>
      <div className="gear-inheritance">
        {override === undefined ? (
          <span>
            {unresolvedRune
              ? "Equipped rune unresolved"
              : inherited === undefined
                ? "No equipped rune"
                : "Equipped rune"}
          </span>
        ) : (
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "reset-attribute-rune", attributeId: rank.attributeId })
            }
            aria-label={`Use equipped rune for ${label}`}
          >
            Use equipped rune
          </button>
        )}
      </div>
    </div>
  );
}

export function AttributeAdjustmentRecovery({
  build,
  catalogs,
  dispatch
}: {
  readonly build: Build;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<EditorAction>;
}) {
  const profile = build.attributeAdjustments;
  if (profile === null) return null;
  const head = profile.headgearOverride;
  const invalidHead =
    head?.kind === "attribute" &&
    catalogs.attributes.filter(
      (a) => a.id === head.attributeId && a.professionId === build.primaryProfessionId
    ).length !== 1;
  const invalidRunes = profile.runeOverrides.filter((row) => {
    const attribute = catalogs.attributes.find(
      (a) => a.id === row.attributeId && a.professionId === build.primaryProfessionId
    );
    if (attribute === undefined) return true;
    if (row.runeId === null) return false;
    return !runeTierOptions(catalogs.equipment.runes, attribute.professionId, attribute.id).some(
      (o) => o.rune?.id === row.runeId
    );
  });
  if (!invalidHead && invalidRunes.length === 0) return null;
  return (
    <div className="adjustment-recovery" aria-label="Unresolved attribute adjustments">
      {invalidHead && head?.kind === "attribute" ? (
        <p>
          Retained headgear attribute {head.attributeId}.{" "}
          <button
            type="button"
            onClick={() => dispatch({ type: "set-attribute-headgear", override: null })}
          >
            Remove retained headgear
          </button>
        </p>
      ) : null}
      {invalidRunes.map((row) => (
        <p key={row.attributeId}>
          Retained rune {row.runeId ?? "None"} for attribute {row.attributeId}.{" "}
          <button
            type="button"
            onClick={() => dispatch({ type: "reset-attribute-rune", attributeId: row.attributeId })}
          >
            Remove retained rune for attribute {row.attributeId}
          </button>
        </p>
      ))}
    </div>
  );
}
