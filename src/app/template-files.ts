// The user-visible file picker API is not yet included in TypeScript's DOM library.
export interface TemplateFileHandle {
  readonly kind: "file";
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
    abort(): Promise<void>;
  }>;
}

export interface TemplateDirectoryHandle {
  readonly kind: "directory";
  readonly name: string;
  values(): AsyncIterable<TemplateDirectoryHandle | TemplateFileHandle>;
  getDirectoryHandle(name: string): Promise<TemplateDirectoryHandle>;
  getFileHandle(name: string, options?: { create: boolean }): Promise<TemplateFileHandle>;
  queryPermission(options: { mode: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission(options: { mode: "read" | "readwrite" }): Promise<PermissionState>;
}

export type TemplateFolder =
  | { readonly kind: "native"; readonly name: string; readonly handle: TemplateDirectoryHandle }
  | { readonly kind: "imported"; readonly name: string; readonly files: readonly File[] };

export interface TemplateFileEntry {
  readonly name: string;
  readonly code: string | null;
  readonly error: string | null;
  readonly handle: TemplateFileHandle | null;
}

export interface TemplateFolderContents {
  readonly directories: readonly string[];
  readonly files: readonly TemplateFileEntry[];
  readonly handle: TemplateDirectoryHandle | null;
}

type PickerWindow = Window & {
  showDirectoryPicker?: (options: {
    id: string;
    mode: "read";
    startIn: "documents";
  }) => Promise<TemplateDirectoryHandle>;
};

export function supportsTemplateFolders(): boolean {
  return typeof (window as PickerWindow).showDirectoryPicker === "function";
}

export async function pickTemplateFolder(): Promise<TemplateFolder> {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (picker === undefined) throw new Error("Choose a folder using the file input.");
  const handle = await picker.call(window, {
    id: "guild-wars-templates",
    mode: "read",
    startIn: "documents"
  });
  return { kind: "native", name: handle.name, handle };
}

export function importedTemplateFolder(files: readonly File[]): TemplateFolder {
  return {
    kind: "imported",
    name: files[0]?.webkitRelativePath.split("/")[0] || "Templates",
    files
  };
}

export async function readTemplateFile(file: File): Promise<string> {
  if (file.size > 4096) throw new Error("This file is too large to be a skill template.");
  const text = await file.text();
  return text.replace(/^\uFEFF/, "").trim();
}

async function readEntry(file: File | TemplateFileHandle): Promise<TemplateFileEntry> {
  const handle = "getFile" in file ? file : null;
  try {
    const code = await readTemplateFile("getFile" in file ? await file.getFile() : file);
    return { name: file.name, code, error: null, handle };
  } catch (error) {
    return { name: file.name, code: null, error: templateFileError(error), handle };
  }
}

export async function readTemplateFolder(
  folder: TemplateFolder,
  path: readonly string[]
): Promise<TemplateFolderContents> {
  const directories: string[] = [];
  const files: (File | TemplateFileHandle)[] = [];
  let handle: TemplateDirectoryHandle | null = null;
  if (folder.kind === "native") {
    handle = folder.handle;
    for (const segment of path) handle = await handle.getDirectoryHandle(segment);
    for await (const entry of handle.values()) {
      if (entry.kind === "directory") directories.push(entry.name);
      else if (/\.txt$/i.test(entry.name)) files.push(entry);
    }
  } else {
    const prefix = [folder.name, ...path].join("/") + "/";
    for (const file of folder.files) {
      if (!file.webkitRelativePath.startsWith(prefix)) continue;
      const relative = file.webkitRelativePath.slice(prefix.length).split("/");
      if (relative.length > 1) directories.push(relative[0]!);
      else if (/\.txt$/i.test(file.name)) files.push(file);
    }
  }
  const entries: TemplateFileEntry[] = [];
  // Limit concurrent disk reads for large game libraries.
  for (let index = 0; index < files.length; index += 32) {
    entries.push(...(await Promise.all(files.slice(index, index + 32).map(readEntry))));
  }
  return {
    directories: [...new Set(directories)].sort(compareNames),
    files: entries.sort((a, b) => compareNames(a.name, b.name)),
    handle
  };
}

function compareNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function templateFilename(input: string): string {
  const name = input.trim();
  if (!name || name === "." || name === "..") throw new Error("Enter a template name.");
  if (
    /[<>:"/\\|?*]/.test(name) ||
    [...name].some((character) => character.charCodeAt(0) < 32) ||
    /[. ]$/.test(name)
  ) {
    throw new Error("Use a filename without slashes, trailing dots, or special characters.");
  }
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(name)) {
    throw new Error("This filename is reserved by Windows. Choose another name.");
  }
  const filename = /\.txt$/i.test(name) ? name : `${name}.txt`;
  if (new TextEncoder().encode(filename).length > 255) {
    throw new Error("This filename is too long. Choose a shorter name.");
  }
  return filename;
}

export async function writeTemplateFile(handle: TemplateFileHandle, code: string): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(code);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => undefined);
    throw error;
  }
}

export function downloadTemplateFile(name: string, code: string): void {
  const url = URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isFilePickerCancellation(error: unknown): boolean {
  return isFileError(error, "AbortError");
}

export function isFileError(error: unknown, name: string): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === name;
}

export function templateFileError(error: unknown): string {
  if (isFileError(error, "NotAllowedError") || isFileError(error, "SecurityError")) {
    return "Folder access was denied. Choose the folder again and allow access.";
  }
  if (isFileError(error, "NotFoundError")) {
    return "This file or folder has moved or been deleted. Refresh or choose another folder.";
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "The template file could not be accessed. Try again.";
}

// Store only the granted directory handle, never a user's template contents.
export async function rememberedTemplateFolder(
  handle?: TemplateDirectoryHandle
): Promise<TemplateDirectoryHandle | null> {
  if (typeof indexedDB === "undefined") return null;
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("build-wars-template-folder", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("folders");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Folder preferences are unavailable."));
  });
  try {
    return await new Promise<TemplateDirectoryHandle | null>((resolve, reject) => {
      const transaction = database.transaction("folders", handle ? "readwrite" : "readonly");
      const objectStore = transaction.objectStore("folders");
      const request = handle ? objectStore.put(handle, "templates") : objectStore.get("templates");
      transaction.oncomplete = () => resolve(handle ?? request.result ?? null);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}
