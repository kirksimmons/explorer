"""Fetch ASX announcement metadata and PDFs for a listed company.

Uses the public ASX JSON API:
    https://www.asx.com.au/asx/1/company/{TICKER}/announcements?count=N&market_sensitive=false

Each entry's "url" points at a PDF on announcements.asx.com.au. Direct GETs
usually work with a browser User-Agent; when ASX serves its terms-acceptance
interstitial instead, we retry through the same session so the acceptance
cookie is carried.

NOTE: Claude Code remote environments commonly block asx.com.au at the egress
proxy. Run this from a normal machine, or allow-list www.asx.com.au and
announcements.asx.com.au in the environment's network settings.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import time
from pathlib import Path

import requests

ASX_API = "https://www.asx.com.au/asx/1/company/{ticker}/announcements"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)


def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": USER_AGENT, "Accept": "*/*"})
    return s


def _get_with_retries(session: requests.Session, url: str, **kwargs) -> requests.Response:
    delay = 2.0
    for attempt in range(4):
        try:
            resp = session.get(url, timeout=60, **kwargs)
            if resp.status_code < 500:
                return resp
        except requests.RequestException:
            if attempt == 3:
                raise
        time.sleep(delay)
        delay *= 2
    resp.raise_for_status()
    return resp


def _parse_release_date(item: dict) -> dt.date | None:
    raw = item.get("document_release_date") or item.get("document_date") or ""
    m = re.match(r"(\d{4}-\d{2}-\d{2})", raw)
    return dt.date.fromisoformat(m.group(1)) if m else None


def slugify(text: str, max_len: int = 60) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:max_len] or "announcement"


def fetch_index(ticker: str, since: dt.date, until: dt.date, count: int = 200) -> list[dict]:
    """Return announcement metadata entries within [since, until], newest first."""
    session = _session()
    resp = _get_with_retries(
        session,
        ASX_API.format(ticker=ticker.upper()),
        params={"count": count, "market_sensitive": "false"},
    )
    resp.raise_for_status()
    entries = []
    for item in resp.json().get("data", []):
        released = _parse_release_date(item)
        if released is None or not (since <= released <= until):
            continue
        entries.append(
            {
                "id": item.get("id"),
                "date": released.isoformat(),
                "header": (item.get("header") or "").strip(),
                "market_sensitive": bool(item.get("market_sensitive")),
                "pages": item.get("number_of_pages"),
                "url": item.get("url"),
                "pdf_file": None,
                "text_file": None,
            }
        )
    return entries


def download_pdfs(entries: list[dict], out_dir: Path) -> None:
    """Download each announcement PDF into out_dir, updating entries in place."""
    out_dir.mkdir(parents=True, exist_ok=True)
    session = _session()
    for entry in entries:
        if not entry.get("url"):
            continue
        name = f"{entry['date']}_{slugify(entry['header'])}.pdf"
        target = out_dir / name
        if not target.exists():
            resp = _get_with_retries(session, entry["url"])
            content = resp.content
            if not content.startswith(b"%PDF"):
                # Terms interstitial: accept once, then the same URL serves the PDF.
                pdf_link = re.search(rb'href="([^"]+\.pdf)"', content)
                retry_url = (
                    pdf_link.group(1).decode("utf-8", "replace")
                    if pdf_link
                    else entry["url"]
                )
                if retry_url.startswith("/"):
                    retry_url = "https://announcements.asx.com.au" + retry_url
                content = _get_with_retries(session, retry_url).content
            if not content.startswith(b"%PDF"):
                entry["pdf_file"] = None
                entry["fetch_error"] = "did not receive a PDF (terms page or block)"
                continue
            target.write_bytes(content)
            time.sleep(1.0)  # be polite to ASX
        entry["pdf_file"] = str(target)


def save_register(entries: list[dict], out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    register = out_dir / "register.json"
    register.write_text(json.dumps(entries, indent=2), encoding="utf-8")
    return register
