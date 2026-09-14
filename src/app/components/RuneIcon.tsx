import { useState } from "react";
import type { LocalIconAsset } from "../icon-assets";

/** The parent control supplies the accessible name; failed images retain a visible tier. */
export function RuneIcon({
  asset,
  fallback
}: {
  readonly asset: LocalIconAsset | null;
  readonly fallback: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return asset === null || failedSrc === asset.src ? (
    <span aria-hidden="true">{fallback}</span>
  ) : (
    <img
      className="rune-icon"
      src={asset.src}
      alt=""
      width={asset.width}
      height={asset.height}
      onError={() => setFailedSrc(asset.src)}
    />
  );
}
