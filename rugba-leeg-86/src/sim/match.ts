import {
  FIELD_H,
  HALF_LENGTH,
  HUMAN_TEAM,
  PICKUP_RADIUS,
  PLAY_THE_BALL_TIME,
  POINTS_CONVERSION,
  POINTS_DROP_GOAL,
  POINTS_TRY,
  SHAKE_TACKLE,
  SHAKE_TRY,
  TACKLES_PER_SET,
  TACKLE_HITSTOP,
  TURBO_DRAIN,
  TURBO_MAX,
  TURBO_REGEN,
  CONVERSION_SWEEP_SPEED,
} from '../constants.ts';
import type {
  HandoverReason,
  InputState,
  MatchState,
  Player,
  Vec2,
} from '../types.ts';
import { computeAi } from './ai.ts';
import {
  conversionZone,
  dropGoalZone,
  kickAvailable,
  meterSuccess,
  startPunt,
} from './kicking.ts';
import { selectPassTarget } from './passing.ts';
import { stepBall, stepPlayers } from './physics.ts';
import { attackDir, dist, inTouch, isDeadBall, isTry } from './rules.ts';
import { pickControlled } from './switch.ts';
import { resolveContact } from './tackle.ts';

export function createMatch(seed: number): MatchState {
  const players: Player[] = [];
  for (let id = 0; id < 14; id++) {
    players.push({
      id,
      team: id < 7 ? 0 : 1,
      pos: { x: 500, y: FIELD_H / 2 },
      vel: { x: 0, y: 0 },
      state: 'run',
      stateTimer: 0,
      turbo: TURBO_MAX,
      fireStreak: 0,
      onFire: false,
      jank: false,
    });
  }
  return {
    phase: 'title',
    phaseTimer: 0,
    players,
    ball: { pos: { x: 500, y: FIELD_H / 2 }, z: 0, vz: 0, vel: { x: 0, y: 0 }, carrier: null, inFlight: null, passTarget: null },
    score: [0, 0],
    tackleCount: 0,
    attackingTeam: HUMAN_TEAM,
    mark: { x: 500, y: FIELD_H / 2 },
    clock: 0,
    half: 1,
    clockExpired: false,
    controlledId: 0,
    rngState: seed | 0,
    shake: 0,
    events: [],
    meterT: 0,
    meterDir: 1,
    meterKind: null,
    meterZone: 0,
  };
}

// Line both teams up and give the ball to the receiving team's deepest player.
export function setupKickoff(s: MatchState, receiving: 0 | 1): void {
  const dir = attackDir(receiving);
  for (const p of s.players) {
    const i = p.id % 7;
    const y = (FIELD_H / 8) * (i + 1);
    const own = p.team === receiving ? 500 - dir * 200 : 500 + dir * 150;
    p.pos = { x: own, y };
    p.vel = { x: 0, y: 0 };
    p.state = 'run';
    p.stateTimer = 0;
    p.onFire = p.onFire && p.team === receiving ? p.onFire : false;
    p.fireStreak = p.team === receiving ? p.fireStreak : 0;
  }
  const receiver = s.players.find((p) => p.team === receiving && p.id % 7 === 3)!;
  s.ball = { pos: { ...receiver.pos }, z: 0, vz: 0, vel: { x: 0, y: 0 }, carrier: receiver.id, inFlight: null, passTarget: null };
  s.attackingTeam = receiving;
  s.tackleCount = 0;
  s.phase = 'kickoff';
  s.phaseTimer = 1.2;
  s.controlledId = pickControlled(s);
  s.events.push({ type: 'whistle' });
}

function handover(s: MatchState, reason: HandoverReason, spot: Vec2): void {
  s.attackingTeam = s.attackingTeam === 0 ? 1 : 0;
  s.tackleCount = 0;
  s.mark = {
    x: Math.max(120, Math.min(880, spot.x)),
    y: Math.max(20, Math.min(FIELD_H - 20, spot.y)),
  };
  s.ball.inFlight = null;
  s.ball.passTarget = null;
  s.ball.carrier = null;
  s.ball.pos = { ...s.mark };
  s.ball.z = 0;
  s.events.push({ type: 'handover', reason }, { type: 'whistle' });
  enterPlayTheBall(s);
}

