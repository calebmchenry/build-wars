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


class InsigniaExtractorError(RuntimeError):
    pass


@dataclass(frozen=True)
class InsigniaExtractionResult:
    raw_records: list[dict[str, Any]]
    remote_media: list[dict[str, Any]]
    diagnostics: list[Diagnostic]


INSIGNIA_REVIEW_ID = "review:epic-11-source-set:2026-09-02"
ALL_SLOTS = ("head", "chest", "hands", "legs", "feet")
WIKI_LINK_RE = re.compile(r"\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|([^\]]+))?]]")


def extract_insignia_records(
    *,
    detail_pages: list[dict[str, Any]],
    imageinfo_pages: list[dict[str, Any]],
    profession_catalog: dict[str, Any],
) -> InsigniaExtractionResult:
    diagnostics: list[Diagnostic] = []
    records: list[dict[str, Any]] = []
    remote_media_by_id: dict[str, dict[str, Any]] = {}
    professions_by_name = {_lookup_key(str(profession["name"])): profession for profession in profession_catalog.get("professions", [])}
    attributes_by_name = {_lookup_key(str(attribute["name"])): attribute for attribute in profession_catalog.get("attributes", [])}

    for detail in sorted(detail_pages, key=lambda item: (int(item["id"]), str(item["detailTitle"]))):
        source_reference = detail["sourceReference"]
        source_id = str(source_reference["id"])
        insignia_id = int(detail["id"])
        params, infobox_diagnostics = _item_infobox_params(
            str(detail["content"]),
            insignia_id=insignia_id,
            source_id=source_id,
        )
        diagnostics.extend(infobox_diagnostics)
        name = str(detail["canonicalTitle"])
        raw_profession = _clean_markup(params.get("profession")) or detail.get("professionName")
        profession_id, profession_name, profession_diagnostics = _join_profession(
            raw_profession,
            professions_by_name,
            insignia_id=insignia_id,
            source_id=source_id,
            availability=str(detail["availability"]),
        )
        diagnostics.extend(profession_diagnostics)
        raw_bonus = _bounded_text(params.get("bonus")) or _bounded_text(detail.get("rawOverviewBonus"))
        attribute_references = _attribute_references(raw_bonus or "", attributes_by_name)
        icon_file_title = _icon_file(params.get("image") or params.get("render"))
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
                    "INSIGNIA_ICON_FIELD_MISSING",
                    "Insignia detail page did not provide an infobox image or render field",
                    insignia_id,
                    source_id,
                    severity="warning",
                    disposition="accepted-risk",
                )
            )

        record = {
            "id": insignia_id,
            "sourceKey": str(detail["sourceKey"]),
            "variantKey": detail.get("variantKey"),
            "templateModifierId": int(detail["templateModifierId"]),
            "name": name,
            "normalizedName": _lookup_key(name),
            "wikiUrl": f"https://wiki.guildwars.com/wiki/{name.replace(' ', '_')}",
            "pageIdentity": {
                "requestedTitle": str(detail["detailTitle"]),
                "normalizedTitle": str(detail.get("normalizedTitle") or detail["detailTitle"]),
                "canonicalTitle": name,
                "pageId": detail.get("pageId"),
                "revisionId": detail.get("revisionId"),
                "sourceRevisionTimestamp": detail.get("sourceRevisionTimestamp"),
                "redirectedFrom": detail.get("redirectedFrom"),
            },
            "familyKey": str(detail["familyKey"]),
            "availability": str(detail["availability"]),
            "professionId": profession_id,
            "professionName": profession_name,
            "modeAvailability": str(detail["modeAvailability"]),
            "applicableSlots": list(ALL_SLOTS),
            "rawEffects": {
                "bonus": raw_bonus,
                "overviewBonus": _bounded_text(detail.get("rawOverviewBonus")),
                "stackable": _bounded_text(params.get("stackable")),
                "campaign": _bounded_text(params.get("campaign")),
            },
            "attributeReferences": attribute_references,
            "iconFileTitle": icon_file_title,
            "iconId": icon_id,
            "provenance": _provenance(
                [source_id, str(detail.get("overviewSourceId")), str(detail.get("mechanicsSourceId"))],
                insignia_id,
                "Parsed from digest-bound EPIC-11 source snapshot.",
            ),
        }
        records.append(record)

    diagnostics.extend(_duplicate_diagnostics(records))
    records.sort(key=lambda item: (int(item["id"]), str(item["name"])))
    remote_media = [remote_media_by_id[key] for key in sorted(remote_media_by_id)]
    return InsigniaExtractionResult(
        raw_records=records,
        remote_media=remote_media,
        diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()),
    )


def icon_titles_from_detail_pages(detail_pages: list[dict[str, Any]], limit: int) -> list[str]:
    titles: set[str] = set()
    for detail in detail_pages:
        try:
            params, _ = _item_infobox_params(
                str(detail["content"]),
                insignia_id=int(detail["id"]),
                source_id=str(detail.get("sourceKey")),
            )
        except InsigniaExtractorError:
            continue
        icon = _icon_file(params.get("image") or params.get("render"))
        if icon is not None:
            titles.add(icon)
    return sorted(titles)[:limit]


