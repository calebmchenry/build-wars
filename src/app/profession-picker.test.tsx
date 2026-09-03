import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { ProfessionId } from "../domain";
import { requireReadyCatalogs } from "./catalogs";
import { createRawOverlayEntry } from "./editor-state";
import { ProfessionIconPicker } from "./components/ProfessionIconPicker";

const catalogs = requireReadyCatalogs();

describe("ProfessionIconPicker", () => {
  it("renders Any plus ten professions and restores a concrete selection", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /Primary profession: Any/ }));
    const listbox = screen.getByRole("listbox", { name: "Primary profession options" });
    expect(listbox).toBeInTheDocument();
    expect(within(listbox).getAllByRole("option")).toHaveLength(11);
    fireEvent.click(within(listbox).getByRole("option", { name: /Warrior/ }));

    expect(screen.getByLabelText("Primary")).toHaveValue("1");
    expect(screen.getByRole("button", { name: /Primary profession: Warrior/ })).toHaveFocus();
    expect(document.querySelector(".catalog-icon img")?.getAttribute("src")).toContain(
      "profession-warrior-60"
    );
  });

  it("distinguishes unresolved imported evidence from intentional Any", () => {
    render(
      <ProfessionIconPicker
        label="Secondary"
        value={null}
        raw={createRawOverlayEntry({
          namespace: "profession",
          templateId: 99,
          catalogId: null,
          outcomeKind: "unsupported",
          label: "unsupported profession 99",
          reason: "Unsupported template profession."
        })}
        catalogs={catalogs}
        onChange={() => undefined}
      />
    );

    expect(
      screen.getByRole("button", {
        name: /Secondary profession: Unresolved unsupported profession 99/
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Unsupported template profession.")).toBeInTheDocument();
  });
});

function Harness() {
  const [value, setValue] = useState<ProfessionId | null>(null);
  return (
    <ProfessionIconPicker
      label="Primary"
      value={value}
      raw={null}
      catalogs={catalogs}
      onChange={(professionId) => setValue(professionId)}
    />
  );
}
