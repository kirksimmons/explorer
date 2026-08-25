"""Extract text from downloaded announcement PDFs using pypdf."""

from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader


def extract_pdf_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        pages.append(f"--- page {i} ---\n{text}")
    return "\n\n".join(pages)


def extract_all(entries: list[dict], out_dir: Path) -> None:
    """Extract text for every entry with a pdf_file, updating entries in place.

    Announcements that yield almost no text are usually scanned images and are
    flagged with needs_ocr so the review step can call that out rather than
    silently reviewing an empty document.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    for entry in entries:
        pdf_file = entry.get("pdf_file")
        if not pdf_file:
            continue
        pdf_path = Path(pdf_file)
        text = extract_pdf_text(pdf_path)
        target = out_dir / (pdf_path.stem + ".txt")
        target.write_text(text, encoding="utf-8")
        entry["text_file"] = str(target)
        entry["text_chars"] = len(text)
        entry["needs_ocr"] = len(text.replace("--- page", "").strip()) < 200
