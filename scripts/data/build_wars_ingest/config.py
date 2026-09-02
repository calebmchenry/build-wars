from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

INGESTION_SCHEMA_VERSION = 1
GENERATOR_NAME = "build-wars-ingest/0.1.0"
FIXTURE_GENERATED_AT = "2026-09-01T00:00:00Z"
GUILD_WARS_WIKI_API = "https://wiki.guildwars.com/api.php"


@dataclass(frozen=True)
class IngestLimits:
    request_timeout_seconds: float = 10.0
    response_byte_cap: int = 2_000_000
    max_retries: int = 3
    max_retry_delay_seconds: float = 5.0
    max_continuation_pages: int = 20
    batch_size: int = 50
    page_limit: int = 200
    request_limit: int = 200
    max_parser_bytes: int = 250_000


@dataclass(frozen=True)
class SourceProfile:
    name: str
    api_endpoint: str
    maxlag_seconds: int
    user_agent: str
    limits: IngestLimits


DEFAULT_LIMITS = IngestLimits()
EPIC_04_LIMITS = IngestLimits(
    response_byte_cap=5_000_000,
    max_retries=3,
    max_continuation_pages=20,
    batch_size=50,
    page_limit=4_200,
    request_limit=260,
    max_parser_bytes=750_000,
)
EPIC_10_LIMITS = IngestLimits(
    response_byte_cap=5_000_000,
    max_retries=3,
    max_continuation_pages=10,
    batch_size=50,
    page_limit=180,
    request_limit=80,
    max_parser_bytes=750_000,
)
EPIC_11_LIMITS = IngestLimits(
    response_byte_cap=5_000_000,
    max_retries=3,
    max_continuation_pages=10,
    batch_size=50,
    page_limit=64,
    request_limit=48,
    max_parser_bytes=750_000,
)
GUILD_WARS_WIKI_PROFILE = SourceProfile(
    name="guild-wars-wiki",
    api_endpoint=GUILD_WARS_WIKI_API,
    maxlag_seconds=5,
    user_agent=(
        "BuildWars/0.1 data-ingestion-platform "
        "(local-first fan tooling; contact: https://github.com/build-wars)"
    ),
    limits=DEFAULT_LIMITS,
)
PROFILES = {GUILD_WARS_WIKI_PROFILE.name: GUILD_WARS_WIKI_PROFILE}


@dataclass(frozen=True)
class RuntimeRoots:
    root: Path
    snapshot_root: Path
    generated_root: Path
    qa_root: Path
    fixture_root: Path

    @classmethod
    def from_root(cls, root: Path) -> "RuntimeRoots":
        resolved = root.resolve()
        return cls(
            root=resolved,
            snapshot_root=resolved / "data/source-snapshots",
            generated_root=resolved / "data/generated",
            qa_root=resolved / "data/qa",
            fixture_root=resolved / "test/fixtures/data-ingestion",
        )


class FixedClock:
    def __init__(self, timestamp: str = FIXTURE_GENERATED_AT) -> None:
        self.timestamp = timestamp

    def now(self) -> str:
        return self.timestamp


class SystemClock:
    def now(self) -> str:
        return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def profile_by_name(name: str) -> SourceProfile:
    try:
        return PROFILES[name]
    except KeyError as exc:
        raise ValueError(f"Unknown source profile: {name}") from exc
