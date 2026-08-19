import { describe, expect, it } from 'vitest';
import {
  HALF_LENGTH,
  PLAY_THE_BALL_TIME,
  POINTS_CONVERSION,
  POINTS_TRY,
  SIM_DT,
  TACKLE_HITSTOP,
} from '../src/constants.ts';
import { createMatch, setupKickoff, step } from '../src/sim/match.ts';
import type { InputState, MatchState } from '../src/types.ts';

function inp(over: Partial<InputState> = {}): InputState {
  return {
    moveX: 0,
    moveY: 0,
    sprintHeld: false,
    passPressed: false,
    kickPressed: false,
    startPressed: false,
    ...over,
  };
}

function advance(s: MatchState, seconds: number): void {
  const n = Math.ceil(seconds / SIM_DT) + 1;
  for (let i = 0; i < n; i++) step(s, inp(), SIM_DT);
}

// Plant a defender on the carrier each tick until the contact resolves. The
// RNG is pinned to a seed whose next roll can't produce a knock-on, so the
// outcome is always a plain tackle. An AI carrier may panic-pass first; we
// keep re-planting on the new carrier until the tackle lands.
function forceTackle(s: MatchState): void {
  for (let i = 0; i < 600 && s.phase === 'openPlay'; i++) {
    if (s.ball.carrier !== null) {
      const carrier = s.players[s.ball.carrier];
      const defender = s.players.find((p) => p.team !== carrier.team && p.state === 'run')!;
      defender.pos = { ...carrier.pos };
      defender.vel = { x: 0, y: 0 };
      s.rngState = 30; // next rand() = 0.861 — never a knock-on
    }
    step(s, inp(), SIM_DT);
  }
}

describe('match state machine', () => {
  it('title -> kickoff -> openPlay', () => {
    const s = createMatch(86);
    expect(s.phase).toBe('title');
    step(s, inp({ startPressed: true }), SIM_DT);
    expect(s.phase).toBe('kickoff');
    advance(s, 1.3);
    expect(s.phase).toBe('openPlay');
    expect(s.ball.carrier).not.toBeNull();
  });

  it('tackle -> playTheBall -> openPlay, tackle count increments', () => {
    const s = createMatch(86);
    setupKickoff(s, 0);
    advance(s, 1.3);
    forceTackle(s);
    expect(s.phase).toBe('tackleMade');
    expect(s.tackleCount).toBe(1);
    advance(s, TACKLE_HITSTOP + 0.05);
    expect(s.phase).toBe('playTheBall');
    advance(s, PLAY_THE_BALL_TIME + 0.05);
    expect(s.phase).toBe('openPlay');
    expect(s.ball.carrier).not.toBeNull();
    expect(s.players[s.ball.carrier!].team).toBe(0);
  });

  it('sixth tackle hands over at the mark', () => {
    const s = createMatch(86);
    setupKickoff(s, 0);
    advance(s, 1.3);
    let guard = 0;
    while (s.attackingTeam === 0 && guard++ < 300) {
      if (s.phase === 'openPlay' && s.ball.carrier !== null) {
        forceTackle(s);
      } else {
        advance(s, 0.1);
      }
    }
    expect(s.attackingTeam).toBe(1);
    expect(s.tackleCount).toBe(0);
  });

  it('try scores 4, conversion adds 2, then the other team receives', () => {
    const s = createMatch(86);
    setupKickoff(s, 0);
    advance(s, 1.3);
    const carrier = s.players[s.ball.carrier!];
    carrier.pos = { x: 905, y: 110 };
    step(s, inp(), SIM_DT);
    expect(s.phase).toBe('try');
    expect(s.score[0]).toBe(POINTS_TRY);
    advance(s, 1.6);
    expect(s.phase).toBe('kickMeter');
    s.meterT = 0.5; // sweet spot
    step(s, inp({ passPressed: true }), SIM_DT);
    expect(s.score[0]).toBe(POINTS_TRY + POINTS_CONVERSION);
    expect(s.phase).toBe('kickoff');
    expect(s.attackingTeam).toBe(1);
  });

  it('clock exhaustion finishes the play, then halftime, then fulltime', () => {
    const s = createMatch(86);
    setupKickoff(s, 0);
    advance(s, 1.3);
    s.clock = HALF_LENGTH;
    step(s, inp(), SIM_DT);
    expect(s.clockExpired).toBe(true);
    forceTackle(s);
    if (s.phase === 'tackleMade') advance(s, TACKLE_HITSTOP + 0.05);
    expect(s.phase).toBe('halftime');
    step(s, inp({ startPressed: true }), SIM_DT);
    expect(s.phase).toBe('kickoff');
    expect(s.half).toBe(2);
    expect(s.clock).toBe(0);
    advance(s, 1.3);
    s.clock = HALF_LENGTH;
    step(s, inp(), SIM_DT);
    forceTackle(s);
    if (s.phase === 'tackleMade') advance(s, TACKLE_HITSTOP + 0.05);
    expect(s.phase).toBe('fulltime');
  });

  it('60s AI-vs-AI soak: state stays sane, no NaN, no stuck phase', () => {
    const s = createMatch(7);
    setupKickoff(s, 1); // AI receives; human side idles
    const phases = new Set<string>();
    for (let i = 0; i < 60 * 60; i++) {
      step(s, inp(), SIM_DT);
      phases.add(s.phase);
      s.events = [];
    }
    for (const p of s.players) {
      expect(Number.isFinite(p.pos.x)).toBe(true);
      expect(Number.isFinite(p.pos.y)).toBe(true);
    }
    expect(Number.isFinite(s.ball.pos.x)).toBe(true);
    expect(phases.has('openPlay')).toBe(true);
    expect(phases.has('playTheBall')).toBe(true); // sets are being completed
  });

  it('same seed + same inputs = identical match (determinism)', () => {
    const run = (): string => {
      const s = createMatch(42);
      setupKickoff(s, 0);
      for (let i = 0; i < 600; i++) {
        step(s, inp({ moveX: 1, sprintHeld: i % 60 < 30 }), SIM_DT);
      }
      return JSON.stringify([s.players.map((p) => p.pos), s.ball.pos, s.score, s.tackleCount, s.phase]);
    };
    expect(run()).toBe(run());
  });
});
