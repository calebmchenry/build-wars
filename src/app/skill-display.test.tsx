import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { catalogId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { SkillTooltip } from "./components/SkillTooltip";
import { playableEditorFixture } from "./editor-fixtures";
import { selectSkillDisplay } from "./editor-selectors";

const catalogs = requireReadyCatalogs();

describe("SkillDisplay and SkillTooltip", () => {
  it("renders structured skill facts and title-rank assumptions without remote images", () => {
    const view = selectSkillDisplay(
      catalogs,
      playableEditorFixture(),
      catalogId<"Skill">(1815),
      "tooltip"
    );
    render(<SkillTooltip view={view} onClose={() => undefined} />);

    expect(screen.getByText("Lightbringer Signet")).toBeInTheDocument();
    expect(screen.getByText(/maximum title rank 12/)).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });
});
