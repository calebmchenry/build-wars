import { describe, expect, it } from "vitest";

import {
  SOURCE_POLICY_SCHEMA_VERSION,
  type GeneratedArtifactManifest,
  type InsigniaCatalog,
  type ProfessionAttributeCatalog,
  type QaReport,
  type RemoteMediaMetadata,
  type RuneCatalog,
  type SkillCatalog,
  type SourceReference,
  type WeaponBaseCatalog,
  type WeaponModCatalog
} from "../../src/domain";
import professionsAttributesGolden from "../fixtures/data-ingestion/generated/fixture-professions-attributes.catalog.json";
import runesGolden from "../fixtures/data-ingestion/generated/fixture-runes.catalog.json";
import insigniasGolden from "../fixtures/data-ingestion/generated/fixture-insignias.catalog.json";
import weaponModsGolden from "../fixtures/data-ingestion/generated/fixture-weapon-mods.catalog.json";
import weaponsGolden from "../fixtures/data-ingestion/generated/fixture-weapons.catalog.json";
import skillsGolden from "../fixtures/data-ingestion/generated/fixture-skills.catalog.json";
import golden from "../fixtures/data-ingestion/generated/fixture-skill-id-map.json";

function first<T>(items: readonly T[], label: string): T {
  const item = items[0];

  if (item === undefined) {
    throw new Error(`Missing ${label}`);
  }

  return item;
}

