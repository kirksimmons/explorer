# 🌍 World Explorer

An offline geography learning game for kids (aimed at ages 7–9). Tap any of the
world's ~195 countries to discover its flag, capital, languages, a favourite
food, fun facts, and a "Long ago…" card with history and the dinosaurs that once
roamed the region. Play three quiz games, earn stars and badges, and fill up a
passport of country stickers.

The whole game builds into **one self-contained `index.html`** — no internet
needed to play. Double-click it, or open it on a tablet browser.

## Features

- **🗺️ Explore** — a colourful world map. Tap a country for its flag, capital,
  spoken languages, a favourite food, three fun facts, and a "Long ago…" card
  (history + a real prehistoric creature from that region). Zoom by continent,
  plus dedicated "Tiny Europe", "Caribbean", and "Pacific" views, and an A–Z
  search so even the smallest countries are always reachable.
- **🎮 Games** — *Find the Country* (tap it on the map), *Match the Flag*, and
  *Guess the Food*. Three difficulty tiers (Explorer → Adventurer → Tricky) that
  unlock as you collect stars. Wrong answers teach gently — no timers, no lives,
  no "game over".
- **📔 Passport** — a sticker book that fills as you visit countries, with
  per-continent counts and a shelf of ~17 badges to earn.

## Running it

```bash
npm install
npm run build      # produces dist/index.html (one file, ~3 MB)
```

Then just open `dist/index.html` in any browser (works over `file://`), or copy
that single file to a phone/tablet.

For development with hot reload:

```bash
npm run dev
```

## Testing

```bash
npm test           # unit tests (game logic + data validation for all 197 countries)
npm run verify     # unit tests + build + end-to-end Playwright tests + size gate
```

The Playwright suite runs against the **built** `dist/index.html` over `file://`
(desktop + tablet), and asserts it boots with zero network requests.

## How it's built

- **Vite + React + TypeScript**, bundled with `vite-plugin-singlefile` so all
  JS, CSS, map data, and flags inline into one HTML file. There are no runtime
  network requests, `fetch`, or dynamic imports.
- **Map:** Natural Earth country shapes (`world-atlas`) are pre-projected at
  build time (`scripts/build-map-data.mjs`) into plain SVG paths, so the runtime
  ships no geo libraries.
- **Flags:** SVGs from `flag-icons`, inlined at build (`scripts/build-flags.mjs`)
  — flag *emoji* don't render on some platforms, so real SVGs are bundled.
- **Content:** hand-authored per-continent data in `src/data/countries/`,
  guarded by `tests/data-validation.test.ts` (capitals are cross-checked against
  an independent reference table).
- **Progress** is saved in `localStorage` with a safe in-memory fallback.

See `docs/content-style-guide.md` for the kid-friendly writing rules.

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds the game and publishes
`dist/` to GitHub Pages on every push. Because the whole app is a single file
with no external asset URLs, it works at any path (including a project subpath),
so no `base` configuration is needed.

To turn it on: in the repository's **Settings → Pages**, set the source to
**GitHub Actions** (the workflow also attempts to enable this automatically).
The site then publishes to `https://<owner>.github.io/<repo>/`.

## Notes on the content

Facts are written to be fun and kid-appropriate — celebrating nature, food,
music, inventions, and ancient wonders, with no war or upsetting content. The
"favourite food" wording is intentional (rather than "national dish") to avoid
contested claims. Dinosaur/prehistoric-creature entries use real, regionally
appropriate genera. It's a learning toy, not an encyclopaedia — corrections are
welcome.
