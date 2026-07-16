/** Pure view-box math for the map's pan/zoom. All units are projected px. */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const WORLD_W = 1000;
export const WORLD_H = 520;
export const WORLD: Box = { x: 0, y: 0, w: WORLD_W, h: WORLD_H };
const ASPECT = WORLD_W / WORLD_H;

/** Max zoom-in: the view is never narrower than this many px. */
export const MIN_VIEW_W = 24;

export type BBox = [number, number, number, number];

/**
 * Turn a shape/region bounding box into a view box: padded, aspect-corrected
 * to the world aspect, zoom-clamped, and kept roughly on the map.
 */
export function boxFromBBox(bbox: BBox, padFraction = 0.25): Box {
  const [x0, y0, x1, y1] = bbox;
  let w = Math.max(x1 - x0, (y1 - y0) * ASPECT);
  w = w * (1 + padFraction * 2);
  w = Math.min(Math.max(w, MIN_VIEW_W), WORLD_W);
  const h = w / ASPECT;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  let x = cx - w / 2;
  let y = cy - h / 2;
  // keep the view on the map (allow a little ocean overshoot on Y for poles)
  x = Math.min(Math.max(x, 0), WORLD_W - w);
  y = Math.min(Math.max(y, -h * 0.1), WORLD_H - h * 0.9);
  return { x, y, w, h };
}

/** Zoom scale factor of a view box relative to the whole world. */
export function scaleOf(box: Box): number {
  return WORLD_W / box.w;
}

/**
 * CSS transform mapping world coordinates into the viewport for a given view
 * box (applied to a <g> so it can animate with a CSS transition).
 */
export function transformFor(box: Box): string {
  const k = scaleOf(box);
  return `scale(${k}) translate(${-box.x}px, ${-box.y}px)`;
}

export function boxesEqual(a: Box, b: Box): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}
