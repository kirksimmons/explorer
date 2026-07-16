import { describe, it, expect } from 'vitest';
import { boxFromBBox, scaleOf, transformFor, WORLD, WORLD_W, WORLD_H, MIN_VIEW_W } from '../src/map/viewbox';

describe('boxFromBBox', () => {
  it('preserves the world aspect ratio', () => {
    const box = boxFromBBox([100, 100, 300, 150]);
    expect(box.w / box.h).toBeCloseTo(WORLD_W / WORLD_H, 5);
  });

  it('contains the original bbox', () => {
    const bbox: [number, number, number, number] = [400, 200, 500, 260];
    const box = boxFromBBox(bbox);
    expect(box.x).toBeLessThanOrEqual(bbox[0]);
    expect(box.y).toBeLessThanOrEqual(bbox[1]);
    expect(box.x + box.w).toBeGreaterThanOrEqual(bbox[2]);
    expect(box.y + box.h).toBeGreaterThanOrEqual(bbox[3]);
  });

  it('never zooms in past the minimum view width (micro-countries)', () => {
    const box = boxFromBBox([500, 250, 500.5, 250.4]);
    expect(box.w).toBeGreaterThanOrEqual(MIN_VIEW_W);
  });

  it('never zooms out past the whole world', () => {
    const box = boxFromBBox([0, 0, 2000, 2000]);
    expect(box.w).toBeLessThanOrEqual(WORLD_W);
  });

  it('stays horizontally on the map', () => {
    const box = boxFromBBox([980, 500, 1000, 520]);
    expect(box.x + box.w).toBeLessThanOrEqual(WORLD_W + 0.001);
    expect(box.x).toBeGreaterThanOrEqual(0);
  });
});

describe('transformFor', () => {
  it('is identity-like for the whole world', () => {
    expect(scaleOf(WORLD)).toBe(1);
    expect(transformFor(WORLD)).toBe('scale(1) translate(0px, 0px)');
  });

  it('scales up for smaller boxes', () => {
    expect(scaleOf({ x: 0, y: 0, w: 500, h: 260 })).toBe(2);
  });
});
