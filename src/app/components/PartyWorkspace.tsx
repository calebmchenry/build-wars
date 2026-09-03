import { useRef, type Dispatch } from "react";

import { isPartyMemberKind, type PartyMemberKind, type PartySlotId } from "../../domain";
import {
  generateBuildSetEntryId,
  generateNestedBuildId,
  generatePartySlotId,
  type WorkspaceAction,
  type WorkspaceState
} from "../workspace-state";
import { selectPartyWorkspaceView, type PartySlotView } from "../party-selectors";
import type { AppCatalogViews } from "../catalogs";
import { PartySharePanel } from "./PartySharePanel";
import { PartyDangerButton } from "./PartyDialogs";

const MEMBER_KIND_OPTIONS: readonly PartyMemberKind[] = [
  "unspecified",
  "player",
  "hero",
  "mercenary",
  "guest",
  "freeform"
];

export function PartyWorkspace({
  workspace,
  catalogs,
  dispatch,
  onOpenPartyTransfer
}: {
  readonly workspace: WorkspaceState;
  readonly catalogs: AppCatalogViews;
  readonly dispatch: Dispatch<WorkspaceAction>;
  readonly onOpenPartyTransfer: () => void;
}) {
  const sequenceRef = useRef(1);
  const view = selectPartyWorkspaceView(workspace, catalogs);
  if (view === null) {
    return null;
  }
  const nextEntryId = () =>
    generateBuildSetEntryId(new Date().toISOString(), sequenceRef.current++);
  const nextSlotId = () => generatePartySlotId(new Date().toISOString(), sequenceRef.current++);
  const idsForGrowth = (size: number) =>
    Array.from({ length: Math.max(0, size - view.slotCount) }, () => nextSlotId());
  const selectedSlot = view.slots.find((slot) => slot.selected) ?? null;
  const firstEmptySlot = (source: PartySlotId) =>
    view.slots.find((slot) => slot.id !== source && !slot.occupied)?.id ?? null;

  return (
    <section className="party-workspace" aria-labelledby="party-title">
      <div className="party-heading">
        <div>
          <p className="eyebrow">Party</p>
          <h2 id="party-title">{view.setName}</h2>
          <p className="build-set-status">
            {view.occupiedCount} occupied / {view.emptyCount} empty / {view.slotCount} slots -{" "}
            {view.validation?.summary ?? "party validation unavailable"}
          </p>
        </div>
        <div className="build-set-actions">
          <button type="button" onClick={onOpenPartyTransfer}>
            Party JSON
          </button>
        </div>
      </div>
      <div className="party-size-controls">
        <label>
          <span>Party size</span>
          <select
            value={view.presetSizes.includes(view.sizeValue) ? String(view.sizeValue) : "custom"}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (value !== "custom") {
                const size = Number(value);
                dispatch({ type: "resize-party", size, slotIds: idsForGrowth(size) });
              }
            }}
          >
            {view.presetSizes.map((size) => (
              <option key={size} value={size}>
                {size} slots
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        <label>
          <span>Custom slots</span>
          <input
            type="number"
            min={1}
            max={16}
            value={view.sizeValue}
            onChange={(event) => {
              const size = Number(event.currentTarget.value);
              if (Number.isFinite(size)) {
                dispatch({ type: "resize-party", size, slotIds: idsForGrowth(size) });
              }
            }}
          />
        </label>
      </div>
      {selectedSlot !== null && !selectedSlot.occupied ? (
        <EmptySelectedSlot
          slot={selectedSlot}
          unassigned={view.unassignedEntries}
          dispatch={dispatch}
          nextEntryId={nextEntryId}
        />
      ) : null}
      {view.validation !== null && view.validation.issues.length > 0 ? (
        <div className="party-attention-list" aria-label="Party attention">
          {view.validation.issues.slice(0, 8).map((issue) => (
            <button
              key={`${issue.path}:${issue.code}`}
              type="button"
              onClick={() => {
                if (issue.slotId !== undefined) {
                  dispatch({ type: "select-party-slot", slotId: issue.slotId });
                }
              }}
            >
              {issue.message}
            </button>
          ))}
        </div>
      ) : null}
      <div className="party-slot-list" aria-label="Party slots">
        {view.slots.map((slot) => (
          <PartySlotCard
            key={slot.id}
            slot={slot}
            dispatch={dispatch}
            duplicateTargetSlotId={firstEmptySlot(slot.id)}
            nextEntryId={nextEntryId}
          />
        ))}
      </div>
      {view.unassignedEntries.length > 0 ? (
        <section className="party-unassigned" aria-labelledby="party-unassigned-title">
          <h3 id="party-unassigned-title">Unassigned Loadouts</h3>
          {view.unassignedEntries.map((entry) => (
            <div key={entry.id} className="party-unassigned-row">
              <span>
                {entry.label} - {entry.kind} - {entry.professionPair} - {entry.modeLabel}
              </span>
            </div>
          ))}
        </section>
      ) : null}
      <PartySharePanel workspace={workspace} catalogs={catalogs} dispatch={dispatch} />
    </section>
  );
}

function EmptySelectedSlot({
  slot,
  unassigned,
  dispatch,
  nextEntryId
}: {
  readonly slot: PartySlotView;
  readonly unassigned: readonly {
    readonly id: ReturnType<typeof generateBuildSetEntryId>;
    readonly label: string;
  }[];
  readonly dispatch: Dispatch<WorkspaceAction>;
  readonly nextEntryId: () => ReturnType<typeof generateBuildSetEntryId>;
}) {
  return (
    <section className="party-empty-selection" aria-labelledby="party-empty-title">
      <h3 id="party-empty-title">Selected Empty Slot</h3>
      <p>{slot.memberLabel}</p>
      <div className="library-actions">
        <button
          type="button"
          onClick={() => {
            const entryId = nextEntryId();
            dispatch({
              type: "create-party-member",
              slotId: slot.id,
              entryId,
              buildId: generateNestedBuildId(entryId),
              label: slot.memberLabel
            });
          }}
        >
          Create Member
        </button>
      </div>
      {unassigned.length > 0 ? (
        <div className="party-assign-list">
          {unassigned.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() =>
                dispatch({ type: "assign-party-slot", slotId: slot.id, entryId: entry.id })
              }
            >
              Assign {entry.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function PartySlotCard({
  slot,
  dispatch,
  duplicateTargetSlotId,
  nextEntryId
}: {
  readonly slot: PartySlotView;
  readonly dispatch: Dispatch<WorkspaceAction>;
  readonly duplicateTargetSlotId: PartySlotId | null;
  readonly nextEntryId: () => ReturnType<typeof generateBuildSetEntryId>;
}) {
  return (
    <article className={`party-slot ${slot.selected ? "selected-party-slot" : ""}`}>
      <div className="party-slot-main">
        <button
          type="button"
          className="entry-select-button"
          aria-pressed={slot.selected}
          onClick={() => dispatch({ type: "select-party-slot", slotId: slot.id })}
        >
          {slot.ordinal}. {slot.memberLabel}
        </button>
        <span className={`entry-status ${slot.status}`}>{slot.status}</span>
      </div>
      <div className="entry-summary-grid">
        <span>{slot.kindLabel}</span>
        <span>{slot.rolePresent ? slot.role : "no role"}</span>
        <span>{slot.professionPair}</span>
        <span>{slot.modeLabel}</span>
        <span>{slot.equipmentIndicator}</span>
        <span>{slot.titleIndicator}</span>
        <span>{slot.entryNotesPresent ? "entry notes" : "no entry notes"}</span>
        <span>{slot.notesPresent ? "slot notes" : "no slot notes"}</span>
      </div>
      {slot.occupied ? (
        <ol className="entry-skill-strip" aria-label={`${slot.memberLabel} skill bar`}>
          {slot.skills.map((skill) => (
            <li key={skill.slot} data-state={skill.state}>
              {skill.label}
            </li>
          ))}
        </ol>
      ) : (
        <div className="party-empty-card">Empty slot</div>
      )}
      <div className="entry-edit-grid">
        <label>
          <span>Member label for slot {slot.ordinal}</span>
          <input
            defaultValue={slot.memberLabel}
            onBlur={(event) =>
              dispatch({
                type: "rename-party-slot",
                slotId: slot.id,
                memberLabel: event.currentTarget.value
              })
            }
          />
        </label>
        <label>
          <span>Role for {slot.memberLabel}</span>
          <input
            defaultValue={slot.role}
            onBlur={(event) =>
              dispatch({
                type: "set-party-slot-role",
                slotId: slot.id,
                role: event.currentTarget.value
              })
            }
          />
        </label>
        <label>
          <span>Kind for {slot.memberLabel}</span>
          <select
            value={slot.memberKind}
            onChange={(event) => {
              const memberKind = event.currentTarget.value;
              if (isPartyMemberKind(memberKind)) {
                dispatch({
                  type: "set-party-slot-kind",
                  slotId: slot.id,
                  memberKind,
                  memberKindLabel: memberKind === "freeform" ? slot.kindLabel : null
                });
              }
            }}
          >
            {MEMBER_KIND_OPTIONS.map((memberKind) => (
              <option key={memberKind} value={memberKind}>
                {memberKind}
              </option>
            ))}
          </select>
        </label>
        {slot.memberKind === "freeform" ? (
          <label>
            <span>Freeform kind for {slot.memberLabel}</span>
            <input
              defaultValue={slot.kindLabel}
              onBlur={(event) =>
                dispatch({
                  type: "set-party-slot-kind",
                  slotId: slot.id,
                  memberKind: "freeform",
                  memberKindLabel: event.currentTarget.value
                })
              }
            />
          </label>
        ) : null}
        <label className="wide-control">
          <span>Party notes for {slot.memberLabel}</span>
          <textarea
            defaultValue={slot.notes}
            rows={2}
            onBlur={(event) =>
              dispatch({
                type: "set-party-slot-notes",
                slotId: slot.id,
                notes: event.currentTarget.value
              })
            }
          />
        </label>
      </div>
      <div className="entry-actions">
        <button
          type="button"
          disabled={!slot.canMoveEarlier}
          onClick={() =>
            dispatch({ type: "move-party-slot", slotId: slot.id, direction: "earlier" })
          }
        >
          Move Earlier
        </button>
        <button
          type="button"
          disabled={!slot.canMoveLater}
          onClick={() => dispatch({ type: "move-party-slot", slotId: slot.id, direction: "later" })}
        >
          Move Later
        </button>
        <button
          type="button"
          disabled={duplicateTargetSlotId === null || !slot.occupied}
          onClick={() => {
            if (duplicateTargetSlotId === null) {
              return;
            }
            const entryId = nextEntryId();
            dispatch({
              type: "duplicate-party-member",
              sourceSlotId: slot.id,
              targetSlotId: duplicateTargetSlotId,
              entryId,
              buildId: generateNestedBuildId(entryId)
            });
          }}
        >
          Duplicate Member
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "reset-party-slot-metadata", slotId: slot.id })}
        >
          Reset Metadata
        </button>
        <PartyDangerButton
          disabled={!slot.canClear}
          message={`Clear ${slot.memberLabel} from this party slot? The loadout will remain unassigned.`}
          onConfirm={() => dispatch({ type: "clear-party-slot", slotId: slot.id })}
        >
          Clear Member
        </PartyDangerButton>
      </div>
    </article>
  );
}
