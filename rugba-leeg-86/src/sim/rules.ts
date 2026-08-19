import {
  DEAD_A,
  DEAD_B,
  FIELD_H,
  TRY_LINE_A,
  TRY_LINE_B,
} from '../constants.ts';
import type { Vec2 } from '../types.ts';

// Team 0 attacks +x (scores at TRY_LINE_B); team 1 attacks -x.
export function attackDir(team: 0 | 1): 1 | -1 {
  return team === 0 ? 1 : -1;
}

export function tryLineX(team: 0 | 1): number {
  return team === 0 ? TRY_LINE_B : TRY_LINE_A;
}

export function isTry(pos: Vec2, team: 0 | 1): boolean {
  return attackDir(team) * (pos.x - tryLineX(team)) >= 0;
}

export function inTouch(pos: Vec2): boolean {
  return pos.y <= 0 || pos.y >= FIELD_H;
}

export function isDeadBall(x: number): boolean {
  return x < DEAD_A || x > DEAD_B;
}

export function postsPos(team: 0 | 1): Vec2 {
  return { x: tryLineX(team), y: FIELD_H / 2 };
}

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clampToField(pos: Vec2): void {
  pos.x = Math.max(2, Math.min(998, pos.x));
  pos.y = Math.max(0, Math.min(FIELD_H, pos.y));
}