describe("data ingestion generated contracts", () => {
  it("keeps the Python golden artifact aligned with source-domain expectations", () => {
    expect(golden.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(golden.records.map((record) => record.skillId)).toEqual([1, 2, 4]);
    expect(golden.parserProof.recommendation).toBe("accept-mwparserfromhell");

    const rawSource = first(golden.sources, "source reference");
    const sourceReference: SourceReference = {
      id: rawSource.id,
      name: rawSource.name,
      family: "guild-wars-wiki",
      canonicalUrl: rawSource.canonicalUrl,
      pageId: rawSource.pageId,
      pageTitle: rawSource.pageTitle,
      fileId: null,
      fileTitle: null,
      revisionId: rawSource.revisionId,
      sourceRevisionTimestamp: rawSource.sourceRevisionTimestamp,
      retrievedAt: rawSource.retrievedAt,
      materialClass: "factual-metadata",
      rightsBasis: "contributor-license-declared",
      useDecision: "allowed",
      license: null,
      notes: rawSource.notes
    };
    expect(sourceReference.id).toBe("source:gww:game-integration-skills-0:1001");

    const rawIcon = first(golden.iconProof, "icon proof");
    const mediaMetadata: RemoteMediaMetadata = {
      id: rawIcon.id,
      kind: "icon",
      sourceId: rawIcon.sourceId,
      fileTitle: rawIcon.fileTitle,
      canonicalUrl: rawIcon.canonicalUrl,
      mimeType: rawIcon.mimeType,
      width: rawIcon.width,
      height: rawIcon.height,
      sizeBytes: rawIcon.sizeBytes,
      remoteTimestamp: rawIcon.remoteTimestamp,
      remoteSha1: rawIcon.remoteSha1,
      cachedBytes: false,
      useDecision: "allowed",
      notes: rawIcon.notes
    };
    expect(mediaMetadata.cachedBytes).toBe(false);
    expect(mediaMetadata.remoteSha1).toHaveLength(40);

    const manifest: GeneratedArtifactManifest = {
      schemaVersion: SOURCE_POLICY_SCHEMA_VERSION,
      artifactPath: "data/generated/epic-02/skill-id-map.fixture.json",
      generatedAt: golden.generatedAt,
      generator: golden.generator,
      inputSnapshotManifestPaths: golden.snapshotManifestPaths,
      sourceIds: golden.sources.map((source) => source.id),
      recordCount: golden.records.length,
      digest: { algorithm: "sha256", value: "0".repeat(64), notes: null },
      qaReportPath: "data/qa/epic-02/skill-id-map.fixture.qa.json",
      commitDecision: "ignored",
      notes: null
    };
    expect(manifest.commitDecision).toBe("ignored");

    const qaReport: QaReport = {
      schemaVersion: SOURCE_POLICY_SCHEMA_VERSION,
      artifactPath: manifest.artifactPath,
      artifactManifestPath: "data/generated/epic-02/skill-id-map.fixture.manifest.json",
      generatedAt: golden.generatedAt,
      generator: golden.generator,
      sourceIds: manifest.sourceIds,
      findings: [],
      summary: {
        findingCount: 0,
        criticalCount: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        openBlockingCount: 0
      },
      appConsumptionGate: "pass",
      publicReleaseGate: "pass",
      notes: null
    };
    expect(qaReport.sourceIds).toEqual(manifest.sourceIds);
  });

  it("keeps the EPIC-03 Python catalog aligned with the TypeScript wire contract", () => {
    const catalog = professionsAttributesGolden as unknown as ProfessionAttributeCatalog;
    const firstSource = first(catalog.sources, "EPIC-03 source reference");
    const firstMedia = first(catalog.remoteMedia, "EPIC-03 remote media");

    expect(catalog.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(catalog.profile.id).toBe("epic-03-professions-attributes");
    expect(catalog.professions).toHaveLength(10);
    expect(catalog.attributes).toHaveLength(42);
    expect(catalog.templateCrosswalk.professionTemplateIds[0]?.catalogId).toBeNull();
    expect(catalog.templateCrosswalk.attributeTemplateIds[0]?.templateId).toBe(0);
    expect(catalog.attributePointRules.defaultPveLevel20.totalWithoutQuestBonus).toBe(170);
    expect(catalog.attributePointRules.defaultPveLevel20.totalWithMaximumQuestBonus).toBe(200);

    const sourceReference: SourceReference = firstSource;
    expect(sourceReference.family).toBe("guild-wars-wiki");

    const mediaMetadata: RemoteMediaMetadata = firstMedia;
    expect(mediaMetadata.kind).toBe("icon");
    expect(mediaMetadata.cachedBytes).toBe(false);
  });

  it("keeps the EPIC-04 Python catalog aligned with the TypeScript wire contract", () => {
    const catalog = skillsGolden as unknown as SkillCatalog;
    const firstSkill = first(catalog.skills, "EPIC-04 skill");

    expect(catalog.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(catalog.profile.id).toBe("epic-04-skills");
    expect(catalog.dependencyDigests[0]?.id).toBe("epic-03-professions-attributes");
    expect(catalog.sourceSet.acceptedSeedCount).toBe(catalog.skills.length);
    expect(firstSkill.templateId).toBe(firstSkill.id);
    expect(firstSkill.description.state).toBe("reviewed-text");
    expect(firstSkill.iconId === null || typeof firstSkill.iconId === "string").toBe(true);
    expect(catalog.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
  });

  it("keeps the EPIC-10 Python rune catalog aligned with the TypeScript wire contract", () => {
    const catalog = runesGolden as unknown as RuneCatalog;
    const superiorSword = catalog.runes.find(
      (rune) => rune.name === "Rune of Superior Swordsmanship"
    );

    expect(catalog.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(catalog.profile.id).toBe("epic-10-runes");
    expect(catalog.dependencyDigests[0]?.id).toBe("epic-03-professions-attributes");
    expect(catalog.sourceSet.acceptedRuneCount).toBe(catalog.runes.length);
    expect(catalog.sourceSet.blockingFindingCount).toBe(0);
    expect(superiorSword?.templateModifierId).toBe(95);
    expect(superiorSword?.effects.map((effect) => effect.kind)).toEqual([
      "attribute-rank",
      "maximum-health-delta"
    ]);
    expect(catalog.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
  });

  it("keeps the EPIC-11 Python insignia catalog aligned with the TypeScript wire contract", () => {
    const catalog = insigniasGolden as unknown as InsigniaCatalog;
    const survivor = catalog.insignias.find((insignia) => insignia.name === "Survivor Insignia");
    const bloodstained = catalog.insignias.find(
      (insignia) => insignia.name === "Bloodstained Insignia"
    );

    expect(catalog.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(catalog.profile.id).toBe("epic-11-insignias");
    expect(catalog.dependencyDigests[0]?.id).toBe("epic-03-professions-attributes");
    expect(catalog.sourceSet.acceptedInsigniaCount).toBe(catalog.insignias.length);
    expect(catalog.sourceSet.blockingFindingCount).toBe(0);
    expect(survivor?.templateModifiers[0]?.templateModifierId).toBe(290);
    expect(survivor?.effects[0]?.kind).toBe("maximum-health-delta");
    expect(bloodstained?.effectCompleteness).toBe("note-only");
    expect(catalog.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
  });

  it("keeps the EPIC-12 Python weapon and modifier catalogs aligned with the TypeScript wire contract", () => {
    const weapons = weaponsGolden as unknown as WeaponBaseCatalog;
    const weaponMods = weaponModsGolden as unknown as WeaponModCatalog;
    const sword = weapons.weaponBases.find((weapon) => weapon.name === "Sword");
    const inscription = weaponMods.weaponMods.find(
      (modifier) => modifier.name === "I Have the Power!"
    );

    expect(weapons.schemaVersion).toBe(SOURCE_POLICY_SCHEMA_VERSION);
    expect(weapons.profile.id).toBe("epic-12-weapons-and-mods");
    expect(weaponMods.profile.id).toBe("epic-12-weapons-and-mods");
    expect(weapons.catalogSetDigest).toBe(weaponMods.catalogSetDigest);
    expect(weapons.releaseSet.weaponModCatalogVersion).toBe(weaponMods.catalogVersion);
    expect(weaponMods.releaseSet.weaponCatalogVersion).toBe(weapons.catalogVersion);
    expect(weapons.sourceSet.acceptedWeaponBaseCount).toBe(weapons.weaponBases.length);
    expect(weaponMods.sourceSet.acceptedWeaponModifierCount).toBe(weaponMods.weaponMods.length);
    expect(sword?.templateItems[0]?.templateItemId).toBe(279);
    expect(sword?.requirement.kind).toBe("attribute-rank");
    expect(inscription?.templateModifiers[0]?.templateModifierId).toBe(329);
    expect(inscription?.effects[0]?.kind).toBe("maximum-energy-delta");
    expect(weapons.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
    expect(weaponMods.remoteMedia.every((media) => media.cachedBytes === false)).toBe(true);
  });
});
