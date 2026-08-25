#!/usr/bin/env python3
"""Regenerate the fixture PDF used by --dry-run and the tests.

Hand-assembles a minimal one-page PDF (no dependencies) whose text pypdf can
extract, standing in for a real ASX announcement.
"""

from pathlib import Path

LINES = [
    "EXAMPLE ENERGY LIMITED (ASX: EXE)",
    "ASX Announcement - 12 August 2026",
    "FY26 Results: Underlying EBITDA of $2,100 million, up 2%",
    "Statutory net loss after tax of $95 million.",
    "The Board declared a final dividend of 26 cents per share.",
    "We expect strong growth and remain on track for net zero.",
]


def build_pdf() -> bytes:
    content_ops = ["BT", "/F1 12 Tf", "72 760 Td", "14 TL"]
    for line in LINES:
        escaped = line.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
        content_ops.append(f"({escaped}) Tj T*")
    content_ops.append("ET")
    stream = "\n".join(content_ops).encode("latin-1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length %d >>\nstream\n%s\nendstream" % (len(stream), stream),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for num, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % num + body + b"\nendobj\n"
    xref_pos = len(out)
    out += b"xref\n0 %d\n" % (len(objects) + 1)
    out += b"0000000000 65535 f \n"
    for off in offsets:
        out += b"%010d 00000 n \n" % off
    out += (
        b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n"
        % (len(objects) + 1, xref_pos)
    )
    return bytes(out)


if __name__ == "__main__":
    target = Path(__file__).parent / "2026-08-12_fy26-results-example.pdf"
    target.write_bytes(build_pdf())
    print(f"wrote {target}")
