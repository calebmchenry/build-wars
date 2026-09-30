import { useState } from "react";
import type { GuideMetadata } from "../../../domain/guide";

/** Field drafts stay local while typing; blur/Enter commits one guide-history edit. */
function MetadataField({
  value,
  label,
  placeholder = "Empty",
  multiline = false,
  maxLength,
  onCommit
}: {
  readonly value: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly multiline?: boolean;
  readonly maxLength: number;
  readonly onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const props = {
    "aria-label": label,
    value: draft,
    placeholder,
    maxLength,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(event.target.value),
    onBlur: () => {
      if (draft !== value) onCommit(draft);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.currentTarget.blur();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setDraft(value);
      }
    }
  };
  return multiline ? <textarea {...props} rows={1} /> : <input {...props} />;
}
export function GuideMetadataHeader({
  metadata,
  onChange
}: {
  readonly metadata: GuideMetadata;
  readonly onChange: (patch: Partial<GuideMetadata>) => void;
}) {
  return (
    <div className="guide-document-heading">
      <div className="guide-title-field">
        <MetadataField
          key={metadata.title}
          label="Guide title"
          value={metadata.title}
          placeholder="Untitled Guide"
          multiline
          maxLength={160}
          onCommit={(title) => onChange({ title: title.trim() || "Untitled Guide" })}
        />
      </div>
      <div className="guide-properties">
        <div className="guide-property">
          <span className="guide-property-label">Tags</span>
          <MetadataField
            key={metadata.tags.join(", ")}
            label="Tags (comma separated)"
            value={metadata.tags.join(", ")}
            maxLength={24 * 82}
            onCommit={(tags) =>
              onChange({
                tags: tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
              })
            }
          />
        </div>
        <div className="guide-property">
          <span className="guide-property-label">Summary</span>
          <MetadataField
            key={metadata.summary ?? ""}
            label="Summary"
            value={metadata.summary ?? ""}
            multiline
            maxLength={2048}
            onCommit={(summary) => onChange({ summary: summary || null })}
          />
        </div>
      </div>
    </div>
  );
}
