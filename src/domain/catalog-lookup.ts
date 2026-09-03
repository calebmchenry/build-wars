import type {
  AttributeId,
  InsigniaId,
  ProfessionId,
  RuneId,
  SkillId,
  TemplateAttributeId,
  TemplateEquipmentItemId,
  TemplateEquipmentModifierId,
  TemplateProfessionId,
  TemplateSkillId,
  WeaponId,
  WeaponModifierId
} from "./ids";
import type {
  CatalogWeaponBaseRecord,
  CatalogWeaponModRecord,
  CatalogRuneRecord,
  CatalogInsigniaRecord,
  CatalogSkillRecord,
  CatalogAttributeRecord,
  CatalogProfessionRecord,
  WeaponBaseCatalog,
  WeaponModCatalog,
  WeaponSourceSetDisposition,
  InsigniaCatalog,
  InsigniaSourceSetDisposition,
  ProfessionAttributeCatalog,
  RuneCatalog,
  RuneSourceSetDisposition,
  SkillCatalog,
  SkillMode,
  SkillModeVariantGroup,
  SkillSourceSetDisposition,
  ProfessionTemplateCrosswalkRecord,
  ReservedTemplateIdFact
} from "./catalog";

export type KnownTemplateLookupOutcome<TemplateId, CatalogId, Record> = {
  readonly kind: "known";
  readonly templateId: TemplateId;
  readonly catalogId: CatalogId;
  readonly record: Record;
};

export type NoneTemplateLookupOutcome<TemplateId> = {
  readonly kind: "none";
  readonly templateId: TemplateId;
  readonly catalogId: null;
  readonly record: ProfessionTemplateCrosswalkRecord;
};

export type ReservedTemplateLookupOutcome<TemplateId> = {
  readonly kind: "reserved";
  readonly templateId: TemplateId;
  readonly catalogId: null;
  readonly fact: ReservedTemplateIdFact;
};

export type UnsupportedTemplateLookupOutcome<TemplateId> = {
  readonly kind: "unsupported";
  readonly templateId: TemplateId;
  readonly catalogId: null;
  readonly fact: ReservedTemplateIdFact;
};

export type UnknownTemplateLookupOutcome<TemplateId> = {
  readonly kind: "unknown";
  readonly templateId: TemplateId;
  readonly catalogId: null;
};

export type SkillDispositionLookupOutcome = {
  readonly kind: "dispositioned";
  readonly templateId: TemplateSkillId;
  readonly catalogId: null;
  readonly disposition: SkillSourceSetDisposition;
};

export type RuneDispositionLookupOutcome = {
  readonly kind: "dispositioned";
  readonly templateId: TemplateEquipmentModifierId;
  readonly catalogId: null;
  readonly disposition: RuneSourceSetDisposition;
};

export type InsigniaDispositionLookupOutcome = {
  readonly kind: "dispositioned";
  readonly templateId: TemplateEquipmentModifierId;
  readonly catalogId: null;
  readonly disposition: InsigniaSourceSetDisposition;
};

export type AmbiguousInsigniaTemplateLookupOutcome = {
  readonly kind: "ambiguous";
  readonly templateId: TemplateEquipmentModifierId;
  readonly catalogId: null;
  readonly records: readonly CatalogInsigniaRecord[];
};

export type WeaponDispositionLookupOutcome<TemplateId> = {
  readonly kind: "dispositioned";
  readonly templateId: TemplateId;
  readonly catalogId: null;
  readonly disposition: WeaponSourceSetDisposition;
};

export type AmbiguousWeaponTemplateItemLookupOutcome = {
  readonly kind: "ambiguous";
  readonly templateId: TemplateEquipmentItemId;
  readonly catalogId: null;
  readonly records: readonly CatalogWeaponBaseRecord[];
};

export type AmbiguousWeaponModifierTemplateLookupOutcome = {
  readonly kind: "ambiguous";
  readonly templateId: TemplateEquipmentModifierId;
  readonly catalogId: null;
  readonly records: readonly CatalogWeaponModRecord[];
};

export type EmptySkillSlotLookupOutcome = {
  readonly kind: "empty";
  readonly templateId: TemplateSkillId;
  readonly catalogId: null;
};

