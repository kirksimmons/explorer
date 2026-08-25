# ASX announcement compliance scanner

A small pipeline that pulls a listed company's ASX announcements for a date
window, extracts the PDF text, screens every announcement against an Australian
compliance rubric (ASX Listing Rules, misleading/deceptive conduct, greenwashing,
consumer-law exposure), and assembles a markdown findings report.

Output is a **first-pass risk screen for escalation, not legal advice.**

## Setup

```bash
pip install -r requirements.txt
```

## Usage

```bash
# Full pipeline for AGL over a window
python scan.py all --ticker AGL --since 2026-05-25 --until 2026-08-25

# Stages individually
python scan.py fetch   --ticker AGL --since 2026-05-25 --until 2026-08-25
python scan.py extract
python scan.py review            # Claude API if credentials exist, else review pack
python scan.py report

# Exercise the whole pipeline offline on bundled fixtures
python scan.py all --dry-run --no-api
```

Everything lands in `out/`: `register.json` (the announcement register),
`pdfs/`, `text/`, `verdicts/` (one JSON verdict per announcement), and
`REPORT.md`.

## The review stage

`prompts/rubric_system.md` is the compliance rubric — the actual method. The
review stage runs it one announcement at a time:

- **With Anthropic credentials** (`ANTHROPIC_API_KEY`, or an `ant auth login`
  profile): each announcement is reviewed by Claude (`--model` defaults to
  `claude-opus-5`) and a structured JSON verdict is saved to `out/verdicts/`.
- **Without credentials** (or with `--no-api`): the scanner writes
  `out/review_pack/` containing the rubric and all extracted texts. Open a
  Claude Code session there, have it review each text against `RUBRIC.md` and
  save `<name>.verdict.json` files, then run `python scan.py report`.

## Network access caveat

Claude Code remote environments typically **block asx.com.au at the egress
proxy**, so the fetch stage fails there. Either:

- run the scanner on your own machine, or
- allow-list `www.asx.com.au` and `announcements.asx.com.au` for the
  environment at claude.ai/code → your environment → network settings.

`--dry-run` works anywhere and is covered by `python test_scanner.py`.

## Notes and limits

- The ASX index endpoint returns roughly the last 6 months / 200 entries;
  older windows need the paid ASX data products or a per-company investor page.
- Scanned/image-only PDFs are flagged `needs_ocr` in the register rather than
  reviewed as empty text.
- Very long documents (annual reports) are reviewed from the first ~300k
  characters and the verdict says so; split the PDF for full coverage.
