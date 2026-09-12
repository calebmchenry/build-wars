import type { DragEvent, ReactNode } from "react";

import type { SkillDisplayView, SkillFactView } from "../editor-selectors";
import { skillFactAccessibleLabel } from "../skill-fact-text";
import { CatalogIcon } from "./CatalogIcon";
import { SkillActionIcon, SkillFactIcon } from "./SkillIcons";
import { SkillFactValue } from "./SkillFactValue";

export function SkillDisplay({
  view,
  action,
  iconDragHandle,
  compact = false
}: {
  readonly view: SkillDisplayView;
  readonly action?: ReactNode;
  readonly iconDragHandle?: SkillIconDragHandle;
  readonly compact?: boolean;
}) {
  const facts = view.kind === "known" ? view.facts : [];
  return (
    <article className={compact ? "skill-display compact-skill" : "skill-display"}>
      <SkillDisplayIcon view={view} iconDragHandle={iconDragHandle} />
      <div className="skill-display-body">
        <SkillDisplayTitle view={view} />
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

export interface SkillIconDragHandle {
  readonly label: string;
  readonly onDragStart: (event: DragEvent<HTMLSpanElement>) => void;
  readonly onDragEnd?: (event: DragEvent<HTMLSpanElement>) => void;
}

function SkillDisplayIcon({
  view,
  iconDragHandle
}: {
  readonly view: SkillDisplayView;
  readonly iconDragHandle: SkillIconDragHandle | undefined;
}) {
  const icon = <CatalogIcon descriptor={view.placeholder} />;
  if (iconDragHandle === undefined) {
    return icon;
  }

  return (
    <span
      className="skill-icon-drag-handle"
      draggable
      title={iconDragHandle.label}
      onDragStart={iconDragHandle.onDragStart}
      onDragEnd={iconDragHandle.onDragEnd}
    >
      {icon}
    </span>
  );
}

function SkillDisplayTitle({ view }: { readonly view: SkillDisplayView }) {
  if (view.kind !== "known") {
    return <strong className="skill-display-title">{view.title}</strong>;
  }

  return (
    <a
      className="skill-display-title skill-display-title-link"
      href={view.skill.wikiUrl}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {view.title}
    </a>
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
            aria-label={skillFactAccessibleLabel(fact)}
            title={skillFactAccessibleLabel(fact)}
          >
            <SkillFactIcon kind={fact.icon} label={fact.label} />
            <SkillFactValue fact={fact} />
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
          <dd aria-label={skillFactAccessibleLabel(fact)}>
            <SkillFactValue fact={fact} />
          </dd>
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
