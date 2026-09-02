from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass
from typing import Any

from .icons import resolve_icon_metadata
from .models import Diagnostic, Evidence
from .wikitext import normalize_param_name, normalize_template_name

try:
    import mwparserfromhell
except ModuleNotFoundError as exc:  # pragma: no cover - exercised by CLI setup checks.
    mwparserfromhell = None
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


class RuneExtractorError(RuntimeError):
    pass


@dataclass(frozen=True)
class RuneExtractionResult:
    raw_records: list[dict[str, Any]]
    remote_media: list[dict[str, Any]]
    diagnostics: list[Diagnostic]


RUNE_REVIEW_ID = "review:epic-10-source-set:2026-09-02"


def extract_rune_records(
    *,
    detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    profession_catalog: dict[str, Any],
) -> RuneExtractionResult:
    diagnostics: list[Diagnostic] = []
    records: list[dict[str, Any]] = []
    remote_media_by_id: dict[str, dict[str, Any]] = {}
    professions_by_name = {_lookup_key(str(profession["name"])): profession for profession in profession_catalog.get("professions", [])}
    attributes_by_name = {_lookup_key(str(attribute["name"])): attribute for attribute in profession_catalog.get("attributes", [])}

    for detail in sorted(detail_pages, key=lambda item: (int(item["templateModifierId"]), str(item["requestedTitle"]))):
        source_reference = detail["sourceReference"]
        source_id = str(source_reference["id"])
        modifier_id = int(detail["templateModifierId"])
        params, infobox_diagnostics = _item_infobox_params(
            str(detail["content"]),
            modifier_id=modifier_id,
            source_id=source_id,
        )
        diagnostics.extend(infobox_diagnostics)
        name = str(detail["requestedTitle"])
        raw_profession = _clean_markup(params.get("profession")) or detail.get("professionName")
        profession_id, profession_name, profession_diagnostics = _join_profession(
            raw_profession,
            professions_by_name,
            modifier_id=modifier_id,
            source_id=source_id,
            eligibility=str(detail["eligibility"]),
        )
        diagnostics.extend(profession_diagnostics)
        raw_attribute = detail.get("affectedAttributeName")
        attribute_id, attribute_name, attribute_diagnostics = _join_attribute(
            raw_attribute,
            attributes_by_name,
            modifier_id=modifier_id,
            source_id=source_id,
        )
        diagnostics.extend(attribute_diagnostics)
        icon_file_title = _icon_file_for_rank(params.get("image"), detail.get("familyRank"))
        icon_id: str | None = None
        if icon_file_title is not None:
            metadata, icon_diagnostics = resolve_icon_metadata(
                page_title=name,
                source_id=source_id,
                source_reference=source_reference,
                imageinfo_pages=imageinfo_pages,
                explicit_image=icon_file_title,
            )
            diagnostics.extend(_review_icon_diagnostic(item) for item in icon_diagnostics)
            if metadata is not None:
                runtime_media = _runtime_media(metadata)
                remote_media_by_id[str(runtime_media["id"])] = runtime_media
                icon_id = str(runtime_media["id"])
        else:
            diagnostics.append(
                _diag(
                    "RUNE_ICON_FIELD_MISSING",
                    "Rune detail page did not provide an infobox image field",
                    modifier_id,
                    source_id,
                    severity="warning",
                    disposition="accepted-risk",
                )
            )

        record = {
            "id": modifier_id,
            "templateModifierId": modifier_id,
            "sourceKey": str(detail["sourceKey"]),
            "name": name,
            "normalizedName": str(detail["normalizedName"]),
            "wikiUrl": f"https://wiki.guildwars.com/wiki/{str(detail['canonicalTitle']).replace(' ', '_')}",
            "pageIdentity": {
                "requestedTitle": str(detail["detailTitle"]),
                "normalizedTitle": str(detail.get("normalizedTitle") or detail["detailTitle"]),
                "canonicalTitle": str(detail["canonicalTitle"]),
                "pageId": detail.get("pageId"),
                "revisionId": detail.get("revisionId"),
                "sourceRevisionTimestamp": detail.get("sourceRevisionTimestamp"),
                "redirectedFrom": detail.get("redirectedFrom"),
            },
            "familyKey": str(detail["familyKey"]),
            "familyKind": str(detail["familyKind"]),
            "familyRank": detail.get("familyRank"),
            "rarityTier": detail.get("rarityTier"),
            "eligibility": str(detail["eligibility"]),
            "professionId": profession_id,
            "professionName": profession_name,
            "affectedAttributeId": attribute_id,
            "affectedAttributeName": attribute_name,
            "rawEffects": {
                "bonus": _bounded_text(params.get("bonus")),
                "stackable": _bounded_text(params.get("stackable")),
                "rarity": _bounded_text(params.get("rarity")),
                "familyLabel": str(detail["familyLabel"]),
            },
            "headgearEvidence": "attribute-bonus-source" if detail["familyKind"] == "attribute" else None,
            "iconFileTitle": icon_file_title,
            "iconId": icon_id,
            "provenance": _provenance(source_id, modifier_id, "Parsed from digest-bound EPIC-10 source snapshot."),
        }
        records.append(record)

    diagnostics.extend(_duplicate_diagnostics(records))
    records.sort(key=lambda item: (int(item["templateModifierId"]), str(item["name"])))
    remote_media = [remote_media_by_id[key] for key in sorted(remote_media_by_id)]
    return RuneExtractionResult(
        raw_records=records,
        remote_media=remote_media,
        diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()),
    )


