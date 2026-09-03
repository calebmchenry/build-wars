import { describe, expect, it } from "vitest";

import {
  authoredDocumentId,
  buildSetEntryId,
  cloneBuildForBuildSetEntry,
  createBlankBuildSet,
  createBuildSetEntry,
  duplicateBuildSetEntry,
  moveBuildSetEntry,
  normalizeBuildSetEntryLabel,
  normalizeBuildSetEntryNotes,
  repairSelectedBuildSetEntryId,
  validateBuildSetShape,
  type BuildSetEntry
} from "../../src/domain";
import {
  createEmptyEquipmentLoadout,
  knownEquipmentSelection,
  type RuneId,
  type WeaponModifierId
} from "../../src/domain";
import { syntheticFoundationBuild } from "../fixtures/foundation";

describe("build set domain contracts", () => {
  it("represents empty, single, multi, variant, freeform, partial, and unresolved sets", () => {
    const empty = createBlankBuildSet({ id: authoredDocumentId("set-empty"), entries: [] });
    const partial = {
      ...syntheticFoundationBuild,
      primaryProfessionId: null,
      secondaryProfessionId: null,
      skillBar: [null, null, null, null, null, null, null, null] as const
    };
    const entries: readonly BuildSetEntry[] = [
      createBuildSetEntry({
        id: buildSetEntryId("entry-build"),
        label: "Main",
        kind: "build",
        build: syntheticFoundationBuild
      }),
      createBuildSetEntry({
        id: buildSetEntryId("entry-variant"),
        label: "Main Variant",
        kind: "variant",
        notes: "local note",
        build: cloneBuildForBuildSetEntry(syntheticFoundationBuild, authoredDocumentId("nested-2"))
      }),
      createBuildSetEntry({
        id: buildSetEntryId("entry-freeform"),
        label: "Freeform",
        kind: "freeform",
        build: partial
      })
    ];
    const multi = createBlankBuildSet({
      id: authoredDocumentId("set-multi"),
      name: "Variants",
      entries
    });

    expect(empty.entries).toEqual([]);
    expect(multi.entries.map((entry) => entry.kind)).toEqual(["build", "variant", "freeform"]);
    expect(validateBuildSetShape(multi)).toEqual([]);
    expect(validateBuildSetShape({ ...multi, entries: [entries[0]!] })).toEqual([]);
  });

  it("normalizes labels and notes without using labels as identity", () => {
    const first = createBuildSetEntry({
      id: buildSetEntryId("entry-a"),
      label: "  Duplicate  ",
      notes: "  keep local  ",
      build: syntheticFoundationBuild
    });
    const second = createBuildSetEntry({
      id: buildSetEntryId("entry-b"),
      label: "Duplicate",
      notes: "",
      build: syntheticFoundationBuild
    });

    expect(first.label).toBe("Duplicate");
    expect(first.notes).toBe("keep local");
    expect(second.notes).toBeNull();
    expect(normalizeBuildSetEntryLabel("")).toBe("Untitled Loadout");
    expect(normalizeBuildSetEntryNotes(" ".repeat(4))).toBeNull();
    expect(validateBuildSetShape(createBlankBuildSet({ entries: [first, second] }))).toEqual([]);
  });

  it("moves, duplicates, and repairs selection by stable entry ID", () => {
    const entries = [
      createBuildSetEntry({
        id: buildSetEntryId("entry-a"),
        label: "A",
        build: syntheticFoundationBuild
      }),
      createBuildSetEntry({
        id: buildSetEntryId("entry-b"),
        label: "B",
        build: syntheticFoundationBuild
      })
    ];
    const moved = moveBuildSetEntry(entries, buildSetEntryId("entry-b"), "earlier");
    const duplicated = duplicateBuildSetEntry(moved, buildSetEntryId("entry-b"), {
      id: buildSetEntryId("entry-c"),
      build: syntheticFoundationBuild
    });

    expect(moved.map((entry) => entry.id)).toEqual(["entry-b", "entry-a"]);
    expect(duplicated.map((entry) => entry.id)).toEqual(["entry-b", "entry-c", "entry-a"]);
    expect(duplicated[1]?.kind).toBe("variant");
    expect(repairSelectedBuildSetEntryId(duplicated, buildSetEntryId("missing"))).toBe("entry-b");
    expect(repairSelectedBuildSetEntryId([], buildSetEntryId("missing"))).toBeNull();
  });

  it("detects duplicate IDs, unsupported versions, invalid kinds, oversized strings, and caps", () => {
    const entry = createBuildSetEntry({
      id: buildSetEntryId("entry-a"),
      label: "A",
      build: syntheticFoundationBuild
    });
    const issues = validateBuildSetShape({
      schemaVersion: 99 as 1,
      id: authoredDocumentId("set-bad"),
      name: "x".repeat(121),
      entries: [
        entry,
        {
          ...entry,
          kind: "party" as never,
          label: "x".repeat(121),
          notes: "x".repeat(1_001)
        },
        ...Array.from({ length: 15 }, (_, index) => ({
          ...entry,
          id: buildSetEntryId(`entry-${index}`)
        }))
      ]
    });

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "unsupported-build-set-version",
        "invalid-build-set-name",
        "too-many-build-set-entries",
        "duplicate-build-set-entry-id",
        "invalid-build-set-entry-kind",
        "invalid-build-set-entry-label",
        "invalid-build-set-entry-notes"
      ])
    );
  });

  it("deep-clones nested build, skill, attribute, title, equipment, and modifier arrays on re-key", () => {
    const equipment = createEmptyEquipmentLoadout();
    const build = {
      ...syntheticFoundationBuild,
      titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 3 }],
      attributes: [{ attributeId: syntheticFoundationBuild.attributes[0]!.attributeId, rank: 9 }],
      equipment: {
        ...equipment,
        armor: equipment.armor.map((piece) =>
          piece.slot === "head" ? { ...piece, rune: knownEquipmentSelection(40 as RuneId) } : piece
        ),
        weaponSets: equipment.weaponSets.map((set) =>
          set.slot === "set-1"
            ? {
                ...set,
                mainHand: {
                  weapon: null,
                  modifiers: [knownEquipmentSelection(401 as WeaponModifierId)],
                  requirement: null
                }
              }
            : set
        )
      }
    };
    const copy = cloneBuildForBuildSetEntry(build, authoredDocumentId("nested-copy"));

    expect(copy.id).toBe("nested-copy");
    expect(copy.skillBar).toEqual(build.skillBar);
    expect(copy.skillBar).not.toBe(build.skillBar);
    expect(copy.attributes).toEqual(build.attributes);
    expect(copy.attributes).not.toBe(build.attributes);
    expect(copy.titleRankOverrides).toEqual(build.titleRankOverrides);
    expect(copy.titleRankOverrides).not.toBe(build.titleRankOverrides);
    expect(copy.equipment).toEqual(build.equipment);
    expect(copy.equipment).not.toBe(build.equipment);
    expect(copy.equipment?.armor).not.toBe(build.equipment?.armor);
    expect(copy.equipment?.weaponSets[0]?.mainHand?.modifiers).not.toBe(
      build.equipment?.weaponSets[0]?.mainHand?.modifiers
    );
  });
});
