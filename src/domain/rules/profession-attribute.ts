import type { CatalogAttributeRecord } from "../catalog";
import type { BuildValidationContext, AttributeRowContext } from "../validation-context";
import { createValidationIssue, relatedEntity, type ValidationIssue } from "../validation";

export function validateProfessionAndAttributeRules(
  context: BuildValidationContext
): readonly ValidationIssue[] {
  return [
    ...validateProfessionRules(context),
    ...validateAttributeRows(context),
    ...validateAttributeBudget(context)
  ];
}

function validateProfessionRules(context: BuildValidationContext): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const primary = context.primaryProfession;
  const secondary = context.secondaryProfession;

  if (primary.authoredId === null) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "profession.primary-missing",
        message: "Primary profession is required before full validation is complete.",
        path: ["primaryProfessionId"],
        location: { kind: "profession", field: "primary" },
        relatedEntities: [],
        sourceRule: "profession.primary-required"
      })
    );
  }

  if (context.profile === "complete" && secondary.authoredId === null) {
    issues.push(
      createValidationIssue({
        severity: "warning",
        code: "profession.secondary-missing",
        message: "Complete validation requires a secondary profession decision.",
        path: ["secondaryProfessionId"],
        location: { kind: "profession", field: "secondary" },
        relatedEntities: [],
        sourceRule: "profession.secondary-required"
      })
    );
  }

  if (primary.authoredId === null && secondary.authoredId !== null) {
    issues.push(
      createValidationIssue({
        severity: "error",
        code: "profession.secondary-without-primary",
        message: "Secondary profession cannot be selected without a primary profession.",
        path: ["secondaryProfessionId"],
        location: { kind: "profession", field: "secondary" },
        relatedEntities: professionPairEntities(primary.numericId, secondary.numericId),
        sourceRule: "profession.pair"
      })
    );
  }

  if (
    primary.numericId !== null &&
    secondary.numericId !== null &&
    primary.numericId === secondary.numericId
  ) {
    issues.push(
      createValidationIssue({
        severity: "error",
        code: "profession.duplicate",
        message: "Primary and secondary professions must be different.",
        path: ["secondaryProfessionId"],
        location: { kind: "profession", field: "secondary" },
        relatedEntities: professionPairEntities(primary.numericId, secondary.numericId),
        sourceRule: "profession.pair"
      })
    );
  }

  if (primary.authoredId !== null && primary.lookup.kind !== "resolved") {
    issues.push(unresolvedProfessionIssue("primary", primary.numericId));
  }
  if (secondary.authoredId !== null && secondary.lookup.kind !== "resolved") {
    issues.push(unresolvedProfessionIssue("secondary", secondary.numericId));
  }

  return issues;
}

function validateAttributeRows(context: BuildValidationContext): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const duplicateRows = duplicateAttributeRows(context.attributeRows);
  const professionTruthResolved = context.primaryProfession.lookup.kind === "resolved";
  const selectedProfessionIds = resolvedSelectedProfessionIds(context);

  for (const row of context.attributeRows) {
    if (row.numericId === null || row.lookup.kind !== "resolved") {
      issues.push(unresolvedAttributeIssue(row));
    }

    if (!row.rankIsValid) {
      issues.push(
        createValidationIssue({
          severity: "error",
          code: "attribute.invalid-rank",
          message: "Attribute rank must be a finite non-negative integer.",
          path: ["attributes", row.index, "rank"],
          location: { kind: "attribute-row", index: row.index },
          relatedEntities: attributeRowEntities(row),
          sourceRule: "attribute.rank"
        })
      );
    } else if (row.rankCost === null) {
      issues.push(
        createValidationIssue({
          severity: "error",
          code: "attribute.unsupported-rank",
          message: "Attribute rank is not supported by the catalog point-cost table.",
          path: ["attributes", row.index, "rank"],
          location: { kind: "attribute-row", index: row.index },
          relatedEntities: attributeRowEntities(row),
          sourceRule: "attribute.rank"
        })
      );
    }

    if (duplicateRows.has(row.index)) {
      const relatedRows = context.attributeRows
        .filter((candidate) => candidate.numericId === row.numericId)
        .map((candidate) => relatedEntity("attribute-row", candidate.index));
      issues.push(
        createValidationIssue({
          severity: "error",
          code: "attribute.duplicate",
          message: "Attribute is allocated more than once; the first row is used for spending.",
          path: ["attributes", row.index, "attributeId"],
          location: { kind: "attribute-row", index: row.index },
          relatedEntities: [...attributeRowEntities(row), ...relatedRows],
          sourceRule: "attribute.duplicate"
        })
      );
    }

    if (row.lookup.kind === "resolved" && professionTruthResolved) {
      const ownershipIssue = validateAttributeOwnership(
        row,
        row.lookup.record,
        selectedProfessionIds,
        context.primaryProfession.lookup.record.id
      );
      if (ownershipIssue !== null) {
        issues.push(ownershipIssue);
      }
    }
  }

  return issues;
}

