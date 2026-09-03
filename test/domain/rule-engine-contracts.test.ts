import { describe, expect, it } from "vitest";

import {
  createValidationIssue,
  createValidationResult,
  relatedEntity,
  sortValidationIssues,
  type ValidationCatalogVersions,
  type ValidationIssue
} from "../../src/domain";

const versions = {
  buildCatalogVersion: "build-v1",
  professionAttributeCatalogVersion: "pa-v1",
  skillCatalogVersion: "skills-v1",
  ruleEngineVersion: "rule-engine:v2"
} satisfies ValidationCatalogVersions;

describe("rule-engine validation contracts", () => {
  it("creates plain JSON-compatible issues with segment paths and typed locations", () => {
    const issue = createValidationIssue({
      severity: "error",
      code: "skill.duplicate",
      message: "Resolved player skill appears more than once on the bar.",
      path: ["skillBar", 5],
      location: { kind: "skill-slot", index: 5 },
      relatedEntities: [
        relatedEntity("skill-slot", 5),
        relatedEntity("skill", 100),
        relatedEntity("skill-slot", 0)
      ],
      sourceRule: "skill.duplicate"
    });

    expect(JSON.parse(JSON.stringify(issue))).toEqual(issue);
    expect(issue.path).toEqual(["skillBar", 5]);
    expect(issue.location).toEqual({ kind: "skill-slot", index: 5 });
    expect(issue.relatedEntities).toEqual([
      { kind: "skill-slot", id: 0 },
      { kind: "skill-slot", id: 5 },
      { kind: "skill", id: 100 }
    ]);
  });

  it("sorts issues by rule order, numeric-aware path, location, code, and related entities", () => {
    const issues: readonly ValidationIssue[] = [
      issue("skill.duplicate", ["skillBar", 10], "skill.duplicate"),
      issue("attribute.invalid-rank", ["attributes", 2, "rank"], "attribute.rank"),
      issue("skill.duplicate", ["skillBar", 2], "skill.duplicate"),
      issue("profession.primary-missing", ["primaryProfessionId"], "profession.primary-required")
    ];

    expect(sortValidationIssues(issues).map((candidate) => candidate.path)).toEqual([
      ["profession.primary-missing"],
      ["attributes", 2, "rank"],
      ["skillBar", 2],
      ["skillBar", 10]
    ]);
  });

  it("derives warning-only valid state separately from complete and resolved state", () => {
    const result = createValidationResult(
      [
        createValidationIssue({
          severity: "warning",
          code: "profession.primary-missing",
          message: "Primary profession is required before full validation is complete.",
          path: ["primaryProfessionId"],
          location: { kind: "profession", field: "primary" },
          sourceRule: "profession.primary-required"
        })
      ],
      versions
    );

    expect(result.valid).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.resolved).toBe(true);
    expect(result.exhaustive).toBe(true);
    expect(result.counts).toEqual({ error: 0, warning: 1, info: 0, total: 1 });
  });

  it("exposes truncation as a machine-readable result state", () => {
    const result = createValidationResult([], versions, {
      kind: "issue-cap",
      limit: 1,
      observed: 3,
      path: []
    });

    expect(result.valid).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.resolved).toBe(false);
    expect(result.exhaustive).toBe(false);
    expect(result.truncation).toEqual({ kind: "issue-cap", limit: 1, observed: 3, path: [] });
  });
});

function issue(
  code: Parameters<typeof createValidationIssue>[0]["code"],
  path: readonly (string | number)[],
  sourceRule: Parameters<typeof createValidationIssue>[0]["sourceRule"]
): ValidationIssue {
  return createValidationIssue({
    severity: "error",
    code,
    message: code,
    path: code === "profession.primary-missing" ? [code] : path,
    location: null,
    sourceRule
  });
}
