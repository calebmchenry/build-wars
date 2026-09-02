import type {
  TemplateCompatibilityError,
  TemplateDiagnostic,
  TemplateErrorCode,
  TemplateErrorStage,
  TemplateKind,
  TemplateOperation,
  TemplateResult
} from "../domain";

export function templateSuccess<Value>(
  value: Value,
  diagnostics: readonly TemplateDiagnostic[] = []
): TemplateResult<Value> {
  return { ok: true, value, diagnostics };
}

export function templateFailure<Value>(error: TemplateCompatibilityError): TemplateResult<Value> {
  return { ok: false, error };
}

export function templateError(input: {
  readonly code: TemplateErrorCode;
  readonly operation: TemplateOperation;
  readonly stage: TemplateErrorStage;
  readonly expectedTemplateKind?: TemplateKind | null | undefined;
  readonly fieldPath?: string | null | undefined;
  readonly message: string;
}): TemplateCompatibilityError {
  return {
    code: input.code,
    operation: input.operation,
    stage: input.stage,
    expectedTemplateKind: input.expectedTemplateKind ?? null,
    fieldPath: input.fieldPath ?? null,
    message: boundedMessage(input.message)
  };
}

export function diagnostic(input: {
  readonly code: string;
  readonly severity: TemplateDiagnostic["severity"];
  readonly message: string;
  readonly fieldPath?: string | null;
}): TemplateDiagnostic {
  return {
    code: input.code,
    severity: input.severity,
    message: boundedMessage(input.message),
    fieldPath: input.fieldPath ?? null
  };
}

export function dependencyFailure<Value>(
  error: unknown,
  input: {
    readonly operation: TemplateOperation;
    readonly expectedTemplateKind: TemplateKind;
    readonly code?: TemplateErrorCode;
    readonly fieldPath?: string | null;
  }
): TemplateResult<Value> {
  return templateFailure(
    templateError({
      code: input.code ?? dependencyErrorCode(error),
      operation: input.operation,
      stage: "dependency",
      expectedTemplateKind: input.expectedTemplateKind,
      fieldPath: input.fieldPath ?? null,
      message: dependencyMessage(error)
    })
  );
}

export function dependencyMessage(error: unknown): string {
  if (error instanceof Error) {
    return boundedMessage(error.message || error.name);
  }

  return "Template dependency failed.";
}

function dependencyErrorCode(error: unknown): TemplateErrorCode {
  const message = error instanceof Error ? error.message.toLocaleLowerCase("en-US") : "";
  if (message.includes("base64") || message.includes("invalid")) {
    return "MALFORMED_TEMPLATE";
  }

  return "DEPENDENCY_FAILURE";
}

function boundedMessage(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return "Template operation failed.";
  }
  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}
