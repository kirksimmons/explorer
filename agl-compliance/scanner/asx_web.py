"""Announcement index and PDF download via the ASX website.

The legacy JSON API (www.asx.com.au/asx/1/company/{TICKER}/announcements) was
retired and returns 404. The MarkitDigital API that backs the ASX site is
reachable but returns only the few most recent announcements without
authentication, which is not enough for a date-window scan.

The per-company statistics page does return a full year of announcements:

    https://www.asx.com.au/asx/v2/statistics/announcements.do
        ?by=asxCode&asxCode={TICKER}&timeframe=Y&year={YYYY}

Each row carries the release date and time, the headline, a price-sensitive
marker, the page count and size, and a link to the PDF keyed by `idsId`.
"""

from __future__ import annotations

import datetime as dt
import html
import re
import time

import requests

STATS_URL = "https://www.asx.com.au/asx/v2/statistics/announcements.do"
PDF_URL = "https://www.asx.com.au/asx/v2/statistics/displayAnnouncement.do"
MARKIT_URL = (
    "https://asx.api.markitdigital.com/asx-research/1.0/companies/{ticker}/announcements"
)
# Public token used by the ASX website's own front end.
MARKIT_TOKEN = "83ff96335c2d45a094df02a206a39ff4"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

ROW_RE = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S | re.I)
DATE_RE = re.compile(r"(\d{2})/(\d{2})/(\d{4})")
IDS_RE = re.compile(r"idsId=(\d+)")
TAG_RE = re.compile(r"<[^>]+>")
PAGES_RE = re.compile(r"(\d+)\s*page", re.I)


def make_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/pdf,*/*",
            "Accept-Language": "en-AU,en;q=0.9",
        }
    )
    return session


def get_with_retries(session: requests.Session, url: str, **kwargs) -> requests.Response:
    delay = 2.0
    last = None
    for attempt in range(4):
        try:
            resp = session.get(url, timeout=90, **kwargs)
            if resp.status_code < 500:
                return resp
            last = resp
        except requests.RequestException as exc:
            last = exc
            if attempt == 3:
                raise
        time.sleep(delay)
        delay *= 2
    if isinstance(last, requests.Response):
        return last
    raise RuntimeError(f"failed to GET {url}: {last}")


def _row_text(row_html: str) -> str:
    """Collapse a table row's markup to readable text."""
    return html.unescape(TAG_RE.sub(" ", row_html))


def _headline(row_html: str) -> str:
    """The headline is the anchor text of the announcement link."""
    for match in re.finditer(r"<a[^>]*>(.*?)</a>", row_html, re.S | re.I):
        text = " ".join(_row_text(match.group(1)).split())
        # Skip the "PDF"/"HTML" format links and page-count noise.
        if len(text) > 12 and not PAGES_RE.search(text):
            return text
    text = " ".join(_row_text(row_html).split())
    return text[:200]


def parse_statistics_page(page_html: str) -> list[dict]:
    """Parse announcement rows out of the statistics page."""
    entries: list[dict] = []
    seen: set[str] = set()
    for row_html in ROW_RE.findall(page_html):
        ids_match = IDS_RE.search(row_html)
        date_match = DATE_RE.search(row_html)
        if not ids_match or not date_match:
            continue
        ids_id = ids_match.group(1)
        if ids_id in seen:
            continue
        seen.add(ids_id)
        day, month, year = date_match.groups()
        text = _row_text(row_html)
        pages_match = PAGES_RE.search(text)
        entries.append(
            {
                "id": ids_id,
                "date": f"{year}-{month}-{day}",
                "time": (re.search(r"\d{1,2}:\d{2}\s*[ap]m", text, re.I) or [""])[0]
                if re.search(r"\d{1,2}:\d{2}\s*[ap]m", text, re.I)
                else "",
                "header": _headline(row_html),
                # The site marks price-sensitive rows with an icon image.
                "market_sensitive": bool(re.search(r"<img[^>]+", row_html, re.I)),
                "pages": int(pages_match.group(1)) if pages_match else None,
                "url": f"{PDF_URL}?display=pdf&idsId={ids_id}",
                "pdf_file": None,
                "text_file": None,
            }
        )
    return entries


def fetch_index(
    ticker: str, since: dt.date, until: dt.date, session: requests.Session | None = None
) -> list[dict]:
    """Announcements for the ticker released within [since, until]."""
    session = session or make_session()
    entries: list[dict] = []
    for year in range(since.year, until.year + 1):
        resp = get_with_retries(
            session,
            STATS_URL,
            params={
                "by": "asxCode",
                "asxCode": ticker.upper(),
                "timeframe": "Y",
                "year": str(year),
            },
        )
        resp.raise_for_status()
        entries.extend(parse_statistics_page(resp.text))
    in_window = [
        e for e in entries if since.isoformat() <= e["date"] <= until.isoformat()
    ]
    in_window.sort(key=lambda e: (e["date"], e.get("time", "")), reverse=True)
    return in_window


def cross_check_sensitivity(ticker: str, entries: list[dict],
                            session: requests.Session | None = None) -> None:
    """Correct the price-sensitive flag from MarkitDigital where it overlaps.

    The statistics page marks sensitivity with an icon that is easy to
    misdetect; MarkitDigital states it explicitly but only for the most recent
    announcements, so use it to correct what it covers.
    """
    session = session or make_session()
    try:
        resp = get_with_retries(
            session,
            MARKIT_URL.format(ticker=ticker.upper()),
            params={"access_token": MARKIT_TOKEN},
        )
        items = resp.json().get("data", {}).get("items", [])
    except Exception:
        return
    by_key = {}
    for item in items:
        headline = (item.get("headline") or "").strip().lower()
        date = (item.get("date") or "")[:10]
        by_key[(date, headline)] = bool(item.get("isPriceSensitive"))
    for entry in entries:
        key = (entry["date"], entry["header"].strip().lower())
        if key in by_key:
            entry["market_sensitive"] = by_key[key]
            entry["sensitivity_source"] = "markitdigital"


def download_pdfs(entries: list[dict], out_dir, session: requests.Session | None = None) -> None:
    """Download each announcement PDF, updating entries in place."""
    from pathlib import Path

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    session = session or make_session()
    # Visiting the statistics page first establishes the session cookies the
    # PDF endpoint expects.
    for entry in entries:
        slug = re.sub(r"[^a-z0-9]+", "-", entry["header"].lower()).strip("-")[:60]
        target = out_dir / f"{entry['date']}_{entry['id']}_{slug or 'announcement'}.pdf"
        if target.exists():
            entry["pdf_file"] = str(target)
            continue
        resp = get_with_retries(session, entry["url"])
        content = resp.content
        if not content.startswith(b"%PDF"):
            # Terms-acceptance interstitial: follow the PDF link it contains.
            link = re.search(rb'href="([^"]*(?:asxpdf|displayAnnouncement)[^"]*)"', content)
            if link:
                href = html.unescape(link.group(1).decode("utf-8", "replace"))
                if href.startswith("/"):
                    href = "https://www.asx.com.au" + href
                content = get_with_retries(session, href).content
        if not content.startswith(b"%PDF"):
            entry["pdf_file"] = None
            entry["fetch_error"] = f"not a PDF (HTTP {resp.status_code}, {len(content)}b)"
            continue
        target.write_bytes(content)
        entry["pdf_file"] = str(target)
        time.sleep(1.0)  # be polite to ASX