function enterPlayTheBall(s: MatchState): void {
  if (s.clockExpired) {
    endHalf(s);
    return;
  }
  s.phase = 'playTheBall';
  s.phaseTimer = PLAY_THE_BALL_TIME;
}

function endHalf(s: MatchState): void {
  if (s.half === 1) {
    s.phase = 'halftime';
    s.events.push({ type: 'halftime' }, { type: 'whistle' });
  } else {
    s.phase = 'fulltime';
    s.events.push({ type: 'fulltime' }, { type: 'whistle' });
  }
}

// Ball pops to the dummy half: nearest teammate behind the mark, else the mark.
function finishPlayTheBall(s: MatchState): void {
  const dir = attackDir(s.attackingTeam);
  let dummy: Player | null = null;
  let best = Infinity;
  for (const p of s.players) {
    if (p.team !== s.attackingTeam || p.state !== 'run') continue;
    if (dir * (p.pos.x - s.mark.x) > 4) continue;
    const d = dist(p.pos, s.mark);
    if (d < best) {
      best = d;
      dummy = p;
    }
  }
  const receiver = dummy ?? s.players.find((p) => p.team === s.attackingTeam)!;
  s.ball.carrier = receiver.id;
  s.ball.pos = { ...receiver.pos };
  s.phase = 'openPlay';
  s.controlledId = pickControlled(s);
  if (s.tackleCount === TACKLES_PER_SET - 1) s.events.push({ type: 'lastTackle' });
}

function startMeter(s: MatchState, kind: 'conversion' | 'dropGoal', zone: number): void {
  s.phase = 'kickMeter';
  s.meterKind = kind;
  s.meterZone = zone;
  s.meterT = 0;
  s.meterDir = 1;
}

function anyPressed(input: InputState): boolean {
  return input.passPressed || input.kickPressed || input.startPressed;
}

