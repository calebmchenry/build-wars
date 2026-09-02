from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .config import DEFAULT_LIMITS, EPIC_04_LIMITS, EPIC_10_LIMITS, EPIC_11_LIMITS

EPIC_02_PROFILE_ID = "guild-wars-wiki"
EPIC_03_PROFILE_ID = "epic-03-professions-attributes"
EPIC_04_PROFILE_ID = "epic-04-skills"
EPIC_10_PROFILE_ID = "epic-10-runes"
EPIC_11_PROFILE_ID = "epic-11-insignias"

EPIC_03_PROFESSIONS = (
    "Warrior",
    "Ranger",
    "Monk",
    "Necromancer",
    "Mesmer",
    "Elementalist",
    "Assassin",
    "Ritualist",
    "Paragon",
    "Dervish",
)

EPIC_03_PRIMARY_ATTRIBUTES = (
    "Strength",
    "Expertise",
    "Divine Favor",
    "Soul Reaping",
    "Fast Casting",
    "Energy Storage",
    "Critical Strikes",
    "Spawning Power",
    "Leadership",
    "Mysticism",
)

EPIC_03_SOURCE_TITLES = (
    "Skill template format",
    "Profession",
    "Attribute",
    "Attribute point",
)

EPIC_03_ICON_IMAGEINFO_TITLE = "EPIC-03 profession icon imageinfo"
EPIC_04_SOURCE_INDEX_TITLE = "Guild Wars Wiki:Game integration/Skills"
EPIC_04_SKILL_ICON_IMAGEINFO_TITLE = "EPIC-04 skill icon imageinfo"
EPIC_10_SOURCE_TITLES = (
    "Equipment template format",
    "Rune",
    "Attribute bonus",
)
EPIC_10_RUNE_ICON_IMAGEINFO_TITLE = "EPIC-10 rune icon imageinfo"
EPIC_11_SOURCE_TITLES = (
    "Equipment template format",
    "Insignia",
    "Effect stacking",
)
EPIC_11_INSIGNIA_ICON_IMAGEINFO_TITLE = "EPIC-11 insignia icon imageinfo"


@dataclass(frozen=True)
class DataIngestionProfile:
    id: str
    source_target: str
    source_epic: str | None
    generated_relative_path: Path
    qa_relative_path: Path
    fixture_relative_path: Path | None
    source_titles: tuple[str, ...]
    detail_titles: tuple[str, ...]
    page_limit: int
    request_limit: int
    response_byte_cap: int
    parser_byte_cap: int
    media_title_limit: int = 0
    aggregate_byte_cap: int = 0
    catalog_byte_cap: int = 0
    qa_byte_cap: int = 0

    @property
    def all_page_titles(self) -> tuple[str, ...]:
        seen: set[str] = set()
        titles: list[str] = []
        for title in (*self.source_titles, *self.detail_titles):
            if title not in seen:
                seen.add(title)
                titles.append(title)
        return tuple(titles)


EPIC_02_PROFILE = DataIngestionProfile(
    id=EPIC_02_PROFILE_ID,
    source_target="BACKLOG",
    source_epic="EPIC-02",
    generated_relative_path=Path("epic-02/skill-id-map.fixture.json"),
    qa_relative_path=Path("epic-02/skill-id-map.fixture.qa.json"),
    fixture_relative_path=Path("generated/fixture-skill-id-map.json"),
    source_titles=("Guild Wars Wiki:Game integration/Skills/0",),
    detail_titles=(),
    page_limit=DEFAULT_LIMITS.page_limit,
    request_limit=DEFAULT_LIMITS.request_limit,
    response_byte_cap=DEFAULT_LIMITS.response_byte_cap,
    parser_byte_cap=DEFAULT_LIMITS.max_parser_bytes,
)

