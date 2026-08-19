import { describe, expect, it } from 'vitest';
import { TRY_LINE_A, TRY_LINE_B } from '../src/constants.ts';
import { attackDir, inTouch, isDeadBall, isTry, tryLineX } from '../src/sim/rules.ts';

describe('rules', () => {
  it('teams attack opposite directions', () => {
    expect(attackDir(0)).toBe(1);
    expect(attackDir(1)).toBe(-1);
    expect(tryLineX(0)).toBe(TRY_LINE_B);
    expect(tryLineX(1)).toBe(TRY_LINE_A);
  });

  it('detects tries at and over the line, both directions', () => {
    expect(isTry({ x: TRY_LINE_B, y: 100 }, 0)).toBe(true);
    expect(isTry({ x: TRY_LINE_B - 1, y: 100 }, 0)).toBe(false);
    expect(isTry({ x: TRY_LINE_A, y: 100 }, 1)).toBe(true);
    expect(isTry({ x: TRY_LINE_A + 1, y: 100 }, 1)).toBe(false);
  });

  it('detects touch and dead ball', () => {
    expect(inTouch({ x: 500, y: 0 })).toBe(true);
    expect(inTouch({ x: 500, y: 220 })).toBe(true);
    expect(inTouch({ x: 500, y: 110 })).toBe(false);
    expect(isDeadBall(50)).toBe(true);
    expect(isDeadBall(950)).toBe(true);
    expect(isDeadBall(500)).toBe(false);
  });
});
