#!/usr/bin/env python3
"""ASX announcement compliance scanner.

Pipeline: fetch -> extract -> review -> report. Run stages individually or use
`all`. See README.md for setup and the network caveats that apply when running
inside a Claude Code remote environment.

Examples:
    python scan.py all --ticker AGL --since 2026-05-25 --until 2026-08-25
    python scan.py all --dry-run          # exercises the pipeline on fixtures
    python scan.py report --out out       # rebuild REPORT.md from verdicts
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shutil
import sys
from pathlib import Path

import extract
import fetch
import report
import rubric

HERE = Path(__file__).parent


def load_register(out_dir: Path) -> list[dict]:
    register = out_dir / "register.json"
    if not register.exists():
        sys.exit(f"No register at {register} — run the fetch stage first.")
    return json.loads(register.read_text(encoding="utf-8"))


def stage_fetch(args) -> list[dict]:
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
        print(f"[dry-run] loaded {len(entries)} fixture announcements")
    else:
        since = dt.date.fromisoformat(args.since)
        until = dt.date.fromisoformat(args.until)
        entries = fetch.fetch_index(args.ticker, since, until, count=args.count)
        print(f"fetched index: {len(entries)} announcements in window")
        fetch.download_pdfs(entries, out / "pdfs")
        downloaded = sum(1 for e in entries if e.get("pdf_file"))
        print(f"downloaded {downloaded}/{len(entries)} PDFs")
    fetch.save_register(entries, out)
    return entries


def stage_extract(args, entries: list[dict]) -> None:
    out = Path(args.out)
    extract.extract_all(entries, out / "text")
    fetch.save_register(entries, out)
    extracted = sum(1 for e in entries if e.get("text_file"))
    print(f"extracted text for {extracted} announcements")


def stage_review(args, entries: list[dict]) -> None:
    out = Path(args.out)
    if not args.no_api and rubric.have_claude_credentials():
        rubric.review_with_claude(entries, out / "verdicts", model=args.model)
        fetch.save_register(entries, out)
        print("review complete (Claude API)")
    else:
        pack = rubric.write_review_pack(entries, out)
        print(f"no Anthropic credentials — wrote manual review pack at {pack}")


def stage_report(args, entries: list[dict]) -> None:
    out = Path(args.out)
    # Verdicts may have been produced manually from a review pack; link them up.
    for entry in entries:
        if entry.get("text_file") and not entry.get("verdict_file"):
            for candidate_dir in (out / "verdicts", out / "review_pack" / "texts"):
                candidate = candidate_dir / (Path(entry["text_file"]).stem + ".verdict.json")
                if candidate.exists():
                    entry["verdict_file"] = str(candidate)
                    break
    fetch.save_register(entries, out)
    target = report.write_report(entries, out, args.ticker, args.since, args.until)
    print(f"report written to {target}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stage", choices=["fetch", "extract", "review", "report", "all"])
    parser.add_argument("--ticker", default="AGL")
    parser.add_argument("--since", default="2026-05-25")
    parser.add_argument("--until", default="2026-08-25")
    parser.add_argument("--count", type=int, default=200, help="max index entries to request")
    parser.add_argument("--out", default="out")
    parser.add_argument("--model", default=rubric.DEFAULT_MODEL)
    parser.add_argument("--dry-run", action="store_true", help="use bundled fixtures, no network")
    parser.add_argument("--no-api", action="store_true", help="always write a manual review pack")
    args = parser.parse_args()

    if args.stage in ("fetch", "all"):
        entries = stage_fetch(args)
    else:
        entries = load_register(Path(args.out))
    if args.stage in ("extract", "all"):
        stage_extract(args, entries)
    if args.stage in ("review", "all"):
        stage_review(args, entries)
    if args.stage in ("report", "all"):
        stage_report(args, entries)


if __name__ == "__main__":
    main()
