import { Game } from './game.ts';
import { VIEW_H, VIEW_W } from './constants.ts';

const canvas = document.getElementById('game') as HTMLCanvasElement;

// Integer-scale the 480x270 canvas to the largest multiple that fits.
function resize(): void {
  const scale = Math.max(
    1,
    Math.floor(Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H)),
  );
  const fit = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  const s = fit < 1 ? fit : scale;
  canvas.style.width = `${VIEW_W * s}px`;
  canvas.style.height = `${VIEW_H * s}px`;
}
resize();
window.addEventListener('resize', resize);

// Android fullscreen on first tap; iOS ignores this and that's fine.
canvas.addEventListener(
  'pointerdown',
  () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  },
  { once: true },
);

const game = new Game(canvas);

// Debug/e2e handle.
declare global {
  interface Window {
    __RL86__: {
      phase: () => string;
      frame: () => number;
      score: () => [number, number];
      pressStart: () => void;
      pressPass: () => void;
      sprites: () => unknown;
    };
  }
}
window.__RL86__ = {
  phase: () => game.state.phase,
  frame: () => game.frame,
  score: () => [...game.state.score] as [number, number],
  pressStart: () => game.pressStart(),
  pressPass: () => game.pressPass(),
  sprites: () => game.spriteSets(),
};
