import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AppCatalogViews } from "../../catalogs";
import type { RuntimeGuideDocument } from "../../guide-state";
import {
  captureGuideDocument,
  isCurrentGuideDocument,
  readGuideMarkdownFile,
  validateGuideIntake
} from "../../guide-files";
import { guideBuilds } from "../../../domain/guide";
export function GuideDialog({
  title,
  children,
  onClose
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}
export function GuideTransferDialog({
  getGuide,
  catalogs,
  onImport,
  onClose
}: {
  readonly getGuide: () => RuntimeGuideDocument;
  readonly catalogs: AppCatalogViews | null;
  readonly onImport: (raw: string) => boolean;
  readonly onClose: () => void;
}) {
  const [capture] = useState(() => captureGuideDocument(getGuide()));
  const [raw, setRaw] = useState("");
  const [message, setMessage] = useState("");
  const [validated, setValidated] = useState(false);
  const [reading, setReading] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const check = () => {
    if (!isCurrentGuideDocument(getGuide(), capture))
      throw new Error(
        "The guide changed. Cancel and reopen Markdown import; nothing was replaced."
      );
  };
  const validate = (text: string) => {
    check();
    const document = validateGuideIntake(
      text,
      catalogs,
      getGuide().history.frame.document.metadata.id
    );
    setMessage(
      `Ready: ${document.metadata.title}; ${guideBuilds(document).length} builds. Replaces the current guide. Undo restores it.`
    );
    setValidated(true);
  };
  return (
    <GuideDialog title="Import Markdown" onClose={onClose}>
      <p>Choose a Markdown file. Previewing it does not change your current guide.</p>
      <label>
        Markdown file
        <input
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          disabled={reading}
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            setReading(true);
            setValidated(false);
            try {
              const text = await readGuideMarkdownFile(file, getGuide, capture, catalogs);
              if (!active.current) return;
              setRaw(text);
              validate(text);
            } catch (error) {
              if (active.current)
                setMessage(
                  error instanceof Error
                    ? error.message
                    : "File could not be read. Nothing changed."
                );
            } finally {
              if (active.current) setReading(false);
            }
          }}
        />
      </label>
      <p role="status">{reading ? "Reading Markdown…" : message}</p>
      <div className="guide-actions">
        <button
          disabled={reading || !validated}
          onClick={() => {
            try {
              check();
              validateGuideIntake(raw, catalogs, getGuide().history.frame.document.metadata.id);
              if (onImport(raw)) onClose();
            } catch (error) {
              setValidated(false);
              setMessage(error instanceof Error ? error.message : "Markdown was not imported.");
            }
          }}
        >
          Replace guide with Markdown
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </GuideDialog>
  );
}