export type ProfessionTemplateLookupOutcome =
  | KnownTemplateLookupOutcome<TemplateProfessionId, ProfessionId, CatalogProfessionRecord>
  | NoneTemplateLookupOutcome<TemplateProfessionId>
  | ReservedTemplateLookupOutcome<TemplateProfessionId>
  | UnsupportedTemplateLookupOutcome<TemplateProfessionId>
  | UnknownTemplateLookupOutcome<TemplateProfessionId>;

export type AttributeTemplateLookupOutcome =
  | KnownTemplateLookupOutcome<TemplateAttributeId, AttributeId, CatalogAttributeRecord>
  | ReservedTemplateLookupOutcome<TemplateAttributeId>
  | UnsupportedTemplateLookupOutcome<TemplateAttributeId>
  | UnknownTemplateLookupOutcome<TemplateAttributeId>;

export type SkillTemplateLookupOutcome =
  | KnownTemplateLookupOutcome<TemplateSkillId, SkillId, CatalogSkillRecord>
  | SkillDispositionLookupOutcome
  | UnknownTemplateLookupOutcome<TemplateSkillId>;

export type RuneTemplateModifierLookupOutcome =
  | KnownTemplateLookupOutcome<TemplateEquipmentModifierId, RuneId, CatalogRuneRecord>
  | RuneDispositionLookupOutcome
  | UnknownTemplateLookupOutcome<TemplateEquipmentModifierId>;

export type InsigniaTemplateModifierLookupOutcome =
  | KnownTemplateLookupOutcome<TemplateEquipmentModifierId, InsigniaId, CatalogInsigniaRecord>
  | AmbiguousInsigniaTemplateLookupOutcome
  | InsigniaDispositionLookupOutcome
  | UnknownTemplateLookupOutcome<TemplateEquipmentModifierId>;

export type WeaponTemplateItemLookupOutcome =
  | KnownTemplateLookupOutcome<TemplateEquipmentItemId, WeaponId, CatalogWeaponBaseRecord>
  | AmbiguousWeaponTemplateItemLookupOutcome
  | WeaponDispositionLookupOutcome<TemplateEquipmentItemId>
  | UnknownTemplateLookupOutcome<TemplateEquipmentItemId>;

export type WeaponTemplateModifierLookupOutcome =
  | KnownTemplateLookupOutcome<
      TemplateEquipmentModifierId,
      WeaponModifierId,
      CatalogWeaponModRecord
    >
  | AmbiguousWeaponModifierTemplateLookupOutcome
  | WeaponDispositionLookupOutcome<TemplateEquipmentModifierId>
  | UnknownTemplateLookupOutcome<TemplateEquipmentModifierId>;

export type SkillTemplateSlotLookupOutcome =
  EmptySkillSlotLookupOutcome | SkillTemplateLookupOutcome;

export type SkillModeVariantOutcome =
  | {
      readonly kind: "single";
      readonly skill: CatalogSkillRecord;
      readonly group: null;
    }
  | {
      readonly kind: "variant";
      readonly skill: CatalogSkillRecord;
      readonly group: SkillModeVariantGroup;
      readonly mode: SkillMode;
    }
  | {
      readonly kind: "ambiguous-mode";
      readonly skill: CatalogSkillRecord;
      readonly group: SkillModeVariantGroup;
    }
  | {
      readonly kind: "missing-variant";
      readonly skill: CatalogSkillRecord;
      readonly group: SkillModeVariantGroup;
      readonly mode: SkillMode;
    };

export function lookupProfessionTemplateId(
  catalog: ProfessionAttributeCatalog,
  templateId: TemplateProfessionId
): ProfessionTemplateLookupOutcome {
  const numericTemplateId = Number(templateId);
  const crosswalk = catalog.templateCrosswalk.professionTemplateIds.find(
    (record) => Number(record.templateId) === numericTemplateId
  );
  if (crosswalk?.status === "none") {
    return { kind: "none", templateId, catalogId: null, record: crosswalk };
  }
  if (crosswalk?.status === "known" && crosswalk.catalogId !== null) {
    const record = catalog.professions.find(
      (profession) => Number(profession.id) === Number(crosswalk.catalogId)
    );
    if (record !== undefined) {
      return { kind: "known", templateId, catalogId: record.id, record };
    }
  }

  const fact = reservedFact(catalog, "profession", numericTemplateId);
  if (fact?.status === "reserved") {
    return { kind: "reserved", templateId, catalogId: null, fact };
  }
  if (fact?.status === "unsupported") {
    return { kind: "unsupported", templateId, catalogId: null, fact };
  }
  return { kind: "unknown", templateId, catalogId: null };
}

