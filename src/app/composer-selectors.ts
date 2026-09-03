import {
  calculateEffectiveAttributeRank,
  collectEquipmentAttributeRankAdjustments,
  equipmentAdjustmentsForAttribute,
  purchasedRankCost,
  type AttributeId,
  type BuildSetEntryId,
  type PartySlotId
} from "../domain";
import type { AppCatalogViews } from "./catalogs";
import {
  selectAttributeBudgetView,
  selectAttributeRows,
  type AttributeEditorRowView,
  type ValidationView
} from "./editor-selectors";
import type { EditorState } from "./editor-state";
import type { WorkspaceState } from "./workspace-state";

export type ComposerLoadoutContext =
  | {
      readonly kind: "single-build";
      readonly label: string;
      readonly selected: true;
      readonly selectedLoadoutOnly: false;
    }
  | {
      readonly kind: "build-set-entry";
      readonly label: string;
      readonly selected: true;
      readonly selectedEntryId: BuildSetEntryId;
      readonly selectedLoadoutOnly: true;
    }
  | {
      readonly kind: "party-slot";
      readonly label: string;
      readonly selected: true;
      readonly selectedEntryId: BuildSetEntryId;
      readonly selectedPartySlotId: PartySlotId | null;
      readonly selectedLoadoutOnly: true;
    }
  | {
      readonly kind: "empty-build-set";
      readonly label: string;
      readonly selected: false;
    }
  | {
      readonly kind: "empty-party-slot";
      readonly label: string;
      readonly selected: false;
      readonly selectedPartySlotId: PartySlotId | null;
    };

export interface ComposerAttributeStepView {
  readonly visible: boolean;
  readonly cost: number | null;
  readonly disabled: boolean;
  readonly disabledReason: string | null;
}

export interface ComposerAttributeRowView extends AttributeEditorRowView {
  readonly effectiveRank: number | null;
  readonly effectiveRankLabel: string;
  readonly effectiveModified: boolean;
  readonly decrement: ComposerAttributeStepView;
  readonly increment: ComposerAttributeStepView;
}

export function selectComposerLoadoutContext(workspace: WorkspaceState): ComposerLoadoutContext {
  if (workspace.document.kind === "build") {
    return {
      kind: "single-build",
      label: "Single build draft",
      selected: true,
      selectedLoadoutOnly: false
    };
  }

  const document = workspace.document;
  const selectedEntry =
    document.selectedEntryId === null
      ? null
      : (document.entries.find((entry) => entry.id === document.selectedEntryId) ?? null);

  if (document.party?.enabled === true) {
    const selectedSlot =
      document.selectedPartySlotId === null
        ? null
        : (document.party.slots.find((slot) => slot.id === document.selectedPartySlotId) ?? null);
    if (document.selectedEntryId === null || selectedEntry === null) {
      return {
        kind: "empty-party-slot",
        label:
          selectedSlot === null
            ? "No party slot selected"
            : `Empty party slot ${document.party.slots.indexOf(selectedSlot) + 1}`,
        selected: false,
        selectedPartySlotId: selectedSlot?.id ?? null
      };
    }
    return {
      kind: "party-slot",
      label: selectedSlot?.memberLabel ?? selectedEntry.label,
      selected: true,
      selectedEntryId: document.selectedEntryId,
      selectedPartySlotId: document.selectedPartySlotId ?? selectedSlot?.id ?? null,
      selectedLoadoutOnly: true
    };
  }

  if (document.selectedEntryId === null || selectedEntry === null) {
    return {
      kind: "empty-build-set",
      label: document.entries.length === 0 ? "Empty build set" : "No build-set loadout selected",
      selected: false
    };
  }

  return {
    kind: "build-set-entry",
    label: selectedEntry.label,
    selected: true,
    selectedEntryId: document.selectedEntryId,
    selectedLoadoutOnly: true
  };
}

