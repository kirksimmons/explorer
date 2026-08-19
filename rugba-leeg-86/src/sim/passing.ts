import { PASS_BEHIND_TOLERANCE, PASS_MAX_DIST } from '../constants.ts';
import type { MatchState } from '../types.ts';
import { attackDir, dist } from './rules.ts';

// Backward-pass-only by design: only teammates level-or-behind the carrier
// are ever candidates, so a forward pass is unrepresentable. Nearest wins.
export function selectPassTarget(s: MatchState): number | null {
  const carrierId = s.ball.carrier;
  if (carrierId === null) return null;
  const carrier = s.players[carrierId];
  const dir = attackDir(carrier.team);
  let best: number | null = null;
  let bestDist = Infinity;
  for (const p of s.players) {
    if (p.team !== carrier.team || p.id === carrierId || p.state !== 'run') continue;
    if (dir * (p.pos.x - carrier.pos.x) > PASS_BEHIND_TOLERANCE) continue;
    const d = dist(p.pos, carrier.pos);
    if (d > PASS_MAX_DIST || d >= bestDist) continue;
    best = p.id;
    bestDist = d;
  }
  return best;
}
