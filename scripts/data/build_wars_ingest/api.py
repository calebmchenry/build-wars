from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable, Iterable, Mapping
from dataclasses import dataclass
from email.utils import parsedate_to_datetime
from typing import Any

from .config import GUILD_WARS_WIKI_PROFILE, IngestLimits, SourceProfile
from .models import Diagnostic, Evidence


@dataclass(frozen=True)
class TransportResponse:
    status: int
    headers: Mapping[str, str]
    body: bytes
    final_url: str


class ApiError(RuntimeError):
    def __init__(
        self,
        code: str,
        message: str,
        *,
        status: int | None = None,
        diagnostics: list[Diagnostic] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.status = status
        self.diagnostics = diagnostics or []


Transport = Callable[[str, float, Mapping[str, str]], TransportResponse]
Sleeper = Callable[[float], None]


def urllib_transport(url: str, timeout: float, headers: Mapping[str, str]) -> TransportResponse:
    request = urllib.request.Request(url, headers=dict(headers), method="GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return TransportResponse(
                status=response.status,
                headers=dict(response.headers.items()),
                body=response.read(),
                final_url=response.geturl(),
            )
    except urllib.error.HTTPError as exc:
        body = exc.read()
        return TransportResponse(
            status=exc.code,
            headers=dict(exc.headers.items()),
            body=body,
            final_url=exc.geturl(),
        )


class MediaWikiClient:
    def __init__(
        self,
        *,
        profile: SourceProfile = GUILD_WARS_WIKI_PROFILE,
        transport: Transport = urllib_transport,
        sleeper: Sleeper = time.sleep,
        limits: IngestLimits | None = None,
    ) -> None:
        self.profile = profile
        self.transport = transport
        self.sleeper = sleeper
        self.limits = limits or profile.limits
        self.request_log: list[dict[str, Any]] = []
        self.request_count = 0

    def request(self, params: Mapping[str, Any]) -> dict[str, Any]:
        clean_params = self._request_params(params)
        last_error: ApiError | None = None

        for attempt in range(self.limits.max_retries + 1):
            self._enforce_request_limit()
            self.request_count += 1
            url = self._url(clean_params)
            headers = {"User-Agent": self.profile.user_agent, "Accept": "application/json"}
            try:
                response = self.transport(
                    url,
                    self.limits.request_timeout_seconds,
                    headers,
                )
            except (TimeoutError, OSError, urllib.error.URLError) as exc:
                last_error = ApiError("network-transient", f"Temporary API transport failure: {exc}")
                self._log_request(clean_params, None, attempt, "network-transient")
                if not self._should_retry(attempt):
                    break
                self.sleeper(self._retry_delay(attempt, None))
                continue

            self._log_request(clean_params, response.status, attempt, None)
            self._validate_final_origin(response.final_url)
            if len(response.body) > self.limits.response_byte_cap:
                raise ApiError(
                    "oversized-response",
                    f"MediaWiki response exceeded {self.limits.response_byte_cap} bytes",
                    status=response.status,
                )

            if response.status in {429, 502, 503, 504}:
                last_error = ApiError(
                    "http-transient",
                    f"Transient MediaWiki HTTP status {response.status}",
                    status=response.status,
                )
                if not self._should_retry(attempt):
                    break
                self.sleeper(self._retry_delay(attempt, response.headers.get("Retry-After")))
                continue

            if response.status >= 400:
                raise ApiError(
                    "http-error",
                    f"Permanent MediaWiki HTTP status {response.status}",
                    status=response.status,
                )

            try:
                payload = json.loads(response.body.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                raise ApiError("malformed-json", f"Malformed MediaWiki JSON response: {exc}") from exc

            if not isinstance(payload, dict):
                raise ApiError("schema-error", "MediaWiki response root was not an object")

            error = payload.get("error")
            if isinstance(error, dict):
                error_code = str(error.get("code", "api-error"))
                if error_code == "maxlag":
                    last_error = ApiError(
                        "maxlag",
                        str(error.get("info", "MediaWiki maxlag response")),
                        diagnostics=[
                            Diagnostic(
                                code="API_MAXLAG",
                                severity="warning",
                                message="MediaWiki maxlag response was retried",
                                category="stale-or-unverified-revision",
                                scope_kind="source",
                                evidence=(Evidence("source", self.profile.api_endpoint, error_code),),
                            )
                        ],
                    )
                    if not self._should_retry(attempt):
                        break
                    self.sleeper(self._retry_delay(attempt, response.headers.get("Retry-After")))
                    continue
                raise ApiError(error_code, str(error.get("info", "MediaWiki API error")))

            return payload

        if last_error is None:
            last_error = ApiError("retry-exhausted", "MediaWiki retry budget exhausted")
        raise ApiError(
            "retry-exhausted",
            f"MediaWiki retry budget exhausted after {self.limits.max_retries + 1} attempts: {last_error}",
            status=last_error.status,
            diagnostics=last_error.diagnostics,
        )

    def continue_query(self, params: Mapping[str, Any]) -> list[dict[str, Any]]:
        responses: list[dict[str, Any]] = []
        continuation: dict[str, Any] = {}
        seen: set[tuple[tuple[str, str], ...]] = set()

        for _ in range(self.limits.max_continuation_pages):
            payload = self.request({**params, **continuation})
            responses.append(payload)
            next_continue = payload.get("continue")
            if next_continue is None:
                return responses
            if not isinstance(next_continue, dict):
                raise ApiError("continuation-schema", "MediaWiki continue value was not an object")
            key = tuple(sorted((str(k), str(v)) for k, v in next_continue.items()))
            if key in seen:
                raise ApiError("continuation-cycle", "MediaWiki continuation cycle detected")
            seen.add(key)
            continuation = dict(next_continue)

        raise ApiError("continuation-limit", "MediaWiki continuation page limit exceeded")

    def query_siteinfo(self) -> dict[str, Any]:
        return self.request({"action": "query", "meta": "siteinfo", "siprop": "general"})

    def query_title_revisions(self, titles: list[str]) -> tuple[list[dict[str, Any]], list[Diagnostic]]:
        pages: list[dict[str, Any]] = []
        diagnostics: list[Diagnostic] = []
        for chunk in self._chunks(titles):
            payload = self.request(
                {
                    "action": "query",
                    "prop": "revisions",
                    "titles": "|".join(chunk),
                    "rvprop": "ids|timestamp|content",
                    "rvslots": "main",
                    "redirects": "1",
                }
            )
            pages.extend(self._ordered_pages(payload, chunk, diagnostics))
        return pages, diagnostics

    def query_imageinfo(self, file_titles: list[str]) -> tuple[list[dict[str, Any]], list[Diagnostic]]:
        pages: list[dict[str, Any]] = []
        diagnostics: list[Diagnostic] = []
        for chunk in self._chunks(file_titles):
            payload = self.request(
                {
                    "action": "query",
                    "prop": "imageinfo",
                    "titles": "|".join(chunk),
                    "iiprop": "url|mime|size|sha1|timestamp",
                }
            )
            pages.extend(self._ordered_pages(payload, chunk, diagnostics))
        return pages, diagnostics

    def _ordered_pages(
        self,
        payload: Mapping[str, Any],
        requested_titles: list[str],
        diagnostics: list[Diagnostic],
    ) -> list[dict[str, Any]]:
        query = payload.get("query")
        pages = query.get("pages") if isinstance(query, dict) else None
        if not isinstance(pages, list):
            raise ApiError("schema-error", "MediaWiki query.pages was not a list")

        by_title = {str(page.get("title")): page for page in pages if isinstance(page, dict)}
        normalized = {}
        redirects = {}
        if isinstance(query, dict):
            for item in query.get("normalized", []) if isinstance(query.get("normalized"), list) else []:
                if isinstance(item, dict):
                    normalized[str(item.get("from"))] = str(item.get("to"))
            for item in query.get("redirects", []) if isinstance(query.get("redirects"), list) else []:
                if isinstance(item, dict):
                    redirects[str(item.get("from"))] = str(item.get("to"))

        ordered: list[dict[str, Any]] = []
        for title in requested_titles:
            candidate = redirects.get(normalized.get(title, title), normalized.get(title, title))
            page = by_title.get(title) or by_title.get(candidate)
            if page is None or page.get("missing") is True:
                diagnostics.append(
                    Diagnostic(
                        code="API_MISSING_PAGE",
                        severity="error",
                        message=f"MediaWiki page was missing: {title}",
                        category="invalid-source-reference",
                        scope_kind="source",
                        source_ids=(title,),
                    )
                )
                continue
            ordered.append(page)
        return ordered

    def _request_params(self, params: Mapping[str, Any]) -> dict[str, str]:
        if "url" in params:
            raise ApiError("invalid-query", "MediaWiki client accepts query parameters, not URLs")
        clean = {str(key): str(value) for key, value in params.items()}
        clean["format"] = "json"
        clean["formatversion"] = "2"
        clean.setdefault("maxlag", str(self.profile.maxlag_seconds))
        return clean

    def _url(self, params: Mapping[str, str]) -> str:
        query = urllib.parse.urlencode(sorted(params.items()), doseq=True)
        return f"{self.profile.api_endpoint}?{query}"

    def _validate_final_origin(self, final_url: str) -> None:
        expected = urllib.parse.urlparse(self.profile.api_endpoint)
        actual = urllib.parse.urlparse(final_url)
        if (actual.scheme, actual.netloc, actual.path) != (
            expected.scheme,
            expected.netloc,
            expected.path,
        ):
            raise ApiError("final-origin-mismatch", "MediaWiki redirect left the configured API origin")

    def _log_request(
        self,
        params: Mapping[str, str],
        status: int | None,
        attempt: int,
        error: str | None,
    ) -> None:
        self.request_log.append(
            {
                "endpoint": self.profile.api_endpoint,
                "method": "GET",
                "params": sorted(params.keys()),
                "status": status,
                "attempt": attempt,
                "error": error,
            }
        )

    def _retry_delay(self, attempt: int, retry_after: str | None) -> float:
        if retry_after:
            try:
                seconds = float(retry_after)
                return min(max(seconds, 0.0), self.limits.max_retry_delay_seconds)
            except ValueError:
                try:
                    parsed = parsedate_to_datetime(retry_after)
                    seconds = max(parsed.timestamp() - time.time(), 0.0)
                    return min(seconds, self.limits.max_retry_delay_seconds)
                except (TypeError, ValueError, OverflowError):
                    pass
        return min(0.25 * (2**attempt), self.limits.max_retry_delay_seconds)

    def _should_retry(self, attempt: int) -> bool:
        return attempt < self.limits.max_retries

    def _enforce_request_limit(self) -> None:
        if self.request_count >= self.limits.request_limit:
            raise ApiError("request-limit", "Configured MediaWiki request limit exceeded")

    def _chunks(self, items: list[str]) -> Iterable[list[str]]:
        if len(items) > self.limits.page_limit:
            raise ApiError("page-limit", "Configured MediaWiki page limit exceeded")
        for index in range(0, len(items), self.limits.batch_size):
            yield items[index : index + self.limits.batch_size]
