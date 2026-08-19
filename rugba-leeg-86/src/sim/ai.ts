import {
  AI_PASS_PANIC_DIST,
  DEFENSE_LINE_OFFSET,
  DEFENSE_RETREAT_DIST,
  ONFIRE_MULT,
  PLAYER_SPEED,
  RUBBERBAND_CAP,
  RUBBERBAND_PER_POINT,
  SPRINT_MULT,
  SUPPORT_SLOT_DEPTH,
  SUPPORT_SLOT_SPACING,
  TACKLES_PER_SET,
} from '../constants.ts';
import type { InputState, MatchState, Player, Vec2 } from '../types.ts';
import { attackDir, dist, tryLineX } from './rules.ts';

export interface AiDecisions {
  desired: Vec2[];
  aiPass: boolean;
  aiKick: boolean;
}

export function speedFor(s: MatchState, p: Player, sprinting: boolean): number {
  const other = p.team === 0 ? 1 : 0;
  const band =
    1 +
    Math.max(
      -RUBBERBAND_CAP,
      Math.min(RUBBERBAND_CAP, (s.score[other] - s.score[p.team]) * RUBBERBAND_PER_POINT),
    );
  let v = PLAYER_SPEED * band;
  if (sprinting && (p.turbo > 0 || p.onFire)) v *= SPRINT_MULT;
  if (p.onFire) v *= ONFIRE_MULT;
  return v;
}

function toward(from: Vec2, to: Vec2, speed: number): Vec2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return { x: 0, y: 0 };
  return { x: (dx / d) * speed, y: (dy / d) * speed };
}

// Desired velocity for all 14 players plus the AI carrier's pass/kick calls.
export function computeAi(s: MatchState, input: InputState): AiDecisions {
  const desired: Vec2[] = s.players.map(() => ({ x: 0, y: 0 }));
  let aiPass = false;
  let aiKick = false;
  const carrierId = s.ball.carrier;
  const carrier = carrierId !== null ? s.players[carrierId] : null;
  const atkDir = attackDir(s.attackingTeam);

  // Two nearest defenders chase; remember who they are.
  const chasers = new Set<number>();
  if (carrier) {
    const defs = s.players
      .filter((p) => p.team !== s.attackingTeam && p.state === 'run')
      .sort((a, b) => dist(a.pos, carrier.pos) - dist(b.pos, carrier.pos));
    for (const d of defs.slice(0, 2)) chasers.add(d.id);
  }

  for (const p of s.players) {
    if (p.state !== 'run') continue;

    // Human-controlled player follows the stick.
    if (p.id === s.controlledId && s.phase === 'openPlay') {
      const mag = Math.hypot(input.moveX, input.moveY);
      if (mag > 0.1) {
        const v = speedFor(s, p, input.sprintHeld);
        desired[p.id] = { x: (input.moveX / mag) * v, y: (input.moveY / mag) * v };
      }
      continue;
    }

    if (p.team === s.attackingTeam) {
      if (carrier && p.id === carrierId) {
        // AI carrier: upfield, veering away from the nearest defender.
        let veerY = 0;
        let nearest = Infinity;
        for (const d of s.players) {
          if (d.team === p.team || d.state !== 'run') continue;
          const dd = dist(d.pos, p.pos);
          if (dd < nearest) {
            nearest = dd;
            veerY = p.pos.y > d.pos.y ? 1 : -1;
          }
        }
        const v = speedFor(s, p, nearest > 30);
        desired[p.id] = {
          x: atkDir * v,
          y: nearest < 40 ? veerY * v * 0.6 : 0,
        };
        if (nearest < AI_PASS_PANIC_DIST) aiPass = true;
        // Punt on the last tackle from inside its own half.
        if (s.tackleCount === TACKLES_PER_SET - 1 && atkDir * (p.pos.x - 500) < 0) {
          aiKick = true;
        }
      } else if (carrier) {
        // Support: echeloned backline slots behind the carrier.
        const mates = s.players.filter(
          (m) => m.team === p.team && m.id !== carrierId,
        );
        const idx = mates.indexOf(p);
        const side = idx % 2 === 0 ? 1 : -1;
        const rank = Math.floor(idx / 2) + 1;
        const slot = {
          x: carrier.pos.x - atkDir * SUPPORT_SLOT_DEPTH * rank,
          y: carrier.pos.y + side * SUPPORT_SLOT_SPACING * rank,
        };
        desired[p.id] = toward(p.pos, slot, speedFor(s, p, false) * 0.9);
      } else {
        // Loose ball: everyone hunts it.
        desired[p.id] = toward(p.pos, s.ball.pos, speedFor(s, p, true));
      }
    } else {
      // Defense.
      if (s.phase === 'playTheBall') {
        const retreat = {
          x: s.mark.x + atkDir * DEFENSE_RETREAT_DIST,
          y: p.pos.y,
        };
        desired[p.id] = toward(p.pos, retreat, speedFor(s, p, false));
      } else if (!carrier) {
        desired[p.id] = toward(p.pos, s.ball.pos, speedFor(s, p, true));
      } else if (chasers.has(p.id)) {
        desired[p.id] = toward(p.pos, carrier.pos, speedFor(s, p, p.turbo > 20));
      } else {
        // Hold a line goal-side of the ball, spread across the attackers.
        const goal = tryLineX(s.attackingTeam);
        let lineX = carrier.pos.x + atkDir * DEFENSE_LINE_OFFSET;
        lineX = atkDir === 1 ? Math.min(lineX, goal) : Math.max(lineX, goal);
        desired[p.id] = toward(
          p.pos,
          { x: lineX, y: nearestAttackerY(s, p) },
          speedFor(s, p, false),
        );
      }
    }
  }
  return { desired, aiPass, aiKick };
}

function nearestAttackerY(s: MatchState, defender: Player): number {
  let y = defender.pos.y;
  let best = Infinity;
  for (const a of s.players) {
    if (a.team !== s.attackingTeam || a.state !== 'run') continue;
    const d = Math.abs(a.pos.y - defender.pos.y);
    if (d < best) {
      best = d;
      y = a.pos.y;
    }
  }
  return y;
}
