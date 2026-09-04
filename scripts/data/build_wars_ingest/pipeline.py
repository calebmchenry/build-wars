from __future__ import annotations

import json
import re
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Any

from .api import MediaWikiClient
from .artifacts import canonical_json_bytes, compare_baseline, write_generated_artifact
from .attribute_points import extract_attribute_point_rules
from .config import (
    EPIC_04_LIMITS,
    EPIC_10_LIMITS,
    EPIC_11_LIMITS,
    EPIC_12_LIMITS,
    FIXTURE_GENERATED_AT,
    GENERATOR_NAME,
    INGESTION_SCHEMA_VERSION,
    RuntimeRoots,
)
from .icons import candidate_file_titles, resolve_icon_metadata
from .insignia_catalog import assemble_insignia_catalog, manual_reviews as insignia_manual_reviews
from .insignia_extractor import icon_titles_from_detail_pages as insignia_icon_titles_from_detail_pages
from .insignia_source_set import (
    InsigniaSourceSetError,
    build_source_plan as build_insignia_source_plan,
    load_snapshot_set as load_insignia_snapshot_set,
    load_source_plan as load_insignia_source_plan,
    resolution_records_from_pages as insignia_resolution_records_from_pages,
    source_plan_path as insignia_source_plan_output_path,
    validate_source_plan as validate_insignia_source_plan,
    write_snapshot_set_manifest as write_insignia_snapshot_set_manifest,
    write_source_plan as write_insignia_source_plan,
)
from .models import Diagnostic, Evidence, digest_bytes, source_reference
from .profession_attribute_catalog import assemble_profession_attribute_catalog
from .professions_attributes import extract_professions_and_attributes
from .profiles import (
    EPIC_02_PROFILE_ID,
    EPIC_03_ICON_IMAGEINFO_TITLE,
    EPIC_03_PROFILE_ID,
    EPIC_04_PROFESSION_SKILL_LISTS,
    EPIC_04_PROFILE_ID,
    EPIC_04_PVE_ONLY_SKILL_LIST_TITLE,
    EPIC_04_SKILL_ICON_IMAGEINFO_TITLE,
    EPIC_04_SOURCE_INDEX_TITLE,
    EPIC_10_PROFILE_ID,
    EPIC_10_RUNE_ICON_IMAGEINFO_TITLE,
    EPIC_11_INSIGNIA_ICON_IMAGEINFO_TITLE,
    EPIC_11_PROFILE_ID,
    EPIC_12_PROFILE_ID,
    EPIC_12_SOURCE_TITLES,
    EPIC_12_WEAPON_MODS_QA_RELATIVE_PATH,
    EPIC_12_WEAPON_MODS_RELATIVE_PATH,
    profile_by_id,
)
from .qa import build_report, exit_code_for_report, write_report
from .rune_catalog import assemble_rune_catalog, manual_reviews as rune_manual_reviews
from .rune_source_set import (
    RuneSourceSetError,
    build_source_plan as build_rune_source_plan,
    load_snapshot_set as load_rune_snapshot_set,
    load_source_plan as load_rune_source_plan,
    page_snapshot_from_loaded as rune_page_snapshot_from_loaded,
    resolution_records_from_pages as rune_resolution_records_from_pages,
    source_plan_path as rune_source_plan_output_path,
    validate_source_plan as validate_rune_source_plan,
    write_snapshot_set_manifest as write_rune_snapshot_set_manifest,
    write_source_plan as write_rune_source_plan,
)
from .weapon_catalog import assemble_weapon_catalogs, manual_reviews as weapon_manual_reviews
from .weapon_base_extractor import icon_titles_from_detail_pages as weapon_base_icon_titles_from_detail_pages
from .weapon_mod_extractor import icon_titles_from_detail_pages as weapon_mod_icon_titles_from_detail_pages
from .weapon_source_set import (
    EPIC_12_ICON_IMAGEINFO_TITLE as WEAPON_ICON_IMAGEINFO_TITLE,
    WeaponSourceSetError,
    build_source_plan as build_weapon_source_plan,
    load_snapshot_set as load_weapon_snapshot_set,
    load_source_plan as load_weapon_source_plan,
    resolution_records_from_pages as weapon_resolution_records_from_pages,
    source_plan_path as weapon_source_plan_output_path,
    validate_source_plan as validate_weapon_source_plan,
    write_snapshot_set_manifest as write_weapon_snapshot_set_manifest,
    write_source_plan as write_weapon_source_plan,
)
from .skill_catalog import SkillCatalogError, assemble_skill_catalog, load_epic03_dependency
from .skill_ids import SkillIdSource, enumerate_skill_ids
from .skill_source_set import (
    SkillSourceSetError,
    build_source_plan,
    load_snapshot_set,
    load_source_plan,
    ranged_titles_from_index,
    resolution_records_from_pages,
    source_plan_path as source_plan_output_path,
    validate_source_plan,
    write_snapshot_set_manifest,
    write_source_plan,
)
from .snapshots import SnapshotError, SnapshotIdentity, SnapshotStore, SnapshotWriteResult
from .template_ids import extract_template_crosswalk
from .wikitext import parse_wikitext


class PipelineError(RuntimeError):
    pass


@dataclass(frozen=True)
class PipelineOptions:
    mode: str
    output_root: Path
    fixture_root: Path
    profile: str = EPIC_02_PROFILE_ID
    generated_at: str = FIXTURE_GENERATED_AT
    baseline_path: Path | None = None
    allow_live_network: bool = False
    live_titles: tuple[str, ...] = ()
    stage: str = "catalog"
    source_plan_path: Path | None = None
    confirm_source_set_digest: str | None = None
    snapshot_set_path: Path | None = None
    detail_limit: int | None = None


@dataclass(frozen=True)
class PipelineResult:
    artifact_path: Path
    manifest_path: Path
    qa_report_path: Path
    qa_summary_path: Path
    record_count: int
    finding_count: int
    exit_code: int
    generated: dict[str, Any]
    qa_report: dict[str, Any]


def run_pipeline(options: PipelineOptions) -> PipelineResult:
    if options.mode == "fixture":
        return run_fixture(options)
    if options.mode == "offline":
        return run_offline(options)
    if options.mode == "live":
        return run_live(options)
    raise PipelineError(f"Unsupported ingestion mode: {options.mode}")


def run_fixture(options: PipelineOptions) -> PipelineResult:
    if options.profile == EPIC_03_PROFILE_ID:
        return _run_epic03_fixture(options)
    if options.profile == EPIC_04_PROFILE_ID:
        return _run_epic04_fixture(options)
    if options.profile == EPIC_10_PROFILE_ID:
        return _run_epic10_fixture(options)
    if options.profile == EPIC_11_PROFILE_ID:
        return _run_epic11_fixture(options)
    if options.profile == EPIC_12_PROFILE_ID:
        return _run_epic12_fixture(options)

    roots = RuntimeRoots.from_root(options.output_root)
    fixtures = _load_fixtures(options.fixture_root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    diagnostics: list[Diagnostic] = []

    skill_source_ref = _page_source_reference(
        source_id="source:gww:game-integration-skills-0:1001",
        page_title="Guild Wars Wiki:Game integration/Skills/0",
        page_id=9001,
        revision_id=1001,
        source_revision_timestamp="2026-08-31T12:00:00Z",
        retrieved_at=options.generated_at,
    )
    skill_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=skill_source_ref,
        title="Guild Wars Wiki:Game integration/Skills/0",
        page_id=9001,
        revision_id=1001,
        timestamp="2026-08-31T12:00:00Z",
        retrieved_at=options.generated_at,
        content=fixtures["skill_ids"],
    )
    skill_payload = _snapshot_content(snapshot_store, skill_snapshot)
    skill_source = SkillIdSource(
        source_page="Guild Wars Wiki:Game integration/Skills/0",
        source_url=str(skill_source_ref["canonicalUrl"]),
        source_revision_id=1001,
        source_revision_timestamp="2026-08-31T12:00:00Z",
        source_id=str(skill_source_ref["id"]),
        source_reference=skill_source_ref,
    )
    skill_records, skill_diagnostics = enumerate_skill_ids(skill_payload, source=skill_source)
    diagnostics.extend(skill_diagnostics)

    parser_source_ref = _page_source_reference(
        source_id="source:gww:test-skill-parser:2001",
        page_title="Build Wars Parser Fixture Skill",
        page_id=9002,
        revision_id=2001,
        source_revision_timestamp="2026-08-31T12:30:00Z",
        retrieved_at=options.generated_at,
    )
    parser_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=parser_source_ref,
        title="Build Wars Parser Fixture Skill",
        page_id=9002,
        revision_id=2001,
        timestamp="2026-08-31T12:30:00Z",
        retrieved_at=options.generated_at,
        content=fixtures["wikitext"],
    )
    parser_payload = _snapshot_content(snapshot_store, parser_snapshot)
    parser_proof = parse_wikitext(parser_payload, source_label="fixture:wikitext/parser-corpus.wiki")
    diagnostics.extend(parser_proof["diagnostics"])

    icon_source_ref = _page_source_reference(
        source_id="source:gww:icon-imageinfo:3001",
        page_title="File metadata fixture",
        page_id=9003,
        revision_id=3001,
        source_revision_timestamp="2026-08-31T13:00:00Z",
        retrieved_at=options.generated_at,
        material_class="media-metadata",
    )
    icon_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=icon_source_ref,
        title="File metadata fixture",
        page_id=9003,
        revision_id=3001,
        timestamp="2026-08-31T13:00:00Z",
        retrieved_at=options.generated_at,
        content=json.dumps(fixtures["imageinfo"], ensure_ascii=False, sort_keys=True),
    )
    icon_payload = json.loads(_snapshot_content(snapshot_store, icon_snapshot))
    icon_records, icon_diagnostics = _resolve_fixture_icons(
        skill_records=skill_records,
        imageinfo_pages=icon_payload["pages"],
        source_reference=icon_source_ref,
    )
    diagnostics.extend(icon_diagnostics)

    source_ids = [str(skill_source_ref["id"]), str(parser_source_ref["id"]), str(icon_source_ref["id"])]
    snapshot_manifest_paths = [
        _relative_to_root(roots.root, item.manifest_path)
        for item in (skill_snapshot, parser_snapshot, icon_snapshot)
    ]
    generated = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "generationId": "epic-02-fixture",
        "generatedAt": options.generated_at,
        "generator": GENERATOR_NAME,
        "profile": "guild-wars-wiki",
        "sources": [skill_source_ref, parser_source_ref, icon_source_ref],
        "snapshotManifestPaths": snapshot_manifest_paths,
        "records": skill_records,
        "parserProof": _parser_proof_wire(parser_proof),
        "iconProof": icon_records,
    }
    artifact_relative = Path("epic-02/skill-id-map.fixture.json")
    qa_relative = Path("epic-02/skill-id-map.fixture.qa.json")
    diagnostics.extend(compare_baseline(generated, options.baseline_path, artifact_path=artifact_relative.as_posix()))
    artifact_path, manifest_path, manifest = write_generated_artifact(
        root=roots.generated_root,
        relative_path=artifact_relative,
        value=generated,
        generated_at=options.generated_at,
        input_snapshot_manifest_paths=snapshot_manifest_paths,
        source_ids=source_ids,
        record_count=len(skill_records),
        qa_report_path=(Path("data/qa") / qa_relative).as_posix(),
        notes="Fixture skill-id map plus parser and icon proof artifacts for EPIC-02.",
    )
    report = build_report(
        artifact_path=(Path("data/generated") / artifact_relative).as_posix(),
        artifact_manifest_path=(Path("data/generated") / artifact_relative.with_suffix(".manifest.json")).as_posix(),
        generated_at=options.generated_at,
        source_ids=source_ids,
        diagnostics=diagnostics,
        notes="Fixture-mode QA report for EPIC-02 ingestion platform proof artifacts.",
    )
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=qa_relative, report=report)
    result = PipelineResult(
        artifact_path=artifact_path,
        manifest_path=manifest_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=int(manifest["recordCount"]),
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated=generated,
        qa_report=report,
    )
    _run_epic03_fixture(replace(options, profile=EPIC_03_PROFILE_ID))
    _run_epic04_fixture(replace(options, profile=EPIC_04_PROFILE_ID))
    _run_epic10_fixture(replace(options, profile=EPIC_10_PROFILE_ID))
    _run_epic11_fixture(replace(options, profile=EPIC_11_PROFILE_ID))
    _run_epic12_fixture(replace(options, profile=EPIC_12_PROFILE_ID))
    return result


def run_offline(options: PipelineOptions) -> PipelineResult:
    if options.profile == EPIC_03_PROFILE_ID:
        return _run_epic03_offline(options)
    if options.profile == EPIC_04_PROFILE_ID:
        return _run_epic04_offline(options)
    if options.profile == EPIC_10_PROFILE_ID:
        return _run_epic10_offline(options)
    if options.profile == EPIC_11_PROFILE_ID:
        return _run_epic11_offline(options)
    if options.profile == EPIC_12_PROFILE_ID:
        return _run_epic12_offline(options)

    roots = RuntimeRoots.from_root(options.output_root)
    manifests = sorted(roots.snapshot_root.glob("**/*.manifest.json"))
    if not manifests:
        raise PipelineError(f"No offline snapshot manifests found under {roots.snapshot_root}")
    snapshot_store = SnapshotStore(roots.snapshot_root)
    diagnostics: list[Diagnostic] = []
    sources: dict[str, dict[str, Any]] = {}
    records: list[dict[str, Any]] = []
    parser_proofs: list[dict[str, Any]] = []

    for manifest_path in manifests:
        try:
            loaded = snapshot_store.load_snapshot(manifest_path)
        except SnapshotError as exc:
            diagnostics.extend(exc.diagnostics)
            continue
        payload = json.loads(loaded.payload.decode("utf-8"))
        if not isinstance(payload, dict):
            diagnostics.append(
                Diagnostic(
                    code="OFFLINE_SNAPSHOT_SHAPE",
                    severity="error",
                    message="Offline snapshot payload was not an object",
                    category="schema-shape-error",
                    artifact_path=_relative_to_root(roots.root, manifest_path),
                )
            )
            continue
        source_ref = loaded.manifest.get("sourceReference")
        if isinstance(source_ref, dict) and isinstance(source_ref.get("id"), str):
            sources[str(source_ref["id"])] = source_ref
        title = str(payload.get("title", ""))
        content = payload.get("content")
        if not isinstance(content, str):
            diagnostics.append(
                Diagnostic(
                    code="OFFLINE_SNAPSHOT_MISSING_CONTENT",
                    severity="error",
                    message="Offline snapshot payload was missing string content",
                    category="schema-shape-error",
                    artifact_path=_relative_to_root(roots.root, manifest_path),
                )
            )
            continue
        if title == "Guild Wars Wiki:Game integration/Skills/0" and isinstance(source_ref, dict):
            skill_source = SkillIdSource(
                source_page=title,
                source_url=str(source_ref.get("canonicalUrl")),
                source_revision_id=str(source_ref.get("revisionId")),
                source_revision_timestamp=str(source_ref.get("sourceRevisionTimestamp")),
                source_id=str(source_ref.get("id")),
                source_reference=source_ref,
            )
            parsed_records, parsed_diagnostics = enumerate_skill_ids(content, source=skill_source)
            records.extend(parsed_records)
            diagnostics.extend(parsed_diagnostics)
        elif "{{" in content:
            parser_result = parse_wikitext(content, source_label=_relative_to_root(roots.root, manifest_path))
            parser_proofs.append(_parser_proof_wire(parser_result))
            diagnostics.extend(parser_result["diagnostics"])

    records.sort(key=lambda record: (int(record["skillId"]), str(record["title"])))
    source_ids = sorted(sources)
    generated = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "generationId": "epic-02-offline",
        "generatedAt": options.generated_at,
        "generator": GENERATOR_NAME,
        "profile": "guild-wars-wiki",
        "sources": [sources[source_id] for source_id in source_ids],
        "snapshotManifestPaths": [_relative_to_root(roots.root, path) for path in manifests],
        "records": records,
        "parserProofs": parser_proofs,
        "iconProof": [],
    }
    artifact_relative = Path("epic-02/skill-id-map.offline.json")
    qa_relative = Path("epic-02/skill-id-map.offline.qa.json")
    diagnostics.extend(compare_baseline(generated, options.baseline_path, artifact_path=artifact_relative.as_posix()))
    artifact_path, manifest_path, _ = write_generated_artifact(
        root=roots.generated_root,
        relative_path=artifact_relative,
        value=generated,
        generated_at=options.generated_at,
        input_snapshot_manifest_paths=generated["snapshotManifestPaths"],
        source_ids=source_ids,
        record_count=len(records),
        qa_report_path=(Path("data/qa") / qa_relative).as_posix(),
        notes="Offline snapshot-driven EPIC-02 artifact.",
    )
    report = build_report(
        artifact_path=(Path("data/generated") / artifact_relative).as_posix(),
        artifact_manifest_path=(Path("data/generated") / artifact_relative.with_suffix(".manifest.json")).as_posix(),
        generated_at=options.generated_at,
        source_ids=source_ids,
        diagnostics=diagnostics,
        notes="Offline-mode QA report for EPIC-02 ingestion platform.",
    )
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=qa_relative, report=report)
    return PipelineResult(
        artifact_path=artifact_path,
        manifest_path=manifest_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=len(records),
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated=generated,
        qa_report=report,
    )


def run_live(options: PipelineOptions) -> PipelineResult:
    if options.profile == EPIC_03_PROFILE_ID:
        return _run_epic03_live(options)
    if options.profile == EPIC_04_PROFILE_ID:
        return _run_epic04_live(options)
    if options.profile == EPIC_10_PROFILE_ID:
        return _run_epic10_live(options)
    if options.profile == EPIC_11_PROFILE_ID:
        return _run_epic11_live(options)
    if options.profile == EPIC_12_PROFILE_ID:
        return _run_epic12_live(options)

    if not options.allow_live_network:
        raise PipelineError("Live mode requires --allow-live-network")
    if not options.live_titles:
        raise PipelineError("Live mode requires at least one --title value")
    roots = RuntimeRoots.from_root(options.output_root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    client = MediaWikiClient()
    pages, diagnostics = client.query_title_revisions(list(options.live_titles))
    snapshot_results: list[SnapshotWriteResult] = []
    for page in pages:
        revision = _first_revision(page)
        title = str(page.get("title"))
        revision_id = revision.get("revid")
        timestamp = revision.get("timestamp")
        source_ref = _page_source_reference(
            source_id=f"source:gww:live:{page.get('pageid')}:{revision_id}",
            page_title=title,
            page_id=page.get("pageid"),
            revision_id=revision_id,
            source_revision_timestamp=timestamp,
            retrieved_at=options.generated_at,
        )
        content = _revision_content(revision)
        snapshot_results.append(
            _write_page_snapshot(
                snapshot_store=snapshot_store,
                source_reference=source_ref,
                title=title,
                page_id=page.get("pageid"),
                revision_id=revision_id,
                timestamp=timestamp,
                retrieved_at=options.generated_at,
                content=content,
            )
        )
    generated = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "generationId": "epic-02-live-smoke",
        "generatedAt": options.generated_at,
        "generator": GENERATOR_NAME,
        "profile": "guild-wars-wiki",
        "requestCount": client.request_count,
        "snapshotManifestPaths": [_relative_to_root(roots.root, item.manifest_path) for item in snapshot_results],
        "records": [],
        "parserProof": None,
        "iconProof": [],
    }
    artifact_relative = Path("epic-02/live-smoke.json")
    qa_relative = Path("epic-02/live-smoke.qa.json")
    artifact_path, manifest_path, _ = write_generated_artifact(
        root=roots.generated_root,
        relative_path=artifact_relative,
        value=generated,
        generated_at=options.generated_at,
        input_snapshot_manifest_paths=generated["snapshotManifestPaths"],
        source_ids=[],
        record_count=0,
        qa_report_path=(Path("data/qa") / qa_relative).as_posix(),
        notes="Manual bounded live smoke artifact; no normalized catalog records.",
    )
    report = build_report(
        artifact_path=(Path("data/generated") / artifact_relative).as_posix(),
        artifact_manifest_path=(Path("data/generated") / artifact_relative.with_suffix(".manifest.json")).as_posix(),
        generated_at=options.generated_at,
        source_ids=[],
        diagnostics=diagnostics,
        notes="Manual live smoke QA report.",
    )
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=qa_relative, report=report)
    return PipelineResult(
        artifact_path=artifact_path,
        manifest_path=manifest_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=0,
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated=generated,
        qa_report=report,
    )


