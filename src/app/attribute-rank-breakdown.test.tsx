import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { projectAttributePreview } from "../domain";
import {
  elementalBuild,
  adjustmentPreviewInput,
  fireId
} from "../../test/fixtures/attribute-adjustment-builds";
import { AttributeRankBreakdown } from "./components/AttributeRankBreakdown";
const rank = projectAttributePreview(adjustmentPreviewInput(elementalBuild())).ranks.get(fireId)!;
describe("rank contribution disclosure", () => {
  it("opens on focus or tap, closes with Escape and restores focus without reopening", async () => {
    render(<AttributeRankBreakdown rank={rank} label="Fire Magic" fallback={12} />);
    const trigger = screen.getByRole("button", { name: /Show rank breakdown/ });
    act(() => trigger.focus());
    expect(screen.getByRole("dialog", { name: "Fire Magic rank breakdown" })).toHaveTextContent(
      "Uncapped total: 16"
    );
    expect(trigger).toHaveAttribute("data-increased", "true");
    const close = screen.getByRole("button", { name: "Close rank breakdown" });
    act(() => close.focus());
    fireEvent.keyDown(close, { key: "Escape" });
    await act(async () => await Promise.resolve());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    fireEvent.pointerDown(trigger, { pointerType: "touch" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toHaveTextContent("Base allocation: 12");
  });
  it("opens on hover and explains unresolved and cap facts without implying a blue rank", () => {
    const { rerender } = render(
      <AttributeRankBreakdown
        rank={{ ...rank, uncapped: 23, effective: 20, clipped: 3 }}
        label="Fire Magic"
        fallback={12}
      />
    );
    fireEvent.mouseEnter(screen.getByRole("button", { name: /Show rank breakdown/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("3 ranks clipped by the cap");
    rerender(
      <AttributeRankBreakdown
        rank={{ ...rank, effective: null, uncapped: null }}
        label="Fire Magic"
        fallback={12}
      />
    );
    expect(screen.getByRole("button", { name: /effective rank unresolved/ })).toHaveAttribute(
      "data-increased",
      "false"
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "displayed fallback is the base allocation"
    );
  });
});
