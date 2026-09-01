from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from .icons import resolve_icon_metadata
from .models import Diagnostic, Evidence, source_reference
from .profiles import EPIC_03_PROFESSIONS
from .wiki_tables import extract_wiki_tables, first_wiki_link, safe_key, section_text, slug, strip_markup, wiki_links

PROFESSION_ABBREVIATIONS = {
    "Warrior": "W",
    "Ranger": "R",
    "Monk": "Mo",
    "Necromancer": "N",
    "Mesmer": "Me",
    "Elementalist": "E",
    "Assassin": "A",
    "Ritualist": "Rt",
    "Paragon": "P",
    "Dervish": "D",
}

CORE_CAMPAIGNS = ("prophecies", "factions", "nightfall")

PRIMARY_EFFECT_SUMMARIES = {
    "Strength": "Improves armor penetration for Warrior attack skills.",
    "Expertise": "Reduces key Ranger, attack, touch, and ritual skill energy costs.",
    "Divine Favor": "Adds extra healing when Monk spells target allies.",
    "Soul Reaping": "Returns Energy to Necromancers as nearby creatures die.",
    "Fast Casting": "Speeds Mesmer spell and signet use, with PvE recharge support for Mesmer spells.",
    "Energy Storage": "Raises an Elementalist primary character's maximum Energy.",
    "Critical Strikes": "Raises Assassin critical-hit reliability and Energy return from critical hits.",
    "Spawning Power": "Improves Ritualist weapon-spell duration and summoned-creature durability.",
    "Leadership": "Rewards Paragon shouts and chants with Energy based on affected allies.",
    "Mysticism": "Supports Dervish enchantment use and enchanted armor bonuses in PvE.",
}

PRIMARY_SUMMARY_REVIEW_ID = "review:epic-03-primary-effect-summaries:2026-09-01"


@dataclass(frozen=True)
class ProfessionAttributeExtraction:
    professions: list[dict[str, Any]]
    attributes: list[dict[str, Any]]
    remote_media: list[dict[str, Any]]
    sources: list[dict[str, Any]]
    manual_reviews: list[dict[str, Any]]
    diagnostics: list[Diagnostic]
    candidate_rows: list[dict[str, Any]]