function validateAttributeBudget(context: BuildValidationContext): readonly ValidationIssue[] {
  const spend = calculateAttributeSpend(context.attributeRows);
  if (spend === null || spend === 0 || context.budget.kind === "none") {
    return [];
  }

  if (context.budget.kind === "unresolved") {
    return [
      createValidationIssue({
        severity: "warning",
        code: "attribute.budget-unresolved",
        message: `Attribute spending is ${spend}, but the budget is unresolved.`,
        path: ["attributes"],
        location: null,
        relatedEntities: [
          relatedEntity("budget", context.budget.reason),
          relatedEntity("budget", spend, "spend")
        ],
        sourceRule: "attribute.budget"
      })
    ];
  }

  if (spend > context.budget.points) {
    return [
      createValidationIssue({
        severity: "error",
        code: "attribute.budget-overspent",
        message: `Attribute spending is ${spend}, exceeding the ${context.budget.points} point budget.`,
        path: ["attributes"],
        location: null,
        relatedEntities: [
          relatedEntity("budget", context.budget.points, "budget"),
          relatedEntity("budget", spend, "spend")
        ],
        sourceRule: "attribute.budget"
      })
    ];
  }

  return [];
}

function unresolvedProfessionIssue(
  field: "primary" | "secondary",
  numericId: number | null
): ValidationIssue {
  return createValidationIssue({
    severity: "warning",
    code: field === "primary" ? "profession.primary-unresolved" : "profession.secondary-unresolved",
    message: `${field === "primary" ? "Primary" : "Secondary"} profession ID is not resolved in the catalog.`,
    path: [field === "primary" ? "primaryProfessionId" : "secondaryProfessionId"],
    location: { kind: "profession", field },
    relatedEntities: [relatedEntity("profession", numericId ?? "invalid")],
    sourceRule: "profession.resolve"
  });
}

function unresolvedAttributeIssue(row: AttributeRowContext): ValidationIssue {
  return createValidationIssue({
    severity: "warning",
    code: "attribute.unresolved",
    message: "Attribute ID is not resolved in the catalog.",
    path: ["attributes", row.index, "attributeId"],
    location: { kind: "attribute-row", index: row.index },
    relatedEntities: attributeRowEntities(row),
    sourceRule: "attribute.resolve"
  });
}

function validateAttributeOwnership(
  row: AttributeRowContext,
  attribute: CatalogAttributeRecord,
  selectedProfessionIds: ReadonlySet<number>,
  primaryProfessionId: number
): ValidationIssue | null {
  const attributeProfessionId = Number(attribute.professionId);
  if (attribute.isPrimaryOnly && attributeProfessionId !== primaryProfessionId) {
    return createValidationIssue({
      severity: "error",
      code: "attribute.primary-only",
      message: "Primary-only attribute does not belong to the selected primary profession.",
      path: ["attributes", row.index, "attributeId"],
      location: { kind: "attribute-row", index: row.index },
      relatedEntities: [
        ...attributeRowEntities(row),
        relatedEntity("profession", primaryProfessionId, "selected-primary"),
        relatedEntity("profession", attributeProfessionId, "attribute-owner")
      ],
      sourceRule: "attribute.ownership"
    });
  }

  if (!attribute.isPrimaryOnly && !selectedProfessionIds.has(attributeProfessionId)) {
    return createValidationIssue({
      severity: "error",
      code: "attribute.wrong-profession",
      message: "Attribute does not belong to a selected profession.",
      path: ["attributes", row.index, "attributeId"],
      location: { kind: "attribute-row", index: row.index },
      relatedEntities: [
        ...attributeRowEntities(row),
        relatedEntity("profession", attributeProfessionId, "attribute-owner")
      ],
      sourceRule: "attribute.ownership"
    });
  }

  return null;
}

function duplicateAttributeRows(rows: readonly AttributeRowContext[]): ReadonlySet<number> {
  const firstByAttributeId = new Set<number>();
  const duplicates = new Set<number>();
  for (const row of rows) {
    if (row.numericId === null) {
      continue;
    }
    if (firstByAttributeId.has(row.numericId)) {
      duplicates.add(row.index);
    } else {
      firstByAttributeId.add(row.numericId);
    }
  }
  return duplicates;
}

function calculateAttributeSpend(rows: readonly AttributeRowContext[]): number | null {
  const seenAttributeIds = new Set<number>();
  let spend = 0;
  for (const row of rows) {
    if (row.numericId === null || seenAttributeIds.has(row.numericId)) {
      continue;
    }
    seenAttributeIds.add(row.numericId);
    if (!row.rankIsValid) {
      continue;
    }
    if (row.rankCost === null) {
      return null;
    }
    spend += row.rankCost.cumulativeCost;
    if (!Number.isSafeInteger(spend)) {
      return null;
    }
  }
  return spend;
}

function resolvedSelectedProfessionIds(context: BuildValidationContext): ReadonlySet<number> {
  const ids = new Set<number>();
  if (context.primaryProfession.lookup.kind === "resolved") {
    ids.add(Number(context.primaryProfession.lookup.record.id));
  }
  if (context.secondaryProfession.lookup.kind === "resolved") {
    ids.add(Number(context.secondaryProfession.lookup.record.id));
  }
  return ids;
}

function professionPairEntities(
  primaryId: number | null,
  secondaryId: number | null
): readonly ReturnType<typeof relatedEntity>[] {
  return [
    relatedEntity("profession", primaryId ?? "none", "primary"),
    relatedEntity("profession", secondaryId ?? "none", "secondary")
  ];
}

function attributeRowEntities(
  row: AttributeRowContext
): readonly ReturnType<typeof relatedEntity>[] {
  return [
    relatedEntity("attribute-row", row.index),
    relatedEntity("attribute", row.numericId ?? "invalid")
  ];
}
