import { createElement } from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { RuneIcon } from "./components/RuneIcon";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catalogId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { localRuneIconAsset } from "./icon-assets";
import { runeTierOptions } from "./rune-icons";
import manifest from "./rune-icon-assets.generated.json";
const catalogs = requireReadyCatalogs();
describe("local rune assets", () => {
  it("retains labeled numeric controls when an image fails, with no remote fallback", () => {
    const asset = localRuneIconAsset(22);
    const { container } = render(
      createElement(
        "button",
        { "aria-label": "Superior rune +3" },
        createElement(RuneIcon, { asset }),
        "+3"
      )
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("button", { name: "Superior rune +3" })).toHaveTextContent("+3");
    expect(screen.getByRole("button", { name: "Superior rune +3" })).toBeEnabled();
  });
  it("covers 126 unique rune mappings with 30 locally verified image identities", () => {
    const runes = catalogs.equipment.runes.filter((r) => r.familyKind === "attribute");
    expect(Object.keys(manifest.assetsByRuneId)).toHaveLength(126);
    const paths = new Set(runes.map((r) => localRuneIconAsset(r.id)?.src));
    expect(paths.size).toBe(30);
    expect(paths.has(undefined)).toBe(false);
    for (const path of paths) {
      const bytes = readFileSync(`public${path}`);
      expect(createHash("sha1").update(bytes).digest("hex")).toBe(
        path?.split("/").at(-1)?.replace(".png", "")
      );
    }
    expect(JSON.stringify(manifest)).not.toMatch(/https?:/);
  });
  it("resolves tiers uniquely including attribute zero and individual health penalties", () => {
    for (const attribute of catalogs.attributes) {
      const options = runeTierOptions(
        catalogs.equipment.runes,
        attribute.professionId,
        attribute.id
      );
      expect(options.map((o) => o.amount)).toEqual([1, 2, 3]);
      expect(options.map((o) => o.healthPenalty)).toEqual([0, -35, -75]);
      expect(options.every((o) => o.rune !== null && o.icon !== null)).toBe(true);
    }
    const target = catalogs.equipment.runes.find((r) => Number(r.id) === 22)!;
    const duplicate = runeTierOptions(
      [...catalogs.equipment.runes, target],
      catalogId<"Profession">(5),
      catalogId<"Attribute">(0)
    );
    expect(duplicate[0]?.rune).toBeNull();
  });
  it("contains paths, supports non-root Vite deployments and fails safely on missing entries", () => {
    const asset = localRuneIconAsset(22, "/build-wars/")!;
    expect(asset.src).toMatch(/^\/build-wars\/gww-icons\/runes\//);
    expect(asset.height).not.toBe(asset.width);
    expect(localRuneIconAsset(99999)).toBeNull();
    for (const src of [
      "https://invalid.example/image.png",
      "../escape.png",
      "//invalid.example/image.png",
      "gww-icons/runes/../../escape.png"
    ])
      expect(
        localRuneIconAsset(22, "/", { assetsByRuneId: { "22": { ...asset, src } } })
      ).toBeNull();
  });
  it("keeps exact provenance allowlist and policy paths eligible for version control", () => {
    const path = "data/generated/epic-10/rune-icon-assets.manifest.json";
    expect(readFileSync(".gitignore", "utf8")).toContain(`!${path}`);
    expect(readFileSync("compendium/decisions/0002-runtime-gww-icon-assets.md", "utf8")).toContain(
      path
    );
    expect(readFileSync("compendium/source-policy.md", "utf8")).toContain(path);
    const rule = execFileSync("git", ["check-ignore", "-v", "--no-index", path], {
      encoding: "utf8"
    });
    expect(rule).toContain(`!${path}`);
  });
});
