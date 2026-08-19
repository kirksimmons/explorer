import {
  BIGHIT_KNOCKON_CHANCE,
  BUMP_ONFIRE_BONUS,
  BUMP_WIN_CHANCE,
  CONTACT_RADIUS,
  FIRE_STREAK_N,
  RAGDOLL_JANK_CHANCE,
  RAGDOLL_TIME,
  SHAKE_BIGHIT,
  TACKLE_KNOCKON_CHANCE,
} from '../constants.ts';
import type { MatchState, Player } from '../types.ts';
import { rand } from './rng.ts';
import { dist } from './rules.ts';

export type ContactResult = 'none' | 'bumped' | 'tackled' | 'knockOn';

// Contact between the carrier and the nearest defender in range. A sprinting
// carrier fends: win = defender ragdolls ("BIG HIT!"), lose = tackled anyway.
export function resolveContact(s: MatchState, sprintHeld: boolean): ContactResult {
  const carrierId = s.ball.carrier;
  if (carrierId === null) return 'none';
  const carrier = s.players[carrierId];
  let tackler: Player | null = null;
  let best = CONTACT_RADIUS;
  for (const p of s.players) {
    if (p.team === carrier.team || p.state !== 'run') continue;
    const d = dist(p.pos, carrier.pos);
    if (d < best) {
      tackler = p;
      best = d;
    }
  }
  if (!tackler) return 'none';

  if (sprintHeld && (carrier.turbo > 0 || carrier.onFire)) {
    const chance = BUMP_WIN_CHANCE + (carrier.onFire ? BUMP_ONFIRE_BONUS : 0);
    if (rand(s) < chance) {
      ragdoll(s, tackler, carrier);
      s.shake = SHAKE_BIGHIT;
      s.events.push({ type: 'bigHit' });
      carrier.fireStreak++;
      if (carrier.fireStreak >= FIRE_STREAK_N && !carrier.onFire) {
        carrier.onFire = true;
        s.events.push({ type: 'onFire', playerId: carrier.id });
      }
      return 'bumped';
    }
    carrier.turbo = 0; // failed fend dumps the tank
  }

  const knockOnChance = sprintTackler(tackler)
    ? BIGHIT_KNOCKON_CHANCE
    : TACKLE_KNOCKON_CHANCE;
  if (rand(s) < knockOnChance) {
    s.events.push({ type: 'knockOn' });
    return 'knockOn';
  }
  return 'tackled';
}

function sprintTackler(t: Player): boolean {
  return Math.hypot(t.vel.x, t.vel.y) > 100;
}

function ragdoll(s: MatchState, victim: Player, from: Player): void {
  const dx = victim.pos.x - from.pos.x;
  const dy = victim.pos.y - from.pos.y;
  const d = Math.hypot(dx, dy) || 1;
  victim.state = 'ragdoll';
  victim.stateTimer = RAGDOLL_TIME;
  victim.vel.x = (dx / d) * 180;
  victim.vel.y = (dy / d) * 180;
  victim.jank = rand(s) < RAGDOLL_JANK_CHANCE;
}
