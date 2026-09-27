import { guideBuilds } from "../domain/guide";
import { serializeGuideMarkdown, parseGuideMarkdown } from "../guide/markdown";
import { utf8Bytes } from "../guide/limits";
import { guideBuildAdapter } from "./guide-build-adapter";
import { createGuideFixture } from "./guide-fixture";
import { commitGuide, createGuideHistory } from "./guide-history";
import { emptyLocalLibraryEnvelope } from "./persistence-schema";

/** Bounded measurement used by the feasibility harness, never the real library key. */
export function measureGuideCapacity(storage: Pick<Storage, "setItem" | "getItem" | "removeItem">) {
  const fixture = createGuideFixture(true);
  const start = performance.now();
  const source = serializeGuideMarkdown(fixture);
  const serializeMs = performance.now() - start;
  const parseStart = performance.now();
  const parsed = parseGuideMarkdown(source, guideBuildAdapter(null), () => "measurement");
  if (!parsed.ok) throw new Error(parsed.diagnostics[0]?.message);
  const parseMs = performance.now() - parseStart;
  let history = createGuideHistory(fixture, "capacity");
  const historyStart = performance.now();
  for (let i = 0; i < 110; i++)
    history = commitGuide(
      history,
      {
        document: { ...fixture, metadata: { ...fixture.metadata, title: `Measurement ${i}` } },
        recovery: null
      },
      history
    );
  const historyMs = performance.now() - historyStart;
  const envelope = {
    ...emptyLocalLibraryEnvelope(new Date().toISOString()),
    schemaVersion: 3,
    // Includes applied and worst-case representative raw recovery in each copy.
    workingDraft: {
      kind: "guide",
      document: fixture,
      recovery: { raw: source, baseRevision: 0, dirty: true }
    },
    savedDocuments: Array.from({ length: 8 }, (_, i) => ({
      id: `measurement-${i}`,
      document: fixture
    }))
  };
  const serializationStart = performance.now();
  const serialized = JSON.stringify(envelope);
  const envelopeMs = performance.now() - serializationStart;
  const key = "build-wars:sprint-021-capacity-probe";
  if (storage.getItem(key) !== null) throw new Error("Capacity probe key is already occupied.");
  const writeStart = performance.now();
  try {
    storage.setItem(key, serialized);
    if (storage.getItem(key) !== serialized)
      throw new Error("Capacity bytes differ after storage.");
  } finally {
    storage.removeItem(key);
  }
  return {
    blocks: fixture.nodes.length,
    builds: guideBuilds(fixture).length,
    sourceBytes: utf8Bytes(source),
    sourceCodeUnits: source.length,
    serializeMs,
    parseMs,
    historyMs,
    retainedEntries: history.past.length,
    retainedHistoryBytes: history.past.reduce((sum, e) => sum + e.bytes, 0),
    envelopeBytes: utf8Bytes(serialized),
    envelopeCodeUnits: serialized.length,
    envelopeMs,
    storageRoundTripMs: performance.now() - writeStart
  };
}
