import type { ReactNode } from "react";

import type { SkillDisplayView, SkillFactView } from "../editor-selectors";
import { CatalogIcon } from "./CatalogIcon";
import { SkillActionIcon, SkillFactIcon } from "./SkillIcons";

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
        <strong className="skill-display-title">{view.title}</strong>
        <div className="skill-display-subtitle">
          {view.kind === "known" ? <SkillActionIcon icon={view.actionIcon} /> : null}
          <span>{view.subtitle}</span>
        </div>
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
            <SkillFactIcon kind={fact.icon} label={fact.label} />
            <span className="skill-fact-value">{fact.value}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <dl>
      {shown.map((fact) => (
        <div key={`${fact.label}:${fact.value}`}>
          <dt>
            <SkillFactIcon kind={fact.icon} label={fact.label} />
            <span>{fact.label}</span>
          </dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function factKey(label: string): string {
  return label
    .replace(/^.*: /, "")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-");
}
