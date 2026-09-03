import { describe, expect, it } from "vitest";

import {
  catalogId,
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  unresolvedEquipmentSelection,
  type EquipmentSelectionState,
  type EquipmentLoadout,
  type RuneId,
  type WeaponId,
  type WeaponModifierId
} from "../domain";
import {
  attributeIds,
  professionAttributeCatalog,
  professionIds
} from "../../test/fixtures/rule-engine/catalogs";
import {
  equipmentInsigniaCatalog,
  equipmentRuneCatalog,
  equipmentWeaponCatalog,
  equipmentWeaponModifierCatalog,
  insigniaIds,
  runeIds,
  weaponIds,
  weaponModifierIds
} from "../../test/fixtures/rule-engine/equipment-catalogs";
import {
  requireReadyCatalogs,
  type AppCatalogViews,
  type EquipmentCatalogReadinessMap
} from "./catalogs";
import { selectValidationView } from "./editor-selectors";
import {
  selectEquipmentPanelView,
  selectEquipmentSummary,
  selectHasMeaningfulEquipment
} from "./equipment-selectors";
import { createBlankEditorState, type EditorState } from "./editor-state";

const productionCatalogs = requireReadyCatalogs();

describe("equipment selectors", () => {
  it("treats null and canonical empty equipment as not meaningful", () => {
    expect(selectHasMeaningfulEquipment(null)).toBe(false);
    expect(selectHasMeaningfulEquipment(createEmptyEquipmentLoadout())).toBe(false);
    expect(
      selectHasMeaningfulEquipment(armorFixture({ rune: knownEquipmentSelection(runeIds.vigor) }))
    ).toBe(true);
  });

  it("retains stale armor selections and groups validation issues near the slot", () => {
    const catalogs = fixtureCatalogs();
    const state = editorWithEquipment(
      armorFixture({
        rune: knownEquipmentSelection(catalogId<"Rune">(9999) as RuneId),
        insignia: knownEquipmentSelection(insigniaIds.chestOnly)
      })
    );
    const validation = selectValidationView(state, catalogs);
    const panel = selectEquipmentPanelView(state, catalogs, validation.result);
    const head = panel.armorSlots[0]!;

    expect(head.rune.state).toBe("retained");
    expect(head.runeOptions[0]?.retained).toBe(true);
    expect(head.runeOptions[0]?.label).toBe("Retained rune 9999");
    expect(head.insigniaOptions.some((option) => option.disabledReason?.includes("head"))).toBe(
      true
    );
    expect(head.issues.length).toBeGreaterThan(0);
  });

  it("builds conservative summaries without aggregating weapon-set facts globally", () => {
    const catalogs = fixtureCatalogs();
    const state = editorWithEquipment(
      mixedEquipmentFixture({
        rune: knownEquipmentSelection(runeIds.vigor),
        insignia: knownEquipmentSelection(insigniaIds.survivor),
        weapon: knownEquipmentSelection(weaponIds.shield)
      })
    );
    const validation = selectValidationView(state, catalogs);
    const summary = selectEquipmentSummary(state, catalogs, validation.result);

    expect(summary.healthDelta).toBe(40);
    expect(summary.globalNotes.some((note) => note.includes("Axe Mastery +1"))).toBe(true);
    expect(
      summary.weaponSetNotes.some((note) => note.includes("Set 1 off hand requires Tactics 9"))
    ).toBe(true);
    expect(summary.weaponSetNotes.join(" ")).not.toContain("Health");
  });

  it("degrades catalog-backed validation by family while leaving unaffected controls usable", () => {
    const catalogs = fixtureCatalogs({
      readiness: {
        ...readyEquipmentReadiness(),
        runes: {
          ...readyEquipmentReadiness().runes,
          status: "error",
          recordCount: 0,
          issues: ["fixture rune catalog failure"]
        }
      },
      runes: [],
      validation: {
        insignias: equipmentInsigniaCatalog,
        weapons: equipmentWeaponCatalog,
        weaponModifiers: equipmentWeaponModifierCatalog
      }
    });
    const state = editorWithEquipment(
      armorFixture({ rune: knownEquipmentSelection(runeIds.vigor) })
    );
    const validation = selectValidationView(state, catalogs);
    const panel = selectEquipmentPanelView(state, catalogs, validation.result);

    expect(panel.readiness.runes.status).toBe("error");
    expect(panel.summary.validationUnavailable.join(" ")).toContain("rune catalog");
    expect(panel.armorSlots[0]?.insigniaOptions.length).toBeGreaterThan(0);
    expect(panel.weaponSets[0]?.mainHand.weaponOptions.length).toBeGreaterThan(0);
  });

  it("retains stale and unresolved weapon state as selected, clearable authored values", () => {
    const catalogs = fixtureCatalogs();
    const state = editorWithEquipment(
      mixedEquipmentFixture({
        weapon: knownEquipmentSelection(catalogId<"Weapon">(9999) as WeaponId),
        modifier: unresolvedEquipmentSelection({
          label: "Old hilt",
          reason: "imported modifier not resolved",
          candidateCatalogId: 401
        })
      })
    );
    const validation = selectValidationView(state, catalogs);
    const panel = selectEquipmentPanelView(state, catalogs, validation.result);
    const hand = panel.weaponSets[0]?.offHand;

    expect(hand?.selectedWeapon.state).toBe("retained");
    expect(hand?.modifierControls[0]?.selected.state).toBe("unresolved");
    expect(hand?.canClear).toBe(true);
    expect(panel.summary.weaponSetNotes.join(" ")).toContain("Retained off hand weapon ID 9999");
  });
});

