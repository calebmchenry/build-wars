import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { probePwndTemplateFeasibility } from "../../src/template-compatibility/gw-templates-adapter";
import pwndCases from "../fixtures/template-compatibility/pwnd-cases.json";

describe("paw-ned2 template disposition", () => {
  it("defers team codec support with evidence and no public API export", () => {
    const probe = probePwndTemplateFeasibility();
    const publicApi = readFileSync("src/template-compatibility/index.ts", "utf-8");

    expect(pwndCases.downstreamOwner).toBe("EPIC-17");
    expect(probe.ok ? probe.value.disposition : probe.error.code).toBe("PAWNED2_DEFERRED");
    expect(publicApi).not.toContain("Pwnd");
    expect(publicApi).not.toContain("pawned");
  });
});