export function lookupAttributeTemplateId(
  catalog: ProfessionAttributeCatalog,
  templateId: TemplateAttributeId
): AttributeTemplateLookupOutcome {
  const numericTemplateId = Number(templateId);
  const crosswalk = catalog.templateCrosswalk.attributeTemplateIds.find(
    (record) => Number(record.templateId) === numericTemplateId
  );
  if (crosswalk?.status === "known" && crosswalk.catalogId !== null) {
    const record = catalog.attributes.find(
      (attribute) => Number(attribute.id) === Number(crosswalk.catalogId)
    );
    if (record !== undefined) {
      return { kind: "known", templateId, catalogId: record.id, record };
    }
  }

  const fact = reservedFact(catalog, "attribute", numericTemplateId);
  if (fact?.status === "reserved") {
    return { kind: "reserved", templateId, catalogId: null, fact };
  }
  if (fact?.status === "unsupported") {
    return { kind: "unsupported", templateId, catalogId: null, fact };
  }
  return { kind: "unknown", templateId, catalogId: null };
}

export function lookupSkillTemplateId(
  catalog: SkillCatalog,
  templateId: TemplateSkillId
): SkillTemplateLookupOutcome {
  const numericTemplateId = Number(templateId);
  const record = catalog.skills.find((skill) => Number(skill.templateId) === numericTemplateId);
  if (record !== undefined) {
    return { kind: "known", templateId, catalogId: record.id, record };
  }

  const disposition = catalog.dispositions.find(
    (candidate) => Number(candidate.templateId) === numericTemplateId
  );
  if (disposition !== undefined) {
    return { kind: "dispositioned", templateId, catalogId: null, disposition };
  }

  return { kind: "unknown", templateId, catalogId: null };
}

export function lookupRuneTemplateModifierId(
  catalog: RuneCatalog,
  templateId: TemplateEquipmentModifierId
): RuneTemplateModifierLookupOutcome {
  const numericTemplateId = Number(templateId);
  const records = catalog.runes.filter(
    (rune) => Number(rune.templateModifierId) === numericTemplateId
  );
  if (records.length > 1) {
    throw new Error(`Ambiguous rune template modifier ID: ${numericTemplateId}`);
  }
  const record = records[0];
  if (record !== undefined) {
    return { kind: "known", templateId, catalogId: record.id, record };
  }

  const disposition = catalog.dispositions.find(
    (candidate) => Number(candidate.templateModifierId) === numericTemplateId
  );
  if (disposition !== undefined) {
    return { kind: "dispositioned", templateId, catalogId: null, disposition };
  }

  return { kind: "unknown", templateId, catalogId: null };
}

export function lookupInsigniaTemplateModifierId(
  catalog: InsigniaCatalog,
  templateId: TemplateEquipmentModifierId
): InsigniaTemplateModifierLookupOutcome {
  const numericTemplateId = Number(templateId);
  const records = catalog.insignias.filter((insignia) =>
    insignia.templateModifiers.some(
      (crosswalk) =>
        Number(crosswalk.templateModifierId) === numericTemplateId &&
        crosswalk.status === "active" &&
        crosswalk.scope === "armor-prefix"
    )
  );
  if (records.length > 1) {
    return { kind: "ambiguous", templateId, catalogId: null, records };
  }
  const record = records[0];
  if (record !== undefined) {
    return { kind: "known", templateId, catalogId: record.id, record };
  }

  const disposition = catalog.dispositions.find(
    (candidate) => Number(candidate.templateModifierId) === numericTemplateId
  );
  if (disposition !== undefined) {
    return { kind: "dispositioned", templateId, catalogId: null, disposition };
  }

  return { kind: "unknown", templateId, catalogId: null };
}

