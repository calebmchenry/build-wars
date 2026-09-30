import type { Node } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import type { GuideSkillContext } from "../domain/guide";

/** Resolve once at insertion; moving prose later must not silently rebind references. */
export function precedingGuideBuildContext(doc: Node, position: number): GuideSkillContext {
  let context: GuideSkillContext = { kind: "generic" };
  doc.forEach((node, offset) => {
    if (offset < position && node.type.name === "guideBuild")
      context = { kind: "local", buildId: node.attrs.id as string };
  });
  return context;
}

export function guideSkillSearchRange(state: EditorState) {
  const { selection } = state;
  const { $from } = selection;
  if (
    !selection.empty ||
    !$from.parent.isTextblock ||
    $from.parent.type.spec.code ||
    $from.marks().some((mark) => mark.type.name === "code")
  )
    return null;
  // Preserve offsets across inline atoms and never search across a reference or hard break.
  const before = $from.parent.textBetween(0, $from.parentOffset, "\n", "\ufffc");
  const match = /\[\[([^\][\n\ufffc]*)$/.exec(before);
  if (!match) return null;
  const from = $from.pos - match[0].length;
  let code = false;
  state.doc.nodesBetween(from, $from.pos, (node) => {
    if (node.marks.some((mark) => mark.type.name === "code")) code = true;
  });
  return code ? null : { from, to: $from.pos, query: match[1]!.toLowerCase() };
}
