import type { Progress } from './progress';
import { totalStars } from './progress';
import { CONTINENT_OF, ALL_ISO2 } from '../data/continents';
import { CONTINENTS, type Continent } from '../data/types';

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  /** Shown greyed-out as a hint until earned. */
  hint: string;
  earned: (p: Progress) => boolean;
}

const COUNT_BY_CONTINENT: Record<Continent, number> = {
  Africa: 0, Asia: 0, Europe: 0, 'North America': 0, 'South America': 0, Oceania: 0,
};
for (const iso2 of ALL_ISO2) COUNT_BY_CONTINENT[CONTINENT_OF[iso2]]++;

function visitedIn(p: Progress, continent: Continent): number {
  return p.visited.filter((c) => CONTINENT_OF[c] === continent).length;
}

const CONTINENT_EMOJI: Record<Continent, string> = {
  Africa: '🦁', Asia: '🐼', Europe: '🏰',
  'North America': '🦅', 'South America': '🦜', Oceania: '🐨',
};

export const BADGES: Badge[] = [
  {
    id: 'first-sticker', emoji: '🌟', name: 'First Sticker',
    hint: 'Visit your very first country',
    earned: (p) => p.visited.length >= 1,
  },
  {
    id: 'ten-countries', emoji: '🎒', name: 'Young Explorer',
    hint: 'Visit 10 countries',
    earned: (p) => p.visited.length >= 10,
  },
  {
    id: 'globe-trotter', emoji: '✈️', name: 'Globe Trotter',
    hint: 'Visit 50 countries',
    earned: (p) => p.visited.length >= 50,
  },
  {
    id: 'world-traveler', emoji: '🌍', name: 'World Traveler',
    hint: 'Visit 100 countries',
    earned: (p) => p.visited.length >= 100,
  },
  {
    id: 'whole-world', emoji: '🏆', name: 'Whole Wide World',
    hint: 'Visit every single country!',
    earned: (p) => p.visited.length >= ALL_ISO2.length,
  },
  ...CONTINENTS.map((continent): Badge => ({
    id: `master-${continent.toLowerCase().replace(' ', '-')}`,
    emoji: CONTINENT_EMOJI[continent],
    name: `${continent} Master`,
    hint: `Visit all ${COUNT_BY_CONTINENT[continent]} countries in ${continent}`,
    earned: (p) => visitedIn(p, continent) >= COUNT_BY_CONTINENT[continent],
  })),
  {
    id: 'map-whiz', emoji: '🗺️', name: 'Map Whiz',
    hint: 'Earn 10 stars in Find the Country',
    earned: (p) => p.stars.find >= 10,
  },
  {
    id: 'flag-fan', emoji: '🚩', name: 'Flag Fan',
    hint: 'Earn 10 stars in Match the Flag',
    earned: (p) => p.stars.flag >= 10,
  },
  {
    id: 'food-expert', emoji: '🍽️', name: 'Food Expert',
    hint: 'Earn 10 stars in Guess the Food',
    earned: (p) => p.stars.dish >= 10,
  },
  {
    id: 'star-collector', emoji: '⭐', name: 'Star Collector',
    hint: 'Collect 50 stars in total',
    earned: (p) => totalStars(p) >= 50,
  },
  {
    id: 'time-traveler', emoji: '🦕', name: 'Time Traveler',
    hint: 'Read 10 "Long ago…" stories',
    earned: (p) => p.longAgoViews.length >= 10,
  },
];

export function earnedBadges(p: Progress): Badge[] {
  return BADGES.filter((b) => b.earned(p));
}

/** Badges newly earned but not yet celebrated (drives the confetti moment). */
export function newBadges(p: Progress): Badge[] {
  return BADGES.filter((b) => b.earned(p) && !p.badges.includes(b.id));
}
