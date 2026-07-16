import type { GameId } from './progress';
import type { Tier } from '../data/types';
import { TIER_1, TIER_2, TIER_3 } from '../data/tiers';
import { CONTINENT_OF } from '../data/continents';

export const ROUND_LENGTH = 5;
export const OPTION_COUNT = 4;

/**
 * Flags that look alike. In tiers 1–2 a question never mixes members of the
 * same group (a 7-year-old shouldn't face Chad vs Romania). In tier 3 the
 * flag game deliberately features them as "tricky flags".
 */
export const CONFUSABLE_FLAGS: string[][] = [
  ['TD', 'RO'],
  ['ID', 'MC', 'PL', 'SG'],
  ['IE', 'CI'],
  ['NL', 'LU'],
  ['RU', 'SI', 'SK', 'RS'],
  ['DK', 'SE', 'NO', 'FI', 'IS'],
  ['AU', 'NZ', 'FJ', 'TV'],
  ['US', 'LR', 'MY'],
  ['CO', 'EC', 'VE'],
  ['ML', 'SN', 'GN'],
  ['SV', 'HN', 'NI'],
  ['AR', 'UY'],
  ['JO', 'PS', 'SD'],
  ['AE', 'KW'],
  ['QA', 'BH'],
  ['IN', 'NE'],
  ['IT', 'MX'],
  ['CN', 'VN'],
  ['TR', 'TN'],
  ['BE', 'DE'],
];

const confusableGroupOf = new Map<string, number>();
CONFUSABLE_FLAGS.forEach((group, i) => {
  for (const iso2 of group) confusableGroupOf.set(iso2, i);
});

export function areConfusable(a: string, b: string): boolean {
  const ga = confusableGroupOf.get(a);
  return ga !== undefined && ga === confusableGroupOf.get(b);
}

/** Deterministic RNG so rounds are unit-testable. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(list: T[], rng: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface RoundQuestion {
  target: string;
  /** 4 iso2 options including the target — empty for the map game. */
  options: string[];
}

function poolFor(tier: Tier): string[] {
  if (tier === 1) return TIER_1;
  if (tier === 2) return [...TIER_1, ...TIER_2];
  return [...TIER_1, ...TIER_2, ...TIER_3];
}

/** Targets lean toward the newest unlocked tier so progress feels fresh. */
function pickTargets(tier: Tier, rng: () => number): string[] {
  const freshPool = tier === 1 ? TIER_1 : tier === 2 ? TIER_2 : TIER_3;
  const olderPool = tier === 1 ? [] : poolFor((tier - 1) as Tier);
  const fresh = shuffled(freshPool, rng).slice(0, tier === 1 ? ROUND_LENGTH : 3);
  const older = shuffled(olderPool, rng).slice(0, ROUND_LENGTH - fresh.length);
  return shuffled([...fresh, ...older], rng);
}

function pickDistractors(
  target: string,
  tier: Tier,
  game: GameId,
  rng: () => number,
): string[] {
  const pool = poolFor(tier).filter((c) => c !== target);
  const sameContinent = pool.filter((c) => CONTINENT_OF[c] === CONTINENT_OF[target]);
  const picked: string[] = [];

  const allowed = (candidate: string) => {
    if (picked.includes(candidate)) return false;
    if (tier < 3 || game !== 'flag') {
      // gentle tiers: never mix look-alike flags in one question
      if (areConfusable(candidate, target)) return false;
      if (picked.some((p) => areConfusable(candidate, p))) return false;
    }
    return true;
  };

  // tier-3 flag game: feature a tricky look-alike on purpose when one exists
  if (tier === 3 && game === 'flag') {
    const tricky = shuffled(pool.filter((c) => areConfusable(c, target)), rng);
    if (tricky.length > 0) picked.push(tricky[0]);
  }

  for (const candidate of shuffled(sameContinent, rng)) {
    if (picked.length >= OPTION_COUNT - 1) break;
    if (allowed(candidate)) picked.push(candidate);
  }
  for (const candidate of shuffled(pool, rng)) {
    if (picked.length >= OPTION_COUNT - 1) break;
    if (allowed(candidate)) picked.push(candidate);
  }
  return picked;
}

export function makeRound(game: GameId, tier: Tier, seed: number): RoundQuestion[] {
  const rng = mulberry32(seed);
  return pickTargets(tier, rng).map((target) => ({
    target,
    options:
      game === 'find'
        ? []
        : shuffled([target, ...pickDistractors(target, tier, game, rng)], rng),
  }));
}

/** Every completed round earns at least one star — no punishing failure. */
export function starsForRound(firstTryCorrect: number): 1 | 2 | 3 {
  if (firstTryCorrect >= ROUND_LENGTH) return 3;
  if (firstTryCorrect >= 3) return 2;
  return 1;
}

export function tierName(tier: Tier): string {
  return tier === 1 ? 'Explorer' : tier === 2 ? 'Adventurer' : 'Tricky';
}
