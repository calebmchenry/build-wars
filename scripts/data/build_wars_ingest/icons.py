from __future__ import annotations

import re
from typing import Any

from .models import Diagnostic, Evidence


def candidate_file_titles(page_title: str, explicit_image: str | None = None) -> list[str]:
    if explicit_image:
        return [_file_title(explicit_image)]
    return [f"File:{page_title}.jpg", f"File:{page_title}.png"]


def resolve_icon_metadata(
    *,
    page_title: str,
    source_id: str,
    source_reference: dict[str, Any],
    imageinfo_pages: list[dict[str, Any]],
    explicit_image: str | None = None,
) -> tuple[dict[str, Any] | None, list[Diagnostic]]:
    diagnostics: list[Diagnostic] = []
    candidates = candidate_file_titles(page_title, explicit_image)
    valid_pages = [_valid_imageinfo_page(page) for page in imageinfo_pages if _valid_imageinfo_page(page) is not None]
    valid_by_title = {str(page["title"]): page for page in valid_pages}
    selected: dict[str, Any] | None = None

    if explicit_image:
        selected = _first_matching(valid_by_title, candidates)
        if selected is None:
            diagnostics.append(
                _icon_diag(
                    "ICON_EXPLICIT_MISSING",
                    "Explicit icon file did not resolve to image metadata",
                    page_title,
                    source_id,
                    severity="error",
                )
            )
            return None, diagnostics
    else:
        matches = [page for candidate in candidates if (page := valid_by_title.get(candidate)) is not None]
        if len(matches) > 1:
            diagnostics.append(
                _icon_diag(
                    "ICON_DEFAULT_AMBIGUOUS",
                    "Default icon candidates were ambiguous",
                    page_title,
                    source_id,
                    severity="warning",
                    notes=", ".join(page["title"] for page in matches),
                )
            )
            return None, diagnostics
        if not matches:
            diagnostics.append(
                _icon_diag(
                    "ICON_DEFAULT_MISSING",
                    "No default icon candidate resolved",
                    page_title,
                    source_id,
                    severity="warning",
                )
            )
            return None, diagnostics
        selected = matches[0]

    imageinfo = _first_imageinfo(selected)
    if imageinfo is None:
        diagnostics.append(_icon_diag("ICON_MISSING_IMAGEINFO", "Resolved file lacked imageinfo", page_title, source_id, severity="error"))
        return None, diagnostics

    metadata = _metadata_record(
        page_title=page_title,
        source_id=source_id,
        source_reference=source_reference,
        file_page=selected,
        imageinfo=imageinfo,
    )
    diagnostics.extend(_metadata_diagnostics(metadata, page_title, source_id))
    return metadata, sorted(diagnostics, key=lambda item: item.stable_key())


def _file_title(value: str) -> str:
    title = value.strip()
    title = re.sub(r"^Image:", "File:", title, flags=re.IGNORECASE)
    if not title.lower().startswith("file:"):
        title = f"File:{title}"
    return "File:" + title.split(":", 1)[1].strip()


def _valid_imageinfo_page(page: dict[str, Any]) -> dict[str, Any] | None:
    if page.get("missing") is True:
        return None
    if not isinstance(page.get("title"), str):
        return None
    if _first_imageinfo(page) is None:
        return None
    return page


def _first_imageinfo(page: dict[str, Any]) -> dict[str, Any] | None:
    imageinfo = page.get("imageinfo")
    if isinstance(imageinfo, list) and imageinfo and isinstance(imageinfo[0], dict):
        return imageinfo[0]
    return None


def _first_matching(valid_by_title: dict[str, dict[str, Any]], candidates: list[str]) -> dict[str, Any] | None:
    lower_map = {title.casefold(): page for title, page in valid_by_title.items()}
    for candidate in candidates:
        page = valid_by_title.get(candidate) or lower_map.get(candidate.casefold())
        if page is not None:
            return page
    return None


