import { Audio86 } from './audio.ts';
import { SIM_DT } from './constants.ts';
import { Input } from './input.ts';
import { screenDirToWorld } from './render/camera.ts';
import { Renderer } from './render/renderer.ts';
import { createMatch, step } from './sim/match.ts';
import type { MatchState } from './types.ts';

export class Game {
  state: MatchState;
  frame = 0;
  private input: Input;
  private renderer: Renderer;
  private audio: Audio86;
  private acc = 0;
  private last = 0;
  private injectedPass = false;
  private injectedStart = false;

  constructor(canvas: HTMLCanvasElement) {
    this.state = createMatch(86);
    this.input = new Input(canvas);
    this.renderer = new Renderer(canvas);
    this.audio = new Audio86();
    canvas.addEventListener('pointerdown', () => this.audio.unlock(), { once: false });
    window.addEventListener('keydown', (e) => {
      this.audio.unlock();
      if (e.key === 'v') this.renderer.toggleCrt();
      if (e.key === 'm') this.audio.toggleMute();
    });
    requestAnimationFrame(this.loop);
  }

  // e2e/debug hooks.
  pressStart(): void {
    this.injectedStart = true;
  }
  // Debug hook: lets the sprite sheet be inspected at zoom.
  spriteSets(): unknown {
    return this.renderer.spriteSets();
  }
  pressPass(): void {
    this.injectedPass = true;
  }

  private loop = (now: number): void => {
    const dtMs = Math.min(100, this.last ? now - this.last : 16);
    this.last = now;
    this.acc += dtMs / 1000;

    const inp = this.input.read();
    if (this.injectedStart) {
      inp.startPressed = true;
      this.injectedStart = false;
    }
    if (this.injectedPass) {
      inp.passPressed = true;
      this.injectedPass = false;
    }

    // The stick is screen-relative: under the iso camera "up" must mean up the
    // screen, so rotate it into world space here. The sim only ever sees plain
    // world-space input, which keeps it deterministic and camera-agnostic.
    if (inp.moveX || inp.moveY) {
      const mag = Math.min(1, Math.hypot(inp.moveX, inp.moveY));
      const w = screenDirToWorld(inp.moveX, inp.moveY);
      inp.moveX = w.x * mag;
      inp.moveY = w.y * mag;
    }

    while (this.acc >= SIM_DT) {
      step(this.state, inp, SIM_DT);
      // Edge-triggered inputs fire on the first sim tick only.
      inp.passPressed = false;
      inp.kickPressed = false;
      inp.startPressed = false;
      this.acc -= SIM_DT;
    }

    const events = this.state.events;
    if (events.length) {
      this.renderer.pushEvents(events);
      this.audio.handle(events);
      this.state.events = [];
    }
    this.audio.tick(dtMs / 1000);
    this.renderer.draw(this.state, this.input, dtMs / 1000);
    this.frame++;
    requestAnimationFrame(this.loop);
  };
}
