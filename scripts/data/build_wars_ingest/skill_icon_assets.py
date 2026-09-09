from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Any

from .api import ApiError, MediaWikiClient
from .artifacts import atomic_write, canonical_json_bytes
from .config import GENERATOR_NAME, INGESTION_SCHEMA_VERSION, IngestLimits, SystemClock
from .icons import candidate_file_titles


SKILL_ICON_LIMITS = IngestLimits(
    request_timeout_seconds=10.0,
    response_byte_cap=5_000_000,
    max_retries=3,
    max_retry_delay_seconds=5.0,
    max_continuation_pages=20,
    batch_size=25,
    page_limit=10_000,
    request_limit=500,
    max_parser_bytes=750_000,
)

RUNTIME_MANIFEST_PATH = Path("src/app/skill-icon-assets.generated.json")
PROVENANCE_MANIFEST_PATH = Path("data/generated/epic-04/skill-icon-assets.manifest.json")
PUBLIC_SUBDIR = "gww-icons/skills"
USE_DECISION = "approved-by-adr-0002-runtime-gww-icon-assets"
IGNORED_PAGE_IMAGE_KEYS = {
    "file:anomaly.png",
    "file:bug.png",
    "file:cross white.png",
    "file:disambig icon.png",
    "file:gold.gif",
    "file:hardmodepartypanel.jpg",
    "file:historic content.png",
    "file:platinum.gif",
}


