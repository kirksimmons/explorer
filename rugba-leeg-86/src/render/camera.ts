import { VIEW_H, VIEW_W } from '../constants.ts';
import type { Vec2 } from '../types.ts';

// Diagonal iso camera, 16-bit EA style. The sim stays 2D top-down; this is a
// pure view transform. Rotation + vertical squash is affine, so the whole
// pre-rendered field blits with one setTransform.
export const ISO_THETA = (20 * Math.PI) / 180;
export const ISO_SQUASH = 0.55;

const COS = Math.cos(ISO_THETA);
const SIN = Math.sin(ISO_THETA);

// World axes on screen: x-axis heads down-right, y-axis down-left.
export const AX = { x: COS, y: SIN * ISO_SQUASH };
export const AY = { x: -SIN, y: COS * ISO_SQUASH };

export interface IsoCam {
  x: number; // world point that sits at screen center
  y: number;
}

export function project(wx: number, wy: number, cam: IsoCam): Vec2 {
  const dx = wx - cam.x;
  const dy = wy - cam.y;
  return {
    x: dx * AX.x + dy * AY.x + VIEW_W / 2,
    y: dx * AX.y + dy * AY.y + VIEW_H / 2,
  };
}

// Screen-relative stick direction -> world direction (inverse basis, then
// normalized). Lets "up on the stick" mean "up the screen" under the iso view.
export function screenDirToWorld(sx: number, sy: number): Vec2 {
  const det = AX.x * AY.y - AY.x * AX.y;
  const wx = (sx * AY.y - sy * AY.x) / det;
  const wy = (-sx * AX.y + sy * AX.x) / det;
  const m = Math.hypot(wx, wy);
  return m > 0.001 ? { x: wx / m, y: wy / m } : { x: 0, y: 0 };
}

// setTransform args mapping field-canvas pixels onto the screen. The texture's
// (0,0) sits at world (-left, -top) — it carries margin on every side so the
// rotated blit still covers the corners of the viewport.
export function fieldTransform(
  cam: IsoCam,
  left: number,
  top: number,
): [number, number, number, number, number, number] {
  const o = project(-left, -top, cam);
  return [AX.x, AX.y, AY.x, AY.y, o.x, o.y];
}
