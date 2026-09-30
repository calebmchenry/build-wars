import type { GuideDocument } from "../domain/guide";
import { GUIDE_LIMITS, utf8Bytes } from "../guide/limits";
import { serializeGuideMarkdown } from "../guide/markdown";
import type { PersistedBuildSnapshot } from "./persistence-schema";
export type AppliedGuide = GuideDocument<PersistedBuildSnapshot>;
/** Legacy draft bytes retained only for storage/backup compatibility; never an editor mode. */
export interface GuideRecovery {
  readonly raw: string;
  readonly baseRevision: number;
  readonly dirty: boolean;
}
export interface GuideFrame {
  readonly document: AppliedGuide;
  readonly recovery: GuideRecovery | null;
  readonly appliedRevision?: number;
}
interface Entry {
  readonly frame: GuideFrame;
  readonly bytes: number;
}
export interface GuideHistory {
  readonly session: string;
  readonly revision: number;
  readonly frame: GuideFrame;
  readonly past: readonly Entry[];
  readonly future: readonly Entry[];
  readonly group: string | null;
  readonly time: number;
}
export function createGuideHistory(document: AppliedGuide, session: string): GuideHistory {
  return {
    session,
    revision: 0,
    frame: { document, recovery: null, appliedRevision: 0 },
    past: [],
    future: [],
    group: null,
    time: 0
  };
}
function size(frame: GuideFrame) {
  return documentBytes(frame.document) + utf8Bytes(frame.recovery?.raw ?? "");
}
const byteCache = new WeakMap<AppliedGuide, number>();
export function documentBytes(document: AppliedGuide): number {
  let bytes = byteCache.get(document);
  if (bytes === undefined) {
    bytes = utf8Bytes(serializeGuideMarkdown(document));
    byteCache.set(document, bytes);
  }
  return bytes;
}
export function commitGuide(
  history: GuideHistory,
  frame: GuideFrame,
  address: { session: string; revision: number },
  group: string | null = null,
  now = Date.now()
): GuideHistory {
  if (
    address.session !== history.session ||
    address.revision !== history.revision ||
    history.frame === frame ||
    (history.frame.document === frame.document && history.frame.recovery === frame.recovery)
  )
    return history;
  const bytes = size(frame);
  if (
    bytes > GUIDE_LIMITS.historyBytes ||
    documentBytes(frame.document) > GUIDE_LIMITS.appliedBytes ||
    utf8Bytes(frame.recovery?.raw ?? "") > GUIDE_LIMITS.rawBytes ||
    (serializeGuideMarkdown(frame.document) === serializeGuideMarkdown(history.frame.document) &&
      JSON.stringify(frame.recovery) === JSON.stringify(history.frame.recovery))
  )
    return history;
  const merge =
    group !== null && history.group === group && now - history.time < GUIDE_LIMITS.typingMs;
  const past = merge
    ? [...history.past]
    : [...history.past, { frame: history.frame, bytes: size(history.frame) }];
  let total = bytes + past.reduce((sum, entry) => sum + entry.bytes, 0);
  while (
    past.length &&
    (past.length > GUIDE_LIMITS.historyEntries || total > GUIDE_LIMITS.historyBytes)
  )
    total -= past.shift()!.bytes;
  return { ...history, frame, revision: history.revision + 1, past, future: [], group, time: now };
}
export function stepGuideHistory(history: GuideHistory, direction: "undo" | "redo"): GuideHistory {
  const stack = direction === "undo" ? history.past : history.future;
  const entry = stack.at(-1);
  if (!entry) return history;
  const current = { frame: history.frame, bytes: size(history.frame) };
  return {
    ...history,
    revision: history.revision + 1,
    frame: entry.frame,
    group: null,
    past: direction === "undo" ? history.past.slice(0, -1) : [...history.past, current],
    future: direction === "redo" ? history.future.slice(0, -1) : [...history.future, current]
  };
}