def _item_infobox_params(
    wikitext: str,
    *,
    insignia_id: int,
    source_id: str,
) -> tuple[dict[str, str], list[Diagnostic]]:
    if mwparserfromhell is None:
        raise InsigniaExtractorError(f"mwparserfromhell is required: {_IMPORT_ERROR}")
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
                "INSIGNIA_ITEM_INFOBOX_MISSING",
                "Insignia page did not contain an Item infobox template",
                insignia_id,
                source_id,
                severity="error",
            )
        )
        return {}, diagnostics
    if len(templates) > 1:
        diagnostics.append(
            _diag(
                "INSIGNIA_ITEM_INFOBOX_MULTIPLE",
                "Insignia page contained multiple Item infobox templates; the first supported one was used",
                insignia_id,
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
                    "INSIGNIA_ITEM_INFOBOX_DUPLICATE_PARAM",
                    f"Duplicate Item infobox parameter {key}",
                    insignia_id,
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
    insignia_id: int,
    source_id: str,
    availability: str,
) -> tuple[int | None, str | None, list[Diagnostic]]:
    text = _clean_markup(str(value)) if value is not None else ""
    if availability == "common" or text.casefold() in {"", "any", "none"}:
        return None, None, []
    profession = professions_by_name.get(_lookup_key(text))
    if profession is None:
        return (
            None,
            text or None,
            [
                _diag(
                    "INSIGNIA_PROFESSION_JOIN_MISSING",
                    f"Insignia profession could not be joined through EPIC-03: {text}",
                    insignia_id,
                    source_id,
                    severity="error",
                )
            ],
        )
    return int(profession["id"]), str(profession["name"]), []


def _attribute_references(text: str, attributes_by_name: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    references: dict[str, dict[str, Any]] = {}
    for label in re.findall(r"(?:Requires|requires)\s+\d+\s+([A-Za-z ]+)", _clean_markup(text)):
        attribute = attributes_by_name.get(_lookup_key(label))
        if attribute is not None:
            references[_lookup_key(label)] = {"name": str(attribute["name"]), "id": int(attribute["id"])}
    for link in WIKI_LINK_RE.finditer(text):
        label = _clean_markup(link.group(2) or link.group(1))
        attribute = attributes_by_name.get(_lookup_key(label))
        if attribute is not None:
            references[_lookup_key(label)] = {"name": str(attribute["name"]), "id": int(attribute["id"])}
    return [references[key] for key in sorted(references)]


def _icon_file(raw_image: str | None) -> str | None:
    if raw_image is None:
        return None
    files = [f"File:{match.group(1).strip()}" for match in re.finditer(r"\[\[(?:Image|File):([^|\]]+)", raw_image, re.IGNORECASE)]
    if files:
        return files[0]
    clean = _clean_markup(raw_image)
    if not clean:
        return None
    if clean.lower().startswith("file:"):
        return "File:" + clean.split(":", 1)[1].strip()
    return clean


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
        ("id", "INSIGNIA_RAW_DUPLICATE_ID"),
        ("templateModifierId", "INSIGNIA_RAW_DUPLICATE_TEMPLATE_MODIFIER_ID"),
        ("normalizedName", "INSIGNIA_RAW_DUPLICATE_NORMALIZED_NAME"),
        ("sourceKey", "INSIGNIA_RAW_DUPLICATE_SOURCE_KEY"),
    ):
        counts = Counter(str(record[field]) for record in records)
        for value, count in counts.items():
            if count > 1:
                diagnostics.append(
                    _diag(
                        code,
                        f"Raw insignia extraction duplicated {field}: {value}",
                        int(value) if value.isdigit() else value,
                        "insignia-extractor",
                        severity="critical",
                        disposition="non-waivable",
                    )
                )
    return sorted(diagnostics, key=lambda item: item.stable_key())


def _bounded_text(value: object, *, limit: int = 600) -> str | None:
    if value is None:
        return None
    text = _clean_markup(str(value).replace("<br>", "\n").replace("<br />", "\n").replace("<br/>", "\n"))
    if not text:
        return None
    if len(text) > limit:
        return text[: limit - 1] + "..."
    return text


def _clean_markup(value: object) -> str:
    text = str(value)
    text = re.sub(r"\[\[([^|\]]+)\|([^\]]+)]]", r"\2", text)
    text = re.sub(r"\[\[([^\]]+)]]", r"\1", text)
    text = re.sub(r"\{\{[^}]+}}", "", text)
    text = text.replace("&nbsp;", " ")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _lookup_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", _clean_markup(value).lower()).strip("-")


def _provenance(source_ids: list[str], insignia_id: int, notes: str | None) -> dict[str, Any]:
    return {
        "sourceIds": sorted({source_id for source_id in source_ids if source_id and source_id != "None"}),
        "claimIds": [f"claim:epic-11-insignia:{insignia_id}"],
        "reviewIds": [INSIGNIA_REVIEW_ID],
        "notes": notes,
    }


def _diag(
    code: str,
    message: str,
    record_id: int | str,
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
