import { describe, it, expect } from 'vitest';
import {
  makeRound,
  starsForRound,
  areConfusable,
  mulberry32,
  ROUND_LENGTH,
  OPTION_COUNT,
  CONFUSABLE_FLAGS,
} from '../src/engine/quiz';
import { tierOf } from '../src/data/tiers';
import { CONTINENT_OF } from '../src/data/continents';

describe('makeRound', () => {
  it('is deterministic for a given seed', () => {
    expect(makeRound('flag', 2, 42)).toEqual(makeRound('flag', 2, 42));
  });

  it('produces 5 questions with 4 unique options including the target', () => {
    for (const game of ['flag', 'dish'] as const) {
      for (const tier of [1, 2, 3] as const) {
        for (const seed of [1, 7, 99, 1234]) {
          const round = makeRound(game, tier, seed);
          expect(round).toHaveLength(ROUND_LENGTH);
          for (const q of round) {
            expect(q.options).toHaveLength(OPTION_COUNT);
            expect(new Set(q.options).size).toBe(OPTION_COUNT);
            expect(q.options).toContain(q.target);
            expect(CONTINENT_OF[q.target]).toBeDefined();
          }
        }
      }
    }
  });

  it('map game has targets but no options', () => {
    const round = makeRound('find', 1, 5);
    expect(round).toHaveLength(ROUND_LENGTH);
    for (const q of round) expect(q.options).toEqual([]);
  });

  it('never asks above the unlocked tier', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      for (const q of makeRound('flag', 1, seed)) expect(tierOf(q.target)).toBe(1);
      for (const q of makeRound('dish', 2, seed)) expect(tierOf(q.target)).toBeLessThanOrEqual(2);
    }
  });

  it('tiers 1-2 never mix look-alike flags in one question', () => {
    for (const tier of [1, 2] as const) {
      for (let seed = 0; seed < 50; seed++) {
        for (const q of makeRound('flag', tier, seed)) {
          for (let i = 0; i < q.options.length; i++) {
            for (let j = i + 1; j < q.options.length; j++) {
              expect(
                areConfusable(q.options[i], q.options[j]),
                `${q.options[i]} vs ${q.options[j]} (seed ${seed})`,
              ).toBe(false);
            }
          }
        }
      }
    }
  });

  it('tier-3 flag questions include a tricky look-alike when the target has one', () => {
    let trickyChances = 0;
    let trickyTaken = 0;
    for (let seed = 0; seed < 60; seed++) {
      for (const q of makeRound('flag', 3, seed)) {
        const partners = CONFUSABLE_FLAGS.find((g) => g.includes(q.target));
        if (!partners) continue;
        trickyChances++;
        if (q.options.some((o) => o !== q.target && partners.includes(o))) trickyTaken++;
      }
    }
    expect(trickyChances).toBeGreaterThan(0);
    expect(trickyTaken).toBe(trickyChances);
  });
});

describe('starsForRound', () => {
  it('always awards at least one star', () => {
    expect(starsForRound(0)).toBe(1);
    expect(starsForRound(2)).toBe(1);
    expect(starsForRound(3)).toBe(2);
    expect(starsForRound(4)).toBe(2);
    expect(starsForRound(5)).toBe(3);
  });
});

describe('mulberry32', () => {
  it('yields values in [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
