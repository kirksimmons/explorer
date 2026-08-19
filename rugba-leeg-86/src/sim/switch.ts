import { HUMAN_TEAM } from '../constants.ts';
import type { MatchState } from '../types.ts';
import { dist } from './rules.ts';

// In attack the human is the carrier; in defense, the human-team player
// nearest the ball. Called only on possession changes to avoid flicker.
export function pickControlled(s: MatchState): number {
  const carrierId = s.ball.carrier;
  if (carrierId !== null && s.players[carrierId].team === HUMAN_TEAM) {
    return carrierId;
  }
  let best = s.controlledId;
  let bestDist = Infinity;
  for (const p of s.players) {
    if (p.team !== HUMAN_TEAM || p.state !== 'run') continue;
    const d = dist(p.pos, s.ball.pos);
    if (d < bestDist) {
      best = p.id;
      bestDist = d;
    }
  }
  return best;
}
