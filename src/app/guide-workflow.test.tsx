import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogId } from "../domain";
import { guideBuilds } from "../domain/guide";
import { serializeGuideMarkdown } from "../guide/markdown";
import { App } from "./App";
import { requireReadyCatalogs } from "./catalogs";
import { loadDaggerExample } from "./examples/dagger-guide";
import exampleSource from "./examples/dagger-guide.md?raw";
import { guideBuildAdapter } from "./guide-build-adapter";
import { GuideReader } from "./components/guide/GuideReader";
import { captureGuideSkill, planGuidePlacement } from "./guide-placement";
import { selectGuideSkill } from "./guide-selectors";
import { guideAddress, type GuideCommand } from "./guide-state";
import { readGuideMarkdownFile, captureGuideDocument, validateGuideIntake } from "./guide-files";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  createWorkspaceEnvelope,
  materializeActiveDocument
} from "./workspace-state";
import { needsDirtyGuard } from "./workspace-state";
import {
  localBuildRecordId,
  parseLocalLibraryJson,
  serializeLocalLibraryEnvelope,
  LOCAL_LIBRARY_STORAGE_KEY
} from "./persistence-schema";
import { fixtureCatalogFacts, validLocalLibraryEnvelopeFixture } from "./library-fixtures";
import { createGuideFixture } from "./guide-fixture";
const catalogs = requireReadyCatalogs();
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
describe("original guide workflow", () => {
  it("guards an autosaved applied guide after reload even when storage itself is clean", () => {
    const document = loadDaggerExample();
    const envelope = validLocalLibraryEnvelopeFixture({
      savedDocuments: [],
      workingDraft: {
        document: {
          kind: "guide",
          snapshot: { schemaVersion: 1, document, recovery: null, appliedRevision: 0 }
        },
        associatedRecordId: null,
        savedWith: fixtureCatalogFacts
      }
    });
    const restored = createInitialWorkspaceState({ envelope });
    expect(restored.draftSession.dirtyState).toBe("clean");
    expect(needsDirtyGuard(restored)).toBe(true);
    expect(
      workspaceReducer(restored, {
        type: "replace-guide",
        document: createGuideFixture(),
        session: "new",
        decision: "cancel"
      })
    ).toBe(restored);
  });
  it("uses real complete catalog snapshots with distinct contextual values, explicit provenance and no remote content", () => {
    const document = loadDaggerExample();
    const builds = guideBuilds(document);
    expect(builds).toHaveLength(2);
    expect(document.metadata.summary).toContain("not current meta advice");
    expect(document.metadata.sources.length).toBeGreaterThan(0);
    expect(exampleSource).not.toMatch(/!\[|<img|<iframe|<script|gwpvx\.fandom|rating\s*:/i);
    for (const node of builds) {
      expect(node.snapshot.build.skillBar[7]).toBeNull();
      for (const id of node.snapshot.build.skillBar.filter((id) => id !== null))
        expect(catalogs.skills.some((skill) => skill.id === id)).toBe(true);
      const imported = guideBuildAdapter(catalogs).expandTemplate(
        node.snapshot.rawTemplate.source!.originalBareCode!,
        node.id,
        "pve"
      );
      expect(imported.build.skillBar).toEqual(node.snapshot.build.skillBar);
      expect(imported.build.attributes).toEqual(node.snapshot.build.attributes);
      expect(node.snapshot.build.titleRankOverrides).not.toEqual([]);
      expect(node.snapshot.build.attributeAdjustments?.effectPreferences).not.toEqual([]);
    }
    const values = builds.map((node) =>
      selectGuideSkill(catalogs, document, "catalog:skill:775", { kind: "local", buildId: node.id })
    );
    expect(values[0]!.view.kind === "known" && values[0]!.view.tooltipText).not.toEqual(
      values[1]!.view.kind === "known" && values[1]!.view.tooltipText
    );
    const { container } = render(
      <GuideReader document={document} catalogs={catalogs} onCopy={() => {}} />
    );
    for (const media of container.querySelectorAll("img"))
      expect(media.getAttribute("src")).not.toMatch(/^https?:/);
    expect(container.querySelector("iframe,video,script")).toBeNull();
  });
  it("preserves independent variants and contexts through write, placement, bonus edit, Undo, Source, named save, reload, Read and byte reimport", async () => {
    let workspace = workspaceReducer(createInitialWorkspaceState(), {
      type: "replace-guide",
      document: loadDaggerExample(),
      session: "workflow",
      decision: "discard"
    });
    const guide = () => {
      if (workspace.document.kind !== "guide") throw Error("fixture");
      return workspace.document;
    };
    type Unaddressed<T> = T extends unknown ? Omit<T, "session" | "revision"> : never;
    const send = (command: Unaddressed<GuideCommand>) => {
      workspace = workspaceReducer(workspace, {
        type: "guide",
        command: { ...guideAddress(guide()), ...command } as GuideCommand,
        catalogs
      });
    };
    const first = guideBuilds(guide().history.frame.document)[0]!;
    const second = guideBuilds(guide().history.frame.document)[1]!;
    const mention = planGuidePlacement(
      guide(),
      captureGuideSkill(guide(), { kind: "bar", buildId: first.id, index: 2 }),
      catalogs,
      { kind: "prose" }
    );
    if (mention.kind !== "mention") throw Error("fixture");
    send({
      type: "edit",
      document: {
        ...guide().history.frame.document,
        nodes: [
          ...guide().history.frame.document.nodes,
          {
            type: "paragraph",
            children: [{ type: "text", value: "My local timing note: " }, mention.node]
          }
        ]
      }
    });
    const drop = planGuidePlacement(
      guide(),
      captureGuideSkill(guide(), { kind: "catalog", skillId: catalogId<"Skill">(1043) }),
      catalogs,
      { kind: "slot", buildId: second.id, index: 7 }
    );
    if (drop.kind !== "slot") throw Error("fixture");
    send({ type: "build", buildId: drop.buildId, action: drop.action });
    const beforeBonus = guide().history.frame.document;
    send({
      type: "build",
      buildId: first.id,
      action: {
        type: "set-assumed-effect",
        value: { effectId: "heroic-refrain", preference: "on", strength: 4 }
      }
    });
    expect(guideBuilds(guide().history.frame.document)[1]).toEqual(guideBuilds(beforeBonus)[1]);
    expect(guideBuilds(guide().history.frame.document)[0]).not.toEqual(guideBuilds(beforeBonus)[0]);
    send({ type: "history", direction: "undo" });
    expect(guide().history.frame.document).toEqual(beforeBonus);
    send({ type: "source-open" });
    send({
      type: "source-edit",
      raw:
        guide().history.frame.recovery!.raw +
        "\n## Local observations\n\nKeep this original note.\n"
    });
    send({ type: "source-apply" });
    expect(guide().history.frame.recovery).toBeNull();
    workspace = workspaceReducer(workspace, {
      type: "save-as-new",
      name: "My dagger workshop",
      id: localBuildRecordId("workshop-saved"),
      now: "2026-09-27T05:00:00Z",
      savedWith: fixtureCatalogFacts
    });
    const expected = materializeActiveDocument(workspace);
    const storageBytes = serializeLocalLibraryEnvelope(
      createWorkspaceEnvelope(workspace, fixtureCatalogFacts, "2026-09-27T05:00:00Z")
    );
    const parsed = parseLocalLibraryJson(storageBytes);
    if (!parsed.ok) throw Error("fixture");
    workspace = createInitialWorkspaceState({ envelope: parsed.envelope });
    expect(materializeActiveDocument(workspace)).toEqual(expected);
    const beforeRead = workspacePersistence(workspace);
    send({ type: "view", view: "read" });
    const { container } = render(
      <GuideReader
        document={guide().history.frame.document}
        catalogs={catalogs}
        onCopy={() => {}}
      />
    );
    expect(container.textContent).toContain("My local timing note");
    expect(container.textContent).toContain("Local observations");
    expect(workspacePersistence(workspace)).toBe(beforeRead);
    const raw = serializeGuideMarkdown(guide().history.frame.document);
    const bytes = new TextEncoder().encode(raw);
    const read = await readGuideMarkdownFile(
      { size: bytes.byteLength, arrayBuffer: async () => bytes.buffer },
      guide,
      captureGuideDocument(guide()),
      null
    );
    const reimported = validateGuideIntake(read, null, "new");
    expect(reimported).toEqual(guide().history.frame.document);
    expect(guideBuilds(reimported)[0]!.snapshot.build.skillBar[7]).toBeNull();
    expect(guideBuilds(reimported)[1]!.snapshot.build.skillBar[7]).toBe(1043);
    expect(
      selectGuideSkill(catalogs, reimported, "catalog:skill:775", {
        kind: "local",
        buildId: first.id
      })
    ).toEqual(
      selectGuideSkill(catalogs, beforeBonus, "catalog:skill:775", {
        kind: "local",
        buildId: first.id
      })
    );
  });
  it("loads only on explicit action and honors cancellation before replacing hydrated source", async () => {
    const document = createGuideFixture();
    const envelope = validLocalLibraryEnvelopeFixture({
      savedDocuments: [],
      workingDraft: {
        document: {
          kind: "guide",
          snapshot: {
            schemaVersion: 1,
            document,
            recovery: { raw: "# My unfinished draft", baseRevision: 0, dirty: true },
            appliedRevision: 0
          }
        },
        associatedRecordId: null,
        savedWith: fixtureCatalogFacts
      }
    });
    localStorage.setItem(LOCAL_LIBRARY_STORAGE_KEY, serializeLocalLibraryEnvelope(envelope));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);
    const source = await screen.findByRole("textbox", { name: "Markdown source" });
    expect(source).toHaveValue("# My unfinished draft");
    expect(
      screen.queryByRole("heading", { name: "Dagger workshop: two independent variants" })
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open example guide" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(source).toHaveValue("# My unfinished draft");
    act(() => window.dispatchEvent(new Event("pagehide")));
    const original = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY)!);
    expect(original.ok && original.envelope.workingDraft?.document).toEqual(
      envelope.workingDraft?.document
    );
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Open example guide" }));
    expect(
      await screen.findByRole("heading", { name: "Dagger workshop: two independent variants" })
    ).toBeTruthy();
  });
});
function workspacePersistence(workspace: Parameters<typeof materializeActiveDocument>[0]) {
  return JSON.stringify(materializeActiveDocument(workspace));
}
