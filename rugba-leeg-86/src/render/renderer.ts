import {
  DEAD_A,
  DEAD_B,
  FIELD_H,
  FIELD_W,
  HALF_LENGTH,
  TACKLES_PER_SET,
  TRY_LINE_A,
  TRY_LINE_B,
  TURBO_MAX,
  VIEW_H,
  VIEW_W,
} from '../constants.ts';
import { TEAMS } from '../data/teams.ts';
import type { Input } from '../input.ts';
import { BTN_KICK, BTN_PASS, BTN_SPRINT, STICK_MAX } from '../input.ts';
import { kickAvailable } from '../sim/kicking.ts';
import type { MatchState, SimEvent } from '../types.ts';
import { AX, AY, fieldTransform, ISO_SQUASH, project, type IsoCam } from './camera.ts';
import {
  buildBall,
  buildSprites,
  RUN_FRAMES,
  SPRITE_H,
  SPRITE_W,
  type SpriteSet,
} from './sprites.ts';

interface Popup {
  text: string;
  t: number;
}

const POPUP_TIME = 1.4;

export class Renderer {
  private g: CanvasRenderingContext2D;
  private field: HTMLCanvasElement;
  private scanlines: HTMLCanvasElement;
  private sprites: [SpriteSet, SpriteSet][];
  private ballSprite: HTMLCanvasElement;
  private camX = FIELD_W / 2;
  private camY = FIELD_H / 2;
  private popups: Popup[] = [];
  private anim = 0;
  crt: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.g = canvas.getContext('2d')!;
    this.g.imageSmoothingEnabled = false;
    this.field = buildField();
    this.scanlines = buildScanlines();
    this.sprites = buildSprites();
    this.ballSprite = buildBall();
    let crt = true;
    try {
      crt = localStorage.getItem('rl86-crt') !== 'off';
    } catch {
      /* storage unavailable — default on */
    }
    this.crt = crt;
  }

  spriteSets(): [SpriteSet, SpriteSet][] {
    return this.sprites;
  }

  toggleCrt(): void {
    this.crt = !this.crt;
    try {
      localStorage.setItem('rl86-crt', this.crt ? 'on' : 'off');
    } catch {
      /* fine */
    }
  }

  pushEvents(events: SimEvent[]): void {
    for (const e of events) {
      const text = popupText(e);
      if (text) this.popups.push({ text, t: POPUP_TIME });
    }
  }

  draw(s: MatchState, input: Input, dt: number): void {
    const g = this.g;
    this.anim += dt;
    for (const p of this.popups) p.t -= dt;
    this.popups = this.popups.filter((p) => p.t > 0);

    g.fillStyle = '#141420'; // stadium bowl, so any uncovered edge still reads
    g.fillRect(0, 0, VIEW_W, VIEW_H);

    if (s.phase === 'title') {
      this.drawTitle(g);
      if (this.crt) g.drawImage(this.scanlines, 0, 0);
      return;
    }

    // Camera tracks the ball in world space; shake jitters the whole view.
    this.camX += (s.ball.pos.x - this.camX) * Math.min(1, 5 * dt);
    this.camY += (s.ball.pos.y - this.camY) * Math.min(1, 5 * dt);
    // Visual-only randomness — never the sim's seeded RNG.
    const shakeX = s.shake ? (Math.random() - 0.5) * 2 * s.shake : 0;
    const shakeY = s.shake ? (Math.random() - 0.5) * 2 * s.shake : 0;
    const cam: IsoCam = { x: this.camX + shakeX, y: this.camY + shakeY };

    // One affine blit puts the whole pre-rendered stadium on screen, diagonal.
    g.save();
    g.setTransform(...fieldTransform(cam, MARGIN_X, STAND_H));
    g.drawImage(this.field, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.restore();

    // Billboard sprites, sorted back-to-front by projected screen y.
    const byDepth = [...s.players].sort(
      (a, b) => project(a.pos.x, a.pos.y, cam).y - project(b.pos.x, b.pos.y, cam).y,
    );
    for (const p of byDepth) {
      const flicker = p.onFire && Math.floor(this.anim * 10) % 2 === 0;
      const set = this.sprites[p.team][flicker ? 1 : 0];
      const speed = Math.hypot(p.vel.x, p.vel.y);
      // Stride rate tracks running speed, so sprinting reads as sprinting.
      const cycle = Math.floor(this.anim * (6 + speed * 0.09) + p.id) % RUN_FRAMES;
      const spr = p.state === 'run' ? set.run[speed > 8 ? cycle : 0] : set.down;
      const f = project(p.pos.x, p.pos.y, cam); // feet on screen
      const screenVx = p.vel.x * AX.x + p.vel.y * AY.x; // facing follows the view
      const depth = 0.75 + 0.5 * (f.y / VIEW_H);
      const w = SPRITE_W * depth;
      const h = SPRITE_H * depth;
      // Marker under the controlled player: red ellipse, ARL style.
      if (p.id === s.controlledId) {
        g.fillStyle = 'rgba(220,40,40,0.55)';
        g.beginPath();
        g.ellipse(f.x, f.y - 1, 9 * depth, 3.5 * depth, 0, 0, Math.PI * 2);
        g.fill();
      }
      // Shadow.
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(f.x, f.y - 1, 6 * depth, 2 * depth, 0, 0, Math.PI * 2);
      g.fill();
      const x = Math.round(f.x - w / 2);
      const y = Math.round(f.y - h);
      if (p.state === 'ragdoll') {
        // Still tumbling: spin the downed sprite for the comedy.
        g.save();
        g.translate(f.x, f.y - h / 4);
        g.rotate(this.anim * 9);
        g.drawImage(spr, -w / 2, -h / 2, w, h);
        g.restore();
      } else if (p.state === 'gettingUp') {
        g.drawImage(spr, Math.round(f.x - w / 2), Math.round(f.y - h), w, h);
      } else if (screenVx < -5) {
        g.save();
        g.translate(x + w, y);
        g.scale(-1, 1);
        g.drawImage(spr, 0, 0, w, h);
        g.restore();
      } else {
        g.drawImage(spr, x, y, w, h);
      }
      if (p.id === s.controlledId) {
        g.font = 'bold 8px monospace';
        g.textAlign = 'center';
        g.fillStyle = '#fff';
        g.strokeStyle = '#000';
        g.lineWidth = 2;
        const num = `${(p.id % 7) + 1}`;
        g.strokeText(num, f.x, f.y + 8);
        g.fillText(num, f.x, f.y + 8);
      }
    }

    // Ball: tucked under the carrier's arm, or loose with a shadow.
    if (s.ball.carrier !== null) {
      const c = s.players[s.ball.carrier];
      const b = project(c.pos.x, c.pos.y, cam);
      const carrierVx = c.vel.x * AX.x + c.vel.y * AY.x;
      g.drawImage(
        this.ballSprite,
        Math.round(b.x + (carrierVx < -5 ? -7 : 2)),
        Math.round(b.y - 7),
      );
    } else {
      const b = project(s.ball.pos.x, s.ball.pos.y, cam);
      g.fillStyle = 'rgba(0,0,0,0.4)';
      g.beginPath();
      g.ellipse(b.x, b.y, 3, 1.5, 0, 0, Math.PI * 2);
      g.fill();
      g.drawImage(this.ballSprite, Math.round(b.x - 3), Math.round(b.y - 2 - s.ball.z * 0.4));
    }

    this.drawHud(s, g);
    this.drawTouchControls(s, input, g);

    if (s.phase === 'kickMeter') this.drawMeter(s, g);
    if (s.phase === 'halftime' || s.phase === 'fulltime') this.drawBreak(s, g);

    // Announcer popup: newest one, big, flickering.
    const pop = this.popups[this.popups.length - 1];
    if (pop) {
      const scale = Math.min(1, (POPUP_TIME - pop.t) * 8);
      g.save();
      g.translate(VIEW_W / 2, 90);
      g.scale(scale, scale);
      g.font = 'bold 22px monospace';
      g.textAlign = 'center';
      g.fillStyle = Math.floor(this.anim * 12) % 2 ? '#fff' : '#ffd83e';
      g.strokeStyle = '#000';
      g.lineWidth = 3;
      g.strokeText(pop.text, 0, 0);
      g.fillText(pop.text, 0, 0);
      g.restore();
    }

    if (this.crt) g.drawImage(this.scanlines, 0, 0);
  }

  private drawTitle(g: CanvasRenderingContext2D): void {
    g.fillStyle = '#1a1a2e';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    g.textAlign = 'center';
    g.font = 'bold 42px monospace';
    g.fillStyle = '#ffd83e';
    g.strokeStyle = '#7a1f2b';
    g.lineWidth = 4;
    g.strokeText('RUGBA LEEG', VIEW_W / 2, 90);
    g.fillText('RUGBA LEEG', VIEW_W / 2, 90);
    g.font = 'bold 64px monospace';
    g.fillStyle = '#fff';
    g.strokeText('86', VIEW_W / 2, 150);
    g.fillText('86', VIEW_W / 2, 150);
    g.font = '11px monospace';
    g.fillStyle = TEAMS[0].trim;
    g.fillText(`${TEAMS[0].name}  vs  ${TEAMS[1].name}`, VIEW_W / 2, 185);
    if (Math.floor(this.anim * 2) % 2) {
      g.font = 'bold 14px monospace';
      g.fillStyle = '#fff';
      g.fillText('TAP TO START', VIEW_W / 2, 225);
    }
    g.font = '8px monospace';
    g.fillStyle = '#888';
    g.fillText('STICK: RUN   PASS   SPRINT/BUMP   KICK ON THE LAST', VIEW_W / 2, 250);
  }

  private drawHud(s: MatchState, g: CanvasRenderingContext2D): void {
    // Beveled LCD timer box, top-left, ARL style.
    const t = Math.max(0, HALF_LENGTH - s.clock);
    const mm = Math.floor(t / 60);
    const ss = Math.floor(t % 60);
    bevelBox(g, 4, 4, 62, 18);
    g.font = 'bold 11px monospace';
    g.textAlign = 'center';
    g.fillStyle = '#e8e8d0';
    g.fillText(`${mm}:${ss < 10 ? '0' : ''}${ss}`, 27, 17);
    g.font = 'bold 7px monospace';
    g.fillStyle = '#8fd18f';
    g.fillText(`H${s.half}`, 56, 16);
    // Tackle pips under the timer.
    for (let i = 0; i < TACKLES_PER_SET; i++) {
      g.fillStyle = i < s.tackleCount ? '#ff5a36' : '#333';
      g.fillRect(6 + i * 10, 25, 8, 3);
    }

    // Beveled score box, top-right.
    bevelBox(g, VIEW_W - 96, 4, 92, 18);
    g.font = 'bold 9px monospace';
    g.textAlign = 'left';
    g.fillStyle = TEAMS[0].trim;
    g.fillText(`${TEAMS[0].short} ${pad(s.score[0])}`, VIEW_W - 90, 16);
    g.textAlign = 'right';
    g.fillStyle = TEAMS[1].trim;
    g.fillText(`${pad(s.score[1])} ${TEAMS[1].short}`, VIEW_W - 8, 16);

    // Turbo meter for the controlled player.
    const me = s.players[s.controlledId];
    g.fillStyle = '#333';
    g.fillRect(VIEW_W - 60, 26, 54, 5);
    g.fillStyle = me.onFire ? '#ff7b00' : '#3ec96b';
    g.fillRect(VIEW_W - 60, 26, (54 * me.turbo) / TURBO_MAX, 5);
  }

  private drawTouchControls(s: MatchState, input: Input, g: CanvasRenderingContext2D): void {
    g.globalAlpha = 0.35;
    const stick = input.stickPointer();
    if (stick) {
      g.strokeStyle = '#fff';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(stick.ox, stick.oy, STICK_MAX, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = '#fff';
      const dx = Math.max(-STICK_MAX, Math.min(STICK_MAX, stick.x - stick.ox));
      const dy = Math.max(-STICK_MAX, Math.min(STICK_MAX, stick.y - stick.oy));
      g.beginPath();
      g.arc(stick.ox + dx, stick.oy + dy, 8, 0, Math.PI * 2);
      g.fill();
    }
    drawBtn(g, BTN_PASS.x, BTN_PASS.y, BTN_PASS.r, 'PASS', false);
    drawBtn(g, BTN_SPRINT.x, BTN_SPRINT.y, BTN_SPRINT.r, 'SPR', input.sprintTouchHeld());
    if (s.phase === 'openPlay' && kickAvailable(s) && s.ball.carrier === s.controlledId) {
      g.globalAlpha = 0.7;
      drawBtn(g, BTN_KICK.x, BTN_KICK.y, BTN_KICK.r, 'KICK', true);
    }
    g.globalAlpha = 1;
  }

  private drawMeter(s: MatchState, g: CanvasRenderingContext2D): void {
    const w = 200;
    const x = VIEW_W / 2 - w / 2;
    const y = 120;
    g.fillStyle = 'rgba(0,0,0,0.7)';
    g.fillRect(x - 10, y - 30, w + 20, 60);
    g.font = 'bold 10px monospace';
    g.textAlign = 'center';
    g.fillStyle = '#fff';
    g.fillText(s.meterKind === 'conversion' ? 'CONVERSION — TAP IN THE ZONE!' : 'DROP GOAL — TAP IN THE ZONE!', VIEW_W / 2, y - 14);
    g.fillStyle = '#333';
    g.fillRect(x, y, w, 10);
    g.fillStyle = '#3ec96b';
    g.fillRect(x + w * (0.5 - s.meterZone), y, w * s.meterZone * 2, 10);
    g.fillStyle = '#ffd83e';
    g.fillRect(x + w * s.meterT - 2, y - 4, 4, 18);
  }

  private drawBreak(s: MatchState, g: CanvasRenderingContext2D): void {
    g.fillStyle = 'rgba(0,0,0,0.8)';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    g.textAlign = 'center';
    g.font = 'bold 24px monospace';
    g.fillStyle = '#ffd83e';
    g.fillText(s.phase === 'halftime' ? 'HALF TIME' : 'FULL TIME', VIEW_W / 2, 100);
    g.font = 'bold 16px monospace';
    g.fillStyle = '#fff';
    g.fillText(`${TEAMS[0].short} ${s.score[0]} — ${s.score[1]} ${TEAMS[1].short}`, VIEW_W / 2, 130);
    if (s.phase === 'fulltime') {
      const w = s.score[0] === s.score[1] ? null : s.score[0] > s.score[1] ? 0 : 1;
      g.fillStyle = '#3ec96b';
      g.fillText(w === null ? 'A DRAW?! JANK!' : `${TEAMS[w].name} WIN!`, VIEW_W / 2, 160);
    }
    if (Math.floor(this.anim * 2) % 2) {
      g.font = '12px monospace';
      g.fillStyle = '#fff';
      g.fillText(s.phase === 'halftime' ? 'TAP FOR SECOND HALF' : 'TAP TO PLAY AGAIN', VIEW_W / 2, 200);
    }
  }
}

// Grey bevel frame around a black LCD screen.
function bevelBox(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.fillStyle = '#c8c8d0';
  g.fillRect(x, y, w, h);
  g.fillStyle = '#55555f';
  g.fillRect(x + 1, y + 1, w - 1, h - 1);
  g.fillStyle = '#8a8a94';
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = '#000';
  g.fillRect(x + 2, y + 2, w - 4, h - 4);
}

function drawBtn(g: CanvasRenderingContext2D, x: number, y: number, r: number, label: string, lit: boolean): void {
  g.fillStyle = lit ? '#ffd83e' : '#fff';
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#000';
  g.font = 'bold 8px monospace';
  g.textAlign = 'center';
  g.fillText(label, x, y + 3);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function popupText(e: SimEvent): string | null {
  switch (e.type) {
    case 'bigHit':
      return 'BIG HIT!';
    case 'try':
      return 'TRY!!!';
    case 'onFire':
      return "HE'S ON FIRE!";
    case 'lastTackle':
      return 'LAST TACKLE!';
    case 'knockOn':
      return 'DROPPED IT!';
    case 'handover':
      return e.reason === 'sixthTackle' ? 'SIX TACKLES!' : 'HANDOVER!';
    case 'kickGood':
      return "IT'S GOOD!";
    case 'kickMissed':
      return 'WIDE!';
    default:
      return null;
  }
}

// The whole stadium pre-rendered once, in world space with margin on every
// side so the rotated blit still covers the viewport corners. Local (0,0) is
// world (-MARGIN_X, -STAND_H): grandstand above the far touchline, turf, then
// the near-side stand below.
export const MARGIN_X = 520;
export const STAND_H = 90;
const NEAR_STAND_H = 70;

function buildField(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = FIELD_W + MARGIN_X * 2;
  c.height = STAND_H + FIELD_H + NEAR_STAND_H;
  const g = c.getContext('2d')!;
  const left = MARGIN_X;
  const top = STAND_H;
  const W = c.width;

  // Stadium bowl fills everything the pitch does not.
  g.fillStyle = '#141420';
  g.fillRect(0, 0, W, c.height);

  drawStand(g, 0, W, STAND_H, true);
  drawStand(g, top + FIELD_H, W, NEAR_STAND_H, false);

  // Surrounding grass apron so the pitch does not end at a hard edge.
  g.fillStyle = '#1f5c1f';
  g.fillRect(0, top - 14, W, FIELD_H + 28);

  // Turf: big checkerboard + speckle dither, ARL style.
  for (let x = 0; x < FIELD_W; x += 40) {
    for (let y = 0; y < FIELD_H; y += 40) {
      g.fillStyle = ((x + y) / 40) % 2 ? '#2f8a2f' : '#297b29';
      g.fillRect(left + x, top + y, 40, Math.min(40, FIELD_H - y));
    }
  }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = i % 2 ? '#37993a' : '#226622';
    g.fillRect(left + ((i * 137) % FIELD_W), ((i * 61) % FIELD_H) + top, 1, 1);
  }
  // In-goal areas tinted.
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.fillRect(left + DEAD_A, top, TRY_LINE_A - DEAD_A, FIELD_H);
  g.fillRect(left + TRY_LINE_B, top, DEAD_B - TRY_LINE_B, FIELD_H);

  // Painted markings are drawn pre-stretched vertically: the camera squashes
  // y by ISO_SQUASH, so text laid out this way reads correctly on screen.
  const paint = (text: string, x: number, y: number, size: number, alpha: number) => {
    g.save();
    g.translate(left + x, top + y);
    g.scale(1, 1 / ISO_SQUASH);
    g.font = `bold ${size}px monospace`;
    g.textAlign = 'center';
    g.fillStyle = `rgba(232,232,208,${alpha})`;
    g.fillText(text, 0, 0);
    g.restore();
  };

  // Midfield decal.
  const mx = FIELD_W / 2;
  const my = FIELD_H / 2;
  g.save();
  g.translate(left + mx, top + my);
  g.scale(1, 1 / ISO_SQUASH);
  g.fillStyle = 'rgba(232,185,62,0.85)';
  g.beginPath();
  g.ellipse(0, 0, 34, 22, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1a1a1a';
  g.beginPath();
  g.ellipse(0, 0, 30, 18, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#e8b93e';
  g.font = 'bold 10px monospace';
  g.textAlign = 'center';
  g.fillText('RUGBA', 0, -3);
  g.fillText('LEEG 86', 0, 9);
  g.restore();

  // Lines: dead-ball, try, 10m stripes with big painted numbers.
  g.fillStyle = '#e8e8d0';
  g.fillRect(left + DEAD_A, top, 2, FIELD_H);
  g.fillRect(left + DEAD_B - 2, top, 2, FIELD_H);
  g.fillRect(left + TRY_LINE_A, top, 3, FIELD_H);
  g.fillRect(left + TRY_LINE_B - 3, top, 3, FIELD_H);
  // Touchlines.
  g.fillRect(left + DEAD_A, top, DEAD_B - DEAD_A, 2);
  g.fillRect(left + DEAD_A, top + FIELD_H - 2, DEAD_B - DEAD_A, 2);
  for (let i = 1; i < 10; i++) {
    const x = TRY_LINE_A + i * 80;
    g.fillStyle = 'rgba(232,232,208,0.8)';
    g.fillRect(left + x, top, 1, FIELD_H);
    const label = `${i <= 5 ? i * 10 : (10 - i) * 10}`;
    paint(label, x, 30, 22, 0.45);
    paint(label, x, FIELD_H - 14, 22, 0.45);
  }

  // Posts at each try line: uprights lean up-screen, crossbar across.
  for (const px of [TRY_LINE_A, TRY_LINE_B]) {
    const cxp = left + px;
    const cyp = top + FIELD_H / 2;
    g.fillStyle = '#f0f0f0';
    g.fillRect(cxp - 1, cyp - 30, 2, 22);
    g.fillRect(cxp - 1, cyp + 8, 2, 22);
    g.fillRect(cxp - 1, cyp - 9, 2, 18);
  }
  return c;
}

// A grandstand band: roofline, dithered crowd, pillars, sponsor hoardings.
function drawStand(
  g: CanvasRenderingContext2D,
  y: number,
  w: number,
  h: number,
  far: boolean,
): void {
  const hoard = 11;
  g.fillStyle = '#23233a';
  g.fillRect(0, y, w, h);
  // Roof/edge line on the outer side.
  g.fillStyle = '#9a9aa6';
  g.fillRect(0, far ? y : y + h - 4, w, 4);
  // Crowd speckle.
  const cy0 = far ? y + 6 : y + hoard + 2;
  const ch = h - hoard - 8;
  for (let i = 0; i < 14000; i++) {
    g.fillStyle = ['#c8b06a', '#b05050', '#5070b0', '#909098', '#6a5a8a', '#d0d0c0'][i % 6];
    g.fillRect((i * 137) % w, ((i * 61) % ch) + cy0, 1, 1);
  }
  // Aisle pillars.
  g.fillStyle = '#3a3a52';
  for (let x = 60; x < w; x += 140) g.fillRect(x, cy0, 3, ch);
  // Sponsor hoardings on the pitch-facing edge.
  const hy = far ? y + h - hoard : y;
  g.fillStyle = '#f0f0e8';
  g.fillRect(0, hy, w, hoard);
  g.save();
  g.translate(0, hy + hoard - 3);
  g.scale(1, 1 / ISO_SQUASH);
  g.font = 'bold 9px monospace';
  g.textAlign = 'left';
  g.fillStyle = '#111';
  const sponsors = ['LEEG SPORTS', 'JANK COLA', 'BEEF-O-MATIC', 'GRIFT BANK', 'RUGBA 86'];
  for (let x = 10, i = 0; x < w; x += 150, i++) {
    g.fillText(sponsors[i % sponsors.length], x, 0);
  }
  g.restore();
}

function buildScanlines(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = VIEW_W;
  c.height = VIEW_H;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(0,0,0,0.15)';
  for (let y = 0; y < VIEW_H; y += 2) g.fillRect(0, y, VIEW_W, 1);
  return c;
}
