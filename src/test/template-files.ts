import { vi } from "vitest";

import type { TemplateDirectoryHandle, TemplateFileHandle } from "../app/template-files";

export function templateFile(name: string, text: string, path = `Skills/${name}`): File {
  const file = new File([text], name, { type: "text/plain" });
  Object.defineProperties(file, {
    text: { value: async () => text },
    webkitRelativePath: { value: path }
  });
  return file;
}

export function templateHandle(name: string, initialCode: string) {
  let code = initialCode;
  const write = vi.fn<(_: string) => Promise<void>>();
  const close = vi.fn<() => Promise<void>>();
  const abort = vi.fn(async () => undefined);
  const handle: TemplateFileHandle = {
    kind: "file",
    name,
    getFile: vi.fn(async () => templateFile(name, code)),
    createWritable: vi.fn(async () => {
      let pending = "";
      write.mockImplementation(async (value) => {
        pending = value;
      });
      close.mockImplementation(async () => {
        code = pending;
      });
      return { write, close, abort };
    })
  };
  return {
    handle,
    write,
    close,
    abort,
    text: () => code,
    changeOnDisk: (text: string) => {
      code = text;
    }
  };
}

export function templateDirectory(name: string, files: Record<string, string> = {}) {
  const entries = new Map<string, TemplateDirectoryHandle | TemplateFileHandle>(
    Object.entries(files).map(([name, code]) => [name, templateHandle(name, code).handle])
  );
  const handle: TemplateDirectoryHandle = {
    kind: "directory",
    name,
    queryPermission: vi.fn(async () => "granted" as const),
    requestPermission: vi.fn(async () => "granted" as const),
    values: async function* () {
      yield* entries.values();
    },
    getDirectoryHandle: vi.fn(async (name) => {
      const entry = entries.get(name);
      if (entry?.kind !== "directory") throw new DOMException("Missing directory", "NotFoundError");
      return entry;
    }),
    getFileHandle: vi.fn(async (name, options) => {
      const existing = entries.get(name);
      if (existing?.kind === "file") return existing;
      if (existing) throw new DOMException("This name belongs to a folder.", "TypeMismatchError");
      if (!options?.create) throw new DOMException("Missing file", "NotFoundError");
      const entry = templateHandle(name, "").handle;
      entries.set(name, entry);
      return entry;
    })
  };
  return { handle, entries };
}