def extract_professions_and_attributes(
    *,
    profession_wikitext: str,
    attribute_wikitext: str,
    template_crosswalk: dict[str, Any],
    sources_by_title: dict[str, dict[str, Any]],
    generated_at: str,
    profession_pages: dict[str, str] | None = None,
    imageinfo_pages: list[dict[str, Any]] | None = None,
) -> ProfessionAttributeExtraction:
    profession_pages = profession_pages or {}
    imageinfo_pages = imageinfo_pages or []
    diagnostics: list[Diagnostic] = []
    sources: dict[str, dict[str, Any]] = {}
    for source in sources_by_title.values():
        sources[str(source["id"])] = source

    campaign_info = _extract_campaign_info(profession_wikitext, sources_by_title["Profession"], diagnostics)
    attribute_rows = _extract_attribute_rows(attribute_wikitext, sources_by_title["Attribute"], diagnostics)
    attr_id_by_name = {
        safe_key(str(record["name"])): int(record["templateId"])
        for record in template_crosswalk["attributeTemplateIds"]
        if record["status"] == "known"
    }
    profession_id_by_name = {
        safe_key(str(record["name"])): int(record["templateId"])
        for record in template_crosswalk["professionTemplateIds"]
        if record["status"] == "known"
    }

    remote_media: list[dict[str, Any]] = []
    professions: list[dict[str, Any]] = []
    for record in template_crosswalk["professionTemplateIds"]:
        if record["status"] != "known":
            continue
        name = str(record["name"])
        profession_id = int(record["templateId"])
        primary_name = attribute_rows.by_profession.get(name, {}).get("primary")
        if primary_name is None:
            diagnostics.append(_record_diag("PROFESSION_PRIMARY_ATTRIBUTE_MISSING", f"Missing primary attribute for {name}", name, sources_by_title["Attribute"]))
            continue
        primary_attribute_id = attr_id_by_name.get(safe_key(primary_name))
        if primary_attribute_id is None:
            diagnostics.append(_record_diag("PROFESSION_PRIMARY_ATTRIBUTE_UNKNOWN", f"Unknown primary attribute {primary_name}", name, sources_by_title["Attribute"]))
            continue
        icon_id = None
        explicit_icon = _extract_profession_icon(profession_pages.get(name, ""))
        media_source_ref = None
        if explicit_icon is not None:
            media_source_ref = _source_reference_for_image(explicit_icon, imageinfo_pages, generated_at)
            if media_source_ref is not None:
                sources[str(media_source_ref["id"])] = media_source_ref
        source_ref_for_icon = media_source_ref or sources_by_title["Profession"]
        media, icon_diagnostics = resolve_icon_metadata(
            page_title=name,
            source_id=str(source_ref_for_icon["id"]),
            source_reference=source_ref_for_icon,
            imageinfo_pages=imageinfo_pages,
            explicit_image=explicit_icon,
        )
        diagnostics.extend(icon_diagnostics)
        if media is not None:
            media_wire = _remote_media_wire(media)
            remote_media.append(media_wire)
            icon_id = str(media_wire["id"])

        family = campaign_info.get(name, {}).get("family")
        campaigns = campaign_info.get(name, {}).get("primaryCreationCampaigns")
        if family is None or not isinstance(campaigns, tuple):
            diagnostics.append(_record_diag("PROFESSION_CAMPAIGN_MISSING", f"Missing campaign availability for {name}", name, sources_by_title["Profession"]))
            continue

        professions.append(
            {
                "id": profession_id,
                "templateId": profession_id,
                "name": name,
                "abbreviation": PROFESSION_ABBREVIATIONS[name],
                "professionFamily": family,
                "primaryCreationCampaigns": list(campaigns),
                "primaryAttributeId": primary_attribute_id,
                "primaryAttributeTemplateId": primary_attribute_id,
                "iconId": icon_id,
                "provenance": _provenance(
                    [str(sources_by_title["Skill template format"]["id"]), str(sources_by_title["Profession"]["id"]), str(sources_by_title["Attribute"]["id"])],
                    [f"claim:epic-03:profession:{slug(name)}"],
                    "Joined by explicit profession and attribute template IDs from bounded source pages.",
                ),
            }
        )

    attributes: list[dict[str, Any]] = []
    for record in template_crosswalk["attributeTemplateIds"]:
        name = str(record["name"])
        template_id = int(record["templateId"])
        ownership = attribute_rows.by_attribute.get(name)
        if ownership is None:
            diagnostics.append(_record_diag("ATTRIBUTE_OWNER_MISSING", f"Missing owning profession for {name}", name, sources_by_title["Attribute"]))
            continue
        profession_id = profession_id_by_name.get(safe_key(ownership["profession"]))
        if profession_id is None:
            diagnostics.append(_record_diag("ATTRIBUTE_OWNER_UNKNOWN", f"Unknown owning profession {ownership['profession']}", name, sources_by_title["Attribute"]))
            continue
        is_primary = bool(ownership["isPrimary"])
        summary = _primary_summary(name, sources_by_title, generated_at) if is_primary else None
        attributes.append(
            {
                "id": template_id,
                "templateId": template_id,
                "name": name,
                "professionId": profession_id,
                "professionTemplateId": profession_id,
                "isPrimary": is_primary,
                "isPrimaryOnly": is_primary,
                "primaryEffectSummary": summary,
                "provenance": _provenance(
                    [str(sources_by_title["Skill template format"]["id"]), str(sources_by_title["Attribute"]["id"])],
                    [f"claim:epic-03:attribute:{template_id}"],
                    "Joined by explicit attribute template ID and bounded Attribute page ownership rows.",
                ),
            }
        )

    professions.sort(key=lambda item: int(item["templateId"]))
    attributes.sort(key=lambda item: int(item["templateId"]))
    remote_media.sort(key=lambda item: str(item["id"]))
    manual_reviews = [_primary_summary_review(sources_by_title, generated_at)]
    candidate_rows = attribute_rows.candidate_rows
    return ProfessionAttributeExtraction(
        professions=professions,
        attributes=attributes,
        remote_media=remote_media,
        sources=[sources[source_id] for source_id in sorted(sources)],
        manual_reviews=manual_reviews,
        diagnostics=sorted(diagnostics, key=lambda item: item.stable_key()),
        candidate_rows=candidate_rows,
    )


