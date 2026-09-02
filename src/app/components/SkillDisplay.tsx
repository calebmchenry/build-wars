import type { ReactNode } from "react";

import type { PlaceholderIconDescriptor } from "../catalogs";
import type { SkillDisplayView } from "../editor-selectors";

export function PlaceholderIcon({
  descriptor
}: {
  readonly descriptor: PlaceholderIconDescriptor;
}) {
  return (
    <span
      className={`placeholder-icon placeholder-${descriptor.surface}`}
      aria-label={descriptor.label}
      title={
        descriptor.mediaId === null
          ? descriptor.label
          : `${descriptor.label} (${descriptor.mediaId})`
      }
    >
      {descriptor.initials}
    </span>
  );
}

export function SkillDisplay({
  view,
  action,
  compact = false
}: {
  readonly view: SkillDisplayView;
  readonly action?: ReactNode;
  readonly compact?: boolean;
}) {
  return (
    <article className={compact ? "skill-display compact-skill" : "skill-display"}>
      <PlaceholderIcon descriptor={view.placeholder} />
      <div className="skill-display-body">
        <strong>{view.title}</strong>
        <span>{view.subtitle}</span>
        {view.kind === "known" && !compact ? (
          <dl>
            {view.facts.slice(0, 4).map((fact) => (
              <div key={`${fact.label}:${fact.value}`}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {action}
    </article>
  );
}
