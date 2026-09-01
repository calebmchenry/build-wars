import type { AttributeId, ProfessionId, TemplateAttributeId, TemplateProfessionId } from "./ids";
import type {
  CatalogAttributeRecord,
  CatalogProfessionRecord,
  ProfessionAttributeCatalog,
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
