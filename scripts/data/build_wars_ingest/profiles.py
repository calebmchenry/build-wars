from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .config import DEFAULT_LIMITS

EPIC_02_PROFILE_ID = "guild-wars-wiki"
EPIC_03_PROFILE_ID = "epic-03-professions-attributes"

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

PROFILES = {
    EPIC_02_PROFILE.id: EPIC_02_PROFILE,
    EPIC_03_PROFILE.id: EPIC_03_PROFILE,
}


def profile_by_id(profile_id: str) -> DataIngestionProfile:
    try:
        return PROFILES[profile_id]
    except KeyError as exc:
        raise ValueError(f"Unknown data ingestion profile: {profile_id}") from exc


def profile_choices() -> tuple[str, ...]:
    return tuple(PROFILES.keys())