def _run_epic03_fixture(options: PipelineOptions) -> PipelineResult:
    profile = profile_by_id(EPIC_03_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    page_texts = _load_epic03_fixture_pages(options.fixture_root)
    sources_by_title: dict[str, dict[str, Any]] = {}
    snapshot_manifest_paths: list[str] = []
    for index, title in enumerate(profile.source_titles, start=1):
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-03-fixture:{_safe_source_part(title)}:{4000 + index}",
            page_title=title,
            page_id=9400 + index,
            revision_id=4000 + index,
            source_revision_timestamp=f"2026-08-31T14:0{index}:00Z",
            retrieved_at=options.generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=9400 + index,
            revision_id=4000 + index,
            timestamp=f"2026-08-31T14:0{index}:00Z",
            retrieved_at=options.generated_at,
            content=page_texts[title],
        )
        sources_by_title[title] = source_ref
        snapshot_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))

    imageinfo = json.loads((options.fixture_root / "professions-attributes/imageinfo.json").read_text(encoding="utf-8"))
    imageinfo_source = _page_source_reference(
        source_id="source:gww:epic-03-fixture:profession-icons:4010",
        page_title=EPIC_03_ICON_IMAGEINFO_TITLE,
        page_id=9410,
        revision_id=4010,
        source_revision_timestamp="2026-08-31T14:10:00Z",
        retrieved_at=options.generated_at,
        material_class="media-metadata",
    )
    imageinfo_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=imageinfo_source,
        title=EPIC_03_ICON_IMAGEINFO_TITLE,
        page_id=9410,
        revision_id=4010,
        timestamp="2026-08-31T14:10:00Z",
        retrieved_at=options.generated_at,
        content=json.dumps({"kind": "mediawiki-imageinfo", "title": EPIC_03_ICON_IMAGEINFO_TITLE, "pages": imageinfo["pages"]}, ensure_ascii=False, sort_keys=True),
    )
    sources_by_title[EPIC_03_ICON_IMAGEINFO_TITLE] = imageinfo_source
    snapshot_manifest_paths.append(_relative_to_root(roots.root, imageinfo_snapshot.manifest_path))
    profession_pages = {
        profession: f"{{{{Quotation|game|icon=[[File:{profession}-icon.png|60px]]|Synthetic fixture icon metadata.}}}}"
        for profession in profile.detail_titles
        if profession in page_texts.get("Profession", "")
    }
    return _write_epic03_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        snapshot_manifest_paths=snapshot_manifest_paths,
        page_texts=page_texts,
        sources_by_title=sources_by_title,
        profession_pages=profession_pages,
        imageinfo_pages=imageinfo["pages"],
    )


def _run_epic03_live(options: PipelineOptions) -> PipelineResult:
    if not options.allow_live_network:
        raise PipelineError("Live EPIC-03 mode requires --allow-live-network")
    profile = profile_by_id(EPIC_03_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    client = MediaWikiClient()
    pages, page_diagnostics = client.query_title_revisions(list(profile.all_page_titles))
    if page_diagnostics:
        codes = ", ".join(diagnostic.code for diagnostic in page_diagnostics)
        raise PipelineError(f"Live EPIC-03 source pages had blocking diagnostics: {codes}")

    page_texts: dict[str, str] = {}
    sources_by_title: dict[str, dict[str, Any]] = {}
    snapshot_manifest_paths: list[str] = []
    for page in pages:
        revision = _first_revision(page)
        title = str(page.get("title"))
        revision_id = revision.get("revid")
        timestamp = revision.get("timestamp")
        source_ref = _page_source_reference(
            source_id=f"source:gww:{_safe_source_part(title)}:{revision_id}",
            page_title=title,
            page_id=page.get("pageid"),
            revision_id=revision_id,
            source_revision_timestamp=timestamp,
            retrieved_at=options.generated_at,
        )
        content = _revision_content(revision)
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=page.get("pageid"),
            revision_id=revision_id,
            timestamp=timestamp,
            retrieved_at=options.generated_at,
            content=content,
        )
        page_texts[title] = content
        sources_by_title[title] = source_ref
        snapshot_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))

    profession_pages = {title: page_texts[title] for title in profile.detail_titles if title in page_texts}
    icon_titles = _profession_icon_titles(profession_pages)
    imageinfo_pages, image_diagnostics = client.query_imageinfo(icon_titles)
    if image_diagnostics:
        codes = ", ".join(diagnostic.code for diagnostic in image_diagnostics)
        raise PipelineError(f"Live EPIC-03 icon metadata had blocking diagnostics: {codes}")
    imageinfo_snapshot = _write_imageinfo_snapshot(
        snapshot_store=snapshot_store,
        pages=imageinfo_pages,
        retrieved_at=options.generated_at,
    )
    sources_by_title[EPIC_03_ICON_IMAGEINFO_TITLE] = imageinfo_snapshot.manifest["sourceReference"]
    snapshot_manifest_paths.append(_relative_to_root(roots.root, imageinfo_snapshot.manifest_path))
    return _write_epic03_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        snapshot_manifest_paths=snapshot_manifest_paths,
        page_texts=page_texts,
        sources_by_title=sources_by_title,
        profession_pages=profession_pages,
        imageinfo_pages=imageinfo_pages,
    )


def _run_epic03_offline(options: PipelineOptions) -> PipelineResult:
    profile = profile_by_id(EPIC_03_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    manifests = _selected_epic03_snapshot_manifests(roots.snapshot_root, profile)
    if not manifests:
        raise PipelineError(f"No EPIC-03 offline snapshot manifests found under {roots.snapshot_root}")

    page_texts: dict[str, str] = {}
    sources_by_title: dict[str, dict[str, Any]] = {}
    imageinfo_pages: list[dict[str, Any]] = []
    snapshot_manifest_paths: list[str] = []
    for manifest_path in manifests:
        try:
            loaded = snapshot_store.load_snapshot(manifest_path)
        except SnapshotError as exc:
            raise PipelineError(f"EPIC-03 offline snapshot failed validation: {exc}") from exc
        payload = json.loads(loaded.payload.decode("utf-8"))
        if not isinstance(payload, dict):
            raise PipelineError("EPIC-03 offline snapshot payload was not an object")
        source_ref = loaded.manifest.get("sourceReference")
        if not isinstance(source_ref, dict):
            raise PipelineError("EPIC-03 offline snapshot manifest was missing sourceReference")
        title = str(payload.get("title"))
        sources_by_title[title] = source_ref
        snapshot_manifest_paths.append(_relative_to_root(roots.root, manifest_path))
        content = payload.get("content")
        if title == EPIC_03_ICON_IMAGEINFO_TITLE and isinstance(content, str):
            icon_payload = json.loads(content)
            pages = icon_payload.get("pages") if isinstance(icon_payload, dict) else None
            if isinstance(pages, list):
                imageinfo_pages = [page for page in pages if isinstance(page, dict)]
            continue
        if isinstance(content, str):
            page_texts[title] = content

    missing = [title for title in profile.source_titles if title not in page_texts]
    if missing:
        raise PipelineError(f"EPIC-03 offline snapshots missing required pages: {', '.join(missing)}")
    profession_pages = {title: page_texts[title] for title in profile.detail_titles if title in page_texts}
    return _write_epic03_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        snapshot_manifest_paths=snapshot_manifest_paths,
        page_texts=page_texts,
        sources_by_title=sources_by_title,
        profession_pages=profession_pages,
        imageinfo_pages=imageinfo_pages,
    )


def _run_epic04_fixture(options: PipelineOptions) -> PipelineResult:
    profile = profile_by_id(EPIC_04_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    if not (roots.generated_root / "epic-03/professions-attributes.catalog.json").exists():
        _run_epic03_fixture(replace(options, profile=EPIC_03_PROFILE_ID))

    snapshot_store = SnapshotStore(roots.snapshot_root)
    fixtures = _load_epic04_fixture_pages(options.fixture_root)
    index_source = _page_source_reference(
        source_id="source:gww:epic-04-fixture:index:5001",
        page_title=EPIC_04_SOURCE_INDEX_TITLE,
        page_id=9501,
        revision_id=5001,
        source_revision_timestamp="2026-08-31T15:00:00Z",
        retrieved_at=options.generated_at,
    )
    index_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=index_source,
        title=EPIC_04_SOURCE_INDEX_TITLE,
        page_id=9501,
        revision_id=5001,
        timestamp="2026-08-31T15:00:00Z",
        retrieved_at=options.generated_at,
        content=fixtures["index"],
    )
    child_manifest_paths = [_relative_to_root(roots.root, index_snapshot.manifest_path)]
    index_plan_snapshot = {
        "title": EPIC_04_SOURCE_INDEX_TITLE,
        "content": fixtures["index"],
        "sourceReference": index_source,
    }

    ranged_titles, ranged_diagnostics = ranged_titles_from_index(fixtures["index"])
    range_plan_snapshots: list[dict[str, Any]] = []
    for offset, title in enumerate(ranged_titles, start=1):
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-04-fixture:range:{offset}:50{offset:02d}",
            page_title=title,
            page_id=9510 + offset,
            revision_id=5010 + offset,
            source_revision_timestamp=f"2026-08-31T15:0{offset}:00Z",
            retrieved_at=options.generated_at,
        )
        content = fixtures["ranges"][title]
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=9510 + offset,
            revision_id=5010 + offset,
            timestamp=f"2026-08-31T15:0{offset}:00Z",
            retrieved_at=options.generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        range_plan_snapshots.append({"title": title, "content": content, "sourceReference": source_ref})

    profession_list_plan_snapshots: list[dict[str, Any]] = []
    for offset, (profession_id, slug, title) in enumerate(EPIC_04_PROFESSION_SKILL_LISTS, start=1):
        revision_timestamp = f"2026-08-31T15:{20 + offset:02d}:00Z"
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-04-fixture:profession-list:{slug}:52{offset:02d}",
            page_title=title,
            page_id=9700 + offset,
            revision_id=5200 + offset,
            source_revision_timestamp=revision_timestamp,
            retrieved_at=options.generated_at,
        )
        content = fixtures["professionLists"][title]
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=9700 + offset,
            revision_id=5200 + offset,
            timestamp=revision_timestamp,
            retrieved_at=options.generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        profession_list_plan_snapshots.append(
            {
                "title": title,
                "content": content,
                "sourceReference": source_ref,
                "professionId": profession_id,
            }
        )

    pve_only_source = _page_source_reference(
        source_id="source:gww:epic-04-fixture:pve-only-list:5301",
        page_title=EPIC_04_PVE_ONLY_SKILL_LIST_TITLE,
        page_id=9531,
        revision_id=5301,
        source_revision_timestamp="2026-08-31T15:40:00Z",
        retrieved_at=options.generated_at,
    )
    pve_only_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=pve_only_source,
        title=EPIC_04_PVE_ONLY_SKILL_LIST_TITLE,
        page_id=9531,
        revision_id=5301,
        timestamp="2026-08-31T15:40:00Z",
        retrieved_at=options.generated_at,
        content=fixtures["pveOnlyList"],
    )
    child_manifest_paths.append(_relative_to_root(roots.root, pve_only_snapshot.manifest_path))
    pve_only_plan_snapshot = {
        "title": EPIC_04_PVE_ONLY_SKILL_LIST_TITLE,
        "content": fixtures["pveOnlyList"],
        "sourceReference": pve_only_source,
    }

    plan_result = build_source_plan(
        profile=profile,
        generated_at=options.generated_at,
        index_snapshot=index_plan_snapshot,
        range_snapshots=range_plan_snapshots,
        profession_list_snapshots=profession_list_plan_snapshots,
        pve_only_list_snapshot=pve_only_plan_snapshot,
    )
    plan_path = write_source_plan(roots.root, plan_result.plan)
    diagnostics = [*ranged_diagnostics, *plan_result.diagnostics]

    detail_pages: list[dict[str, Any]] = []
    for seed in plan_result.plan["acceptedSeeds"]:
        title = str(seed["requestedTitle"])
        content = fixtures["details"][title]
        revision_id = 5100 + int(seed["skillId"])
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-04-fixture:skill:{seed['skillId']}:{revision_id}",
            page_title=title,
            page_id=9600 + int(seed["skillId"]),
            revision_id=revision_id,
            source_revision_timestamp="2026-08-31T16:00:00Z",
            retrieved_at=options.generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=9600 + int(seed["skillId"]),
            revision_id=revision_id,
            timestamp="2026-08-31T16:00:00Z",
            retrieved_at=options.generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        detail_pages.append(
            {
                **seed,
                "normalizedTitle": title,
                "canonicalTitle": title,
                "redirectedFrom": None,
                "pageId": 9600 + int(seed["skillId"]),
                "revisionId": revision_id,
                "sourceRevisionTimestamp": "2026-08-31T16:00:00Z",
                "responseIndex": int(seed["skillId"]),
                "disambiguationPreamble": None,
                "content": content,
                "sourceReference": source_ref,
            }
        )

    imageinfo_source = _page_source_reference(
        source_id="source:gww:epic-04-fixture:skill-icons:5200",
        page_title=EPIC_04_SKILL_ICON_IMAGEINFO_TITLE,
        page_id=9520,
        revision_id=5200,
        source_revision_timestamp="2026-08-31T16:10:00Z",
        retrieved_at=options.generated_at,
        material_class="media-metadata",
    )
    imageinfo_payload = {
        "kind": "mediawiki-imageinfo",
        "title": EPIC_04_SKILL_ICON_IMAGEINFO_TITLE,
        "pages": fixtures["imageinfo"]["pages"],
    }
    imageinfo_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=imageinfo_source,
        title=EPIC_04_SKILL_ICON_IMAGEINFO_TITLE,
        page_id=9520,
        revision_id=5200,
        timestamp="2026-08-31T16:10:00Z",
        retrieved_at=options.generated_at,
        content=json.dumps(imageinfo_payload, ensure_ascii=False, sort_keys=True),
    )
    child_manifest_paths.append(_relative_to_root(roots.root, imageinfo_snapshot.manifest_path))
    snapshot_set_manifest_path = write_snapshot_set_manifest(
        root=roots.root,
        profile=profile,
        source_plan=plan_result.plan,
        child_manifest_paths=child_manifest_paths,
        snapshot_store=snapshot_store,
        completion_state="complete",
        generated_at=options.generated_at,
        notes="Complete synthetic EPIC-04 fixture snapshot set.",
        detail_records=detail_pages,
    )
    return _write_epic04_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=plan_result.plan,
        detail_pages=detail_pages,
        imageinfo_pages=fixtures["imageinfo"]["pages"],
        snapshot_set_manifest_path=snapshot_set_manifest_path,
        snapshot_manifest_paths=child_manifest_paths,
        source_plan_path=plan_path,
        diagnostics=diagnostics,
    )


def _run_epic04_live(options: PipelineOptions) -> PipelineResult:
    if not options.allow_live_network:
        raise PipelineError("Live EPIC-04 mode requires --allow-live-network")
    profile = profile_by_id(EPIC_04_PROFILE_ID)
    stage = options.stage
    if stage not in {"discover", "fetch"}:
        raise PipelineError("EPIC-04 live mode requires --stage discover or --stage fetch")

    roots = RuntimeRoots.from_root(options.output_root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    discovered = _discover_epic04_source_set(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        snapshot_store=snapshot_store,
    )
    if stage == "discover":
        return discovered

    if options.source_plan_path is None or options.confirm_source_set_digest is None:
        raise PipelineError("EPIC-04 live fetch requires --source-plan and --confirm-source-set-digest")
    plan = load_source_plan(options.source_plan_path)
    try:
        validate_source_plan(plan, profile=profile, confirm_digest=options.confirm_source_set_digest)
    except SkillSourceSetError as exc:
        raise PipelineError(str(exc)) from exc
    if plan["summary"]["sourceSetDigest"] != discovered.generated["summary"]["sourceSetDigest"]:
        raise PipelineError("EPIC-04 source-set drift detected between discovery and fetch")

    detail_seeds = list(plan["acceptedSeeds"])
    if options.detail_limit is not None:
        detail_seeds = detail_seeds[: options.detail_limit]
    detail_titles = sorted({str(seed["requestedTitle"]) for seed in detail_seeds})
    client = MediaWikiClient(limits=EPIC_04_LIMITS)
    pages, page_diagnostics = client.query_title_revisions(detail_titles)
    resolved, resolution_diagnostics = resolution_records_from_pages(
        plan={**plan, "acceptedSeeds": detail_seeds},
        pages=pages,
    )
    child_manifest_paths = list(discovered.generated["snapshotManifestPaths"])
    detail_pages: list[dict[str, Any]] = []
    for record in resolved:
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-04-live:skill:{record['pageId']}:{record['revisionId']}",
            page_title=str(record["canonicalTitle"]),
            page_id=record["pageId"],
            revision_id=record["revisionId"],
            source_revision_timestamp=str(record["sourceRevisionTimestamp"]),
            retrieved_at=options.generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=str(record["canonicalTitle"]),
            page_id=record["pageId"],
            revision_id=record["revisionId"],
            timestamp=str(record["sourceRevisionTimestamp"]),
            retrieved_at=options.generated_at,
            content=str(record["content"]),
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        detail_pages.append({**record, "sourceReference": source_ref})

    imageinfo_pages: list[dict[str, Any]] = []
    icon_titles = _skill_icon_titles(detail_pages, profile.media_title_limit)
    if icon_titles:
        icon_client = MediaWikiClient(limits=EPIC_04_LIMITS)
        imageinfo_pages, image_diagnostics = icon_client.query_imageinfo(icon_titles)
        page_diagnostics.extend(image_diagnostics)
        imageinfo_snapshot = _write_imageinfo_snapshot_for_epic04(
            snapshot_store=snapshot_store,
            pages=imageinfo_pages,
            retrieved_at=options.generated_at,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, imageinfo_snapshot.manifest_path))

    completion_state = "complete" if options.detail_limit is None else "partial"
    snapshot_set_manifest_path = write_snapshot_set_manifest(
        root=roots.root,
        profile=profile,
        source_plan=plan,
        child_manifest_paths=child_manifest_paths,
        snapshot_store=snapshot_store,
        completion_state=completion_state,
        generated_at=options.generated_at,
        notes="EPIC-04 live snapshot set; partial sets cannot promote." if completion_state != "complete" else "Complete EPIC-04 live snapshot set selected for replay.",
        detail_records=detail_pages,
    )
    if completion_state != "complete":
        raise PipelineError("EPIC-04 live fetch produced a partial snapshot set")

    return _write_epic04_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        snapshot_set_manifest_path=snapshot_set_manifest_path,
        snapshot_manifest_paths=child_manifest_paths,
        source_plan_path=options.source_plan_path,
        diagnostics=[],
    )


