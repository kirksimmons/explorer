# AGL announcements compliance screen

Self-contained tooling and findings for a compliance risk screen of AGL Energy's
(ASX: AGL) market announcements, 25 May – 25 August 2026. Nothing in this
directory is part of the world-explorer app or its build.

- `REPORT.md` — the findings report for the 25 May – 25 Aug 2026 window
  (compiled from secondary sources; see its Limitations section).
- `scanner/` — the reusable pipeline (fetch → extract → rubric review → report)
  for running the same screen against primary announcement PDFs, for AGL or any
  other ASX ticker. See `scanner/README.md`.

This material is a first-pass risk screen for escalation and verification.
It is not legal advice.
