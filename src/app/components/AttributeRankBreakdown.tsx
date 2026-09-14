import { useEffect, useId, useRef, useState } from "react";
import type { AttributePreviewRank } from "../../domain";
import { useOutsidePointerDown } from "./useOutsidePointerDown";
import { useViewportAwarePopover } from "./useViewportAwarePopover";

export function AttributeRankBreakdown({
  rank,
  label,
  fallback
}: {
  readonly rank: AttributePreviewRank | null;
  readonly label: string;
  readonly fallback: number;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dismissing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const { anchorRef, popoverRef } = useViewportAwarePopover(open);
  const close = () => setOpen(false);
  useOutsidePointerDown(open, anchorRef, close);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    []
  );
  const show = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    if (!dismissing.current) setOpen(true);
  };
  const dismiss = () => {
    dismissing.current = true;
    setOpen(false);
    triggerRef.current?.focus();
    queueMicrotask(() => {
      dismissing.current = false;
    });
  };
  const value = rank?.effective ?? null;
  const increased = value !== null && rank?.base !== null && value > (rank?.base ?? fallback);
  return (
    <div
      ref={anchorRef}
      className="attribute-rank-anchor"
      onMouseEnter={show}
      onMouseLeave={() => {
        timer.current = setTimeout(() => {
          if (!anchorRef.current?.contains(document.activeElement)) setOpen(false);
        }, 180);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          dismiss();
        }
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        className="attribute-rank"
        data-increased={increased}
        aria-label={`${label}: ${value === null ? "effective rank unresolved" : `effective rank ${value}`}, base ${rank?.base ?? fallback}. Show rank breakdown`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onFocus={show}
        onClick={show}
      >
        <strong>{value ?? fallback}</strong>
      </button>
      {open ? (
        <div
          ref={popoverRef}
          id={id}
          className="attribute-rank-breakdown"
          role="dialog"
          aria-label={`${label} rank breakdown`}
        >
          <button
            className="close-button"
            type="button"
            aria-label="Close rank breakdown"
            onClick={dismiss}
          >
            ×
          </button>
          <strong>{label}</strong>
          <p>Base allocation: {rank?.base ?? "unresolved"}</p>
          <ul>
            {rank?.contributions.map((c, index) => (
              <li key={`${c.sourceId}:${index}`}>
                {c.suppressed
                  ? "Replaced equipped contribution"
                  : c.source === "inherited"
                    ? "Equipped"
                    : c.source === "assumed"
                      ? "Assumed"
                      : "Selected"}
                : {c.label} +{c.amount}
                {c.suppressed ? " (not added)" : !c.active ? " (inactive; not added)" : ""}
              </li>
            ))}
          </ul>
          <p>Equipment-adjusted: {rank?.equipmentAdjusted ?? "unresolved"}</p>
          <p>
            Uncapped total: {rank?.uncapped ?? "unresolved"}. Preview: {value ?? "unresolved"} (cap
            20).
          </p>
          {(rank?.clipped ?? 0) > 0 ? <p>{rank?.clipped} ranks clipped by the cap.</p> : null}
          {rank?.diagnostics.map((d, index) => (
            <p className="rank-diagnostic" key={index}>
              {d.suppressed ? "Replaced evidence: " : ""}
              {d.message}
            </p>
          ))}
          {value === null ? (
            <p>Effective rank unresolved; displayed fallback is the base allocation.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
