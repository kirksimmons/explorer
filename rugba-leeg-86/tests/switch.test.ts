import { describe, expect, it } from 'vitest';
import { HUMAN_TEAM } from '../src/constants.ts';
import { createMatch, setupKickoff } from '../src/sim/match.ts';
import { pickControlled } from '../src/sim/switch.ts';

describe('auto-switch', () => {
  it('controls the carrier when the human team attacks', () => {
    const s = createMatch(1);
    setupKickoff(s, HUMAN_TEAM);
    expect(pickControlled(s)).toBe(s.ball.carrier);
  });

  it('controls the nearest human player when defending', () => {
    const s = createMatch(1);
    setupKickoff(s, HUMAN_TEAM === 0 ? 1 : 0);
    const picked = pickControlled(s);
    const p = s.players[picked];
    expect(p.team).toBe(HUMAN_TEAM);
    const myDist = Math.hypot(p.pos.x - s.ball.pos.x, p.pos.y - s.ball.pos.y);
    for (const q of s.players) {
      if (q.team !== HUMAN_TEAM) continue;
      const d = Math.hypot(q.pos.x - s.ball.pos.x, q.pos.y - s.ball.pos.y);
      expect(myDist).toBeLessThanOrEqual(d + 0.001);
    }
  });
});
