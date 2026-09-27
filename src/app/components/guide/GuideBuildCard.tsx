import { useMemo, useState } from "react";
import type { AppCatalogViews } from "../../catalogs";
import { selectSkillSlotDisplays } from "../../editor-selectors";
import { hydrateEditorFromSnapshot, type PersistedBuildSnapshot } from "../../persistence-schema";
import { CatalogIcon } from "../CatalogIcon";
import { SkillTooltipTrigger } from "../SkillTooltip";
import type { GuideDispatch } from "./GuideWorkspace";
import type { useGuidePlacement } from "./useGuidePlacement";
import { GUIDE_SKILL_MIME, guideSlotHasContent } from "../../guide-placement";
import { selectAttributePreview } from "../../attribute-preview-selectors";
import { selectValidationView } from "../../editor-selectors";
import { selectShareTemplateExport } from "../../template-workflow";
export function GuideBuildCard({
  id,
  snapshot,
  catalogs,
  selected,
  readOnly = false,
  send,
  onCopy,
  placement,
  slotIndex = null
}: {
  readonly id: string;
  readonly snapshot: PersistedBuildSnapshot;
  readonly catalogs: AppCatalogViews | null;
  readonly selected: boolean;
  readonly readOnly?: boolean;
  readonly send: GuideDispatch;
  readonly onCopy: () => void;
  readonly placement?: ReturnType<typeof useGuidePlacement>;
  readonly slotIndex?: number | null;
}) {
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const slots = useMemo(
    () =>
      catalogs ? selectSkillSlotDisplays(hydrateEditorFromSnapshot(snapshot), catalogs) : null,
    [snapshot, catalogs]
  );
  const profession = (value: number | null) =>
    value === null
      ? "Any"
      : (catalogs?.professions.find((item) => Number(item.id) === value)?.name ??
        `Profession ${value}`);
  return (
    <section
      className={`guide-card ${selected ? "selected" : ""}`}
      aria-label={snapshot.build.name}
      data-build-id={id}
    >
      <div className="guide-card-heading">
        <strong>{snapshot.build.name}</strong>
        <span>
          {profession(snapshot.build.primaryProfessionId)} /{" "}
          {profession(snapshot.build.secondaryProfessionId)} · {snapshot.build.mode.toUpperCase()}
        </span>
      </div>
      <div className="guide-bar" aria-label={`${snapshot.build.name} eight skill slots`}>
        {snapshot.build.skillBar.map((skillId, index) => {
          const view = slots?.[index];
          const title =
            view?.title ??
            snapshot.rawTemplate.skillBar[index]?.label ??
            (skillId ? `Skill ${skillId}` : "Empty");
          const content = (
            <button
              type="button"
              className={
                dropIndex === index
                  ? "guide-slot-drop"
                  : slotIndex === index
                    ? "guide-slot-target"
                    : ""
              }
              draggable={!readOnly && guideSlotHasContent(snapshot, index)}
              onDragStartCapture={(event) => {
                if (readOnly) event.preventDefault();
                else placement?.startSlot(event, id, index);
              }}
              onDragEnd={(event) => {
                setDropIndex(null);
                placement?.dragEnd(event);
              }}
              onDragOverCapture={(event) => {
                if (readOnly) return;
                event.preventDefault();
                event.stopPropagation();
                if (event.dataTransfer.types.includes(GUIDE_SKILL_MIME)) {
                  event.dataTransfer.dropEffect = "copy";
                  setDropIndex(index);
                }
              }}
              onDragLeave={() => setDropIndex(null)}
              onDropCapture={(event) => {
                if (readOnly) return;
                setDropIndex(null);
                placement?.dropSlot(event, id, index);
              }}
              aria-label={`${snapshot.build.name} slot ${index + 1}: ${title}`}
              onClick={() => {
                if (readOnly) return;
                if (placement) {
                  placement.selectSlot(id, index);
                  return;
                }
                send({ type: "select", buildId: id });
                send({ type: "intent", intent: { kind: "slot", buildId: id, index } });
              }}
            >
              {view && view.kind !== "empty" ? (
                <CatalogIcon descriptor={view.placeholder} />
              ) : (
                <span>{index + 1}</span>
              )}
              <small>{title}</small>
            </button>
          );
          return view ? (
            <SkillTooltipTrigger key={index} view={view} placement="above">
              {content}
            </SkillTooltipTrigger>
          ) : (
            <span key={index}>{content}</span>
          );
        })}
      </div>
      {readOnly && <GuideBuildDetails snapshot={snapshot} catalogs={catalogs} />}
      <div className="guide-actions">
        {!readOnly && (
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => send({ type: "select", buildId: id })}
          >
            Edit {snapshot.build.name}
          </button>
        )}
        <button type="button" onClick={onCopy} disabled={!catalogs}>
          Copy {snapshot.build.name} template
        </button>
        {!readOnly && (
          <>
            <button
              onClick={() =>
                send({ type: "duplicate-build", buildId: id, id: crypto.randomUUID() })
              }
            >
              Duplicate {snapshot.build.name}
            </button>
            <button
              onClick={() => send({ type: "move-build", buildId: id, direction: -1 })}
              aria-label={`Move ${snapshot.build.name} up`}
            >
              ↑
            </button>
            <button
              onClick={() => send({ type: "move-build", buildId: id, direction: 1 })}
              aria-label={`Move ${snapshot.build.name} down`}
            >
              ↓
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Delete “${snapshot.build.name}”? Bound references will remain unresolved until repaired. Undo can restore this build.`
                  )
                )
                  send({ type: "delete-build", buildId: id, retainUnresolved: true });
              }}
            >
              Delete {snapshot.build.name}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
function GuideBuildDetails({
  snapshot,
  catalogs
}: {
  readonly snapshot: PersistedBuildSnapshot;
  readonly catalogs: AppCatalogViews | null;
}) {
  const preview = useMemo(
    () => (catalogs ? selectAttributePreview(snapshot.build, catalogs) : null),
    [snapshot, catalogs]
  );
  const output = useMemo(
    () =>
      catalogs
        ? selectShareTemplateExport(
            selectValidationView(hydrateEditorFromSnapshot(snapshot), catalogs).exportPolicy
          )
        : null,
    [snapshot, catalogs]
  );
  const attributeName = (id: number) =>
    catalogs?.attributes.find((item) => Number(item.id) === id)?.name ?? `Attribute ${id}`;
  const profile = snapshot.build.attributeAdjustments;
  return (
    <details className="guide-build-details">
      <summary>Details for {snapshot.build.name}</summary>
      <dl>
        <dt>Attributes</dt>
        <dd>
          <ul>
            {snapshot.build.attributes.map(({ attributeId, rank }) => (
              <li key={attributeId}>
                {attributeName(Number(attributeId))}: base {rank}; preview{" "}
                {preview?.ranks.get(attributeId)?.effective ?? "unavailable"}
              </li>
            ))}
          </ul>
        </dd>
        <dt>Headgear</dt>
        <dd>
          {profile?.headgearAttributeId == null
            ? "None"
            : attributeName(Number(profile.headgearAttributeId))}
        </dd>
        <dt>Runes</dt>
        <dd>
          {profile?.runes.length
            ? profile.runes
                .map((rune) => `${attributeName(Number(rune.attributeId))}: rune ${rune.runeId}`)
                .join(", ")
            : "None"}
        </dd>
        <dt>Title ranks</dt>
        <dd>
          {snapshot.build.titleRankOverrides.length
            ? snapshot.build.titleRankOverrides
                .map((title) => `${title.key}: ${title.rank}`)
                .join(", ")
            : "Catalog defaults"}
        </dd>
        <dt>Assumed effects</dt>
        <dd>
          {profile?.effectPreferences.length
            ? profile.effectPreferences
                .map(
                  (effect) =>
                    `${effect.effectId}: ${effect.preference}${!("strength" in effect) ? "" : ` (${effect.strength})`}`
                )
                .join(", ")
            : "Automatic"}
        </dd>
        <dt>Attribute budget</dt>
        <dd>
          Level {snapshot.pveBudget.level}; quests: {snapshot.pveBudget.questBonus}
        </dd>
        <dt>Game template</dt>
        <dd>
          {output?.ok ? (
            <code className="guide-template-code">{output.bareCode}</code>
          ) : output ? (
            output.blockedReasons.join(" ")
          ) : (
            "Catalog unavailable; complete snapshot is retained in Markdown."
          )}
        </dd>
      </dl>
      <p>
        Game codes omit guide text, reference context, rune/headgear, title and assumed-effect
        choices.
      </p>
    </details>
  );
}