def _run_epic04_offline(options: PipelineOptions) -> PipelineResult:
    if options.snapshot_set_path is None:
        raise PipelineError("EPIC-04 offline replay requires --snapshot-set")
    profile = profile_by_id(EPIC_04_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    try:
        replay = load_snapshot_set(
            snapshot_set_manifest_path=options.snapshot_set_path,
            snapshot_root=roots.snapshot_root,
            profile=profile,
        )
    except SkillSourceSetError as exc:
        raise PipelineError(str(exc)) from exc
    source_plan = replay.manifest["sourcePlan"]
    detail_meta = replay.manifest["detailRecords"]
    loaded_by_title: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
    imageinfo_pages: list[dict[str, Any]] = []
    for loaded in replay.loaded_snapshots:
        payload = json.loads(loaded.payload.decode("utf-8"))
        if not isinstance(payload, dict):
            continue
        title = str(payload.get("title"))
        source_ref = loaded.manifest.get("sourceReference")
        if title == EPIC_04_SKILL_ICON_IMAGEINFO_TITLE and isinstance(payload.get("content"), str):
            icon_payload = json.loads(str(payload["content"]))
            pages = icon_payload.get("pages") if isinstance(icon_payload, dict) else None
            if isinstance(pages, list):
                imageinfo_pages = [page for page in pages if isinstance(page, dict)]
            continue
        if isinstance(source_ref, dict):
            loaded_by_title[title] = (payload, source_ref)

    detail_pages: list[dict[str, Any]] = []
    for meta in detail_meta:
        loaded = loaded_by_title.get(str(meta["canonicalTitle"]))
        if loaded is None:
            raise PipelineError(f"EPIC-04 snapshot set missing detail payload for {meta['canonicalTitle']}")
        payload, source_ref = loaded
        detail_pages.append({**meta, "content": payload.get("content", ""), "sourceReference": source_ref})

    return _write_epic04_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=source_plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        snapshot_set_manifest_path=options.snapshot_set_path,
        snapshot_manifest_paths=[str(child["manifestPath"]) for child in replay.manifest["childSnapshots"]],
        source_plan_path=None,
        diagnostics=[],
    )


def _run_epic10_fixture(options: PipelineOptions) -> PipelineResult:
    profile = profile_by_id(EPIC_10_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    if not (roots.generated_root / "epic-03/professions-attributes.catalog.json").exists():
        _run_epic03_fixture(replace(options, profile=EPIC_03_PROFILE_ID))

    dependency = load_epic03_dependency(roots.root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    fixtures = _load_epic10_fixture_pages(options.fixture_root)
    source_snapshots: list[dict[str, Any]] = []
    child_manifest_paths: list[str] = []
    for index, title in enumerate(profile.source_titles, start=1):
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-10-fixture:{_safe_source_part(title)}:{6000 + index}",
            page_title=title,
            page_id=9700 + index,
            revision_id=6000 + index,
            source_revision_timestamp=f"2026-08-31T17:0{index}:00Z",
            retrieved_at=options.generated_at,
        )
        content = fixtures["sources"][title]
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=9700 + index,
            revision_id=6000 + index,
            timestamp=f"2026-08-31T17:0{index}:00Z",
            retrieved_at=options.generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        source_snapshots.append({"title": title, "content": content, "sourceReference": source_ref})

    plan_result = build_rune_source_plan(
        profile=profile,
        generated_at=options.generated_at,
        source_snapshots=source_snapshots,
        dependency=dependency,
    )
    plan_path = write_rune_source_plan(roots.root, plan_result.plan)
    diagnostics = [*plan_result.diagnostics]

    detail_pages: list[dict[str, Any]] = []
    canonical_source_refs: dict[str, dict[str, Any]] = {}
    canonical_indexes: dict[str, int] = {}
    for seed in plan_result.plan["acceptedSeeds"]:
        canonical_title = _epic10_fixture_canonical_title(seed)
        if canonical_title not in canonical_indexes:
            canonical_indexes[canonical_title] = len(canonical_indexes) + 1
        index = canonical_indexes[canonical_title]
        source_ref = canonical_source_refs.get(canonical_title)
        if source_ref is None:
            source_ref = _page_source_reference(
                source_id=f"source:gww:epic-10-fixture:rune:{_safe_source_part(canonical_title)}:{6100 + index}",
                page_title=canonical_title,
                page_id=9800 + index,
                revision_id=6100 + index,
                source_revision_timestamp=f"2026-08-31T18:{index % 60:02d}:00Z",
                retrieved_at=options.generated_at,
            )
            canonical_source_refs[canonical_title] = source_ref
        content = _epic10_fixture_detail_content(fixtures, canonical_title)
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=canonical_title,
            page_id=9800 + index,
            revision_id=6100 + index,
            timestamp=f"2026-08-31T18:{index % 60:02d}:00Z",
            retrieved_at=options.generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        detail_pages.append(
            {
                **seed,
                "normalizedTitle": str(seed["detailTitle"]),
                "canonicalTitle": canonical_title,
                "redirectedFrom": str(seed["detailTitle"]) if canonical_title != seed["detailTitle"] else None,
                "pageId": 9800 + index,
                "revisionId": 6100 + index,
                "sourceRevisionTimestamp": f"2026-08-31T18:{index % 60:02d}:00Z",
                "responseIndex": int(seed["templateModifierId"]),
                "disambiguationPreamble": None,
                "content": content,
                "sourceReference": source_ref,
            }
        )

    imageinfo_source = _page_source_reference(
        source_id="source:gww:epic-10-fixture:rune-icons:6200",
        page_title=EPIC_10_RUNE_ICON_IMAGEINFO_TITLE,
        page_id=9820,
        revision_id=6200,
        source_revision_timestamp="2026-08-31T18:59:00Z",
        retrieved_at=options.generated_at,
        material_class="media-metadata",
    )
    imageinfo_payload = {
        "kind": "mediawiki-imageinfo",
        "title": EPIC_10_RUNE_ICON_IMAGEINFO_TITLE,
        "pages": fixtures["imageinfo"]["pages"],
    }
    imageinfo_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=imageinfo_source,
        title=EPIC_10_RUNE_ICON_IMAGEINFO_TITLE,
        page_id=9820,
        revision_id=6200,
        timestamp="2026-08-31T18:59:00Z",
        retrieved_at=options.generated_at,
        content=json.dumps(imageinfo_payload, ensure_ascii=False, sort_keys=True),
    )
    child_manifest_paths.append(_relative_to_root(roots.root, imageinfo_snapshot.manifest_path))
    snapshot_set_manifest_path = write_rune_snapshot_set_manifest(
        root=roots.root,
        profile=profile,
        source_plan=plan_result.plan,
        child_manifest_paths=child_manifest_paths,
        snapshot_store=snapshot_store,
        completion_state="complete",
        generated_at=options.generated_at,
        notes="Complete synthetic EPIC-10 fixture snapshot set.",
        detail_records=detail_pages,
    )
    return _write_epic10_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=plan_result.plan,
        detail_pages=detail_pages,
        imageinfo_pages=fixtures["imageinfo"]["pages"],
        snapshot_set_manifest_path=snapshot_set_manifest_path,
        snapshot_manifest_paths=child_manifest_paths,
        source_plan_path=plan_path,
        diagnostics=diagnostics,
    )


def _run_epic10_live(options: PipelineOptions) -> PipelineResult:
    if not options.allow_live_network:
        raise PipelineError("Live EPIC-10 mode requires --allow-live-network")
    profile = profile_by_id(EPIC_10_PROFILE_ID)
    stage = options.stage
    if stage not in {"discover", "fetch"}:
        raise PipelineError("EPIC-10 live mode requires --stage discover or --stage fetch")

    roots = RuntimeRoots.from_root(options.output_root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    discovered = _discover_epic10_source_set(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        snapshot_store=snapshot_store,
    )
    if stage == "discover":
        return discovered

    if options.source_plan_path is None or options.confirm_source_set_digest is None:
        raise PipelineError("EPIC-10 live fetch requires --source-plan and --confirm-source-set-digest")
    plan = load_rune_source_plan(options.source_plan_path)
    try:
        validate_rune_source_plan(
            plan,
            profile=profile,
            confirm_source_set_digest=options.confirm_source_set_digest,
        )
    except RuneSourceSetError as exc:
        raise PipelineError(str(exc)) from exc
    if plan["summary"]["sourceSetDigest"] != discovered.generated["summary"]["sourceSetDigest"]:
        raise PipelineError("EPIC-10 source-set drift detected between discovery and fetch")

    detail_seeds = list(plan["acceptedSeeds"])
    if options.detail_limit is not None:
        detail_seeds = detail_seeds[: options.detail_limit]
    detail_titles = sorted({str(seed["detailTitle"]) for seed in detail_seeds})
    client = MediaWikiClient(limits=EPIC_10_LIMITS)
    pages, page_diagnostics = client.query_title_revisions(detail_titles)
    resolved, resolution_diagnostics = rune_resolution_records_from_pages(
        plan={**plan, "acceptedSeeds": detail_seeds},
        pages=pages,
    )
    child_manifest_paths = list(discovered.generated["snapshotManifestPaths"])
    detail_pages: list[dict[str, Any]] = []
    for record in resolved:
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-10-live:rune:{record['pageId']}:{record['revisionId']}",
            page_title=str(record["canonicalTitle"]),
            page_id=record["pageId"],
            revision_id=record["revisionId"],
            source_revision_timestamp=str(record["sourceRevisionTimestamp"]),
            retrieved_at=options.generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=str(record["canonicalTitle"]),
            page_id=record["pageId"],
            revision_id=record["revisionId"],
            timestamp=str(record["sourceRevisionTimestamp"]),
            retrieved_at=options.generated_at,
            content=str(record["content"]),
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        detail_pages.append({**record, "sourceReference": source_ref})

    imageinfo_pages: list[dict[str, Any]] = []
    icon_titles = _rune_icon_titles(detail_pages, profile.media_title_limit)
    if icon_titles:
        icon_client = MediaWikiClient(limits=EPIC_10_LIMITS)
        imageinfo_pages, image_diagnostics = icon_client.query_imageinfo(icon_titles)
        page_diagnostics.extend(image_diagnostics)
        imageinfo_snapshot = _write_imageinfo_snapshot_for_epic10(
            snapshot_store=snapshot_store,
            pages=imageinfo_pages,
            retrieved_at=options.generated_at,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, imageinfo_snapshot.manifest_path))

    completion_state = "complete" if options.detail_limit is None else "partial"
    snapshot_set_manifest_path = write_rune_snapshot_set_manifest(
        root=roots.root,
        profile=profile,
        source_plan=plan,
        child_manifest_paths=child_manifest_paths,
        snapshot_store=snapshot_store,
        completion_state=completion_state,
        generated_at=options.generated_at,
        notes="EPIC-10 live snapshot set; partial sets cannot promote." if completion_state != "complete" else "Complete EPIC-10 live snapshot set selected for replay.",
        detail_records=detail_pages,
    )
    if completion_state != "complete":
        raise PipelineError("EPIC-10 live fetch produced a partial snapshot set")

    return _write_epic10_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        snapshot_set_manifest_path=snapshot_set_manifest_path,
        snapshot_manifest_paths=child_manifest_paths,
        source_plan_path=options.source_plan_path,
        diagnostics=[*page_diagnostics, *resolution_diagnostics],
    )


def _run_epic10_offline(options: PipelineOptions) -> PipelineResult:
    if options.snapshot_set_path is None:
        raise PipelineError("EPIC-10 offline replay requires --snapshot-set")
    profile = profile_by_id(EPIC_10_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    try:
        replay = load_rune_snapshot_set(
            snapshot_set_manifest_path=options.snapshot_set_path,
            snapshot_root=roots.snapshot_root,
            profile=profile,
        )
    except RuneSourceSetError as exc:
        raise PipelineError(str(exc)) from exc
    source_plan = replay.manifest["sourcePlan"]
    detail_meta = replay.manifest["detailRecords"]
    loaded_by_title: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
    imageinfo_pages: list[dict[str, Any]] = []
    for loaded in replay.loaded_snapshots:
        payload = json.loads(loaded.payload.decode("utf-8"))
        if not isinstance(payload, dict):
            continue
        title = str(payload.get("title"))
        source_ref = loaded.manifest.get("sourceReference")
        if title == EPIC_10_RUNE_ICON_IMAGEINFO_TITLE and isinstance(payload.get("content"), str):
            icon_payload = json.loads(str(payload["content"]))
            pages = icon_payload.get("pages") if isinstance(icon_payload, dict) else None
            if isinstance(pages, list):
                imageinfo_pages = [page for page in pages if isinstance(page, dict)]
            continue
        if isinstance(source_ref, dict):
            loaded_by_title[title] = (payload, source_ref)

    detail_pages: list[dict[str, Any]] = []
    for meta in detail_meta:
        loaded = loaded_by_title.get(str(meta["canonicalTitle"]))
        if loaded is None:
            raise PipelineError(f"EPIC-10 snapshot set missing detail payload for {meta['canonicalTitle']}")
        payload, source_ref = loaded
        detail_pages.append({**meta, "content": payload.get("content", ""), "sourceReference": source_ref})

    return _write_epic10_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=source_plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        snapshot_set_manifest_path=options.snapshot_set_path,
        snapshot_manifest_paths=[str(child["manifestPath"]) for child in replay.manifest["childSnapshots"]],
        source_plan_path=None,
        diagnostics=[],
    )


def _run_epic11_fixture(options: PipelineOptions) -> PipelineResult:
    profile = profile_by_id(EPIC_11_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    if not (roots.generated_root / "epic-03/professions-attributes.catalog.json").exists():
        _run_epic03_fixture(replace(options, profile=EPIC_03_PROFILE_ID))

    dependency = _load_epic03_dependency_for_epic11(roots.root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    fixtures = _load_epic11_fixture_pages(options.fixture_root)
    source_snapshots: list[dict[str, Any]] = []
    child_manifest_paths: list[str] = []
    for index, title in enumerate(profile.source_titles, start=1):
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-11-fixture:{_safe_source_part(title)}:{7000 + index}",
            page_title=title,
            page_id=9900 + index,
            revision_id=7000 + index,
            source_revision_timestamp=f"2026-08-31T19:0{index}:00Z",
            retrieved_at=options.generated_at,
        )
        content = fixtures["sources"][title]
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=9900 + index,
            revision_id=7000 + index,
            timestamp=f"2026-08-31T19:0{index}:00Z",
            retrieved_at=options.generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        source_snapshots.append({"title": title, "content": content, "sourceReference": source_ref})

    plan_result = build_insignia_source_plan(
        profile=profile,
        generated_at=options.generated_at,
        source_snapshots=source_snapshots,
        dependency=dependency,
    )
    plan_path = write_insignia_source_plan(roots.root, plan_result.plan)
    diagnostics = [*plan_result.diagnostics]

    detail_pages: list[dict[str, Any]] = []
    for index, seed in enumerate(plan_result.plan["acceptedSeeds"], start=1):
        canonical_title = str(seed["detailTitle"])
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-11-fixture:insignia:{_safe_source_part(canonical_title)}:{7100 + index}",
            page_title=canonical_title,
            page_id=10000 + index,
            revision_id=7100 + index,
            source_revision_timestamp=f"2026-08-31T20:{index % 60:02d}:00Z",
            retrieved_at=options.generated_at,
        )
        content = _epic11_fixture_detail_content(fixtures, canonical_title)
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=canonical_title,
            page_id=10000 + index,
            revision_id=7100 + index,
            timestamp=f"2026-08-31T20:{index % 60:02d}:00Z",
            retrieved_at=options.generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        detail_pages.append(
            {
                **seed,
                "normalizedTitle": canonical_title,
                "canonicalTitle": canonical_title,
                "redirectedFrom": None,
                "pageId": 10000 + index,
                "revisionId": 7100 + index,
                "sourceRevisionTimestamp": f"2026-08-31T20:{index % 60:02d}:00Z",
                "responseIndex": int(seed["id"]),
                "disambiguationPreamble": None,
                "content": content,
                "sourceReference": source_ref,
            }
        )

    imageinfo_source = _page_source_reference(
        source_id="source:gww:epic-11-fixture:insignia-icons:7200",
        page_title=EPIC_11_INSIGNIA_ICON_IMAGEINFO_TITLE,
        page_id=10080,
        revision_id=7200,
        source_revision_timestamp="2026-08-31T20:59:00Z",
        retrieved_at=options.generated_at,
        material_class="media-metadata",
    )
    imageinfo_payload = {
        "kind": "mediawiki-imageinfo",
        "title": EPIC_11_INSIGNIA_ICON_IMAGEINFO_TITLE,
        "pages": fixtures["imageinfo"]["pages"],
    }
    imageinfo_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=imageinfo_source,
        title=EPIC_11_INSIGNIA_ICON_IMAGEINFO_TITLE,
        page_id=10080,
        revision_id=7200,
        timestamp="2026-08-31T20:59:00Z",
        retrieved_at=options.generated_at,
        content=json.dumps(imageinfo_payload, ensure_ascii=False, sort_keys=True),
    )
    child_manifest_paths.append(_relative_to_root(roots.root, imageinfo_snapshot.manifest_path))
    snapshot_set_manifest_path = write_insignia_snapshot_set_manifest(
        root=roots.root,
        profile=profile,
        source_plan=plan_result.plan,
        child_manifest_paths=child_manifest_paths,
        snapshot_store=snapshot_store,
        completion_state="complete",
        generated_at=options.generated_at,
        notes="Complete synthetic EPIC-11 fixture snapshot set.",
        detail_records=detail_pages,
    )
    return _write_epic11_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=plan_result.plan,
        detail_pages=detail_pages,
        imageinfo_pages=fixtures["imageinfo"]["pages"],
        snapshot_set_manifest_path=snapshot_set_manifest_path,
        snapshot_manifest_paths=child_manifest_paths,
        source_plan_path=plan_path,
        diagnostics=diagnostics,
    )


