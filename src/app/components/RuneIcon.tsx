import { useState } from "react";
import type { LocalIconAsset } from "../icon-assets";

/** Decorative only: the control always carries its numeric tier and accessible name. */
export function RuneIcon({ asset }: { readonly asset: LocalIconAsset | null }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return asset === null || failedSrc === asset.src ? null : (
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
