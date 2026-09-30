import { useMemo, useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/csr/ClipboardText";
import { CopySimpleIcon } from "@phosphor-icons/react/dist/csr/CopySimple";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { ArrowUpIcon } from "@phosphor-icons/react/dist/csr/ArrowUp";
import { ArrowDownIcon } from "@phosphor-icons/react/dist/csr/ArrowDown";
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import type { AppCatalogViews } from "../../catalogs";
import { selectSkillSlotDisplays } from "../../editor-selectors";
import { hydrateEditorFromSnapshot, type PersistedBuildSnapshot } from "../../persistence-schema";
import { CatalogIcon } from "../CatalogIcon";
import { SkillTooltipTrigger } from "../SkillTooltip";
import { GuideBuildInspector } from "./GuideBuildInspector";
import type { RuntimeGuideDocument } from "../../guide-state";
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
  getGuide,
  onOpenCatalog,
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
  readonly getGuide?: () => RuntimeGuideDocument;
  readonly onOpenCatalog?: () => void;
}) {
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const slots = useMemo(
    () =>
      catalogs ? selectSkillSlotDisplays(hydrateEditorFromSnapshot(snapshot), catalogs) : null,
    [snapshot, catalogs]
  );
  const profession = (value: number | null, role: "Primary" | "Secondary") => {
    const entry = catalogs?.professions.find((item) => Number(item.id) === value);
    const name = value === null ? "Any" : (entry?.name ?? `Profession ${value}`);
    const label = `${role} profession: ${name}`;
    return entry && catalogs ? (
      <CatalogIcon descriptor={{ ...catalogs.placeholders.profession(entry), label }} />
    ) : (
      <span title={label}>{name}</span>
    );
  };
  const bar = (
    <div
      className="skillbar guide-composer-bar"
      role="list"
      aria-label={`${snapshot.build.name} eight skill slots`}
    >
      {snapshot.build.skillBar.map((skillId, index) => {
        const view = slots?.[index];
        const title =
          view?.title ??
          snapshot.rawTemplate.skillBar[index]?.label ??
          (skillId ? `Skill ${skillId}` : "Empty");
        const content = (
          <button
            type="button"
            className="slot-button"
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
              if (readOnly || !event.dataTransfer.types.includes(GUIDE_SKILL_MIME)) return;
              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = "copy";
              setDropIndex(index);
            }}
            onDragLeave={() => setDropIndex(null)}
            onDropCapture={(event) => {
              if (readOnly || !event.dataTransfer.types.includes(GUIDE_SKILL_MIME)) return;
              setDropIndex(null);
              placement?.dropSlot(event, id, index);
            }}
            aria-label={`${snapshot.build.name} slot ${index + 1}: ${title}`}
            onClick={() => {
              if (readOnly) return;
              if (placement) {
                placement.selectSlot(id, index);
                onOpenCatalog?.();
                return;
              }
              send({ type: "select", buildId: id });
              send({ type: "intent", intent: { kind: "slot", buildId: id, index } });
            }}
          >
            <span
              className="skill-slot-art"
              data-state={view?.kind ?? (skillId ? "unresolved" : "empty")}
            >
              {view && view.kind !== "empty" && <CatalogIcon descriptor={view.placeholder} />}
            </span>
            <span className="skill-slot-number" aria-hidden="true">
              {index + 1}
            </span>
          </button>
        );
        return view ? (
          <SkillTooltipTrigger
            key={index}
            view={view}
            placement="above"
            role="listitem"
            className={`skill-slot-card ${slotIndex === index ? "selected-slot" : ""} ${dropIndex === index ? "guide-slot-drop" : ""}`}
          >
            {content}
          </SkillTooltipTrigger>
        ) : (
          <span key={index} role="listitem" className="skill-slot-card">
            {content}
          </span>
        );
      })}
    </div>
  );
  const editing = !readOnly && selected && catalogs && getGuide;
  const actions = (
    <div className="guide-card-actions" role="group" aria-label={`${snapshot.build.name} actions`}>
      {!readOnly && (
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => send({ type: "select", buildId: selected ? null : id })}
          aria-label={selected ? "Close build inspector" : `Edit ${snapshot.build.name}`}
          title={selected ? "Done editing" : "Edit build"}
        >
          {selected ? <CheckIcon aria-hidden="true" /> : <PencilSimpleIcon aria-hidden="true" />}
        </button>
      )}
      <button
        type="button"
        onClick={onCopy}
        disabled={!catalogs}
        aria-label={`Copy ${snapshot.build.name} template`}
        title="Copy template"
      >
        <ClipboardTextIcon aria-hidden="true" />
      </button>
      {!readOnly && (
        <>
          <button
            type="button"
            aria-label={`Duplicate ${snapshot.build.name}`}
            title="Duplicate build"
            onClick={() => send({ type: "duplicate-build", buildId: id, id: crypto.randomUUID() })}
          >
            <CopySimpleIcon aria-hidden="true" />
          </button>
          <button
            type="button"
            className="guide-card-delete"
            aria-label={`Delete ${snapshot.build.name}`}
            title="Delete build"
            onClick={() => {
              if (
                window.confirm(
                  `Delete “${snapshot.build.name}”? Bound references will remain unresolved until repaired. Undo can restore this build.`
                )
              )
                send({ type: "delete-build", buildId: id, retainUnresolved: true });
            }}
          >
            <TrashIcon aria-hidden="true" />
          </button>
          <button
            type="button"
            className="guide-card-move-up"
            onClick={() => send({ type: "move-build", buildId: id, direction: -1 })}
            aria-label={`Move ${snapshot.build.name} up`}
            title="Move build up"
          >
            <ArrowUpIcon aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => send({ type: "move-build", buildId: id, direction: 1 })}
            aria-label={`Move ${snapshot.build.name} down`}
            title="Move build down"
          >
            <ArrowDownIcon aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
  return (
    <section
      className={`guide-card composer-build-panel ${selected ? "selected" : ""} ${editing ? "is-editing" : ""}`}
      aria-label={snapshot.build.name}
      data-build-id={id}
    >
      {editing ? (
        <GuideBuildInspector
          id={id}
          snapshot={snapshot}
          catalogs={catalogs}
          getGuide={getGuide}
          send={send}
          actions={actions}
        >
          {bar}
        </GuideBuildInspector>
      ) : (
        <>
          <div className="guide-card-heading">
            <div className="guide-card-title">
              <strong>{snapshot.build.name}</strong>
              {actions}
            </div>
            <span className="guide-card-professions">
              {profession(snapshot.build.primaryProfessionId, "Primary")}
              <span aria-hidden="true">/</span>
              {profession(snapshot.build.secondaryProfessionId, "Secondary")}
              <span aria-hidden="true">·</span>
              <span>{snapshot.build.mode.toUpperCase()}</span>
            </span>
          </div>
          {bar}
        </>
      )}
      {readOnly && <GuideBuildDetails snapshot={snapshot} catalogs={catalogs} />}
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
