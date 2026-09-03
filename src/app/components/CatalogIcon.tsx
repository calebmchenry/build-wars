import type { PlaceholderIconDescriptor } from "../catalogs";

export function CatalogIcon({
  descriptor,
  className = ""
}: {
  readonly descriptor: PlaceholderIconDescriptor;
  readonly className?: string;
}) {
  return (
    <span
      className={`catalog-icon placeholder-${descriptor.surface}${className ? ` ${className}` : ""}`}
      aria-label={descriptor.label}
      title={
        descriptor.mediaId === null
          ? descriptor.label
          : `${descriptor.label} (${descriptor.mediaId})`
      }
    >
      {descriptor.initials}
    </span>
  );
}