def _run_epic11_live(options: PipelineOptions) -> PipelineResult:
    if not options.allow_live_network:
        raise PipelineError("Live EPIC-11 mode requires --allow-live-network")
    profile = profile_by_id(EPIC_11_PROFILE_ID)
    stage = options.stage
    if stage not in {"discover", "fetch"}:
        raise PipelineError("EPIC-11 live mode requires --stage discover or --stage fetch")

    roots = RuntimeRoots.from_root(options.output_root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    discovered = _discover_epic11_source_set(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        snapshot_store=snapshot_store,
    )
    if stage == "discover":
        return discovered

    if options.source_plan_path is None or options.confirm_source_set_digest is None:
        raise PipelineError("EPIC-11 live fetch requires --source-plan and --confirm-source-set-digest")
    plan = load_insignia_source_plan(options.source_plan_path)
    try:
        validate_insignia_source_plan(
            plan,
            profile=profile,
            confirm_source_set_digest=options.confirm_source_set_digest,
        )
    except InsigniaSourceSetError as exc:
        raise PipelineError(str(exc)) from exc
    if plan["summary"]["sourceSetDigest"] != discovered.generated["summary"]["sourceSetDigest"]:
        raise PipelineError("EPIC-11 source-set drift detected between discovery and fetch")

    detail_seeds = list(plan["acceptedSeeds"])
    if options.detail_limit is not None:
        detail_seeds = detail_seeds[: options.detail_limit]
    detail_titles = sorted({str(seed["detailTitle"]) for seed in detail_seeds})
    client = MediaWikiClient(limits=EPIC_11_LIMITS)
    pages, page_diagnostics = client.query_title_revisions(detail_titles)
    resolved, resolution_diagnostics = insignia_resolution_records_from_pages(
        plan={**plan, "acceptedSeeds": detail_seeds},
        pages=pages,
    )
    child_manifest_paths = list(discovered.generated["snapshotManifestPaths"])
    detail_pages: list[dict[str, Any]] = []
    for record in resolved:
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-11-live:insignia:{record['pageId']}:{record['revisionId']}",
            page_title=str(record["canonicalTitle"]),
            page_id=record["pageId"],
            revision_id=record["revisionId"],
            source_revision_timestamp=str(record["sourceRevisionTimestamp"]),
            retrieved_at=options.generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=str(record["canonicalTitle"]),
            page_id=record["pageId"],
            revision_id=record["revisionId"],
            timestamp=str(record["sourceRevisionTimestamp"]),
            retrieved_at=options.generated_at,
            content=str(record["content"]),
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        detail_pages.append({**record, "sourceReference": source_ref})

    imageinfo_pages: list[dict[str, Any]] = []
    icon_titles = insignia_icon_titles_from_detail_pages(detail_pages, profile.media_title_limit)
    if icon_titles:
        icon_client = MediaWikiClient(limits=EPIC_11_LIMITS)
        imageinfo_pages, image_diagnostics = icon_client.query_imageinfo(icon_titles)
        page_diagnostics.extend(image_diagnostics)
        imageinfo_snapshot = _write_imageinfo_snapshot_for_epic11(
            snapshot_store=snapshot_store,
            pages=imageinfo_pages,
            retrieved_at=options.generated_at,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, imageinfo_snapshot.manifest_path))

    completion_state = "complete" if options.detail_limit is None else "partial"
    snapshot_set_manifest_path = write_insignia_snapshot_set_manifest(
        root=roots.root,
        profile=profile,
        source_plan=plan,
        child_manifest_paths=child_manifest_paths,
        snapshot_store=snapshot_store,
        completion_state=completion_state,
        generated_at=options.generated_at,
        notes="EPIC-11 live snapshot set; partial sets cannot promote." if completion_state != "complete" else "Complete EPIC-11 live snapshot set selected for replay.",
        detail_records=detail_pages,
    )
    if completion_state != "complete":
        raise PipelineError("EPIC-11 live fetch produced a partial snapshot set")

    return _write_epic11_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        snapshot_set_manifest_path=snapshot_set_manifest_path,
        snapshot_manifest_paths=child_manifest_paths,
        source_plan_path=options.source_plan_path,
        diagnostics=[*page_diagnostics, *resolution_diagnostics],
    )


def _run_epic11_offline(options: PipelineOptions) -> PipelineResult:
    if options.snapshot_set_path is None:
        raise PipelineError("EPIC-11 offline replay requires --snapshot-set")
    profile = profile_by_id(EPIC_11_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    try:
        replay = load_insignia_snapshot_set(
            snapshot_set_manifest_path=options.snapshot_set_path,
            snapshot_root=roots.snapshot_root,
            profile=profile,
        )
    except InsigniaSourceSetError as exc:
        raise PipelineError(str(exc)) from exc
    source_plan = replay.manifest["sourcePlan"]
    detail_meta = replay.manifest["detailRecords"]
    loaded_by_title: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
    imageinfo_pages: list[dict[str, Any]] = []
    for loaded in replay.loaded_snapshots:
        payload = json.loads(loaded.payload.decode("utf-8"))
        if not isinstance(payload, dict):
            continue
        title = str(payload.get("title"))
        source_ref = loaded.manifest.get("sourceReference")
        if title == EPIC_11_INSIGNIA_ICON_IMAGEINFO_TITLE and isinstance(payload.get("content"), str):
            icon_payload = json.loads(str(payload["content"]))
            pages = icon_payload.get("pages") if isinstance(icon_payload, dict) else None
            if isinstance(pages, list):
                imageinfo_pages = [page for page in pages if isinstance(page, dict)]
            continue
        if isinstance(source_ref, dict):
            loaded_by_title[title] = (payload, source_ref)

    detail_pages: list[dict[str, Any]] = []
    for meta in detail_meta:
        loaded = loaded_by_title.get(str(meta["canonicalTitle"]))
        if loaded is None:
            raise PipelineError(f"EPIC-11 snapshot set missing detail payload for {meta['canonicalTitle']}")
        payload, source_ref = loaded
        detail_pages.append({**meta, "content": payload.get("content", ""), "sourceReference": source_ref})

    return _write_epic11_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=source_plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        snapshot_set_manifest_path=options.snapshot_set_path,
        snapshot_manifest_paths=[str(child["manifestPath"]) for child in replay.manifest["childSnapshots"]],
        source_plan_path=None,
        diagnostics=[],
    )


def _run_epic12_fixture(options: PipelineOptions) -> PipelineResult:
    profile = profile_by_id(EPIC_12_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    if not (roots.generated_root / "epic-03/professions-attributes.catalog.json").exists():
        _run_epic03_fixture(replace(options, profile=EPIC_03_PROFILE_ID))

    dependency = _load_epic03_dependency_for_epic11(roots.root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    fixtures = _load_epic12_fixture_pages(options.fixture_root)
    source_snapshots: list[dict[str, Any]] = []
    child_manifest_paths: list[str] = []
    for index, title in enumerate(profile.source_titles, start=1):
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-12-fixture:{_safe_source_part(title)}:{8000 + index}",
            page_title=title,
            page_id=11000 + index,
            revision_id=8000 + index,
            source_revision_timestamp=f"2026-08-31T21:0{index}:00Z",
            retrieved_at=options.generated_at,
        )
        content = fixtures["sources"][title]
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=11000 + index,
            revision_id=8000 + index,
            timestamp=f"2026-08-31T21:0{index}:00Z",
            retrieved_at=options.generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        source_snapshots.append({"title": title, "content": content, "sourceReference": source_ref})

    plan_result = build_weapon_source_plan(
        profile=profile,
        generated_at=options.generated_at,
        source_snapshots=source_snapshots,
        dependency=dependency,
    )
    plan_path = write_weapon_source_plan(roots.root, plan_result.plan)
    diagnostics = [*plan_result.diagnostics]
    detail_pages: dict[str, list[dict[str, Any]]] = {"weaponBases": [], "weaponModifiers": []}
    detail_snapshots: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
    for index, title in enumerate(plan_result.plan["detailPageTitles"], start=1):
        content = _epic12_fixture_detail_content(fixtures, str(title))
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-12-fixture:detail:{_safe_source_part(str(title))}:{8100 + index}",
            page_title=str(title),
            page_id=11100 + index,
            revision_id=8100 + index,
            source_revision_timestamp=f"2026-08-31T22:{index % 60:02d}:00Z",
            retrieved_at=options.generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=str(title),
            page_id=11100 + index,
            revision_id=8100 + index,
            timestamp=f"2026-08-31T22:{index % 60:02d}:00Z",
            retrieved_at=options.generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        detail_snapshots[str(title)] = (
            {
                "normalizedTitle": str(title),
                "canonicalTitle": str(title),
                "redirectedFrom": None,
                "pageId": 11100 + index,
                "revisionId": 8100 + index,
                "sourceRevisionTimestamp": f"2026-08-31T22:{index % 60:02d}:00Z",
                "responseIndex": index,
                "disambiguationPreamble": None,
                "content": content,
            },
            source_ref,
        )
    for collection_key, output_key in (("acceptedWeaponBases", "weaponBases"), ("acceptedWeaponModifiers", "weaponModifiers")):
        for seed in plan_result.plan[collection_key]:
            detail_meta, source_ref = detail_snapshots[str(seed["detailTitle"])]
            detail_pages[output_key].append({**seed, **detail_meta, "sourceReference": source_ref})

    imageinfo_source = _page_source_reference(
        source_id="source:gww:epic-12-fixture:weapon-icons:8200",
        page_title=WEAPON_ICON_IMAGEINFO_TITLE,
        page_id=11220,
        revision_id=8200,
        source_revision_timestamp="2026-08-31T22:59:00Z",
        retrieved_at=options.generated_at,
        material_class="media-metadata",
    )
    imageinfo_payload = {
        "kind": "mediawiki-imageinfo",
        "title": WEAPON_ICON_IMAGEINFO_TITLE,
        "pages": fixtures["imageinfo"]["pages"],
    }
    imageinfo_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=imageinfo_source,
        title=WEAPON_ICON_IMAGEINFO_TITLE,
        page_id=11220,
        revision_id=8200,
        timestamp="2026-08-31T22:59:00Z",
        retrieved_at=options.generated_at,
        content=json.dumps(imageinfo_payload, ensure_ascii=False, sort_keys=True),
    )
    child_manifest_paths.append(_relative_to_root(roots.root, imageinfo_snapshot.manifest_path))
    snapshot_set_manifest_path = write_weapon_snapshot_set_manifest(
        root=roots.root,
        profile=profile,
        source_plan=plan_result.plan,
        child_manifest_paths=child_manifest_paths,
        snapshot_store=snapshot_store,
        completion_state="complete",
        generated_at=options.generated_at,
        notes="Complete synthetic EPIC-12 fixture snapshot set.",
        detail_records=detail_pages,
    )
    return _write_epic12_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=plan_result.plan,
        detail_pages=detail_pages,
        imageinfo_pages=fixtures["imageinfo"]["pages"],
        snapshot_set_manifest_path=snapshot_set_manifest_path,
        snapshot_manifest_paths=child_manifest_paths,
        source_plan_path=plan_path,
        diagnostics=diagnostics,
    )


def _run_epic12_live(options: PipelineOptions) -> PipelineResult:
    if not options.allow_live_network:
        raise PipelineError("Live EPIC-12 mode requires --allow-live-network")
    profile = profile_by_id(EPIC_12_PROFILE_ID)
    stage = options.stage
    if stage not in {"discover", "fetch"}:
        raise PipelineError("EPIC-12 live mode requires --stage discover or --stage fetch")

    roots = RuntimeRoots.from_root(options.output_root)
    snapshot_store = SnapshotStore(roots.snapshot_root)
    discovered = _discover_epic12_source_set(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        snapshot_store=snapshot_store,
    )
    if stage == "discover":
        return discovered

    if options.source_plan_path is None or options.confirm_source_set_digest is None:
        raise PipelineError("EPIC-12 live fetch requires --source-plan and --confirm-source-set-digest")
    plan = load_weapon_source_plan(options.source_plan_path)
    try:
        validate_weapon_source_plan(
            plan,
            profile=profile,
            confirm_source_set_digest=options.confirm_source_set_digest,
        )
    except WeaponSourceSetError as exc:
        raise PipelineError(str(exc)) from exc
    if plan["summary"]["sourceSetDigest"] != discovered.generated["summary"]["sourceSetDigest"]:
        raise PipelineError("EPIC-12 source-set drift detected between discovery and fetch")

    detail_titles = list(plan["detailPageTitles"])
    if options.detail_limit is not None:
        detail_titles = detail_titles[: options.detail_limit]
    client = MediaWikiClient(limits=EPIC_12_LIMITS)
    pages, page_diagnostics = client.query_title_revisions([str(title) for title in detail_titles])
    resolved, resolution_diagnostics = weapon_resolution_records_from_pages(
        plan=plan,
        pages=pages,
    )
    child_manifest_paths = list(discovered.generated["snapshotManifestPaths"])
    detail_pages: dict[str, list[dict[str, Any]]] = {"weaponBases": [], "weaponModifiers": []}
    seed_source_refs_by_title: dict[str, dict[str, Any]] = {}
    for manifest_path in child_manifest_paths:
        try:
            loaded = snapshot_store.load_snapshot(roots.root / manifest_path)
        except SnapshotError as exc:
            raise PipelineError(f"EPIC-12 seed snapshot failed validation during fetch: {exc}") from exc
        payload = json.loads(loaded.payload.decode("utf-8"))
        source_ref = loaded.manifest.get("sourceReference")
        if isinstance(payload, dict) and isinstance(source_ref, dict):
            seed_source_refs_by_title[str(payload.get("title"))] = source_ref
    source_refs_by_title: dict[str, dict[str, Any]] = {}
    snapshot_paths_by_title: dict[str, str] = {}
    for output_key in ("weaponBases", "weaponModifiers"):
        for record in resolved[output_key]:
            canonical_title = str(record["canonicalTitle"])
            source_ref = source_refs_by_title.get(canonical_title)
            if source_ref is None:
                seed_source_ref = seed_source_refs_by_title.get(canonical_title)
                if seed_source_ref is not None:
                    if str(seed_source_ref.get("revisionId")) != str(record["revisionId"]):
                        raise PipelineError(f"EPIC-12 seed/detail revision drift for {canonical_title}")
                    source_ref = seed_source_ref
                else:
                    source_ref = _page_source_reference(
                        source_id=f"source:gww:epic-12-live:detail:{record['pageId']}:{record['revisionId']}",
                        page_title=canonical_title,
                        page_id=record["pageId"],
                        revision_id=record["revisionId"],
                        source_revision_timestamp=str(record["sourceRevisionTimestamp"]),
                        retrieved_at=options.generated_at,
                    )
                    snapshot = _write_page_snapshot(
                        snapshot_store=snapshot_store,
                        source_reference=source_ref,
                        title=canonical_title,
                        page_id=record["pageId"],
                        revision_id=record["revisionId"],
                        timestamp=str(record["sourceRevisionTimestamp"]),
                        retrieved_at=options.generated_at,
                        content=str(record["content"]),
                    )
                    snapshot_paths_by_title[canonical_title] = _relative_to_root(roots.root, snapshot.manifest_path)
                source_refs_by_title[canonical_title] = source_ref
                if canonical_title in snapshot_paths_by_title:
                    child_manifest_paths.append(snapshot_paths_by_title[canonical_title])
            detail_pages[output_key].append({**record, "sourceReference": source_ref})

    imageinfo_pages: list[dict[str, Any]] = []
    icon_titles = sorted(
        set(weapon_base_icon_titles_from_detail_pages(detail_pages["weaponBases"], profile.media_title_limit))
        | set(weapon_mod_icon_titles_from_detail_pages(detail_pages["weaponModifiers"], profile.media_title_limit))
    )[: profile.media_title_limit]
    if icon_titles:
        icon_client = MediaWikiClient(limits=EPIC_12_LIMITS)
        imageinfo_pages, image_diagnostics = icon_client.query_imageinfo(icon_titles)
        page_diagnostics.extend(image_diagnostics)
        imageinfo_snapshot = _write_imageinfo_snapshot_for_epic12(
            snapshot_store=snapshot_store,
            pages=imageinfo_pages,
            retrieved_at=options.generated_at,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, imageinfo_snapshot.manifest_path))

    completion_state = "complete" if options.detail_limit is None else "partial"
    snapshot_set_manifest_path = write_weapon_snapshot_set_manifest(
        root=roots.root,
        profile=profile,
        source_plan=plan,
        child_manifest_paths=child_manifest_paths,
        snapshot_store=snapshot_store,
        completion_state=completion_state,
        generated_at=options.generated_at,
        notes="EPIC-12 live snapshot set; partial sets cannot promote." if completion_state != "complete" else "Complete EPIC-12 live snapshot set selected for replay.",
        detail_records=detail_pages,
    )
    if completion_state != "complete":
        raise PipelineError("EPIC-12 live fetch produced a partial snapshot set")

    return _write_epic12_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        snapshot_set_manifest_path=snapshot_set_manifest_path,
        snapshot_manifest_paths=child_manifest_paths,
        source_plan_path=options.source_plan_path,
        diagnostics=[*page_diagnostics, *resolution_diagnostics],
    )


def _run_epic12_offline(options: PipelineOptions) -> PipelineResult:
    if options.snapshot_set_path is None:
        raise PipelineError("EPIC-12 offline replay requires --snapshot-set")
    profile = profile_by_id(EPIC_12_PROFILE_ID)
    roots = RuntimeRoots.from_root(options.output_root)
    try:
        replay = load_weapon_snapshot_set(
            snapshot_set_manifest_path=options.snapshot_set_path,
            snapshot_root=roots.snapshot_root,
            profile=profile,
        )
    except WeaponSourceSetError as exc:
        raise PipelineError(str(exc)) from exc
    source_plan = replay.manifest["sourcePlan"]
    detail_meta = replay.manifest["detailRecords"]
    loaded_by_title: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
    imageinfo_pages: list[dict[str, Any]] = []
    for loaded in replay.loaded_snapshots:
        payload = json.loads(loaded.payload.decode("utf-8"))
        if not isinstance(payload, dict):
            continue
        title = str(payload.get("title"))
        source_ref = loaded.manifest.get("sourceReference")
        if title == WEAPON_ICON_IMAGEINFO_TITLE and isinstance(payload.get("content"), str):
            icon_payload = json.loads(str(payload["content"]))
            pages = icon_payload.get("pages") if isinstance(icon_payload, dict) else None
            if isinstance(pages, list):
                imageinfo_pages = [page for page in pages if isinstance(page, dict)]
            continue
        if isinstance(source_ref, dict):
            loaded_by_title[title] = (payload, source_ref)

    detail_pages: dict[str, list[dict[str, Any]]] = {"weaponBases": [], "weaponModifiers": []}
    for input_key, output_key in (("weaponBases", "weaponBases"), ("weaponModifiers", "weaponModifiers")):
        for meta in detail_meta[input_key]:
            loaded = loaded_by_title.get(str(meta["canonicalTitle"]))
            if loaded is None:
                raise PipelineError(f"EPIC-12 snapshot set missing detail payload for {meta['canonicalTitle']}")
            payload, source_ref = loaded
            seed = _seed_for_detail_record(source_plan, str(meta["sourceKey"]), output_key)
            detail_pages[output_key].append({**seed, **meta, "content": payload.get("content", ""), "sourceReference": source_ref})

    return _write_epic12_catalog_result(
        roots=roots,
        profile=profile,
        generated_at=options.generated_at,
        source_plan=source_plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        snapshot_set_manifest_path=options.snapshot_set_path,
        snapshot_manifest_paths=[str(child["manifestPath"]) for child in replay.manifest["childSnapshots"]],
        source_plan_path=None,
        diagnostics=[],
    )


