import {
  CONVERSION_ZONE,
  DROPGOAL_ZONE,
  DROP_GOAL_RANGE,
  FIELD_H,
  KICK_SPEED,
  TACKLES_PER_SET,
} from '../constants.ts';
import type { MatchState } from '../types.ts';
import { rand } from './rng.ts';
import { attackDir, dist, postsPos } from './rules.ts';

// Last-tackle punt: high, downfield, slightly wobbly.
export function startPunt(s: MatchState): void {
  const carrierId = s.ball.carrier;
  if (carrierId === null) return;
  const carrier = s.players[carrierId];
  const dir = attackDir(carrier.team);
  s.ball.carrier = null;
  s.ball.inFlight = 'kick';
  s.ball.vel.x = dir * KICK_SPEED * (0.8 + rand(s) * 0.2);
  s.ball.vel.y = (FIELD_H / 2 - carrier.pos.y) * 0.3 + (rand(s) - 0.5) * 40;
  s.ball.z = 1;
  s.ball.vz = 160;
  s.events.push({ type: 'kick' });
}

// Timing bar: success when stopped within the sweet zone around center.
export function meterSuccess(t: number, zone: number): boolean {
  return Math.abs(t - 0.5) <= zone;
}

// Conversion sweet zone narrows the wider the try was scored.
export function conversionZone(tryY: number): number {
  const off = Math.abs(tryY - FIELD_H / 2) / (FIELD_H / 2);
  return CONVERSION_ZONE * (1 - 0.5 * off);
}

export function dropGoalZone(): number {
  return DROPGOAL_ZONE;
}

// KICK is offered on the last tackle, or from tackle 3 inside drop-goal range.
export function kickAvailable(s: MatchState): 'punt' | 'dropGoal' | null {
  const carrierId = s.ball.carrier;
  if (carrierId === null) return null;
  const carrier = s.players[carrierId];
  if (
    s.tackleCount >= 3 &&
    dist(carrier.pos, postsPos(carrier.team)) <= DROP_GOAL_RANGE
  ) {
    return 'dropGoal';
  }
  if (s.tackleCount === TACKLES_PER_SET - 1) return 'punt';
  return null;
}
