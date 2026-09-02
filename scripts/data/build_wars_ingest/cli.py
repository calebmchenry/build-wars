from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .config import FIXTURE_GENERATED_AT, SystemClock
from .pipeline import PipelineError, PipelineOptions, run_pipeline
from .profiles import EPIC_03_PROFILE_ID, EPIC_04_PROFILE_ID, EPIC_10_PROFILE_ID, profile_choices
from .wikitext import ParserUnavailable


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Regenerate Build Wars data ingestion artifacts.")
    parser.add_argument("mode", choices=("fixture", "offline", "live"), help="Ingestion mode to run.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path("work/runs/data-ingestion"),
        help="Output root that receives data/source-snapshots, data/generated, and data/qa.",
    )
    parser.add_argument(
        "--fixture-root",
        type=Path,
        default=Path("test/fixtures/data-ingestion"),
        help="Committed minimized fixture input root.",
    )
    parser.add_argument("--profile", default="guild-wars-wiki", choices=profile_choices())
    parser.add_argument("--clock", choices=("fixed", "now"), default="fixed")
    parser.add_argument("--generated-at", default=None, help="Override generated timestamp in UTC ISO-8601 form.")
    parser.add_argument("--baseline", type=Path, default=None, help="Optional artifact baseline JSON path.")
    parser.add_argument("--allow-live-network", action="store_true", help="Required for live mode.")
    parser.add_argument(
        "--stage",
        choices=("catalog", "discover", "fetch"),
        default="catalog",
        help="EPIC-04/EPIC-10 live stage. Use discover first, then fetch with the confirmed digest.",
    )
    parser.add_argument("--source-plan", type=Path, default=None, help="EPIC-04/EPIC-10 source plan path.")
    parser.add_argument(
        "--confirm-source-set-digest",
        default=None,
        help="Exact EPIC-04 source-plan digest or EPIC-10 source-set digest required for live fetch.",
    )
    parser.add_argument("--snapshot-set", type=Path, default=None, help="EPIC-04/EPIC-10 offline snapshot-set manifest path.")
    parser.add_argument(
        "--detail-limit",
        type=int,
        default=None,
        help="Lower EPIC-04/EPIC-10 live fetch detail-page limit for manual smoke tests.",
    )
    parser.add_argument(
        "--title",
        action="append",
        default=[],
        help="Live mode page title to fetch. May be repeated.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.mode == "live" and not args.allow_live_network:
        parser.error("live mode requires --allow-live-network")
    if args.mode == "live" and args.profile not in {EPIC_03_PROFILE_ID, EPIC_04_PROFILE_ID, EPIC_10_PROFILE_ID} and not args.title:
        parser.error("live mode requires at least one --title")
    if args.mode == "live" and args.profile in {EPIC_04_PROFILE_ID, EPIC_10_PROFILE_ID} and args.stage == "catalog":
        parser.error(f"{args.profile} live mode requires --stage discover or --stage fetch")
    if args.mode == "offline" and args.profile in {EPIC_04_PROFILE_ID, EPIC_10_PROFILE_ID} and args.snapshot_set is None:
        parser.error(f"{args.profile} offline mode requires --snapshot-set")

    generated_at = args.generated_at
    if generated_at is None:
        generated_at = FIXTURE_GENERATED_AT if args.clock == "fixed" else SystemClock().now()

    try:
        result = run_pipeline(
            PipelineOptions(
                mode=args.mode,
                output_root=args.root,
                fixture_root=args.fixture_root,
                profile=args.profile,
                generated_at=generated_at,
                baseline_path=args.baseline,
                allow_live_network=args.allow_live_network,
                live_titles=tuple(args.title),
                stage=args.stage,
                source_plan_path=args.source_plan,
                confirm_source_set_digest=args.confirm_source_set_digest,
                snapshot_set_path=args.snapshot_set,
                detail_limit=args.detail_limit,
            )
        )
    except ParserUnavailable as exc:
        print(f"data setup required: {exc}", file=sys.stderr)
        print("Run: npm run data:setup", file=sys.stderr)
        return 2
    except PipelineError as exc:
        print(f"data regenerate failed: {exc}", file=sys.stderr)
        return 2

    print(f"mode: {args.mode}")
    print(f"artifact: {result.artifact_path}")
    print(f"manifest: {result.manifest_path}")
    print(f"qaReport: {result.qa_report_path}")
    print(f"qaSummary: {result.qa_summary_path}")
    print(f"records: {result.record_count}")
    print(f"findings: {result.finding_count}")
    print(f"appGate: {result.qa_report['appConsumptionGate']}")
    print(f"publicGate: {result.qa_report['publicReleaseGate']}")
    return result.exit_code


if __name__ == "__main__":
    raise SystemExit(main())
