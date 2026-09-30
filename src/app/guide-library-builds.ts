import type { GuideNode } from "../domain/guide";
import { cloneGuideBuild } from "./guide-build-adapter";
import type { PersistedBuildSnapshot, PersistedSavedDocumentRecord } from "./persistence-schema";

export const LIBRARY_BUILD_MIME = "application/x-build-wars-library-build+json";

export function libraryBuildDragPayload(record: PersistedSavedDocumentRecord, session: string) {
  return JSON.stringify({ version: 1, recordId: record.id, updatedAt: record.updatedAt, session });
}

export function copyLibraryBuilds(
  record: PersistedSavedDocumentRecord,
  makeId = () => crypto.randomUUID()
): Extract<GuideNode<PersistedBuildSnapshot>, { type: "build" }>[] {
  const document = record.document;
  const snapshots =
    document.kind === "build"
      ? [{ ...document.snapshot, build: { ...document.snapshot.build, name: record.name } }]
      : document.kind === "build-set"
        ? document.snapshot.entries.map((entry) => entry.snapshot)
        : [];
  if (!snapshots.length) throw new Error("This library entry has no builds to insert.");
  return snapshots.map((snapshot) => {
    const id = makeId();
    return { type: "build", id, snapshot: cloneGuideBuild(snapshot, id) };
  });
}

export function readLibraryBuildDrop(
  raw: string,
  records: readonly PersistedSavedDocumentRecord[],
  session: string
) {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error("This build drag could not be read. Drag the build from the sidebar again.");
  }
  if (!payload || payload.version !== 1 || payload.session !== session)
    throw new Error("The guide changed. Drag the build from the sidebar again.");
  const record = records.find((record) => record.id === payload.recordId);
  if (!record || record.updatedAt !== payload.updatedAt)
    throw new Error("The saved build changed or was removed. Drag it from the sidebar again.");
  return copyLibraryBuilds(record);
}
