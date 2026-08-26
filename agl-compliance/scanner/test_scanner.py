"""Offline tests for the scanner pipeline (no network, no API key needed).

Run with: python3 test_scanner.py
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).parent


def test_fixture_pdf_extracts() -> None:
    import extract

    text = extract.extract_pdf_text(HERE / "fixtures" / "2026-08-12_fy26-results-example.pdf")
    assert "Underlying EBITDA of $2,100 million" in text, text
    assert "Statutory net loss" in text


def test_verdict_parsing() -> None:
    import rubric

    good = rubric._parse_verdict('```json\n{"rating": "AMBER", "findings": []}\n```')
    assert good["rating"] == "AMBER"
    bad = rubric._parse_verdict("not json at all")
    assert bad["rating"] == "AMBER" and bad.get("parse_error")


def test_dry_run_pipeline() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "out"
        result = subprocess.run(
            [
                sys.executable,
                str(HERE / "scan.py"),
                "all",
                "--dry-run",
                "--no-api",
                "--out",
                str(out),
            ],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, result.stderr
        register = json.loads((out / "register.json").read_text())
        assert register[0]["text_file"], register
        assert (out / "review_pack" / "RUBRIC.md").exists()
        # Simulate a manual verdict from the review pack, then rebuild the report.
        text_stem = Path(register[0]["text_file"]).stem
        verdict = {
            "rating": "AMBER",
            "summary": "Fixture verdict.",
            "findings": [
                {
                    "category": "C",
                    "severity": "AMBER",
                    "issue": "Underlying EBITDA led while statutory loss trailed.",
                    "evidence": "Underlying EBITDA of $2,100 million, up 2%",
                    "why_it_matters": "ASIC RG 230 prominence expectations.",
                    "verify": "Check statutory figures' prominence in the full release.",
                }
            ],
        }
        verdict_path = out / "review_pack" / "texts" / f"{text_stem}.verdict.json"
        verdict_path.write_text(json.dumps(verdict))
        result = subprocess.run(
            [sys.executable, str(HERE / "scan.py"), "report", "--out", str(out)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, result.stderr
        report_text = (out / "REPORT.md").read_text()
        assert "1 amber" in report_text, report_text
        assert "Underlying EBITDA led" in report_text


def test_statistics_page_parsing() -> None:
    """Parse the row shape the ASX statistics page actually returns."""
    import asx_web

    page = """
    <tr><td>24/08/2026</td><td>6:23 pm</td><td></td>
      <td><a href="/asx/v2/statistics/displayAnnouncement.do?display=pdf&amp;idsId=03129199">
      Substantial holder notice lodged by Galipea Partnership</a></td>
      <td>2 pages</td></tr>
    <tr><td>12/08/2026</td><td>9:01 am</td>
      <td><img src="/images/pricesens.gif" alt="price sensitive"></td>
      <td><a href="/asx/v2/statistics/displayAnnouncement.do?display=pdf&amp;idsId=03119001">
      FY26 Results Announcement and FY27 Guidance</a></td>
      <td>18 pages</td></tr>
    <tr><td>nothing parseable here</td></tr>
    """
    entries = asx_web.parse_statistics_page(page)
    assert len(entries) == 2, entries
    first, second = entries
    assert first["date"] == "2026-08-24"
    assert first["header"].startswith("Substantial holder notice"), first["header"]
    assert first["pages"] == 2 and first["market_sensitive"] is False
    assert first["url"].endswith("idsId=03129199")
    assert second["market_sensitive"] is True, second
    assert second["header"] == "FY26 Results Announcement and FY27 Guidance"


def test_register_merge_is_incremental() -> None:
    """A second run must not re-process announcements already recorded."""
    import fetch as fetch_mod

    existing = [{"ticker": "AGL", "id": "1", "date": "2026-08-12", "header": "old"}]
    fresh = [
        {"ticker": "AGL", "id": "1", "date": "2026-08-12", "header": "old"},
        {"ticker": "AGL", "id": "2", "date": "2026-08-14", "header": "new"},
        {"ticker": "ORG", "id": "1", "date": "2026-08-13", "header": "other company"},
    ]
    merged, new_entries = fetch_mod.merge_register(existing, fresh)
    assert len(merged) == 3, merged
    assert [e["id"] for e in new_entries] == ["2", "1"], new_entries
    assert {e["ticker"] for e in new_entries} == {"AGL", "ORG"}
    # Same id on a different ticker is a distinct announcement.
    assert [e["date"] for e in merged] == ["2026-08-14", "2026-08-13", "2026-08-12"]
    # Re-running with nothing new yields no work.
    _, none_new = fetch_mod.merge_register(merged, fresh)
    assert none_new == [], none_new


if __name__ == "__main__":
    failures = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"PASS {name}")
            except AssertionError as exc:
                failures += 1
                print(f"FAIL {name}: {exc}")
    sys.exit(1 if failures else 0)
