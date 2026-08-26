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
SENSITIVE_RE = re.compile(
    r"<img[^>]*(?:src|alt|title)=\"[^\"]*(?:sensitiv|exclam|asterisk|pricesens)[^\"]*\"",
    re.I,
)


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


# The headline shares its cell with the release date/time and the document's
# page count and size, so strip those off whatever text we recover.
NOISE_RES = [
    re.compile(r"^\s*\d{2}/\d{2}/\d{4}\b"),
    re.compile(r"^\s*\d{1,2}:\d{2}\s*[ap]\.?m\.?\b", re.I),
    re.compile(r"\b\d+\s*pages?\b", re.I),
    re.compile(r"\b[\d.]+\s*(?:KB|MB|GB|bytes)\b", re.I),
]


def _clean_headline(text: str) -> str:
    text = " ".join(text.split())
    for _ in range(4):  # date/time lead, then size/page trailers
        before = text
        for noise in NOISE_RES:
            text = noise.sub(" ", text)
        text = " ".join(text.split())
        if text == before:
            break
    return text.strip(" -|")


def _headline(row_html: str) -> str:
    """The headline is the announcement link's text, minus row furniture."""
    candidates = [
        _clean_headline(_row_text(m.group(1)))
        for m in re.finditer(r"<a[^>]*>(.*?)</a>", row_html, re.S | re.I)
    ]
    candidates = [c for c in candidates if len(c) > 12]
    if candidates:
        return max(candidates, key=len)[:250]
    return _clean_headline(_row_text(row_html))[:250]


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
                # Only the price-sensitive marker counts - every row carries
                # format icons, so any-image matching over-flags.
                "market_sensitive": bool(SENSITIVE_RE.search(row_html)),
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


def accept_terms(session: requests.Session, page_url: str, page_html: str) -> bytes | None:
    """Clear ASX's terms-acceptance interstitial and return the PDF bytes.

    The interstitial is a form the reader submits to agree to ASX's terms of
    use; submitting it with its own hidden fields returns the document. Falls
    back to any direct document link on the page.
    """
    from urllib.parse import urljoin

    form = re.search(r"<form[^>]*>(.*?)</form>", page_html, re.S | re.I)
    if form:
        head = re.match(r"<form[^>]*>", form.group(0), re.I).group(0)
        action = re.search(r'action="([^"]*)"', head, re.I)
        target = urljoin(page_url, html.unescape(action.group(1))) if action else page_url
        data = {}
        for tag in re.findall(r"<input[^>]*>", form.group(1), re.I):
            name = re.search(r'name="([^"]+)"', tag, re.I)
            if not name:
                continue
            value = re.search(r'value="([^"]*)"', tag, re.I)
            data[name.group(1)] = html.unescape(value.group(1)) if value else ""
        for attempt in (
            lambda: session.post(target, data=data, timeout=90),
            lambda: session.get(target, params=data, timeout=90),
        ):
            try:
                got = attempt()
                if got.content.startswith(b"%PDF"):
                    return got.content
            except requests.RequestException:
                continue

    link = re.search(r'href="([^"]*(?:asxpdf|\.pdf)[^"]*)"', page_html, re.I)
    if link:
        href = urljoin(page_url, html.unescape(link.group(1)))
        got = get_with_retries(session, href)
        if got.content.startswith(b"%PDF"):
            return got.content
    return None


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
            content = accept_terms(session, entry["url"], resp.text) or content
        if not content.startswith(b"%PDF"):
            entry["pdf_file"] = None
            entry["fetch_error"] = f"not a PDF (HTTP {resp.status_code}, {len(content)}b)"
            continue
        target.write_bytes(content)
        entry["pdf_file"] = str(target)
        time.sleep(1.0)  # be polite to ASX
