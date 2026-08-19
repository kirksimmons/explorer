import { describe, expect, it } from 'vitest';
import { createMatch, setupKickoff } from '../src/sim/match.ts';
import { attackDir } from '../src/sim/rules.ts';
import { selectPassTarget } from '../src/sim/passing.ts';
import type { MatchState } from '../src/types.ts';

function stateWithCarrier(team: 0 | 1): MatchState {
  const s = createMatch(1);
  setupKickoff(s, team);
  return s;
}

describe('passing', () => {
  for (const team of [0, 1] as const) {
    it(`pass targets are always level-or-behind (team ${team})`, () => {
      const s = stateWithCarrier(team);
      const carrier = s.players[s.ball.carrier!];
      const dir = attackDir(team);
      // Scatter teammates around the carrier, some ahead, some behind.
      const mates = s.players.filter((p) => p.team === team && p.id !== carrier.id);
      mates.forEach((p, i) => {
        p.pos = {
          x: carrier.pos.x + dir * (i % 2 === 0 ? 30 : -30),
          y: carrier.pos.y + (i - 3) * 10,
        };
      });
      // Nudge everyone a few times; at least one mate stays behind throughout.
      for (let i = 0; i < 4; i++) {
        const target = selectPassTarget(s);
        expect(target).not.toBeNull();
        const t = s.players[target!];
        expect(dir * (t.pos.x - carrier.pos.x)).toBeLessThanOrEqual(2);
        mates.forEach((p) => (p.pos.x += dir * 5));
      }
    });
  }

  it('returns null when every teammate is ahead of the carrier', () => {
    const s = stateWithCarrier(0);
    const carrier = s.players[s.ball.carrier!];
    for (const p of s.players) {
      if (p.team === 0 && p.id !== carrier.id) {
        p.pos = { x: carrier.pos.x + 40, y: p.pos.y };
      }
    }
    expect(selectPassTarget(s)).toBeNull();
  });
});
