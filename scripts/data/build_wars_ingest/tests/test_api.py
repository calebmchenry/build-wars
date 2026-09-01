from __future__ import annotations

import json
import unittest
import urllib.parse
from collections.abc import Mapping

from build_wars_ingest.api import ApiError, MediaWikiClient, TransportResponse
from build_wars_ingest.config import GUILD_WARS_WIKI_API, IngestLimits


class FakeTransport:
    def __init__(self, responses: list[TransportResponse | Exception]) -> None:
        self.responses = responses
        self.calls: list[tuple[str, float, Mapping[str, str]]] = []

    def __call__(self, url: str, timeout: float, headers: Mapping[str, str]) -> TransportResponse:
        self.calls.append((url, timeout, headers))
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def response(payload: object, *, status: int = 200, final_url: str = GUILD_WARS_WIKI_API) -> TransportResponse:
    return TransportResponse(status=status, headers={}, body=json.dumps(payload).encode("utf-8"), final_url=final_url)


def query(url: str) -> dict[str, list[str]]:
    return urllib.parse.parse_qs(urllib.parse.urlparse(url).query)


class MediaWikiClientTests(unittest.TestCase):
    def test_get_json_sets_required_defaults_and_user_agent(self) -> None:
        transport = FakeTransport([response({"query": {"general": {"sitename": "Guild Wars Wiki"}}})])
        client = MediaWikiClient(transport=transport)

        payload = client.query_siteinfo()

        params = query(transport.calls[0][0])
        self.assertEqual(payload["query"]["general"]["sitename"], "Guild Wars Wiki")
        self.assertEqual(params["format"], ["json"])
        self.assertEqual(params["formatversion"], ["2"])
        self.assertEqual(params["maxlag"], ["5"])
        self.assertIn("BuildWars", transport.calls[0][2]["User-Agent"])

    def test_rejects_arbitrary_url_params(self) -> None:
        client = MediaWikiClient(transport=FakeTransport([]))

        with self.assertRaisesRegex(ApiError, "query parameters"):
            client.request({"url": "https://example.invalid/api.php"})

    def test_continuation_propagates_multiple_keys(self) -> None:
        transport = FakeTransport(
            [
                response({"continue": {"rvcontinue": "10", "continue": "||"}, "query": {"pages": []}}),
                response({"query": {"pages": []}}),
            ]
        )
        client = MediaWikiClient(transport=transport)

        client.continue_query({"action": "query", "prop": "revisions"})

        second = query(transport.calls[1][0])
        self.assertEqual(second["rvcontinue"], ["10"])
        self.assertEqual(second["continue"], ["||"])

    def test_continuation_cycle_is_rejected(self) -> None:
        transport = FakeTransport(
            [
                response({"continue": {"cmcontinue": "same"}, "query": {}}),
                response({"continue": {"cmcontinue": "same"}, "query": {}}),
            ]
        )
        client = MediaWikiClient(transport=transport)

        with self.assertRaisesRegex(ApiError, "cycle"):
            client.continue_query({"action": "query", "list": "categorymembers"})

    def test_title_batches_preserve_requested_order(self) -> None:
        transport = FakeTransport(
            [
                response(
                    {
                        "query": {
                            "pages": [
                                {"title": "B", "pageid": 2},
                                {"title": "A", "pageid": 1},
                            ]
                        }
                    }
                )
            ]
        )
        client = MediaWikiClient(transport=transport, limits=IngestLimits(batch_size=50))

        pages, diagnostics = client.query_title_revisions(["A", "B"])

        self.assertEqual([page["title"] for page in pages], ["A", "B"])
        self.assertEqual(diagnostics, [])

    def test_imageinfo_batches_report_missing_pages(self) -> None:
        transport = FakeTransport(
            [
                response(
                    {
                        "query": {
                            "pages": [
                                {"title": "File:A.png", "pageid": 1, "imageinfo": [{}]},
                                {"title": "File:B.png", "missing": True},
                            ]
                        }
                    }
                )
            ]
        )
        client = MediaWikiClient(transport=transport)

        pages, diagnostics = client.query_imageinfo(["File:A.png", "File:B.png"])

        self.assertEqual([page["title"] for page in pages], ["File:A.png"])
        self.assertEqual([item.code for item in diagnostics], ["API_MISSING_PAGE"])

    def test_retries_http_retry_after_and_maxlag(self) -> None:
        sleeps: list[float] = []
        transport = FakeTransport(
            [
                TransportResponse(503, {"Retry-After": "1.5"}, b"{}", GUILD_WARS_WIKI_API),
                response({"error": {"code": "maxlag", "info": "lagged"}}),
                response({"query": {"ok": True}}),
            ]
        )
        client = MediaWikiClient(
            transport=transport,
            sleeper=sleeps.append,
            limits=IngestLimits(max_retries=3, max_retry_delay_seconds=2),
        )

        payload = client.request({"action": "query"})

        self.assertEqual(payload["query"]["ok"], True)
        self.assertEqual(sleeps[0], 1.5)
        self.assertEqual(len(transport.calls), 3)

    def test_retry_exhaustion_is_testable(self) -> None:
        client = MediaWikiClient(
            transport=FakeTransport(
                [
                    TransportResponse(429, {}, b"{}", GUILD_WARS_WIKI_API),
                    TransportResponse(429, {}, b"{}", GUILD_WARS_WIKI_API),
                ]
            ),
            sleeper=lambda _delay: None,
            limits=IngestLimits(max_retries=1),
        )

        with self.assertRaisesRegex(ApiError, "retry budget"):
            client.request({"action": "query"})

    def test_malformed_json_and_oversized_bodies_are_permanent(self) -> None:
        malformed = MediaWikiClient(
            transport=FakeTransport([TransportResponse(200, {}, b"{", GUILD_WARS_WIKI_API)])
        )
        oversized = MediaWikiClient(
            transport=FakeTransport([TransportResponse(200, {}, b"012345", GUILD_WARS_WIKI_API)]),
            limits=IngestLimits(response_byte_cap=4),
        )

        with self.assertRaisesRegex(ApiError, "Malformed"):
            malformed.request({"action": "query"})
        with self.assertRaisesRegex(ApiError, "exceeded"):
            oversized.request({"action": "query"})

    def test_rejects_final_origin_after_redirect(self) -> None:
        client = MediaWikiClient(
            transport=FakeTransport([TransportResponse(200, {}, b"{}", "https://evil.example/api.php")])
        )

        with self.assertRaisesRegex(ApiError, "origin"):
            client.request({"action": "query"})

    def test_request_log_is_bounded_and_sanitized(self) -> None:
        body = {"query": {"pages": [{"title": "Secret", "revisions": [{"content": "raw page body"}]}]}}
        client = MediaWikiClient(transport=FakeTransport([response(body)]))

        client.request({"action": "query", "token": "super-secret"})

        encoded_log = json.dumps(client.request_log)
        self.assertIn("token", encoded_log)
        self.assertNotIn("super-secret", encoded_log)
        self.assertNotIn("raw page body", encoded_log)


if __name__ == "__main__":
    unittest.main()