def _discover_epic12_source_set(
    *,
    roots: RuntimeRoots,
    profile: Any,
    generated_at: str,
    snapshot_store: SnapshotStore,
) -> PipelineResult:
    dependency = _load_epic03_dependency_for_epic11(roots.root)
    client = MediaWikiClient(limits=EPIC_12_LIMITS)
    source_pages, source_diagnostics = client.query_title_revisions(list(profile.source_titles))
    if len(source_pages) != len(profile.source_titles):
        raise PipelineError("EPIC-12 source authority pages could not all be fetched")

    source_snapshots: list[dict[str, Any]] = []
    child_manifest_paths: list[str] = []
    for page in source_pages:
        revision = _first_revision(page)
        title = str(page.get("_buildWarsRequestedTitle") or page.get("title"))
        content = _revision_content(revision)
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-12-live:seed:{_safe_source_part(title)}:{revision.get('revid')}",
            page_title=title,
            page_id=page.get("pageid"),
            revision_id=revision.get("revid"),
            source_revision_timestamp=revision.get("timestamp"),
            retrieved_at=generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=page.get("pageid"),
            revision_id=revision.get("revid"),
            timestamp=revision.get("timestamp"),
            retrieved_at=generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        source_snapshots.append({"title": title, "content": content, "sourceReference": source_ref})

    plan_result = build_weapon_source_plan(
        profile=profile,
        generated_at=generated_at,
        source_snapshots=source_snapshots,
        dependency=dependency,
    )
    plan_path = write_weapon_source_plan(roots.root, plan_result.plan)
    diagnostics = [*source_diagnostics, *plan_result.diagnostics]
    report = build_report(
        artifact_path=_relative_to_root(roots.root, plan_path),
        artifact_manifest_path=None,
        generated_at=generated_at,
        source_ids=[snapshot["sourceReference"]["id"] for snapshot in source_snapshots],
        diagnostics=diagnostics,
        notes="EPIC-12 discover-only source-plan QA report.",
    )
    qa_relative = Path("epic-12/weapons-mods.source-plan.qa.json")
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=qa_relative, report=report)
    return PipelineResult(
        artifact_path=plan_path,
        manifest_path=plan_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=int(plan_result.plan["summary"]["acceptedWeaponBaseCount"]) + int(plan_result.plan["summary"]["acceptedWeaponModifierCount"]),
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated={**plan_result.plan, "snapshotManifestPaths": child_manifest_paths},
        qa_report=report,
    )


def _write_epic12_catalog_result(
    *,
    roots: RuntimeRoots,
    profile: Any,
    generated_at: str,
    source_plan: dict[str, Any],
    detail_pages: dict[str, list[dict[str, Any]]],
    imageinfo_pages: list[dict[str, Any]],
    snapshot_set_manifest_path: Path,
    snapshot_manifest_paths: list[str],
    source_plan_path: Path | None,
    diagnostics: list[Diagnostic],
) -> PipelineResult:
    dependency = _load_epic03_dependency_for_epic11(roots.root)
    snapshot_set_digest = digest_bytes(snapshot_set_manifest_path.read_bytes())
    assembled = assemble_weapon_catalogs(
        profile=profile,
        generated_at=generated_at,
        source_plan=source_plan,
        base_detail_pages=detail_pages["weaponBases"],
        modifier_detail_pages=detail_pages["weaponModifiers"],
        imageinfo_pages=imageinfo_pages,
        dependency=dependency,
        snapshot_set_digest=snapshot_set_digest,
    )
    all_diagnostics = [*diagnostics, *assembled.diagnostics]
    weapon_catalog_bytes = canonical_json_bytes(assembled.weapons_catalog)
    weapon_mod_catalog_bytes = canonical_json_bytes(assembled.weapon_mods_catalog)
    weapon_artifact_digest = digest_bytes(weapon_catalog_bytes)
    weapon_mod_artifact_digest = digest_bytes(weapon_mod_catalog_bytes)
    snapshot_set_manifest = json.loads(snapshot_set_manifest_path.read_text(encoding="utf-8"))
    manifest_source_plan_path = source_plan_path or weapon_source_plan_output_path(
        roots.root,
        str(source_plan["summary"]["sourcePlanDigest"]),
    )
    if profile.catalog_byte_cap and len(weapon_catalog_bytes) > profile.catalog_byte_cap:
        all_diagnostics.append(
            Diagnostic(
                code="WEAPON_CATALOG_BYTE_CAP_EXCEEDED",
                severity="critical",
                message=f"Weapon catalog size {len(weapon_catalog_bytes)} exceeded cap {profile.catalog_byte_cap}",
                category="artifact-integrity-mismatch",
                scope_kind="artifact",
                artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
                disposition="non-waivable",
            )
        )
    if profile.catalog_byte_cap and len(weapon_mod_catalog_bytes) > profile.catalog_byte_cap:
        all_diagnostics.append(
            Diagnostic(
                code="WEAPON_MOD_CATALOG_BYTE_CAP_EXCEEDED",
                severity="critical",
                message=f"Weapon modifier catalog size {len(weapon_mod_catalog_bytes)} exceeded cap {profile.catalog_byte_cap}",
                category="artifact-integrity-mismatch",
                scope_kind="artifact",
                artifact_path=(Path("data/generated") / EPIC_12_WEAPON_MODS_RELATIVE_PATH).as_posix(),
                disposition="non-waivable",
            )
        )
    source_ids = sorted(
        {
            str(child["sourceId"])
            for child in snapshot_set_manifest.get("childSnapshots", [])
            if isinstance(child, dict) and child.get("sourceId") is not None
        }
    )
    unique_snapshot_manifest_paths = sorted(set(snapshot_manifest_paths))
    reviews = weapon_manual_reviews(
        generated_at=generated_at,
        source_plan=source_plan,
        snapshot_set_digest=snapshot_set_digest,
        weapon_artifact_digest=weapon_artifact_digest,
        weapon_mod_artifact_digest=weapon_mod_artifact_digest,
    )
    common_extra = {
        "sourcePlanPath": _relative_to_root(roots.root, manifest_source_plan_path),
        "sourcePlanDigest": source_plan["summary"]["sourcePlanDigest"],
        "sourceSetDigest": source_plan["summary"]["sourceSetDigest"],
        "selectedSnapshotSetManifestPath": _relative_to_root(roots.root, snapshot_set_manifest_path),
        "selectedSnapshotSetDigest": snapshot_set_digest,
        "releaseSet": assembled.weapons_catalog["releaseSet"],
        "dependencyDigests": assembled.weapons_catalog["dependencyDigests"],
        "manualReviews": reviews,
        "retentionDecision": {
            "selectedEvidence": "local-ignored-snapshot-set",
            "longTermReproduction": "Requires the retained ignored snapshot set or a fresh bounded live acquisition and review.",
        },
    }
    weapon_artifact_path, weapon_manifest_path, weapon_manifest = write_generated_artifact(
        root=roots.generated_root,
        relative_path=profile.generated_relative_path,
        value=assembled.weapons_catalog,
        generated_at=generated_at,
        input_snapshot_manifest_paths=unique_snapshot_manifest_paths,
        source_ids=source_ids,
        record_count=len(assembled.weapons_catalog["weaponBases"]),
        qa_report_path=(Path("data/qa") / profile.qa_relative_path).as_posix(),
        commit_decision="exact-path-allowlisted",
        notes="Runtime-eligible EPIC-12 weapon base catalog; source plans, snapshot-set manifests, raw snapshots, QA summaries, review evidence, and media bytes remain ignored.",
        extra_fields={**common_extra, "counterpartArtifactPath": (Path("data/generated") / EPIC_12_WEAPON_MODS_RELATIVE_PATH).as_posix()},
    )
    weapon_mod_artifact_path, weapon_mod_manifest_path, weapon_mod_manifest = write_generated_artifact(
        root=roots.generated_root,
        relative_path=EPIC_12_WEAPON_MODS_RELATIVE_PATH,
        value=assembled.weapon_mods_catalog,
        generated_at=generated_at,
        input_snapshot_manifest_paths=unique_snapshot_manifest_paths,
        source_ids=source_ids,
        record_count=len(assembled.weapon_mods_catalog["weaponMods"]),
        qa_report_path=(Path("data/qa") / EPIC_12_WEAPON_MODS_QA_RELATIVE_PATH).as_posix(),
        commit_decision="exact-path-allowlisted",
        notes="Runtime-eligible EPIC-12 weapon modifier catalog; source plans, snapshot-set manifests, raw snapshots, QA summaries, review evidence, and media bytes remain ignored.",
        extra_fields={**common_extra, "counterpartArtifactPath": (Path("data/generated") / profile.generated_relative_path).as_posix()},
    )
    weapon_report = build_report(
        artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
        artifact_manifest_path=(Path("data/generated") / profile.generated_relative_path.with_suffix(".manifest.json")).as_posix(),
        generated_at=generated_at,
        source_ids=source_ids,
        diagnostics=all_diagnostics,
        notes="EPIC-12 weapon base catalog QA report covering source accounting, IDs, crosswalks, joins, damage, requirements, compatibility, copied text, media metadata, caps, counterpart digests, and artifact integrity.",
    )
    weapon_mod_report = build_report(
        artifact_path=(Path("data/generated") / EPIC_12_WEAPON_MODS_RELATIVE_PATH).as_posix(),
        artifact_manifest_path=(Path("data/generated") / EPIC_12_WEAPON_MODS_RELATIVE_PATH.with_suffix(".manifest.json")).as_posix(),
        generated_at=generated_at,
        source_ids=source_ids,
        diagnostics=all_diagnostics,
        notes="EPIC-12 weapon modifier catalog QA report covering source accounting, IDs, crosswalks, applicability, effects, compatibility, copied text, media metadata, caps, counterpart digests, and artifact integrity.",
    )
    qa_byte_count = len(canonical_json_bytes(weapon_report)) + len(canonical_json_bytes(weapon_mod_report))
    if profile.qa_byte_cap and qa_byte_count > profile.qa_byte_cap * 2:
        all_diagnostics.append(
            Diagnostic(
                code="WEAPON_QA_BYTE_CAP_EXCEEDED",
                severity="critical",
                message=f"Combined EPIC-12 QA report size {qa_byte_count} exceeded cap {profile.qa_byte_cap * 2}",
                category="artifact-integrity-mismatch",
                scope_kind="artifact",
                artifact_path="data/qa/epic-12",
                disposition="non-waivable",
            )
        )
        weapon_report = build_report(
            artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
            artifact_manifest_path=(Path("data/generated") / profile.generated_relative_path.with_suffix(".manifest.json")).as_posix(),
            generated_at=generated_at,
            source_ids=source_ids,
            diagnostics=all_diagnostics,
            notes="EPIC-12 weapon base catalog QA report covering source accounting, IDs, crosswalks, joins, damage, requirements, compatibility, copied text, media metadata, caps, counterpart digests, and artifact integrity.",
        )
        weapon_mod_report = build_report(
            artifact_path=(Path("data/generated") / EPIC_12_WEAPON_MODS_RELATIVE_PATH).as_posix(),
            artifact_manifest_path=(Path("data/generated") / EPIC_12_WEAPON_MODS_RELATIVE_PATH.with_suffix(".manifest.json")).as_posix(),
            generated_at=generated_at,
            source_ids=source_ids,
            diagnostics=all_diagnostics,
            notes="EPIC-12 weapon modifier catalog QA report covering source accounting, IDs, crosswalks, applicability, effects, compatibility, copied text, media metadata, caps, counterpart digests, and artifact integrity.",
        )
    weapon_qa_path, weapon_summary_path = write_report(root=roots.qa_root, relative_path=profile.qa_relative_path, report=weapon_report)
    write_report(root=roots.qa_root, relative_path=EPIC_12_WEAPON_MODS_QA_RELATIVE_PATH, report=weapon_mod_report)
    exit_code = max(exit_code_for_report(weapon_report), exit_code_for_report(weapon_mod_report))
    return PipelineResult(
        artifact_path=weapon_artifact_path,
        manifest_path=weapon_manifest_path,
        qa_report_path=weapon_qa_path,
        qa_summary_path=weapon_summary_path,
        record_count=int(weapon_manifest["recordCount"]) + int(weapon_mod_manifest["recordCount"]),
        finding_count=int(weapon_report["summary"]["findingCount"]) + int(weapon_mod_report["summary"]["findingCount"]),
        exit_code=exit_code,
        generated={
            "weapons": assembled.weapons_catalog,
            "weaponMods": assembled.weapon_mods_catalog,
            "artifacts": {
                "weapons": weapon_artifact_path.as_posix(),
                "weaponMods": weapon_mod_artifact_path.as_posix(),
                "weaponManifest": weapon_manifest_path.as_posix(),
                "weaponModManifest": weapon_mod_manifest_path.as_posix(),
            },
        },
        qa_report=weapon_report,
    )


def _discover_epic10_source_set(
    *,
    roots: RuntimeRoots,
    profile: Any,
    generated_at: str,
    snapshot_store: SnapshotStore,
) -> PipelineResult:
    dependency = load_epic03_dependency(roots.root)
    client = MediaWikiClient(limits=EPIC_10_LIMITS)
    source_pages, source_diagnostics = client.query_title_revisions(list(profile.source_titles))
    if len(source_pages) != len(profile.source_titles):
        raise PipelineError("EPIC-10 source authority pages could not all be fetched")

    source_snapshots: list[dict[str, Any]] = []
    child_manifest_paths: list[str] = []
    for page in source_pages:
        revision = _first_revision(page)
        title = str(page.get("title"))
        content = _revision_content(revision)
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-10-live:seed:{_safe_source_part(title)}:{revision.get('revid')}",
            page_title=title,
            page_id=page.get("pageid"),
            revision_id=revision.get("revid"),
            source_revision_timestamp=revision.get("timestamp"),
            retrieved_at=generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=page.get("pageid"),
            revision_id=revision.get("revid"),
            timestamp=revision.get("timestamp"),
            retrieved_at=generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        source_snapshots.append({"title": title, "content": content, "sourceReference": source_ref})

    plan_result = build_rune_source_plan(
        profile=profile,
        generated_at=generated_at,
        source_snapshots=source_snapshots,
        dependency=dependency,
    )
    plan_path = write_rune_source_plan(roots.root, plan_result.plan)
    diagnostics = [*source_diagnostics, *plan_result.diagnostics]
    report = build_report(
        artifact_path=_relative_to_root(roots.root, plan_path),
        artifact_manifest_path=None,
        generated_at=generated_at,
        source_ids=[snapshot["sourceReference"]["id"] for snapshot in source_snapshots],
        diagnostics=diagnostics,
        notes="EPIC-10 discover-only source-plan QA report.",
    )
    qa_relative = Path("epic-10/runes.source-plan.qa.json")
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=qa_relative, report=report)
    return PipelineResult(
        artifact_path=plan_path,
        manifest_path=plan_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=int(plan_result.plan["summary"]["acceptedRuneCount"]),
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated={**plan_result.plan, "snapshotManifestPaths": child_manifest_paths},
        qa_report=report,
    )


def _write_epic10_catalog_result(
    *,
    roots: RuntimeRoots,
    profile: Any,
    generated_at: str,
    source_plan: dict[str, Any],
    detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    snapshot_set_manifest_path: Path,
    snapshot_manifest_paths: list[str],
    source_plan_path: Path | None,
    diagnostics: list[Diagnostic],
) -> PipelineResult:
    dependency = load_epic03_dependency(roots.root)
    snapshot_set_digest = digest_bytes(snapshot_set_manifest_path.read_bytes())
    assembled = assemble_rune_catalog(
        profile=profile,
        generated_at=generated_at,
        source_plan=source_plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        dependency=dependency,
        snapshot_set_digest=snapshot_set_digest,
    )
    all_diagnostics = [*diagnostics, *assembled.diagnostics]
    catalog_artifact_digest = digest_bytes(canonical_json_bytes(assembled.catalog))
    catalog_byte_count = len(canonical_json_bytes(assembled.catalog))
    snapshot_set_manifest = json.loads(snapshot_set_manifest_path.read_text(encoding="utf-8"))
    manifest_source_plan_path = source_plan_path or rune_source_plan_output_path(
        roots.root,
        str(source_plan["summary"]["sourcePlanDigest"]),
    )
    if profile.catalog_byte_cap and catalog_byte_count > profile.catalog_byte_cap:
        all_diagnostics.append(
            Diagnostic(
                code="RUNE_CATALOG_BYTE_CAP_EXCEEDED",
                severity="critical",
                message=f"Rune catalog size {catalog_byte_count} exceeded cap {profile.catalog_byte_cap}",
                category="artifact-integrity-mismatch",
                scope_kind="artifact",
                artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
                disposition="non-waivable",
            )
        )
    source_ids = sorted(
        {
            str(child["sourceId"])
            for child in snapshot_set_manifest.get("childSnapshots", [])
            if isinstance(child, dict) and child.get("sourceId") is not None
        }
    )
    qa_relative = profile.qa_relative_path
    unique_snapshot_manifest_paths = sorted(set(snapshot_manifest_paths))
    artifact_path, manifest_path, manifest = write_generated_artifact(
        root=roots.generated_root,
        relative_path=profile.generated_relative_path,
        value=assembled.catalog,
        generated_at=generated_at,
        input_snapshot_manifest_paths=unique_snapshot_manifest_paths,
        source_ids=source_ids,
        record_count=len(assembled.catalog["runes"]),
        qa_report_path=(Path("data/qa") / qa_relative).as_posix(),
        commit_decision="exact-path-allowlisted",
        notes="Runtime-eligible EPIC-10 rune catalog; source plans, snapshot-set manifests, raw snapshots, QA summaries, and icon bytes remain ignored.",
        extra_fields={
            "sourcePlanPath": _relative_to_root(roots.root, manifest_source_plan_path),
            "sourcePlanDigest": source_plan["summary"]["sourcePlanDigest"],
            "sourceSetDigest": source_plan["summary"]["sourceSetDigest"],
            "selectedSnapshotSetManifestPath": _relative_to_root(roots.root, snapshot_set_manifest_path),
            "selectedSnapshotSetDigest": snapshot_set_digest,
            "dependencyDigests": assembled.catalog["dependencyDigests"],
            "manualReviews": rune_manual_reviews(
                generated_at=generated_at,
                source_plan=source_plan,
                snapshot_set_digest=snapshot_set_digest,
                artifact_digest=catalog_artifact_digest,
            ),
        },
    )
    report = build_report(
        artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
        artifact_manifest_path=(Path("data/generated") / profile.generated_relative_path.with_suffix(".manifest.json")).as_posix(),
        generated_at=generated_at,
        source_ids=source_ids,
        diagnostics=all_diagnostics,
        notes="EPIC-10 rune catalog QA report covering source accounting, IDs, joins, effects, stackability, headgear handoff, icons, copied-text policy, artifact integrity, determinism, and release gates.",
    )
    qa_byte_count = len(canonical_json_bytes(report))
    if profile.qa_byte_cap and qa_byte_count > profile.qa_byte_cap:
        all_diagnostics.append(
            Diagnostic(
                code="RUNE_QA_BYTE_CAP_EXCEEDED",
                severity="critical",
                message=f"Rune QA report size {qa_byte_count} exceeded cap {profile.qa_byte_cap}",
                category="artifact-integrity-mismatch",
                scope_kind="artifact",
                artifact_path=(Path("data/qa") / qa_relative).as_posix(),
                disposition="non-waivable",
            )
        )
        report = build_report(
            artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
            artifact_manifest_path=(Path("data/generated") / profile.generated_relative_path.with_suffix(".manifest.json")).as_posix(),
            generated_at=generated_at,
            source_ids=source_ids,
            diagnostics=all_diagnostics,
            notes="EPIC-10 rune catalog QA report covering source accounting, IDs, joins, effects, stackability, headgear handoff, icons, copied-text policy, artifact integrity, determinism, and release gates.",
        )
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=qa_relative, report=report)
    return PipelineResult(
        artifact_path=artifact_path,
        manifest_path=manifest_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=int(manifest["recordCount"]),
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated=assembled.catalog,
        qa_report=report,
    )


