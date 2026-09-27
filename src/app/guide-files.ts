import { GUIDE_LIMITS, utf8Bytes } from "../guide/limits";
import { parseGuideMarkdown } from "../guide/markdown";
import type { AppCatalogViews } from "./catalogs";
import { guideBuildAdapter } from "./guide-build-adapter";
import { guideAddress, type RuntimeGuideDocument } from "./guide-state";

export function captureGuideDocument(guide: RuntimeGuideDocument) {
  return { ...guideAddress(guide), generation: guide.generation };
}
export function isCurrentGuideDocument(
  guide: RuntimeGuideDocument,
  capture: ReturnType<typeof captureGuideDocument>
) {
  return (
    guide.history.session === capture.session &&
    guide.history.revision === capture.revision &&
    guide.generation === capture.generation &&
    !guide.composing
  );
}
export function validateGuideIntake(raw: string, catalogs: AppCatalogViews | null, id: string) {
  if (utf8Bytes(raw) > GUIDE_LIMITS.rawBytes)
    throw new Error("Markdown exceeds the 2 MiB input limit. The current guide is unchanged.");
  const parsed = parseGuideMarkdown(raw, guideBuildAdapter(catalogs), () => id);
  if (!parsed.ok)
    throw new Error(parsed.diagnostics.map((d) => `${d.line}:${d.column} ${d.message}`).join("\n"));
  return parsed.document;
}
export async function readGuideMarkdownFile(
  file: Pick<File, "size" | "arrayBuffer">,
  getGuide: () => RuntimeGuideDocument,
  capture: ReturnType<typeof captureGuideDocument>,
  catalogs: AppCatalogViews | null
) {
  const check = () => {
    if (!isCurrentGuideDocument(getGuide(), capture))
      throw new Error(
        "The guide changed while Markdown was being read. Reopen import; nothing was replaced."
      );
  };
  check();
  if (file.size > GUIDE_LIMITS.rawBytes)
    throw new Error("Markdown file exceeds the 2 MiB input limit.");
  const bytes = await file.arrayBuffer();
  check();
  const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  validateGuideIntake(raw, catalogs, getGuide().history.frame.document.metadata.id);
  check();
  return raw;
}
export function downloadGuide(raw: string, title: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = (title.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "guide") + ".md";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