class SkillIconAssetError(RuntimeError):
    pass


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Cache Guild Wars Wiki skill icons as local runtime assets."
    )
    parser.add_argument("--root", type=Path, default=Path("."), help="Repository root.")
    parser.add_argument(
        "--catalog",
        type=Path,
        default=Path("data/generated/epic-04/skills.catalog.json"),
        help="Promoted EPIC-04 skill catalog path, relative to --root unless absolute.",
    )
    parser.add_argument(
        "--public-root",
        type=Path,
        default=Path("public"),
        help="Vite public root, relative to --root unless absolute.",
    )
    parser.add_argument(
        "--public-subdir",
        default=PUBLIC_SUBDIR,
        help="Public subdirectory for cached icons.",
    )
    parser.add_argument(
        "--runtime-manifest",
        type=Path,
        default=RUNTIME_MANIFEST_PATH,
        help="Runtime JSON manifest, relative to --root unless absolute.",
    )
    parser.add_argument(
        "--provenance-manifest",
        type=Path,
        default=PROVENANCE_MANIFEST_PATH,
        help="Audit/provenance JSON manifest, relative to --root unless absolute.",
    )
    parser.add_argument(
        "--imageinfo-json",
        type=Path,
        default=None,
        help="Optional imageinfo fixture/cache JSON with a top-level pages array.",
    )
    parser.add_argument(
        "--page-images-json",
        type=Path,
        default=None,
        help="Optional page images fixture/cache JSON keyed by page title.",
    )
    parser.add_argument("--generated-at", default=None, help="UTC ISO-8601 timestamp.")
    parser.add_argument("--allow-live-network", action="store_true", help="Required for live API use.")
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Write manifests from imageinfo without downloading image binaries.",
    )
    parser.add_argument("--skill-limit", type=int, default=None, help="Bounded smoke-test limit.")
    parser.add_argument(
        "--download-delay",
        type=float,
        default=0.02,
        help="Seconds to sleep after each downloaded image.",
    )
    parser.add_argument(
        "--strict-remote-sha1",
        action="store_true",
        help="Fail when downloaded bytes do not match the MediaWiki imageinfo SHA-1.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    root = args.root.resolve()
    generated_at = args.generated_at or SystemClock().now()
    try:
        catalog_path = _resolve_under_root(root, args.catalog)
        public_root = _resolve_under_root(root, args.public_root)
        runtime_manifest_path = _resolve_under_root(root, args.runtime_manifest)
        provenance_manifest_path = _resolve_under_root(root, args.provenance_manifest)
        catalog = _read_json(catalog_path)
        skills = _catalog_skills(catalog, args.skill_limit)
        page_images_by_title = _load_or_fetch_page_images(
            root=root,
            page_images_path=args.page_images_json,
            skills=skills,
            allow_live_network=args.allow_live_network,
        )
        imageinfo_pages = _load_or_fetch_imageinfo(
            root=root,
            imageinfo_path=args.imageinfo_json,
            skills=skills,
            catalog=catalog,
            allow_live_network=args.allow_live_network,
            page_images_by_title=page_images_by_title,
        )
        result = build_skill_icon_asset_manifests(
            catalog=catalog,
            skills=skills,
            imageinfo_pages=imageinfo_pages,
            page_images_by_title=page_images_by_title,
            generated_at=generated_at,
            public_subdir=args.public_subdir,
        )
        faction_ids = {
            str(skill["id"]) for skill in skills
            if re.search(r" \((Kurzick|Luxon)\)$", str(skill["name"]))
        }
        missing_factions = faction_ids - result["runtimeManifest"]["assetsBySkillId"].keys()
        if missing_factions:
            raise SkillIconAssetError(f"Faction icons unresolved; manifests were not changed: {sorted(missing_factions)}")
        if not args.skip_download:
            download_skill_icon_assets(
                asset_records=result["provenanceManifest"]["assets"],
                public_root=public_root,
                public_subdir=args.public_subdir,
                delay_seconds=args.download_delay,
                strict_remote_sha1=args.strict_remote_sha1,
            )
        _write_json(runtime_manifest_path, result["runtimeManifest"])
        _write_json(provenance_manifest_path, result["provenanceManifest"])
    except (ApiError, OSError, SkillIconAssetError, ValueError, json.JSONDecodeError) as exc:
        print(f"skill icon cache failed: {exc}", file=sys.stderr)
        return 2

    summary = result["provenanceManifest"]["summary"]
    print(f"skills: {summary['skillCount']}")
    print(f"runtimeSkillIcons: {summary['runtimeSkillIconCount']}")
    print(f"uniqueAssets: {summary['uniqueAssetCount']}")
    print(f"unresolvedSkills: {summary['unresolvedSkillCount']}")
    print(f"runtimeManifest: {_relative_to(root, runtime_manifest_path)}")
    print(f"provenanceManifest: {_relative_to(root, provenance_manifest_path)}")
    return 0


def build_skill_icon_asset_manifests(
    *,
    catalog: dict[str, Any],
    skills: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    generated_at: str,
    page_images_by_title: dict[str, list[str]] | None = None,
    public_subdir: str = PUBLIC_SUBDIR,
) -> dict[str, dict[str, Any]]:
    imageinfo_by_title = _valid_imageinfo_by_title(imageinfo_pages)
    remote_media_by_id = {
        str(item["id"]): item
        for item in catalog.get("remoteMedia", [])
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    }
    selected: list[dict[str, Any]] = []
    unresolved: list[dict[str, Any]] = []
    for skill in skills:
        selection = _select_skill_icon(
            skill,
            imageinfo_by_title,
            remote_media_by_id,
            page_images_by_title or {},
        )
        if selection["status"] == "selected":
            selected.append(selection)
        else:
            unresolved.append(selection)

    assets = _asset_records(selected, public_subdir)
    assets_by_key = {str(asset["assetKey"]): asset for asset in assets}
    assets_by_skill_id: dict[str, dict[str, Any]] = {}
    for selection in selected:
        asset = assets_by_key[str(selection["assetKey"])]
        skill = selection["skill"]
        assets_by_skill_id[str(skill["id"])] = {
            "src": asset["src"],
            "label": f"{skill['name']} icon",
            "width": asset["width"],
            "height": asset["height"],
        }

    runtime_manifest = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "generatedAt": generated_at,
        "sourceCatalogVersion": catalog.get("catalogVersion"),
        "assetRoot": f"/{public_subdir.strip('/')}",
        "summary": {
            "skillCount": len(skills),
            "runtimeSkillIconCount": len(assets_by_skill_id),
            "uniqueAssetCount": len(assets),
            "unresolvedSkillCount": len(unresolved),
        },
        "assetsBySkillId": assets_by_skill_id,
    }
    provenance_manifest = {
        "schemaVersion": INGESTION_SCHEMA_VERSION,
        "generatedAt": generated_at,
        "generator": GENERATOR_NAME,
        "sourceCatalog": {
            "path": "data/generated/epic-04/skills.catalog.json",
            "catalogVersion": catalog.get("catalogVersion"),
            "skillCount": len(catalog.get("skills", [])) if isinstance(catalog.get("skills"), list) else None,
        },
        "runtimeManifestPath": RUNTIME_MANIFEST_PATH.as_posix(),
        "assetRoot": f"public/{public_subdir.strip('/')}",
        "useDecision": USE_DECISION,
        "summary": runtime_manifest["summary"],
        "assets": assets,
        "unresolved": [_unresolved_record(item) for item in unresolved],
    }
    return {"runtimeManifest": runtime_manifest, "provenanceManifest": provenance_manifest}


