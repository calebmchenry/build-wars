import { useRef, type Dispatch } from "react";

import type { AppCatalogViews } from "../catalogs";
import { buildSetEntryId, isBuildSetEntryKind } from "../../domain";
import { selectBuildSetNavigatorView, type BuildSetEntrySummary } from "../build-set-selectors";
import {
  generateBuildSetEntryId,
  generateNestedBuildId,
  generatePartySlotId,
  type WorkspaceAction,
  type WorkspaceState
} from "../workspace-state";
import { BuildSetComparison } from "./BuildSetComparison";
import { PartyDangerButton } from "./PartyDialogs";
import { PartyWorkspace } from "./PartyWorkspace";

export function BuildSetNavigator({
  workspace,
  catalogs,
  dispatch,
  onOpenTransfer,
  onOpenPartyTransfer
}: {
  readonly workspace: WorkspaceState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<WorkspaceAction>;
  readonly onOpenTransfer: () => void;
  readonly onOpenPartyTransfer: () => void;
}) {
  const sequenceRef = useRef(1);
  const view = selectBuildSetNavigatorView(workspace, catalogs);
  if (view === null) {
    return null;
  }

  const nextEntryId = () =>
    generateBuildSetEntryId(new Date().toISOString(), sequenceRef.current++);
  const nextSlotId = () => generatePartySlotId(new Date().toISOString(), sequenceRef.current++);
  const addEntry = () => {
    const entryId = nextEntryId();
    dispatch({
      type: "add-blank-build-set-entry",
      entryId,
      buildId: generateNestedBuildId(entryId),
      label: `Loadout ${view.entryCount + 1}`
    });
  };
  const duplicateSelected = () => {
    const entryId = nextEntryId();
    dispatch({
      type: "duplicate-selected-build-set-entry",
      entryId,
      buildId: generateNestedBuildId(entryId)
    });
  };
  const partyEnabled =
    workspace.document.kind === "build-set" && workspace.document.party?.enabled === true;
  const partyAnnotated =
    workspace.document.kind === "build-set" && workspace.document.party !== null;
  const enableParty = () => {
    dispatch(
      partyAnnotated
        ? { type: "enable-party-mode" }
        : {
            type: "enable-party-mode",
            slotIds: Array.from({ length: view.entryCount === 0 ? 4 : view.entryCount }, () =>
              nextSlotId()
            )
          }
    );
  };

  return (
    <section className="build-set-navigator" aria-labelledby="build-set-title">
      <div className="build-set-heading">
        <div>
          <p className="eyebrow">Build set</p>
          <label className="inline-field">
            <span id="build-set-title">Build set name</span>
            <input
              value={view.name}
              onChange={(event) =>
                dispatch({ type: "rename-build-set", name: event.currentTarget.value })
              }
            />
          </label>
          <p className="build-set-status">
            {view.entryCount} loadout{view.entryCount === 1 ? "" : "s"} - {view.aggregate.summary}
          </p>
          <BuildSetAttentionRows entries={view.entries} dispatch={dispatch} />
        </div>
        <div className="build-set-actions">
          {!partyEnabled ? (
            <button type="button" onClick={enableParty}>
              Enable Party
            </button>
          ) : (
            <button type="button" onClick={() => dispatch({ type: "disable-party-mode" })}>
              Disable Party
            </button>
          )}
          {partyAnnotated ? (
            <PartyDangerButton
              message="Reset party annotations? Loadouts remain in the build set."
              onConfirm={() => dispatch({ type: "reset-party-mode", confirmed: true })}
            >
              Reset Party
            </PartyDangerButton>
          ) : null}
          <button type="button" onClick={addEntry} disabled={view.atEntryCap}>
            Add Loadout
          </button>
          <button
            type="button"
            onClick={duplicateSelected}
            disabled={view.selectedEntryId === null || view.atEntryCap}
          >
            Duplicate
          </button>
          <button type="button" onClick={onOpenTransfer}>
            Transfer
          </button>
        </div>
      </div>
      {partyEnabled ? (
        <>
          <PartyWorkspace
            workspace={workspace}
            catalogs={catalogs}
            dispatch={dispatch}
            onOpenPartyTransfer={onOpenPartyTransfer}
          />
          <BuildSetComparison workspace={workspace} catalogs={catalogs} />
        </>
      ) : view.empty ? (
        <div className="empty-state">
          <strong>Empty build set</strong>
          <button type="button" onClick={addEntry}>
            Add Loadout
          </button>
        </div>
      ) : (
        <>
          <div className="build-set-controls">
            <label>
              <span>Select loadout</span>
              <select
                value={view.selectedEntryId ?? ""}
                onChange={(event) => {
                  const entryId = buildSetEntryId(event.currentTarget.value);
                  if (view.entries.some((entry) => entry.id === entryId)) {
                    dispatch({
                      type: "select-build-set-entry",
                      entryId
                    });
                  }
                }}
              >
                {view.entries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Compare with</span>
              <select
                value={view.comparisonEntryId ?? ""}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  dispatch({
                    type: "set-build-set-comparison-entry",
                    entryId: value.length === 0 ? null : buildSetEntryId(value)
                  });
                }}
              >
                <option value="">None</option>
                {view.entries
                  .filter((entry) => entry.id !== view.selectedEntryId)
                  .map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="build-set-entry-list" aria-label="Build set loadouts">
            {view.entries.map((entry, index) => (
              <BuildSetEntryCard
                key={entry.id}
                entry={entry}
                index={index}
                lastIndex={view.entries.length - 1}
                dispatch={dispatch}
              />
            ))}
          </div>
          <BuildSetComparison workspace={workspace} catalogs={catalogs} />
        </>
      )}
    </section>
  );
}

