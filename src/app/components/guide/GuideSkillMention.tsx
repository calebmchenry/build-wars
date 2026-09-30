import type { GuideNode } from "../../../domain/guide";
import type { AppCatalogViews } from "../../catalogs";
import type { AppliedGuide } from "../../guide-history";
import type { PersistedBuildSnapshot } from "../../persistence-schema";
import { selectGuideSkill } from "../../guide-selectors";
import { CatalogIcon } from "../CatalogIcon";
import { SkillTooltipTrigger } from "../SkillTooltip";
export type GuideSkillNode = Extract<GuideNode<PersistedBuildSnapshot>, { type: "skill" }>;
export function GuideSkillMention({
  node,
  document,
  catalogs,
  onEdit
}: {
  readonly node: GuideSkillNode;
  readonly document: AppliedGuide;
  readonly catalogs: AppCatalogViews | null;
  readonly onEdit?: () => void;
}) {
  const projection = catalogs
    ? selectGuideSkill(catalogs, document, node.skillId, node.context)
    : null;
  const label =
    projection?.label ??
    (node.context.kind === "generic" ? "Generic" : `${node.context.kind}: ${node.context.buildId}`);
  const title = projection?.view.title ?? node.skillId;
  const wikiUrl = projection?.view.kind === "known" ? projection.view.skill.wikiUrl : undefined;
  const skill = (
    <>
      {projection && <CatalogIcon descriptor={projection.view.placeholder} />}
      <span>{title}</span>
    </>
  );
  const content = (
    <>
      {wikiUrl ? (
        <a
          className="guide-skill-link"
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${title} — ${label}`}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {skill}
        </a>
      ) : (
        <span className="guide-skill-link" aria-label={`${title} — ${label}`}>
          {skill}
        </span>
      )}
      {onEdit && (
        <button
          type="button"
          className="guide-reference-context-button"
          aria-label={`Change context for ${title} — ${label}`}
          onClick={onEdit}
        >
          ⋯
        </button>
      )}
    </>
  );
  return projection ? (
    <SkillTooltipTrigger
      inline
      className={`guide-skill-reference guide-reference-${projection.status}`}
      view={projection.view}
      placement="above"
    >
      {content}
    </SkillTooltipTrigger>
  ) : (
    <span className="guide-skill-reference">{content}</span>
  );
}
