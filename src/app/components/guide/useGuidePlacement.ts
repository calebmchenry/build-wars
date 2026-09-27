import { useState, type DragEvent as ReactDragEvent, type RefObject } from "react";
import type { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { TextSelection, type SelectionBookmark } from "@tiptap/pm/state";
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
export function useGuidePlacement({
  getGuide,
  editor,
  bookmark,
  catalogs,
  send
}: {
  readonly getGuide: () => RuntimeGuideDocument;
  readonly editor: RefObject<Editor | null>;
  readonly bookmark: RefObject<SelectionBookmark | null>;
  readonly catalogs: AppCatalogViews | null;
  readonly send: GuideDispatch;
}) {
  const [picked, setPicked] = useState<GuideSkillPayload | null>(null);
  const [pickingCatalog, setPickingCatalog] = useState(false);
  const [lastDropEffect, setLastDropEffect] = useState<string | null>(null);
  const [marker, setMarker] = useState<{ left: number; top: number; height: number } | null>(null);
  const cancel = () => {
    setPicked(null);
    setPickingCatalog(false);
    setMarker(null);
  };
  const announce = (message: string) => send({ type: "message", message });
  const pickSlot = (buildId: string, index: number) => {
    const payload = captureGuideSkill(getGuide(), { kind: "bar", buildId, index });
    if (!payload) {
      announce("That source slot is empty.");
      return;
    }
    setPicked(payload);
    setPickingCatalog(false);
    announce(
      `Picked slot ${index + 1}. Choose a target slot or Place picked at caret. Escape cancels.`
    );
  };
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
    if (plan.kind === "slot") {
      if (!send({ type: "build", buildId: plan.buildId, action: plan.action })) {
        cancel();
        return;
      }
    } else if (plan.kind === "mention") {
      const instance = editor.current;
      if (!instance) return;
      const selection =
        position === undefined ? bookmark.current?.resolve(instance.state.doc) : null;
      if (position === undefined && (!selection || getGuide().intent.kind !== "prose")) {
        announce("Choose a text caret before placing the picked skill.");
        return;
      }
      const pos = position ?? selection!.from;
      const resolved = instance.state.doc.resolve(pos);
      if (resolved.parent.type.spec.code) {
        announce("Skill references cannot be inserted inside literal code.");
        return;
      }
      const before = getGuide().history;
      instance
        .chain()
        .focus()
        .command(({ tr }) => {
          if (selection) tr.setSelection(selection);
          else
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
          attrs: { skillId: plan.node.skillId, context: plan.node.context }
        })
        .run();
      if (getGuide().history === before) {
        cancel();
        return;
      }
    }
    announce(plan.message);
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
    setPicked(null);
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
    picked,
    lastDropEffect,
    pickingCatalog,
    marker,
    cancel,
    armCatalog: () => {
      setPicked(null);
      setPickingCatalog(true);
      announce("Choose a catalog skill to pick, then a slot or text caret. Escape cancels.");
    },
    pickCatalog: (skillId: SkillId) => {
      if (!pickingCatalog) return false;
      setPicked(captureGuideSkill(getGuide(), { kind: "catalog", skillId }));
      setPickingCatalog(false);
      announce("Skill picked. Choose a slot or use Place picked at caret. Escape cancels.");
      return true;
    },
    pickSlot,
    selectSlot: (buildId: string, index: number) => {
      if (picked) place(picked, { kind: "slot", buildId, index });
      else {
        send({ type: "select", buildId });
        send({ type: "intent", intent: { kind: "slot", buildId, index } });
      }
    },
    placeAtCaret: () => place(picked, { kind: "prose" }),
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
      if (!event.dataTransfer?.types.includes(GUIDE_SKILL_MIME)) {
        if (view.dragging) return false;
        event.preventDefault();
        event.stopPropagation();
        cancel();
        announce(
          "Drop a skill from this guide, or paste plain text. External drag content was not inserted."
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
