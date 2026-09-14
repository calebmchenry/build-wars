"""Bounded cache for the pinned attribute-rune release. Never refresh catalog metadata."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import struct
import sys
import urllib.parse
import urllib.request
import zlib

from .artifacts import ArtifactError, atomic_write, canonical_json_bytes, confined_path
from .config import SystemClock

CATALOG = Path("data/generated/epic-10/runes.catalog.json")
RUNTIME = Path("src/app/rune-icon-assets.generated.json")
PROVENANCE = Path("data/generated/epic-10/rune-icon-assets.manifest.json")
PUBLIC = Path("public/gww-icons/runes")
MAX_BYTES = 64_000
EXPECTED_RUNES = 126
EXPECTED_IMAGES = 30


class RuneIconAssetError(ValueError):
    pass


def validate_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    path = urllib.parse.unquote(parsed.path)
    if (parsed.scheme != "https" or parsed.netloc != "wiki.guildwars.com"
            or parsed.query or parsed.fragment
            or not re.fullmatch(r"/images/[0-9a-f]/[0-9a-f]{2}/Rune_[A-Za-z_]+\.png", path)):
        raise RuneIconAssetError(f"Unapproved rune image URL: {url}")
    return url


class CheckedRedirect(urllib.request.HTTPRedirectHandler):
    max_redirections = 3
    max_repeats = 1

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        validate_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def download(media: dict) -> bytes:
    request = urllib.request.Request(validate_url(media["canonicalUrl"]), headers={
        "User-Agent": "BuildWarsRuneCache/1.0 (bounded pinned media cache)"
    })
    with urllib.request.build_opener(CheckedRedirect()).open(request, timeout=15) as response:
        validate_url(response.url)
        if response.headers.get_content_type() != "image/png":
            raise RuneIconAssetError("Rune response is not image/png")
        payload = response.read(MAX_BYTES + 1)
    return payload


def verify_png(payload: bytes, media: dict) -> None:
    if len(payload) > MAX_BYTES or len(payload) != media["sizeBytes"]:
        raise RuneIconAssetError(f"Rune byte size mismatch: {media['fileTitle']}")
    actual = hashlib.sha1(payload).hexdigest()
    if actual != media["remoteSha1"]:
        raise RuneIconAssetError(f"Rune SHA-1 mismatch: {media['fileTitle']}: expected {media['remoteSha1']}, got {actual}")
    if not payload.startswith(b"\x89PNG\r\n\x1a\n"):
        raise RuneIconAssetError("Rune bytes are not PNG")
    offset = 8
    dimensions = None
    ended = False
    while offset + 12 <= len(payload):
        length = struct.unpack(">I", payload[offset:offset+4])[0]
        kind = payload[offset+4:offset+8]
        end = offset + 12 + length
        if end > len(payload):
            raise RuneIconAssetError("Truncated PNG chunk")
        body = payload[offset+8:offset+8+length]
        checksum = struct.unpack(">I", payload[end-4:end])[0]
        if zlib.crc32(kind + body) != checksum:
            raise RuneIconAssetError("PNG checksum mismatch")
        if offset == 8:
            if kind != b"IHDR" or length != 13:
                raise RuneIconAssetError("Missing PNG dimensions")
            dimensions = struct.unpack(">II", body[:8])
        if kind == b"IEND":
            ended = end == len(payload) and length == 0
            break
        offset = end
    if not ended or dimensions != (media["width"], media["height"]):
        raise RuneIconAssetError("Rune PNG dimensions or terminator mismatch")


def release_records(catalog: dict) -> tuple[list[dict], list[dict]]:
    runes = [r for r in catalog["runes"] if r["familyKind"] == "attribute"]
    if len(runes) != EXPECTED_RUNES or len({r["id"] for r in runes}) != EXPECTED_RUNES:
        raise RuneIconAssetError("Pinned release requires 126 unique attribute runes")
    media_by_id = {}
    for media in catalog["remoteMedia"]:
        if media["id"] in media_by_id:
            raise RuneIconAssetError("Duplicate rune media ID")
        media_by_id[media["id"]] = media
    images: dict[tuple, dict] = {}
    titles: dict[str, tuple] = {}
    tiers: dict[tuple, tuple] = {}
    for rune in runes:
        media = media_by_id.get(rune["iconId"])
        if media is None or media["mimeType"] != "image/png":
            raise RuneIconAssetError("Missing PNG rune metadata")
        validate_url(media["canonicalUrl"])
        if not re.fullmatch(r"[a-f0-9]{40}", media["remoteSha1"]):
            raise RuneIconAssetError("Invalid pinned SHA-1")
        if not all(type(media[k]) is int and 1 <= media[k] <= 128 for k in ("width", "height")):
            raise RuneIconAssetError("Rune dimensions out of bounds")
        if not type(media["sizeBytes"]) is int or not 1 <= media["sizeBytes"] <= MAX_BYTES:
            raise RuneIconAssetError("Rune byte size out of bounds")
        key = (media["fileTitle"], media["canonicalUrl"], media["remoteSha1"])
        if media["fileTitle"] in titles and titles[media["fileTitle"]] != key:
            raise RuneIconAssetError("Conflicting source file identity")
        titles[media["fileTitle"]] = key
        tier = (rune["professionId"], rune["familyRank"])
        if tier in tiers and tiers[tier] != key:
            raise RuneIconAssetError("Conflicting profession/tier image")
        tiers[tier] = key
        if key not in images:
            images[key] = {**media, "runeIds": [], "sourceIds": [], "mediaIds": []}
        asset = images[key]
        if any(asset[k] != media[k] for k in ("width", "height", "sizeBytes")):
            raise RuneIconAssetError("Conflicting source dimensions/size")
        asset["runeIds"].append(rune["id"])
        asset["sourceIds"].append(media["sourceId"])
        asset["mediaIds"].append(media["id"])
    expected_tiers = {(p, t) for p in range(1, 11) for t in ("minor", "major", "superior")}
    if len(images) != EXPECTED_IMAGES or set(tiers) != expected_tiers:
        raise RuneIconAssetError("Pinned release requires 30 profession/tier images")
    return sorted(runes, key=lambda r: r["id"]), sorted(images.values(), key=lambda m: m["fileTitle"])


def bounded_read(path: Path, cap: int = MAX_BYTES) -> bytes:
    with path.open("rb") as source:
        payload = source.read(cap + 1)
    if len(payload) > cap:
        raise RuneIconAssetError(f"Input exceeds byte limit: {path.name}")
    return payload


def cache_release(root: Path, cache_dir: Path, *, allow_network: bool = False,
                  generated_at: str | None = None, fetch=download, publish=atomic_write) -> dict:
    root = root.resolve()
    catalog_path = confined_path(root, CATALOG)
    catalog_bytes = bounded_read(catalog_path, 3_000_000)
    catalog = json.loads(catalog_bytes)
    runes, images = release_records(catalog)
    cache_dir = confined_path(root, cache_dir)
    staged: list[tuple[Path, bytes]] = []
    assets = []
    by_rune = {}
    for media in images:
        filename = f"{media['remoteSha1']}.png"
        cached = confined_path(root, cache_dir / filename)
        destination = confined_path(root, PUBLIC / filename)
        if cached.exists():
            payload = bounded_read(cached)
        elif destination.exists():
            payload = bounded_read(destination)
        elif allow_network:
            payload = fetch(media)
        else:
            raise RuneIconAssetError(f"Expected rune bytes unavailable offline: {media['fileTitle']}")
        verify_png(payload, media)
        atomic_write(cached, payload)
        staged.append((destination, payload))
        src = f"gww-icons/runes/{filename}"
        assets.append({k: media[k] for k in ("canonicalUrl", "fileTitle", "remoteSha1", "remoteTimestamp", "width", "height", "sizeBytes", "runeIds", "sourceIds", "mediaIds")} | {
            "src": src, "sha256": hashlib.sha256(payload).hexdigest(), "mimeType": "image/png"
        })
        for rune_id in media["runeIds"]:
            rune = next(r for r in runes if r["id"] == rune_id)
            by_rune[str(rune_id)] = {"src": src, "label": f"{rune['name']} icon", "width": media["width"], "height": media["height"]}
    summary = {"runeCount": len(runes), "uniqueAssetCount": len(assets)}
    runtime = {"schemaVersion": 1, "assetsByRuneId": by_rune, "summary": summary}
    provenance = {"schemaVersion": 1, "catalogVersion": catalog["catalogVersion"],
                  "catalogSha256": hashlib.sha256(catalog_bytes).hexdigest(),
                  "generatedAt": generated_at or SystemClock().now(), "summary": summary,
                  "useDecision": "approved-by-adr-0002-runtime-gww-icon-assets", "assets": assets}
    # All bytes are verified before publication. Content-addressed destinations leave
    # previous runtime maps usable. This is recovery, not crash atomicity across dirs.
    for destination, payload in staged:
        if destination.exists() and bounded_read(destination) != payload:
            raise RuneIconAssetError("Existing immutable rune bytes differ")
        publish(destination, payload)
    manifests = [(confined_path(root, PROVENANCE), canonical_json_bytes(provenance)),
                 (confined_path(root, RUNTIME), canonical_json_bytes(runtime))]
    previous = {path: path.read_bytes() if path.exists() else None for path, _ in manifests}
    try:
        for path, payload in manifests:
            publish(path, payload)
    except OSError:
        for path, payload in previous.items():
            if payload is None:
                path.unlink(missing_ok=True)
            else:
                atomic_write(path, payload)
        raise
    return summary


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--cache-dir", type=Path, default=Path("work/runs/SPRINT-020/rune-cache"))
    parser.add_argument("--allow-live-network", action="store_true")
    parser.add_argument("--generated-at")
    args = parser.parse_args(argv)
    try:
        summary = cache_release(args.root, args.cache_dir, allow_network=args.allow_live_network,
                                generated_at=args.generated_at)
    except (ArtifactError, ValueError, OSError) as exc:
        print(f"rune icon cache failed: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(summary, sort_keys=True))
    return 0
