import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import samples from "../../test/fixtures/skill-template-files.json";
import { templateDirectory, templateFile, templateHandle } from "../test/template-files";
import { guideBuilds } from "../domain/guide";
import { serializeGuideMarkdown } from "../guide/markdown";
import { requireReadyCatalogs } from "./catalogs";
import { guideBuildAdapter } from "./guide-build-adapter";
import { createGuideFixture } from "./guide-fixture";
import { createGuideTemplateOperation, copyGuideTemplate } from "./guide-template";
import { createRuntimeGuide, guideAddress, reduceGuide, type GuideCommand } from "./guide-state";
import { TemplateBrowserDialog } from "./components/TemplateBrowserDialog";
import type { GuideDispatch } from "./components/guide/GuideWorkspace";
const catalogs = requireReadyCatalogs();
const monkCode = samples["Protection Monk.txt"];
const heroCode = samples["E Surge Hero.txt"];
function setup() {
  const document = createGuideFixture();
  const snapshot = guideBuildAdapter(catalogs).expandTemplate(monkCode, "gb-flare", "pve");
  let state = createRuntimeGuide(
    {
      ...document,
      nodes: document.nodes.map((node) =>
        node.type === "build"
          ? {
              ...node,
              snapshot: { ...snapshot, build: { ...snapshot.build, name: "Captured Monk" } }
            }
          : node
      )
    },
    "io-session"
  );
  const send: GuideDispatch = (command) => {
    const before = state;
    state = reduceGuide(state, { ...guideAddress(state), ...command } as GuideCommand, catalogs);
    return before === state || before.history !== state.history;
  };
  return {
    get: () => state,
    send,
    replace: () => {
      state = createRuntimeGuide(createGuideFixture(), "other-session");
    },
    op: () => createGuideTemplateOperation(() => state, "gb-flare", catalogs, send)!
  };
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("captured guide template operations", () => {
  it.each(["edit", "delete", "apply", "undo", "switch"])(
    "rejects stale completion after target %s without a rename",
    (kind) => {
      const runtime = setup();
      const op = runtime.op();
      if (kind === "edit")
        runtime.send({
          type: "build",
          buildId: "gb-flare",
          action: { type: "set-mode", mode: "pvp" }
        });
      if (kind === "delete")
        runtime.send({ type: "delete-build", buildId: "gb-flare", retainUnresolved: true });
      if (kind === "apply") {
        runtime.send({
          type: "import-markdown",
          raw: serializeGuideMarkdown(runtime.get().history.frame.document) + "\nAfter source\n"
        });
      }
      if (kind === "undo") {
        runtime.send({
          type: "metadata",
          metadata: { ...runtime.get().history.frame.document.metadata, title: "Changed" }
        });
        runtime.send({ type: "history", direction: "undo" });
      }
      if (kind === "switch") runtime.replace();
      const before = runtime.get().history;
      op.dispatch({ type: "set-build-name", name: "Stale rename" });
      expect(runtime.get().history).toBe(before);
      expect(runtime.get().message).toContain("target changed");
      expect(op.guard.isCurrent()).toBe(false);
    }
  );
  it("keeps the exact captured owner through selection and unrelated edits", () => {
    const runtime = setup();
    runtime.send({ type: "duplicate-build", buildId: "gb-flare", id: "second" });
    const op = runtime.op();
    runtime.send({ type: "select", buildId: "second" });
    runtime.send({ type: "build", buildId: "second", action: { type: "set-mode", mode: "pvp" } });
    expect(op.guard.isCurrent()).toBe(true);
    op.dispatch({ type: "set-build-name", name: "Saved owner" });
    const builds = guideBuilds(runtime.get().history.frame.document);
    expect(builds[0]!.snapshot.build.name).toBe("Saved owner");
    expect(builds[1]!.snapshot.build.name).toBe("Captured Monk");
    expect(builds[1]!.snapshot.build.mode).toBe("pvp");
  });
  it("copies captured bytes and reports stale completion without mutating the guide", async () => {
    const runtime = setup();
    let finish!: () => void;
    const promise = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const write = vi.fn(() => promise);
    const pending = copyGuideTemplate(runtime.get, "gb-flare", catalogs, runtime.send, write);
    runtime.send({ type: "build", buildId: "gb-flare", action: { type: "set-mode", mode: "pvp" } });
    const before = runtime.get().history;
    finish();
    await pending;
    expect(write).toHaveBeenCalledWith(monkCode);
    expect(runtime.get().history).toBe(before);
    expect(runtime.get().message).toContain("clipboard");
  });
  it("checks the captured target after asynchronous native read and preserves all prior data", async () => {
    const runtime = setup();
    const op = runtime.op();
    const file = templateHandle("Hero.txt", heroCode);
    const directory = templateDirectory("Skills");
    directory.entries.set("Hero.txt", file.handle);
    render(
      <TemplateBrowserDialog
        mode="load"
        state={op.state}
        catalogs={catalogs}
        validation={op.validation}
        dispatch={op.dispatch}
        operationGuard={op.guard}
        folder={{ kind: "native", name: "Skills", handle: directory.handle }}
        onFolderChange={vi.fn()}
        onClose={vi.fn()}
        requestDraftReplacement={() => "discard"}
      />
    );
    const row = await screen.findByRole("button", { name: "Hero" });
    let finish!: (file: File) => void;
    vi.mocked(file.handle.getFile).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    fireEvent.doubleClick(row);
    runtime.send({
      type: "build",
      buildId: "gb-flare",
      action: { type: "set-build-name", name: "Edited meanwhile" }
    });
    const before = runtime.get().history;
    await act(async () => finish(templateFile("Hero.txt", heroCode)));
    await screen.findByRole("alert");
    expect(runtime.get().history).toBe(before);
    expect(runtime.get().message).toContain("target changed");
  });
  it("does not begin a native write after target replacement during permission wait", async () => {
    vi.stubGlobal("showDirectoryPicker", vi.fn());
    const runtime = setup();
    const op = runtime.op();
    const directory = templateDirectory("Skills");
    let finish!: (value: PermissionState) => void;
    vi.mocked(directory.handle.requestPermission).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    render(
      <TemplateBrowserDialog
        mode="save"
        state={op.state}
        catalogs={catalogs}
        validation={op.validation}
        dispatch={op.dispatch}
        operationGuard={op.guard}
        folder={{ kind: "native", name: "Skills", handle: directory.handle }}
        onFolderChange={vi.fn()}
        onClose={vi.fn()}
        requestDraftReplacement={() => "discard"}
      />
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    runtime.replace();
    await act(async () => finish("granted"));
    await screen.findByRole("alert");
    expect(directory.handle.getFileHandle).not.toHaveBeenCalled();
  });
  it("reports bytes already written after a delayed close, without renaming a changed target", async () => {
    vi.stubGlobal("showDirectoryPicker", vi.fn());
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const runtime = setup();
    const op = runtime.op();
    const file = templateHandle("Captured Monk.txt", heroCode);
    const directory = templateDirectory("Skills");
    directory.entries.set(file.handle.name, file.handle);
    const create = vi.mocked(file.handle.createWritable).getMockImplementation()!;
    let finish!: () => void;
    const delay = new Promise<void>((resolve) => {
      finish = resolve;
    });
    vi.mocked(file.handle.createWritable).mockImplementation(async () => {
      const writer = await create();
      return {
        ...writer,
        close: async () => {
          await delay;
          await writer.close();
        }
      };
    });
    render(
      <TemplateBrowserDialog
        mode="save"
        state={op.state}
        catalogs={catalogs}
        validation={op.validation}
        dispatch={op.dispatch}
        operationGuard={op.guard}
        folder={{ kind: "native", name: "Skills", handle: directory.handle }}
        onFolderChange={vi.fn()}
        onClose={vi.fn()}
        requestDraftReplacement={() => "discard"}
      />
    );
    await screen.findByRole("button", { name: "Captured Monk" });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(file.write).toHaveBeenCalledWith(monkCode));
    runtime.send({
      type: "build",
      buildId: "gb-flare",
      action: { type: "set-build-name", name: "New owner name" }
    });
    const before = runtime.get().history;
    await act(async () => finish());
    await screen.findByRole("alert");
    expect(file.text()).toBe(monkCode);
    expect(runtime.get().history).toBe(before);
    expect(runtime.get().message).toContain("Wrote captured");
  });
});
