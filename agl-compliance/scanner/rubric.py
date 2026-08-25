"""Run the compliance rubric over extracted announcement text.

Two modes:
- With Anthropic credentials (ANTHROPIC_API_KEY or an `ant auth login` profile)
  and the `anthropic` package installed: each announcement is reviewed by Claude
  against the rubric and a structured JSON verdict is stored per announcement.
- Without credentials: a "review pack" is written instead — the rubric prompt
  plus every announcement's text, ready to paste into Claude Code or claude.ai.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"
DEFAULT_MODEL = "claude-opus-5"

# A single announcement can be long (annual reports run to hundreds of pages);
# beyond this we review the first chunk and say so in the verdict rather than
# silently truncating.
MAX_REVIEW_CHARS = 300_000


def load_rubric() -> str:
    return (PROMPTS_DIR / "rubric_system.md").read_text(encoding="utf-8")


def _review_request_text(entry: dict, text: str) -> tuple[str, bool]:
    truncated = len(text) > MAX_REVIEW_CHARS
    if truncated:
        text = text[:MAX_REVIEW_CHARS]
    body = (
        f"Announcement title: {entry['header']}\n"
        f"Lodgement date: {entry['date']}\n"
        f"Marked market-sensitive by ASX: {entry.get('market_sensitive')}\n"
    )
    if truncated:
        body += (
            "NOTE: document truncated for review — only the beginning is shown; "
            "state this limitation in your summary.\n"
        )
    body += f"\n<announcement_text>\n{text}\n</announcement_text>"
    return body, truncated


def _parse_verdict(raw: str) -> dict:
    """Parse the model's JSON verdict, tolerating a stray code fence."""
    candidate = raw.strip()
    fence = re.search(r"\{.*\}", candidate, flags=re.DOTALL)
    if fence:
        candidate = fence.group(0)
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return {"rating": "AMBER", "parse_error": True, "raw": raw}


def review_with_claude(entries: list[dict], out_dir: Path, model: str = DEFAULT_MODEL) -> None:
    import anthropic

    client = anthropic.Anthropic()
    out_dir.mkdir(parents=True, exist_ok=True)
    rubric = load_rubric()
    for entry in entries:
        text_file = entry.get("text_file")
        if not text_file:
            continue
        verdict_file = out_dir / (Path(text_file).stem + ".verdict.json")
        if verdict_file.exists():
            entry["verdict_file"] = str(verdict_file)
            continue
        body, _ = _review_request_text(entry, Path(text_file).read_text(encoding="utf-8"))
        with client.messages.stream(
            model=model,
            max_tokens=16000,
            system=[{"type": "text", "text": rubric, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": body}],
        ) as stream:
            response = stream.get_final_message()
        if response.stop_reason == "refusal":
            verdict = {"rating": "AMBER", "refused": True}
        else:
            raw = "".join(b.text for b in response.content if b.type == "text")
            verdict = _parse_verdict(raw)
        verdict.setdefault("announcement", entry["header"])
        verdict.setdefault("date", entry["date"])
        verdict_file.write_text(json.dumps(verdict, indent=2), encoding="utf-8")
        entry["verdict_file"] = str(verdict_file)


def write_review_pack(entries: list[dict], out_dir: Path) -> Path:
    """No-API-key fallback: bundle rubric + texts for a manual Claude session."""
    pack = out_dir / "review_pack"
    pack.mkdir(parents=True, exist_ok=True)
    instructions = (
        "# Review pack\n\n"
        "No Anthropic credentials were available, so run this review manually:\n"
        "open a Claude Code session in this directory and ask it to review every\n"
        "file in texts/ against RUBRIC.md, saving each JSON verdict next to the\n"
        "text as <name>.verdict.json, then run `python scan.py report`.\n"
    )
    (pack / "README.md").write_text(instructions, encoding="utf-8")
    (pack / "RUBRIC.md").write_text(load_rubric(), encoding="utf-8")
    texts = pack / "texts"
    texts.mkdir(exist_ok=True)
    for entry in entries:
        if entry.get("text_file"):
            src = Path(entry["text_file"])
            (texts / src.name).write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
    return pack


def have_claude_credentials() -> bool:
    import os

    if os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"):
        return True
    return (Path.home() / ".config" / "anthropic").exists()
