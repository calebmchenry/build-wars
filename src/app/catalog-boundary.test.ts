import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const appRoot = join(process.cwd(), "src", "app");
const generatedPathPattern = new RegExp(
  [escapeRegExp("data"), escapeRegExp("generated"), ""].join("/")
);
const forbiddenRuntimePatterns = [
  ["data", "qa"].join("/"),
  ["data", "source-snapshots"].join("/"),
  ["scripts", "data"].join("/"),
  "api\\.php",
  ["wiki", "guildwars"].join("\\.")
].map((pattern) => new RegExp(pattern));

describe("app runtime source boundary", () => {
  it("keeps promoted generated imports isolated to catalogs.ts", () => {
    const matches = sourceFiles(appRoot)
      .filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"))
      .flatMap((file) =>
        generatedPathPattern.test(readFileSync(file, "utf8")) ? [relative(appRoot, file)] : []
      );

    expect(matches).toEqual(["catalogs.ts"]);
  });

  it("does not reference forbidden runtime source artifacts or remote media paths", () => {
    const offenders = sourceFiles(appRoot)
      .filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"))
      .flatMap((file) => {
        const text = readFileSync(file, "utf8");
        return forbiddenRuntimePatterns.some((pattern) => pattern.test(text))
          ? [relative(appRoot, file)]
          : [];
      });

    expect(offenders).toEqual([]);
  });

  it("does not render remote media through image or preload primitives", () => {
    const imageLike = /<(img|source|picture|canvas)\b|rel=["']preload["']|fetch\(/;
    const offenders = sourceFiles(appRoot)
      .filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"))
      .flatMap((file) =>
        imageLike.test(readFileSync(file, "utf8")) ? [relative(appRoot, file)] : []
      );

    expect(offenders).toEqual([]);
  });
});

function sourceFiles(root: string): readonly string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      return sourceFiles(path);
    }
    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : [];
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
