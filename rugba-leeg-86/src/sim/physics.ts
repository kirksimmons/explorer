import {
  KICK_BOUNCE_JANK,
  KICK_GRAVITY,
  PASS_SPEED,
  PLAYER_ACCEL,
} from '../constants.ts';
import type { MatchState, Vec2 } from '../types.ts';
import { rand } from './rng.ts';
import { clampToField } from './rules.ts';

// Advance every player: ragdolls tumble, runners chase their desired velocity.
export function stepPlayers(s: MatchState, desired: Vec2[], dt: number): void {
  for (const p of s.players) {
    if (p.state === 'ragdoll') {
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      // Jank ragdolls barely slow down and slide comically far. A feature.
      const friction = p.jank ? 0.2 : 4;
      p.vel.x -= p.vel.x * Math.min(1, friction * dt);
      p.vel.y -= p.vel.y * Math.min(1, friction * dt);
      p.stateTimer -= dt;
      if (p.stateTimer <= 0) {
        p.state = 'gettingUp';
        p.stateTimer = 0.5;
        p.vel.x = 0;
        p.vel.y = 0;
      }
    } else if (p.state === 'gettingUp') {
      p.stateTimer -= dt;
      if (p.stateTimer <= 0) p.state = 'run';
    } else {
      const d = desired[p.id];
      const k = Math.min(1, PLAYER_ACCEL * dt);
      p.vel.x += (d.x - p.vel.x) * k;
      p.vel.y += (d.y - p.vel.y) * k;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
    }
    clampToField(p.pos);
  }
}

// Advance the ball: glued to carrier, homing pass, or punt with bounce jank.
export function stepBall(s: MatchState, dt: number): void {
  const b = s.ball;
  if (b.carrier !== null) {
    const c = s.players[b.carrier];
    b.pos.x = c.pos.x;
    b.pos.y = c.pos.y;
    b.z = 0;
    return;
  }
  if (b.inFlight === 'pass' && b.passTarget !== null) {
    const t = s.players[b.passTarget].pos;
    const dx = t.x - b.pos.x;
    const dy = t.y - b.pos.y;
    const d = Math.hypot(dx, dy);
    if (d < PASS_SPEED * dt + 4) {
      b.pos.x = t.x;
      b.pos.y = t.y;
      b.carrier = b.passTarget;
      b.inFlight = null;
      b.passTarget = null;
    } else {
      b.pos.x += (dx / d) * PASS_SPEED * dt;
      b.pos.y += (dy / d) * PASS_SPEED * dt;
    }
    return;
  }
  if (b.inFlight === 'kick') {
    b.pos.x += b.vel.x * dt;
    b.pos.y += b.vel.y * dt;
    b.z += b.vz * dt;
    b.vz -= KICK_GRAVITY * dt;
    if (b.z <= 0 && b.vz < 0) {
      b.z = 0;
      b.vz = -b.vz * 0.5;
      // The oval bounce: deflect unpredictably, slow down.
      b.vel.x = b.vel.x * 0.6 + (rand(s) - 0.5) * KICK_BOUNCE_JANK;
      b.vel.y = b.vel.y * 0.6 + (rand(s) - 0.5) * KICK_BOUNCE_JANK;
      if (b.vz < 30) {
        b.vz = 0;
        b.inFlight = null; // rolling loose ball, ready for pickup
      }
    }
  }
}
