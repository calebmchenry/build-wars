import type { ReactNode } from "react";

import type { SkillDisplayView, SkillFactView } from "../editor-selectors";
import { CatalogIcon } from "./CatalogIcon";

export function SkillDisplay({
  view,
  action,
  compact = false
}: {
  readonly view: SkillDisplayView;
  readonly action?: ReactNode;
  readonly compact?: boolean;
}) {
  const facts = view.kind === "known" ? view.facts : [];
  return (
    <article className={compact ? "skill-display compact-skill" : "skill-display"}>
      <CatalogIcon descriptor={view.placeholder} />
      <div className="skill-display-body">
        <strong>{view.title}</strong>
        <span>{view.subtitle}</span>
        {facts.length > 0 ? <SkillFacts facts={facts} compact={compact} /> : null}
      </div>
      {action}
    </article>
  );
}

function SkillFacts({
  facts,
  compact
}: {
  readonly facts: readonly SkillFactView[];
  readonly compact: boolean;
}) {
  const shown = compact ? facts.slice(0, 5) : facts.slice(0, 7);
  if (compact) {
    return (
      <div className="skill-fact-strip" aria-label="Skill cost and timing">
        {shown.map((fact) => (
          <span
            key={`${fact.label}:${fact.value}`}
            className={`skill-fact-glyph fact-${factKey(fact.label)}`}
            aria-label={`${fact.label} ${fact.value}`}
            title={`${fact.label}: ${fact.value}`}
          >
            <b aria-hidden="true">{glyphForFact(fact.label)}</b>
            {fact.value}
          </span>
        ))}
      </div>
    );
  }

  return (
    <dl>
      {shown.map((fact) => (
        <div key={`${fact.label}:${fact.value}`}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function glyphForFact(label: string): string {
  if (label.includes("Energy")) {
    return "E";
  }
  if (label.includes("Adrenaline")) {
    return "A";
  }
  if (label.includes("Sacrifice")) {
    return "%";
  }
  if (label.includes("Upkeep")) {
    return "U";
  }
  if (label.includes("Overcast")) {
    return "O";
  }
  if (label.includes("Activation")) {
    return "C";
  }
  if (label.includes("Recharge")) {
    return "R";
  }
  return "F";
}

function factKey(label: string): string {
  return label
    .replace(/^.*: /, "")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-");
}