def download_skill_icon_assets(
    *,
    asset_records: list[dict[str, Any]],
    public_root: Path,
    public_subdir: str = PUBLIC_SUBDIR,
    delay_seconds: float,
    strict_remote_sha1: bool = False,
) -> None:
    for index, asset in enumerate(asset_records, start=1):
        local_path = public_root / str(asset["localPublicPath"]).removeprefix("/")
        expected_sha1 = str(asset["remoteSha1"]) if asset.get("remoteSha1") else None
        expected_size = int(asset["sizeBytes"]) if isinstance(asset.get("sizeBytes"), int) else None
        if local_path.exists():
            existing = local_path.read_bytes()
            existing_sha1 = _sha1(existing)
            if existing_sha1 == expected_sha1 or (
                not strict_remote_sha1 and expected_size is not None and len(existing) == expected_size
            ):
                asset["cacheState"] = "already-current"
                asset["downloadSha1"] = existing_sha1
                asset["remoteSha1Matches"] = existing_sha1 == expected_sha1
                continue
        body = _download_bytes(str(asset["canonicalUrl"]))
        actual_sha1 = hashlib.sha1(body).hexdigest()
        asset["downloadSha1"] = actual_sha1
        asset["remoteSha1Matches"] = actual_sha1 == expected_sha1
        if expected_size is not None and len(body) != expected_size:
            raise SkillIconAssetError(
                f"Downloaded icon size mismatch for {asset['fileTitle']}: {len(body)}"
            )
        if strict_remote_sha1 and expected_sha1 is not None and actual_sha1.casefold() != expected_sha1.casefold():
            raise SkillIconAssetError(
                f"Downloaded icon SHA-1 mismatch for {asset['fileTitle']}: {actual_sha1}"
            )
        if expected_sha1 is not None and actual_sha1.casefold() != expected_sha1.casefold():
            asset["cacheState"] = "downloaded-remote-sha1-mismatch"
        else:
            asset["cacheState"] = "downloaded"
        atomic_write(local_path, body)
        if index % 100 == 0:
            print(f"downloaded/checked {index}/{len(asset_records)} skill icon assets")
        if delay_seconds > 0:
            time.sleep(delay_seconds)
    pruned = _prune_stale_assets(
        public_root=public_root,
        public_subdir=public_subdir,
        asset_records=asset_records,
    )
    if pruned > 0:
        print(f"pruned stale skill icon assets: {pruned}")


def _load_or_fetch_imageinfo(
    *,
    root: Path,
    imageinfo_path: Path | None,
    skills: list[dict[str, Any]],
    catalog: dict[str, Any],
    allow_live_network: bool,
    page_images_by_title: dict[str, list[str]],
) -> list[dict[str, Any]]:
    if imageinfo_path is not None:
        payload = _read_json(_resolve_under_root(root, imageinfo_path))
        pages = payload.get("pages") if isinstance(payload, dict) else None
        if not isinstance(pages, list):
            raise SkillIconAssetError("--imageinfo-json must contain a top-level pages array")
        return [page for page in pages if isinstance(page, dict)]
    if not allow_live_network:
        raise SkillIconAssetError("live imageinfo resolution requires --allow-live-network")
    remote_media_by_id = {
        str(item["id"]): item
        for item in catalog.get("remoteMedia", [])
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    }
    titles = _all_candidate_titles(skills, remote_media_by_id, page_images_by_title)
    client = MediaWikiClient(limits=SKILL_ICON_LIMITS)
    pages, diagnostics = client.query_imageinfo(titles)
    if diagnostics:
        print(f"imageinfo missing candidates: {len(diagnostics)}")
    print(f"imageinfo requests: {client.request_count}")
    return pages