export function lookupWeaponTemplateItemId(
  catalog: WeaponBaseCatalog,
  templateId: TemplateEquipmentItemId
): WeaponTemplateItemLookupOutcome {
  const numericTemplateId = Number(templateId);
  const records = catalog.weaponBases.filter((weapon) =>
    weapon.templateItems.some(
      (crosswalk) =>
        Number(crosswalk.templateItemId) === numericTemplateId && crosswalk.status === "active"
    )
  );
  if (records.length > 1) {
    return { kind: "ambiguous", templateId, catalogId: null, records };
  }
  const record = records[0];
  if (record !== undefined) {
    return { kind: "known", templateId, catalogId: record.id, record };
  }

  const disposition = catalog.dispositions.find(
    (candidate) => Number(candidate.templateItemId) === numericTemplateId
  );
  if (disposition !== undefined) {
    return { kind: "dispositioned", templateId, catalogId: null, disposition };
  }

  return { kind: "unknown", templateId, catalogId: null };
}

export function lookupWeaponTemplateModifierId(
  catalog: WeaponModCatalog,
  templateId: TemplateEquipmentModifierId
): WeaponTemplateModifierLookupOutcome {
  const numericTemplateId = Number(templateId);
  const records = catalog.weaponMods.filter((modifier) =>
    modifier.templateModifiers.some(
      (crosswalk) =>
        Number(crosswalk.templateModifierId) === numericTemplateId && crosswalk.status === "active"
    )
  );
  if (records.length > 1) {
    return { kind: "ambiguous", templateId, catalogId: null, records };
  }
  const record = records[0];
  if (record !== undefined) {
    return { kind: "known", templateId, catalogId: record.id, record };
  }

  const disposition = catalog.dispositions.find(
    (candidate) => Number(candidate.templateModifierId) === numericTemplateId
  );
  if (disposition !== undefined) {
    return { kind: "dispositioned", templateId, catalogId: null, disposition };
  }

  return { kind: "unknown", templateId, catalogId: null };
}

export function lookupSkillTemplateSlot(
  catalog: SkillCatalog,
  templateId: TemplateSkillId
): SkillTemplateSlotLookupOutcome {
  if (Number(templateId) === 0) {
    return { kind: "empty", templateId, catalogId: null };
  }

  return lookupSkillTemplateId(catalog, templateId);
}

export function lookupSkillById(
  catalog: SkillCatalog,
  skillId: SkillId
): CatalogSkillRecord | null {
  return catalog.skills.find((skill) => Number(skill.id) === Number(skillId)) ?? null;
}

export function lookupRuneById(catalog: RuneCatalog, runeId: RuneId): CatalogRuneRecord | null {
  return catalog.runes.find((rune) => Number(rune.id) === Number(runeId)) ?? null;
}

export function lookupInsigniaById(
  catalog: InsigniaCatalog,
  insigniaId: InsigniaId
): CatalogInsigniaRecord | null {
  return catalog.insignias.find((insignia) => Number(insignia.id) === Number(insigniaId)) ?? null;
}

export function lookupWeaponBaseById(
  catalog: WeaponBaseCatalog,
  weaponId: WeaponId
): CatalogWeaponBaseRecord | null {
  return catalog.weaponBases.find((weapon) => Number(weapon.id) === Number(weaponId)) ?? null;
}

export function lookupWeaponModById(
  catalog: WeaponModCatalog,
  modifierId: WeaponModifierId
): CatalogWeaponModRecord | null {
  return catalog.weaponMods.find((modifier) => Number(modifier.id) === Number(modifierId)) ?? null;
}

export function lookupProfessionByName(
  catalog: ProfessionAttributeCatalog,
  value: string
): CatalogProfessionRecord | null {
  return collisionSafeLookup(
    catalog.professions,
    value,
    (record) => [record.name, record.abbreviation],
    "profession"
  );
}

export function lookupAttributeByName(
  catalog: ProfessionAttributeCatalog,
  value: string
): CatalogAttributeRecord | null {
  return collisionSafeLookup(catalog.attributes, value, (record) => [record.name], "attribute");
}

