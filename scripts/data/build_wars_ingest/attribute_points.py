from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .models import Diagnostic, Evidence
from .wiki_tables import extract_wiki_tables, safe_key, section_text, slug, strip_markup, wiki_links

CAMPAIGNS = ("prophecies", "factions", "nightfall")
DEFERRED_CONTEXTS = (
    "pvp-characters",
    "heroes",
    "runes",
    "equipment",
    "consumables",
    "blessings",
    "temporary-effects",
    "campaign-progression",
    "actual-quest-log-state",
)


@dataclass(frozen=True)
class AttributePointExtraction:
    rules: dict[str, Any]
    diagnostics: list[Diagnostic]
    candidate_rows: list[dict[str, Any]]


def extract_attribute_point_rules(
    wikitext: str,
    *,
    source_reference: dict[str, Any],
) -> AttributePointExtraction:
    source_id = str(source_reference["id"])
    diagnostics: list[Diagnostic] = []
    candidate_rows: list[dict[str, Any]] = []
    tables = extract_wiki_tables(wikitext)
    if len(tables) < 3:
        diagnostics.append(_source_diag("ATTRIBUTE_POINT_TABLES_MISSING", "Attribute point page did not contain expected tables", source_id))
        return AttributePointExtraction(_empty_rules(source_id), diagnostics, candidate_rows)

    level_totals = _level_totals(tables[0].rows, source_id, diagnostics, candidate_rows)
    rank_section = section_text(wikitext, "Points required to increase rank")
    rank_table = extract_wiki_tables(rank_section)
    rank_rows = rank_table[0].rows if rank_table else tables[2].rows
    rank_costs = _rank_costs(rank_rows, source_id, diagnostics, candidate_rows)
    quest_rewards, quest_groups = _quest_rewards(tables[1].rows, source_id, diagnostics, candidate_rows)
    max_bonus = max((int(group["maximumApplicableReward"]) for group in quest_groups), default=0)
    level_20 = next((row for row in level_totals if row["level"] == 20), None)
    base_20 = int(level_20["cumulativeTotal"]) if level_20 is not None else 0
    rules = {
        "purchasedRankCosts": rank_costs,
        "levelPointTotals": level_totals,
        "questRewards": quest_rewards,
        "questRewardGroups": quest_groups,
        "maximumApplicableQuestBonus": {
            "points": max_bonus,
            "policy": "one-native-campaign",
            "provenance": _provenance(
                [source_id],
                ["claim:epic-03:attribute-points:maximum-applicable-quest-bonus"],
                "Derived as the maximum one native-campaign quest group reward; origin groups are mutually exclusive.",
            ),
        },
        "defaultPveLevel20": {
            "level": 20,
            "baseAttributePoints": base_20,
            "maximumQuestBonusPoints": max_bonus,
            "totalWithoutQuestBonus": base_20,
            "totalWithMaximumQuestBonus": base_20 + max_bonus,
            "policy": "level-20-pve-native-character-maximum-applicable-quest-rewards",
            "deferredContexts": list(DEFERRED_CONTEXTS),
            "provenance": _provenance(
                [source_id],
                ["claim:epic-03:attribute-points:default-pve-level-20"],
                "Derived from the level-20 base total and one maximum native-campaign quest bonus.",
            ),
        },
    }
    diagnostics.extend(_validate_rules(rules, source_id))
    return AttributePointExtraction(rules, sorted(diagnostics, key=lambda item: item.stable_key()), candidate_rows)


