import { useLayoutEffect, useRef, useState } from "react";

import type { AppCatalogViews } from "../catalogs";
import { localSkillIconAsset } from "../icon-assets";
import type { ImportWorkflowResult } from "../template-workflow";
import { CatalogIcon } from "./CatalogIcon";

export function TemplatePreview({
  id,
  name,
  result,
  anchor,
  onMouseEnter,
  onMouseLeave
}: {
  readonly id: string;
  readonly name: string;
  readonly result: Extract<ImportWorkflowResult, { ok: true }>;
  readonly anchor: HTMLElement;
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false });
  useLayoutEffect(() => {
    const update = () => {
      const bounds = ref.current?.getBoundingClientRect();
      if (!bounds) return;
      const row = anchor.getBoundingClientRect();
      const list = anchor.parentElement?.getBoundingClientRect();
      const above = row.top - bounds.height - 8;
      setPosition({
        top: Math.max(
          12,
          Math.min(above >= 12 ? above : row.bottom + 8, window.innerHeight - bounds.height - 12)
        ),
        left: Math.max(12, Math.min(row.left + 28, window.innerWidth - bounds.width - 12)),
        ready: !list || (row.bottom >= list.top && row.top <= list.bottom)
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchor]);

  return (
    <aside
      ref={ref}
      id={id}
      role="tooltip"
      className="template-preview"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        top: position.top,
        left: position.left,
        visibility: position.ready ? "visible" : "hidden"
      }}
    >
      <TemplatePreviewContents name={name} result={result} />
    </aside>
  );
}

export function TemplatePreviewContents({
  name,
  result
}: {
  readonly name: string;
  readonly result: Extract<ImportWorkflowResult, { ok: true }>;
}) {
  const resolution = result.resolution;
  const professions = [resolution.primaryProfession, resolution.secondaryProfession]
    .filter((profession) => profession.kind !== "none")
    .map((profession) =>
      profession.kind === "known"
        ? profession.record.name
        : `Unknown profession ${profession.templateId}`
    );
  return (
    <>
      <strong className="template-preview-name">{name.replace(/\.txt$/i, "")}</strong>
      <p>{professions.join(" / ") || "Any profession"}</p>
      <p className="template-preview-attributes">
        {resolution.attributes
          .map(
            ({ outcome, attributeId, rank }) =>
              `${outcome.kind === "known" ? outcome.record.name : `Unknown attribute ${attributeId}`} ${rank}`
          )
          .join(", ") || "No attribute points assigned"}
      </p>
      <div className="template-preview-skills" aria-label="Template skill bar">
        {resolution.skillSlots.map((slot, index) => (
          <span
            key={index}
            className={
              slot.kind === "known" && slot.record.classification.elite
                ? "template-preview-slot elite"
                : "template-preview-slot"
            }
          >
            {slot.kind === "known" ? (
              <TemplateSkillIcon skill={slot.record} />
            ) : (
              <span
                role="img"
                aria-label={
                  slot.kind === "empty"
                    ? `Empty skill slot ${index + 1}`
                    : `Unknown skill ${slot.templateId}`
                }
              >
                {slot.kind === "empty" ? "" : "?"}
              </span>
            )}
          </span>
        ))}
      </div>
    </>
  );
}

// Filled in through the same approved local asset mapping used by the editor.
function TemplateSkillIcon({ skill }: { readonly skill: AppCatalogViews["skills"][number] }) {
  return (
    <CatalogIcon
      descriptor={{
        surface: "skill-bar",
        label: skill.name,
        initials: skill.name.slice(0, 2),
        mediaId: null,
        asset: localSkillIconAsset(skill)
      }}
    />
  );
}
