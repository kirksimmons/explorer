"""Assemble a markdown findings report from the register and verdicts."""

from __future__ import annotations

import json
from pathlib import Path

RATING_ORDER = {"RED": 0, "AMBER": 1, "GREEN": 2}


def _load_verdict(entry: dict) -> dict | None:
    verdict_file = entry.get("verdict_file")
    if not verdict_file or not Path(verdict_file).exists():
        return None
    return json.loads(Path(verdict_file).read_text(encoding="utf-8"))


def build_report(entries: list[dict], ticker: str, since: str, until: str) -> str:
    reviewed = [(e, _load_verdict(e)) for e in entries]
    rated = [(e, v) for e, v in reviewed if v]
    rated.sort(key=lambda ev: (RATING_ORDER.get(ev[1].get("rating", "AMBER"), 1), ev[0]["date"]))

    counts = {"RED": 0, "AMBER": 0, "GREEN": 0}
    for _, v in rated:
        counts[v.get("rating", "AMBER")] = counts.get(v.get("rating", "AMBER"), 0) + 1

    lines = [
        f"# {ticker} announcement compliance screen",
        "",
        f"Window: {since} to {until}. Announcements reviewed: {len(rated)} of {len(entries)}.",
        f"Ratings: {counts['RED']} red, {counts['AMBER']} amber, {counts['GREEN']} green.",
        "",
        "This is an automated first-pass risk screen, not legal advice. Every red or",
        "amber item needs verification against the primary document and by counsel.",
        "",
        "## Register",
        "",
        "| Date | Announcement | Sensitive | Rating |",
        "|---|---|---|---|",
    ]
    for entry in sorted(entries, key=lambda e: e["date"], reverse=True):
        verdict = _load_verdict(entry)
        rating = verdict.get("rating", "-") if verdict else "not reviewed"
        sensitive = "yes" if entry.get("market_sensitive") else "no"
        lines.append(f"| {entry['date']} | {entry['header']} | {sensitive} | {rating} |")

    lines += ["", "## Findings", ""]
    for entry, verdict in rated:
        if verdict.get("rating") == "GREEN" and not verdict.get("findings"):
            continue
        lines.append(f"### {entry['date']} — {entry['header']} ({verdict.get('rating')})")
        lines.append("")
        if verdict.get("summary"):
            lines.append(verdict["summary"])
            lines.append("")
        for finding in verdict.get("findings", []):
            lines.append(
                f"- **[{finding.get('severity')}/{finding.get('category')}] "
                f"{finding.get('issue')}**"
            )
            if finding.get("evidence"):
                lines.append(f"  - Evidence: {finding['evidence']}")
            if finding.get("why_it_matters"):
                lines.append(f"  - Why it matters: {finding['why_it_matters']}")
            if finding.get("verify"):
                lines.append(f"  - Verify: {finding['verify']}")
        lines.append("")
    return "\n".join(lines) + "\n"


def write_report(entries: list[dict], out_dir: Path, ticker: str, since: str, until: str) -> Path:
    target = out_dir / "REPORT.md"
    target.write_text(build_report(entries, ticker, since, until), encoding="utf-8")
    return target