def _load_or_fetch_page_images(
    *,
    root: Path,
    page_images_path: Path | None,
    skills: list[dict[str, Any]],
    allow_live_network: bool,
) -> dict[str, list[str]]:
    if page_images_path is not None:
        payload = _read_json(_resolve_under_root(root, page_images_path))
        result: dict[str, list[str]] = {}
        for title, images in payload.items():
            if isinstance(title, str) and isinstance(images, list):
                result[_page_title_key(title)] = [_file_title(str(image)) for image in images]
        return result
    if not allow_live_network:
        return {}
    client = MediaWikiClient(limits=SKILL_ICON_LIMITS)
    page_images = _query_page_images(skills, client)
    print(f"page image requests: {client.request_count}")
    return page_images


def _query_page_images(
    skills: list[dict[str, Any]], client: MediaWikiClient
) -> dict[str, list[str]]:
    titles: list[str] = []
    seen: set[str] = set()
    for skill in skills:
        page_identity = skill.get("pageIdentity")
        title = page_identity.get("canonicalTitle") if isinstance(page_identity, dict) else None
        if isinstance(title, str) and title.strip() and _page_title_key(title) not in seen:
            seen.add(_page_title_key(title))
            titles.append(title.strip())

    result: dict[str, list[str]] = {}
    for chunk in _chunks(titles, client.limits.batch_size):
        responses = client.continue_query(
            {
                "action": "query",
                "prop": "images",
                "titles": "|".join(chunk),
                "imlimit": "max",
                "redirects": "1",
            }
        )
        for payload in responses:
            aliases = _query_title_aliases(payload)
            query = payload.get("query")
            pages = query.get("pages") if isinstance(query, dict) else None
            if not isinstance(pages, list):
                raise SkillIconAssetError("MediaWiki page image response did not include pages")
            for page in pages:
                if not isinstance(page, dict) or not isinstance(page.get("title"), str):
                    continue
                images = _page_image_titles(page)
                if not images:
                    continue
                title_key = _page_title_key(str(page["title"]))
                result.setdefault(title_key, [])
                result[title_key] = _append_unique(result[title_key], images)
            for requested_title in chunk:
                alias = aliases.get(_page_title_key(requested_title))
                if alias is not None and alias in result:
                    result[_page_title_key(requested_title)] = result[alias]
    return result


def _select_skill_icon(
    skill: dict[str, Any],
    imageinfo_by_title: dict[str, dict[str, Any]],
    remote_media_by_id: dict[str, dict[str, Any]],
    page_images_by_title: dict[str, list[str]],
) -> dict[str, Any]:
    groups = _candidate_title_groups(skill, remote_media_by_id, page_images_by_title)
    for group in groups:
        matches = [imageinfo_by_title[_image_title_key(title)] for title in group if _image_title_key(title) in imageinfo_by_title]
        if len(matches) == 1:
            source = _source_record(matches[0])
            return {
                "status": "selected",
                "skill": skill,
                "assetKey": _asset_key(source),
                "source": source,
                "candidates": _flatten_candidate_groups(groups),
            }
        if len(matches) > 1:
            return {
                "status": "unresolved",
                "reason": "ambiguous-default-candidates",
                "skill": skill,
                "candidates": group,
            }
    return {
        "status": "unresolved",
        "reason": "missing-imageinfo",
        "skill": skill,
        "candidates": _flatten_candidate_groups(groups),
    }