def _item_infobox_params(
    wikitext: str,
    *,
    modifier_id: int,
    source_id: str,
) -> tuple[dict[str, str], list[Diagnostic]]:
    if mwparserfromhell is None:
        raise RuneExtractorError(f"mwparserfromhell is required: {_IMPORT_ERROR}")
    code = mwparserfromhell.parse(wikitext)
    diagnostics: list[Diagnostic] = []
    templates = [
        template
        for template in code.filter_templates(recursive=False)
        if normalize_template_name(str(template.name)) == "item infobox"
    ]
    if not templates:
        diagnostics.append(
            _diag(
                "RUNE_ITEM_INFOBOX_MISSING",
                "Rune page did not contain an Item infobox template",
                modifier_id,
                source_id,
                severity="warning",
                disposition="accepted-risk",
            )
        )
        return {}, diagnostics
    if len(templates) > 1:
        diagnostics.append(
            _diag(
                "RUNE_ITEM_INFOBOX_MULTIPLE",
                "Rune page contained multiple Item infobox templates; the first supported one was used",
                modifier_id,
                source_id,
                severity="warning",
                disposition="accepted-risk",
            )
        )

    params: dict[str, str] = {}
    for index, param in enumerate(templates[0].params):
        key = normalize_param_name(str(param.name))
        if not bool(param.showkey):
            key = str(index + 1)
        if key in params:
            diagnostics.append(
                _diag(
                    "RUNE_ITEM_INFOBOX_DUPLICATE_PARAM",
                    f"Duplicate Item infobox parameter {key}",
                    modifier_id,
                    source_id,
                    severity="warning",
                    disposition="accepted-risk",
                )
            )
        params[key] = str(param.value).strip()
    return params, diagnostics


def _join_profession(
    value: object,
    professions_by_name: dict[str, dict[str, Any]],
    *,
    modifier_id: int,
    source_id: str,
    eligibility: str,
) -> tuple[int | None, str | None, list[Diagnostic]]:
    text = _clean_markup(str(value)) if value is not None else ""
    if eligibility == "universal-armor" or text.casefold() in {"", "any", "none"}:
        return None, None, []
    profession = professions_by_name.get(_lookup_key(text))
    if profession is None:
        return (
            None,
            text or None,
            [
                _diag(
                    "RUNE_PROFESSION_JOIN_MISSING",
                    f"Rune profession could not be joined through EPIC-03: {text}",
                    modifier_id,
                    source_id,
                    severity="error",
                )
            ],
        )
    return int(profession["id"]), str(profession["name"]), []


def _join_attribute(
    value: object,
    attributes_by_name: dict[str, dict[str, Any]],
    *,
    modifier_id: int,
    source_id: str,
) -> tuple[int | None, str | None, list[Diagnostic]]:
    if value is None:
        return None, None, []
    text = _clean_markup(str(value))
    if not text:
        return None, None, []
    attribute = attributes_by_name.get(_lookup_key(text))
    if attribute is None:
        return (
            None,
            text,
            [
                _diag(
                    "RUNE_ATTRIBUTE_JOIN_MISSING",
                    f"Rune attribute could not be joined through EPIC-03: {text}",
                    modifier_id,
                    source_id,
                    severity="error",
                )
            ],
        )
    return int(attribute["id"]), str(attribute["name"]), []


