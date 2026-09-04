import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";

import type { SkillDisplayView, SkillFactView } from "../editor-selectors";
import { SkillDisplay } from "./SkillDisplay";
import { SkillFactIcon } from "./SkillIcons";

export type SkillTooltipPlacement = "above" | "left";

interface TooltipPosition {
  readonly top: number;
  readonly left: number;
  readonly ready: boolean;
}

type SkillTooltipTriggerProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  readonly view: SkillDisplayView;
  readonly placement: SkillTooltipPlacement;
  readonly children: ReactNode;
};

export function SkillTooltipTrigger({
  view,
  placement,
  children,
  className,
  onMouseEnter,
  onMouseLeave,
  onFocusCapture,
  onBlurCapture,
  "aria-describedby": ariaDescribedBy,
  ...props
}: SkillTooltipTriggerProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0, ready: false });
  const enabled = view.kind === "known";
  const visible = open && enabled;
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (trigger === null || tooltip === null || typeof window === "undefined") {
      return;
    }
    const next = placeTooltip(
      trigger.getBoundingClientRect(),
      tooltip.getBoundingClientRect(),
      placement,
      window.innerWidth,
      window.innerHeight
    );
    setPosition((current) =>
      current.ready === next.ready && current.top === next.top && current.left === next.left
        ? current
        : next
    );
  }, [placement]);

  useLayoutEffect(() => {
    if (!visible || typeof window === "undefined") {
      return undefined;
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [visible, updatePosition]);

  const describedBy = [ariaDescribedBy, visible ? tooltipId : null]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");

  const tooltipStyle: CSSProperties = {
    top: `${position.top}px`,
    left: `${position.left}px`,
    visibility: position.ready ? "visible" : "hidden"
  };

  return (
    <div
      {...props}
      ref={triggerRef}
      className={
        className === undefined ? "skill-tooltip-trigger" : `skill-tooltip-trigger ${className}`
      }
      aria-describedby={describedBy.length === 0 ? undefined : describedBy}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (enabled) {
          setPosition((current) => ({ ...current, ready: false }));
          setOpen(true);
        }
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        setOpen(false);
      }}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        if (enabled) {
          setPosition((current) => ({ ...current, ready: false }));
          setOpen(true);
        }
      }}
      onBlurCapture={(event) => {
        onBlurCapture?.(event);
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setOpen(false);
        }
      }}
    >
      {children}
      {visible && typeof document !== "undefined"
        ? createPortal(
            <GuildWarsSkillTooltip
              id={tooltipId}
              view={view}
              placement={placement}
              tooltipRef={tooltipRef}
              style={tooltipStyle}
            />,
            document.body
          )
        : null}
    </div>
  );
}

export function SkillTooltip({
  view,
  onClose
}: {
  readonly view: SkillDisplayView | null;
  readonly onClose: () => void;
}) {
  if (view === null) {
    return null;
  }

  return (
    <aside className="skill-tooltip" aria-label="Skill details">
      <button
        type="button"
        className="icon-button close-button"
        aria-label="Close tooltip"
        onClick={onClose}
      >
        x
      </button>
      <SkillDisplay view={view} />
      {view.kind === "known" ? (
        <>
          <section>
            <h3>Description</h3>
            <p>{view.tooltipText}</p>
            {view.tooltipDetail === null ? null : <p>{view.tooltipDetail}</p>}
          </section>
          {view.assumptions.length === 0 ? null : (
            <section>
              <h3>Assumptions</h3>
              {view.assumptions.map((assumption) => (
                <p key={assumption}>{assumption}</p>
              ))}
            </section>
          )}
          {view.progression.length === 0 ? null : (
            <section>
              <h3>Progression</h3>
              {view.progression.map((series) => (
                <details key={series.id}>
                  <summary>{series.dependencyLabel}</summary>
                  <div className="progression-grid">
                    {series.rows.map((row) => (
                      <span key={`${series.id}:${row.rank}`}>
                        {row.rank}: {row.values.join(", ")}
                      </span>
                    ))}
                  </div>
                </details>
              ))}
            </section>
          )}
        </>
      ) : null}
    </aside>
  );
}

