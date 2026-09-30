import { describe, it, expect } from "vitest";
import { guideBuilds } from "../domain/guide";
import { catalogId } from "../domain";
import { emptyGuide, serializeGuideMarkdown } from "../guide/markdown";
import { createGuideFixture } from "./guide-fixture";
import {
  createRuntimeGuide,
  reduceGuide,
  guideAddress,
  captureGuideBuild,
  isCurrentGuideBuild,
  type RuntimeGuideDocument,
  type GuideCommand
} from "./guide-state";
import { readGuideFragment, writeGuideFragment } from "./guide-clipboard";
import {
  createInitialWorkspaceState,
  workspaceReducer,
  materializeActiveDocument,
  createWorkspaceEnvelope,
  needsDirtyGuard
} from "./workspace-state";
import {
  createPersistedBuildSnapshot,
  localBuildRecordId,
  serializeLocalLibraryEnvelope
} from "./persistence-schema";
import { createBlankEditorState } from "./editor-state";
import { writeLocalLibrary } from "./local-storage";
import {
  validLocalLibraryEnvelopeFixture,
  validWorkingDraftFixture,
  fixtureCatalogFacts
} from "./library-fixtures";
const start = () => createRuntimeGuide(createGuideFixture(), "session");
type WithoutAddress<T> = T extends unknown ? Omit<T, "session" | "revision"> : never;
function act(
  state: RuntimeGuideDocument,
  command: WithoutAddress<Extract<GuideCommand, { session: string }>>
): RuntimeGuideDocument {
  return reduceGuide(state, { ...guideAddress(state), ...command } as GuideCommand);
}
describe("guide transactions, recovery and single workspace", () => {
  it("restores chronological prose/build/attribute/delete history with complete snapshots and identity", () => {
    const initial = start();
    const frames = [initial];
    const apply = (command: Parameters<typeof act>[1]) => {
      const next = act(frames.at(-1)!, command);
      expect(next.history).not.toBe(frames.at(-1)!.history);
      frames.push(next);
    };
    apply({
      type: "edit",
      document: {
        ...initial.history.frame.document,
        nodes: [
          ...initial.history.frame.document.nodes,
          { type: "paragraph", children: [{ type: "text", value: "Prose revision" }] }
        ]
      }
    });
    apply({
      type: "build",
      buildId: "gb-flare",
      action: { type: "place-skill", skillId: catalogId<"Skill">(195), slotIndex: 1 }
    });
    apply({
      type: "build",
      buildId: "gb-flare",
      action: { type: "set-attribute-rank", attributeId: catalogId<"Attribute">(10), rank: 9 }
    });
    apply({ type: "delete-build", buildId: "gb-flare", retainUnresolved: true });
    let current = frames.at(-1)!;
    for (let i = frames.length - 2; i >= 0; i--) {
      current = act(current, { type: "history", direction: "undo" });
      expect(current.history.frame).toEqual(frames[i]!.history.frame);
    }
    for (let i = 1; i < frames.length; i++) {
      current = act(current, { type: "history", direction: "redo" });
      expect(current.history.frame).toEqual(frames[i]!.history.frame);
    }
  });
  it("does not record no-op edits or lose redo on UI actions", () => {
    let state = act(start(), {
      type: "metadata",
      metadata: { ...start().history.frame.document.metadata, title: "Changed" }
    });
    state = act(state, { type: "history", direction: "undo" });
    const prior = state.history;
    state = act(state, {
      type: "build",
      buildId: "gb-flare",
      action: { type: "set-mode", mode: "pve" }
    });
    expect(state.history).toBe(prior);
    expect(state.history.future).toHaveLength(1);
    state = reduceGuide(state, { type: "intent", intent: { kind: "none" } });
    expect(state.history).toBe(prior);
  });
  it("isolates variants, keeps UI outside history, and rejects stale global commands", () => {
    let state = act(start(), { type: "duplicate-build", buildId: "gb-flare", id: "gb-other" });
    const prior = guideBuilds(state.history.frame.document)[0];
    const capture = captureGuideBuild(state, "gb-flare")!;
    const selected = reduceGuide(state, { type: "select", buildId: "gb-other" });
    expect(selected.history).toBe(state.history);
    expect(isCurrentGuideBuild(selected, capture)).toBe(true);
    state = act(selected, {
      type: "build",
      buildId: "gb-other",
      action: { type: "set-mode", mode: "pvp" }
    });
    expect(guideBuilds(state.history.frame.document)[0]).toEqual(prior);
    expect(isCurrentGuideBuild(state, capture)).toBe(true);
    const stale = reduceGuide(state, {
      type: "delete-build",
      buildId: "gb-flare",
      retainUnresolved: true,
      session: "different",
      revision: state.history.revision
    });
    expect(stale.history).toBe(state.history);
    state = act(state, { type: "history", direction: "undo" });
    expect(isCurrentGuideBuild(state, capture)).toBe(false);
  });
  it("validates clipboard content regardless of session and never aliases colliding external references", () => {
    const source = start();
    const raw = writeGuideFragment(source, source.history.frame.document.nodes);
    const destination = createRuntimeGuide(emptyGuide("guide-practice"), "other-session");
    const nodes = readGuideFragment(raw, destination, () => "gb-copy");
    expect(nodes.some((n) => n.type === "build" && n.id === "gb-copy")).toBe(true);
    const external = writeGuideFragment(
      source,
      source.history.frame.document.nodes.filter((n) => n.type !== "build")
    );
    expect(JSON.stringify(readGuideFragment(external, destination, () => "unused"))).toContain(
      '"kind":"detached"'
    );
    expect(() => readGuideFragment(raw, source, () => "gb-flare")).toThrow(/collided/);
    expect(() =>
      readGuideFragment(raw.replace('"version":1', '"version":99'), source, () => "gb-new")
    ).toThrow();
  });
  it("detaches a copied external reference after Markdown import even when session and build IDs collide", () => {
    const source = start();
    const raw = writeGuideFragment(
      source,
      source.history.frame.document.nodes.filter((n) => n.type !== "build")
    );
    expect(JSON.stringify(readGuideFragment(raw, source, () => "unused"))).not.toContain(
      '"kind":"detached"'
    );
    for (const changeIdentity of [false, true]) {
      const document = source.history.frame.document;
      const replacement = {
        ...document,
        metadata: {
          ...document.metadata,
          id: changeIdentity ? "other-guide" : document.metadata.id,
          title: "Replaced"
        }
      };
      const destination = act(source, {
        type: "import-markdown",
        raw: serializeGuideMarkdown(replacement)
      });
      expect(destination.generation).toBeGreaterThan(source.generation);
      expect(JSON.stringify(readGuideFragment(raw, destination, () => "unused"))).toContain(
        '"kind":"detached"'
      );
    }
    const old = JSON.parse(raw) as Record<string, unknown>;
    delete old.generation;
    expect(
      JSON.stringify(readGuideFragment(JSON.stringify(old), source, () => "unused"))
    ).toContain('"kind":"detached"');
  });
  it("uses v3 guide durability after explicit replacement and rejects unaddressed editor actions", () => {
    const envelope = validLocalLibraryEnvelopeFixture({ workingDraft: validWorkingDraftFixture() });
    let workspace = createInitialWorkspaceState({
      envelope,
      readStatus: "loaded",
      writeBlocked: false,
      diagnostics: []
    });
    workspace = workspaceReducer(workspace, {
      type: "replace-guide",
      document: createGuideFixture(),
      session: "workspace-guide",
      decision: "discard"
    });
    expect(workspace.document.kind).toBe("guide");
    if (workspace.document.kind !== "guide") throw new Error("fixture");
    expect(
      workspaceReducer(workspace, {
        type: "editor",
        action: { type: "set-build-name", name: "Wrong" }
      })
    ).toBe(workspace);
    workspace = workspaceReducer(workspace, {
      type: "guide",
      command: {
        ...guideAddress(workspace.document),
        type: "metadata",
        metadata: { ...workspace.document.history.frame.document.metadata, title: "Updated guide" }
      }
    });
    expect(needsDirtyGuard(workspace)).toBe(true);
    expect(materializeActiveDocument(workspace).kind).toBe("guide");
    expect(
      createWorkspaceEnvelope(workspace, null, "2026-09-27T00:00:00Z").workingDraft?.document
    ).toEqual(materializeActiveDocument(workspace));
    const blocked = workspaceReducer(workspace, { type: "new-draft", decision: "cancel" });
    expect(blocked).toBe(workspace);
    const named = workspaceReducer(workspace, {
      type: "save-as-new",
      name: "Memory guide",
      id: localBuildRecordId("g"),
      now: "2026-09-27T00:00:00Z",
      savedWith: fixtureCatalogFacts
    });
    expect(named.library.records.at(-1)?.document.kind).toBe("guide");
    expect(named.library.records.at(-1)?.name).toBe("Memory guide");
    let stored = serializeLocalLibraryEnvelope(envelope);
    const previous = stored;
    const result = writeLocalLibrary(
      {
        getItem: () => stored,
        setItem: (_, value) => {
          stored = value;
        }
      },
      {
        ...envelope,
        workingDraft: {
          document: materializeActiveDocument(workspace),
          associatedRecordId: null,
          savedWith: fixtureCatalogFacts
        }
      },
      { now: "2026-09-27T00:00:00Z", reason: "guard test", expectedRevision: envelope.revision }
    );
    expect(result.ok).toBe(true);
    expect(stored).not.toBe(previous);
    expect(JSON.parse(stored).schemaVersion).toBe(3);
    expect(createPersistedBuildSnapshot(createBlankEditorState()).build.name).toBeTruthy();
  });
});
