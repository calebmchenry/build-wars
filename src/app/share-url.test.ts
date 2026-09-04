import { describe, expect, it, vi } from "vitest";

import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import {
  SHARE_URL_MAX_LENGTH,
  buildShareUrl,
  consumeShareFragment,
  parseShareFragment
} from "./share-url";

describe("share URLs", () => {
  it("builds the documented versioned hash-fragment grammar with template-code-first data", () => {
    const result = buildShareUrl({
      baseUrl: "https://example.test/editor?panel=skills#old",
      bareCode: SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      mode: "pvp"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const url = new URL(result.value);
    expect(url.hash).toContain("bw=1");
    expect(url.hash).toContain(`code=${encodeURIComponent(SKILL_TEMPLATE_PACKAGE_EXAMPLE)}`);
    expect(url.hash).toContain("mode=pvp");
    expect(url.hash).not.toContain("tags");
    expect(url.hash).not.toContain("favorite");
    expect(url.hash).not.toContain("notes");
    expect(url.hash).not.toContain("local-");
  });

  it("defaults missing or legacy unknown share modes to PvE", () => {
    const parsed = parseShareFragment(
      `#bw=1&code=${encodeURIComponent(SKILL_TEMPLATE_PACKAGE_EXAMPLE)}`
    );
    const legacyUnknown = parseShareFragment(
      `#bw=1&code=${encodeURIComponent(SKILL_TEMPLATE_PACKAGE_EXAMPLE)}&mode=unknown`
    );

    expect(parsed.ok ? parsed.value : null).toEqual({
      bareCode: SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      mode: "pve"
    });
    expect(legacyUnknown.ok ? legacyUnknown.value : null).toEqual({
      bareCode: SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      mode: "pve"
    });
  });

  it("rejects duplicate, unknown, unsupported, invalid-mode, and malformed fragments", () => {
    expect(parseShareFragment("#bw=1&bw=1&code=abc").ok).toBe(false);
    expect(parseShareFragment("#bw=1&code=abc&tags=farm").ok).toBe(false);
    expect(parseShareFragment("#bw=2&code=abc").ok).toBe(false);
    expect(parseShareFragment("#bw=1&code=abc&mode=gvg").ok).toBe(false);
    expect(parseShareFragment("#bw=1&code=%E0%A4%A").ok).toBe(false);
  });

  it("returns null for non-share or empty fragments", () => {
    const empty = parseShareFragment("");
    expect(empty.ok ? empty.value : "error").toBeNull();
    expect(parseShareFragment("#section").ok).toBe(false);
  });

  it("enforces the conservative full URL length cap", () => {
    const result = buildShareUrl({
      baseUrl: "https://example.test/editor",
      bareCode: "A".repeat(SHARE_URL_MAX_LENGTH),
      mode: "pve"
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.error.code).toBe("oversized-url");
  });

  it("consumes valid fragments with history replacement and reports failure", () => {
    const replaceState = vi.fn();
    const consumed = consumeShareFragment({
      location: { pathname: "/editor", search: "?x=1" },
      history: { replaceState }
    });
    const failed = consumeShareFragment({
      location: { pathname: "/editor", search: "" },
      history: {
        replaceState: () => {
          throw new Error("denied");
        }
      }
    });

    expect(consumed.ok ? consumed.value : null).toBe("/editor?x=1");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/editor?x=1");
    expect(failed.ok).toBe(false);
    expect(failed.ok ? null : failed.error.code).toBe("history-failed");
  });
});
