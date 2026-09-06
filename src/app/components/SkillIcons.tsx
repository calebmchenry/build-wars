import type { SkillActionIconView, SkillFactIconKind } from "../skill-icons";
import { LOCAL_FACT_ICON_ASSETS } from "../icon-assets";

export function SkillActionIcon({
  icon,
  className = ""
}: {
  readonly icon: SkillActionIconView;
  readonly className?: string;
}) {
  return (
    <span
      className={`skill-action-icon action-${icon.kind}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={icon.label}
      title={icon.label}
    >
      <span className="skill-icon-mark" aria-hidden="true" />
    </span>
  );
}

export function SkillFactIcon({
  kind,
  label,
  decorative = true
}: {
  readonly kind: SkillFactIconKind;
  readonly label: string;
  readonly decorative?: boolean;
}) {
  const asset = LOCAL_FACT_ICON_ASSETS[kind];
  return (
    <span
      className={`skill-fact-icon fact-${kind}`}
      data-has-asset={asset === null ? "false" : "true"}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
      title={label}
    >
      {asset === null ? (
        <span className="skill-icon-mark" aria-hidden="true" />
      ) : (
        <img
          src={asset.src}
          alt=""
          width={asset.width}
          height={asset.height}
          draggable={false}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
