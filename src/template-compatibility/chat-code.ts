import type {
  TemplateDiagnostic,
  TemplateInputKind,
  TemplateKind,
  TemplateOperation,
  TemplateResult
} from "../domain";
import { diagnostic, templateError, templateFailure, templateSuccess } from "./result";

export const TEMPLATE_INPUT_CHAR_LIMIT = 4096;
export const TEMPLATE_BARE_CODE_CHAR_LIMIT = 2048;
export const TEMPLATE_NAME_CODE_POINT_LIMIT = 256;

const BASE64_TEMPLATE_RE = /^[A-Za-z0-9+/=]+$/;

export interface ParsedTemplateInput {
  readonly inputKind: TemplateInputKind;
  readonly originalInput: string;
  readonly trimmedInput: string;
  readonly bareCode: string;
  readonly templateName: string | null;
  readonly inferredKind: TemplateKind | "unknown";
}

export function parseTemplateInput(
  input: string,
  expectedKind?: TemplateKind,
  operation: TemplateOperation = "parse"
): TemplateResult<ParsedTemplateInput> {
  if (input.length > TEMPLATE_INPUT_CHAR_LIMIT) {
    return templateFailure(
      templateError({
        code: "INPUT_TOO_LARGE",
        operation,
        stage: "input",
        expectedTemplateKind: expectedKind,
        message: `Template input exceeds ${TEMPLATE_INPUT_CHAR_LIMIT} characters.`
      })
    );
  }

  const trimmedInput = trimOuterAsciiWhitespace(input);
  const diagnostics: TemplateDiagnostic[] =
    trimmedInput === input
      ? []
      : [
          diagnostic({
            code: "OUTER_ASCII_WHITESPACE_TRIMMED",
            severity: "info",
            message: "Outer ASCII whitespace was ignored before parsing."
          })
        ];

  if (trimmedInput.length === 0) {
    return templateFailure(
      templateError({
        code: "EMPTY_INPUT",
        operation,
        stage: "input",
        expectedTemplateKind: expectedKind,
        message: "Template input is empty."
      })
    );
  }

  const wrapperStarts = trimmedInput.startsWith("[");
  const wrapperEnds = trimmedInput.endsWith("]");
  if (wrapperStarts || wrapperEnds) {
    if (!wrapperStarts || !wrapperEnds) {
      return invalidWrapper(
        operation,
        expectedKind,
        "Chat-code wrappers must enclose the entire input."
      );
    }

    const parsed = parseWrappedTemplate(trimmedInput, input, expectedKind, operation);
    if (!parsed.ok) {
      return parsed;
    }
    return templateSuccess(parsed.value, [...diagnostics, ...parsed.diagnostics]);
  }

  const bare = validateBareCode(trimmedInput, expectedKind, operation);
  if (!bare.ok) {
    return bare;
  }

  return templateSuccess(
    {
      inputKind: "bare",
      originalInput: input,
      trimmedInput,
      bareCode: trimmedInput,
      templateName: null,
      inferredKind: bare.value
    },
    diagnostics
  );
}

export function formatTemplateChatCode(
  bareCode: string,
  templateName: string | null,
  expectedKind?: Exclude<TemplateKind, "paw-ned2">
): TemplateResult<string> {
  const bare = validateBareCode(bareCode, expectedKind, "encode");
  if (!bare.ok) {
    return bare;
  }

  if (templateName === null) {
    return templateSuccess(bareCode);
  }

  const name = validateTemplateName(templateName, "encode", expectedKind);
  if (!name.ok) {
    return name;
  }

  return templateSuccess(`[${templateName};${bareCode}]`);
}

export function inferTemplateKindFromBareCode(bareCode: string): TemplateKind | "unknown" {
  if (bareCode.startsWith("pwnd")) {
    return "paw-ned2";
  }
  if (bareCode.startsWith("O")) {
    return "skill";
  }
  if (bareCode.startsWith("P")) {
    return "equipment";
  }
  return "unknown";
}

export function validateTemplateName(
  templateName: string,
  operation: TemplateOperation,
  expectedKind?: TemplateKind
): TemplateResult<string> {
  if ([...templateName].length > TEMPLATE_NAME_CODE_POINT_LIMIT) {
    return templateFailure(
      templateError({
        code: "UNSAFE_TEMPLATE_NAME",
        operation,
        stage: "wrapper",
        expectedTemplateKind: expectedKind,
        fieldPath: "templateName",
        message: `Template names are limited to ${TEMPLATE_NAME_CODE_POINT_LIMIT} Unicode code points.`
      })
    );
  }

  if ([...templateName].some(isUnsafeNameCodePoint)) {
    return templateFailure(
      templateError({
        code: "UNSAFE_TEMPLATE_NAME",
        operation,
        stage: "wrapper",
        expectedTemplateKind: expectedKind,
        fieldPath: "templateName",
        message: "Template names cannot contain delimiters, brackets, or control characters."
      })
    );
  }

  return templateSuccess(templateName);
}