function GuildWarsSkillTooltip({
  id,
  view,
  placement,
  tooltipRef,
  style
}: {
  readonly id: string;
  readonly view: Extract<SkillDisplayView, { readonly kind: "known" }>;
  readonly placement: SkillTooltipPlacement;
  readonly tooltipRef: MutableRefObject<HTMLElement | null>;
  readonly style: CSSProperties;
}) {
  const headerFacts = view.facts.filter(isHeaderFact);
  const detailText = tooltipDetailText(view);
  return (
    <aside
      id={id}
      ref={tooltipRef}
      className={`gw-skill-tooltip ${placement === "above" ? "from-skillbar" : "from-skill-menu"}`}
      role="tooltip"
      style={style}
    >
      <div className="gw-skill-tooltip-header">
        <strong className="gw-skill-tooltip-name">{view.title}</strong>
        {headerFacts.length === 0 ? null : (
          <span className="gw-skill-tooltip-facts" aria-label="Skill costs and timing">
            {headerFacts.map((fact) => (
              <span
                key={`${fact.label}:${fact.value}`}
                className={`gw-skill-tooltip-fact fact-${fact.icon}`}
                aria-label={`${fact.label} ${fact.value}`}
              >
                <span>{fact.value}</span>
                <SkillFactIcon kind={fact.icon} label={fact.label} />
              </span>
            ))}
          </span>
        )}
      </div>
      <p className="gw-skill-tooltip-description">
        {view.skill.description.state === "structured-only" ||
        view.tooltipState === "unresolved" ? (
          skillTypeSentence(view)
        ) : (
          <TooltipDescriptionSegments view={view} />
        )}
      </p>
      {detailText.length === 0 ? null : (
        <p className="gw-skill-tooltip-detail">{detailText.join(" ")}</p>
      )}
    </aside>
  );
}

function TooltipDescriptionSegments({
  view
}: {
  readonly view: Extract<SkillDisplayView, { readonly kind: "known" }>;
}) {
  const segments =
    view.tooltipSegments.length === 0
      ? [{ text: view.tooltipText, tone: "normal" as const }]
      : view.tooltipSegments;
  return (
    <>
      {segments.flatMap((segment, segmentIndex) =>
        segment.text.split("\n").flatMap((line, lineIndex, lines) => {
          const key = `${segmentIndex}:${lineIndex}`;
          const lineNode =
            line.length === 0 ? null : (
              <span
                key={`${key}:text`}
                className={segment.tone === "variable" ? "gw-skill-tooltip-variable" : undefined}
              >
                {line}
              </span>
            );
          return lineIndex === lines.length - 1
            ? [lineNode]
            : [lineNode, <br key={`${key}:break`} />];
        })
      )}
    </>
  );
}

function isHeaderFact(fact: SkillFactView): boolean {
  return fact.label.startsWith("Cost: ") || fact.label.startsWith("Timing: ");
}

function skillTypeSentence(view: Extract<SkillDisplayView, { readonly kind: "known" }>): string {
  const elite = view.skill.classification.elite ? "Elite " : "";
  return `${elite}${view.skill.type || "Skill"}.`;
}

function tooltipDetailText(
  view: Extract<SkillDisplayView, { readonly kind: "known" }>
): readonly string[] {
  const details: string[] = [];
  if (view.attributeLabel !== null) {
    details.push(`(Attrib: ${view.attributeLabel})`);
  } else {
    const titleFact = view.facts.find((fact) => fact.label.startsWith("Title: "));
    if (titleFact !== undefined) {
      details.push(`(${titleFact.label.replace("Title: ", "")} title rank)`);
    } else if (view.professionLabel !== null) {
      details.push(`(${view.professionLabel})`);
    }
  }
  if (view.tooltipState === "unresolved") {
    details.push(view.tooltipDetail ?? view.tooltipText);
  } else if (view.skill.description.state === "structured-only") {
    details.push("Concise description pending catalog review.");
  }
  details.push(...view.assumptions);
  return details;
}

function placeTooltip(
  trigger: DOMRect,
  tooltip: DOMRect,
  placement: SkillTooltipPlacement,
  viewportWidth: number,
  viewportHeight: number
): TooltipPosition {
  const margin = 8;
  const edgePadding = 8;
  if (placement === "above") {
    const top =
      trigger.top - tooltip.height - margin >= edgePadding
        ? trigger.top - tooltip.height - margin
        : trigger.bottom + margin;
    return {
      top: clamp(top, edgePadding, viewportHeight - tooltip.height - edgePadding),
      left: clamp(
        trigger.left + trigger.width / 2 - tooltip.width / 2,
        edgePadding,
        viewportWidth - tooltip.width - edgePadding
      ),
      ready: true
    };
  }

  const hasLeftRoom = trigger.left - tooltip.width - margin >= edgePadding;
  const left = hasLeftRoom ? trigger.left - tooltip.width - margin : trigger.right + margin;
  return {
    top: clamp(
      trigger.top + trigger.height / 2 - tooltip.height / 2,
      edgePadding,
      viewportHeight - tooltip.height - edgePadding
    ),
    left: clamp(left, edgePadding, viewportWidth - tooltip.width - edgePadding),
    ready: true
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
