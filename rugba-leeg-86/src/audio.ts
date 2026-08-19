import type { SimEvent } from './types.ts';

// All sound is WebAudio-synthesized — no files, nothing to load.
export class Audio86 {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private excitement = 0;
  muted = false;

  // Call from the first user gesture (iOS requires it).
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.startCrowd();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
  }

  handle(events: SimEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'whistle':
          this.whistle();
          break;
        case 'tackle':
          this.thud(false);
          break;
        case 'bigHit':
          this.thud(true);
          this.excite(0.6);
          break;
        case 'pass':
          this.whoosh();
          break;
        case 'kick':
          this.whoosh();
          break;
        case 'try':
          this.fanfare();
          this.excite(1);
          break;
        case 'kickGood':
          this.fanfare();
          break;
        case 'onFire':
          this.fanfare();
          this.excite(0.8);
          break;
        default:
          break;
      }
    }
  }

  tick(dt: number): void {
    this.excitement = Math.max(0, this.excitement - dt * 0.25);
    if (this.crowdGain) this.crowdGain.gain.value = 0.05 + this.excitement * 0.2;
  }

  private excite(v: number): void {
    this.excitement = Math.min(1, this.excitement + v);
  }

  private env(dur: number, peak: number): GainNode | null {
    if (!this.ctx || !this.master) return null;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    g.connect(this.master);
    return g;
  }

  private whistle(): void {
    if (!this.ctx) return;
    const g = this.env(0.35, 0.25);
    if (!g) return;
    for (const f of [2093, 2217]) {
      const o = this.ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      o.connect(g);
      o.start();
      o.stop(this.ctx.currentTime + 0.35);
    }
  }

  private thud(big: boolean): void {
    if (!this.ctx) return;
    const g = this.env(big ? 0.3 : 0.15, big ? 0.7 : 0.4);
    if (!g) return;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    const t = this.ctx.currentTime;
    o.frequency.setValueAtTime(big ? 100 : 80, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    o.connect(g);
    o.start();
    o.stop(t + 0.3);
    // Noise crunch on top.
    const n = this.noise(0.08);
    if (n) n.connect(g);
  }

  private whoosh(): void {
    if (!this.ctx) return;
    const g = this.env(0.12, 0.15);
    if (!g) return;
    const n = this.noise(0.12);
    if (!n) return;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    const t = this.ctx.currentTime;
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(2000, t + 0.12);
    n.connect(f);
    f.connect(g);
  }

  private fanfare(): void {
    if (!this.ctx || !this.master) return;
    const notes = [523, 659, 784, 1047, 784, 1047];
    const t0 = this.ctx.currentTime;
    notes.forEach((f, i) => {
      const g = this.ctx!.createGain();
      const t = t0 + i * 0.12;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      g.connect(this.master!);
      const o = this.ctx!.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      o.connect(g);
      o.start(t);
      o.stop(t + 0.15);
    });
  }

  meterTick(): void {
    if (!this.ctx) return;
    const g = this.env(0.03, 0.1);
    if (!g) return;
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 1200;
    o.connect(g);
    o.start();
    o.stop(this.ctx.currentTime + 0.03);
  }

  private noise(dur: number): AudioBufferSourceNode | null {
    if (!this.ctx) return null;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.start();
    return src;
  }

  private startCrowd(): void {
    if (!this.ctx || !this.master) return;
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // Cheap pink-ish noise: heavy lowpass on white.
      last = last * 0.97 + (Math.random() * 2 - 1) * 0.03;
      data[i] = last * 8;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.value = 0.05;
    src.connect(this.crowdGain);
    this.crowdGain.connect(this.master);
    src.start();
  }
}
