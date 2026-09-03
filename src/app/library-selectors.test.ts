import { describe, expect, it } from "vitest";

import { catalogId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { createPersistedBuildSnapshot, localBuildRecordId } from "./persistence-schema";
import { createBlankEditorState } from "./editor-state";
import {
  fixtureCatalogFacts,
  staleSavedRecordFixture,
  unresolvedSavedRecordFixture,
  validBuildSetSavedRecordFixture,
  validSavedRecordFixture
} from "./library-fixtures";
import { selectLibraryView } from "./library-selectors";

const catalogs = requireReadyCatalogs();

describe("library selectors", () => {
  it("searches by build name, resolved skill names, and unresolved raw labels", () => {
    const records = [validSavedRecordFixture(), unresolvedSavedRecordFixture()];

    const byName = selectLibraryView(
      records,
      catalogs,
      filters({ query: "hammer" }),
      fixtureCatalogFacts
    );
    const bySkill = selectLibraryView(
      records,
      catalogs,
      filters({ query: "healing signet" }),
      fixtureCatalogFacts
    );
    const byRaw = selectLibraryView(
      records,
      catalogs,
      filters({ query: "unknown skill 999999" }),
      fixtureCatalogFacts
    );

    expect(byName.rows.map((row) => row.name)).toContain("Hammer and Bow");
    expect(bySkill.rows.length).toBeGreaterThan(0);
    expect(byRaw.rows.map((row) => row.name)).toEqual(["Unresolved import"]);
  });

  it("filters by profession, mode, favorite, and tag", () => {
    const records = [
      validSavedRecordFixture({
        id: localBuildRecordId("local-a"),
        favorite: true,
        tags: ["Farm"]
      }),
      validSavedRecordFixture({
        id: localBuildRecordId("local-b"),
        name: "PvP Support",
        tags: ["Support"],
        snapshot: {
          ...createPersistedBuildSnapshot(createBlankEditorState("PvP Support")),
          build: {
            ...createBlankEditorState("PvP Support").build,
            mode: "pvp",
            primaryProfessionId: catalogId<"Profession">(3),
            secondaryProfessionId: catalogId<"Profession">(4)
          }
        }
      })
    ];

    const view = selectLibraryView(
      records,
      catalogs,
      filters({
        professionFilter: catalogId<"Profession">(1),
        modeFilter: "pve",
        favoriteOnly: true,
        tagFilter: "farm"
      }),
      fixtureCatalogFacts
    );

    expect(view.rows.map((row) => row.id)).toEqual(["local-a"]);
    expect(view.facets.tags).toEqual(["Farm", "Support"]);
    expect(view.facets.professions.map((profession) => profession.name)).toEqual([
      "Warrior",
      "Ranger",
      "Monk",
      "Necromancer"
    ]);
  });

  it("sorts deterministically by updated time, name, profession pair, and local ID", () => {
    const records = [
      validSavedRecordFixture({
        id: localBuildRecordId("local-b"),
        name: "Beta",
        updatedAt: "2026-09-02T19:25:41Z"
      }),
      validSavedRecordFixture({
        id: localBuildRecordId("local-a"),
        name: "Alpha",
        updatedAt: "2026-09-02T19:25:41Z"
      }),
      validSavedRecordFixture({
        id: localBuildRecordId("local-c"),
        name: "Alpha",
        updatedAt: "2026-09-02T19:26:41Z"
      })
    ];

    expect(
      selectLibraryView(
        records,
        catalogs,
        filters({ sortMode: "updated-desc" }),
        fixtureCatalogFacts
      ).rows.map((row) => row.id)
    ).toEqual(["local-c", "local-a", "local-b"]);
    expect(
      selectLibraryView(
        records,
        catalogs,
        filters({ sortMode: "name-asc" }),
        fixtureCatalogFacts
      ).rows.map((row) => row.id)
    ).toEqual(["local-c", "local-a", "local-b"]);
    expect(
      selectLibraryView(
        records,
        catalogs,
        filters({ sortMode: "profession-asc" }),
        fixtureCatalogFacts
      ).rows.map((row) => row.id)
    ).toEqual(["local-c", "local-a", "local-b"]);
  });

  it("keeps catalog freshness, validation validity, and resolution status separate", () => {
    const invalidFresh = validSavedRecordFixture({
      id: localBuildRecordId("local-invalid"),
      name: "Fresh invalid",
      tags: [],
      snapshot: {
        ...createPersistedBuildSnapshot(createBlankEditorState("Fresh invalid")),
        build: {
          ...createBlankEditorState("Fresh invalid").build,
          primaryProfessionId: catalogId<"Profession">(1),
          secondaryProfessionId: catalogId<"Profession">(1)
        }
      },
      savedWith: fixtureCatalogFacts
    });
    const view = selectLibraryView(
      [staleSavedRecordFixture(), invalidFresh, unresolvedSavedRecordFixture()],
      catalogs,
      filters({ sortMode: "name-asc" }),
      fixtureCatalogFacts
    );

    const freshInvalid = view.rows.find((row) => row.id === "local-invalid");
    const stale = view.rows.find((row) => row.id === "local-fixture-stale");
    const unresolved = view.rows.find((row) => row.id === "local-fixture-unresolved");

    expect(freshInvalid?.diagnostics).toMatchObject({
      freshness: "fresh",
      validation: "invalid"
    });
    expect(stale?.diagnostics).toMatchObject({
      freshness: "stale",
      validation: "valid"
    });
    expect(unresolved?.diagnostics.resolution).toBe("unresolved");
  });

  it("reports empty and no-result states", () => {
    const empty = selectLibraryView([], catalogs, filters(), fixtureCatalogFacts);
    const noResults = selectLibraryView(
      [validSavedRecordFixture()],
      catalogs,
      filters({ query: "nope" }),
      fixtureCatalogFacts
    );

    expect(empty.emptyState).toBe("empty-library");
    expect(noResults.emptyState).toBe("no-results");
  });

  it("summarizes and filters build-set records by any contained entry", () => {
    const buildSet = validBuildSetSavedRecordFixture({
      id: localBuildRecordId("local-set"),
      name: "Variant Set"
    });
    const byEntry = selectLibraryView(
      [validSavedRecordFixture({ id: localBuildRecordId("local-build") }), buildSet],
      catalogs,
      filters({ query: "unresolved variant" }),
      fixtureCatalogFacts
    );
    const byProfession = selectLibraryView(
      [buildSet],
      catalogs,
      filters({ professionFilter: catalogId<"Profession">(1) }),
      fixtureCatalogFacts
    );

    expect(byEntry.rows.map((row) => row.id)).toEqual(["local-set"]);
    expect(byEntry.rows[0]).toMatchObject({
      recordKind: "build-set",
      kindLabel: "Build set",
      entryCount: 2
    });
    expect(byProfession.rows.map((row) => row.id)).toEqual(["local-set"]);
    expect(byEntry.rows[0]?.diagnostics.resolution).toBe("unresolved");
  });
});

function filters(
  overrides: Partial<Parameters<typeof selectLibraryView>[2]> = {}
): Parameters<typeof selectLibraryView>[2] {
  return {
    query: "",
    professionFilter: null,
    modeFilter: "all",
    favoriteOnly: false,
    tagFilter: null,
    sortMode: "updated-desc",
    ...overrides
  };
}
