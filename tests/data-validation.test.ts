import { describe, it, expect } from 'vitest';
import { COUNTRIES } from '../src/data/countries';
import { CONTINENT_OF, ALL_ISO2 } from '../src/data/continents';
import { TIER_1, TIER_2 } from '../src/data/tiers';
import { TERRITORIES } from '../src/data/territories';
import { REFERENCE_CAPITALS } from './reference-capitals';
import shapes from '../src/data/generated/map-shapes.json';
import flags from '../src/data/generated/flags.json';

const entries = Object.entries(COUNTRIES);
const MAX_FACT_LEN = 130;

describe('country dataset', () => {
  it('covers all 197 countries exactly', () => {
    expect(Object.keys(COUNTRIES).sort()).toEqual([...ALL_ISO2].sort());
    expect(entries.length).toBe(197);
  });

  it('has unique names', () => {
    const names = entries.map(([, c]) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(entries)('%s is structurally valid', (iso2, c) => {
    expect(c.iso2).toBe(iso2);
    expect(c.name.trim().length).toBeGreaterThan(0);
    expect(CONTINENT_OF[iso2]).toBeDefined();

    // capitals mechanically cross-checked against the independent reference
    expect(c.capital).toBe(REFERENCE_CAPITALS[iso2]);

    expect(c.languages.length).toBeGreaterThanOrEqual(1);
    expect(c.languages.length).toBeLessThanOrEqual(3);
    for (const lang of c.languages) expect(lang.trim().length).toBeGreaterThan(0);

    expect(c.dish.name.trim().length).toBeGreaterThan(0);
    expect(c.dish.blurb.trim().length).toBeGreaterThan(0);
    expect(c.dish.blurb.length).toBeLessThanOrEqual(220);

    expect(c.funFacts.length).toBe(3);
    for (const fact of c.funFacts) {
      expect(fact.trim().length).toBeGreaterThan(10);
      expect(fact.length).toBeLessThanOrEqual(MAX_FACT_LEN);
    }

    expect(c.longAgo.history.length).toBeGreaterThanOrEqual(1);
    expect(c.longAgo.history.length).toBeLessThanOrEqual(2);
    for (const h of c.longAgo.history) expect(h.trim().length).toBeGreaterThan(10);
    expect(c.longAgo.dino.name.trim().length).toBeGreaterThan(0);
    expect(c.longAgo.dino.note.trim().length).toBeGreaterThan(10);

    expect(c.famousFor.trim().length).toBeGreaterThan(0);

    // every country must be drawable and have a flag
    expect((shapes as any).countries[iso2]).toBeDefined();
    expect((flags as any)[iso2]).toBeDefined();
  });
});

describe('tiers', () => {
  it('tier lists contain only known countries, no overlap', () => {
    for (const c of [...TIER_1, ...TIER_2]) expect(CONTINENT_OF[c]).toBeDefined();
    const overlap = TIER_1.filter((c) => TIER_2.includes(c));
    expect(overlap).toEqual([]);
  });
});

describe('territories', () => {
  it('covers every territory shape with a card', () => {
    const shapeKeys = Object.keys((shapes as any).territories).sort();
    expect(Object.keys(TERRITORIES).sort()).toEqual(shapeKeys);
    for (const t of Object.values(TERRITORIES)) {
      expect(t.name.trim().length).toBeGreaterThan(0);
      expect(t.blurb.trim().length).toBeGreaterThan(10);
    }
  });
});