def _discover_epic11_source_set(
    *,
    roots: RuntimeRoots,
    profile: Any,
    generated_at: str,
    snapshot_store: SnapshotStore,
) -> PipelineResult:
    dependency = _load_epic03_dependency_for_epic11(roots.root)
    client = MediaWikiClient(limits=EPIC_11_LIMITS)
    source_pages, source_diagnostics = client.query_title_revisions(list(profile.source_titles))
    if len(source_pages) != len(profile.source_titles):
        raise PipelineError("EPIC-11 source authority pages could not all be fetched")

    source_snapshots: list[dict[str, Any]] = []
    child_manifest_paths: list[str] = []
    for page in source_pages:
        revision = _first_revision(page)
        title = str(page.get("title"))
        content = _revision_content(revision)
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-11-live:seed:{_safe_source_part(title)}:{revision.get('revid')}",
            page_title=title,
            page_id=page.get("pageid"),
            revision_id=revision.get("revid"),
            source_revision_timestamp=revision.get("timestamp"),
            retrieved_at=generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=page.get("pageid"),
            revision_id=revision.get("revid"),
            timestamp=revision.get("timestamp"),
            retrieved_at=generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        source_snapshots.append({"title": title, "content": content, "sourceReference": source_ref})

    plan_result = build_insignia_source_plan(
        profile=profile,
        generated_at=generated_at,
        source_snapshots=source_snapshots,
        dependency=dependency,
    )
    plan_path = write_insignia_source_plan(roots.root, plan_result.plan)
    diagnostics = [*source_diagnostics, *plan_result.diagnostics]
    report = build_report(
        artifact_path=_relative_to_root(roots.root, plan_path),
        artifact_manifest_path=None,
        generated_at=generated_at,
        source_ids=[snapshot["sourceReference"]["id"] for snapshot in source_snapshots],
        diagnostics=diagnostics,
        notes="EPIC-11 discover-only source-plan QA report.",
    )
    qa_relative = Path("epic-11/insignias.source-plan.qa.json")
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=qa_relative, report=report)
    return PipelineResult(
        artifact_path=plan_path,
        manifest_path=plan_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=int(plan_result.plan["summary"]["acceptedInsigniaCount"]),
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated={**plan_result.plan, "snapshotManifestPaths": child_manifest_paths},
        qa_report=report,
    )


def _write_epic11_catalog_result(
    *,
    roots: RuntimeRoots,
    profile: Any,
    generated_at: str,
    source_plan: dict[str, Any],
    detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    snapshot_set_manifest_path: Path,
    snapshot_manifest_paths: list[str],
    source_plan_path: Path | None,
    diagnostics: list[Diagnostic],
) -> PipelineResult:
    dependency = _load_epic03_dependency_for_epic11(roots.root)
    snapshot_set_digest = digest_bytes(snapshot_set_manifest_path.read_bytes())
    assembled = assemble_insignia_catalog(
        profile=profile,
        generated_at=generated_at,
        source_plan=source_plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        dependency=dependency,
        snapshot_set_digest=snapshot_set_digest,
    )
    all_diagnostics = [*diagnostics, *assembled.diagnostics]
    catalog_artifact_digest = digest_bytes(canonical_json_bytes(assembled.catalog))
    catalog_byte_count = len(canonical_json_bytes(assembled.catalog))
    snapshot_set_manifest = json.loads(snapshot_set_manifest_path.read_text(encoding="utf-8"))
    manifest_source_plan_path = source_plan_path or insignia_source_plan_output_path(
        roots.root,
        str(source_plan["summary"]["sourcePlanDigest"]),
    )
    if profile.catalog_byte_cap and catalog_byte_count > profile.catalog_byte_cap:
        all_diagnostics.append(
            Diagnostic(
                code="INSIGNIA_CATALOG_BYTE_CAP_EXCEEDED",
                severity="critical",
                message=f"Insignia catalog size {catalog_byte_count} exceeded cap {profile.catalog_byte_cap}",
                category="artifact-integrity-mismatch",
                scope_kind="artifact",
                artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
                disposition="non-waivable",
            )
        )
    source_ids = sorted(
        {
            str(child["sourceId"])
            for child in snapshot_set_manifest.get("childSnapshots", [])
            if isinstance(child, dict) and child.get("sourceId") is not None
        }
    )
    qa_relative = profile.qa_relative_path
    unique_snapshot_manifest_paths = sorted(set(snapshot_manifest_paths))
    artifact_path, manifest_path, manifest = write_generated_artifact(
        root=roots.generated_root,
        relative_path=profile.generated_relative_path,
        value=assembled.catalog,
        generated_at=generated_at,
        input_snapshot_manifest_paths=unique_snapshot_manifest_paths,
        source_ids=source_ids,
        record_count=len(assembled.catalog["insignias"]),
        qa_report_path=(Path("data/qa") / qa_relative).as_posix(),
        commit_decision="exact-path-allowlisted",
        notes="Runtime-eligible EPIC-11 insignia catalog; source plans, snapshot-set manifests, raw snapshots, QA summaries, review evidence, and icon bytes remain ignored.",
        extra_fields={
            "sourcePlanPath": _relative_to_root(roots.root, manifest_source_plan_path),
            "sourcePlanDigest": source_plan["summary"]["sourcePlanDigest"],
            "sourceSetDigest": source_plan["summary"]["sourceSetDigest"],
            "identityRegistryDigest": source_plan["identityRegistryDigest"],
            "selectedSnapshotSetManifestPath": _relative_to_root(roots.root, snapshot_set_manifest_path),
            "selectedSnapshotSetDigest": snapshot_set_digest,
            "dependencyDigests": assembled.catalog["dependencyDigests"],
            "manualReviews": insignia_manual_reviews(
                generated_at=generated_at,
                source_plan=source_plan,
                snapshot_set_digest=snapshot_set_digest,
                artifact_digest=catalog_artifact_digest,
            ),
            "retentionDecision": {
                "selectedEvidence": "local-ignored-snapshot-set",
                "longTermReproduction": "Requires the retained ignored snapshot set or a fresh bounded live acquisition and review.",
            },
        },
    )
    report = build_report(
        artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
        artifact_manifest_path=(Path("data/generated") / profile.generated_relative_path.with_suffix(".manifest.json")).as_posix(),
        generated_at=generated_at,
        source_ids=source_ids,
        diagnostics=all_diagnostics,
        notes="EPIC-11 insignia catalog QA report covering source accounting, IDs, crosswalks, joins, restrictions, modes, slots, effects, conditions, locality, combination, copied text, media metadata, caps, baselines, gates, and artifact integrity.",
    )
    qa_byte_count = len(canonical_json_bytes(report))
    if profile.qa_byte_cap and qa_byte_count > profile.qa_byte_cap:
        all_diagnostics.append(
            Diagnostic(
                code="INSIGNIA_QA_BYTE_CAP_EXCEEDED",
                severity="critical",
                message=f"Insignia QA report size {qa_byte_count} exceeded cap {profile.qa_byte_cap}",
                category="artifact-integrity-mismatch",
                scope_kind="artifact",
                artifact_path=(Path("data/qa") / qa_relative).as_posix(),
                disposition="non-waivable",
            )
        )
        report = build_report(
            artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
            artifact_manifest_path=(Path("data/generated") / profile.generated_relative_path.with_suffix(".manifest.json")).as_posix(),
            generated_at=generated_at,
            source_ids=source_ids,
            diagnostics=all_diagnostics,
            notes="EPIC-11 insignia catalog QA report covering source accounting, IDs, crosswalks, joins, restrictions, modes, slots, effects, conditions, locality, combination, copied text, media metadata, caps, baselines, gates, and artifact integrity.",
        )
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=qa_relative, report=report)
    return PipelineResult(
        artifact_path=artifact_path,
        manifest_path=manifest_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=int(manifest["recordCount"]),
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated=assembled.catalog,
        qa_report=report,
    )


def _discover_epic04_source_set(
    *,
    roots: RuntimeRoots,
    profile: Any,
    generated_at: str,
    snapshot_store: SnapshotStore,
) -> PipelineResult:
    client = MediaWikiClient(limits=EPIC_04_LIMITS)
    index_pages, index_diagnostics = client.query_title_revisions([EPIC_04_SOURCE_INDEX_TITLE])
    if not index_pages:
        raise PipelineError("EPIC-04 source-set index could not be fetched")
    index_page = index_pages[0]
    index_revision = _first_revision(index_page)
    index_content = _revision_content(index_revision)
    index_source = _page_source_reference(
        source_id=f"source:gww:epic-04-live:index:{index_page.get('pageid')}:{index_revision.get('revid')}",
        page_title=str(index_page.get("title")),
        page_id=index_page.get("pageid"),
        revision_id=index_revision.get("revid"),
        source_revision_timestamp=index_revision.get("timestamp"),
        retrieved_at=generated_at,
    )
    index_snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=index_source,
        title=str(index_page.get("title")),
        page_id=index_page.get("pageid"),
        revision_id=index_revision.get("revid"),
        timestamp=index_revision.get("timestamp"),
        retrieved_at=generated_at,
        content=index_content,
    )
    ranged_titles, ranged_diagnostics = ranged_titles_from_index(index_content)
    range_pages, range_page_diagnostics = client.query_title_revisions(ranged_titles)
    range_snapshots: list[dict[str, Any]] = []
    child_manifest_paths = [_relative_to_root(roots.root, index_snapshot.manifest_path)]
    for page in range_pages:
        revision = _first_revision(page)
        title = str(page.get("title"))
        content = _revision_content(revision)
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-04-live:range:{page.get('pageid')}:{revision.get('revid')}",
            page_title=title,
            page_id=page.get("pageid"),
            revision_id=revision.get("revid"),
            source_revision_timestamp=revision.get("timestamp"),
            retrieved_at=generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=page.get("pageid"),
            revision_id=revision.get("revid"),
            timestamp=revision.get("timestamp"),
            retrieved_at=generated_at,
            content=content,
        )
        child_manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        range_snapshots.append({"title": title, "content": content, "sourceReference": source_ref})

    profession_list_snapshots, profession_list_manifest_paths, profession_list_diagnostics = (
        _fetch_epic04_profession_skill_lists(
            client=client,
            snapshot_store=snapshot_store,
            generated_at=generated_at,
            roots=roots,
        )
    )
    child_manifest_paths.extend(profession_list_manifest_paths)
    pve_only_list_snapshot, pve_only_list_manifest_paths, pve_only_list_diagnostics = (
        _fetch_epic04_pve_only_skill_list(
            client=client,
            snapshot_store=snapshot_store,
            generated_at=generated_at,
            roots=roots,
        )
    )
    child_manifest_paths.extend(pve_only_list_manifest_paths)
    draft_plan_result = build_source_plan(
        profile=profile,
        generated_at=generated_at,
        index_snapshot={"title": EPIC_04_SOURCE_INDEX_TITLE, "content": index_content, "sourceReference": index_source},
        range_snapshots=range_snapshots,
        profession_list_snapshots=profession_list_snapshots,
        pve_only_list_snapshot=pve_only_list_snapshot,
    )
    supplemental_seed_snapshots, supplemental_seed_manifest_paths, supplemental_seed_diagnostics = (
        _fetch_epic04_supplemental_seed_pages(
            client=client,
            snapshot_store=snapshot_store,
            generated_at=generated_at,
            roots=roots,
            unresolved_rows=draft_plan_result.plan["unresolvedSkillListTitles"],
        )
    )
    child_manifest_paths.extend(supplemental_seed_manifest_paths)
    plan_result = build_source_plan(
        profile=profile,
        generated_at=generated_at,
        index_snapshot={"title": EPIC_04_SOURCE_INDEX_TITLE, "content": index_content, "sourceReference": index_source},
        range_snapshots=range_snapshots,
        profession_list_snapshots=profession_list_snapshots,
        pve_only_list_snapshot=pve_only_list_snapshot,
        supplemental_seed_snapshots=supplemental_seed_snapshots,
    )
    plan_path = write_source_plan(roots.root, plan_result.plan)
    diagnostics = [
        *index_diagnostics,
        *ranged_diagnostics,
        *range_page_diagnostics,
        *profession_list_diagnostics,
        *pve_only_list_diagnostics,
        *supplemental_seed_diagnostics,
        *plan_result.diagnostics,
    ]
    report = build_report(
        artifact_path=_relative_to_root(roots.root, plan_path),
        artifact_manifest_path=None,
        generated_at=generated_at,
        source_ids=[
            index_source["id"],
            *[snapshot["sourceReference"]["id"] for snapshot in range_snapshots],
            *[snapshot["sourceReference"]["id"] for snapshot in profession_list_snapshots],
            pve_only_list_snapshot["sourceReference"]["id"],
        ],
        diagnostics=diagnostics,
        notes="EPIC-04 discover-only source-plan QA report.",
    )
    qa_relative = Path("epic-04/skills.source-plan.qa.json")
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=qa_relative, report=report)
    return PipelineResult(
        artifact_path=plan_path,
        manifest_path=plan_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=int(plan_result.plan["summary"]["acceptedSeedCount"]),
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated={**plan_result.plan, "snapshotManifestPaths": child_manifest_paths},
        qa_report=report,
    )


def _fetch_epic04_profession_skill_lists(
    *,
    client: MediaWikiClient,
    snapshot_store: SnapshotStore,
    generated_at: str,
    roots: RuntimeRoots,
) -> tuple[list[dict[str, Any]], list[str], list[Diagnostic]]:
    titles = [title for _profession_id, _slug, title in EPIC_04_PROFESSION_SKILL_LISTS]
    profession_id_by_title = {
        title: profession_id for profession_id, _slug, title in EPIC_04_PROFESSION_SKILL_LISTS
    }
    pages, diagnostics = client.query_title_revisions(titles)
    snapshots: list[dict[str, Any]] = []
    manifest_paths: list[str] = []
    for page in pages:
        revision = _first_revision(page)
        requested_title = str(page.get("_buildWarsRequestedTitle") or page.get("title"))
        title = str(page.get("title"))
        revision_id = revision.get("revid")
        timestamp = revision.get("timestamp")
        parsed = client.request({"action": "parse", "oldid": revision_id, "prop": "text|revid"})
        parse_payload = parsed.get("parse")
        if not isinstance(parse_payload, dict) or not isinstance(parse_payload.get("text"), str):
            raise PipelineError(f"EPIC-04 profession skill list did not render: {requested_title}")
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-04-live:profession-list:{page.get('pageid')}:{revision_id}",
            page_title=title,
            page_id=page.get("pageid"),
            revision_id=revision_id,
            source_revision_timestamp=timestamp,
            retrieved_at=generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=page.get("pageid"),
            revision_id=revision_id,
            timestamp=timestamp,
            retrieved_at=generated_at,
            content=str(parse_payload["text"]),
        )
        manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        snapshots.append(
            {
                "title": title,
                "content": str(parse_payload["text"]),
                "sourceReference": source_ref,
                "professionId": profession_id_by_title[requested_title],
            }
        )
    return snapshots, manifest_paths, diagnostics


def _fetch_epic04_pve_only_skill_list(
    *,
    client: MediaWikiClient,
    snapshot_store: SnapshotStore,
    generated_at: str,
    roots: RuntimeRoots,
) -> tuple[dict[str, Any], list[str], list[Diagnostic]]:
    pages, diagnostics = client.query_title_revisions([EPIC_04_PVE_ONLY_SKILL_LIST_TITLE])
    if not pages:
        raise PipelineError("EPIC-04 PvE-only skill list could not be fetched")
    page = pages[0]
    revision = _first_revision(page)
    title = str(page.get("title"))
    revision_id = revision.get("revid")
    timestamp = revision.get("timestamp")
    parsed = client.request({"action": "parse", "oldid": revision_id, "prop": "text|revid"})
    parse_payload = parsed.get("parse")
    if not isinstance(parse_payload, dict) or not isinstance(parse_payload.get("text"), str):
        raise PipelineError(f"EPIC-04 PvE-only skill list did not render: {title}")
    source_ref = _page_source_reference(
        source_id=f"source:gww:epic-04-live:pve-only-list:{page.get('pageid')}:{revision_id}",
        page_title=title,
        page_id=page.get("pageid"),
        revision_id=revision_id,
        source_revision_timestamp=timestamp,
        retrieved_at=generated_at,
    )
    snapshot = _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=source_ref,
        title=title,
        page_id=page.get("pageid"),
        revision_id=revision_id,
        timestamp=timestamp,
        retrieved_at=generated_at,
        content=str(parse_payload["text"]),
    )
    return (
        {"title": title, "content": str(parse_payload["text"]), "sourceReference": source_ref},
        [_relative_to_root(roots.root, snapshot.manifest_path)],
        diagnostics,
    )


def _fetch_epic04_supplemental_seed_pages(
    *,
    client: MediaWikiClient,
    snapshot_store: SnapshotStore,
    generated_at: str,
    roots: RuntimeRoots,
    unresolved_rows: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[str], list[Diagnostic]]:
    if not unresolved_rows:
        return [], [], []
    titles = sorted({str(row["requestedTitle"]) for row in unresolved_rows})
    pages, diagnostics = client.query_title_revisions(titles)
    snapshots: list[dict[str, Any]] = []
    manifest_paths: list[str] = []
    for page in pages:
        revision = _first_revision(page)
        requested_title = str(page.get("_buildWarsRequestedTitle") or page.get("title"))
        title = str(page.get("title"))
        revision_id = revision.get("revid")
        timestamp = revision.get("timestamp")
        content = _revision_content(revision)
        source_ref = _page_source_reference(
            source_id=f"source:gww:epic-04-live:supplemental-skill:{page.get('pageid')}:{revision_id}",
            page_title=title,
            page_id=page.get("pageid"),
            revision_id=revision_id,
            source_revision_timestamp=timestamp,
            retrieved_at=generated_at,
        )
        snapshot = _write_page_snapshot(
            snapshot_store=snapshot_store,
            source_reference=source_ref,
            title=title,
            page_id=page.get("pageid"),
            revision_id=revision_id,
            timestamp=timestamp,
            retrieved_at=generated_at,
            content=content,
        )
        manifest_paths.append(_relative_to_root(roots.root, snapshot.manifest_path))
        snapshots.append(
            {
                "title": title,
                "requestedTitle": requested_title,
                "normalizedTitle": str(page.get("_buildWarsNormalizedTitle") or requested_title),
                "canonicalTitle": title,
                "content": content,
                "sourceReference": source_ref,
            }
        )
    return snapshots, manifest_paths, diagnostics


