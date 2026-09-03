import type { PlaceholderIconDescriptor } from "../catalogs";

export function CatalogIcon({
  descriptor,
  className = ""
}: {
  readonly descriptor: PlaceholderIconDescriptor;
  readonly className?: string;
}) {
  const title =
    descriptor.mediaId === null ? descriptor.label : `${descriptor.label} (${descriptor.mediaId})`;
  return (
    <span
      className={`catalog-icon placeholder-${descriptor.surface}${className ? ` ${className}` : ""}`}
      data-has-asset={descriptor.asset === null ? "false" : "true"}
      role="img"
      aria-label={descriptor.label}
      title={title}
    >
      {descriptor.asset === null ? (
        descriptor.initials
      ) : (
        <img
          src={descriptor.asset.src}
          alt=""
          width={descriptor.asset.width}
          height={descriptor.asset.height}
          draggable={false}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
