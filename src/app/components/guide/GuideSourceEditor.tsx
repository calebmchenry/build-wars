import { useEffect, useRef, useState } from "react";
import type { RuntimeGuideDocument } from "../../guide-state";
import type { GuideDispatch } from "./GuideWorkspace";
export function GuideSourceEditor({
  guide,
  source,
  send,
  onDiscard,
  selectionRef
}: {
  readonly guide: RuntimeGuideDocument;
  readonly source: string;
  readonly send: GuideDispatch;
  readonly onDiscard: () => void;
  readonly selectionRef?: { current: { start: number; end: number } | null };
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const selection = selectionRef?.current;
    textarea.current?.focus();
    if (selection) textarea.current?.setSelectionRange(selection.start, selection.end);
  }, [selectionRef]);
  const [acknowledge, setAcknowledge] = useState(false);
  const recovery = guide.history.frame.recovery;
  const stale = recovery && recovery.baseRevision !== (guide.history.frame.appliedRevision ?? 0);
  return (
    <section className="guide-source" aria-label="Source editor">
      <p>
        Supported Markdown uses headings, paragraphs, lists, quotes, links, emphasis and code. Build
        and skill annotations preserve complete guide data. Ordinary Markdown spacing is normalized
        on export; retained opaque content keeps its exact bytes. HTML and remote media remain
        inert.
      </p>
      <label>
        Markdown source
        <textarea
          ref={textarea}
          aria-label="Markdown source"
          spellCheck={false}
          value={source}
          onSelect={(event) => {
            if (selectionRef)
              selectionRef.current = {
                start: event.currentTarget.selectionStart,
                end: event.currentTarget.selectionEnd
              };
          }}
          onChange={(event) => {
            setAcknowledge(false);
            send({ type: "source-edit", raw: event.currentTarget.value });
          }}
        />
      </label>
      {stale && (
        <label>
          <input
            type="checkbox"
            checked={acknowledge}
            onChange={(event) => setAcknowledge(event.target.checked)}
          />
          Replace the entire applied guide with this older source revision.
        </label>
      )}
      <div className="guide-actions">
        <button
          disabled={Boolean(stale && !acknowledge)}
          onClick={() => send({ type: "source-apply", acknowledgeReplacement: acknowledge })}
        >
          Apply source
        </button>
        <button onClick={onDiscard}>Discard source changes</button>
      </div>
      {guide.diagnostics.map((item, index) => (
        <p key={index} role="alert">
          {item.line}:{item.column} {item.message}
        </p>
      ))}
    </section>
  );
}