def _write_epic04_catalog_result(
    *,
    roots: RuntimeRoots,
    profile: Any,
    generated_at: str,
    source_plan: dict[str, Any],
    detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    snapshot_set_manifest_path: Path,
    snapshot_manifest_paths: list[str],
    source_plan_path: Path | None,
    diagnostics: list[Diagnostic],
) -> PipelineResult:
    dependency = load_epic03_dependency(roots.root)
    snapshot_set_digest = digest_bytes(snapshot_set_manifest_path.read_bytes())
    assembled = assemble_skill_catalog(
        profile=profile,
        generated_at=generated_at,
        source_plan=source_plan,
        detail_pages=detail_pages,
        imageinfo_pages=imageinfo_pages,
        dependency=dependency,
        snapshot_set_digest=snapshot_set_digest,
    )
    all_diagnostics = [*diagnostics, *assembled.diagnostics]
    catalog_artifact_digest = digest_bytes(canonical_json_bytes(assembled.catalog))
    catalog_byte_count = len(canonical_json_bytes(assembled.catalog))
    snapshot_set_manifest = json.loads(snapshot_set_manifest_path.read_text(encoding="utf-8"))
    manifest_source_plan_path = source_plan_path or source_plan_output_path(
        roots.root,
        str(source_plan["summary"]["sourcePlanDigest"]),
    )
    if profile.catalog_byte_cap and catalog_byte_count > profile.catalog_byte_cap:
        all_diagnostics.append(
            Diagnostic(
                code="SKILL_CATALOG_BYTE_CAP_EXCEEDED",
                severity="critical",
                message=f"Skill catalog size {catalog_byte_count} exceeded cap {profile.catalog_byte_cap}",
                category="artifact-integrity-mismatch",
                scope_kind="artifact",
                artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
                disposition="non-waivable",
            )
        )
    source_ids = sorted(
        {
            str(child["sourceId"])
            for child in snapshot_set_manifest.get("childSnapshots", [])
            if isinstance(child, dict) and child.get("sourceId") is not None
        }
    )
    qa_relative = profile.qa_relative_path
    unique_snapshot_manifest_paths = sorted(set(snapshot_manifest_paths))
    artifact_path, manifest_path, manifest = write_generated_artifact(
        root=roots.generated_root,
        relative_path=profile.generated_relative_path,
        value=assembled.catalog,
        generated_at=generated_at,
        input_snapshot_manifest_paths=unique_snapshot_manifest_paths,
        source_ids=source_ids,
        record_count=len(assembled.catalog["skills"]),
        qa_report_path=(Path("data/qa") / qa_relative).as_posix(),
        commit_decision="exact-path-allowlisted",
        notes="Runtime-eligible EPIC-04 skills catalog; source plans, snapshot-set manifests, raw snapshots, and QA summaries remain ignored.",
        extra_fields={
            "sourcePlanPath": _relative_to_root(roots.root, manifest_source_plan_path),
            "sourcePlanDigest": source_plan["summary"]["sourcePlanDigest"],
            "sourceSetDigest": source_plan["summary"]["sourceSetDigest"],
            "selectedSnapshotSetManifestPath": _relative_to_root(roots.root, snapshot_set_manifest_path),
            "selectedSnapshotSetDigest": snapshot_set_digest,
            "dependencyDigests": assembled.catalog["dependencyDigests"],
            "manualReviews": _epic04_manual_reviews(
                generated_at=generated_at,
                source_plan=source_plan,
                snapshot_set_digest=snapshot_set_digest,
                artifact_digest=catalog_artifact_digest,
            ),
        },
    )
    report = build_report(
        artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
        artifact_manifest_path=(Path("data/generated") / profile.generated_relative_path.with_suffix(".manifest.json")).as_posix(),
        generated_at=generated_at,
        source_ids=source_ids,
        diagnostics=all_diagnostics,
        notes="EPIC-04 skills catalog QA report covering source-set accounting, joins, costs, descriptions, progressions, splits, icons, provenance, determinism, and release gates.",
    )
    qa_byte_count = len(canonical_json_bytes(report))
    if profile.qa_byte_cap and qa_byte_count > profile.qa_byte_cap:
        all_diagnostics.append(
            Diagnostic(
                code="SKILL_QA_BYTE_CAP_EXCEEDED",
                severity="critical",
                message=f"Skill QA report size {qa_byte_count} exceeded cap {profile.qa_byte_cap}",
                category="artifact-integrity-mismatch",
                scope_kind="artifact",
                artifact_path=(Path("data/qa") / qa_relative).as_posix(),
                disposition="non-waivable",
            )
        )
        report = build_report(
            artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
            artifact_manifest_path=(Path("data/generated") / profile.generated_relative_path.with_suffix(".manifest.json")).as_posix(),
            generated_at=generated_at,
            source_ids=source_ids,
            diagnostics=all_diagnostics,
            notes="EPIC-04 skills catalog QA report covering source-set accounting, joins, costs, descriptions, progressions, splits, icons, provenance, determinism, and release gates.",
        )
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=qa_relative, report=report)
    return PipelineResult(
        artifact_path=artifact_path,
        manifest_path=manifest_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=int(manifest["recordCount"]),
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated=assembled.catalog,
        qa_report=report,
    )


def _write_epic03_catalog_result(
    *,
    roots: RuntimeRoots,
    profile: Any,
    generated_at: str,
    snapshot_manifest_paths: list[str],
    page_texts: dict[str, str],
    sources_by_title: dict[str, dict[str, Any]],
    profession_pages: dict[str, str],
    imageinfo_pages: list[dict[str, Any]],
) -> PipelineResult:
    template = extract_template_crosswalk(
        page_texts["Skill template format"],
        source_reference=sources_by_title["Skill template format"],
    )
    profession_attributes = extract_professions_and_attributes(
        profession_wikitext=page_texts["Profession"],
        attribute_wikitext=page_texts["Attribute"],
        template_crosswalk=template.crosswalk,
        sources_by_title=sources_by_title,
        generated_at=generated_at,
        profession_pages=profession_pages,
        imageinfo_pages=imageinfo_pages,
    )
    attribute_points = extract_attribute_point_rules(
        page_texts["Attribute point"],
        source_reference=sources_by_title["Attribute point"],
    )
    assembled = assemble_profession_attribute_catalog(
        profile=profile,
        generated_at=generated_at,
        snapshot_manifest_paths=snapshot_manifest_paths,
        template_extraction=template,
        profession_attribute_extraction=profession_attributes,
        attribute_point_extraction=attribute_points,
    )
    source_ids = [str(source["id"]) for source in assembled.catalog["sources"]]
    artifact_path, manifest_path, manifest = write_generated_artifact(
        root=roots.generated_root,
        relative_path=profile.generated_relative_path,
        value=assembled.catalog,
        generated_at=generated_at,
        input_snapshot_manifest_paths=snapshot_manifest_paths,
        source_ids=source_ids,
        record_count=len(assembled.catalog["professions"]) + len(assembled.catalog["attributes"]),
        qa_report_path=(Path("data/qa") / profile.qa_relative_path).as_posix(),
        commit_decision="exact-path-allowlisted",
        notes="Runtime-eligible EPIC-03 professions and attributes catalog; raw snapshots remain ignored.",
    )
    report = build_report(
        artifact_path=(Path("data/generated") / profile.generated_relative_path).as_posix(),
        artifact_manifest_path=(Path("data/generated") / profile.generated_relative_path.with_suffix(".manifest.json")).as_posix(),
        generated_at=generated_at,
        source_ids=source_ids,
        diagnostics=assembled.diagnostics,
        notes="EPIC-03 catalog QA report covering source shape, IDs, ownership, icons, summaries, point rules, provenance, baseline, and artifact gates.",
    )
    qa_path, summary_path = write_report(root=roots.qa_root, relative_path=profile.qa_relative_path, report=report)
    return PipelineResult(
        artifact_path=artifact_path,
        manifest_path=manifest_path,
        qa_report_path=qa_path,
        qa_summary_path=summary_path,
        record_count=int(manifest["recordCount"]),
        finding_count=int(report["summary"]["findingCount"]),
        exit_code=exit_code_for_report(report),
        generated=assembled.catalog,
        qa_report=report,
    )


def _load_fixtures(fixture_root: Path) -> dict[str, Any]:
    try:
        return {
            "skill_ids": (fixture_root / "skill-ids/game-integration-skills-0.wiki").read_text(encoding="utf-8"),
            "wikitext": (fixture_root / "wikitext/parser-corpus.wiki").read_text(encoding="utf-8"),
            "imageinfo": json.loads((fixture_root / "icons/imageinfo.json").read_text(encoding="utf-8")),
        }
    except OSError as exc:
        raise PipelineError(f"Fixture input could not be read: {exc}") from exc


