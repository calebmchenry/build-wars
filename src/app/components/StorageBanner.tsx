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

  const heading = storageHeading(durability);
  const detail = rejectedPayloadSummary ?? diagnostics[0]?.message ?? storageMessage(durability);
  const accessibleLabel = durability === "pending" ? heading : `${heading}. ${detail}`;

  return (
    <div
      className={`storage-banner ${durability}`}
      aria-live="polite"
      aria-atomic="true"
      aria-label={accessibleLabel}
      title={detail}
    >
      {heading}
    </div>
  );
}

function storageHeading(durability: WorkspaceDurability): string {
  switch (durability) {
    case "durable":
      return "Storage recovered";
    case "pending":
      return "Saving...";
    case "memory-only":
      return "Not saved";
    case "write-blocked":
      return "Storage needs recovery";
    case "conflict":
      return "Save conflict";
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
