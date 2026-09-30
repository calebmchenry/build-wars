import { useEffect, useState, type DragEvent as ReactDragEvent, type RefObject } from "react";
import type { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { TextSelection } from "@tiptap/pm/state";
import { GapCursor } from "@tiptap/pm/gapcursor";
import type { SkillId } from "../../../domain";
import type { AppCatalogViews } from "../../catalogs";
import type { RuntimeGuideDocument } from "../../guide-state";
import {
  captureGuideSkill,
  GUIDE_SKILL_MIME,
  planGuidePlacement,
  readGuideSkillPayload,
  type GuidePlacementTarget,
  type GuideSkillPayload
} from "../../guide-placement";
import type { GuideDispatch } from "./GuideWorkspace";
import { precedingGuideBuildContext } from "../../guide-skill-references";
import { LIBRARY_BUILD_MIME, readLibraryBuildDrop } from "../../guide-library-builds";
import type { PersistedSavedDocumentRecord } from "../../persistence-schema";

function libraryBuildTarget(view: EditorView, event: DragEvent) {
  const bounds = view.dom.getBoundingClientRect();
  let index = view.state.doc.childCount;
  let top = bounds.top;
  view.state.doc.forEach((_node, position, childIndex) => {
    if (index !== view.state.doc.childCount) return;
    const dom = view.nodeDOM(position);
    if (!(dom instanceof HTMLElement)) return;
    const rect = dom.getBoundingClientRect();
    if (event.clientY < (rect.top + rect.bottom) / 2) {
      index = childIndex;
      top = rect.top;
    } else top = rect.bottom;
  });
  return { index, left: bounds.left, top, width: bounds.width, height: 3 };
}

export function useGuidePlacement({
  getGuide,
  getLibraryRecords,
  editor,
  catalogs,
  send
}: {
  readonly getGuide: () => RuntimeGuideDocument;
  readonly getLibraryRecords: () => readonly PersistedSavedDocumentRecord[];
  readonly editor: RefObject<Editor | null>;
  readonly catalogs: AppCatalogViews | null;
  readonly send: GuideDispatch;
}) {
  const [lastDropEffect, setLastDropEffect] = useState<string | null>(null);
  const [marker, setMarker] = useState<{
    left: number;
    top: number;
    height: number;
    width?: number;
  } | null>(null);
  useEffect(() => {
    const clear = () => setMarker(null);
    window.addEventListener("dragend", clear);
    window.addEventListener("drop", clear);
    return () => {
      window.removeEventListener("dragend", clear);
      window.removeEventListener("drop", clear);
    };
  }, []);
  const cancel = () => {
    setMarker(null);
  };
  const announce = (message: string) => send({ type: "message", message });
  const place = (
    payload: GuideSkillPayload | null,
    target: GuidePlacementTarget,
    position?: number
  ) => {
    if (!catalogs) {
      announce("Catalog unavailable; skill placement is disabled.");
      return;
    }
    const plan = planGuidePlacement(getGuide(), payload, catalogs, target);
    let message = plan.message;
    if (plan.kind === "slot") {
      if (!send({ type: "build", buildId: plan.buildId, action: plan.action })) {
        cancel();
        return;
      }
    } else if (plan.kind === "mention") {
      const instance = editor.current;
      if (!instance || position === undefined) return;
      const pos = position;
      const resolved = instance.state.doc.resolve(pos);
      if (resolved.parent.type.spec.code) {
        announce("Skill references cannot be inserted inside literal code.");
        return;
      }
      const context =
        payload?.source.kind === "catalog"
          ? precedingGuideBuildContext(instance.state.doc, pos)
          : plan.node.context;
      if (payload?.source.kind === "catalog" && context.kind === "local")
        message = "Inserted a reference using the preceding build.";
      const before = getGuide().history;
      instance
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setSelection(
            resolved.parent.isTextblock
              ? TextSelection.create(tr.doc, pos)
              : new GapCursor(tr.doc.resolve(pos))
          );
          tr.setMeta("guide-gesture", true);
          return true;
        })
        .insertContent({
          type: "guideSkill",
          attrs: {
            skillId: plan.node.skillId,
            context
          }
        })
        .run();
      if (getGuide().history === before) {
        cancel();
        return;
      }
    }
    announce(message);
    cancel();
  };
  const start = (event: ReactDragEvent<HTMLElement>, payload: GuideSkillPayload | null) => {
    if (!payload) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData(GUIDE_SKILL_MIME, JSON.stringify(payload));
  };
  const payloadAtDrop = (event: DragEvent | ReactDragEvent<HTMLElement>) =>
    readGuideSkillPayload(event.dataTransfer?.getData(GUIDE_SKILL_MIME) ?? "");
  const prosePosition = (view: EditorView, event: DragEvent) => {
    if (event.target instanceof HTMLElement && event.target.closest(".guide-card")) return null;
    const hit = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!hit || view.state.doc.resolve(hit.pos).parent.type.spec.code) return null;
    return hit.pos;
  };
  return {
    lastDropEffect,
    marker,
    cancel,
    selectSlot: (buildId: string, index: number) => {
      send({ type: "select", buildId });
      send({ type: "intent", intent: { kind: "slot", buildId, index } });
    },
    placeCatalogInSlot: (skillId: SkillId, buildId: string, index: number) =>
      place(captureGuideSkill(getGuide(), { kind: "catalog", skillId }), {
        kind: "slot",
        buildId,
        index
      }),
    startCatalog: (event: ReactDragEvent<HTMLElement>, skillId: SkillId) =>
      start(event, captureGuideSkill(getGuide(), { kind: "catalog", skillId })),
    startSlot: (event: ReactDragEvent<HTMLElement>, buildId: string, index: number) =>
      start(event, captureGuideSkill(getGuide(), { kind: "bar", buildId, index })),
    dragEnd: (event: ReactDragEvent<HTMLElement>) => {
      setLastDropEffect(event.dataTransfer.dropEffect);
      cancel();
    },
    dropSlot: (event: ReactDragEvent<HTMLElement>, buildId: string, index: number) => {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
      place(payloadAtDrop(event), { kind: "slot", buildId, index });
    },
    dragOver: (view: EditorView, event: DragEvent) => {
      if (event.dataTransfer?.types.includes(LIBRARY_BUILD_MIME)) {
        event.preventDefault();
        // The native text drop cursor points inside prose; this gesture inserts blocks.
        event.stopImmediatePropagation();
        event.dataTransfer.dropEffect = getGuide().composing ? "none" : "copy";
        setMarker(getGuide().composing ? null : libraryBuildTarget(view, event));
        return true;
      }
      if (!event.dataTransfer?.types.includes(GUIDE_SKILL_MIME)) return false;
      const pos = prosePosition(view, event);
      if (pos === null) return false;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      const coords = view.coordsAtPos(pos);
      setMarker({
        left: coords.left,
        top: coords.top,
        height: Math.max(16, coords.bottom - coords.top)
      });
      return true;
    },
    drop: (view: EditorView, event: DragEvent) => {
      if (event.dataTransfer?.types.includes(LIBRARY_BUILD_MIME)) {
        event.preventDefault();
        event.stopPropagation();
        cancel();
        if (getGuide().composing) {
          announce("Finish composing before inserting a build.");
          return true;
        }
        try {
          const guide = getGuide();
          const builds = readLibraryBuildDrop(
            event.dataTransfer.getData(LIBRARY_BUILD_MIME),
            getLibraryRecords(),
            guide.history.session
          );
          // An empty editor projects a placeholder paragraph absent from the guide.
          const index = Math.min(
            libraryBuildTarget(view, event).index,
            guide.history.frame.document.nodes.length
          );
          if (
            send({
              type: "insert-fragment",
              index,
              nodes: [...builds, { type: "paragraph", children: [] }]
            })
          ) {
            event.dataTransfer.dropEffect = "copy";
            editor.current?.commands.focus(undefined, { scrollIntoView: false });
            announce(
              builds.length === 1
                ? "Inserted a copy of the saved build."
                : "Inserted copies of the saved builds."
            );
          }
        } catch (error) {
          announce(error instanceof Error ? error.message : "Build insertion failed.");
        }
        return true;
      }
      if (!event.dataTransfer?.types.includes(GUIDE_SKILL_MIME)) {
        if (view.dragging) return false;
        event.preventDefault();
        event.stopPropagation();
        cancel();
        announce(
          "Drop a build from the sidebar, a skill from this guide, or paste plain text. External drag content was not inserted."
        );
        return true;
      }
      event.preventDefault();
      event.stopPropagation();
      const pos = prosePosition(view, event);
      if (pos === null) {
        cancel();
        announce("Choose a prose caret or an explicit build slot.");
        return true;
      }
      place(payloadAtDrop(event), { kind: "prose" }, pos);
      return true;
    },
    leave: () => setMarker(null)
  };
}
