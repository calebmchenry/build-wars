import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { authoredDocumentId, catalogId } from "../domain";
import { guideBuilds } from "../domain/guide";
import {
  requireTitleRankTestCatalogs,
  titleRankTestSkillIds
} from "../../test/fixtures/app/title-rank-catalogs";
import { requireReadyCatalogs } from "./catalogs";
import { createGuideFixture } from "./guide-fixture";
import { createRuntimeGuide, guideAddress, reduceGuide } from "./guide-state";
import { selectGuideSkill } from "./guide-selectors";
import { selectSkillDisplay, selectGenericSkillDisplay } from "./editor-selectors";
import { hydrateEditorFromSnapshot, type PersistedBuildSnapshot } from "./persistence-schema";
import { GuideSkillMention } from "./components/guide/GuideSkillMention";
const catalogs = requireReadyCatalogs();
function variants() {
  const document = createGuideFixture();
  const original = guideBuilds(document)[0]!;
  return {
    ...document,
    nodes: [
      ...document.nodes,
      ...[3, 12].map((rank, index) => ({
        ...original,
        id: `variant-${index}`,
        snapshot: {
          ...original.snapshot,
          build: {
            ...original.snapshot.build,
            id: authoredDocumentId(`variant-${index}`),
            name: `Variant ${index}`,
            attributes: [{ attributeId: catalogId<"Attribute">(10), rank }]
          }
        }
      }))
    ]
  };
}
describe("addressed guide reference projections", () => {
  it("distinguishes unresolved raw-only slots from empty slots", () => {
    const snapshot = guideBuilds(createGuideFixture())[0]!.snapshot;
    const state = hydrateEditorFromSnapshot(snapshot);
    const raw = {
      namespace: "skill" as const,
      templateId: 99999,
      catalogId: null,
      outcomeKind: "unknown" as const,
      label: "Unresolved raw skill",
      reason: "Catalog missing"
    };
    expect(selectSkillDisplay(catalogs, state, null, "skill-bar", raw)).toMatchObject({
      kind: "unresolved",
      title: raw.label,
      subtitle: raw.reason,
      raw
    });
    expect(selectSkillDisplay(catalogs, state, null, "skill-bar").kind).toBe("empty");
  });
  it("keeps two bound values after selecting a third card and restores deleted context on undo", () => {
    let state = createRuntimeGuide(variants(), "references");
    state = reduceGuide(state, { type: "select", buildId: "variant-1" });
    const read = (id: string) =>
      selectGuideSkill(catalogs, state.history.frame.document, "catalog:skill:194", {
        kind: "local",
        buildId: id
      });
    const a = read("gb-flare");
    const b = read("variant-0");
    expect(a.view.kind === "known" && a.view.tooltipText).not.toEqual(
      b.view.kind === "known" && b.view.tooltipText
    );
    expect(a.label).toBe("Flare practice");
    state = reduceGuide(
      state,
      { ...guideAddress(state), type: "delete-build", buildId: "gb-flare", retainUnresolved: true },
      catalogs
    );
    expect(read("gb-flare").status).toBe("missing");
    state = reduceGuide(
      state,
      { ...guideAddress(state), type: "history", direction: "undo" },
      catalogs
    );
    expect(read("gb-flare")).toEqual(a);
  });
  it("never binds detached collisions or invents generic zero/title ranks", () => {
    const document = variants();
    const generic = selectGuideSkill(catalogs, document, "catalog:skill:194", { kind: "generic" });
    const detached = selectGuideSkill(catalogs, document, "catalog:skill:194", {
      kind: "detached",
      guideId: "other",
      buildId: "gb-flare",
      reason: "Copied"
    });
    expect(detached.status).toBe("detached");
    expect(generic.view.kind === "known" && generic.view.tooltipText).toContain("–");
    expect(detached.view.kind === "known" && detached.view.tooltipText).toEqual(
      generic.view.kind === "known" && generic.view.tooltipText
    );
    const title = selectGenericSkillDisplay(
      requireTitleRankTestCatalogs(),
      titleRankTestSkillIds.lightbringer
    );
    expect(title.kind).toBe("known");
    if (title.kind !== "known") throw Error("fixture");
    expect(title.tooltipText).toContain("–");
    expect(title.facts.some((fact) => fact.icon === "title")).toBe(false);
    expect(title.assumptions.join(" ")).toContain("No build, title rank");
  });
  it("uses the complete addressed mode, bonus, title and effect snapshot through the existing selector", () => {
    const document = variants();
    for (const build of guideBuilds(document)) {
      for (const mode of ["pve", "pvp"] as const) {
        const snapshot: PersistedBuildSnapshot = {
          ...build.snapshot,
          build: {
            ...build.snapshot.build,
            mode,
            titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }],
            attributeAdjustments: {
              headgearAttributeId: catalogId<"Attribute">(10),
              runes: [],
              effectPreferences: [
                { effectId: "heroic-refrain", preference: "on" as const, strength: 4 }
              ]
            }
          }
        };
        const next = { ...document, nodes: [{ ...build, snapshot }] };
        const result = selectGuideSkill(catalogs, next, "catalog:skill:194", {
          kind: "local",
          buildId: build.id
        });
        const expected = selectSkillDisplay(
          catalogs,
          hydrateEditorFromSnapshot(snapshot),
          catalogId<"Skill">(194),
          "tooltip"
        );
        expect(result.view.kind === "known" && result.view.tooltipText).toBe(
          expected.kind === "known" && expected.tooltipText
        );
        expect(result.view.kind === "known" && result.view.facts).toEqual(
          expected.kind === "known" && expected.facts
        );
      }
    }
    expect(
      selectGuideSkill(catalogs, document, "catalog:skill:999999", { kind: "generic" }).view.kind
    ).toBe("unresolved");
  });
  it("keeps inline wrappers valid and exposes tooltip on keyboard focus and touch", () => {
    const document = variants();
    const { container } = render(
      <p>
        Before{" "}
        <GuideSkillMention
          document={document}
          catalogs={catalogs}
          node={{
            type: "skill",
            skillId: "catalog:skill:194",
            context: { kind: "local", buildId: "gb-flare" }
          }}
        />{" "}
        after.
      </p>
    );
    expect(container.querySelector("p div")).toBeNull();
    const mention = screen.getByRole("button", { name: "Flare — Flare practice" });
    fireEvent.focus(mention);
    expect(screen.getByRole("tooltip").textContent).toContain("Context: Flare practice");
    fireEvent.keyDown(mention, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.pointerDown(mention, { pointerType: "touch" });
    expect(container.textContent).toBe("Before Flare (Flare practice) after.");
  });
  it("keeps a touch tooltip open and offers a separate context action", () => {
    const onEdit = vi.fn();
    render(
      <GuideSkillMention
        document={variants()}
        catalogs={catalogs}
        node={{ type: "skill", skillId: "catalog:skill:194", context: { kind: "generic" } }}
        onEdit={onEdit}
      />
    );
    const mention = screen.getByRole("button", { name: "Flare — Generic; edit reference" });
    const pointer = createEvent.pointerDown(mention);
    Object.defineProperty(pointer, "pointerType", { value: "touch" });
    fireEvent(mention, pointer);
    fireEvent.click(mention);
    fireEvent.mouseLeave(mention);
    fireEvent.blur(mention);
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByRole("tooltip").textContent).toContain("Generic catalog entry");
    fireEvent.mouseEnter(mention);
    fireEvent.focus(mention);
    expect(screen.getByRole("tooltip")).toHaveStyle({ visibility: "visible" });
    fireEvent.click(screen.getByRole("button", { name: "Change context for Flare — Generic" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});
