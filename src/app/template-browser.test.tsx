import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useReducer } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import samples from "../../test/fixtures/skill-template-files.json";
import { templateDirectory, templateFile, templateHandle } from "../test/template-files";
import { requireReadyCatalogs } from "./catalogs";
import { InlineTemplateCode } from "./components/InlineTemplateCode";
import { createBlankEditorState, editorReducer } from "./editor-state";
import { selectValidationView } from "./editor-selectors";
import { importSkillTemplateToEditor } from "./template-workflow";

const catalogs = requireReadyCatalogs();
const monkCode = samples["Protection Monk.txt"];
const heroCode = samples["E Surge Hero.txt"];

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function Harness({ guard = () => "discard" }: { readonly guard?: () => "discard" | "cancel" }) {
  const imported = importSkillTemplateToEditor(monkCode, createBlankEditorState(), catalogs);
  if (!imported.ok) throw new Error(imported.error.message);
  const [state, dispatch] = useReducer(editorReducer, {
    ...imported.state,
    build: { ...imported.state.build, name: "Current build" }
  });
  return (
    <>
      <InlineTemplateCode
        state={state}
        catalogs={catalogs}
        validation={selectValidationView(state, catalogs)}
        dispatch={dispatch}
        requestDraftReplacement={guard}
      />
      <div data-testid="build-name">{state.build.name}</div>
      <output role="status">{state.transient?.text}</output>
    </>
  );
}

async function openFolder(mode: "Load" | "Save", directory = templateDirectory("Skills", samples)) {
  vi.stubGlobal("showDirectoryPicker", vi.fn().mockResolvedValue(directory.handle));
  fireEvent.click(screen.getByRole("button", { name: `${mode} template` }));
  fireEvent.click(screen.getByRole("button", { name: "Choose Folder…" }));
  await screen.findByRole("button", { name: "Protection Monk" });
  return directory;
}

