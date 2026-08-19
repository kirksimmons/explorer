import { TEAMS } from '../data/teams.ts';

// Big-head pixel sprites, generated at boot. Per team: 3 run frames, normal +
// on-fire palettes. Facing is handled by a flipped draw, not extra frames.
export const SPRITE_W = 16;
export const SPRITE_H = 18;

export type SpriteSet = HTMLCanvasElement[][]; // [fire ? 1 : 0][frame]

export function buildSprites(): [SpriteSet, SpriteSet] {
  return [buildTeam(0), buildTeam(1)];
}

function buildTeam(team: 0 | 1): SpriteSet {
  const t = TEAMS[team];
  const normal = [0, 1, 2].map((f) => drawPlayer(t.jersey, t.trim, t.skin, t.wide, t.shades, f, false));
  const fire = [0, 1, 2].map((f) => drawPlayer('#ff7b00', '#ffd83e', t.skin, t.wide, t.shades, f, true));
  return [normal, fire];
}

function drawPlayer(
  jersey: string,
  trim: string,
  skin: string,
  wide: boolean,
  shades: boolean,
  frame: number,
  fire: boolean,
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SPRITE_W;
  c.height = SPRITE_H;
  const g = c.getContext('2d')!;
  const cx = SPRITE_W / 2;
  const bw = wide ? 12 : 9; // body width
  const hw = 8; // head width

  // Legs: 3-frame cycle.
  g.fillStyle = skin;
  const legY = 14;
  if (frame === 0) {
    g.fillRect(cx - 3, legY, 2, 4);
    g.fillRect(cx + 1, legY, 2, 4);
  } else if (frame === 1) {
    g.fillRect(cx - 4, legY, 2, 3);
    g.fillRect(cx + 2, legY + 1, 2, 3);
  } else {
    g.fillRect(cx - 2, legY + 1, 2, 3);
    g.fillRect(cx + 2, legY, 2, 3);
  }

  // Shorts + jersey with trim stripe.
  g.fillStyle = '#f0f0f0';
  g.fillRect(cx - bw / 2 + 1, 12, bw - 2, 2);
  g.fillStyle = jersey;
  g.fillRect(cx - bw / 2, 7, bw, 5);
  g.fillStyle = trim;
  g.fillRect(cx - bw / 2, 9, bw, 1);

  // Arms in jersey sleeves — keeps the team color dominant at this scale.
  g.fillStyle = jersey;
  g.fillRect(cx - bw / 2 - 1, 8, 1, 3);
  g.fillRect(cx + bw / 2, 8, 1, 3);

  // Big head.
  g.fillStyle = skin;
  g.fillRect(cx - hw / 2, 0, hw, 7);
  g.fillStyle = '#3a2418'; // hair
  g.fillRect(cx - hw / 2, 0, hw, 2);
  if (shades) {
    g.fillStyle = '#000';
    g.fillRect(cx - hw / 2 + 1, 3, hw - 2, 2);
  } else {
    g.fillStyle = '#000';
    g.fillRect(cx - 2, 3, 1, 1);
    g.fillRect(cx + 2, 3, 1, 1);
    g.fillStyle = '#d9534f'; // beefy cheeks
    g.fillRect(cx - 3, 5, 1, 1);
    g.fillRect(cx + 2, 5, 1, 1);
  }

  if (fire) {
    g.fillStyle = '#ffd83e';
    g.fillRect(cx - hw / 2 - 1, -0, 1, 2);
    g.fillRect(cx + hw / 2, 0, 1, 2);
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
