import { useEffect, useState, type Dispatch } from "react";

import type { AppCatalogViews } from "../catalogs";
import type { EditorAction, EditorState } from "../editor-state";
import type { ValidationView } from "../editor-selectors";
import {
  rememberedTemplateFolder,
  supportsTemplateFolders,
  type TemplateFolder
} from "../template-files";
import { TemplateBrowserDialog } from "./TemplateBrowserDialog";

export function TemplateFileControls(props: {
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly validation: ValidationView;
  readonly dispatch: Dispatch<EditorAction>;
  readonly requestDraftReplacement: (() => "cancel" | "discard") | undefined;
}) {
  const [mode, setMode] = useState<"load" | "save" | null>(null);
  const [folder, setFolder] = useState<TemplateFolder | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (supportsTemplateFolders()) {
      void rememberedTemplateFolder()
        .then((handle) => {
          if (!cancelled && handle?.kind === "directory") {
            setFolder((current) => current ?? { kind: "native", name: handle.name, handle });
          }
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="template-file-actions">
        <button type="button" aria-label="Load template" onClick={() => setMode("load")}>
          Load…
        </button>
        <button type="button" aria-label="Save template" onClick={() => setMode("save")}>
          Save…
        </button>
      </div>
      {mode === null ? null : (
        <TemplateBrowserDialog
          {...props}
          mode={mode}
          folder={folder}
          onFolderChange={setFolder}
          onClose={() => setMode(null)}
        />
      )}
    </>
  );
}
