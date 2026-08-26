# ASX announcement compliance scanner

Monitors ASX-listed companies' announcements for continuous-disclosure and
conduct risk. It pulls announcements from the ASX, extracts the PDF text,
screens each one against an Australian compliance rubric (Listing Rules,
misleading/deceptive conduct, greenwashing, consumer-law exposure), and
assembles a findings report.

Output is a **first-pass risk screen for escalation, not legal advice.**

## Two ways to run it

**Watch mode (recommended).** Looks back a few days across a watchlist and
processes only announcements it hasn't already recorded:

```bash
python scan.py all --incremental --tickers AGL,ORG,APA
```

This is the right shape for continuous-disclosure work. Listing Rule 3.1 is
about *immediacy* — whether a company disclosed something promptly once it
knew — so what matters is capturing each announcement as it lands, with its
timestamp. A run every weekday builds that record; a retrospective batch sweep
can only reconstruct it. Each run also stays small, so a watchlist of companies
costs little.

**Backfill.** Screens a past window in one pass:

```bash
python scan.py all --tickers AGL --since 2026-05-25 --until 2026-08-25
```

**Offline check.** Exercises the whole pipeline on bundled fixtures:

```bash
python scan.py all --dry-run --no-api
python test_scanner.py
```

Everything lands in `--out` (default `out/`): `register.json`, `pdfs/`,
`text/`, `verdicts/`, and `REPORT.md`.

## How incremental runs work

The register persists between runs, keyed by `(ticker, announcement id)`. Each
run fetches the index, diffs it against the register, and downloads, extracts
and reviews **only the new entries**. Re-running immediately does nothing and
costs nothing. An index that returns no announcements at all is treated as a
fetch failure, not a quiet market — a silent no-op would look identical to
"nothing was disclosed", which is exactly the wrong thing to get wrong.

## Setup

```bash
pip install -r requirements.txt
```

## The review stage

`prompts/rubric_system.md` is the compliance rubric — the actual method. The
review stage applies it one announcement at a time:

- **With Anthropic credentials** (`ANTHROPIC_API_KEY`, or an `ant auth login`
  profile): each announcement is reviewed by Claude (`--model` defaults to
  `claude-opus-5`), producing a structured JSON verdict per announcement.
- **Without credentials** (or with `--no-api`): the scanner writes
  `out/review_pack/` containing the rubric and all extracted texts. Open a
  Claude Code session there, have it review each text against `RUBRIC.md` and
  save `<name>.verdict.json` files, then run `python scan.py report`.

## Where the data comes from

| Source | Use | Status |
|---|---|---|
| ASX per-company statistics page | Announcement index (a full year per request) | Works |
| MarkitDigital research API | Cross-checks the price-sensitive flag on recent items | Works, recent items only |
| `www.asx.com.au` announcement PDFs | Primary document text | Works |
| `www.asx.com.au/asx/1/company/…` (legacy JSON API) | — | **Retired, returns 404** |
| The companies' own investor sites | — | **Blocked (403) for automated access** |

Company investor sites sit behind bot protection, so primary text comes from
the ASX rather than the issuer. That is the better provenance anyway: the ASX
copy is the lodged document.

## Scheduled runs

`.github/workflows/asx-disclosure-watch.yml` runs the scanner on weekday
evenings (after the ASX announcements day closes), self-tests before trusting a
run, and commits the register and extracted text back to the branch. Use its
**Run workflow** button for an ad-hoc run or a backfill — it takes the ticker
list, mode, and window as inputs.

Running it in CI is not incidental: Claude Code remote environments block
asx.com.au at the egress proxy, so the scanner cannot fetch from inside a
session. A CI runner has open internet and commits results back, which is also
how the scheduled monitoring gets done without anyone running anything.

## Notes and limits

- The statistics page indexes a year at a time; windows spanning years fetch
  each year.
- Scanned/image-only PDFs are flagged `needs_ocr` rather than reviewed as empty.
- Very long documents (annual reports) are reviewed from the first ~300k
  characters and the verdict says so; split the PDF for full coverage.
- The price-sensitive flag is read from the ASX page's marker and corrected
  from MarkitDigital where the two overlap; for older announcements it is the
  page marker alone.
