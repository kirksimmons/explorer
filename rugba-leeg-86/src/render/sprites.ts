import { TEAMS } from '../data/teams.ts';

// Player sprites are generated at boot — no asset files, so the single-file
// build stays self-contained. Bodies are built from an anatomical rig (head,
// shaped torso, two-segment legs and arms) posed by joint angles, then shaded
// with a three-tone ramp per material. That gives a real run cycle instead of
// hand-shoved pixels, and keeps every kit colour data-driven from TEAMS.
export const SPRITE_W = 20;
export const SPRITE_H = 28;
export const RUN_FRAMES = 8;

export interface SpriteSet {
  run: HTMLCanvasElement[];
  down: HTMLCanvasElement;
}

interface Kit {
  skin: string;
  jersey: string;
  trim: string;
  hair: string;
  wide: boolean;
  shades: boolean;
}

// ---- colour ramp -----------------------------------------------------------

// Accepts both "#rrggbb" and its own "rgb(r,g,b)" output, because shaded
// colours get passed back through here when a limb is drawn from an
// already-toned base. Returning an unparseable string would leave fillStyle
// untouched and silently paint black.
function adj(color: string, f: number): string {
  let r: number;
  let g: number;
  let b: number;
  if (color[0] === '#') {
    const n = parseInt(color.slice(1), 16);
    r = (n >> 16) & 255;
    g = (n >> 8) & 255;
    b = n & 255;
  } else {
    const m = color.match(/\d+/g)!;
    r = +m[0];
    g = +m[1];
    b = +m[2];
  }
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${ch(r)},${ch(g)},${ch(b)})`;
}

const SHADE = 0.78; // shadow side — must not crush dark kits to black
const LIGHT = 1.35; // lit side
const OUTLINE = 0.45;

// ---- rig primitives --------------------------------------------------------

// A tapered limb segment drawn row by row, lit on the left, dark on the right —
// the cheap trick that makes flat pixels read as round.
function segment(
  g: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w: number,
  base: string,
): void {
  const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t - w / 2);
    const y = Math.round(y0 + (y1 - y0) * t);
    g.fillStyle = base;
    g.fillRect(x, y, w, 1);
    g.fillStyle = adj(base, LIGHT);
    g.fillRect(x, y, 1, 1);
    g.fillStyle = adj(base, SHADE);
    g.fillRect(x + w - 1, y, 1, 1);
  }
}

interface Joint {
  x: number;
  y: number;
}

// Hip/shoulder -> knee/elbow -> ankle/wrist, from angles off vertical.
function chain(hx: number, hy: number, a1: number, l1: number, a2: number, l2: number): [Joint, Joint] {
  const mid = { x: hx + Math.sin(a1) * l1, y: hy + Math.cos(a1) * l1 };
  const end = { x: mid.x + Math.sin(a2) * l2, y: mid.y + Math.cos(a2) * l2 };
  return [mid, end];
}

// Torso silhouette: broad shoulders tapering to the waist. Wide kit = forward.
function torsoWidths(wide: boolean): number[] {
  const base = [9, 11, 12, 12, 12, 11, 11, 10, 10];
  return wide ? base.map((v) => v + 1) : base.map((v) => v - 1);
}

function drawTorso(g: CanvasRenderingContext2D, cx: number, top: number, k: Kit): void {
  const widths = torsoWidths(k.wide);
  widths.forEach((w, i) => {
    const y = top + i;
    const x = Math.round(cx - w / 2);
    // Trim hoop across the chest, jersey elsewhere.
    const hoop = i === 4 || i === 5;
    const base = hoop ? k.trim : k.jersey;
    g.fillStyle = base;
    g.fillRect(x, y, w, 1);
    g.fillStyle = adj(base, LIGHT);
    g.fillRect(x + 1, y, 2, 1);
    g.fillStyle = adj(base, SHADE);
    g.fillRect(x + w - 2, y, 2, 1);
    g.fillStyle = adj(base, OUTLINE);
    g.fillRect(x, y, 1, 1);
    g.fillRect(x + w - 1, y, 1, 1);
  });
  // Collar.
  g.fillStyle = adj(k.trim, LIGHT);
  g.fillRect(cx - 2, top, 4, 1);
  g.fillStyle = adj(k.jersey, OUTLINE);
  g.fillRect(cx - 1, top + 1, 2, 1);
  // Club badge.
  g.fillStyle = adj(k.trim, LIGHT);
  g.fillRect(cx + 2, top + 2, 2, 2);
  // Shorts.
  const sTop = top + widths.length;
  for (let i = 0; i < 3; i++) {
    const w = (k.wide ? 10 : 9) - i * 2;
    const x = Math.round(cx - w / 2);
    g.fillStyle = '#e8e8e8';
    g.fillRect(x, sTop + i, w, 1);
    g.fillStyle = '#ffffff';
    g.fillRect(x + 1, sTop + i, 2, 1);
    g.fillStyle = '#9a9aa2';
    g.fillRect(x + w - 2, sTop + i, 2, 1);
  }
}

function drawHead(g: CanvasRenderingContext2D, cx: number, top: number, k: Kit): void {
  const skin = k.skin;
  // Neck.
  g.fillStyle = adj(skin, SHADE);
  g.fillRect(cx - 1, top + 6, 3, 2);
  // Face block.
  g.fillStyle = skin;
  g.fillRect(cx - 3, top, 7, 7);
  g.fillStyle = adj(skin, LIGHT);
  g.fillRect(cx - 3, top + 1, 2, 4);
  g.fillStyle = adj(skin, SHADE);
  g.fillRect(cx + 3, top + 1, 1, 5);
  g.fillStyle = adj(skin, OUTLINE);
  g.fillRect(cx - 3, top + 6, 7, 1); // jawline
  // Hair.
  g.fillStyle = k.hair;
  g.fillRect(cx - 3, top, 7, 2);
  g.fillRect(cx - 4, top + 1, 1, 2);
  g.fillStyle = adj(k.hair, LIGHT);
  g.fillRect(cx - 2, top, 3, 1);
  // Ear.
  g.fillStyle = adj(skin, SHADE);
  g.fillRect(cx + 3, top + 3, 1, 2);
  // Eyes, or the Grifters' shades.
  if (k.shades) {
    g.fillStyle = '#101014';
    g.fillRect(cx - 2, top + 3, 5, 2);
    g.fillStyle = '#6a6a80';
    g.fillRect(cx - 1, top + 3, 1, 1);
  } else {
    g.fillStyle = '#2a1a12';
    g.fillRect(cx - 1, top + 3, 1, 2);
    g.fillRect(cx + 2, top + 3, 1, 2);
  }
}

function drawBoot(g: CanvasRenderingContext2D, x: number, y: number, forward: number): void {
  const bx = Math.round(x) - 2;
  const by = Math.round(y);
  g.fillStyle = '#1b1b22';
  g.fillRect(bx, by, 4, 1);
  g.fillRect(bx + (forward >= 0 ? 4 : -2), by, 2, 1); // toe
  g.fillStyle = '#e6e6ea';
  g.fillRect(bx, by + 1, 4, 1); // sole
}

// Knee-to-ankle sock in team colours — bare legs read as pyjamas at this size.
function drawSock(
  g: CanvasRenderingContext2D,
  knee: Joint,
  ankle: Joint,
  k: Kit,
  back: boolean,
): void {
  const t = 0.12; // sock starts just below the knee
  const sx = knee.x + (ankle.x - knee.x) * t;
  const sy = knee.y + (ankle.y - knee.y) * t;
  const dim = back ? 0.88 : 1;
  segment(g, sx, sy, ankle.x, ankle.y, back ? 3 : 4, adj(k.jersey, 0.55 * dim));
  g.fillStyle = adj(k.trim, 0.95 * dim);
  g.fillRect(Math.round(sx) - 2, Math.round(sy), back ? 3 : 4, 1);
}

// ---- frame assembly --------------------------------------------------------

function runFrame(k: Kit, phase: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SPRITE_W;
  c.height = SPRITE_H;
  const g = c.getContext('2d')!;
  const cx = SPRITE_W / 2;

  const a = (phase / RUN_FRAMES) * Math.PI * 2;
  // Body bobs a pixel at the top of each stride.
  const bob = Math.abs(Math.sin(a)) > 0.85 ? -1 : 0;
  const headTop = 1 + bob;
  const torsoTop = 8 + bob;
  const hipY = 20 + bob;
  const shoulderY = 10 + bob;

  // Thigh swings; the trailing leg tucks its heel up, which is what sells a
  // sprint rather than a walk. Arms stay tight to the body like a real runner.
  const swing = 0.8;
  const legs: Array<[number, number]> = [
    [Math.sin(a) * swing, Math.max(0, -Math.sin(a)) * 1.5],
    [Math.sin(a + Math.PI) * swing, Math.max(0, -Math.sin(a + Math.PI)) * 1.5],
  ];
  const arms: Array<[number, number]> = [
    [Math.sin(a + Math.PI) * 0.45, 0.5],
    [Math.sin(a) * 0.45, 0.5],
  ];

  const leg = (hx: number, sw: [number, number], back: boolean) => {
    const tone = back ? 0.88 : 1;
    // Clamp the shin so a hard heel-tuck never swings the foot above
    // horizontal — that folds the boot up across the torso.
    const shin = Math.min(sw[0] + sw[1], 1.3);
    const [knee, ankle] = chain(hx, hipY, sw[0], 5, shin, 5);
    segment(g, hx, hipY, knee.x, knee.y, back ? 4 : 5, adj(k.skin, tone));
    segment(g, knee.x, knee.y, ankle.x, ankle.y, back ? 3 : 4, adj(k.skin, tone));
    drawSock(g, knee, ankle, k, back);
    drawBoot(g, ankle.x, ankle.y, sw[0]);
  };
  const arm = (sx: number, sw: [number, number], back: boolean) => {
    const tone = back ? 0.88 : 1;
    const [elbow, wrist] = chain(sx, shoulderY, sw[0], 4, sw[0] + sw[1], 4);
    // Sleeve, then a trim cuff, then the bare forearm.
    segment(g, sx, shoulderY, elbow.x, elbow.y, 3, adj(k.jersey, tone));
    g.fillStyle = adj(k.trim, tone);
    g.fillRect(Math.round(elbow.x) - 1, Math.round(elbow.y) - 1, 3, 1);
    segment(g, elbow.x, elbow.y, wrist.x, wrist.y, 2, adj(k.skin, tone));
  };

  // Back limbs first so the near side overlaps them.
  leg(cx - 2, legs[1], true);
  arm(cx - 5, arms[1], true);

  drawTorso(g, cx, torsoTop, k);
  drawHead(g, cx, headTop, k);

  leg(cx + 2, legs[0], false);
  arm(cx + 5, arms[0], false);
  return c;
}

// Flattened on the turf after a big hit.
function downFrame(k: Kit): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SPRITE_W;
  c.height = SPRITE_H;
  const g = c.getContext('2d')!;
  const y = SPRITE_H - 9;

  // Legs splayed sideways.
  segment(g, 6, y + 4, 2, y + 7, 3, adj(k.skin, 0.82));
  segment(g, 6, y + 5, 3, y + 2, 3, k.skin);
  drawBoot(g, 2, y + 7, -1);
  // Body lying across.
  g.fillStyle = k.jersey;
  g.fillRect(5, y, 11, 5);
  g.fillStyle = adj(k.jersey, LIGHT);
  g.fillRect(5, y, 11, 1);
  g.fillStyle = adj(k.jersey, SHADE);
  g.fillRect(5, y + 4, 11, 1);
  g.fillStyle = k.trim;
  g.fillRect(9, y, 2, 5);
  // Arm flung out.
  segment(g, 15, y + 1, 18, y - 2, 2, k.skin);
  // Head.
  g.fillStyle = k.skin;
  g.fillRect(15, y + 1, 5, 5);
  g.fillStyle = k.hair;
  g.fillRect(15, y + 1, 5, 2);
  g.fillStyle = adj(k.skin, OUTLINE);
  g.fillRect(15, y + 5, 5, 1);
  return c;
}

function kitFor(team: 0 | 1, fire: boolean): Kit {
  const t = TEAMS[team];
  return {
    skin: t.skin,
    jersey: fire ? '#ff7b00' : t.jersey,
    trim: fire ? '#ffe86a' : t.trim,
    hair: '#3a2418',
    wide: t.wide,
    shades: t.shades,
  };
}

function buildSet(team: 0 | 1, fire: boolean): SpriteSet {
  const k = kitFor(team, fire);
  return {
    run: Array.from({ length: RUN_FRAMES }, (_, f) => runFrame(k, f)),
    down: downFrame(k),
  };
}

// [team][fire ? 1 : 0]
export function buildSprites(): [SpriteSet, SpriteSet][] {
  return [
    [buildSet(0, false), buildSet(0, true)],
    [buildSet(1, false), buildSet(1, true)],
  ];
}

// The ball: a shaded brown oval with a lace highlight.
export function buildBall(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 7;
  c.height = 5;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7a4a20';
  g.fillRect(1, 0, 5, 5);
  g.fillRect(0, 1, 7, 3);
  g.fillStyle = '#9c6530';
  g.fillRect(1, 1, 4, 2);
  g.fillStyle = '#f0f0e0';
  g.fillRect(3, 2, 2, 1);
  return c;
}
