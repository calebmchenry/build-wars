import type {
  CatalogWeaponBaseRecord,
  CatalogWeaponModRecord,
  WeaponCompatibilityKind
} from "./catalog";

export type WeaponModCompatibilityReasonCode =
  | "base-family-supported"
  | "modifier-slot-available"
  | "mode-overlap"
  | "universal-applicability"
  | "specific-family-applicability"
  | "occupied-slot-unavailable"
  | "family-mismatch"
  | "mode-mismatch"
  | "applicability-unresolved"
  | "applicability-not-applicable"
  | "unsupported-modifier-family";

export interface WeaponModCompatibilityResult {
  readonly kind: WeaponCompatibilityKind;
  readonly reasonCodes: readonly WeaponModCompatibilityReasonCode[];
}

export function explainWeaponModCompatibility(
  base: CatalogWeaponBaseRecord,
  modifier: CatalogWeaponModRecord
): WeaponModCompatibilityResult {
  const reasonCodes: WeaponModCompatibilityReasonCode[] = [];

  if (modifier.family === "unknown") {
    return {
      kind: "indeterminate",
      reasonCodes: ["unsupported-modifier-family"]
    };
  }

  if (!modesOverlap(base.modeAvailability, modifier.modeAvailability)) {
    return {
      kind: "incompatible",
      reasonCodes: ["mode-mismatch"]
    };
  }
  reasonCodes.push("mode-overlap");

  const slot = base.allowedModifierSlots.find(
    (candidate) =>
      candidate.slot === modifier.occupiedSlot &&
      candidate.compatibleModifierFamilies.includes(modifier.family)
  );
  if (slot === undefined || slot.cardinality === "not-applicable") {
    return {
      kind: "incompatible",
      reasonCodes: [...reasonCodes, "occupied-slot-unavailable"]
    };
  }
  reasonCodes.push("modifier-slot-available");

  switch (modifier.applicability.kind) {
    case "universal":
      return {
        kind: "compatible",
        reasonCodes: [...reasonCodes, "universal-applicability"]
      };
    case "specific-families":
      if (modifier.applicability.familyKeys.includes(base.familyKey)) {
        return {
          kind: "compatible",
          reasonCodes: [...reasonCodes, "base-family-supported", "specific-family-applicability"]
        };
      }
      return {
        kind: "incompatible",
        reasonCodes: [...reasonCodes, "family-mismatch"]
      };
    case "not-applicable":
      return {
        kind: "incompatible",
        reasonCodes: [...reasonCodes, "applicability-not-applicable"]
      };
    case "unresolved":
      return {
        kind: "indeterminate",
        reasonCodes: [...reasonCodes, "applicability-unresolved"]
      };
  }
}

function modesOverlap(
  baseMode: CatalogWeaponBaseRecord["modeAvailability"],
  modifierMode: CatalogWeaponModRecord["modeAvailability"]
): boolean {
  if (baseMode === "unknown" || modifierMode === "unknown") {
    return true;
  }
  if (baseMode === "both" || modifierMode === "both") {
    return true;
  }
  return baseMode === modifierMode;
}
