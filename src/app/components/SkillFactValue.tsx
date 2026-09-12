import type { SkillFactView } from "../editor-selectors";
import { skillFactAdjustmentText } from "../skill-fact-text";

export function SkillFactValue({ fact }: { readonly fact: SkillFactView }) {
  return (
    <span
      className={`skill-fact-value${fact.attributeEffect === undefined ? "" : " skill-fact-modified"}`}
      data-skill-attribute={fact.attributeEffect?.attribute}
    >
      {fact.value}
    </span>
  );
}

export function SkillAttributeEffectDetails({
  facts
}: {
  readonly facts: readonly SkillFactView[];
}) {
  const details = facts.flatMap((fact) => {
    const text = skillFactAdjustmentText(fact);
    return text === null ? [] : [{ key: fact.label, text }];
  });
  return details.length === 0 ? null : (
    <div className="skill-attribute-effect-details" aria-label="Attribute effects">
      {details.map(({ key, text }) => (
        <p key={key}>{text}</p>
      ))}
    </div>
  );
}