def _metadata_record(
    *,
    page_title: str,
    source_id: str,
    source_reference: dict[str, Any],
    file_page: dict[str, Any],
    imageinfo: dict[str, Any],
) -> dict[str, Any]:
    title = str(file_page["title"])
    url = str(imageinfo.get("url") or imageinfo.get("descriptionurl") or "")
    return {
        "id": f"remote-media:gww-icon:{_record_safe_id(page_title)}",
        "kind": "icon",
        "sourceId": source_id,
        "fileTitle": title,
        "canonicalUrl": url,
        "descriptionUrl": imageinfo.get("descriptionurl"),
        "mimeType": imageinfo.get("mime"),
        "width": imageinfo.get("width"),
        "height": imageinfo.get("height"),
        "sizeBytes": imageinfo.get("size"),
        "remoteTimestamp": imageinfo.get("timestamp"),
        "remoteSha1": imageinfo.get("sha1"),
        "cachedBytes": False,
        "useDecision": "allowed",
        "notes": f"Metadata-only icon record for {page_title}.",
        "sourceReference": source_reference,
    }


def _metadata_diagnostics(metadata: dict[str, Any], page_title: str, source_id: str) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    required = {
        "fileTitle": metadata.get("fileTitle"),
        "canonicalUrl": metadata.get("canonicalUrl"),
        "mimeType": metadata.get("mimeType"),
        "width": metadata.get("width"),
        "height": metadata.get("height"),
        "sizeBytes": metadata.get("sizeBytes"),
        "remoteTimestamp": metadata.get("remoteTimestamp"),
        "remoteSha1": metadata.get("remoteSha1"),
    }
    for field, value in required.items():
        if value in (None, ""):
            diagnostics.append(
                _icon_diag(
                    "ICON_METADATA_MISSING_FIELD",
                    f"Icon metadata missing field {field}",
                    page_title,
                    source_id,
                    severity="warning",
                    field_path=f"/{field}",
                )
            )
    mime = metadata.get("mimeType")
    if isinstance(mime, str) and mime not in {"image/jpeg", "image/png"}:
        diagnostics.append(
            _icon_diag(
                "ICON_UNEXPECTED_MIME",
                f"Icon metadata had unexpected MIME type {mime}",
                page_title,
                source_id,
                severity="warning",
                field_path="/mimeType",
            )
        )
    if (metadata.get("width"), metadata.get("height")) not in {(64, 64), (200, 200)}:
        diagnostics.append(
            _icon_diag(
                "ICON_NON_64_DIMENSIONS",
                "Icon metadata did not report an approved square icon size",
                page_title,
                source_id,
                severity="warning",
                field_path="/width",
            )
        )
    remote_sha1 = metadata.get("remoteSha1")
    if not isinstance(remote_sha1, str) or not re.fullmatch(r"[a-fA-F0-9]{40}", remote_sha1):
        diagnostics.append(
            _icon_diag(
                "ICON_REMOTE_SHA1_ABSENT",
                "Icon metadata did not include a 40-character remote SHA-1",
                page_title,
                source_id,
                severity="warning",
                field_path="/remoteSha1",
            )
        )
    if metadata.get("cachedBytes") is not False:
        diagnostics.append(
            _icon_diag(
                "ICON_CACHED_BYTES_FORBIDDEN",
                "Icon metadata must not include cached media bytes",
                page_title,
                source_id,
                severity="critical",
                field_path="/cachedBytes",
            )
        )
    return diagnostics


def _icon_diag(
    code: str,
    message: str,
    page_title: str,
    source_id: str,
    *,
    severity: str,
    field_path: str | None = None,
    notes: str | None = None,
) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity=severity,  # type: ignore[arg-type]
        message=message,
        category="missing-icon-metadata",
        scope_kind="record",
        record_id=page_title,
        field_path=field_path,
        source_ids=(source_id,),
        evidence=(Evidence("source", page_title, notes),),
    )


def _record_safe_id(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "unknown"
