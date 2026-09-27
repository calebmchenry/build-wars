import { useRef } from "react";
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
  const touch = useRef(false);
  const projection = catalogs
    ? selectGuideSkill(catalogs, document, node.skillId, node.context)
    : null;
  const label =
    projection?.label ??
    (node.context.kind === "generic" ? "Generic" : `${node.context.kind}: ${node.context.buildId}`);
  const title = projection?.view.title ?? node.skillId;
  const content = (
    <>
      <button
        type="button"
        className="guide-mention-button"
        aria-label={`${title} — ${label}${onEdit ? "; edit reference" : ""}`}
        onPointerDown={(event) => {
          event.stopPropagation();
          touch.current = event.pointerType === "touch";
        }}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={() => {
          touch.current = false;
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (!touch.current) onEdit?.();
        }}
      >
        {projection && <CatalogIcon descriptor={projection.view.placeholder} />}
        <span>{title}</span> <small>({label})</small>
      </button>
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
      className={`guide-reference-${projection.status}`}
      view={projection.view}
      placement="above"
    >
      {content}
    </SkillTooltipTrigger>
  ) : (
    content
  );
}
