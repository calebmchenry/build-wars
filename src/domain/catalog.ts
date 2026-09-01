import type { AttributeId, InsigniaId, ProfessionId, RuneId, SkillId } from "./ids";
import type { SourceProvenance } from "./source";

export interface CatalogRecord<Id> {
  readonly id: Id;
  readonly name: string;
  readonly source: SourceProvenance | null;
}

export interface Profession extends CatalogRecord<ProfessionId> {
  readonly abbreviation: string | null;
  readonly primaryAttributeId: AttributeId | null;
}

export interface Attribute extends CatalogRecord<AttributeId> {
  readonly professionId: ProfessionId | null;
  readonly isPrimary: boolean;
}

export interface SkillProgression {
  readonly attributeId: AttributeId | null;
  readonly breakpoints: readonly SkillProgressionBreakpoint[];
}

export interface SkillProgressionBreakpoint {
  readonly rank: number;
  readonly values: readonly number[];
}

export interface Skill extends CatalogRecord<SkillId> {
  readonly professionId: ProfessionId | null;
  readonly attributeId: AttributeId | null;
  readonly progression: SkillProgression | null;
}

export interface Rune extends CatalogRecord<RuneId> {
  readonly professionId: ProfessionId | null;
  readonly attributeId: AttributeId | null;
}

export interface Insignia extends CatalogRecord<InsigniaId> {
  readonly professionId: ProfessionId | null;
}