export function selectFocusedAttributeRows(
  state: EditorState,
  catalogs: AppCatalogViews,
  validation: ValidationView
): readonly ComposerAttributeRowView[] {
  const budget = selectAttributeBudgetView(state, catalogs);
  const rows = selectAttributeRows(state, catalogs, validation.result);
  const maxRank =
    catalogs.professionAttributeCatalog.attributePointRules.purchasedRankCosts.at(-1)
      ?.purchasedRank ?? 0;
  const equipmentAdjustmentSummary = collectEquipmentAttributeRankAdjustments({
    build: state.build,
    professionAttributes: catalogs.validation.professionAttributes,
    ...(catalogs.equipment.validation.runes === undefined
      ? {}
      : { runes: catalogs.equipment.validation.runes })
  });

  const focusedRows = rows.map((row) => {
    const effective = effectiveRankForRow(
      row.attributeId,
      state,
      catalogs,
      equipmentAdjustmentSummary
    );
    const decrementCost = previousRefundCost(row.rank, catalogs);
    const incrementCost = nextInvestmentCost(row.rank, catalogs);
    const incrementBlock =
      row.attributeId === null
        ? "Unresolved attribute cannot be edited."
        : row.rank >= maxRank
          ? "Attribute rank is at the supported cap."
          : incrementCost === null
            ? "Next rank cost is unavailable."
            : budget.mode === "evaluated" && (budget.remaining ?? 0) < incrementCost
              ? "Not enough attribute points remain."
              : null;

    return {
      ...row,
      effectiveRank: effective,
      effectiveRankLabel:
        effective === null
          ? "Effective rank unresolved"
          : effective === row.rank
            ? `Effective rank ${effective}`
            : `Effective rank ${effective}, modified from allocated rank ${row.rank}`,
      effectiveModified: effective !== null && effective !== row.rank,
      decrement: {
        visible: row.rank > 0 && row.attributeId !== null,
        cost: decrementCost,
        disabled: decrementCost === null,
        disabledReason: decrementCost === null ? "Refund cost is unavailable." : null
      },
      increment: {
        visible: row.attributeId !== null && row.rank < maxRank,
        cost: incrementCost,
        disabled: incrementBlock !== null,
        disabledReason: incrementBlock
      }
    };
  });

  return orderFocusedAttributeRows(focusedRows, state, catalogs);
}

function orderFocusedAttributeRows(
  rows: readonly ComposerAttributeRowView[],
  state: EditorState,
  catalogs: AppCatalogViews
): readonly ComposerAttributeRowView[] {
  const attributeOrder = selectedProfessionAttributeOrder(state, catalogs);
  const fallbackOffset = attributeOrder.size;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftOrder = focusedAttributeOrder(left.row, attributeOrder, fallbackOffset, left.index);
      const rightOrder = focusedAttributeOrder(
        right.row,
        attributeOrder,
        fallbackOffset,
        right.index
      );
      return leftOrder - rightOrder || left.index - right.index;
    })
    .map(({ row }) => row);
}

function selectedProfessionAttributeOrder(
  state: EditorState,
  catalogs: AppCatalogViews
): ReadonlyMap<number, number> {
  const order = new Map<number, number>();
  const seenProfessions = new Set<number>();
  const professionIds = [state.build.primaryProfessionId, state.build.secondaryProfessionId];

  for (const professionId of professionIds) {
    if (professionId === null) {
      continue;
    }
    const numericProfessionId = Number(professionId);
    if (seenProfessions.has(numericProfessionId)) {
      continue;
    }
    seenProfessions.add(numericProfessionId);
    for (const attribute of catalogs.attributes) {
      if (Number(attribute.professionId) !== numericProfessionId) {
        continue;
      }
      order.set(Number(attribute.id), order.size);
    }
  }

  return order;
}

function focusedAttributeOrder(
  row: ComposerAttributeRowView,
  attributeOrder: ReadonlyMap<number, number>,
  fallbackOffset: number,
  fallbackIndex: number
): number {
  if (row.attributeId === null) {
    return fallbackOffset + fallbackIndex;
  }
  return attributeOrder.get(Number(row.attributeId)) ?? fallbackOffset + fallbackIndex;
}

function effectiveRankForRow(
  attributeId: AttributeId | null,
  state: EditorState,
  catalogs: AppCatalogViews,
  equipmentAdjustmentSummary: ReturnType<typeof collectEquipmentAttributeRankAdjustments>
): number | null {
  if (attributeId === null) {
    return null;
  }
  const result = calculateEffectiveAttributeRank({
    build: state.build,
    professionAttributes: catalogs.validation.professionAttributes,
    attributeId,
    adjustments: equipmentAdjustmentsForAttribute(equipmentAdjustmentSummary, attributeId)
  });
  return result.kind === "resolved" ? result.finalRank : null;
}

function previousRefundCost(rank: number, catalogs: AppCatalogViews): number | null {
  if (rank <= 0) {
    return null;
  }
  const current = purchasedRankCost(catalogs.professionAttributeCatalog, rank);
  const previous = purchasedRankCost(catalogs.professionAttributeCatalog, rank - 1);
  return current === null || previous === null ? null : current - previous;
}

function nextInvestmentCost(rank: number, catalogs: AppCatalogViews): number | null {
  const current = purchasedRankCost(catalogs.professionAttributeCatalog, rank);
  const next = purchasedRankCost(catalogs.professionAttributeCatalog, rank + 1);
  return current === null || next === null ? null : next - current;
}