def _icon_file_for_rank(raw_image: str | None, rank: object) -> str | None:
    if raw_image is None:
        return None
    files = [f"File:{match.group(1).strip()}" for match in re.finditer(r"\[\[(?:Image|File):([^|\]]+)", raw_image, re.IGNORECASE)]
    if not files:
        clean = _clean_markup(raw_image)
        return clean or None
    rank_text = str(rank or "").casefold()
    if len(files) == 1:
        return files[0]
    if rank_text == "minor":
        return files[0]
    if rank_text == "major":
        return files[min(1, len(files) - 1)]
    if rank_text == "superior":
        return files[-1]
    return files[0]


def _review_icon_diagnostic(diagnostic: Diagnostic) -> Diagnostic:
    return Diagnostic(
        code=diagnostic.code,
        severity="warning" if diagnostic.severity == "error" else diagnostic.severity,
        message=diagnostic.message,
        category=diagnostic.category,
        scope_kind=diagnostic.scope_kind,
        artifact_path=diagnostic.artifact_path,
        record_id=diagnostic.record_id,
        field_path=diagnostic.field_path,
        source_ids=diagnostic.source_ids,
        evidence=diagnostic.evidence,
        disposition="accepted-risk",
    )


def _runtime_media(metadata: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": metadata["id"],
        "kind": metadata["kind"],
        "sourceId": metadata["sourceId"],
        "fileTitle": metadata["fileTitle"],
        "canonicalUrl": metadata["canonicalUrl"],
        "mimeType": metadata["mimeType"],
        "width": metadata["width"],
        "height": metadata["height"],
        "sizeBytes": metadata["sizeBytes"],
        "remoteTimestamp": metadata["remoteTimestamp"],
        "remoteSha1": metadata["remoteSha1"],
        "cachedBytes": False,
        "useDecision": metadata["useDecision"],
        "notes": metadata["notes"],
    }


def _duplicate_diagnostics(records: list[dict[str, Any]]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    for field, code in (
        ("id", "RUNE_RAW_DUPLICATE_ID"),
        ("templateModifierId", "RUNE_RAW_DUPLICATE_TEMPLATE_MODIFIER_ID"),
        ("normalizedName", "RUNE_RAW_DUPLICATE_NORMALIZED_NAME"),
        ("sourceKey", "RUNE_RAW_DUPLICATE_SOURCE_KEY"),
    ):
        counts = Counter(str(record[field]) for record in records)
        for value, count in counts.items():
            if count > 1:
                diagnostics.append(
                    _diag(
                        code,
                        f"Raw rune extraction duplicated {field}: {value}",
                        int(value) if value.isdigit() else value,
                        "rune-extractor",
                        severity="critical",
                        disposition="non-waivable",
                    )
                )
    return diagnostics


def _provenance(source_id: str, modifier_id: int, notes: str | None) -> dict[str, Any]:
    return {
        "sourceIds": [source_id],
        "claimIds": [f"claim:rune:{modifier_id}:identity"],
        "reviewIds": [RUNE_REVIEW_ID],
        "notes": notes,
    }


def _clean_markup(value: str | None) -> str:
    if value is None:
        return ""

    def replace_link(match: re.Match[str]) -> str:
        return (match.group(2) or match.group(1)).strip()

    result = re.sub(r"\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|([^\]]+))?]]", replace_link, value)
    result = re.sub(r"<br\s*/?>", " ", result, flags=re.IGNORECASE)
    result = re.sub(r"<[^>]+>", "", result)
    result = re.sub(r"\{\{[^{}]*}}", "", result)
    result = re.sub(r"''+", "", result)
    return re.sub(r"\s+", " ", result).strip()


def _bounded_text(value: str | None, *, limit: int = 160) -> str | None:
    text = _clean_markup(value)
    if not text:
        return None
    return text[:limit]


def _lookup_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")


def _diag(
    code: str,
    message: str,
    record_id: str | int,
    source_id: str,
    *,
    severity: str,
    disposition: str = "open",
) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity=severity,  # type: ignore[arg-type]
        message=message,
        category="schema-shape-error",
        scope_kind="record",
        record_id=record_id,
        source_ids=(source_id,),
        evidence=(Evidence("source", source_id, None),),
        disposition=disposition,  # type: ignore[arg-type]
    )