function BuildSetAttentionRows({
  entries,
  dispatch
}: {
  readonly entries: readonly BuildSetEntrySummary[];
  readonly dispatch: Dispatch<WorkspaceAction>;
}) {
  const rows = entries.filter(
    (entry) =>
      entry.validationStatus !== "ok" ||
      entry.unresolved ||
      entry.incomplete ||
      entry.stale ||
      entry.catalogUnavailable
  );
  if (rows.length === 0) {
    return null;
  }
  return (
    <div className="build-set-attention-list" aria-label="Build set attention">
      {rows.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => dispatch({ type: "select-build-set-entry", entryId: entry.id })}
        >
          Review {entry.label}: {attentionSummary(entry)}
        </button>
      ))}
    </div>
  );
}

function attentionSummary(entry: BuildSetEntrySummary): string {
  return [
    entry.validationStatus,
    entry.unresolved ? "unresolved" : null,
    entry.incomplete ? "incomplete" : null,
    entry.stale ? "stale" : null,
    entry.catalogUnavailable ? "catalog unavailable" : null
  ]
    .filter((part): part is string => part !== null)
    .join(", ");
}

function BuildSetEntryCard({
  entry,
  index,
  lastIndex,
  dispatch
}: {
  readonly entry: BuildSetEntrySummary;
  readonly index: number;
  readonly lastIndex: number;
  readonly dispatch: Dispatch<WorkspaceAction>;
}) {
  return (
    <article className={`build-set-entry ${entry.selected ? "selected-entry" : ""}`}>
      <div className="build-set-entry-main">
        <button
          type="button"
          className="entry-select-button"
          aria-pressed={entry.selected}
          onClick={() => dispatch({ type: "select-build-set-entry", entryId: entry.id })}
        >
          {entry.label}
        </button>
        <span className="entry-kind">{entry.kind}</span>
        <span className={`entry-status ${entry.validationStatus}`}>{entry.validationStatus}</span>
      </div>
      <div className="entry-summary-grid">
        <span>{entry.professionPair}</span>
        <span>{entry.modeLabel}</span>
        <span>{entry.equipmentIndicator}</span>
        <span>{entry.titleIndicator}</span>
        <span>{entry.notesPresent ? "notes" : "no notes"}</span>
      </div>
      <ol className="entry-skill-strip" aria-label={`${entry.label} skill bar`}>
        {entry.skills.map((skill) => (
          <li key={skill.slot} data-state={skill.state}>
            {skill.label}
          </li>
        ))}
      </ol>
      <div className="entry-edit-grid">
        <label>
          <span>Label for {entry.label}</span>
          <input
            value={entry.label}
            onChange={(event) =>
              dispatch({
                type: "rename-build-set-entry",
                entryId: entry.id,
                label: event.currentTarget.value
              })
            }
          />
        </label>
        <label>
          <span>Kind for {entry.label}</span>
          <select
            value={entry.kind}
            onChange={(event) => {
              const kind = event.currentTarget.value;
              if (isBuildSetEntryKind(kind)) {
                dispatch({
                  type: "set-build-set-entry-kind",
                  entryId: entry.id,
                  kind
                });
              }
            }}
          >
            <option value="build">Build</option>
            <option value="variant">Variant</option>
            <option value="freeform">Freeform</option>
          </select>
        </label>
        <label>
          <span>Notes for {entry.label}</span>
          <input
            defaultValue={entry.notes}
            placeholder="Notes"
            onBlur={(event) =>
              dispatch({
                type: "set-build-set-entry-notes",
                entryId: entry.id,
                notes: event.currentTarget.value
              })
            }
          />
        </label>
      </div>
      <div className="entry-actions">
        <button
          type="button"
          onClick={() =>
            dispatch({ type: "move-build-set-entry", entryId: entry.id, direction: "earlier" })
          }
          disabled={index === 0}
        >
          Move Earlier
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({ type: "move-build-set-entry", entryId: entry.id, direction: "later" })
          }
          disabled={index === lastIndex}
        >
          Move Later
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "promote-build-set-entry", entryId: entry.id })}
          disabled={entry.kind === "build"}
        >
          Promote
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "remove-build-set-entry", entryId: entry.id })}
        >
          Remove
        </button>
      </div>
    </article>
  );
}
