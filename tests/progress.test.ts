import { describe, it, expect } from 'vitest';
import {
  progressReducer,
  EMPTY_PROGRESS,
  parseProgress,
  unlockedTier,
  totalStars,
  dueForReview,
  TIER_2_STARS,
  TIER_3_STARS,
} from '../src/engine/progress';
import { earnedBadges, newBadges, BADGES } from '../src/engine/badges';
import { ALL_ISO2 } from '../src/data/continents';

describe('progressReducer', () => {
  it('records visits once', () => {
    let p = progressReducer(EMPTY_PROGRESS, { type: 'visit', iso2: 'FR' });
    p = progressReducer(p, { type: 'visit', iso2: 'FR' });
    expect(p.visited).toEqual(['FR']);
  });

  it('accumulates stars', () => {
    let p = progressReducer(EMPTY_PROGRESS, { type: 'earnStars', game: 'find', stars: 3 });
    p = progressReducer(p, { type: 'earnStars', game: 'find', stars: 2 });
    p = progressReducer(p, { type: 'earnStars', game: 'flag', stars: 1 });
    expect(p.stars.find).toBe(5);
    expect(totalStars(p)).toBe(6);
  });
});

describe('unlockedTier', () => {
  it('unlocks tiers at the star thresholds', () => {
    let p = EMPTY_PROGRESS;
    expect(unlockedTier(p)).toBe(1);
    p = progressReducer(p, { type: 'earnStars', game: 'find', stars: TIER_2_STARS });
    expect(unlockedTier(p)).toBe(2);
    p = progressReducer(p, { type: 'earnStars', game: 'flag', stars: TIER_3_STARS - TIER_2_STARS });
    expect(unlockedTier(p)).toBe(3);
  });
});

describe('parseProgress', () => {
  it('round-trips', () => {
    let p = progressReducer(EMPTY_PROGRESS, { type: 'visit', iso2: 'JP' });
    p = progressReducer(p, { type: 'earnStars', game: 'dish', stars: 2 });
    p = progressReducer(p, { type: 'missCountry', iso2: 'PE' });
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
  });

  it('survives garbage', () => {
    expect(parseProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(parseProgress('not json')).toEqual(EMPTY_PROGRESS);
    expect(parseProgress('{"visited": "FR"}')).toEqual(EMPTY_PROGRESS);
  });

  it('ignores malformed missed entries', () => {
    expect(parseProgress('{"missed": {"FR": "x", "JP": 2, "BR": -1}}').missed).toEqual({ JP: 2 });
    expect(parseProgress('{"missed": [1,2]}').missed).toEqual({});
  });
});

describe('spaced repetition', () => {
  it('bumps a missed country up and reviews it back down', () => {
    let p = progressReducer(EMPTY_PROGRESS, { type: 'missCountry', iso2: 'PE' });
    expect(p.missed.PE).toBe(2);
    expect(dueForReview(p)).toEqual(['PE']);

    p = progressReducer(p, { type: 'reviewCountry', iso2: 'PE' });
    expect(p.missed.PE).toBe(1);
    p = progressReducer(p, { type: 'reviewCountry', iso2: 'PE' });
    expect(p.missed.PE).toBeUndefined();
    expect(dueForReview(p)).toEqual([]);
  });

  it('caps the review score and orders most-overdue first', () => {
    let p = EMPTY_PROGRESS;
    for (let i = 0; i < 5; i++) p = progressReducer(p, { type: 'missCountry', iso2: 'PE' });
    expect(p.missed.PE).toBe(4);
    p = progressReducer(p, { type: 'missCountry', iso2: 'BR' });
    expect(dueForReview(p)).toEqual(['PE', 'BR']);
  });

  it('reviewCountry on an unmissed country is a no-op', () => {
    expect(progressReducer(EMPTY_PROGRESS, { type: 'reviewCountry', iso2: 'FR' })).toEqual(
      EMPTY_PROGRESS,
    );
  });
});

describe('badges', () => {
  it('has unique ids', () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('awards the first sticker and full-world badges', () => {
    expect(earnedBadges(EMPTY_PROGRESS)).toEqual([]);
    const one = progressReducer(EMPTY_PROGRESS, { type: 'visit', iso2: 'BR' });
    expect(earnedBadges(one).map((b) => b.id)).toContain('first-sticker');

    const all = { ...EMPTY_PROGRESS, visited: [...ALL_ISO2] };
    const ids = earnedBadges(all).map((b) => b.id);
    expect(ids).toContain('whole-world');
    expect(ids).toContain('master-africa');
  });

  it('newBadges only reports uncelebrated ones', () => {
    const one = progressReducer(EMPTY_PROGRESS, { type: 'visit', iso2: 'BR' });
    expect(newBadges(one).map((b) => b.id)).toEqual(['first-sticker']);
    const celebrated = progressReducer(one, { type: 'markBadges', badges: ['first-sticker'] });
    expect(newBadges(celebrated)).toEqual([]);
  });
});
