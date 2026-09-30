import { useEffect, useLayoutEffect, useRef, useState, type Dispatch, type ReactNode } from "react";
import {
  BookOpen,
  CaretDown,
  CaretRight,
  CaretDoubleLeft,
  Plus,
  DotsThree,
  FileText,
  Stack,
  Sword,
  Copy,
  Trash,
  PencilSimple,
  ArrowSquareOut,
  DownloadSimple,
  Code
} from "@phosphor-icons/react";
import type { AppCatalogViews } from "../catalogs";
import { documentUrl, type DocumentLibraryAction } from "../document-library";
import {
  copyLibraryBuilds,
  LIBRARY_BUILD_MIME,
  libraryBuildDragPayload
} from "../guide-library-builds";
import { guideAddress } from "../guide-state";
import { serializeGuideMarkdown } from "../../guide/markdown";
import { downloadGuide } from "../guide-files";
import { selectValidationView } from "../editor-selectors";
import { selectShareTemplateExport } from "../template-workflow";
import {
  hydrateEditorFromSnapshot,
  localBuildRecordId,
  selectedPersistedBuildSnapshot,
  type LocalBuildRecordId,
  type PersistedCatalogFacts,
  type PersistedSavedDocumentRecord
} from "../persistence-schema";
import { guideCatalogFacts, type WorkspaceState } from "../workspace-state";
import { BackupDialog, LibraryModal, RestoreDialog } from "./LibraryDialogs";
import { useOutsidePointerDown } from "./useOutsidePointerDown";
import { BuildSetNavigator } from "./BuildSetNavigator";
import { BuildSetTransferDialog } from "./BuildSetTransferDialog";
import { PartyTransferDialog } from "./PartyTransferDialog";
import "./document-sidebar.css";

