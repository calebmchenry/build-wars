import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders attribution before the catalog-driven editor workspace", () => {
    render(<App />);

    expect(screen.getByRole("main", { name: "Build Wars" })).toHaveAttribute(
      "data-catalog-state",
      "ready"
    );
    expect(screen.getByRole("heading", { name: "Catalog attribution" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skill Bar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skill Browser" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Validation" })).toBeInTheDocument();

    const attribution = screen.getByRole("heading", { name: "Catalog attribution" });
    const skillBar = screen.getByRole("heading", { name: "Skill Bar" });
    expect(
      attribution.compareDocumentPosition(skillBar) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("supports blank-to-playable authoring through visible controls", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Primary"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Secondary"), { target: { value: "2" } });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Healing Signet" } });
    fireEvent.click(screen.getByRole("button", { name: "Place Healing Signet in slot 1" }));

    expect(
      screen.getByRole("button", { name: /Skill slot 1: Healing Signet/ })
    ).toBeInTheDocument();
    expect(screen.getByText("Healing Signet placed in slot 1.")).toBeInTheDocument();
  });

  it("opens the export dialog and shows canonical gate output or reasons", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    const dialog = screen.getByRole("dialog", { name: "Export skill template" });
    expect(within(dialog).getByRole("heading", { name: "Canonical" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Wrapper name")).toBeInTheDocument();
  });
});