export function lookupSkillByName(catalog: SkillCatalog, value: string): CatalogSkillRecord | null {
  return collisionSafeLookup(catalog.skills, value, (record) => [record.name], "skill");
}

export function lookupRuneByName(catalog: RuneCatalog, value: string): CatalogRuneRecord | null {
  return collisionSafeLookup(catalog.runes, value, (record) => [record.name], "rune");
}

export function lookupInsigniaByName(
  catalog: InsigniaCatalog,
  value: string
): CatalogInsigniaRecord | null {
  return collisionSafeLookup(
    catalog.insignias,
    value,
    (record) => [record.name, record.normalizedName],
    "insignia"
  );
}

export function lookupWeaponBaseByName(
  catalog: WeaponBaseCatalog,
  value: string
): CatalogWeaponBaseRecord | null {
  return collisionSafeLookup(
    catalog.weaponBases,
    value,
    (record) => [record.name, record.normalizedName],
    "weapon base"
  );
}

export function lookupWeaponModByName(
  catalog: WeaponModCatalog,
  value: string
): CatalogWeaponModRecord | null {
  return collisionSafeLookup(
    catalog.weaponMods,
    value,
    (record) => [record.name, record.normalizedName],
    "weapon modifier"
  );
}

export function resolveSkillModeVariant(
  catalog: SkillCatalog,
  skill: CatalogSkillRecord,
  mode: SkillMode | "unknown"
): SkillModeVariantOutcome {
  if (skill.splitGroupId === null) {
    return { kind: "single", skill, group: null };
  }

  const group = catalog.splitGroups.find((candidate) => candidate.id === skill.splitGroupId);
  if (group === undefined || mode === "unknown") {
    return {
      kind: "ambiguous-mode",
      skill,
      group:
        group ??
        ({
          id: skill.splitGroupId,
          members: [],
          ambiguity: "incomplete-counterpart",
          provenance: { sourceIds: [], claimIds: [], reviewIds: [], notes: "Missing split group." }
        } satisfies SkillModeVariantGroup)
    };
  }

  const member = group.members.find((candidate) => candidate.mode === mode);
  if (member === undefined) {
    return { kind: "missing-variant", skill, group, mode };
  }

  const selected = lookupSkillById(catalog, member.skillId);
  if (selected === null) {
    return { kind: "missing-variant", skill, group, mode };
  }

  return { kind: "variant", skill: selected, group, mode };
}

export function attributeBudgetForLevel(
  catalog: ProfessionAttributeCatalog,
  level: number,
  questBonus: "none" | "maximum-applicable"
): number | null {
  const row = catalog.attributePointRules.levelPointTotals.find((total) => total.level === level);
  if (row === undefined) {
    return null;
  }
  const bonus =
    questBonus === "maximum-applicable"
      ? catalog.attributePointRules.maximumApplicableQuestBonus.points
      : 0;
  return row.cumulativeTotal + bonus;
}

export function purchasedRankCost(
  catalog: ProfessionAttributeCatalog,
  purchasedRank: number
): number | null {
  const row = catalog.attributePointRules.purchasedRankCosts.find(
    (cost) => cost.purchasedRank === purchasedRank
  );
  return row?.cumulativeCost ?? null;
}

function reservedFact(
  catalog: ProfessionAttributeCatalog,
  namespace: "attribute" | "profession",
  templateId: number
): ReservedTemplateIdFact | undefined {
  return catalog.templateCrosswalk.reservedTemplateIds.find(
    (fact) => fact.namespace === namespace && Number(fact.templateId) === templateId
  );
}

function collisionSafeLookup<Record>(
  records: readonly Record[],
  value: string,
  keysForRecord: (record: Record) => readonly string[],
  label: string
): Record | null {
  const key = canonicalLookupKey(value);
  const matches = records.filter((record) =>
    keysForRecord(record).some((candidate) => canonicalLookupKey(candidate) === key)
  );
  if (matches.length > 1) {
    throw new Error(`Ambiguous ${label} lookup key: ${value}`);
  }
  return matches[0] ?? null;
}

function canonicalLookupKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}
