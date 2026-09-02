import { validateProfessionAndAttributeRules } from "./rules/profession-attribute";
import { validateSkillBarRules } from "./rules/skill-bar";
import { validateSkillEligibilityRules } from "./rules/skill-eligibility";
import { createBuildValidationContext, type BuildValidationInput } from "./validation-context";
import {
  createValidationResult,
  sortValidationIssues,
  type ValidationIssue,
  type ValidationResult,
  type ValidationTruncation
} from "./validation";

export function validateBuild(input: BuildValidationInput): ValidationResult {
  const context = createBuildValidationContext(input);
  const issues = [
    ...context.issues,
    ...validateProfessionAndAttributeRules(context),
    ...validateSkillBarRules(context),
    ...validateSkillEligibilityRules(context)
  ];
  const capped = capIssues(issues, context.options.maxIssues, context.truncation);
  return createValidationResult(capped.issues, context.catalogVersions, capped.truncation);
}

function capIssues(
  issues: readonly ValidationIssue[],
  maxIssues: number,
  priorTruncation: ValidationTruncation | null
): {
  readonly issues: readonly ValidationIssue[];
  readonly truncation: ValidationTruncation | null;
} {
  const orderedIssues = sortValidationIssues(issues);
  if (orderedIssues.length <= maxIssues) {
    return { issues: orderedIssues, truncation: priorTruncation };
  }
  return {
    issues: orderedIssues.slice(0, maxIssues),
    truncation: {
      kind: "issue-cap",
      limit: maxIssues,
      observed: orderedIssues.length,
      path: []
    }
  };
}
