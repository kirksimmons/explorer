#!/usr/bin/env python3
"""ASX announcement compliance scanner.

Two ways to run it:

* **Watch (default for scheduled runs)** — `--incremental` looks back a few days
  across a watchlist, records only announcements not already in the register,
  and reviews just those. This is the right mode for continuous-disclosure
  monitoring: each run is small, and the register accumulates a timestamped
  record of what each company disclosed and when.
* **Backfill** — an explicit `--since`/`--until` window, for screening a period
  retrospectively.

Stages run in order: fetch -> extract -> review -> report.

Examples:
    python scan.py all --incremental --tickers AGL,ORG,APA
    python scan.py all --tickers AGL --since 2026-05-25 --until 2026-08-25
    python scan.py all --dry-run --no-api        # offline, on bundled fixtures
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import json
import shutil
import sys
from pathlib import Path

import asx_web
import extract
import fetch
import report
import rubric

HERE = Path(__file__).parent


def _window(args) -> tuple[dt.date, dt.date]:
    if args.incremental:
        until = dt.date.today()
        return until - dt.timedelta(days=args.lookback_days), until
    return dt.date.fromisoformat(args.since), dt.date.fromisoformat(args.until)


def stage_fetch(args) -> tuple[list[dict], list[dict]]:
    """Returns (all_entries, entries_needing_work)."""
    out = Path(args.out)
    if args.dry_run:
        entries = json.loads(
            (HERE / "fixtures" / "announcements.json").read_text(encoding="utf-8")
        )
        pdf_dir = out / "pdfs"
        pdf_dir.mkdir(parents=True, exist_ok=True)
        for entry in entries:
            fixture_pdf = HERE / "fixtures" / entry["fixture_pdf"]
            target = pdf_dir / fixture_pdf.name
            shutil.copyfile(fixture_pdf, target)
            entry["pdf_file"] = str(target)
            entry.setdefault("ticker", "TEST")
        print(f"[dry-run] loaded {len(entries)} fixture announcements")
        fetch.save_register(entries, out)
        return entries, entries

    since, until = _window(args)
    existing = fetch.load_register(out)
    fresh: list[dict] = []
    for ticker in [t.strip().upper() for t in args.tickers.split(",") if t.strip()]:
        found = fetch.fetch_index(ticker, since, until)
        print(f"{ticker}: {len(found)} announcements in {since}..{until}")
        if not found:
            print(f"::warning::no announcements found for {ticker} — check the index source")
        fresh.extend(found)

    if not fresh:
        # An empty index across every ticker means the source broke, not that
        # the market went quiet; say so loudly rather than reporting success.
        raise SystemExit("index returned nothing for any ticker — treating as a fetch failure")

    merged, new_entries = fetch.merge_register(existing, fresh)
    # Retry anything previously recorded whose download failed, otherwise a
    # transient failure (or a bug since fixed) would leave a permanent hole.
    retries = [e for e in merged if e not in new_entries and not e.get("pdf_file")]
    if retries:
        print(f"retrying {len(retries)} announcement(s) that failed previously")
        for entry in retries:
            entry.pop("fetch_error", None)
            # Re-parse stale rows recorded before a parser fix.
            if re.match(r"\d{2}/\d{2}/\d{4}", entry.get("header", "")):
                entry["header"] = asx_web._clean_headline(entry["header"])
    todo = new_entries + retries
    print(f"{len(new_entries)} new announcement(s) since last run")
    if todo:
        fetch.download_pdfs(todo, out / "pdfs")
        got = sum(1 for e in todo if e.get("pdf_file"))
        print(f"downloaded {got}/{len(todo)} PDFs")
    fetch.save_register(merged, out)
    return merged, todo


def stage_extract(args, entries: list[dict], todo: list[dict]) -> None:
    out = Path(args.out)
    extract.extract_all(todo, out / "text")
    fetch.save_register(entries, out)
    print(f"extracted text for {sum(1 for e in todo if e.get('text_file'))} announcement(s)")


def stage_review(args, entries: list[dict], todo: list[dict]) -> None:
    out = Path(args.out)
    pending = [e for e in todo if e.get("text_file")]
    if not pending:
        print("nothing new to review")
        return
    if not args.no_api and rubric.have_claude_credentials():
        rubric.review_with_claude(pending, out / "verdicts", model=args.model)
        fetch.save_register(entries, out)
        print(f"reviewed {len(pending)} announcement(s) via Claude API")
    else:
        pack = rubric.write_review_pack(pending, out)
        print(f"no Anthropic credentials — wrote manual review pack at {pack}")


def stage_report(args, entries: list[dict]) -> None:
    out = Path(args.out)
    for entry in entries:
        if entry.get("text_file") and not entry.get("verdict_file"):
            for folder in (out / "verdicts", out / "review_pack" / "texts"):
                candidate = folder / (Path(entry["text_file"]).stem + ".verdict.json")
                if candidate.exists():
                    entry["verdict_file"] = str(candidate)
                    break
    fetch.save_register(entries, out)
    since, until = (args.since, args.until)
    if args.incremental and entries:
        since = min(e["date"] for e in entries)
        until = max(e["date"] for e in entries)
    target = report.write_report(entries, out, args.tickers, since, until)
    print(f"report written to {target}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stage", choices=["fetch", "extract", "review", "report", "all"])
    parser.add_argument("--tickers", default="AGL", help="comma-separated ASX codes")
    parser.add_argument("--incremental", action="store_true",
                        help="watch mode: look back a few days, process only new announcements")
    parser.add_argument("--lookback-days", type=int, default=7)
    parser.add_argument("--since", default="2026-05-25")
    parser.add_argument("--until", default="2026-08-25")
    parser.add_argument("--out", default="out")
    parser.add_argument("--model", default=rubric.DEFAULT_MODEL)
    parser.add_argument("--dry-run", action="store_true", help="use bundled fixtures, no network")
    parser.add_argument("--no-api", action="store_true", help="always write a manual review pack")
    args = parser.parse_args()

    if args.stage in ("fetch", "all"):
        entries, todo = stage_fetch(args)
    else:
        entries = fetch.load_register(Path(args.out))
        if not entries:
            sys.exit(f"No register in {args.out} — run the fetch stage first.")
        todo = [e for e in entries if e.get("pdf_file") and not e.get("text_file")] or entries
    if args.stage in ("extract", "all"):
        stage_extract(args, entries, todo)
    if args.stage in ("review", "all"):
        stage_review(args, entries, todo)
    if args.stage in ("report", "all"):
        stage_report(args, entries)


if __name__ == "__main__":
    main()
