# RUGBA LEEG 86

Retro arcade 7-a-side rugby league. **Bargo Beefcakes** vs **Guildford
Grifters**. NBA Jam energy, Pro Jank Football charm. One self-contained
`dist/index.html` — no accounts, no network, works over `file://`, mobile
landscape first.

## Play

- **Left thumb**: virtual stick — run.
- **PASS**: offload to a support runner (targets are always level-or-behind —
  you physically cannot throw a forward pass).
- **SPR**: sprint (drains turbo). Held near contact = **BUMP** — win the fend
  and the defender ragdolls. Three big hits or tries without being tackled:
  **HE'S ON FIRE!**
- **KICK**: appears on the last tackle (downfield punt) or from tackle 3 in
  drop-goal range. Conversions and drop goals are a tap-the-timing-bar
  minigame.
- Keyboard: arrows/WASD, Z pass, X sprint, C kick, Enter start, M mute,
  V toggle CRT scanlines.

Rules, arcade-sized: 6-tackle sets, play-the-ball, tries 4 / conversion 2 /
drop goal 1, knock-ons and touch = handover, two 2:30 halves. No scrums, no
penalties — everything messy is just a handover.

## Develop

```bash
npm install
npm run dev      # hot reload
npm test         # sim unit tests (pure logic, deterministic seeded RNG)
npm run verify   # tests + build + Playwright e2e vs built file + size gate
```

The sim (`src/sim/`) is DOM-free and deterministic (seeded PRNG in state,
fixed timestep) — same seed + same inputs = identical match. That's the v2
multiplayer seam: remote players are just another `InputState` source.

## Deploy

Cloudflare Workers, assets-only (`wrangler.jsonc`). CI deploys on push to
`main` via `.github/workflows/deploy-rugba.yml` — needs repo secrets
`CLOUDFLARE_API_TOKEN` (Workers Scripts:Edit) and `CLOUDFLARE_ACCOUNT_ID`.
Manual: `npm run deploy`.