def _load_epic04_fixture_pages(fixture_root: Path) -> dict[str, Any]:
    base = fixture_root / "skills"
    try:
        index = (base / "index.wiki").read_text(encoding="utf-8")
        ranges = {
            "Guild Wars Wiki:Game integration/Skills/1-10": (base / "skills-1-10.wiki").read_text(
                encoding="utf-8"
            )
        }
        details = {
            "Healing Signet": (base / "healing-signet.wiki").read_text(encoding="utf-8"),
            "Flare": (base / "flare.wiki").read_text(encoding="utf-8"),
            "\"Save Yourselves!\"": (base / "save-yourselves.wiki").read_text(encoding="utf-8"),
            "Training Beacon (PvE)": (base / "training-beacon-pve.wiki").read_text(encoding="utf-8"),
            "Training Beacon (PvP)": (base / "training-beacon-pvp.wiki").read_text(encoding="utf-8"),
        }
        profession_lists = {
            title: (base / f"list-{slug}.html").read_text(encoding="utf-8")
            for _profession_id, slug, title in EPIC_04_PROFESSION_SKILL_LISTS
        }
        pve_only_list = (base / "list-pve-only.html").read_text(encoding="utf-8")
        imageinfo = json.loads((base / "imageinfo.json").read_text(encoding="utf-8"))
        return {
            "index": index,
            "ranges": ranges,
            "details": details,
            "professionLists": profession_lists,
            "pveOnlyList": pve_only_list,
            "imageinfo": imageinfo,
        }
    except OSError as exc:
        raise PipelineError(f"EPIC-04 fixture input could not be read: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise PipelineError(f"EPIC-04 fixture imageinfo JSON could not be parsed: {exc}") from exc


def _load_epic10_fixture_pages(fixture_root: Path) -> dict[str, Any]:
    base = fixture_root / "runes"
    try:
        sources = {
            "Equipment template format": (base / "equipment-template-format.wiki").read_text(encoding="utf-8"),
            "Rune": (base / "rune.wiki").read_text(encoding="utf-8"),
            "Attribute bonus": (base / "attribute-bonus.wiki").read_text(encoding="utf-8"),
        }
        details = {
            "Rune of Swordsmanship": (base / "rune-of-swordsmanship.wiki").read_text(encoding="utf-8"),
            "Rune of Restoration Magic": (base / "rune-of-restoration-magic.wiki").read_text(encoding="utf-8"),
            "Rune of Vigor": (base / "rune-of-vigor.wiki").read_text(encoding="utf-8"),
            "Rune of Absorption": (base / "rune-of-absorption.wiki").read_text(encoding="utf-8"),
            "Rune of Attunement": (base / "rune-of-attunement.wiki").read_text(encoding="utf-8"),
            "Rune of Vitae": (base / "rune-of-vitae.wiki").read_text(encoding="utf-8"),
            "Rune of Recovery": (base / "rune-of-recovery.wiki").read_text(encoding="utf-8"),
            "Rune of Restoration": (base / "rune-of-restoration.wiki").read_text(encoding="utf-8"),
            "Rune of Clarity": (base / "rune-of-clarity.wiki").read_text(encoding="utf-8"),
            "Rune of Purity": (base / "rune-of-purity.wiki").read_text(encoding="utf-8"),
        }
        imageinfo = json.loads((base / "imageinfo.json").read_text(encoding="utf-8"))
        return {"sources": sources, "details": details, "imageinfo": imageinfo}
    except OSError as exc:
        raise PipelineError(f"EPIC-10 fixture input could not be read: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise PipelineError(f"EPIC-10 fixture imageinfo JSON could not be parsed: {exc}") from exc


def _load_epic11_fixture_pages(fixture_root: Path) -> dict[str, Any]:
    base = fixture_root / "insignias"
    try:
        sources = {
            "Equipment template format": (base / "equipment-template-format.wiki").read_text(encoding="utf-8"),
            "Insignia": (base / "insignia.wiki").read_text(encoding="utf-8"),
            "Effect stacking": (base / "effect-stacking.wiki").read_text(encoding="utf-8"),
        }
        details = {
            "Survivor Insignia": (base / "survivor-insignia.wiki").read_text(encoding="utf-8"),
            "Radiant Insignia": (base / "radiant-insignia.wiki").read_text(encoding="utf-8"),
            "Stalwart Insignia": (base / "stalwart-insignia.wiki").read_text(encoding="utf-8"),
            "Blessed Insignia": (base / "blessed-insignia.wiki").read_text(encoding="utf-8"),
            "Knight's Insignia": (base / "knights-insignia.wiki").read_text(encoding="utf-8"),
            "Lieutenant's Insignia": (base / "lieutenants-insignia.wiki").read_text(encoding="utf-8"),
            "Stonefist Insignia": (base / "stonefist-insignia.wiki").read_text(encoding="utf-8"),
            "Sentinel's Insignia": (base / "sentinels-insignia.wiki").read_text(encoding="utf-8"),
            "Bloodstained Insignia": (base / "bloodstained-insignia.wiki").read_text(encoding="utf-8"),
            "Tormentor's Insignia": (base / "tormentors-insignia.wiki").read_text(encoding="utf-8"),
            "Prismatic Insignia": (base / "prismatic-insignia.wiki").read_text(encoding="utf-8"),
            "Anchorite's Insignia": (base / "anchorites-insignia.wiki").read_text(encoding="utf-8"),
            "Windwalker Insignia": (base / "windwalker-insignia.wiki").read_text(encoding="utf-8"),
        }
        imageinfo = json.loads((base / "imageinfo.json").read_text(encoding="utf-8"))
        return {"sources": sources, "details": details, "imageinfo": imageinfo}
    except OSError as exc:
        raise PipelineError(f"EPIC-11 fixture input could not be read: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise PipelineError(f"EPIC-11 fixture imageinfo JSON could not be parsed: {exc}") from exc


def _load_epic12_fixture_pages(fixture_root: Path) -> dict[str, Any]:
    base = fixture_root / "weapons-and-mods"
    try:
        sources = {
            "Equipment template format": (base / "equipment-template-format.wiki").read_text(encoding="utf-8"),
            "Weapon": (base / "weapon.wiki").read_text(encoding="utf-8"),
            "Weapon upgrade": (base / "weapon-upgrade.wiki").read_text(encoding="utf-8"),
            "Inscription": (base / "inscription.wiki").read_text(encoding="utf-8"),
        }
        details = {
            "Axe": (base / "axe.wiki").read_text(encoding="utf-8"),
            "Sword": (base / "sword.wiki").read_text(encoding="utf-8"),
            "Hammer": (base / "hammer.wiki").read_text(encoding="utf-8"),
            "Longbow": (base / "longbow.wiki").read_text(encoding="utf-8"),
            "Daggers": (base / "daggers.wiki").read_text(encoding="utf-8"),
            "Scythe": (base / "scythe.wiki").read_text(encoding="utf-8"),
            "Spear": (base / "spear.wiki").read_text(encoding="utf-8"),
            "Wand": (base / "wand.wiki").read_text(encoding="utf-8"),
            "Staff": (base / "staff.wiki").read_text(encoding="utf-8"),
            "Focus item": (base / "focus-item.wiki").read_text(encoding="utf-8"),
            "Shield": (base / "shield.wiki").read_text(encoding="utf-8"),
            "Upgrade component": (base / "upgrade-component.wiki").read_text(encoding="utf-8"),
            "Inscription": (base / "inscription-detail.wiki").read_text(encoding="utf-8"),
            "Staff Head": (base / "staff-head.wiki").read_text(encoding="utf-8"),
            "Staff Wrapping": (base / "staff-wrapping.wiki").read_text(encoding="utf-8"),
        }
        imageinfo = json.loads((base / "imageinfo.json").read_text(encoding="utf-8"))
        return {"sources": sources, "details": details, "imageinfo": imageinfo}
    except OSError as exc:
        raise PipelineError(f"EPIC-12 fixture input could not be read: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise PipelineError(f"EPIC-12 fixture imageinfo JSON could not be parsed: {exc}") from exc


def _epic10_fixture_canonical_title(seed: dict[str, Any]) -> str:
    family_kind = str(seed["familyKind"])
    rank = seed.get("familyRank")
    if family_kind == "attribute":
        return f"Rune of {seed['familyLabel']}"
    if family_kind in {"vigor", "absorption"} and rank in {"minor", "major", "superior"}:
        return f"Rune of {seed['familyLabel']}"
    return str(seed["detailTitle"])


def _epic10_fixture_detail_content(fixtures: dict[str, Any], canonical_title: str) -> str:
    try:
        return str(fixtures["details"][canonical_title])
    except KeyError as exc:
        raise PipelineError(f"EPIC-10 fixture detail page missing for {canonical_title}") from exc


def _epic11_fixture_detail_content(fixtures: dict[str, Any], canonical_title: str) -> str:
    try:
        return str(fixtures["details"][canonical_title])
    except KeyError as exc:
        raise PipelineError(f"EPIC-11 fixture detail page missing for {canonical_title}") from exc


def _epic12_fixture_detail_content(fixtures: dict[str, Any], canonical_title: str) -> str:
    try:
        return str(fixtures["details"][canonical_title])
    except KeyError as exc:
        raise PipelineError(f"EPIC-12 fixture detail page missing for {canonical_title}") from exc


def _seed_for_detail_record(source_plan: dict[str, Any], source_key: str, output_key: str) -> dict[str, Any]:
    collection_key = "acceptedWeaponBases" if output_key == "weaponBases" else "acceptedWeaponModifiers"
    for seed in source_plan[collection_key]:
        if str(seed["sourceKey"]) == source_key:
            return seed
    raise PipelineError(f"EPIC-12 snapshot set detail record did not match source plan: {source_key}")


def _load_epic03_fixture_pages(fixture_root: Path) -> dict[str, str]:
    base = fixture_root / "professions-attributes"
    try:
        return {
            "Skill template format": (base / "skill-template-format.wiki").read_text(encoding="utf-8"),
            "Profession": (base / "profession.wiki").read_text(encoding="utf-8"),
            "Attribute": (base / "attribute.wiki").read_text(encoding="utf-8"),
            "Attribute point": (base / "attribute-point.wiki").read_text(encoding="utf-8"),
        }
    except OSError as exc:
        raise PipelineError(f"EPIC-03 fixture input could not be read: {exc}") from exc


def _load_epic03_dependency_for_epic11(root: Path) -> Any:
    try:
        return load_epic03_dependency(root)
    except SkillCatalogError:
        repo_root = Path.cwd()
        if root.resolve() == repo_root.resolve():
            raise
        return load_epic03_dependency(repo_root)


def _selected_epic03_snapshot_manifests(root: Path, profile: Any) -> list[Path]:
    selected_titles = set(profile.all_page_titles) | {EPIC_03_ICON_IMAGEINFO_TITLE}
    selected: list[Path] = []
    for manifest_path in sorted(root.glob("**/*.manifest.json")):
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        source_ref = manifest.get("sourceReference") if isinstance(manifest, dict) else None
        if not isinstance(source_ref, dict):
            continue
        page_title = source_ref.get("pageTitle")
        if isinstance(page_title, str) and page_title in selected_titles:
            selected.append(manifest_path)
    return selected


def _write_imageinfo_snapshot(
    *,
    snapshot_store: SnapshotStore,
    pages: list[dict[str, Any]],
    retrieved_at: str,
) -> SnapshotWriteResult:
    payload = {"kind": "mediawiki-imageinfo", "title": EPIC_03_ICON_IMAGEINFO_TITLE, "pages": pages}
    payload_digest = digest_bytes(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8"))
    source_ref = _page_source_reference(
        source_id=f"source:gww:epic-03-profession-icons:{payload_digest[:12]}",
        page_title=EPIC_03_ICON_IMAGEINFO_TITLE,
        page_id=f"imageinfo:{payload_digest[:12]}",
        revision_id=payload_digest,
        source_revision_timestamp=_latest_imageinfo_timestamp(pages),
        retrieved_at=retrieved_at,
        material_class="media-metadata",
    )
    return _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=source_ref,
        title=EPIC_03_ICON_IMAGEINFO_TITLE,
        page_id=f"imageinfo:{payload_digest[:12]}",
        revision_id=payload_digest,
        timestamp=_latest_imageinfo_timestamp(pages),
        retrieved_at=retrieved_at,
        content=json.dumps(payload, ensure_ascii=False, sort_keys=True),
    )


def _write_imageinfo_snapshot_for_epic04(
    *,
    snapshot_store: SnapshotStore,
    pages: list[dict[str, Any]],
    retrieved_at: str,
) -> SnapshotWriteResult:
    payload = {"kind": "mediawiki-imageinfo", "title": EPIC_04_SKILL_ICON_IMAGEINFO_TITLE, "pages": pages}
    payload_digest = digest_bytes(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8"))
    source_ref = _page_source_reference(
        source_id=f"source:gww:epic-04-skill-icons:{payload_digest[:12]}",
        page_title=EPIC_04_SKILL_ICON_IMAGEINFO_TITLE,
        page_id=f"imageinfo:{payload_digest[:12]}",
        revision_id=payload_digest,
        source_revision_timestamp=_latest_imageinfo_timestamp(pages) or retrieved_at,
        retrieved_at=retrieved_at,
        material_class="media-metadata",
    )
    return _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=source_ref,
        title=EPIC_04_SKILL_ICON_IMAGEINFO_TITLE,
        page_id=f"imageinfo:{payload_digest[:12]}",
        revision_id=payload_digest,
        timestamp=_latest_imageinfo_timestamp(pages) or retrieved_at,
        retrieved_at=retrieved_at,
        content=json.dumps(payload, ensure_ascii=False, sort_keys=True),
    )


def _write_imageinfo_snapshot_for_epic10(
    *,
    snapshot_store: SnapshotStore,
    pages: list[dict[str, Any]],
    retrieved_at: str,
) -> SnapshotWriteResult:
    payload = {"kind": "mediawiki-imageinfo", "title": EPIC_10_RUNE_ICON_IMAGEINFO_TITLE, "pages": pages}
    payload_digest = digest_bytes(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8"))
    source_ref = _page_source_reference(
        source_id=f"source:gww:epic-10-rune-icons:{payload_digest[:12]}",
        page_title=EPIC_10_RUNE_ICON_IMAGEINFO_TITLE,
        page_id=f"imageinfo:{payload_digest[:12]}",
        revision_id=payload_digest,
        source_revision_timestamp=_latest_imageinfo_timestamp(pages) or retrieved_at,
        retrieved_at=retrieved_at,
        material_class="media-metadata",
    )
    return _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=source_ref,
        title=EPIC_10_RUNE_ICON_IMAGEINFO_TITLE,
        page_id=f"imageinfo:{payload_digest[:12]}",
        revision_id=payload_digest,
        timestamp=_latest_imageinfo_timestamp(pages) or retrieved_at,
        retrieved_at=retrieved_at,
        content=json.dumps(payload, ensure_ascii=False, sort_keys=True),
    )


def _write_imageinfo_snapshot_for_epic11(
    *,
    snapshot_store: SnapshotStore,
    pages: list[dict[str, Any]],
    retrieved_at: str,
) -> SnapshotWriteResult:
    payload = {"kind": "mediawiki-imageinfo", "title": EPIC_11_INSIGNIA_ICON_IMAGEINFO_TITLE, "pages": pages}
    payload_digest = digest_bytes(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8"))
    source_ref = _page_source_reference(
        source_id=f"source:gww:epic-11-insignia-icons:{payload_digest[:12]}",
        page_title=EPIC_11_INSIGNIA_ICON_IMAGEINFO_TITLE,
        page_id=f"imageinfo:{payload_digest[:12]}",
        revision_id=payload_digest,
        source_revision_timestamp=_latest_imageinfo_timestamp(pages) or retrieved_at,
        retrieved_at=retrieved_at,
        material_class="media-metadata",
    )
    return _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=source_ref,
        title=EPIC_11_INSIGNIA_ICON_IMAGEINFO_TITLE,
        page_id=f"imageinfo:{payload_digest[:12]}",
        revision_id=payload_digest,
        timestamp=_latest_imageinfo_timestamp(pages) or retrieved_at,
        retrieved_at=retrieved_at,
        content=json.dumps(payload, ensure_ascii=False, sort_keys=True),
    )


def _write_imageinfo_snapshot_for_epic12(
    *,
    snapshot_store: SnapshotStore,
    pages: list[dict[str, Any]],
    retrieved_at: str,
) -> SnapshotWriteResult:
    payload = {"kind": "mediawiki-imageinfo", "title": WEAPON_ICON_IMAGEINFO_TITLE, "pages": pages}
    payload_digest = digest_bytes(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8"))
    source_ref = _page_source_reference(
        source_id=f"source:gww:epic-12-weapon-icons:{payload_digest[:12]}",
        page_title=WEAPON_ICON_IMAGEINFO_TITLE,
        page_id=f"imageinfo:{payload_digest[:12]}",
        revision_id=payload_digest,
        source_revision_timestamp=_latest_imageinfo_timestamp(pages) or retrieved_at,
        retrieved_at=retrieved_at,
        material_class="media-metadata",
    )
    return _write_page_snapshot(
        snapshot_store=snapshot_store,
        source_reference=source_ref,
        title=WEAPON_ICON_IMAGEINFO_TITLE,
        page_id=f"imageinfo:{payload_digest[:12]}",
        revision_id=payload_digest,
        timestamp=_latest_imageinfo_timestamp(pages) or retrieved_at,
        retrieved_at=retrieved_at,
        content=json.dumps(payload, ensure_ascii=False, sort_keys=True),
    )


def _profession_icon_titles(profession_pages: dict[str, str]) -> list[str]:
    titles: list[str] = []
    for wikitext in profession_pages.values():
        match = re.search(r"icon\s*=\s*\[\[(?:Image|File):([^\]|]+)", wikitext, flags=re.IGNORECASE)
        if match is not None:
            titles.append(f"File:{match.group(1).strip()}")
    return sorted(set(titles))


def _skill_icon_titles(detail_pages: list[dict[str, Any]], limit: int) -> list[str]:
    titles: list[str] = []
    for detail in detail_pages:
        if len(titles) >= limit:
            break
        explicit = _skill_infobox_image(str(detail.get("content", "")))
        for candidate in candidate_file_titles(str(detail["canonicalTitle"]), explicit):
            if candidate not in titles:
                titles.append(candidate)
            if len(titles) >= limit:
                break
    return titles


def _rune_icon_titles(detail_pages: list[dict[str, Any]], limit: int) -> list[str]:
    titles: list[str] = []
    seen: set[str] = set()
    for detail in detail_pages:
        if len(titles) >= limit:
            break
        for title in _rune_infobox_images(str(detail.get("content", ""))):
            if title not in seen:
                seen.add(title)
                titles.append(title)
            if len(titles) >= limit:
                break
    return titles


def _rune_infobox_images(wikitext: str) -> list[str]:
    match = re.search(r"^\s*\|\s*image\s*=\s*([^\n]+)", wikitext, flags=re.IGNORECASE | re.MULTILINE)
    if match is None:
        return []
    result = []
    for file_match in re.finditer(r"\[\[(?:Image|File):([^|\]]+)", match.group(1), flags=re.IGNORECASE):
        result.append(f"File:{file_match.group(1).strip()}")
    return result


def _skill_infobox_image(wikitext: str) -> str | None:
    match = re.search(r"^\s*\|\s*image\s*=\s*([^\n]+)", wikitext, flags=re.IGNORECASE | re.MULTILINE)
    if match is None:
        return None
    value = match.group(1).strip()
    return value or None


def _review_epic04_resolution_diagnostics(diagnostics: list[Diagnostic]) -> list[Diagnostic]:
    reviewed: list[Diagnostic] = []
    for diagnostic in diagnostics:
        if diagnostic.code in {"API_MISSING_PAGE", "SKILL_DETAIL_PAGE_MISSING"}:
            reviewed.append(
                Diagnostic(
                    code=diagnostic.code,
                    severity=diagnostic.severity,
                    message=diagnostic.message,
                    category=diagnostic.category,
                    scope_kind=diagnostic.scope_kind,
                    artifact_path=diagnostic.artifact_path,
                    record_id=diagnostic.record_id,
                    field_path=diagnostic.field_path,
                    source_ids=diagnostic.source_ids,
                    evidence=diagnostic.evidence,
                    disposition="excluded",
                )
            )
        else:
            reviewed.append(diagnostic)
    return reviewed


def _epic04_manual_reviews(
    *,
    generated_at: str,
    source_plan: dict[str, Any],
    snapshot_set_digest: str,
    artifact_digest: str,
) -> list[dict[str, Any]]:
    return [
        {
            "id": "review:epic-04-source-set:2026-09-01",
            "reviewer": "Build Wars sprint executor",
            "reviewedAt": generated_at,
            "scope": "EPIC-04 source-set digest, ranged-page amendment, profession skill list authority, and PvE-only skill list authority",
            "decision": "approved",
            "rationale": "The missing /Skills/0 page is retained only as blocker history; the approved live index and ranged pages provide the ID lookup, while profession list pages and the PvE-only list define promoted source-set seed authority.",
            "evidence": [
                {
                    "kind": "source",
                    "reference": str(source_plan["summary"]["sourceSetDigest"]),
                    "notes": "Digest of source-set index, ranged pages, profession list rows, PvE-only list rows, supplemental seeds, and accepted seeds.",
                }
            ],
            "relatedFindingIds": [],
            "followUpTicketIds": [],
            "expiresAt": None,
            "reReviewTrigger": "Any source-set index, ranged page revision, profession list revision, PvE-only list revision, accepted seed policy, or source-plan digest change.",
        },
        {
            "id": "review:epic-04-profession-list-authority:2026-09-03",
            "reviewer": "Build Wars sprint executor",
            "reviewedAt": generated_at,
            "scope": "EPIC-04 playable profession skill membership",
            "decision": "approved",
            "rationale": "Guild Wars Wiki profession skill list pages define which skill records are promoted into the runtime profession-skill catalog; off-list game-integration skills are not promoted in this schema version.",
            "evidence": [
                {
                    "kind": "source",
                    "reference": str(source_plan["summary"]["sourceSetDigest"]),
                    "notes": "Profession skill list rows, supplemental source seeds, and range ID lookup records are part of this digest.",
                }
            ],
            "relatedFindingIds": [],
            "followUpTicketIds": [],
            "expiresAt": None,
            "reReviewTrigger": "Any profession list page revision, row parser change, or promotion policy change.",
        },
        {
            "id": "review:epic-04-pve-only-list-authority:2026-09-03",
            "reviewer": "Build Wars sprint executor",
            "reviewedAt": generated_at,
            "scope": "EPIC-04 PvE-only skill membership",
            "decision": "approved",
            "rationale": "Guild Wars Wiki List of PvE-only skills supplies the promoted PvE-only seed rows not covered by profession skill lists and preserves title-track PvE grouping evidence.",
            "evidence": [
                {
                    "kind": "source",
                    "reference": str(source_plan["summary"]["sourceSetDigest"]),
                    "notes": "PvE-only list rows are included in the source-set digest and resolve IDs through the same game-integration range or supplemental infobox policy.",
                }
            ],
            "relatedFindingIds": [],
            "followUpTicketIds": [],
            "expiresAt": None,
            "reReviewTrigger": "Any PvE-only list page revision, row parser change, or promotion policy change.",
        },
        {
            "id": "review:epic-04-reviewed-concise-descriptions:2026-09-04",
            "reviewer": "Build Wars sprint executor",
            "reviewedAt": generated_at,
            "scope": "EPIC-04 runtime concise description policy",
            "decision": "approved",
            "rationale": "Reviewed concise infobox descriptions are approved as bounded runtime tooltip text; records without concise text keep structured-only fallback.",
            "evidence": [
                {
                    "kind": "artifact",
                    "reference": str(source_plan["summary"]["sourcePlanDigest"]),
                    "notes": "Concise description review is invalidated by source-plan, parser, tokenizer, or description-digest changes.",
                }
            ],
            "relatedFindingIds": [],
            "followUpTicketIds": [],
            "expiresAt": None,
            "reReviewTrigger": "Any source revision, normalized description digest, tokenizer, parser, or projection change.",
        },
        {
            "id": "review:epic-04-first-baseline:2026-09-01",
            "reviewer": "Build Wars sprint executor",
            "reviewedAt": generated_at,
            "scope": "EPIC-04 first promoted skills catalog baseline",
            "decision": "approved",
            "rationale": "This promotion records the selected bounded snapshot set, EPIC-03 dependency digests, concise description policy, generated artifact, and QA state as the first baseline.",
            "evidence": [
                {
                    "kind": "artifact",
                    "reference": snapshot_set_digest,
                    "notes": "Selected complete snapshot-set manifest digest.",
                },
                {
                    "kind": "artifact",
                    "reference": artifact_digest,
                    "notes": "Generated artifact digest is owned by the adjacent manifest.",
                },
            ],
            "relatedFindingIds": [],
            "followUpTicketIds": [],
            "expiresAt": None,
            "reReviewTrigger": "Any semantic projection, schema, source revision, dependency digest, QA gate, or promotion path change.",
        },
    ]


def _latest_imageinfo_timestamp(pages: list[dict[str, Any]]) -> str | None:
    timestamps: list[str] = []
    for page in pages:
        imageinfo = page.get("imageinfo")
        if isinstance(imageinfo, list) and imageinfo and isinstance(imageinfo[0], dict):
            timestamp = imageinfo[0].get("timestamp")
            if isinstance(timestamp, str):
                timestamps.append(timestamp)
    return max(timestamps) if timestamps else None


def _safe_source_part(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-") or "unknown"


def _write_page_snapshot(
    *,
    snapshot_store: SnapshotStore,
    source_reference: dict[str, Any],
    title: str,
    page_id: int | str | None,
    revision_id: int | str | None,
    timestamp: str | None,
    retrieved_at: str,
    content: str,
) -> SnapshotWriteResult:
    payload = {
        "kind": "mediawiki-page",
        "title": title,
        "pageId": page_id,
        "revisionId": revision_id,
        "timestamp": timestamp,
        "content": content,
    }
    return snapshot_store.write_snapshot(
        identity=SnapshotIdentity(
            source_family="guild-wars-wiki",
            material_kind="page",
            title=title,
            page_id=page_id,
            revision_id=revision_id,
        ),
        payload=payload,
        source_reference=source_reference,
        retrieved_at=retrieved_at,
        source_revision_id=revision_id,
        source_revision_timestamp=timestamp,
        notes="Local fixture snapshot; minimized and policy-reviewed for parser/platform tests.",
    )


def _snapshot_content(snapshot_store: SnapshotStore, result: SnapshotWriteResult) -> str:
    loaded = snapshot_store.load_snapshot(result.manifest_path)
    payload = json.loads(loaded.payload.decode("utf-8"))
    if not isinstance(payload, dict) or not isinstance(payload.get("content"), str):
        raise PipelineError("Snapshot payload did not contain string content")
    return payload["content"]


def _resolve_fixture_icons(
    *,
    skill_records: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    source_reference: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[Diagnostic]]:
    records: list[dict[str, Any]] = []
    diagnostics: list[Diagnostic] = []
    explicit_by_title = {"Fixture Flame": "File:Fixture Flame.png"}
    for skill in skill_records[:2]:
        metadata, icon_diagnostics = resolve_icon_metadata(
            page_title=str(skill["title"]),
            source_id=str(source_reference["id"]),
            source_reference=source_reference,
            imageinfo_pages=imageinfo_pages,
            explicit_image=explicit_by_title.get(str(skill["title"])),
        )
        diagnostics.extend(icon_diagnostics)
        if metadata is not None:
            records.append(metadata)
    records.sort(key=lambda item: str(item["id"]))
    return records, diagnostics


def _parser_proof_wire(parser_proof: dict[str, Any]) -> dict[str, Any]:
    return {
        "source": parser_proof["source"],
        "recommendation": parser_proof["recommendation"],
        "templateCount": len(parser_proof["templates"]),
        "templates": parser_proof["templates"],
        "redirectTarget": parser_proof["redirectTarget"],
        "disambiguationPreamble": parser_proof["disambiguationPreamble"],
        "commentCount": len(parser_proof["comments"]),
        "nowikiCount": len(parser_proof["nowiki"]),
    }


def _page_source_reference(
    *,
    source_id: str,
    page_title: str,
    page_id: int | str | None,
    revision_id: int | str | None,
    source_revision_timestamp: str | None,
    retrieved_at: str,
    material_class: str = "factual-metadata",
) -> dict[str, Any]:
    return source_reference(
        source_id=source_id,
        name="Guild Wars Wiki",
        canonical_url=f"https://wiki.guildwars.com/wiki/{page_title.replace(' ', '_')}",
        page_id=page_id,
        page_title=page_title,
        revision_id=revision_id,
        source_revision_timestamp=source_revision_timestamp,
        retrieved_at=retrieved_at,
        material_class=material_class,
        notes="Fixture source reference for EPIC-02 ingestion tooling.",
    )


def _relative_to_root(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def _first_revision(page: dict[str, Any]) -> dict[str, Any]:
    revisions = page.get("revisions")
    if isinstance(revisions, list) and revisions and isinstance(revisions[0], dict):
        return revisions[0]
    raise PipelineError(f"MediaWiki page did not include revision metadata: {page.get('title')}")


def _revision_content(revision: dict[str, Any]) -> str:
    slots = revision.get("slots")
    if isinstance(slots, dict):
        main = slots.get("main")
        if isinstance(main, dict) and isinstance(main.get("content"), str):
            return main["content"]
    if isinstance(revision.get("content"), str):
        return revision["content"]
    raise PipelineError("MediaWiki revision did not include content")