def _asset_records(selections: list[dict[str, Any]], public_subdir: str) -> list[dict[str, Any]]:
    selections_by_asset_key: dict[str, list[dict[str, Any]]] = defaultdict(list)
    source_by_asset_key: dict[str, dict[str, Any]] = {}
    for selection in selections:
        key = str(selection["assetKey"])
        selections_by_asset_key[key].append(selection)
        source_by_asset_key[key] = selection["source"]

    filenames: dict[str, str] = {}
    claimed: dict[str, str] = {}
    for asset_key in sorted(source_by_asset_key):
        source = source_by_asset_key[asset_key]
        filename = _asset_filename(source)
        claimed_by = claimed.get(filename)
        if claimed_by is not None and claimed_by != asset_key:
            filename = _asset_filename(source, suffix=asset_key[:8])
        claimed[filename] = asset_key
        filenames[asset_key] = filename

    assets: list[dict[str, Any]] = []
    for asset_key in sorted(source_by_asset_key):
        source = source_by_asset_key[asset_key]
        filename = filenames[asset_key]
        local_public_path = f"/{public_subdir.strip('/')}/{filename}"
        skill_ids = sorted(int(selection["skill"]["id"]) for selection in selections_by_asset_key[asset_key])
        skill_names = sorted({str(selection["skill"]["name"]) for selection in selections_by_asset_key[asset_key]})
        assets.append(
            {
                "assetKey": asset_key,
                "src": local_public_path,
                "localPublicPath": local_public_path,
                "fileTitle": source["fileTitle"],
                "canonicalUrl": source["canonicalUrl"],
                "descriptionUrl": source.get("descriptionUrl"),
                "mimeType": source["mimeType"],
                "width": source["width"],
                "height": source["height"],
                "sizeBytes": source.get("sizeBytes"),
                "remoteTimestamp": source.get("remoteTimestamp"),
                "remoteSha1": source.get("remoteSha1"),
                "skillIds": skill_ids,
                "skillNames": skill_names,
                "cacheState": "pending",
            }
        )
    return assets


def _all_candidate_titles(
    skills: list[dict[str, Any]],
    remote_media_by_id: dict[str, dict[str, Any]],
    page_images_by_title: dict[str, list[str]],
) -> list[str]:
    titles: list[str] = []
    seen: set[str] = set()
    for skill in skills:
        for title in _flatten_candidate_groups(
            _candidate_title_groups(skill, remote_media_by_id, page_images_by_title)
        ):
            key = _image_title_key(title)
            if key not in seen:
                seen.add(key)
                titles.append(title)
    return titles


def _candidate_title_groups(
    skill: dict[str, Any],
    remote_media_by_id: dict[str, dict[str, Any]],
    page_images_by_title: dict[str, list[str]],
) -> list[list[str]]:
    # Shared allegiance pages contain a stacked Kurzick/Luxon image. Only the
    # explicitly named faction asset is eligible; a missing one must not fall
    # back to the other faction, a composite, or an unrelated page image.
    if re.search(r" \((Kurzick|Luxon)\)$", str(skill.get("name", ""))):
        return [candidate_file_titles(str(skill["name"]))]
    groups: list[list[str]] = []
    icon_id = skill.get("iconId")
    if isinstance(icon_id, str):
        media = remote_media_by_id.get(icon_id)
        if isinstance(media, dict) and isinstance(media.get("fileTitle"), str):
            groups.append([_file_title(str(media["fileTitle"]))])

    page_image_titles = _skill_page_image_titles(skill, page_images_by_title)
    default_titles = {
        _image_title_key(candidate)
        for title in _skill_title_candidates(skill)
        for candidate in candidate_file_titles(title)
    }
    matching_page_images = [
        title
        for title in page_image_titles
        if _image_title_key(title) in default_titles and not _ignored_page_image(title)
    ]
    if matching_page_images:
        groups.append([matching_page_images[0]])
    else:
        fallback_page_images = [title for title in page_image_titles if not _ignored_page_image(title)]
        if fallback_page_images:
            groups.append([fallback_page_images[0]])

    seen_titles: set[str] = set()
    for title in _skill_title_candidates(skill):
        if _page_title_key(title) in seen_titles:
            continue
        seen_titles.add(_page_title_key(title))
        groups.append(candidate_file_titles(title))
    return groups


def _skill_title_candidates(skill: dict[str, Any]) -> list[str]:
    candidates: list[str] = []
    page_identity = skill.get("pageIdentity")
    for value in (
        page_identity.get("canonicalTitle") if isinstance(page_identity, dict) else None,
        skill.get("name"),
        page_identity.get("requestedTitle") if isinstance(page_identity, dict) else None,
    ):
        if isinstance(value, str) and value.strip():
            candidates.append(value.strip())
            pvp_base = re.sub(r"\s+\(Pv[EP]\)$", "", value.strip())
            if pvp_base != value.strip():
                candidates.append(pvp_base)
    return candidates


