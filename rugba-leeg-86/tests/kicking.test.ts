import { describe, expect, it } from 'vitest';
import { CONVERSION_ZONE, FIELD_H, TACKLES_PER_SET } from '../src/constants.ts';
import { conversionZone, kickAvailable, meterSuccess } from '../src/sim/kicking.ts';
import { createMatch, setupKickoff } from '../src/sim/match.ts';
import { postsPos } from '../src/sim/rules.ts';

describe('kicking', () => {
  it('meter succeeds inside the zone, fails outside', () => {
    expect(meterSuccess(0.5, 0.18)).toBe(true);
    expect(meterSuccess(0.5 + 0.18, 0.18)).toBe(true);
    expect(meterSuccess(0.5 + 0.19, 0.18)).toBe(false);
    expect(meterSuccess(0.1, 0.18)).toBe(false);
  });

  it('conversion zone narrows for wide tries', () => {
    const center = conversionZone(FIELD_H / 2);
    const wide = conversionZone(0);
    expect(center).toBe(CONVERSION_ZONE);
    expect(wide).toBeLessThan(center);
    expect(wide).toBeGreaterThan(0);
  });

  it('offers the punt on the last tackle only', () => {
    const s = createMatch(1);
    setupKickoff(s, 0);
    s.phase = 'openPlay';
    s.tackleCount = 0;
    expect(kickAvailable(s)).toBeNull();
    s.tackleCount = TACKLES_PER_SET - 1;
    expect(kickAvailable(s)).toBe('punt');
  });

  it('offers the drop goal from tackle 3 in range of the posts', () => {
    const s = createMatch(1);
    setupKickoff(s, 0);
    s.phase = 'openPlay';
    s.tackleCount = 3;
    const carrier = s.players[s.ball.carrier!];
    carrier.pos = { ...postsPos(0) };
    carrier.pos.x -= 50;
    expect(kickAvailable(s)).toBe('dropGoal');
    s.tackleCount = 2;
    expect(kickAvailable(s)).toBeNull();
  });
});
