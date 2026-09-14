import type { AttributeId, Build, EquipmentSelectionState, RuneId } from "../domain";
import type { AppCatalogViews } from "./catalogs";
import type { EditorAction } from "./editor-state";

/** Catalog facts enter commands here; the reducer never imports runtime catalogs. */
export function equipmentActionWithAdjustmentFacts(
  build: Build,
  catalogs: AppCatalogViews,
  action: EditorAction
): EditorAction {
  if (
    action.type !== "set-armor-rune" &&
    action.type !== "clear-armor-field" &&
    action.type !== "reset-equipment"
  )
    return action;
  const selections =
    action.type === "reset-equipment"
      ? (build.equipment?.armor.map((piece) => piece.rune) ?? [])
      : action.type === "clear-armor-field" && action.field !== "rune"
        ? []
        : [
            build.equipment?.armor.find((piece) => piece.slot === action.slot)?.rune ?? null,
            action.type === "set-armor-rune" ? action.selection : null
          ];
  const affectedRuneAttributeIds = [
    ...new Set(selections.flatMap((selection) => runeTargets(selection, catalogs)))
  ];
  return { ...action, affectedRuneAttributeIds };
}

function runeTargets(
  selection: EquipmentSelectionState<RuneId> | null,
  catalogs: AppCatalogViews
): readonly AttributeId[] {
  if (selection?.kind !== "known") return [];
  const matches = catalogs.equipment.runes.filter((rune) => rune.id === selection.id);
  const rune = matches.length === 1 ? matches[0] : undefined;
  return rune?.familyKind === "attribute" && rune.affectedAttributeId !== null
    ? [rune.affectedAttributeId]
    : [];
}
