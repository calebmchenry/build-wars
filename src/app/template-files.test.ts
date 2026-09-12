import { describe, expect, it, vi } from "vitest";

import samples from "../../test/fixtures/skill-template-files.json";
import { decodeSkillTemplate, exportSkillTemplate } from "../template-compatibility";
import { templateDirectory, templateFile, templateHandle } from "../test/template-files";
import {
  importedTemplateFolder,
  readTemplateFolder,
  templateFilename,
  writeTemplateFile
} from "./template-files";

describe("template files", () => {
  it("reads all nine game files and round-trips their exact codes", async () => {
    const directory = templateDirectory("Skills", samples);
    directory.entries.set("notes.md", templateHandle("notes.md", "not a template").handle);
    const contents = await readTemplateFolder(
      { kind: "native", name: "Skills", handle: directory.handle },
      []
    );
    expect(contents.files).toHaveLength(9);
    for (const file of contents.files) {
      const decoded = decodeSkillTemplate(file.code!);
      expect(decoded.ok).toBe(true);
      if (!decoded.ok) throw new Error(decoded.error.message);
      const exported = exportSkillTemplate(decoded.value, { mode: "preserve-source" });
      expect(exported.ok && exported.value.bareCode).toBe(file.code);
    }
  });

  it("lists imported subfolders without mixing their files into the parent", async () => {
    const folder = importedTemplateFolder([
      templateFile("Monk.txt", samples["Protection Monk.txt"]),
      templateFile("Hero.txt", samples["E Surge Hero.txt"], "Skills/Heroes/Hero.txt"),
      templateFile("notes.md", "notes", "Skills/Heroes/notes.md")
    ]);
    const root = await readTemplateFolder(folder, []);
    expect(root.directories).toEqual(["Heroes"]);
    expect(root.files.map((file) => file.name)).toEqual(["Monk.txt"]);
    const heroes = await readTemplateFolder(folder, ["Heroes"]);
    expect(heroes.files.map((file) => file.name)).toEqual(["Hero.txt"]);
    expect(heroes.handle).toBeNull();
  });

  it("normalizes BOM and line endings and isolates unreadable or oversized files", async () => {
    const folder = templateDirectory("Skills", {
      "Good.txt": `\uFEFF${samples["Protection Monk.txt"]}\r\n`,
      "Large.txt": "a".repeat(4097)
    });
    const broken = templateHandle("Broken.txt", "");
    vi.mocked(broken.handle.getFile).mockRejectedValue(
      new DOMException("Denied", "NotAllowedError")
    );
    folder.entries.set("Broken.txt", broken.handle);
    const contents = await readTemplateFolder(
      { kind: "native", name: "Skills", handle: folder.handle },
      []
    );
    expect(contents.files.find((file) => file.name === "Good.txt")?.code).toBe(
      samples["Protection Monk.txt"]
    );
    expect(contents.files.filter((file) => file.error !== null)).toHaveLength(2);
  });

  it.each([
    "../Monk",
    "folder/Monk",
    "folder\\Monk",
    "Monk.",
    "CON",
    "con.txt",
    "LPT1.txt",
    "bad:name",
    "",
    "..",
    "a".repeat(256)
  ])("rejects unsafe Windows filenames: %s", (name) => {
    expect(() => templateFilename(name)).toThrow();
  });

  it("keeps game-compatible names and adds just one extension", () => {
    expect(templateFilename(" [Starter] EME Domination ")).toBe("[Starter] EME Domination.txt");
    expect(templateFilename("Protection Monk.TXT")).toBe("Protection Monk.TXT");
  });

  it("aborts a failed write without committing partial contents", async () => {
    const file = templateHandle("Monk.txt", "original");
    vi.mocked(file.handle.createWritable).mockResolvedValue({
      write: vi.fn().mockRejectedValue(new Error("Disk full")),
      close: file.close,
      abort: file.abort
    });
    await expect(writeTemplateFile(file.handle, "replacement")).rejects.toThrow("Disk full");
    expect(file.abort).toHaveBeenCalled();
    expect(file.close).not.toHaveBeenCalled();
    expect(file.text()).toBe("original");
  });
});
