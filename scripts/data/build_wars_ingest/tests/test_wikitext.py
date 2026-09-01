from __future__ import annotations

import unittest
from pathlib import Path

from build_wars_ingest.wikitext import parse_wikitext

FIXTURE_ROOT = Path("test/fixtures/data-ingestion")


class WikitextParserTests(unittest.TestCase):
    def test_parser_fixture_preserves_template_order_and_nesting(self) -> None:
        text = (FIXTURE_ROOT / "wikitext/parser-corpus.wiki").read_text(encoding="utf-8")

        parsed = parse_wikitext(text, source_label="fixture")

        names = [template["normalizedName"] for template in parsed["templates"]]
        self.assertEqual(
            names,
            ["skill infobox", "skill progression", "pveversion", "pvpversion", "title-rank progression"],
        )
        infobox = parsed["templates"][0]
        recharge = next(param for param in infobox["params"] if param["normalizedName"] == "recharge")
        self.assertEqual(recharge["nestedTemplates"][0]["normalizedName"], "morale-boost recharge")
        description = next(param for param in infobox["params"] if param["normalizedName"] == "description")
        self.assertEqual(description["nestedTemplates"][0]["normalizedName"], "gr")
        self.assertEqual(parsed["recommendation"], "accept-mwparserfromhell")

    def test_preserves_unknown_params_comments_nowiki_and_disambiguation_preamble(self) -> None:
        text = (FIXTURE_ROOT / "wikitext/parser-corpus.wiki").read_text(encoding="utf-8")

        parsed = parse_wikitext(text, source_label="fixture")

        self.assertIsNotNone(parsed["disambiguationPreamble"])
        self.assertEqual(len(parsed["comments"]), 1)
        self.assertEqual(len(parsed["nowiki"]), 1)
        self.assertIn("PARSER_UNKNOWN_PARAM", [diagnostic.code for diagnostic in parsed["diagnostics"]])

    def test_redirect_target_is_detected(self) -> None:
        parsed = parse_wikitext("#REDIRECT [[Fixture Flame]]\n{{Redirect}}", source_label="redirect")

        self.assertEqual(parsed["redirectTarget"], "Fixture Flame")

    def test_duplicate_positional_and_named_params_are_reported(self) -> None:
        parsed = parse_wikitext("{{gr|1|2|2=duplicate}}{{Skill infobox|name=A|name=B}}", source_label="dup")

        self.assertIn("PARSER_DUPLICATE_PARAM", [diagnostic.code for diagnostic in parsed["diagnostics"]])

    def test_quoted_names_punctuation_and_wrappers_are_preserved(self) -> None:
        parsed = parse_wikitext(
            '{{pvpversion|{{Skill infobox|name="Fixture, Skill!"|recharge={{gr2|1|2|3|4}}}}}}',
            source_label="quoted",
        )

        wrapper = parsed["templates"][0]
        nested = wrapper["params"][0]["nestedTemplates"][0]
        name_param = next(param for param in nested["params"] if param["normalizedName"] == "name")
        self.assertEqual(name_param["rawValue"], '"Fixture, Skill!"')
        self.assertEqual(wrapper["normalizedName"], "pvpversion")

    def test_oversized_input_requests_fallback(self) -> None:
        parsed = parse_wikitext("x" * 20, source_label="large", max_bytes=4)

        self.assertEqual(parsed["recommendation"], "fallback-required")
        self.assertEqual(parsed["diagnostics"][0].code, "PARSER_INPUT_TOO_LARGE")


if __name__ == "__main__":
    unittest.main()
