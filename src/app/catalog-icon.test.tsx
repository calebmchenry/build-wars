import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { requireReadyCatalogs } from "./catalogs";
import { CatalogIcon } from "./components/CatalogIcon";

const catalogs = requireReadyCatalogs();

describe("CatalogIcon", () => {
  it("renders an unmapped skill descriptor as a placeholder without image primitives", () => {
    render(
      <CatalogIcon
        descriptor={{
          asset: null,
          initials: "PB",
          label: "Power Block icon placeholder",
          mediaId: null,
          surface: "skill-browser"
        }}
      />
    );

    expect(screen.getByLabelText(/icon placeholder/)).toBeInTheDocument();
    expect(document.querySelector("img, source, picture, canvas")).toBeNull();
  });

  it("renders an approved local skill icon image", () => {
    const divineBoon = catalogs.skills.find((skill) => skill.name === "Divine Boon");

    render(
      <CatalogIcon descriptor={catalogs.placeholders.skill(divineBoon ?? null, "skill-browser")} />
    );

    expect(screen.getByLabelText("Divine Boon icon")).toBeInTheDocument();
    const image = document.querySelector("img");
    expect(image).not.toBeNull();
    expect(image?.getAttribute("src")).toContain("divine-boon");
    expect(image?.getAttribute("src")).not.toMatch(/^https?:\/\//);
  });

  it("renders approved local profession icon images", () => {
    render(<CatalogIcon descriptor={catalogs.placeholders.profession(catalogs.professions[0]!)} />);

    expect(screen.getByLabelText("Warrior icon")).toBeInTheDocument();
    const image = document.querySelector("img");
    expect(image).not.toBeNull();
    expect(image?.getAttribute("src")).toContain("profession-warrior-60");
    expect(image?.getAttribute("src")).not.toMatch(/^https?:\/\//);
  });
});
