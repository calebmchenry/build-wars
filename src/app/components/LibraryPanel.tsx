import { useRef, useState, type Dispatch } from "react";

import type { GameMode } from "../../domain";
import type { AppCatalogViews } from "../catalogs";
import {
  filtersFromLibraryState,
  selectLibraryView,
  type LibraryRecordRow
} from "../library-selectors";
import type { PersistedCatalogFacts } from "../persistence-schema";
import {
  generateAuthoredBuildSetId,
  generateBuildSetEntryId,
  generateLocalBuildRecordId,
  generateNestedBuildId,
  needsDirtyGuard,
  professionFilterFromValue,
  type LibrarySortMode,
  type WorkspaceAction,
  type WorkspaceState
} from "../workspace-state";
import { DeleteRecordDialog } from "./LibraryDialogs";

export function LibraryPanel({
  workspace,
  catalogs,
  currentFacts,
  dispatch,
  onShareRecord,
  onOpenBackup,
  onOpenRestore
}: {
  readonly workspace: WorkspaceState;
  readonly catalogs: AppCatalogViews;
  readonly currentFacts: PersistedCatalogFacts;
  readonly dispatch: Dispatch<WorkspaceAction>;
  readonly onShareRecord?: (recordId: string | null) => void;
  readonly onOpenBackup?: () => void;
  readonly onOpenRestore?: () => void;
}) {
  const [saveNameDraft, setSaveNameDraft] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const sequenceRef = useRef(1);
  const library = selectLibraryView(
    workspace.library.records,
    catalogs,
    filtersFromLibraryState(workspace.library),
    currentFacts
  );
  const pendingDeleteRecord =
    pendingDeleteId === null
      ? null
      : workspace.library.records.find((record) => record.id === pendingDeleteId);

  const activeSaveName =
    saveNameDraft ??
    (workspace.document.kind === "build-set"
      ? workspace.document.name
      : workspace.editor.build.name);
  const nextId = () => generateLocalBuildRecordId(new Date().toISOString(), sequenceRef.current++);
  const nextEntryId = () =>
    generateBuildSetEntryId(new Date().toISOString(), sequenceRef.current++);
  const nextSetId = () =>
    generateAuthoredBuildSetId(new Date().toISOString(), sequenceRef.current++);

  return (
    <section
      className={`editor-panel library-panel ${workspace.library.collapsed ? "collapsed" : ""}`}
      aria-labelledby="library-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="library-title">Local Library</h2>
          <span>
            {library.matchingCount}/{library.totalCount} saved builds
          </span>
        </div>
        <button
          type="button"
          aria-expanded={!workspace.library.collapsed}
          onClick={() =>
            dispatch({
              type: "set-library-ui",
              collapsed: !workspace.library.collapsed
            })
          }
        >
          {workspace.library.collapsed ? "Open" : "Close"}
        </button>
      </div>
      {workspace.library.collapsed ? null : (
        <>
          <div className="draft-save-controls">
            <label>
              <span>Save name</span>
              <input
                value={activeSaveName}
                onChange={(event) => setSaveNameDraft(event.currentTarget.value)}
              />
            </label>
            <div className="library-actions">
              <button
                type="button"
                onClick={() => {
                  dispatch({
                    type: "save-new",
                    id: nextId(),
                    name: activeSaveName,
                    now: new Date().toISOString(),
                    savedWith: currentFacts
                  });
                  setSaveNameDraft(null);
                }}
              >
                Save New
              </button>
              <button
                type="button"
                disabled={workspace.draftSession.associatedRecordId === null}
                onClick={() =>
                  dispatch({
                    type: "update-associated",
                    now: new Date().toISOString(),
                    savedWith: currentFacts
                  })
                }
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({
                    type: "save-as-new",
                    id: nextId(),
                    name: activeSaveName,
                    now: new Date().toISOString(),
                    savedWith: currentFacts
                  });
                  setSaveNameDraft(null);
                }}
              >
                Save As New
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "new-draft",
                    name: "Untitled Build",
                    decision: replacementDecision(workspace)
                  })
                }
              >
                New Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  const entryId = nextEntryId();
                  dispatch({
                    type: "create-build-set-from-current",
                    setId: nextSetId(),
                    entryId,
                    decision: "discard"
                  });
                  setSaveNameDraft(null);
                }}
              >
                Create Set
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({
                    type: "new-build-set",
                    setId: nextSetId(),
                    name: "Untitled Build Set",
                    decision: replacementDecision(workspace)
                  });
                  setSaveNameDraft(null);
                }}
              >
                New Set
              </button>
            </div>
          </div>
          <div className="library-filters">
            <label>
              <span>Library search</span>
              <input
                type="search"
                value={workspace.library.query}
                onChange={(event) =>
                  dispatch({ type: "set-library-ui", query: event.currentTarget.value })
                }
              />
            </label>
            <label>
              <span>Profession</span>
              <select
                value={
                  workspace.library.professionFilter === null
                    ? ""
                    : Number(workspace.library.professionFilter)
                }
                onChange={(event) =>
                  dispatch({
                    type: "set-library-ui",
                    professionFilter: professionFilterFromValue(event.currentTarget.value)
                  })
                }
              >
                <option value="">Any</option>
                {library.facets.professions.map((profession) => (
                  <option key={Number(profession.id)} value={Number(profession.id)}>
                    {profession.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Mode</span>
              <select
                value={workspace.library.modeFilter}
                onChange={(event) =>
                  dispatch({
                    type: "set-library-ui",
                    modeFilter: event.currentTarget.value as GameMode | "all"
                  })
                }
              >
                <option value="all">Any</option>
                <option value="pve">PvE</option>
                <option value="pvp">PvP</option>
              </select>
            </label>
            <label>
              <span>Tag</span>
              <select
                value={workspace.library.tagFilter ?? ""}
                onChange={(event) =>
                  dispatch({
                    type: "set-library-ui",
                    tagFilter:
                      event.currentTarget.value.length === 0 ? null : event.currentTarget.value
                  })
                }
              >
                <option value="">Any</option>
                {library.facets.tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={workspace.library.favoriteOnly}
                onChange={(event) =>
                  dispatch({ type: "set-library-ui", favoriteOnly: event.currentTarget.checked })
                }
              />
              <span>Favorites</span>
            </label>
            <label>
              <span>Sort</span>
              <select
                value={workspace.library.sortMode}
                onChange={(event) =>
                  dispatch({
                    type: "set-library-ui",
                    sortMode: event.currentTarget.value as LibrarySortMode
                  })
                }
              >
                <option value="updated-desc">Updated</option>
                <option value="name-asc">Name</option>
                <option value="profession-asc">Profession</option>
              </select>
            </label>
          </div>
          <div className="library-actions">
            <button type="button" onClick={() => onShareRecord?.(null)}>
              Share Draft
            </button>
            <button type="button" onClick={() => onOpenBackup?.()}>
              Backup
            </button>
            <button type="button" onClick={() => onOpenRestore?.()}>
              Restore
            </button>
          </div>
          {library.emptyState === "empty-library" ? (
            <div className="empty-state">
              <strong>No saved builds</strong>
            </div>
          ) : library.emptyState === "no-results" ? (
            <div className="empty-state">
              <strong>No saved builds match</strong>
              <button type="button" onClick={() => dispatch({ type: "set-library-ui", query: "" })}>
                Clear search
              </button>
            </div>
          ) : (
            <div className="library-records">
              {library.rows.map((row) => (
                <LibraryRecord
                  key={row.id}
                  row={row}
                  selected={workspace.library.selectedRecordId === row.id}
                  dispatch={dispatch}
                  currentFacts={currentFacts}
                  onLoad={() =>
                    dispatch({
                      type: "load-record",
                      id: row.record.id,
                      decision: replacementDecision(workspace)
                    })
                  }
                  onDuplicate={() =>
                    dispatch({
                      type: "duplicate-record",
                      id: row.record.id,
                      newId: nextId(),
                      now: new Date().toISOString()
                    })
                  }
                  onDelete={() => setPendingDeleteId(row.id)}
                  onShare={() => onShareRecord?.(row.id)}
                  onCopyIntoSet={() => {
                    const entryId = nextEntryId();
                    dispatch({
                      type: "copy-record-into-set",
                      recordId: row.record.id,
                      entryId,
                      buildId: generateNestedBuildId(entryId)
                    });
                  }}
                  canCopyIntoSet={
                    workspace.document.kind === "build-set" && row.record.document.kind === "build"
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
      <DeleteRecordDialog
        recordName={pendingDeleteRecord?.name ?? null}
        onConfirm={() => {
          if (pendingDeleteRecord !== null && pendingDeleteRecord !== undefined) {
            dispatch({
              type: "delete-record",
              id: pendingDeleteRecord.id,
              confirmed: true,
              now: new Date().toISOString()
            });
          }
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </section>
  );
}

function LibraryRecord({
  row,
  selected,
  dispatch,
  currentFacts,
  onLoad,
  onDuplicate,
  onDelete,
  onShare,
  onCopyIntoSet,
  canCopyIntoSet
}: {
  readonly row: LibraryRecordRow;
  readonly selected: boolean;
  readonly dispatch: Dispatch<WorkspaceAction>;
  readonly currentFacts: PersistedCatalogFacts;
  readonly onLoad: () => void;
  readonly onDuplicate: () => void;
  readonly onDelete: () => void;
  readonly onShare: () => void;
  readonly onCopyIntoSet: () => void;
  readonly canCopyIntoSet: boolean;
}) {
  return (
    <article className={`library-record ${selected ? "selected-record" : ""}`}>
      <div className="library-record-heading">
        <div>
          <h3>{row.name}</h3>
          <span>
            {row.kindLabel} - {row.entryCount} loadout{row.entryCount === 1 ? "" : "s"} -{" "}
            {row.professionPair} - {row.modeLabel} - {row.updatedLabel}
          </span>
          {row.partySummary === null ? null : <span>{row.partySummary}</span>}
        </div>
        <button
          type="button"
          aria-pressed={row.favorite}
          aria-label={`${row.favorite ? "Unfavorite" : "Favorite"} ${row.name}`}
          onClick={() =>
            dispatch({ type: "toggle-favorite", id: row.record.id, now: new Date().toISOString() })
          }
        >
          {row.favorite ? "*" : "Favorite"}
        </button>
      </div>
      <div className="diagnostic-chips" aria-label={`${row.name} diagnostics`}>
        <span>{row.diagnostics.freshness}</span>
        <span>{row.diagnostics.validation}</span>
        <span>{row.diagnostics.resolution}</span>
      </div>
      <div className="tag-row">
        {row.tags.length === 0 ? (
          <span>No tags</span>
        ) : (
          row.tags.map((tag) => <span key={tag}>{tag}</span>)
        )}
      </div>
      {row.notesPreview === null ? null : <p className="notes-preview">{row.notesPreview}</p>}
      <div className="library-actions">
        <button type="button" onClick={onLoad}>
          Load
        </button>
        <button type="button" onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" onClick={onShare}>
          Share
        </button>
        {canCopyIntoSet ? (
          <button type="button" onClick={onCopyIntoSet}>
            Copy Into Set
          </button>
        ) : null}
        <button type="button" onClick={onDelete}>
          Delete
        </button>
      </div>
      <label>
        <span>Rename {row.name}</span>
        <input
          defaultValue={row.name}
          onBlur={(event) =>
            dispatch({
              type: "rename-record",
              id: row.record.id,
              name: event.currentTarget.value,
              now: new Date().toISOString(),
              savedWith: currentFacts
            })
          }
        />
      </label>
      <label>
        <span>Tags for {row.name}</span>
        <input
          defaultValue={row.tags.join(", ")}
          onBlur={(event) =>
            dispatch({
              type: "set-record-tags",
              id: row.record.id,
              tags: event.currentTarget.value.split(","),
              now: new Date().toISOString()
            })
          }
        />
      </label>
      <label>
        <span>Notes for {row.name}</span>
        <textarea
          defaultValue={row.record.notes ?? ""}
          rows={2}
          onBlur={(event) =>
            dispatch({
              type: "set-record-notes",
              id: row.record.id,
              notes: event.currentTarget.value,
              now: new Date().toISOString()
            })
          }
        />
      </label>
    </article>
  );
}

function replacementDecision(workspace: WorkspaceState): "cancel" | "discard" {
  if (!needsDirtyGuard(workspace)) {
    return "discard";
  }
  return window.confirm("Discard unsaved draft changes?") ? "discard" : "cancel";
}