function fixtureCatalogs(
  equipmentOverrides: Partial<AppCatalogViews["equipment"]> = {}
): AppCatalogViews {
  const readiness = equipmentOverrides.readiness ?? readyEquipmentReadiness();
  return {
    ...productionCatalogs,
    professions: professionAttributeCatalog.professions,
    attributes: professionAttributeCatalog.attributes,
    validation: {
      ...productionCatalogs.validation,
      professionAttributes: professionAttributeCatalog
    },
    versions: {
      ...productionCatalogs.versions,
      runes: readiness.runes.catalogVersion,
      insignias: readiness.insignias.catalogVersion,
      weapons: readiness.weapons.catalogVersion,
      weaponModifiers: readiness.weaponModifiers.catalogVersion,
      weaponCatalogSetVersion: readiness.weapons.catalogSetVersion,
      weaponCatalogSetDigest: readiness.weapons.catalogSetDigest
    },
    equipment: {
      runes: equipmentRuneCatalog.records,
      insignias: equipmentInsigniaCatalog.records,
      weapons: equipmentWeaponCatalog.records,
      weaponModifiers: equipmentWeaponModifierCatalog.records,
      validation: {
        runes: equipmentRuneCatalog,
        insignias: equipmentInsigniaCatalog,
        weapons: equipmentWeaponCatalog,
        weaponModifiers: equipmentWeaponModifierCatalog
      },
      readiness,
      ...equipmentOverrides
    }
  };
}

function readyEquipmentReadiness(): EquipmentCatalogReadinessMap {
  return {
    runes: {
      family: "runes",
      label: "Runes",
      status: "ready",
      catalogVersion: equipmentRuneCatalog.catalogVersion,
      catalogSetVersion: null,
      catalogSetDigest: null,
      generatedAt: "2026-09-01T00:00:00Z",
      recordCount: equipmentRuneCatalog.records.length,
      attribution: "fixture runes",
      issues: []
    },
    insignias: {
      family: "insignias",
      label: "Insignias",
      status: "ready",
      catalogVersion: equipmentInsigniaCatalog.catalogVersion,
      catalogSetVersion: null,
      catalogSetDigest: null,
      generatedAt: "2026-09-01T00:00:00Z",
      recordCount: equipmentInsigniaCatalog.records.length,
      attribution: "fixture insignias",
      issues: []
    },
    weapons: {
      family: "weapons",
      label: "Weapons",
      status: "ready",
      catalogVersion: equipmentWeaponCatalog.catalogVersion,
      catalogSetVersion: equipmentWeaponCatalog.catalogSetVersion,
      catalogSetDigest: equipmentWeaponCatalog.catalogSetDigest,
      generatedAt: "2026-09-01T00:00:00Z",
      recordCount: equipmentWeaponCatalog.records.length,
      attribution: "fixture weapons",
      issues: []
    },
    weaponModifiers: {
      family: "weaponModifiers",
      label: "Weapon modifiers",
      status: "ready",
      catalogVersion: equipmentWeaponModifierCatalog.catalogVersion,
      catalogSetVersion: equipmentWeaponModifierCatalog.catalogSetVersion,
      catalogSetDigest: equipmentWeaponModifierCatalog.catalogSetDigest,
      generatedAt: "2026-09-01T00:00:00Z",
      recordCount: equipmentWeaponModifierCatalog.records.length,
      attribution: "fixture weapon modifiers",
      issues: []
    }
  };
}

function editorWithEquipment(equipment: EquipmentLoadout): EditorState {
  const state = createBlankEditorState();
  return {
    ...state,
    build: {
      ...state.build,
      primaryProfessionId: professionIds.warrior,
      secondaryProfessionId: professionIds.ranger,
      attributes: [{ attributeId: attributeIds.tactics, rank: 9 }],
      equipment
    }
  };
}

function armorFixture(head: Partial<EquipmentLoadout["armor"][number]>): EquipmentLoadout {
  const base = createEmptyEquipmentLoadout();
  return {
    ...base,
    armor: base.armor.map((piece) =>
      piece.slot === "head"
        ? {
            ...piece,
            headgearAttribute: knownEquipmentSelection(attributeIds.axeMastery),
            ...head
          }
        : piece
    )
  };
}

function mixedEquipmentFixture(input: {
  readonly rune?: EquipmentLoadout["armor"][number]["rune"];
  readonly insignia?: EquipmentLoadout["armor"][number]["insignia"];
  readonly weapon?: EquipmentSelectionState<WeaponId> | null;
  readonly modifier?: EquipmentSelectionState<WeaponModifierId>;
}): EquipmentLoadout {
  const base = armorFixture({
    rune: input.rune ?? null,
    insignia: input.insignia ?? null
  });
  return {
    ...base,
    weaponSets: base.weaponSets.map((set) =>
      set.slot === "set-1"
        ? {
            ...set,
            offHand: {
              weapon: input.weapon ?? knownEquipmentSelection(weaponIds.shield),
              modifiers:
                input.modifier === undefined
                  ? [knownEquipmentSelection(weaponModifierIds.swordSuffix)]
                  : [input.modifier],
              requirement: null
            }
          }
        : set
    )
  };
}