describe("template browser", () => {
  it("previews on hover and focus without changing the editor, and loads by filename", async () => {
    render(<Harness />);
    await openFolder("Load");
    const file = screen.getByRole("button", { name: "E Surge Hero" });
    fireEvent.mouseEnter(file);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Mesmer / Ritualist");
    expect(within(screen.getByRole("tooltip")).getAllByRole("img")).toHaveLength(8);
    expect(screen.getByTestId("build-name")).toHaveTextContent("Current build");
    expect(screen.getByLabelText("Template code")).toHaveValue(monkCode);
    fireEvent.mouseLeave(file);
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
    act(() => file.focus());
    expect(screen.getByRole("tooltip")).toHaveTextContent("Domination Magic 12");
    fireEvent.click(file);
    expect(screen.getByLabelText("Template code")).toHaveValue(monkCode);
    fireEvent.click(screen.getByRole("button", { name: "Load" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Template code")).toHaveValue(heroCode);
    expect(screen.getByTestId("build-name")).toHaveTextContent("E Surge Hero");
  });

  it("honors draft replacement cancellation on double-click", async () => {
    const guard = vi.fn(() => "cancel" as const);
    render(<Harness guard={guard} />);
    await openFolder("Load");
    fireEvent.doubleClick(screen.getByRole("button", { name: "E Surge Hero" }));
    await waitFor(() => expect(guard).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Template code")).toHaveValue(monkCode);
  });

  it("reloads a changed file from disk before importing", async () => {
    const directory = templateDirectory("Skills", samples);
    const file = templateHandle("Protection Monk.txt", monkCode);
    directory.entries.set(file.handle.name, file.handle);
    render(<Harness />);
    await openFolder("Load", directory);
    file.changeOnDisk(heroCode);
    fireEvent.doubleClick(screen.getByRole("button", { name: "Protection Monk" }));
    await waitFor(() => expect(screen.getByLabelText("Template code")).toHaveValue(heroCode));
  });

  it("leaves the editor intact if a file becomes invalid after browsing", async () => {
    const directory = templateDirectory("Skills", samples);
    const file = templateHandle("Protection Monk.txt", monkCode);
    directory.entries.set(file.handle.name, file.handle);
    render(<Harness />);
    await openFolder("Load", directory);
    file.changeOnDisk("invalid!");
    fireEvent.doubleClick(screen.getByRole("button", { name: "Protection Monk" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Template code")).toHaveValue(monkCode);
  });

  it("saves the current edited code under a new name, rather than the previewed file's code", async () => {
    render(<Harness />);
    fireEvent.paste(screen.getByLabelText("Template code"), {
      clipboardData: { getData: () => heroCode }
    });
    const directory = await openFolder("Save");
    fireEvent.click(screen.getByRole("button", { name: "Protection Monk" }));
    expect(screen.getByLabelText("Template name")).toHaveValue("Protection Monk");
    fireEvent.change(screen.getByLabelText("Template name"), { target: { value: "My new hero" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const handle = await directory.handle.getFileHandle("My new hero.txt");
    expect(await (await handle.getFile()).text()).toBe(heroCode);
    expect(directory.handle.requestPermission).toHaveBeenCalledWith({ mode: "readwrite" });
    expect(screen.getByTestId("build-name")).toHaveTextContent("My new hero");
  });

  it("confirms existing files, including files created after opening the modal", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Harness />);
    const directory = await openFolder("Save");
    const file = templateHandle("New arrival.txt", heroCode);
    directory.entries.set(file.handle.name, file.handle);
    fireEvent.change(screen.getByLabelText("Template name"), { target: { value: "New arrival" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(confirm).toHaveBeenCalledWith("Replace “New arrival.txt” with the current build?")
    );
    expect(file.handle.createWritable).not.toHaveBeenCalled();
    expect(file.text()).toBe(heroCode);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(file.text()).toBe(monkCode);
  });

  it("keeps the modal open and reports denied write permission", async () => {
    render(<Harness />);
    const directory = await openFolder("Save");
    vi.mocked(directory.handle.requestPermission).mockResolvedValue("denied");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Allow editing this folder");
    expect(directory.handle.getFileHandle).not.toHaveBeenCalled();
    expect(screen.getByTestId("build-name")).toHaveTextContent("Current build");
  });

  it("does not report success until the file is closed successfully", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Harness />);
    const directory = await openFolder("Save");
    const file = await directory.handle.getFileHandle("Protection Monk.txt");
    const abort = vi.fn(async () => undefined);
    vi.mocked(file.createWritable).mockResolvedValue({
      write: vi.fn(async () => undefined),
      close: vi.fn().mockRejectedValue(new Error("Disk full")),
      abort
    });
    fireEvent.click(screen.getByRole("button", { name: "Protection Monk" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Disk full");
    expect(abort).toHaveBeenCalled();
    expect(screen.getByTestId("build-name")).toHaveTextContent("Current build");
  });

  it("navigates subfolders and saves into the displayed folder", async () => {
    const directory = templateDirectory("Skills", samples);
    const heroes = templateDirectory("Heroes");
    directory.entries.set("Heroes", heroes.handle);
    render(<Harness />);
    await openFolder("Save", directory);
    fireEvent.click(screen.getByRole("button", { name: /Heroes Folder/ }));
    await screen.findByText("No templates in this folder.");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(heroes.entries.has("Current build.txt")).toBe(true);
    expect(directory.entries.has("Current build.txt")).toBe(false);
  });

  it("refreshes files and keeps the chosen folder when reopening the modal", async () => {
    render(<Harness />);
    const directory = await openFolder("Load");
    directory.entries.delete("Protection Monk.txt");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Protection Monk" })).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Load template" }));
    await screen.findByRole("button", { name: "E Surge Hero" });
    expect(
      (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker
    ).toHaveBeenCalledTimes(1);
  });

  it("allows reconnecting a folder whose read permission expired", async () => {
    render(<Harness />);
    const directory = await openFolder("Load");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    vi.mocked(directory.handle.queryPermission).mockResolvedValue("prompt");
    fireEvent.click(screen.getByRole("button", { name: "Load template" }));
    const reconnect = await screen.findByRole("button", { name: "Reconnect Folder" });
    expect(directory.handle.requestPermission).not.toHaveBeenCalled();
    vi.mocked(directory.handle.queryPermission).mockResolvedValue("granted");
    fireEvent.click(reconnect);
    await screen.findByRole("button", { name: "Protection Monk" });
    expect(directory.handle.requestPermission).toHaveBeenCalledWith({ mode: "read" });
  });

  it("ignores picker cancellation and shows invalid templates without blocking valid ones", async () => {
    const directory = templateDirectory("Skills", { ...samples, "Broken.txt": "not a code!" });
    render(<Harness />);
    await openFolder("Load", directory);
    fireEvent.click(screen.getByRole("button", { name: "Broken" }));
    expect(screen.getByRole("button", { name: "Load" })).toBeDisabled();
    vi.stubGlobal(
      "showDirectoryPicker",
      vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"))
    );
    fireEvent.click(screen.getByRole("button", { name: "Change Folder…" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Change Folder…" })).toBeEnabled()
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Protection Monk" })).toBeInTheDocument();
  });

  it("loads imported folders and downloads .txt files in the fallback browser", async () => {
    vi.stubGlobal("showDirectoryPicker", undefined);
    const createURL = vi.fn(() => "blob:test-template");
    const TestURL = class extends URL {
      static override createObjectURL = createURL;
      static override revokeObjectURL = vi.fn();
    };
    vi.stubGlobal("URL", TestURL);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Load template" }));
    fireEvent.change(screen.getByLabelText("Template folder"), {
      target: { files: [templateFile("Hero.txt", heroCode)] }
    });
    fireEvent.doubleClick(await screen.findByRole("button", { name: "Hero" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Template code")).toHaveValue(heroCode);
    fireEvent.click(screen.getByRole("button", { name: "Save template" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Download" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(click).toHaveBeenCalled();
    expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe("Hero.txt");
    expect(createURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: "text/plain;charset=utf-8" })
    );
    expect(screen.getByRole("status")).toHaveTextContent("Download started");
  });
});
