from __future__ import annotations

import unittest

from build_wars_ingest.icons import candidate_file_titles, resolve_icon_metadata
from build_wars_ingest.models import source_reference


def source_ref() -> dict[str, object]:
    return source_reference(
        source_id="source:gww:icon",
        name="Guild Wars Wiki",
        canonical_url="https://wiki.guildwars.com/wiki/File:Fixture.png",
        page_id=1,
        page_title="File:Fixture.png",
        revision_id=1,
        source_revision_timestamp="2026-08-31T00:00:00Z",
        retrieved_at="2026-09-01T00:00:00Z",
        material_class="media-metadata",
    )


def image_page(title: str, **overrides: object) -> dict[str, object]:
    info = {
        "url": f"https://wiki.guildwars.com/images/{title}",
        "descriptionurl": f"https://wiki.guildwars.com/wiki/{title.replace(' ', '_')}",
        "mime": "image/png",
        "width": 64,
        "height": 64,
        "size": 1000,
        "timestamp": "2026-08-31T00:00:00Z",
        "sha1": "a" * 40,
    }
    info.update(overrides)
    return {"title": title, "pageid": 1, "imageinfo": [info]}


class IconResolverTests(unittest.TestCase):
    def test_candidate_titles_use_explicit_or_default_files(self) -> None:
        self.assertEqual(candidate_file_titles("Fixture"), ["File:Fixture.jpg", "File:Fixture.png"])
        self.assertEqual(candidate_file_titles("Fixture", "Image:Custom.PNG"), ["File:Custom.PNG"])

    def test_explicit_image_and_uppercase_extension_resolve_metadata_only(self) -> None:
        metadata, diagnostics = resolve_icon_metadata(
            page_title="Fixture",
            source_id="source:gww:icon",
            source_reference=source_ref(),
            imageinfo_pages=[image_page("File:Custom.PNG")],
            explicit_image="Custom.PNG",
        )

        self.assertEqual(diagnostics, [])
        self.assertIsNotNone(metadata)
        self.assertEqual(metadata["fileTitle"], "File:Custom.PNG")
        self.assertFalse(metadata["cachedBytes"])
        self.assertNotIn("bytes", metadata)

    def test_unique_default_candidate_is_selected(self) -> None:
        metadata, diagnostics = resolve_icon_metadata(
            page_title="Fixture",
            source_id="source:gww:icon",
            source_reference=source_ref(),
            imageinfo_pages=[image_page("File:Fixture.png")],
        )

        self.assertEqual(diagnostics, [])
        self.assertEqual(metadata["fileTitle"], "File:Fixture.png")

    def test_ambiguous_and_missing_defaults_do_not_choose_arbitrary_winners(self) -> None:
        ambiguous, ambiguous_diagnostics = resolve_icon_metadata(
            page_title="Fixture",
            source_id="source:gww:icon",
            source_reference=source_ref(),
            imageinfo_pages=[image_page("File:Fixture.jpg"), image_page("File:Fixture.png")],
        )
        missing, missing_diagnostics = resolve_icon_metadata(
            page_title="Fixture",
            source_id="source:gww:icon",
            source_reference=source_ref(),
            imageinfo_pages=[],
        )

        self.assertIsNone(ambiguous)
        self.assertIsNone(missing)
        self.assertEqual(ambiguous_diagnostics[0].code, "ICON_DEFAULT_AMBIGUOUS")
        self.assertEqual(missing_diagnostics[0].code, "ICON_DEFAULT_MISSING")

    def test_metadata_warnings_cover_missing_fields_unusual_mime_dimensions_and_sha1(self) -> None:
        metadata, diagnostics = resolve_icon_metadata(
            page_title="Fixture",
            source_id="source:gww:icon",
            source_reference=source_ref(),
            imageinfo_pages=[
                image_page(
                    "File:Fixture.png",
                    mime="image/gif",
                    width=32,
                    height=32,
                    sha1=None,
                    timestamp=None,
                )
            ],
        )

        self.assertIsNotNone(metadata)
        codes = {diagnostic.code for diagnostic in diagnostics}
        self.assertIn("ICON_METADATA_MISSING_FIELD", codes)
        self.assertIn("ICON_UNEXPECTED_MIME", codes)
        self.assertIn("ICON_NON_64_DIMENSIONS", codes)
        self.assertIn("ICON_REMOTE_SHA1_ABSENT", codes)

    def test_missing_explicit_image_is_error(self) -> None:
        metadata, diagnostics = resolve_icon_metadata(
            page_title="Fixture",
            source_id="source:gww:icon",
            source_reference=source_ref(),
            imageinfo_pages=[],
            explicit_image="Missing.png",
        )

        self.assertIsNone(metadata)
        self.assertEqual(diagnostics[0].code, "ICON_EXPLICIT_MISSING")
        self.assertEqual(diagnostics[0].severity, "error")


if __name__ == "__main__":
    unittest.main()
