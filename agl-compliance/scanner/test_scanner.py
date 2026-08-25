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
