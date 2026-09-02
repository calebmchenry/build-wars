export type Brand<Value, Name extends string> = Value & {
  readonly __brand: Name;
};

export type CatalogId<Scope extends string> = Brand<number, `${Scope}CatalogId`>;
export type AuthoredDocumentId = Brand<string, "AuthoredDocumentId">;
export type CatalogVersionId = Brand<string, "CatalogVersionId">;
export type SchemaVersion = number;

export type TemplateProfessionId = Brand<number, "TemplateProfessionId">;
export type TemplateAttributeId = Brand<number, "TemplateAttributeId">;
export type TemplateSkillId = Brand<number, "TemplateSkillId">;

export type ProfessionId = CatalogId<"Profession">;
export type AttributeId = CatalogId<"Attribute">;
export type SkillId = CatalogId<"Skill">;
export type RuneId = CatalogId<"Rune">;
export type InsigniaId = CatalogId<"Insignia">;
export type ArmorPieceId = CatalogId<"ArmorPiece">;
export type WeaponId = CatalogId<"Weapon">;
export type WeaponModifierId = CatalogId<"WeaponModifier">;

export function catalogId<Scope extends string>(value: number): CatalogId<Scope> {
  return value as CatalogId<Scope>;
}

export function templateProfessionId(value: number): TemplateProfessionId {
  return value as TemplateProfessionId;
}

export function templateAttributeId(value: number): TemplateAttributeId {
  return value as TemplateAttributeId;
}

export function templateSkillId(value: number): TemplateSkillId {
  return value as TemplateSkillId;
}

export function authoredDocumentId(value: string): AuthoredDocumentId {
  return value as AuthoredDocumentId;
}
