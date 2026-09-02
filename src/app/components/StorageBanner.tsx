import type { PersistenceDiagnostic } from "../persistence-schema";
import type { WorkspaceDurability } from "../workspace-state";

export function StorageBanner({
  durability,
  diagnostics,
  rejectedPayloadSummary
}: {
  readonly durability: WorkspaceDurability;
  readonly diagnostics: readonly PersistenceDiagnostic[];
  readonly rejectedPayloadSummary: string | null;
}) {
  if (durability === "durable" && diagnostics.length === 0 && rejectedPayloadSummary === null) {
    return null;
  }

  return (
    <section className={`storage-banner ${durability}`} aria-live="polite">
      <strong>{storageHeading(durability)}</strong>
      <p>{rejectedPayloadSummary ?? storageMessage(durability)}</p>
      {diagnostics.length > 0 ? (
        <ul>
          {diagnostics.slice(0, 3).map((diagnostic) => (
            <li key={`${diagnostic.code}:${diagnostic.path}`}>{diagnostic.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function storageHeading(durability: WorkspaceDurability): string {
  switch (durability) {
    case "durable":
      return "Local storage recovered";
    case "pending":
      return "Saving locally";
    case "memory-only":
      return "Memory-only editing";
    case "write-blocked":
      return "Local storage needs recovery";
    case "conflict":
      return "Local storage conflict";
  }
}

function storageMessage(durability: WorkspaceDurability): string {
  switch (durability) {
    case "durable":
      return "The local library is available.";
    case "pending":
      return "The working draft has local changes waiting to be written.";
    case "memory-only":
      return "The editor remains usable, but this browser did not accept the latest write.";
    case "write-blocked":
      return "Stored data was corrupt or partially rejected and will not be overwritten automatically.";
    case "conflict":
      return "Another local write changed the stored revision before this write completed.";
  }
}