def _level_totals(
    rows: tuple[tuple[str, ...], ...],
    source_id: str,
    diagnostics: list[Diagnostic],
    candidate_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    totals: list[dict[str, Any]] = []
    seen: set[int] = set()
    for index, row in enumerate(rows):
        if len(row) < 3:
            continue
        try:
            level = int(strip_markup(row[0]))
            earned = int(strip_markup(row[1]))
            cumulative = int(strip_markup(row[2]))
        except ValueError:
            diagnostics.append(_row_diag("ATTRIBUTE_LEVEL_TOTAL_MALFORMED", "Malformed level point row", source_id, index + 1))
            continue
        if level in seen:
            diagnostics.append(_row_diag("ATTRIBUTE_LEVEL_TOTAL_DUPLICATE", f"Duplicate level {level}", source_id, index + 1))
        seen.add(level)
        candidate_rows.append({"sourceId": source_id, "namespace": "attribute-level-total", "rowNumber": index + 1, "disposition": "record"})
        totals.append(
            {
                "level": level,
                "earnedAtLevel": earned,
                "cumulativeTotal": cumulative,
                "provenance": _provenance(
                    [source_id],
                    [f"claim:epic-03:attribute-points:level:{level}"],
                    f"Parsed from Attribute point level table row {index + 1}.",
                ),
            }
        )
    return sorted(totals, key=lambda item: int(item["level"]))


def _rank_costs(
    rows: tuple[tuple[str, ...], ...],
    source_id: str,
    diagnostics: list[Diagnostic],
    candidate_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    costs = [
        {
            "purchasedRank": 0,
            "marginalCost": 0,
            "cumulativeCost": 0,
            "provenance": _provenance(
                [source_id],
                ["claim:epic-03:attribute-points:rank:0"],
                "Explicit Build Wars zero-rank baseline derived from the purchased-rank table boundary.",
            ),
        }
    ]
    seen = {0}
    for index, row in enumerate(rows):
        if len(row) < 3:
            continue
        try:
            rank = int(strip_markup(row[0]))
            marginal = int(strip_markup(row[1]))
            cumulative = int(strip_markup(row[2]))
        except ValueError:
            diagnostics.append(_row_diag("ATTRIBUTE_RANK_COST_MALFORMED", "Malformed rank-cost row", source_id, index + 1))
            continue
        if rank in seen:
            diagnostics.append(_row_diag("ATTRIBUTE_RANK_COST_DUPLICATE", f"Duplicate rank {rank}", source_id, index + 1))
        seen.add(rank)
        candidate_rows.append({"sourceId": source_id, "namespace": "attribute-rank-cost", "rowNumber": index + 1, "disposition": "record"})
        costs.append(
            {
                "purchasedRank": rank,
                "marginalCost": marginal,
                "cumulativeCost": cumulative,
                "provenance": _provenance(
                    [source_id],
                    [f"claim:epic-03:attribute-points:rank:{rank}"],
                    f"Parsed from Attribute point purchased-rank table row {index + 1}.",
                ),
            }
        )
    return sorted(costs, key=lambda item: int(item["purchasedRank"]))


def _quest_rewards(
    rows: tuple[tuple[str, ...], ...],
    source_id: str,
    diagnostics: list[Diagnostic],
    candidate_rows: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    data_row = next((row for row in rows if len(row) >= 3 and any(wiki_links(cell) for cell in row[:3])), None)
    if data_row is None:
        diagnostics.append(_source_diag("ATTRIBUTE_QUEST_TABLE_MISSING", "Attribute point page did not contain quest rewards", source_id))
        return [], []
    rewards: list[dict[str, Any]] = []
    groups: list[dict[str, Any]] = []
    for column_index, campaign in enumerate(CAMPAIGNS):
        cell = data_row[column_index]
        links = wiki_links(cell)
        quest_names = links[0::2] if len(links) >= 4 else links[:2]
        quest_ids: list[str] = []
        group_id = f"attribute-quest-group:{campaign}:native"
        for quest_name in quest_names[:2]:
            quest_id = f"attribute-quest:{campaign}:{slug(quest_name)}"
            quest_ids.append(quest_id)
            rewards.append(
                {
                    "id": quest_id,
                    "name": quest_name,
                    "campaign": campaign,
                    "rewardPoints": 15,
                    "nativeCharacterOnly": True,
                    "rewardGroupId": group_id,
                    "provenance": _provenance(
                        [source_id],
                        [f"claim:epic-03:attribute-points:quest:{slug(quest_name)}"],
                        "Parsed from the bounded Attribute point quest-reward table; reward value comes from the page's per-quest statement.",
                    ),
                }
            )
        candidate_rows.append({"sourceId": source_id, "namespace": "attribute-quest-rewards", "column": campaign, "disposition": "record"})
        groups.append(
            {
                "id": group_id,
                "campaign": campaign,
                "questIds": quest_ids,
                "maximumApplicableReward": sum(int(item["rewardPoints"]) for item in rewards if item["rewardGroupId"] == group_id),
                "mutuallyExclusiveWithGroupIds": [f"attribute-quest-group:{other}:native" for other in CAMPAIGNS if other != campaign],
                "provenance": _provenance(
                    [source_id],
                    [f"claim:epic-03:attribute-points:quest-group:{campaign}"],
                    "Grouped by native character campaign so mutually exclusive origin paths cannot be double-counted.",
                ),
            }
        )
    return sorted(rewards, key=lambda item: str(item["id"])), sorted(groups, key=lambda item: str(item["id"]))


def _validate_rules(rules: dict[str, Any], source_id: str) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    prior_total = 0
    for row in rules["purchasedRankCosts"]:
        rank = int(row["purchasedRank"])
        marginal = int(row["marginalCost"])
        cumulative = int(row["cumulativeCost"])
        if rank == 0:
            prior_total = cumulative
            continue
        if marginal < 0 or cumulative < 0 or cumulative != prior_total + marginal:
            diagnostics.append(_record_diag("ATTRIBUTE_RANK_COST_ARITHMETIC", f"Rank {rank} cost arithmetic was inconsistent", source_id, rank))
        prior_total = cumulative

    prior_level_total = 0
    for row in rules["levelPointTotals"]:
        level = int(row["level"])
        earned = int(row["earnedAtLevel"])
        cumulative = int(row["cumulativeTotal"])
        if earned < 0 or cumulative < prior_level_total or (level > 1 and cumulative != prior_level_total + earned):
            diagnostics.append(_record_diag("ATTRIBUTE_LEVEL_TOTAL_ARITHMETIC", f"Level {level} point arithmetic was inconsistent", source_id, level))
        prior_level_total = cumulative

    default = rules["defaultPveLevel20"]
    if default["totalWithoutQuestBonus"] != 170 or default["totalWithMaximumQuestBonus"] != 200:
        diagnostics.append(
            Diagnostic(
                code="ATTRIBUTE_DEFAULT_LEVEL_20_BUDGET_UNEXPECTED",
                severity="critical",
                message="Default level-20 PvE budgets did not derive to 170 and 200",
                category="schema-shape-error",
                scope_kind="record",
                record_id="default-pve-level-20",
                source_ids=(source_id,),
            )
        )
    return diagnostics


def _empty_rules(source_id: str) -> dict[str, Any]:
    provenance = _provenance([source_id], ["claim:epic-03:attribute-points:missing"], "Missing source data.")
    return {
        "purchasedRankCosts": [],
        "levelPointTotals": [],
        "questRewards": [],
        "questRewardGroups": [],
        "maximumApplicableQuestBonus": {"points": 0, "policy": "one-native-campaign", "provenance": provenance},
        "defaultPveLevel20": {
            "level": 20,
            "baseAttributePoints": 0,
            "maximumQuestBonusPoints": 0,
            "totalWithoutQuestBonus": 0,
            "totalWithMaximumQuestBonus": 0,
            "policy": "level-20-pve-native-character-maximum-applicable-quest-rewards",
            "deferredContexts": list(DEFERRED_CONTEXTS),
            "provenance": provenance,
        },
    }


def _provenance(source_ids: list[str], claim_ids: list[str], notes: str) -> dict[str, Any]:
    return {"sourceIds": sorted(set(source_ids)), "claimIds": claim_ids, "reviewIds": [], "notes": notes}


def _source_diag(code: str, message: str, source_id: str) -> Diagnostic:
    return Diagnostic(code=code, severity="critical", message=message, category="schema-shape-error", scope_kind="source", source_ids=(source_id,))


def _row_diag(code: str, message: str, source_id: str, row_number: int) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity="error",
        message=message,
        category="schema-shape-error",
        scope_kind="record",
        record_id=row_number,
        source_ids=(source_id,),
        evidence=(Evidence("source", f"Attribute point table row {row_number}", None),),
    )


def _record_diag(code: str, message: str, source_id: str, record_id: str | int) -> Diagnostic:
    return Diagnostic(
        code=code,
        severity="critical",
        message=message,
        category="schema-shape-error",
        scope_kind="record",
        record_id=record_id,
        source_ids=(source_id,),
    )


def normalized_context(value: str) -> str:
    return safe_key(value)
