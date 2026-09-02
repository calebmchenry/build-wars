from __future__ import annotations

from pathlib import Path
from typing import Any

from .artifacts import canonical_json_bytes
from .models import digest_bytes


class SourceSetProtocolError(RuntimeError):
    pass


def digest_canonical_value(value: Any) -> str:
    return digest_bytes(canonical_json_bytes(value))


def require_matching_digest(*, label: str, actual: str, expected: str | None) -> None:
    if not expected:
        raise SourceSetProtocolError(f"{label} digest confirmation is required")
    if actual != expected:
        raise SourceSetProtocolError(f"{label} digest confirmation did not match")


def require_unique_values(values: list[str], *, label: str) -> None:
    if len(set(values)) != len(values):
        raise SourceSetProtocolError(f"{label} contains duplicate values")


def confined_child_path(root: Path, value: str) -> Path:
    resolved_root = root.resolve()
    candidate = (resolved_root / value).resolve()
    try:
        candidate.relative_to(resolved_root)
    except ValueError as exc:
        raise SourceSetProtocolError(f"Snapshot child path escapes root: {value}") from exc
    return candidate
