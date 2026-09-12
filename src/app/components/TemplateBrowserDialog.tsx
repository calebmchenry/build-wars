import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent
} from "react";

import type { AppCatalogViews } from "../catalogs";
import type { EditorAction, EditorState } from "../editor-state";
import type { ValidationView } from "../editor-selectors";
import { applyTemplateImport } from "../template-import";
import {
  downloadTemplateFile,
  importedTemplateFolder,
  isFileError,
  isFilePickerCancellation,
  pickTemplateFolder,
  readTemplateFile,
  readTemplateFolder,
  rememberedTemplateFolder,
  supportsTemplateFolders,
  templateFileError,
  templateFilename,
  writeTemplateFile,
  type TemplateFileEntry,
  type TemplateFileHandle,
  type TemplateFolder,
  type TemplateFolderContents
} from "../template-files";
import { importSkillTemplateToEditor, selectShareTemplateExport } from "../template-workflow";
import { TemplatePreview } from "./TemplatePreview";

export function TemplateBrowserDialog({
  mode,
  folder,
  onFolderChange,
  onClose,
  state,
  catalogs,
  validation,
  dispatch,
  requestDraftReplacement
}: {
  readonly mode: "load" | "save";
  readonly folder: TemplateFolder | null;
  readonly onFolderChange: (folder: TemplateFolder) => void;
  readonly onClose: () => void;
  readonly state: EditorState;
  readonly catalogs: AppCatalogViews;
  readonly validation: ValidationView;
  readonly dispatch: Dispatch<EditorAction>;
  readonly requestDraftReplacement: (() => "cancel" | "discard") | undefined;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const operation = useRef(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();
  const tooltipId = useId();
  const filenameId = useId();
  const [path, setPath] = useState<readonly string[]>([]);
  const [revision, setRevision] = useState(0);
  const [contents, setContents] = useState<TemplateFolderContents | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reconnect, setReconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [filename, setFilename] = useState(state.build.name);
  const [preview, setPreview] = useState<{ name: string; anchor: HTMLElement } | null>(null);
  const native = supportsTemplateFolders();
  const exported = selectShareTemplateExport(validation.exportPolicy);
  const rows = useMemo(
    () =>
      (contents?.files ?? []).map((file) => ({
        file,
        result: file.code === null ? null : importSkillTemplateToEditor(file.code, state, catalogs)
      })),
    [contents, state, catalogs]
  );
  const matchingRows = rows.filter(({ file }) =>
    file.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  const selected = rows.find(({ file }) => file.name === selectedName);
  const previewRow = rows.find(({ file }) => file.name === preview?.name);

  useLayoutEffect(() => {
    mounted.current = true;
    const trigger = document.activeElement;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      mounted.current = false;
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previewTimer.current !== null) clearTimeout(previewTimer.current);
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);

  function keepPreview() {
    if (previewTimer.current !== null) clearTimeout(previewTimer.current);
  }

  function hidePreview() {
    keepPreview();
    previewTimer.current = setTimeout(() => setPreview(null), 120);
  }

  function showPreview(name: string, element: HTMLElement) {
    keepPreview();
    setPreview({ name, anchor: element });
  }

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      setLoading(true);
      setContents(null);
      setSelectedName(null);
      setPreview(null);
      setError(null);
      setReconnect(false);
      try {
        if (folder === null) return;
        if (
          folder.kind === "native" &&
          (await folder.handle.queryPermission({ mode: "read" })) !== "granted"
        ) {
          if (!cancelled) setReconnect(true);
          return;
        }
        const next = await readTemplateFolder(folder, path);
        if (!cancelled) setContents(next);
      } catch (cause) {
        if (!cancelled) setError(templateFileError(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [folder, path, revision]);

  async function run(action: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setPreview(null);
    setError(null);
    try {
      await action();
    } catch (cause) {
      if (mounted.current && !isFilePickerCancellation(cause)) setError(templateFileError(cause));
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function changeFolder(next: TemplateFolder) {
    setPath([]);
    setQuery("");
    setNotice(null);
    onFolderChange(next);
    if (next.kind === "native") {
      void rememberedTemplateFolder(next.handle).catch(() => {
        if (mounted.current)
          setNotice("This folder is available for this visit, but could not be remembered.");
      });
    }
  }

  function chooseFolder() {
    if (!native) {
      folderInput.current?.click();
      return;
    }
    void run(async () => {
      const next = await pickTemplateFolder();
      if (mounted.current) changeFolder(next);
    });
  }

  function refreshFolder() {
    if (folder?.kind === "imported") folderInput.current?.click();
    else setRevision((current) => current + 1);
  }

  function navigate(next: readonly string[]) {
    setPath(next);
    setQuery("");
    setSelectedName(null);
    setPreview(null);
  }

  function loadFile(file: TemplateFileEntry) {
    void run(async () => {
      // Re-read the file: Guild Wars may have changed it since the list was opened.
      const code = file.handle ? await readTemplateFile(await file.handle.getFile()) : file.code;
      if (!mounted.current) return;
      if (code === null) throw new Error(file.error ?? "This template could not be read.");
      const decoded = importSkillTemplateToEditor(code, state, catalogs);
      if (!decoded.ok) throw new Error(decoded.error.message);
      if (
        applyTemplateImport({
          input: code,
          name: file.name.replace(/\.txt$/i, ""),
          state,
          catalogs,
          dispatch,
          requestDraftReplacement
        })
      )
        onClose();
    });
  }

  function saveFile() {
    void run(async () => {
      if (!exported.ok) throw new Error(exported.blockedReasons.join(" "));
      const name = templateFilename(filename);
      const directory = contents?.handle;
      if (native && !directory) throw new Error("Choose a template folder before saving.");
      if (directory) {
        // Request write access immediately from the Save click, before any disk reads.
        if ((await directory.requestPermission({ mode: "readwrite" })) !== "granted") {
          throw new Error("Allow editing this folder to save templates, then try Save again.");
        }
        if (!mounted.current) return;
        let existing: TemplateFileHandle | null = null;
        try {
          existing = await directory.getFileHandle(name);
        } catch (cause) {
          if (!isFileError(cause, "NotFoundError")) throw cause;
        }
        if (!mounted.current) return;
        if (existing && !window.confirm(`Replace “${existing.name}” with the current build?`))
          return;
        const handle = existing ?? (await directory.getFileHandle(name, { create: true }));
        await writeTemplateFile(handle, exported.bareCode);
      } else {
        downloadTemplateFile(name, exported.bareCode);
      }
      if (!mounted.current) return;
      dispatch({ type: "set-build-name", name: name.replace(/\.txt$/i, "") });
      dispatch({
        type: "set-message",
        tone: "success",
        text: directory ? `Saved “${name}”.` : `Download started for “${name}”.`
      });
      onClose();
    });
  }

  function rowKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const buttons = Array.from(
      event.currentTarget
        .closest(".template-file-list")
        ?.querySelectorAll<HTMLButtonElement>("button") ?? []
    );
    const index = buttons.indexOf(event.currentTarget);
    const next =
      event.key === "ArrowDown"
        ? Math.min(index + 1, buttons.length - 1)
        : event.key === "ArrowUp"
          ? Math.max(index - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : null;
    if (next !== null) {
      event.preventDefault();
      buttons[next]?.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal template-browser-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && preview !== null) {
          event.preventDefault();
          event.stopPropagation();
          setPreview(null);
        }
        if (event.key === "Tab") {
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              "button:not([disabled]), input:not([disabled]):not([hidden])"
            )
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{mode === "load" ? "Load Template" : "Save Template"}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="template-folder-toolbar">
        <span
          className="template-folder-location"
          title={folder ? [folder.name, ...path].join(" / ") : undefined}
        >
          {folder ? [folder.name, ...path].join(" / ") : "No template folder selected"}
        </span>
        <button type="button" disabled={busy || loading} onClick={chooseFolder}>
          {folder ? "Change Folder…" : "Choose Folder…"}
        </button>
        <button type="button" disabled={busy || loading || folder === null} onClick={refreshFolder}>
          Refresh
        </button>
      </div>
      <input
        ref={folderInput}
        type="file"
        hidden
        multiple
        {...{ webkitdirectory: "" }}
        aria-label="Template folder"
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          if (files.length > 0) changeFolder(importedTemplateFolder(files));
          event.currentTarget.value = "";
        }}
      />
      {!native ? (
        <p className="template-browser-hint">
          You can browse a folder here. Saving downloads a .txt file; move it into your game’s
          template folder to use it. Refresh asks you to select the folder again.
        </p>
      ) : null}
      {reconnect ? (
        <div className="template-reconnect">
          <p>Allow access to reopen “{folder?.name}”.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                if (
                  folder?.kind === "native" &&
                  (await folder.handle.requestPermission({ mode: "read" })) === "granted"
                ) {
                  setRevision((current) => current + 1);
                } else
                  throw new Error("Folder access was not granted. Choose a folder or try again.");
              })
            }
          >
            Reconnect Folder
          </button>
        </div>
      ) : null}
      {notice ? (
        <p className="template-browser-hint" role="status">
          {notice}
        </p>
      ) : null}
      <div className="template-browser-filter">
        {path.length > 0 ? (
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => navigate(path.slice(0, -1))}
          >
            ↑ Up
          </button>
        ) : null}
        <input
          type="search"
          aria-label="Search templates"
          placeholder="Search templates…"
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setSelectedName(null);
            setPreview(null);
          }}
        />
      </div>
      <div className="template-file-list" aria-label="Template files" aria-busy={loading}>
        {loading ? (
          <p className="template-browser-empty" role="status">
            Reading templates…
          </p>
        ) : null}
        {!loading && folder === null ? (
          <p className="template-browser-empty">
            Choose your Guild Wars Templates/Skills folder to browse saved builds.
          </p>
        ) : null}
        {contents?.directories
          .filter((name) => name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
          .map((name) => (
            <button
              key={`dir:${name}`}
              type="button"
              className="template-file-row template-directory-row"
              disabled={busy || loading}
              onKeyDown={rowKeyDown}
              onClick={() => navigate([...path, name])}
            >
              <span aria-hidden="true">▸</span>
              <span>{name}</span>
              <span className="template-file-kind">Folder</span>
            </button>
          ))}
        {matchingRows.map(({ file, result }) => {
          const issue = file.error ?? (result?.ok === false ? result.error.message : null);
          return (
            <button
              key={file.name}
              type="button"
              className="template-file-row"
              aria-pressed={selectedName === file.name}
              aria-label={file.name.replace(/\.txt$/i, "")}
              aria-describedby={preview?.name === file.name && result?.ok ? tooltipId : undefined}
              disabled={busy || loading}
              onKeyDown={rowKeyDown}
              onMouseEnter={(event) => showPreview(file.name, event.currentTarget)}
              onFocus={(event) => showPreview(file.name, event.currentTarget)}
              onMouseLeave={(event) => {
                if (document.activeElement !== event.currentTarget) hidePreview();
              }}
              onBlur={hidePreview}
              onClick={() => {
                setSelectedName(file.name);
                if (mode === "save") setFilename(file.name.replace(/\.txt$/i, ""));
              }}
              onDoubleClick={() => {
                if (mode === "load" && result?.ok) loadFile(file);
              }}
            >
              <span className="template-file-glyph" aria-hidden="true">
                ▤
              </span>
              <span className="template-file-label">
                {file.name.replace(/\.txt$/i, "")}
                {issue ? <small>{issue}</small> : null}
              </span>
              {issue ? <span className="template-file-kind">Unavailable</span> : null}
            </button>
          );
        })}
        {contents &&
        matchingRows.length === 0 &&
        !contents.directories.some((name) =>
          name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
        ) ? (
          <p className="template-browser-empty">
            {query ? "No templates match your search." : "No templates in this folder."}
          </p>
        ) : null}
      </div>
      {mode === "save" ? (
        <div className="dialog-field template-filename">
          <label htmlFor={filenameId}>Template name</label>
          <input
            id={filenameId}
            aria-describedby={`${filenameId}-hint`}
            value={filename}
            disabled={busy}
            onChange={(event) => setFilename(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveFile();
              }
            }}
          />
          <span id={`${filenameId}-hint`} className="template-browser-hint">
            Saves the editor’s current professions, attributes, and skills as a .txt template.
          </span>
        </div>
      ) : null}
      {mode === "save" && !exported.ok ? (
        <p className="template-browser-error">{exported.blockedReasons.join(" ")}</p>
      ) : null}
      {error ? (
        <p className="template-browser-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="dialog-actions">
        <button
          type="button"
          className="primary-button"
          disabled={
            busy ||
            loading ||
            (mode === "load"
              ? !selected?.result?.ok
              : !exported.ok || !filename.trim() || (native && !contents?.handle))
          }
          onClick={() => (mode === "load" ? selected && loadFile(selected.file) : saveFile())}
        >
          {busy
            ? mode === "load"
              ? "Loading…"
              : "Saving…"
            : mode === "load"
              ? "Load"
              : native
                ? "Save"
                : "Download"}
        </button>
        <button type="button" disabled={busy} onClick={onClose}>
          Cancel
        </button>
      </div>
      {preview && previewRow?.result?.ok && !busy ? (
        <TemplatePreview
          id={tooltipId}
          name={preview.name}
          result={previewRow.result}
          anchor={preview.anchor}
          onMouseEnter={keepPreview}
          onMouseLeave={hidePreview}
        />
      ) : null}
    </dialog>
  );
}
