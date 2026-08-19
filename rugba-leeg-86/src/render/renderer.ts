import {
  DEAD_A,
  DEAD_B,
  FIELD_H,
  FIELD_W,
  FIELD_Y,
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
import { buildBall, buildSprites, SPRITE_H, SPRITE_W, type SpriteSet } from './sprites.ts';

interface Popup {
  text: string;
  t: number;
}

const POPUP_TIME = 1.4;

export class Renderer {
  private g: CanvasRenderingContext2D;
  private field: HTMLCanvasElement;
  private scanlines: HTMLCanvasElement;
  private sprites: [SpriteSet, SpriteSet];
  private ballSprite: HTMLCanvasElement;
  private camX = 0;
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

    g.fillStyle = '#101018';
    g.fillRect(0, 0, VIEW_W, VIEW_H);

    if (s.phase === 'title') {
      this.drawTitle(g);
      if (this.crt) g.drawImage(this.scanlines, 0, 0);
      return;
    }

    // Camera follows the ball; shake on top.
    const targetX = Math.max(0, Math.min(FIELD_W - VIEW_W, s.ball.pos.x - VIEW_W / 2));
    this.camX += (targetX - this.camX) * Math.min(1, 5 * dt);
    // Visual-only randomness — never the sim's seeded RNG.
    const shakeX = s.shake ? (Math.random() - 0.5) * 2 * s.shake : 0;
    const shakeY = s.shake ? (Math.random() - 0.5) * 2 * s.shake : 0;
    const cx = Math.round(this.camX + shakeX);
    const cy = Math.round(shakeY);

    g.drawImage(this.field, -cx, FIELD_Y - 44 + cy);

    // Players back-to-front with a soft depth scale (lower on screen = nearer).
    const byY = [...s.players].sort((a, b) => a.pos.y - b.pos.y);
    for (const p of byY) {
      const set = this.sprites[p.team];
      const flicker = p.onFire && Math.floor(this.anim * 10) % 2 === 0;
      const frames = set[flicker ? 1 : 0];
      const moving = Math.hypot(p.vel.x, p.vel.y) > 10;
      const frame = moving ? Math.floor(this.anim * 10 + p.id) % 4 : 0;
      const spr = frames[p.state === 'run' ? frame : 0];
      const depth = 0.8 + 0.4 * (p.pos.y / FIELD_H);
      const w = SPRITE_W * depth;
      const h = SPRITE_H * depth;
      const fx = p.pos.x - cx; // feet position on screen
      const fy = p.pos.y + FIELD_Y + cy + 2;
      // Marker under the controlled player: red ellipse, ARL style.
      if (p.id === s.controlledId) {
        g.fillStyle = 'rgba(220,40,40,0.55)';
        g.beginPath();
        g.ellipse(fx, fy - 1, 9 * depth, 3.5 * depth, 0, 0, Math.PI * 2);
        g.fill();
      }
      // Shadow.
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(fx, fy - 1, 6 * depth, 2 * depth, 0, 0, Math.PI * 2);
      g.fill();
      const x = Math.round(fx - w / 2);
      const y = Math.round(fy - h);
      if (p.state === 'ragdoll' || p.state === 'gettingUp') {
        g.save();
        g.translate(fx, fy - h / 2);
        g.rotate(p.state === 'ragdoll' ? this.anim * 12 : Math.PI / 4);
        g.drawImage(spr, -w / 2, -h / 2, w, h);
        g.restore();
      } else if (p.vel.x < -5) {
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
        g.strokeText(num, fx, fy + 8);
        g.fillText(num, fx, fy + 8);
      }
    }

    // Ball: tucked under the carrier's arm, or loose with a shadow.
    if (s.ball.carrier !== null) {
      const c = s.players[s.ball.carrier];
      g.drawImage(
        this.ballSprite,
        Math.round(c.pos.x - cx + (c.vel.x < -5 ? -7 : 2)),
        Math.round(c.pos.y + FIELD_Y + cy - 7),
      );
    } else {
      const bx = Math.round(s.ball.pos.x - cx - 3);
      const by = Math.round(s.ball.pos.y + FIELD_Y + cy - 2);
      g.fillStyle = 'rgba(0,0,0,0.4)';
      g.fillRect(bx + 1, by + 1, 4, 2);
      g.drawImage(this.ballSprite, bx, by - Math.round(s.ball.z * 0.4));
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

// The whole scene pre-rendered once: grandstand + hoardings above, EA-style
// checkerboard/speckle turf, painted 10m numbers, midfield decal, posts.
function buildField(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = FIELD_W;
  c.height = FIELD_H + 70;
  const g = c.getContext('2d')!;
  const top = 44; // grandstand band height; turf starts here

  // Grandstand: roof, dithered crowd rows, aisle pillars.
  g.fillStyle = '#9a9aa6';
  g.fillRect(0, 0, FIELD_W, 5); // roofline
  g.fillStyle = '#23233a';
  g.fillRect(0, 5, FIELD_W, top - 15);
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = ['#c8b06a', '#b05050', '#5070b0', '#909098', '#6a5a8a', '#d0d0c0'][i % 6];
    g.fillRect((i * 137) % FIELD_W, ((i * 61) % (top - 22)) + 6, 1, 1);
  }
  g.fillStyle = '#3a3a52';
  for (let x = 60; x < FIELD_W; x += 120) g.fillRect(x, 5, 3, top - 15);

  // Sponsor hoardings.
  g.fillStyle = '#f0f0e8';
  g.fillRect(0, top - 10, FIELD_W, 10);
  g.font = 'bold 8px monospace';
  g.textAlign = 'left';
  g.fillStyle = '#111';
  const sponsors = ['LEEG SPORTS', 'JANK COLA', 'BEEF-O-MATIC', 'GRIFT BANK', 'RUGBA 86'];
  for (let x = 8, i = 0; x < FIELD_W; x += 120, i++) {
    g.fillText(sponsors[i % sponsors.length], x, top - 2.5);
  }

  // Turf: big checkerboard + speckle dither, ARL style.
  for (let x = 0; x < FIELD_W; x += 40) {
    for (let y = 0; y < FIELD_H; y += 40) {
      g.fillStyle = ((x + y) / 40) % 2 ? '#2f8a2f' : '#297b29';
      g.fillRect(x, top + y, 40, Math.min(40, FIELD_H - y));
    }
  }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = i % 2 ? '#37993a' : '#226622';
    g.fillRect((i * 137) % FIELD_W, ((i * 61) % FIELD_H) + top, 1, 1);
  }
  // In-goal areas tinted.
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.fillRect(DEAD_A, top, TRY_LINE_A - DEAD_A, FIELD_H);
  g.fillRect(TRY_LINE_B, top, DEAD_B - TRY_LINE_B, FIELD_H);

  // Midfield decal: gold shield with the ball.
  const mx = FIELD_W / 2;
  const my = top + FIELD_H / 2;
  g.fillStyle = 'rgba(232,185,62,0.85)';
  g.beginPath();
  g.ellipse(mx, my, 30, 18, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1a1a1a';
  g.beginPath();
  g.ellipse(mx, my, 26, 14, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#e8b93e';
  g.font = 'bold 9px monospace';
  g.textAlign = 'center';
  g.fillText('RUGBA', mx, my - 2);
  g.fillText('LEEG 86', mx, my + 8);

  // Lines: dead-ball, try, 10m stripes with big painted numbers.
  g.fillStyle = '#e8e8d0';
  g.fillRect(DEAD_A, top, 2, FIELD_H);
  g.fillRect(DEAD_B - 2, top, 2, FIELD_H);
  g.fillRect(TRY_LINE_A, top, 3, FIELD_H);
  g.fillRect(TRY_LINE_B - 3, top, 3, FIELD_H);
  for (let i = 1; i < 10; i++) {
    const x = TRY_LINE_A + i * 80;
    g.fillStyle = 'rgba(232,232,208,0.8)';
    g.fillRect(x, top, 1, FIELD_H);
    const label = `${i <= 5 ? i * 10 : (10 - i) * 10}`;
    g.font = 'bold 24px monospace';
    g.fillStyle = 'rgba(232,232,208,0.4)';
    g.fillText(label, x, top + 34);
    g.fillText(label, x, top + FIELD_H - 16);
  }

  // Posts at each try line.
  for (const px of [TRY_LINE_A, TRY_LINE_B]) {
    g.fillStyle = '#f0f0f0';
    g.fillRect(px - 1, top + FIELD_H / 2 - 26, 2, 20);
    g.fillRect(px - 1, top + FIELD_H / 2 + 6, 2, 20);
    g.fillRect(px - 1, top + FIELD_H / 2 - 8, 2, 16);
  }

  // Below-field apron.
  g.fillStyle = '#14141c';
  g.fillRect(0, top + FIELD_H, FIELD_W, 30);
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
