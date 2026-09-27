/** Frozen by BW-2001; measured evidence is recorded in ADR 0003. */
export const GUIDE_LIMITS = {
  appliedBytes: 1024 * 1024,
  rawBytes: 2 * 1024 * 1024,
  nodes: 10000,
  depth: 32,
  builds: 32,
  mentions: 2000,
  sources: 64,
  metadataBytes: 65536,
  diagnostics: 100,
  historyEntries: 100,
  historyBytes: 16 * 1024 * 1024,
  typingMs: 750,
  libraryBytes: 8 * 1024 * 1024,
  backupBytes: 16 * 1024 * 1024
} as const;
export const utf8Bytes = (value: string): number => new TextEncoder().encode(value).length;
export const validGuideId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value);
export function safeGuideUrl(value: string): boolean {
  if (/^#[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)) return true;
  if ([...value].some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127))
    return false;
  return /^(https?:\/\/|mailto:)[^\s]+$/i.test(value);
}
