import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { requireReadyCatalogs } from "./catalogs";
import { CatalogIcon } from "./components/CatalogIcon";

const catalogs = requireReadyCatalogs();

describe("CatalogIcon", () => {
  it("renders a local placeholder descriptor without image primitives", () => {
    render(
      <CatalogIcon
        descriptor={catalogs.placeholders.skill(catalogs.skills[0] ?? null, "skill-browser")}
      />
    );

    expect(screen.getByLabelText(/icon placeholder/)).toBeInTheDocument();
    expect(document.querySelector("img, source, picture, canvas")).toBeNull();
  });
});