def _flatten_candidate_groups(groups: list[list[str]]) -> list[str]:
    titles: list[str] = []
    seen: set[str] = set()
    for group in groups:
        for title in group:
            key = _image_title_key(title)
            if key not in seen:
                seen.add(key)
                titles.append(title)
    return titles


def _valid_imageinfo_by_title(pages: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for page in pages:
        if page.get("missing") is True or not isinstance(page.get("title"), str):
            continue
        imageinfo = page.get("imageinfo")
        if not isinstance(imageinfo, list) or not imageinfo or not isinstance(imageinfo[0], dict):
            continue
        if not _supported_skill_icon_info(imageinfo[0]):
            continue
        result[_image_title_key(str(page["title"]))] = page
    return result


def _supported_skill_icon_info(imageinfo: dict[str, Any]) -> bool:
    width = imageinfo.get("width")
    height = imageinfo.get("height")
    return (
        imageinfo.get("mime") in {"image/jpeg", "image/png"}
        and isinstance(width, int)
        and isinstance(height, int)
        and width == height
        and 40 <= width <= 256
        and 40 <= height <= 256
    )


def _query_title_aliases(payload: dict[str, Any]) -> dict[str, str]:
    query = payload.get("query")
    aliases: dict[str, str] = {}
    if not isinstance(query, dict):
        return aliases
    normalized: dict[str, str] = {}
    redirects: dict[str, str] = {}
    for item in query.get("normalized", []) if isinstance(query.get("normalized"), list) else []:
        if isinstance(item, dict):
            normalized[_page_title_key(str(item.get("from")))] = _page_title_key(str(item.get("to")))
    for item in query.get("redirects", []) if isinstance(query.get("redirects"), list) else []:
        if isinstance(item, dict):
            redirects[_page_title_key(str(item.get("from")))] = _page_title_key(str(item.get("to")))
    for source, normalized_title in normalized.items():
        aliases[source] = redirects.get(normalized_title, normalized_title)
    for source, target in redirects.items():
        aliases[source] = target
    return aliases


def _page_image_titles(page: dict[str, Any]) -> list[str]:
    images = page.get("images")
    if not isinstance(images, list):
        return []
    titles: list[str] = []
    for image in images:
        if isinstance(image, dict) and isinstance(image.get("title"), str):
            titles.append(_file_title(str(image["title"])))
    return titles


def _skill_page_image_titles(
    skill: dict[str, Any], page_images_by_title: dict[str, list[str]]
) -> list[str]:
    for title in _skill_title_candidates(skill):
        images = page_images_by_title.get(_page_title_key(title))
        if images:
            return images
    return []


def _ignored_page_image(title: str) -> bool:
    normalized = _image_title_key(title)
    return normalized.startswith("file:tango-") or normalized in IGNORED_PAGE_IMAGE_KEYS


def _source_record(page: dict[str, Any]) -> dict[str, Any]:
    imageinfo = page["imageinfo"][0]
    return {
        "fileTitle": str(page["title"]),
        "canonicalUrl": str(imageinfo.get("url") or imageinfo.get("descriptionurl") or ""),
        "descriptionUrl": imageinfo.get("descriptionurl"),
        "mimeType": imageinfo.get("mime"),
        "width": imageinfo.get("width"),
        "height": imageinfo.get("height"),
        "sizeBytes": imageinfo.get("size"),
        "remoteTimestamp": imageinfo.get("timestamp"),
        "remoteSha1": imageinfo.get("sha1"),
    }


def _unresolved_record(selection: dict[str, Any]) -> dict[str, Any]:
    skill = selection["skill"]
    return {
        "skillId": skill.get("id"),
        "skillName": skill.get("name"),
        "reason": selection["reason"],
        "candidateFileTitles": selection["candidates"],
    }


def _asset_key(source: dict[str, Any]) -> str:
    if isinstance(source.get("remoteSha1"), str) and source["remoteSha1"]:
        return str(source["remoteSha1"]).casefold()
    return hashlib.sha1(str(source["canonicalUrl"]).encode("utf-8")).hexdigest()


def _asset_filename(source: dict[str, Any], suffix: str | None = None) -> str:
    title = str(source["fileTitle"]).split(":", 1)[-1]
    stem = re.sub(r"\.[^.]+$", "", title)
    slug = _slug(stem) or "skill-icon"
    ext = _asset_extension(source)
    return f"{slug}{f'-{suffix}' if suffix else ''}.{ext}"


def _asset_extension(source: dict[str, Any]) -> str:
    title = str(source.get("fileTitle", ""))
    match = re.search(r"\.([A-Za-z0-9]+)$", title)
    if match is not None:
        ext = match.group(1).lower()
        return "jpg" if ext == "jpeg" else ext
    mime = source.get("mimeType")
    if mime == "image/png":
        return "png"
    return "jpg"


def _file_title(value: str) -> str:
    title = value.strip()
    title = re.sub(r"^Image:", "File:", title, flags=re.IGNORECASE)
    if not title.lower().startswith("file:"):
        title = f"File:{title}"
    return "File:" + title.split(":", 1)[1].strip()


def _page_title_key(value: str) -> str:
    return re.sub(r"[_\s]+", " ", value.strip()).casefold()


def _image_title_key(value: str) -> str:
    return _page_title_key(_file_title(value))


def _slug(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")


def _download_bytes(url: str) -> bytes:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != "wiki.guildwars.com":
        raise SkillIconAssetError(f"Unexpected icon URL origin: {url}")
    headers = {
        "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
        "User-Agent": (
            "BuildWars/0.1 skill-icon-cache "
            "(local-first fan tooling; contact: https://github.com/build-wars)"
        ),
    }
    last_error: Exception | None = None
    for attempt in range(4):
        request = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(request, timeout=10.0) as response:
                final = urllib.parse.urlparse(response.geturl())
                if final.scheme != "https" or final.netloc != "wiki.guildwars.com":
                    raise SkillIconAssetError(f"Icon download redirected off-origin: {url}")
                return response.read()
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code not in {429, 502, 503, 504} or attempt == 3:
                break
            retry_after = exc.headers.get("Retry-After")
            time.sleep(_retry_delay(attempt, retry_after))
        except (TimeoutError, OSError, urllib.error.URLError) as exc:
            last_error = exc
            if attempt == 3:
                break
            time.sleep(_retry_delay(attempt, None))
    raise SkillIconAssetError(f"Icon download failed for {url}: {last_error}")


def _prune_stale_assets(
    *,
    public_root: Path,
    public_subdir: str,
    asset_records: list[dict[str, Any]],
) -> int:
    asset_dir = public_root / public_subdir.strip("/")
    if not asset_dir.exists():
        return 0
    expected = {
        str(asset["localPublicPath"]).split("/")[-1]
        for asset in asset_records
        if isinstance(asset.get("localPublicPath"), str)
    }
    pruned = 0
    for path in asset_dir.iterdir():
        if not path.is_file() or path.name == "README.md":
            continue
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".gif"}:
            continue
        if path.name not in expected:
            path.unlink()
            pruned += 1
    return pruned


def _retry_delay(attempt: int, retry_after: str | None) -> float:
    if retry_after:
        try:
            return min(max(float(retry_after), 0.0), 5.0)
        except ValueError:
            pass
    return min(0.25 * (2**attempt), 5.0)


def _catalog_skills(catalog: dict[str, Any], limit: int | None) -> list[dict[str, Any]]:
    skills = catalog.get("skills")
    if not isinstance(skills, list):
        raise SkillIconAssetError("Skill catalog must contain a skills array")
    filtered = [skill for skill in skills if isinstance(skill, dict)]
    if limit is not None:
        return filtered[:limit]
    return filtered


def _read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict):
        raise SkillIconAssetError(f"JSON root must be an object: {path}")
    return payload


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    atomic_write(path, canonical_json_bytes(payload))


def _sha1(data: bytes) -> str:
    return hashlib.sha1(data).hexdigest()


def _resolve_under_root(root: Path, path: Path) -> Path:
    return path.resolve() if path.is_absolute() else (root / path).resolve()


def _chunks(items: list[str], size: int) -> list[list[str]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def _append_unique(existing: list[str], additions: list[str]) -> list[str]:
    result = list(existing)
    seen = {_image_title_key(item) for item in result}
    for item in additions:
        key = _image_title_key(item)
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result


def _relative_to(root: Path, path: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


if __name__ == "__main__":
    raise SystemExit(main())