export function DocumentSidebar({
  workspace,
  catalogs,
  dispatch,
  themeControls,
  onOpenTab,
  onImportGuide
}: {
  readonly workspace: WorkspaceState;
  readonly catalogs: AppCatalogViews | null;
  readonly dispatch: Dispatch<DocumentLibraryAction>;
  readonly themeControls: ReactNode;
  readonly onOpenTab: (id: LocalBuildRecordId) => boolean;
  readonly onImportGuide: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({ guides: true, builds: true });
  const [menu, setMenu] = useState<LocalBuildRecordId | null>(null);
  const [dialog, setDialog] = useState<{
    kind: "rename" | "delete";
    id: LocalBuildRecordId;
    name: string;
  } | null>(null);
  const [backup, setBackup] = useState(false);
  const [restore, setRestore] = useState(false);
  const [setTools, setSetTools] = useState<"manage" | "transfer" | "party" | null>(null);
  const [message, setMessage] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const composing = workspace.document.kind === "guide" && workspace.document.composing;
  const close = () => {
    setOpen(false);
    setMenu(null);
    toggle.current?.focus();
  };
  const closeMenu = () => {
    setMenu(null);
    menuTrigger.current?.focus();
  };
  useOutsidePointerDown(open && !dialog && !backup && !restore && !setTools, root, () => {
    setOpen(false);
    setMenu(null);
  });
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);
  useEffect(() => {
    if (menu) menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
  }, [menu]);
  useLayoutEffect(() => {
    if (!menu) return;
    const position = () => {
      const anchor = menuTrigger.current?.getBoundingClientRect();
      const popup = menuRef.current;
      if (!anchor || !popup) return;
      const height = popup.getBoundingClientRect().height;
      Object.assign(popup.style, {
        left: `${Math.max(10, Math.min(anchor.right - 255, window.innerWidth - 265))}px`,
        top: `${Math.max(10, Math.min(anchor.bottom + 5, window.innerHeight - height - 10))}px`
      });
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [menu]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        dialog ||
        backup ||
        restore ||
        setTools ||
        event.defaultPrevented
      )
        return;
      event.preventDefault();
      if (menu) {
        setMenu(null);
        menuTrigger.current?.focus();
      } else {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open, menu, dialog, backup, restore, setTools]);
  const facts: PersistedCatalogFacts = guideCatalogFacts(workspace);
  const create = (kind: "guide" | "build" | "build-set" | "example") => {
    dispatch({ type: "create-document", kind, id: localBuildRecordId(crypto.randomUUID()) });
    setExpanded((value) => ({
      ...value,
      [kind === "guide" || kind === "example" ? "guides" : "builds"]: true
    }));
    setMessage("");
    close();
  };
  const copyTemplate = async (record: PersistedSavedDocumentRecord) => {
    const snapshot = selectedPersistedBuildSnapshot(record.document);
    if (!snapshot || !catalogs) {
      setMessage("Select a loadout with an available skill catalog before copying its template.");
      return;
    }
    const output = selectShareTemplateExport(
      selectValidationView(hydrateEditorFromSnapshot(snapshot), catalogs).exportPolicy
    );
    if (!output.ok) {
      setMessage(output.blockedReasons.join(" "));
      return;
    }
    try {
      await navigator.clipboard.writeText(output.bareCode);
      setMessage(`Copied template for ${record.name}.`);
    } catch {
      setMessage("Clipboard access was denied. Open the build to select its template code.");
    }
  };
  const row = (record: PersistedSavedDocumentRecord) => {
    const selected = workspace.draftSession.associatedRecordId === record.id;
    const showMenu = menu === record.id;
    const canInsertBuild =
      workspace.document.kind === "guide" && record.document.kind !== "guide" && !composing;
    const Icon =
      record.document.kind === "guide"
        ? FileText
        : record.document.kind === "build-set"
          ? Stack
          : Sword;
    return (
      <li
        key={record.id}
        className={`document-row ${selected ? "is-selected" : ""} ${showMenu ? "has-menu" : ""}`}
      >
        <button
          className="document-link"
          aria-current={selected ? "page" : undefined}
          title={
            canInsertBuild ? `${record.name} — drag into the guide to insert a copy` : record.name
          }
          disabled={composing}
          draggable={canInsertBuild}
          onDragStart={(event) => {
            if (!canInsertBuild || workspace.document.kind !== "guide") {
              event.preventDefault();
              return;
            }
            event.dataTransfer.effectAllowed = "copy";
            event.dataTransfer.setData(
              LIBRARY_BUILD_MIME,
              libraryBuildDragPayload(record, workspace.document.history.session)
            );
            setMenu(null);
          }}
          onClick={() => {
            dispatch({ type: "open-document", id: record.id });
            setMessage("");
            close();
          }}
        >
          <Icon size={19} aria-hidden="true" />
          <span>{record.name}</span>
        </button>
        <button
          className="document-row-action"
          aria-label={`Actions for ${record.name}`}
          aria-haspopup="menu"
          aria-expanded={showMenu}
          disabled={composing}
          onClick={(event) => {
            menuTrigger.current = event.currentTarget;
            setMenu(showMenu ? null : record.id);
            setMessage("");
          }}
        >
          <DotsThree size={16} weight="bold" aria-hidden="true" />
        </button>
        {showMenu && (
          <div
            ref={menuRef}
            role="menu"
            aria-label={`${record.name} actions`}
            className="document-menu"
            onKeyDown={(event) => {
              const items = Array.from(
                event.currentTarget.querySelectorAll<HTMLElement>("[role=menuitem]:not(:disabled)")
              );
              const index = items.indexOf(document.activeElement as HTMLElement);
              if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                items[
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? items.length - 1
                      : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length
                ]?.focus();
              }
              if (event.key === "Tab") setMenu(null);
            }}
          >
            <span className="document-menu-label">
              {record.document.kind === "guide" ? "Guide" : "Build"}
            </span>
            {canInsertBuild && (
              <button
                role="menuitem"
                onClick={() => {
                  if (workspace.document.kind !== "guide") return;
                  try {
                    dispatch({
                      type: "guide",
                      command: {
                        ...guideAddress(workspace.document),
                        type: "insert-fragment",
                        nodes: [...copyLibraryBuilds(record), { type: "paragraph", children: [] }],
                        index: workspace.document.history.frame.document.nodes.length
                      },
                      catalogs
                    });
                    close();
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "Build insertion failed.");
                    closeMenu();
                  }
                }}
              >
                <Plus size={18} />
                Insert into guide
              </button>
            )}
            <button
              role="menuitem"
              onClick={() => {
                dispatch({
                  type: "duplicate-record",
                  id: record.id,
                  newId: localBuildRecordId(crypto.randomUUID()),
                  now: new Date().toISOString()
                });
                closeMenu();
              }}
            >
              <Copy size={18} />
              Duplicate
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setDialog({ kind: "rename", id: record.id, name: record.name });
                setMenu(null);
              }}
            >
              <PencilSimple size={18} />
              Rename
            </button>
            <a
              role="menuitem"
              href={documentUrl(record.id)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                if (!onOpenTab(record.id)) {
                  event.preventDefault();
                  setMessage(
                    "This document could not be saved. Back up your work before opening another tab."
                  );
                }
                closeMenu();
              }}
            >
              <ArrowSquareOut size={18} />
              Open in new tab
            </a>
            {record.document.kind === "guide" ? (
              <button
                role="menuitem"
                onClick={() => {
                  if (record.document.kind === "guide") {
                    try {
                      downloadGuide(
                        serializeGuideMarkdown(record.document.snapshot.document),
                        record.name
                      );
                      setMessage("Markdown download started.");
                    } catch {
                      setMessage("The download could not be started. Try backing up the library.");
                    }
                  }
                  closeMenu();
                }}
              >
                <DownloadSimple size={18} />
                Download as Markdown
              </button>
            ) : (
              <button
                role="menuitem"
                onClick={() => {
                  void copyTemplate(record);
                  closeMenu();
                }}
              >
                <Code size={18} />
                Copy template code
              </button>
            )}
            <div role="separator" />
            <button
              role="menuitem"
              className="document-delete"
              onClick={() => {
                setDialog({ kind: "delete", id: record.id, name: record.name });
                setMenu(null);
              }}
            >
              <Trash size={18} />
              Delete
            </button>
          </div>
        )}
      </li>
    );
  };
  return (
    <div ref={root} className="document-navigation">
      <button
        ref={toggle}
        className="sidebar-toggle"
        aria-label="Open document sidebar"
        aria-expanded={open}
        aria-controls="document-sidebar"
        title="Open document sidebar"
        onClick={() => {
          if (open) close();
          else setOpen(true);
        }}
      >
        <CaretRight size={20} />
      </button>
      {open && (
        <aside
          id="document-sidebar"
          ref={panel}
          className="document-sidebar"
          aria-label="Document library"
          onClick={(event) => {
            if (!(event.target as HTMLElement).closest(".document-menu, .document-row-action"))
              setMenu(null);
          }}
        >
          <div className="document-sidebar-heading">
            <span className="sidebar-brand-mark">
              <Sword size={18} />
            </span>
            <strong>Build Wars</strong>
            <button
              className="sidebar-collapse"
              aria-label="Close document sidebar"
              onClick={close}
            >
              <CaretDoubleLeft size={21} />
            </button>
          </div>
          <nav className="document-tree" aria-label="Guides and builds">
            {(["guides", "builds"] as const).map((kind) => {
              const title = kind === "guides" ? "Guides" : "Builds";
              const records = workspace.library.records.filter(
                (record) => (record.document.kind === "guide") === (kind === "guides")
              );
              const Icon = kind === "guides" ? BookOpen : Stack;
              return (
                <section className="document-section" key={kind} aria-label={title}>
                  <div className="document-section-heading">
                    <button
                      className="document-section-toggle"
                      aria-expanded={expanded[kind]}
                      aria-controls={`document-${kind}`}
                      onClick={() => setExpanded((value) => ({ ...value, [kind]: !value[kind] }))}
                    >
                      {expanded[kind] ? <CaretDown size={14} /> : <CaretRight size={14} />}
                      <Icon size={19} />
                      <span>{title}</span>
                    </button>
                    <button
                      className="document-add"
                      aria-label={kind === "guides" ? "New Guide" : "New Build"}
                      title={`New ${kind === "guides" ? "guide" : "build"}`}
                      disabled={composing}
                      onClick={() => create(kind === "guides" ? "guide" : "build")}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {expanded[kind] && (
                    <ul id={`document-${kind}`} className="document-children">
                      {records.map(row)}
                      {records.length === 0 && <li className="document-empty">No {kind} yet</li>}
                    </ul>
                  )}
                </section>
              );
            })}
          </nav>
          <footer className="document-sidebar-footer">
            {message && (
              <p className="sidebar-message" role="status">
                {message}
              </p>
            )}
            <p className="sidebar-save-status" role="status">
              {workspace.draftSession.durability === "durable"
                ? "Saved on this device"
                : workspace.draftSession.durability === "pending"
                  ? "Saving…"
                  : workspace.draftSession.durability === "conflict"
                    ? "Changes in another tab need review"
                    : "Changes are not saved to this device"}
            </p>
            {workspace.storage.rejectedPayloadSummary && (
              <p className="sidebar-message">{workspace.storage.rejectedPayloadSummary}</p>
            )}
            <details className="sidebar-tools">
              <summary>Library tools</summary>
              {workspace.document.kind === "build-set" && catalogs && (
                <button onClick={() => setSetTools("manage")}>Manage loadouts and party</button>
              )}
              <button disabled={composing} onClick={() => create("build-set")}>
                New build set
              </button>
              <button disabled={composing} onClick={() => create("example")}>
                Open example guide
              </button>
              {workspace.document.kind === "guide" && (
                <button
                  disabled={composing}
                  onClick={() => {
                    onImportGuide();
                    close();
                  }}
                >
                  Import Markdown
                </button>
              )}
              <button onClick={() => setBackup(true)}>Backup local library</button>
              <button disabled={composing} onClick={() => setRestore(true)}>
                Restore local library
              </button>
              {themeControls}
            </details>
          </footer>
        </aside>
      )}
      {dialog && (
        <LibraryModal
          title={dialog.kind === "rename" ? "Rename document" : "Delete document"}
          onClose={() => setDialog(null)}
        >
          {dialog.kind === "rename" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                dispatch({
                  type: "rename-record",
                  id: dialog.id,
                  name: dialog.name,
                  now: new Date().toISOString(),
                  savedWith: facts
                });
                setDialog(null);
              }}
            >
              <label className="dialog-field">
                Document name
                <input
                  required
                  autoFocus
                  maxLength={160}
                  value={dialog.name}
                  onChange={(event) => setDialog({ ...dialog, name: event.target.value })}
                />
              </label>
              <div className="dialog-actions">
                <button type="submit">Rename</button>
                <button type="button" onClick={() => setDialog(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <p>
                Delete <strong>{dialog.name}</strong> from this device? This cannot be undone.
              </p>
              <div className="dialog-actions">
                <button
                  className="danger-button"
                  onClick={() => {
                    dispatch({ type: "remove-document", id: dialog.id });
                    setDialog(null);
                  }}
                >
                  Delete
                </button>
                <button autoFocus onClick={() => setDialog(null)}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </LibraryModal>
      )}
      <BackupDialog
        open={backup}
        workspace={workspace}
        currentFacts={facts}
        dispatch={dispatch}
        onClose={() => setBackup(false)}
      />
      <RestoreDialog
        open={restore}
        workspace={workspace}
        dispatch={dispatch}
        onClose={() => setRestore(false)}
      />
      {setTools === "manage" && catalogs && (
        <LibraryModal title="Build set" onClose={() => setSetTools(null)}>
          <BuildSetNavigator
            workspace={workspace}
            catalogs={catalogs}
            dispatch={dispatch}
            onOpenTransfer={() => setSetTools("transfer")}
            onOpenPartyTransfer={() => setSetTools("party")}
          />
        </LibraryModal>
      )}
      <BuildSetTransferDialog
        open={setTools === "transfer"}
        workspace={workspace}
        dispatch={dispatch}
        onClose={() => setSetTools("manage")}
      />
      <PartyTransferDialog
        open={setTools === "party"}
        workspace={workspace}
        dispatch={dispatch}
        onClose={() => setSetTools("manage")}
      />
    </div>
  );
}
