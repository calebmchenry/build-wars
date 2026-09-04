import type { GameMode } from "../domain";

export const SHARE_URL_VERSION = "1";
export const SHARE_URL_MAX_LENGTH = 1_800;
export type ShareUrlMode = Extract<GameMode, "pve" | "pvp">;

export type ShareUrlErrorCode =
  | "no-share-fragment"
  | "malformed-percent-encoding"
  | "duplicate-param"
  | "unknown-param"
  | "unsupported-version"
  | "missing-code"
  | "invalid-mode"
  | "oversized-url"
  | "url-failed"
  | "history-unavailable"
  | "history-failed";

export interface ShareUrlPayload {
  readonly bareCode: string;
  readonly mode: ShareUrlMode;
}

export type ShareUrlResult<Value> =
  | {
      readonly ok: true;
      readonly value: Value;
    }
  | {
      readonly ok: false;
      readonly error: ShareUrlError;
    };

export interface ShareUrlError {
  readonly code: ShareUrlErrorCode;
  readonly message: string;
}

export function buildShareUrl(input: {
  readonly baseUrl: string;
  readonly bareCode: string;
  readonly mode?: ShareUrlMode;
  readonly maxLength?: number;
}): ShareUrlResult<string> {
  const maxLength = input.maxLength ?? SHARE_URL_MAX_LENGTH;
  let url: URL;
  try {
    url = new URL(input.baseUrl);
  } catch {
    return failure("url-failed", "Browser URL API could not build a share URL.");
  }
  const params = new URLSearchParams();
  params.set("bw", SHARE_URL_VERSION);
  params.set("code", input.bareCode);
  if (input.mode === "pvp") {
    params.set("mode", input.mode);
  }
  url.hash = params.toString();
  const value = url.toString();
  if (value.length > maxLength) {
    return failure("oversized-url", `Share URL exceeds the ${maxLength} character limit.`);
  }
  return { ok: true, value };
}

export function parseShareFragment(hash: string): ShareUrlResult<ShareUrlPayload | null> {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  if (fragment.length === 0) {
    return { ok: true, value: null };
  }
  if (!fragment.includes("bw=")) {
    return failure("no-share-fragment", "URL fragment is not a Build Wars share payload.");
  }
  if (hasMalformedPercentEncoding(fragment)) {
    return failure("malformed-percent-encoding", "Share URL has malformed percent encoding.");
  }

  const params = new URLSearchParams(fragment);
  const allowed = new Set(["bw", "code", "mode"]);
  for (const key of params.keys()) {
    if (!allowed.has(key)) {
      return failure("unknown-param", `Share URL parameter ${key} is not supported.`);
    }
    if (params.getAll(key).length > 1) {
      return failure("duplicate-param", `Share URL parameter ${key} appears more than once.`);
    }
  }

  if (params.get("bw") !== SHARE_URL_VERSION) {
    return failure("unsupported-version", "Share URL version is not supported.");
  }
  const bareCode = params.get("code");
  if (bareCode === null || bareCode.trim().length === 0) {
    return failure("missing-code", "Share URL is missing a skill template code.");
  }
  const mode = params.get("mode") ?? "pve";
  if (mode !== "pve" && mode !== "pvp" && mode !== "unknown") {
    return failure("invalid-mode", "Share URL mode must be pve or pvp.");
  }
  return {
    ok: true,
    value: {
      bareCode,
      mode: mode === "pvp" ? "pvp" : "pve"
    }
  };
}

export function consumeShareFragment(input: {
  readonly location: Pick<Location, "pathname" | "search">;
  readonly history: Pick<History, "replaceState"> | null | undefined;
}): ShareUrlResult<string> {
  if (input.history === null || input.history === undefined) {
    return failure("history-unavailable", "Browser history API is unavailable.");
  }
  const replacement = `${input.location.pathname}${input.location.search}`;
  try {
    input.history.replaceState(null, "", replacement);
  } catch {
    return failure("history-failed", "Share URL fragment could not be consumed.");
  }
  return { ok: true, value: replacement };
}

function hasMalformedPercentEncoding(fragment: string): boolean {
  try {
    decodeURIComponent(fragment.replace(/\+/g, "%20"));
    return false;
  } catch {
    return true;
  }
}

function failure(code: ShareUrlErrorCode, message: string): ShareUrlResult<never> {
  return {
    ok: false,
    error: {
      code,
      message
    }
  };
}
