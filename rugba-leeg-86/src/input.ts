import { VIEW_H, VIEW_W } from './constants.ts';
import type { InputState } from './types.ts';

// On-canvas touch control hitboxes, in internal pixels.
export const BTN_PASS = { x: 400, y: 232, r: 20 };
export const BTN_SPRINT = { x: 448, y: 210, r: 20 };
export const BTN_KICK = { x: 420, y: 176, r: 16 };
export const STICK_MAX = 24;

interface Pointer {
  id: number;
  role: 'stick' | 'pass' | 'sprint' | 'kick' | 'tap';
  originX: number;
  originY: number;
  x: number;
  y: number;
}

// Merges touch + keyboard into one InputState per frame. Pass/kick/start are
// edge-triggered: latched on the event, cleared when read.
export class Input {
  stickX = 0;
  stickY = 0;
  private pointers = new Map<number, Pointer>();
  private keys = new Set<string>();
  private passLatch = false;
  private kickLatch = false;
  private startLatch = false;

  constructor(private canvas: HTMLCanvasElement) {
    canvas.addEventListener('pointerdown', this.down);
    canvas.addEventListener('pointermove', this.move);
    canvas.addEventListener('pointerup', this.up);
    canvas.addEventListener('pointercancel', this.up);
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.key.toLowerCase());
      if (e.key === 'z' || e.key === 'j') this.passLatch = true;
      if (e.key === 'c' || e.key === 'l') this.kickLatch = true;
      if (e.key === 'Enter' || e.key === ' ') this.startLatch = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
  }

  private toInternal(e: PointerEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * VIEW_W,
      y: ((e.clientY - r.top) / r.height) * VIEW_H,
    };
  }

  private down = (e: PointerEvent): void => {
    e.preventDefault();
    const { x, y } = this.toInternal(e);
    let role: Pointer['role'] = 'tap';
    if (Math.hypot(x - BTN_PASS.x, y - BTN_PASS.y) < BTN_PASS.r) {
      role = 'pass';
      this.passLatch = true;
    } else if (Math.hypot(x - BTN_SPRINT.x, y - BTN_SPRINT.y) < BTN_SPRINT.r) {
      role = 'sprint';
    } else if (Math.hypot(x - BTN_KICK.x, y - BTN_KICK.y) < BTN_KICK.r + 6) {
      role = 'kick';
      this.kickLatch = true;
    } else if (x < VIEW_W / 2) {
      role = 'stick';
    }
    this.startLatch = true;
    this.pointers.set(e.pointerId, { id: e.pointerId, role, originX: x, originY: y, x, y });
  };

  private move = (e: PointerEvent): void => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const { x, y } = this.toInternal(e);
    p.x = x;
    p.y = y;
  };

  private up = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
  };

  read(): InputState {
    let moveX = 0;
    let moveY = 0;
    let sprintHeld = false;
    for (const p of this.pointers.values()) {
      if (p.role === 'stick') {
        moveX = Math.max(-1, Math.min(1, (p.x - p.originX) / STICK_MAX));
        moveY = Math.max(-1, Math.min(1, (p.y - p.originY) / STICK_MAX));
      }
      if (p.role === 'sprint') sprintHeld = true;
    }
    if (this.keys.has('arrowleft') || this.keys.has('a')) moveX = -1;
    if (this.keys.has('arrowright') || this.keys.has('d')) moveX = 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) moveY = -1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) moveY = 1;
    if (this.keys.has('x') || this.keys.has('k')) sprintHeld = true;

    const out: InputState = {
      moveX,
      moveY,
      sprintHeld,
      passPressed: this.passLatch,
      kickPressed: this.kickLatch,
      startPressed: this.startLatch,
    };
    this.passLatch = false;
    this.kickLatch = false;
    this.startLatch = false;
    return out;
  }

  // Active stick pointer, for drawing the thumb nub.
  stickPointer(): { ox: number; oy: number; x: number; y: number } | null {
    for (const p of this.pointers.values()) {
      if (p.role === 'stick') return { ox: p.originX, oy: p.originY, x: p.x, y: p.y };
    }
    return null;
  }

  sprintTouchHeld(): boolean {
    for (const p of this.pointers.values()) if (p.role === 'sprint') return true;
    return false;
  }
}
