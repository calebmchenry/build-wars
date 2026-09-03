import type { EquipmentSummaryView } from "../equipment-selectors";

export function EquipmentSummary({ summary }: { readonly summary: EquipmentSummaryView }) {
  return (
    <section
      className="equipment-section equipment-summary"
      aria-labelledby="equipment-summary-title"
    >
      <div className="equipment-section-heading">
        <h3 id="equipment-summary-title">Summary</h3>
        <span>
          {summary.selectedUpgradeCount} selected / {summary.unresolvedCount} unresolved
        </span>
      </div>
      <dl className="equipment-stat-grid">
        <div>
          <dt>Equipment</dt>
          <dd>{summary.hasMaterializedEquipment ? "Authored" : "None"}</dd>
        </div>
        <div>
          <dt>Health</dt>
          <dd>{signed(summary.healthDelta)}</dd>
        </div>
        <div>
          <dt>Energy</dt>
          <dd>{signed(summary.energyDelta)}</dd>
        </div>
        <div>
          <dt>Share</dt>
          <dd>{summary.hasMeaningfulEquipment ? "Local only" : "No omission"}</dd>
        </div>
      </dl>
      {summary.validationUnavailable.length === 0 ? null : (
        <div className="equipment-warning">
          <strong>Validation unavailable</strong>
          <ul>
            {summary.validationUnavailable.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      <NoteList title="Character facts" notes={summary.globalNotes} />
      <NoteList title="Weapon-set notes" notes={summary.weaponSetNotes} />
      <NoteList title="Attribution" notes={summary.attribution} />
    </section>
  );
}

function NoteList({ title, notes }: { readonly title: string; readonly notes: readonly string[] }) {
  if (notes.length === 0) {
    return null;
  }
  return (
    <div className="equipment-note-group">
      <strong>{title}</strong>
      <ul className="equipment-note-list">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
