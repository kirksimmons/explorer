"""Announcement index and PDF retrieval, plus register persistence.

The index and downloads come from :mod:`asx_web` (the ASX website); the legacy
JSON API this module used to call was retired and now returns 404.

NOTE: Claude Code remote environments commonly block asx.com.au at the egress
proxy. Run this from a normal machine or CI, or allow-list www.asx.com.au and
announcements.asx.com.au in the environment's network settings.
"""

from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import asx_web

make_session = asx_web.make_session
slugify = lambda text, max_len=60: __import__("re").sub(  # noqa: E731
    r"[^a-z0-9]+", "-", text.lower()
).strip("-")[:max_len]


def fetch_index(ticker: str, since: dt.date, until: dt.date, count: int = 200) -> list[dict]:
    """Announcements for `ticker` released within [since, until], newest first.

    `count` is accepted for backwards compatibility and ignored: the ASX
    statistics page returns a full year per request.
    """
    session = asx_web.make_session()
    entries = asx_web.fetch_index(ticker, since, until, session=session)
    asx_web.cross_check_sensitivity(ticker, entries, session=session)
    for entry in entries:
        entry["ticker"] = ticker.upper()
    return entries


def download_pdfs(entries: list[dict], out_dir: Path) -> None:
    """Download each announcement PDF into out_dir, updating entries in place."""
    asx_web.download_pdfs(entries, out_dir)


def save_register(entries: list[dict], out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    register = out_dir / "register.json"
    register.write_text(json.dumps(entries, indent=2), encoding="utf-8")
    return register


def load_register(out_dir: Path) -> list[dict]:
    register = Path(out_dir) / "register.json"
    if not register.exists():
        return []
    return json.loads(register.read_text(encoding="utf-8"))


def merge_register(existing: list[dict], fresh: list[dict]) -> tuple[list[dict], list[dict]]:
    """Merge newly fetched entries into the stored register.

    Returns (merged, new_entries). Identity is (ticker, announcement id), so a
    re-run never re-downloads or re-reviews an announcement already recorded.
    """
    def key(entry: dict) -> tuple[str, str]:
        return (entry.get("ticker", ""), str(entry.get("id", "")))

    by_key = {key(e): e for e in existing}
    new_entries = []
    for entry in fresh:
        if key(entry) not in by_key:
            by_key[key(entry)] = entry
            new_entries.append(entry)
    merged = sorted(
        by_key.values(),
        key=lambda e: (e.get("date", ""), e.get("time", "")),
        reverse=True,
    )
    return merged, new_entries
