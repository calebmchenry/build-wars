import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { catalogId } from "../domain";
import {
  requireTitleRankTestCatalogs,
  titleRankTestSkillIds
} from "../../test/fixtures/app/title-rank-catalogs";
import { requireReadyCatalogs } from "./catalogs";
import { SkillDisplay } from "./components/SkillDisplay";
import { SkillTooltip, SkillTooltipTrigger } from "./components/SkillTooltip";
import { playableEditorFixture } from "./editor-fixtures";
import { selectSkillDisplay } from "./editor-selectors";

const catalogs = requireReadyCatalogs();
const titleRankCatalogs = requireTitleRankTestCatalogs();

describe("SkillDisplay and SkillTooltip", () => {
  it("renders structured skill facts and title-rank status without remote images", () => {
    const view = selectSkillDisplay(
      titleRankCatalogs,
      playableEditorFixture(),
      titleRankTestSkillIds.lightbringer,
      "tooltip"
    );
    render(<SkillTooltip view={view} onClose={() => undefined} />);

    expect(screen.getByText("Lightbringer Signet")).toBeInTheDocument();
    expect(screen.getByLabelText("Skill type: Signet")).toBeInTheDocument();
    expect(screen.getByText("Title: Lightbringer")).toBeInTheDocument();
    expect(screen.getByText("rank 12 default")).toBeInTheDocument();
    expect(screen.queryByText(/maximum title rank/)).toBeNull();
    const images = localImageSources();
    expect(images.every((src) => !src.includes("http"))).toBe(true);
  });

  it("renders compact action and resource icons with accessible fact labels", () => {
    const view = selectSkillDisplay(
      catalogs,
      playableEditorFixture(),
      catalogId<"Skill">(88),
      "skill-browser"
    );
    render(<SkillDisplay view={view} compact />);

    expect(screen.getByLabelText("Skill type: Enchantment Spell")).toBeInTheDocument();
    expect(screen.getByLabelText("Cost: Energy 15")).toBeInTheDocument();
    expect(screen.getByLabelText("Cost: Sacrifice 33%")).toBeInTheDocument();
    expect(screen.getByLabelText("Timing: Activation 3/4")).toBeInTheDocument();
    expect(screen.getByLabelText("Timing: Recharge 30")).toBeInTheDocument();
    expect(screen.queryByText("{{3/4}}")).toBeNull();
    expect(screen.getByRole("link", { name: "Verata's Aura" })).toHaveAttribute(
      "href",
      "https://wiki.guildwars.com/wiki/Verata's_Aura"
    );
    expect(screen.getByRole("link", { name: "Verata's Aura" })).toHaveAttribute("target", "_blank");
    const images = localImageSources();
    expect(images).toHaveLength(5);
    expect(images.some((src) => src.includes("verata-s-aura"))).toBe(true);
    expect(document.querySelector("source, picture, canvas")).toBeNull();
  });

  it("opens a Guild Wars style tooltip on hover and focus", () => {
    const view = selectSkillDisplay(
      catalogs,
      playableEditorFixture(),
      catalogId<"Skill">(1),
      "skill-browser"
    );
    render(
      <SkillTooltipTrigger view={view} placement="left">
        <button type="button">Hover Healing Signet</button>
      </SkillTooltipTrigger>
    );

    const button = screen.getByRole("button", { name: "Hover Healing Signet" });
    const trigger = button.parentElement!;
    fireEvent.mouseEnter(trigger);

    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveClass("from-skill-menu");
    expect(tooltip).toHaveTextContent("Healing Signet");
    expect(tooltip).toHaveTextContent("Signet.");
    expect(tooltip).toHaveTextContent("You gain 82 Health.");
    expect(tooltip).toHaveTextContent("(Attrib: Tactics)");
    expect(tooltip).not.toHaveTextContent("Concise description pending catalog review.");

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();

    fireEvent.focus(button);
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent("Healing Signet");
  });

  it("rounds interpolated progression values in visible tooltip text", () => {
    const wordOfHealing = catalogs.skills.find((skill) => skill.name === "Word of Healing");
    if (wordOfHealing === undefined || wordOfHealing.attributeId === null) {
      throw new Error("Missing Word of Healing fixture data");
    }
    const state = playableEditorFixture();
    const view = selectSkillDisplay(
      catalogs,
      {
        ...state,
        build: {
          ...state.build,
          attributes: [{ attributeId: wordOfHealing.attributeId, rank: 1 }]
        }
      },
      wordOfHealing.id,
      "skill-browser"
    );
    render(
      <SkillTooltipTrigger view={view} placement="left">
        <button type="button">Hover Word of Healing</button>
      </SkillTooltipTrigger>
    );

    const button = screen.getByRole("button", { name: "Hover Word of Healing" });
    fireEvent.mouseEnter(button.parentElement!);

    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveTextContent("Heals for 11.");
    expect(tooltip).toHaveTextContent("Heals for 36 more");
    expect(tooltip).not.toHaveTextContent("11.333");
    expect(tooltip).not.toHaveTextContent("35.667");
  });
});

function localImageSources(): readonly string[] {
  return [...document.querySelectorAll("img")].map((image) => {
    const src = image.getAttribute("src") ?? "";
    expect(src).not.toMatch(/^https?:\/\//);
    return src;
  });
}
