import { TEAMS } from '../data/teams.ts';

// 16-bit-style player sprites, generated at boot. Proper proportions (head,
// torso, legs, boots), 4-frame run cycle, normal + on-fire palettes. Facing
// is a flipped draw; depth scaling happens in the renderer.
export const SPRITE_W = 16;
export const SPRITE_H = 24;

export type SpriteSet = HTMLCanvasElement[][]; // [fire ? 1 : 0][frame]

export function buildSprites(): [SpriteSet, SpriteSet] {
  return [buildTeam(0), buildTeam(1)];
}

const FRAMES = 4;

function buildTeam(team: 0 | 1): SpriteSet {
  const t = TEAMS[team];
  const mk = (jersey: string, trim: string) =>
    Array.from({ length: FRAMES }, (_, f) =>
      drawPlayer(jersey, trim, t.skin, t.wide, t.shades, f),
    );
  return [mk(t.jersey, t.trim), mk('#ff7b00', '#ffd83e')];
}

function drawPlayer(
  jersey: string,
  trim: string,
  skin: string,
  wide: boolean,
  shades: boolean,
  frame: number,
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SPRITE_W;
  c.height = SPRITE_H;
  const g = c.getContext('2d')!;
  const cx = SPRITE_W / 2;
  const bw = wide ? 12 : 10; // torso width

  // Legs + boots, 4-frame stride: together / left fwd / together / right fwd.
  const stride = frame === 1 ? 2 : frame === 3 ? -2 : 0;
  g.fillStyle = skin;
  g.fillRect(cx - 4 + stride, 16, 3, 6); // left leg
  g.fillRect(cx + 1 - stride, 16, 3, 6); // right leg
  g.fillStyle = '#1a1a1a';
  g.fillRect(cx - 4 + stride, 22, 3, 2); // boots
  g.fillRect(cx + 1 - stride, 22, 3, 2);

  // Shorts.
  g.fillStyle = '#f0f0f0';
  g.fillRect(cx - bw / 2 + 1, 14, bw - 2, 2);

  // Torso with a trim hoop, EA-kit style — jersey dominates the sprite.
  g.fillStyle = jersey;
  g.fillRect(cx - bw / 2, 5, bw, 9);
  g.fillStyle = trim;
  g.fillRect(cx - bw / 2, 9, bw, 2);

  // Sleeves + hands.
  g.fillStyle = jersey;
  g.fillRect(cx - bw / 2 - 2, 7, 2, 4);
  g.fillRect(cx + bw / 2, 7, 2, 4);
  g.fillStyle = skin;
  g.fillRect(cx - bw / 2 - 2, 11, 2, 2);
  g.fillRect(cx + bw / 2, 11, 2, 2);

  // Head.
  g.fillStyle = skin;
  g.fillRect(cx - 3, 0, 6, 6);
  g.fillStyle = '#3a2418'; // hair
  g.fillRect(cx - 3, 0, 6, 2);
  g.fillStyle = '#000';
  if (shades) {
    g.fillRect(cx - 3, 3, 6, 1);
  } else {
    g.fillRect(cx - 2, 3, 1, 1);
    g.fillRect(cx + 1, 3, 1, 1);
  }
  return c;
}

// The ball: a tiny brown oval.
export function buildBall(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 6;
  c.height = 4;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8b5a2b';
  g.fillRect(0, 1, 6, 2);
  g.fillRect(1, 0, 4, 4);
  g.fillStyle = '#fff';
  g.fillRect(2, 1, 2, 1);
  return c;
}
