import { useEffect, useRef, useState } from "react";
import { guideBuilds, type GuideSkillContext } from "../../../domain/guide";
import type { AppliedGuide } from "../../guide-history";
import type { AppCatalogViews } from "../../catalogs";
import type { GuideSkillNode } from "./GuideSkillMention";
export function GuideReferenceDialog({
  node,
  document,
  catalogs,
  onSave,
  onClose
}: {
  readonly node: GuideSkillNode;
  readonly document: AppliedGuide;
  readonly catalogs: AppCatalogViews | null;
  readonly onSave: (node: GuideSkillNode) => void;
  readonly onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [skillId, setSkillId] = useState(node.skillId);
  const builds = guideBuilds(document);
  const initialContext =
    node.context.kind === "generic"
      ? "generic"
      : node.context.kind === "local" &&
          builds.some(
            (build) => build.id === (node.context.kind === "local" ? node.context.buildId : null)
          )
        ? `build:${node.context.buildId}`
        : "unresolved";
  const [context, setContext] = useState(initialContext);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-label="Skill reference context"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const nextContext: GuideSkillContext =
            context === "unresolved"
              ? node.context
              : context === "generic"
                ? { kind: "generic" }
                : { kind: "local", buildId: context.slice(6) };
          onSave({ type: "skill", skillId, context: nextContext });
        }}
      >
        <h2>Skill reference</h2>
        <label>
          Catalog skill ID
          <input
            autoFocus
            value={skillId}
            onChange={(event) => setSkillId(event.target.value)}
            list="guide-reference-skills"
            pattern="catalog:skill:[0-9]+"
            required
          />
        </label>
        <datalist id="guide-reference-skills">
          {catalogs?.skills.map((skill) => (
            <option key={Number(skill.id)} value={`catalog:skill:${Number(skill.id)}`}>
              {skill.name}
            </option>
          ))}
        </datalist>
        <label>
          Reference context
          <select value={context} onChange={(event) => setContext(event.target.value)}>
            <option value="generic">Generic — catalog ranges</option>
            {initialContext === "unresolved" && (
              <option value="unresolved">Keep unresolved identity</option>
            )}
            {builds.map((build) => (
              <option value={`build:${build.id}`} key={build.id}>
                {build.snapshot.build.name} · {build.id}
              </option>
            ))}
          </select>
        </label>
        {initialContext === "unresolved" && (
          <p>
            This reference is not bound to a local build. Choose Generic or an explicit build to
            repair it; matching names or IDs never repair it automatically.
          </p>
        )}
        <div className="guide-actions">
          <button type="submit">Apply reference</button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  );
}
