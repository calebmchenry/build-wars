from __future__ import annotations

import json
import re
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Any

from .api import MediaWikiClient
from .artifacts import compare_baseline, write_generated_artifact
from .attribute_points import extract_attribute_point_rules
from .config import FIXTURE_GENERATED_AT, GENERATOR_NAME, INGESTION_SCHEMA_VERSION, RuntimeRoots
from .icons import resolve_icon_metadata
from .models import Diagnostic, Evidence, digest_bytes, source_reference
from .profession_attribute_catalog import assemble_profession_attribute_catalog
from .professions_attributes import extract_professions_and_attributes
from .profiles import EPIC_02_PROFILE_ID, EPIC_03_ICON_IMAGEINFO_TITLE, EPIC_03_PROFILE_ID, profile_by_id
from .qa import build_report, exit_code_for_report, write_report
from .skill_ids import SkillIdSource, enumerate_skill_ids
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
    return result


def run_offline(options: PipelineOptions) -> PipelineResult:
    if options.profile == EPIC_03_PROFILE_ID:
        return _run_epic03_offline(options)

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
        if "Game integration/Skills" in title and isinstance(source_ref, dict):
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


def _profession_icon_titles(profession_pages: dict[str, str]) -> list[str]:
    titles: list[str] = []
    for wikitext in profession_pages.values():
        match = re.search(r"icon\s*=\s*\[\[(?:Image|File):([^\]|]+)", wikitext, flags=re.IGNORECASE)
        if match is not None:
            titles.append(f"File:{match.group(1).strip()}")
    return sorted(set(titles))


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
