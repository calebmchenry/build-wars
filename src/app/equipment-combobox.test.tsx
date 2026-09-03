import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { catalogId, knownEquipmentSelection, type RuneId } from "../domain";
import { EquipmentCombobox } from "./components/EquipmentCombobox";
import {
  EQUIPMENT_PICKER_RESULT_LIMIT,
  type EquipmentSelectOption,
  type EquipmentSelectedValueView
} from "./equipment-selectors";

afterEach(() => {
  vi.useRealTimers();
});

describe("EquipmentCombobox", () => {
  it("caps rendered results and selects the first enabled option with the keyboard", () => {
    const onSelect = vi.fn();
    const options = Array.from({ length: EQUIPMENT_PICKER_RESULT_LIMIT + 5 }, (_, index) =>
      option(index)
    );

    render(
      <EquipmentCombobox
        label="Rune"
        selected={emptySelected("No rune")}
        options={options}
        clearLabel="Clear rune"
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    const input = screen.getByRole("combobox", { name: "Rune" });
    fireEvent.focus(input);
    expect(screen.getAllByRole("option")).toHaveLength(EQUIPMENT_PICKER_RESULT_LIMIT);
    expect(
      screen.getByText(`Showing first ${EQUIPMENT_PICKER_RESULT_LIMIT} of ${options.length}`)
    ).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(options[1]?.selection);
  });

  it("supports no-result searches without selecting during IME composition", () => {
    const onSelect = vi.fn();

    render(
      <EquipmentCombobox
        label="Rune"
        selected={emptySelected("No rune")}
        options={[option(1)]}
        clearLabel="Clear rune"
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    const input = screen.getByRole("combobox", { name: "Rune" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "missing" } });
    expect(screen.getByText("No results")).toBeInTheDocument();

    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.compositionEnd(input);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("clears selected values and restores focus to the input", () => {
    vi.useFakeTimers();
    const onClear = vi.fn();

    render(
      <EquipmentCombobox
        label="Rune"
        selected={{ state: "known", label: "Rune 1", detail: null, catalogId: 1 }}
        options={[option(1)]}
        clearLabel="Clear rune"
        onSelect={vi.fn()}
        onClear={onClear}
      />
    );

    const input = screen.getByRole("combobox", { name: "Rune" });
    fireEvent.click(screen.getByRole("button", { name: "Clear rune" }));
    act(() => vi.runAllTimers());

    expect(onClear).toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
  });
});

function emptySelected(label: string): EquipmentSelectedValueView {
  return { state: "empty", label, detail: null, catalogId: null };
}

function option(index: number): EquipmentSelectOption<RuneId> {
  return {
    id: `known:${index}`,
    label: `Rune ${index}`,
    detail: index === 0 ? "disabled fixture" : null,
    disabled: index === 0,
    disabledReason: index === 0 ? "Unavailable" : null,
    retained: false,
    selection: knownEquipmentSelection(catalogId<"Rune">(index) as RuneId)
  };
}
