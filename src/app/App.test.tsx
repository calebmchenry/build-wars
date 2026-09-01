import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SKILL_BAR_SLOT_COUNT, type Build } from "../domain";
import { App } from "./App";

describe("App", () => {
  it("renders the accessible application shell and imports the domain boundary", () => {
    render(<App />);

    expect(screen.getByRole("main", { name: "Build Wars" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Build Wars" })).toBeDefined();
    expect(
      screen.getByRole("list", { name: `${SKILL_BAR_SLOT_COUNT} empty skill slots` })
    ).toBeDefined();
    expect(screen.getAllByRole("listitem")).toHaveLength(SKILL_BAR_SLOT_COUNT);

    const buildShape: Pick<Build, "schemaVersion" | "skillBar"> = {
      schemaVersion: 1,
      skillBar: [null, null, null, null, null, null, null, null]
    };

    expect(buildShape.skillBar).toHaveLength(SKILL_BAR_SLOT_COUNT);
  });
});