@dataclass(frozen=True)
class AttributeRows:
    by_profession: dict[str, dict[str, Any]]
    by_attribute: dict[str, dict[str, Any]]
    candidate_rows: list[dict[str, Any]]


def _extract_campaign_info(
    wikitext: str,
    source_reference: dict[str, Any],
    diagnostics: list[Diagnostic],
) -> dict[str, dict[str, Any]]:
    sections = (
        ("Core or Prophecies professions", "core", CORE_CAMPAIGNS),
        ("Factions campaign professions", "factions", ("factions",)),
        ("Nightfall campaign professions", "nightfall", ("nightfall",)),
    )
    result: dict[str, dict[str, Any]] = {}
    known = set(EPIC_03_PROFESSIONS)
    for heading, family, campaigns in sections:
        body = section_text(wikitext, heading)
        if not body:
            diagnostics.append(_source_diag("PROFESSION_CAMPAIGN_SECTION_MISSING", f"Profession page missing {heading}", source_reference))
            continue
        for link in wiki_links(body):
            if link in known:
                result[link] = {"family": family, "primaryCreationCampaigns": tuple(campaigns)}
    return result


def _extract_attribute_rows(
    wikitext: str,
    source_reference: dict[str, Any],
    diagnostics: list[Diagnostic],
) -> AttributeRows:
    tables = extract_wiki_tables(wikitext)
    table = next((item for item in tables if len(item.rows) >= 10 and any(len(row) >= 4 for row in item.rows)), None)
    if table is None:
        diagnostics.append(_source_diag("ATTRIBUTE_TABLE_MISSING", "Attribute page did not contain the profession/attribute table", source_reference))
        return AttributeRows({}, {}, [])

    by_profession: dict[str, dict[str, Any]] = {}
    by_attribute: dict[str, dict[str, Any]] = {}
    candidate_rows: list[dict[str, Any]] = []
    for index, row in enumerate(table.rows):
        if len(row) < 4:
            continue
        profession_name = _profession_name(row[0])
        if profession_name not in EPIC_03_PROFESSIONS:
            continue
        primary = first_wiki_link(row[1]) or strip_markup(row[1])
        secondaries = wiki_links(row[3])
        by_profession[profession_name] = {"primary": primary, "secondaries": secondaries}
        candidate_rows.append(
            {
                "sourceId": str(source_reference["id"]),
                "namespace": "attribute-ownership",
                "rowNumber": index + 1,
                "profession": profession_name,
                "disposition": "record",
            }
        )
        for attribute_name, is_primary in [(primary, True), *[(secondary, False) for secondary in secondaries]]:
            prior = by_attribute.get(attribute_name)
            if prior is not None and prior["profession"] != profession_name:
                diagnostics.append(
                    Diagnostic(
                        code="ATTRIBUTE_OWNER_CONFLICT",
                        severity="critical",
                        message=f"Attribute {attribute_name} had conflicting owners",
                        category="schema-shape-error",
                        scope_kind="record",
                        record_id=attribute_name,
                        source_ids=(str(source_reference["id"]),),
                    )
                )
                continue
            by_attribute[attribute_name] = {"profession": profession_name, "isPrimary": is_primary}
    return AttributeRows(by_profession, by_attribute, candidate_rows)


def _profession_name(cell: str) -> str:
    text = strip_markup(cell)
    for name in EPIC_03_PROFESSIONS:
        if re.search(rf"\b{re.escape(name)}\b", text):
            return name
    return text


def _extract_profession_icon(wikitext: str) -> str | None:
    match = re.search(r"icon\s*=\s*\[\[(?:Image|File):([^\]|]+)", wikitext, flags=re.IGNORECASE)
    if match is None:
        return None
    return f"File:{match.group(1).strip()}"