EPIC_03_PROFILE = DataIngestionProfile(
    id=EPIC_03_PROFILE_ID,
    source_target="BACKLOG",
    source_epic="EPIC-03",
    generated_relative_path=Path("epic-03/professions-attributes.catalog.json"),
    qa_relative_path=Path("epic-03/professions-attributes.catalog.qa.json"),
    fixture_relative_path=Path("generated/fixture-professions-attributes.catalog.json"),
    source_titles=EPIC_03_SOURCE_TITLES,
    detail_titles=(*EPIC_03_PROFESSIONS, *EPIC_03_PRIMARY_ATTRIBUTES),
    page_limit=32,
    request_limit=12,
    response_byte_cap=DEFAULT_LIMITS.response_byte_cap,
    parser_byte_cap=DEFAULT_LIMITS.max_parser_bytes,
)

EPIC_04_PROFILE = DataIngestionProfile(
    id=EPIC_04_PROFILE_ID,
    source_target="BACKLOG",
    source_epic="EPIC-04",
    generated_relative_path=Path("epic-04/skills.catalog.json"),
    qa_relative_path=Path("epic-04/skills.catalog.qa.json"),
    fixture_relative_path=Path("generated/fixture-skills.catalog.json"),
    source_titles=(EPIC_04_SOURCE_INDEX_TITLE,),
    detail_titles=(),
    page_limit=EPIC_04_LIMITS.page_limit,
    request_limit=EPIC_04_LIMITS.request_limit,
    response_byte_cap=EPIC_04_LIMITS.response_byte_cap,
    parser_byte_cap=EPIC_04_LIMITS.max_parser_bytes,
    media_title_limit=256,
    aggregate_byte_cap=60_000_000,
    catalog_byte_cap=20_000_000,
    qa_byte_cap=4_000_000,
)

EPIC_10_PROFILE = DataIngestionProfile(
    id=EPIC_10_PROFILE_ID,
    source_target="BACKLOG",
    source_epic="EPIC-10",
    generated_relative_path=Path("epic-10/runes.catalog.json"),
    qa_relative_path=Path("epic-10/runes.catalog.qa.json"),
    fixture_relative_path=Path("generated/fixture-runes.catalog.json"),
    source_titles=EPIC_10_SOURCE_TITLES,
    detail_titles=(),
    page_limit=EPIC_10_LIMITS.page_limit,
    request_limit=EPIC_10_LIMITS.request_limit,
    response_byte_cap=EPIC_10_LIMITS.response_byte_cap,
    parser_byte_cap=EPIC_10_LIMITS.max_parser_bytes,
    media_title_limit=160,
    aggregate_byte_cap=10_000_000,
    catalog_byte_cap=2_000_000,
    qa_byte_cap=1_000_000,
)

EPIC_11_PROFILE = DataIngestionProfile(
    id=EPIC_11_PROFILE_ID,
    source_target="BACKLOG",
    source_epic="EPIC-11",
    generated_relative_path=Path("epic-11/insignias.catalog.json"),
    qa_relative_path=Path("epic-11/insignias.catalog.qa.json"),
    fixture_relative_path=Path("generated/fixture-insignias.catalog.json"),
    source_titles=EPIC_11_SOURCE_TITLES,
    detail_titles=(),
    page_limit=EPIC_11_LIMITS.page_limit,
    request_limit=EPIC_11_LIMITS.request_limit,
    response_byte_cap=EPIC_11_LIMITS.response_byte_cap,
    parser_byte_cap=EPIC_11_LIMITS.max_parser_bytes,
    media_title_limit=64,
    aggregate_byte_cap=10_000_000,
    catalog_byte_cap=2_000_000,
    qa_byte_cap=1_000_000,
)

PROFILES = {
    EPIC_02_PROFILE.id: EPIC_02_PROFILE,
    EPIC_03_PROFILE.id: EPIC_03_PROFILE,
    EPIC_04_PROFILE.id: EPIC_04_PROFILE,
    EPIC_10_PROFILE.id: EPIC_10_PROFILE,
    EPIC_11_PROFILE.id: EPIC_11_PROFILE,
}


def profile_by_id(profile_id: str) -> DataIngestionProfile:
    try:
        return PROFILES[profile_id]
    except KeyError as exc:
        raise ValueError(f"Unknown data ingestion profile: {profile_id}") from exc


def profile_choices() -> tuple[str, ...]:
    return tuple(PROFILES.keys())