function parseWrappedTemplate(
  trimmedInput: string,
  originalInput: string,
  expectedKind: TemplateKind | undefined,
  operation: TemplateOperation
): TemplateResult<ParsedTemplateInput> {
  const inner = trimmedInput.slice(1, -1);
  if (inner.includes("[") || inner.includes("]")) {
    return invalidWrapper(operation, expectedKind, "Nested chat-code wrappers are not accepted.");
  }

  const delimiter = inner.indexOf(";");
  if (delimiter < 0 || delimiter !== inner.lastIndexOf(";")) {
    return invalidWrapper(
      operation,
      expectedKind,
      "Chat-code wrappers must contain exactly one delimiter."
    );
  }

  const templateName = inner.slice(0, delimiter);
  const bareCode = inner.slice(delimiter + 1);
  if (bareCode.length === 0) {
    return invalidWrapper(
      operation,
      expectedKind,
      "Chat-code wrappers must include a template code."
    );
  }

  const name = validateTemplateName(templateName, operation, expectedKind);
  if (!name.ok) {
    return name;
  }

  const bare = validateBareCode(bareCode, expectedKind, operation);
  if (!bare.ok) {
    return bare;
  }

  return templateSuccess({
    inputKind: "chat-code",
    originalInput,
    trimmedInput,
    bareCode,
    templateName,
    inferredKind: bare.value
  });
}

function validateBareCode(
  bareCode: string,
  expectedKind: TemplateKind | undefined,
  operation: TemplateOperation
): TemplateResult<TemplateKind | "unknown"> {
  if (bareCode.length > TEMPLATE_BARE_CODE_CHAR_LIMIT) {
    return templateFailure(
      templateError({
        code: "INPUT_TOO_LARGE",
        operation,
        stage: "input",
        expectedTemplateKind: expectedKind,
        fieldPath: "code",
        message: `Template code exceeds ${TEMPLATE_BARE_CODE_CHAR_LIMIT} characters.`
      })
    );
  }

  const inferredKind = inferTemplateKindFromBareCode(bareCode);
  if (inferredKind === "paw-ned2") {
    return validateInferredKind(inferredKind, expectedKind, operation);
  }

  if (!BASE64_TEMPLATE_RE.test(bareCode)) {
    return templateFailure(
      templateError({
        code: "INVALID_CHARACTER_SET",
        operation,
        stage: "input",
        expectedTemplateKind: expectedKind,
        fieldPath: "code",
        message: "Template code must use the RFC3548 base64 character set."
      })
    );
  }

  return validateInferredKind(inferredKind, expectedKind, operation);
}

function validateInferredKind(
  inferredKind: TemplateKind | "unknown",
  expectedKind: TemplateKind | undefined,
  operation: TemplateOperation
): TemplateResult<TemplateKind | "unknown"> {
  if (expectedKind === undefined || inferredKind === expectedKind) {
    return templateSuccess(inferredKind);
  }

  if (inferredKind === "unknown") {
    return templateFailure(
      templateError({
        code: "UNSUPPORTED_VERSION",
        operation,
        stage: "kind",
        expectedTemplateKind: expectedKind,
        fieldPath: "code",
        message: "Template header is not a supported Build Wars template version."
      })
    );
  }

  return templateFailure(
    templateError({
      code: "WRONG_TEMPLATE_KIND",
      operation,
      stage: "kind",
      expectedTemplateKind: expectedKind,
      fieldPath: "code",
      message: `Expected ${expectedKind} template code but received ${inferredKind}.`
    })
  );
}

function invalidWrapper(
  operation: TemplateOperation,
  expectedKind: TemplateKind | undefined,
  message: string
): TemplateResult<ParsedTemplateInput> {
  return templateFailure(
    templateError({
      code: "INVALID_CHAT_WRAPPER",
      operation,
      stage: "wrapper",
      expectedTemplateKind: expectedKind,
      message
    })
  );
}

function trimOuterAsciiWhitespace(value: string): string {
  let start = 0;
  let end = value.length;

  while (start < end && isOuterAsciiWhitespace(value.charCodeAt(start))) {
    start += 1;
  }
  while (end > start && isOuterAsciiWhitespace(value.charCodeAt(end - 1))) {
    end -= 1;
  }

  return value.slice(start, end);
}

function isOuterAsciiWhitespace(code: number): boolean {
  return code === 0x20 || (code >= 0x09 && code <= 0x0d);
}

function isUnsafeNameCodePoint(value: string): boolean {
  const code = value.codePointAt(0);
  return (
    code === undefined ||
    code <= 0x1f ||
    code === 0x7f ||
    value === ";" ||
    value === "[" ||
    value === "]"
  );
}