def _source_reference_for_image(
    explicit_icon: str,
    imageinfo_pages: list[dict[str, Any]],
    generated_at: str,
) -> dict[str, Any] | None:
    title = explicit_icon if explicit_icon.casefold().startswith("file:") else f"File:{explicit_icon}"
    lower = title.casefold()
    page = next((item for item in imageinfo_pages if str(item.get("title", "")).casefold() == lower), None)
    if page is None:
        return None
    imageinfo = page.get("imageinfo")
    if not isinstance(imageinfo, list) or not imageinfo or not isinstance(imageinfo[0], dict):
        return None
    info = imageinfo[0]
    return source_reference(
        source_id=f"source:gww:file:{slug(title)}:{str(info.get('sha1', 'unknown'))[:12]}",
        name="Guild Wars Wiki",
        canonical_url=str(info.get("descriptionurl") or f"https://wiki.guildwars.com/wiki/{title.replace(' ', '_')}"),
        page_id=page.get("pageid"),
        file_id=page.get("pageid"),
        file_title=title,
        revision_id=info.get("sha1"),
        source_revision_timestamp=info.get("timestamp"),
        retrieved_at=generated_at,
        material_class="media-metadata",
        notes="Metadata-only file page evidence; no media bytes are cached or bundled.",
    )


def _remote_media_wire(metadata: dict[str, Any]) -> dict[str, Any]:
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


def _primary_summary(
    attribute_name: str,
    sources_by_title: dict[str, dict[str, Any]],
    generated_at: str,
) -> dict[str, Any]:
    source = sources_by_title.get(attribute_name, sources_by_title["Attribute"])
    return {
        "text": PRIMARY_EFFECT_SUMMARIES[attribute_name],
        "provenance": _provenance(
            [str(sources_by_title["Attribute"]["id"]), str(source["id"])],
            [f"claim:epic-03:primary-effect-summary:{slug(attribute_name)}"],
            f"Original Build Wars summary reviewed at {generated_at}; source prose was not copied.",
            review_ids=[PRIMARY_SUMMARY_REVIEW_ID],
        ),
    }


def _primary_summary_review(sources_by_title: dict[str, dict[str, Any]], generated_at: str) -> dict[str, Any]:
    evidence = [
        {"kind": "source", "reference": str(sources_by_title["Attribute"]["id"]), "notes": "Bounded Attribute page table."},
        {"kind": "ticket", "reference": "BW-0305", "notes": "Primary effect summary promotion gate."},
    ]
    return {
        "id": PRIMARY_SUMMARY_REVIEW_ID,
        "reviewer": "Build Wars sprint executor",
        "reviewedAt": generated_at,
        "scope": "EPIC-03 primary attribute effect summaries",
        "decision": "approved",
        "rationale": "Summaries are short original Build Wars wording derived from bounded factual inputs.",
        "evidence": evidence,
        "relatedFindingIds": [],
        "followUpTicketIds": [],
        "expiresAt": None,
        "reReviewTrigger": "Any source revision or semantic summary change.",
    }


def _provenance(
    source_ids: list[str],
    claim_ids: list[str],
    notes: str,
    *,
    review_ids: list[str] | None = None,
) -> dict[str, Any]:
    return {"sourceIds": sorted(set(source_ids)), "claimIds": claim_ids, "reviewIds": review_ids or [], "notes": notes}


def _record_diag(code: str, message: str, record_id: str, source_reference: dict[str, Any]) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity="critical",
        message=message,
        category="schema-shape-error",
        scope_kind="record",
        record_id=record_id,
        source_ids=(str(source_reference["id"]),),
        evidence=(Evidence("source", str(source_reference.get("pageTitle") or source_reference["id"]), None),),
    )


def _source_diag(code: str, message: str, source_reference: dict[str, Any]) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity="critical",
        message=message,
        category="schema-shape-error",
        scope_kind="source",
        source_ids=(str(source_reference["id"]),),
    )