export function step(s: MatchState, input: InputState, dt: number): void {
  s.shake = Math.max(0, s.shake - s.shake * 6 * dt);

  switch (s.phase) {
    case 'title':
      if (input.startPressed) {
        const fresh = createMatch(s.rngState);
        Object.assign(s, fresh, { events: s.events });
        setupKickoff(s, HUMAN_TEAM);
      }
      return;

    case 'kickoff':
      s.phaseTimer -= dt;
      if (s.phaseTimer <= 0) s.phase = 'openPlay';
      return;

    case 'tackleMade':
      s.phaseTimer -= dt;
      if (s.phaseTimer <= 0) enterPlayTheBall(s);
      return;

    case 'playTheBall': {
      const { desired } = computeAi(s, input);
      stepPlayers(s, desired, dt);
      s.phaseTimer -= dt;
      if (s.phaseTimer <= 0) finishPlayTheBall(s);
      return;
    }

    case 'try':
      s.phaseTimer -= dt;
      if (s.phaseTimer <= 0) {
        startMeter(s, 'conversion', conversionZone(s.mark.y));
      }
      return;

    case 'kickMeter': {
      s.meterT += s.meterDir * CONVERSION_SWEEP_SPEED * dt;
      if (s.meterT >= 1) {
        s.meterT = 1;
        s.meterDir = -1;
      } else if (s.meterT <= 0) {
        s.meterT = 0;
        s.meterDir = 1;
      }
      if (anyPressed(input)) {
        const good = meterSuccess(s.meterT, s.meterZone);
        const points = s.meterKind === 'conversion' ? POINTS_CONVERSION : POINTS_DROP_GOAL;
        const kicker = s.attackingTeam;
        if (good) {
          s.score[kicker] += points;
          s.events.push({ type: 'kickGood', points });
        } else {
          s.events.push({ type: 'kickMissed' });
        }
        s.meterKind = null;
        if (s.clockExpired) {
          endHalf(s);
        } else {
          setupKickoff(s, kicker === 0 ? 1 : 0);
        }
      }
      return;
    }

    case 'halftime':
      if (input.startPressed) {
        s.half = 2;
        s.clock = 0;
        s.clockExpired = false;
        setupKickoff(s, HUMAN_TEAM === 0 ? 1 : 0);
      }
      return;

    case 'fulltime':
      if (input.startPressed) {
        const fresh = createMatch(s.rngState);
        Object.assign(s, fresh, { events: s.events });
      }
      return;

    case 'openPlay':
      break; // falls through to open play below
  }

  // ---- open play ----
  s.clock += dt;
  if (s.clock >= HALF_LENGTH) s.clockExpired = true;

  const { desired, aiPass, aiKick } = computeAi(s, input);
  stepPlayers(s, desired, dt);

  const carrierId = s.ball.carrier;
  const carrier = carrierId !== null ? s.players[carrierId] : null;
  const humanHasBall = carrier !== null && carrier.id === s.controlledId;

  // Turbo drain/regen for the controlled player; AI players regen slowly.
  for (const p of s.players) {
    const sprinting = p.id === s.controlledId && input.sprintHeld;
    if (sprinting && !p.onFire) {
      p.turbo = Math.max(0, p.turbo - TURBO_DRAIN * dt);
    } else {
      p.turbo = Math.min(TURBO_MAX, p.turbo + TURBO_REGEN * dt);
    }
  }

  // Pass.
  const wantPass = humanHasBall ? input.passPressed : aiPass;
  if (carrier && wantPass && !s.ball.inFlight) {
    const target = selectPassTarget(s);
    if (target !== null) {
      s.ball.carrier = null;
      s.ball.inFlight = 'pass';
      s.ball.passTarget = target;
      s.events.push({ type: 'pass' });
    }
  }

  // Kick.
  const kickKind = kickAvailable(s);
  const wantKick = humanHasBall ? input.kickPressed : aiKick;
  if (carrier && wantKick && kickKind && !s.ball.inFlight) {
    if (kickKind === 'dropGoal' && humanHasBall) {
      startMeter(s, 'dropGoal', dropGoalZone());
      return;
    }
    startPunt(s);
  }

  stepBall(s, dt);

  // Re-read the carrier: a pass may have just arrived.
  const cId = s.ball.carrier;
  const c = cId !== null ? s.players[cId] : null;
  if (cId !== null && cId !== carrierId) {
    // Possession moved (pass caught or pickup) — maybe handover, re-aim control.
    if (c!.team !== s.attackingTeam) {
      handover(s, 'kickCaught', c!.pos);
      return;
    }
    s.controlledId = pickControlled(s);
  }

  if (c) {
    // Try?
    if (isTry(c.pos, c.team)) {
      s.score[c.team] += POINTS_TRY;
      s.events.push({ type: 'try', team: c.team });
      s.shake = SHAKE_TRY;
      c.fireStreak++;
      s.mark = { ...c.pos };
      s.attackingTeam = c.team;
      s.phase = 'try';
      s.phaseTimer = 1.5;
      return;
    }
    // Carrier into touch?
    if (inTouch(c.pos)) {
      handover(s, 'touch', c.pos);
      return;
    }
    // Contact.
    const result = resolveContact(s, s.controlledId === c.id && input.sprintHeld);
    if (result === 'tackled' || result === 'knockOn') {
      c.fireStreak = 0;
      c.onFire = false;
      c.vel = { x: 0, y: 0 };
      s.mark = { ...c.pos };
      if (result === 'knockOn') {
        handover(s, 'knockOn', c.pos);
        return;
      }
      s.tackleCount++;
      s.events.push({ type: 'tackle' });
      s.shake = Math.max(s.shake, SHAKE_TACKLE);
      if (s.tackleCount >= TACKLES_PER_SET) {
        handover(s, 'sixthTackle', c.pos);
        return;
      }
      s.phase = 'tackleMade';
      s.phaseTimer = TACKLE_HITSTOP;
      return;
    }
  } else if (!s.ball.inFlight) {
    // Loose ball on the ground: nearest player in range picks it up.
    for (const p of s.players) {
      if (p.state !== 'run') continue;
      if (dist(p.pos, s.ball.pos) < PICKUP_RADIUS) {
        if (p.team !== s.attackingTeam) {
          handover(s, 'kickCaught', p.pos);
        } else {
          s.ball.carrier = p.id;
          s.controlledId = pickControlled(s);
        }
        return;
      }
    }
  } else if (s.ball.inFlight === 'kick') {
    // Kicked ball out of play?
    if (inTouch(s.ball.pos) || isDeadBall(s.ball.pos.x)) {
      handover(s, 'touch', s.ball.pos);
    }
  }
}
