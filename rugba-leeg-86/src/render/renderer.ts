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
import { AX, AY, fieldTransform, project, type IsoCam } from './camera.ts';
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
    let crt = false;
    try {
      crt = localStorage.getItem('rl86-crt') === 'on';
    } catch {
      /* storage unavailable — default off */
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

    g.fillStyle = '#16281a'; // treeline beyond the ground, for any uncovered edge
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
    // One beveled LCD box, as per the reference — clock, half and score.
    const t = Math.max(0, HALF_LENGTH - s.clock);
    const mm = Math.floor(t / 60);
    const ss = Math.floor(t % 60);
    bevelBox(g, 4, 4, 92, 30);
    g.textAlign = 'left';
    g.font = 'bold 13px monospace';
    g.fillStyle = '#e8e8d0';
    g.fillText(`${mm}:${ss < 10 ? '0' : ''}${ss}`, 9, 19);
    g.font = 'bold 7px monospace';
    g.fillStyle = '#8fd18f';
    g.fillText(`H${s.half}`, 52, 18);
    g.font = 'bold 8px monospace';
    g.fillStyle = TEAMS[0].trim;
    g.fillText(`${TEAMS[0].short} ${s.score[0]}`, 9, 29);
    g.textAlign = 'right';
    g.fillStyle = TEAMS[1].trim;
    g.fillText(`${s.score[1]} ${TEAMS[1].short}`, 91, 29);
    // Tackle count, just under the box.
    for (let i = 0; i < TACKLES_PER_SET; i++) {
      g.fillStyle = i < s.tackleCount ? '#ff5a36' : 'rgba(0,0,0,0.45)';
      g.fillRect(6 + i * 10, 37, 8, 3);
    }
    // Turbo, top right and unobtrusive.
    const me = s.players[s.controlledId];
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillRect(6, 42, 88, 5);
    g.fillStyle = me.onFire ? '#ff7b00' : '#3ec96b';
    g.fillRect(7, 43, (86 * me.turbo) / TURBO_MAX, 3);
  }

  private drawTouchControls(s: MatchState, input: Input, g: CanvasRenderingContext2D): void {
    g.globalAlpha = 0.22;
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
      g.globalAlpha = 0.55;
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

// The ground, pre-rendered once in world space with margin on every side so
// the rotated blit still covers the viewport corners. This is a suburban
// footy ground, not a stadium: picket fence, grass embankment, a patchy
// crowd and one modest tin-roof stand on the far side.
export const MARGIN_X = 520;
export const STAND_H = 150;
const NEAR_H = 150;

// Deterministic scatter — the same ground every load, no Math.random.
function noise(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const CROWD = ['#c8b06a', '#b05050', '#4a6ea8', '#8a8a92', '#5a4a72', '#d8d8cc', '#3f6f4a'];

// Sparse standing spectators. Suburban grounds have gaps — that patchiness is
// the whole look, so clumps are seeded rather than evenly spaced.
function drawCrowd(
  g: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  rows: number,
  density: number,
  seed: number,
): void {
  for (let r = 0; r < rows; r++) {
    for (let x = x0; x < x1; x += 3) {
      const n = noise(x * 0.7 + r * 31 + seed);
      if (n > density) continue;
      g.fillStyle = CROWD[Math.floor(noise(x + r * 7 + seed) * CROWD.length)];
      g.fillRect(x, y + r * 3, 2, 2);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(x, y + r * 3 + 2, 2, 1);
    }
  }
}

function drawFence(g: CanvasRenderingContext2D, x0: number, x1: number, y: number): void {
  g.fillStyle = '#6a6a5e';
  g.fillRect(x0, y + 4, x1 - x0, 1); // shadow line at the base
  g.fillStyle = '#e4e4d8';
  for (let x = x0; x < x1; x += 4) g.fillRect(x, y, 2, 5); // pickets
  g.fillRect(x0, y + 1, x1 - x0, 1); // rail
}

function buildField(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = FIELD_W + MARGIN_X * 2;
  c.height = STAND_H + FIELD_H + NEAR_H;
  const g = c.getContext('2d')!;
  const left = MARGIN_X;
  const top = STAND_H;
  const W = c.width;

  // Beyond the ground: dark treeline/car park.
  g.fillStyle = '#16281a';
  g.fillRect(0, 0, W, c.height);

  // --- far side: stand, embankment, fence ---
  const standX0 = left + 210;
  const standX1 = left + 690;
  // Grass embankment behind the fence, full length.
  g.fillStyle = '#2c6630';
  g.fillRect(0, 96, W, 42);
  drawCrowd(g, 0, W, 100, 6, 0.28, 11);
  // The one grandstand: corrugated roof, shaded seating, support posts.
  g.fillStyle = '#3a3a42';
  g.fillRect(standX0, 92, standX1 - standX0, 32);
  drawCrowd(g, standX0 + 4, standX1 - 4, 96, 7, 0.62, 3);
  g.fillStyle = '#8d9298'; // tin roof
  g.fillRect(standX0 - 6, 78, standX1 - standX0 + 12, 8);
  g.fillStyle = '#767b81';
  for (let x = standX0 - 6; x < standX1 + 6; x += 6) g.fillRect(x, 78, 1, 8); // corrugations
  g.fillStyle = '#5c6066';
  g.fillRect(standX0 - 6, 86, standX1 - standX0 + 12, 2); // roof shadow
  for (let x = standX0; x < standX1; x += 60) g.fillRect(x, 88, 2, 36); // posts
  drawFence(g, 0, W, 138);
  g.fillStyle = '#347a38'; // apron between fence and touchline
  g.fillRect(0, 143, W, top - 143);

  // --- the pitch ---
  g.fillStyle = '#419642';
  g.fillRect(0, top, W, FIELD_H);
  // Mown bands, only just visible.
  for (let x = 0; x < W; x += 60) {
    if ((x / 60) % 2) continue;
    g.fillStyle = 'rgba(255,255,255,0.025)';
    g.fillRect(x, top, 60, FIELD_H);
  }
  // Fine grass speckle — texture, not noise.
  for (let i = 0; i < 16000; i++) {
    g.fillStyle = i % 2 ? 'rgba(90,160,90,0.5)' : 'rgba(30,90,35,0.45)';
    g.fillRect((i * 137) % W, ((i * 61) % FIELD_H) + top, 1, 1);
  }
  // In-goals sit a shade darker.
  g.fillStyle = 'rgba(0,0,0,0.10)';
  g.fillRect(left + DEAD_A, top, TRY_LINE_A - DEAD_A, FIELD_H);
  g.fillRect(left + TRY_LINE_B, top, DEAD_B - TRY_LINE_B, FIELD_H);

  // --- markings: thin white lines, no painted numbers ---
  g.fillStyle = '#eef0e6';
  g.fillRect(left + DEAD_A, top, 2, FIELD_H);
  g.fillRect(left + DEAD_B - 2, top, 2, FIELD_H);
  g.fillRect(left + TRY_LINE_A, top, 2, FIELD_H);
  g.fillRect(left + TRY_LINE_B - 2, top, 2, FIELD_H);
  g.fillRect(left + DEAD_A, top, DEAD_B - DEAD_A, 2); // touchlines
  g.fillRect(left + DEAD_A, top + FIELD_H - 2, DEAD_B - DEAD_A, 2);
  g.fillRect(left + FIELD_W / 2 - 1, top, 2, FIELD_H); // halfway
  // 10m marks as dashes rather than solid lines.
  for (let i = 1; i < 10; i++) {
    if (i === 5) continue;
    const x = left + TRY_LINE_A + i * 80;
    for (let y = 4; y < FIELD_H - 4; y += 12) {
      g.fillStyle = 'rgba(238,240,230,0.55)';
      g.fillRect(x, top + y, 1, 6);
    }
  }

  // Goal posts.
  for (const px of [TRY_LINE_A, TRY_LINE_B]) {
    const cxp = left + px;
    const cyp = top + FIELD_H / 2;
    g.fillStyle = '#f4f4ee';
    g.fillRect(cxp - 1, cyp - 30, 2, 22);
    g.fillRect(cxp - 1, cyp + 8, 2, 22);
    g.fillRect(cxp - 1, cyp - 9, 2, 18);
  }

  // --- near side: fence, embankment, a thinner crowd ---
  const nTop = top + FIELD_H;
  g.fillStyle = '#347a38';
  g.fillRect(0, nTop, W, 6);
  drawFence(g, 0, W, nTop + 6);
  g.fillStyle = '#2c6630';
  g.fillRect(0, nTop + 12, W, 40);
  drawCrowd(g, 0, W, nTop + 14, 5, 0.2, 47);
  g.fillStyle = '#245026'; // grass bank falling away to the car park
  g.fillRect(0, nTop + 52, W, 30);
  g.fillStyle = '#1b3a1e';
  g.fillRect(0, nTop + 82, W, NEAR_H - 82);
  return c;
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
