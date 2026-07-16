/** Progress state + reducer. Pure — persistence lives in the context layer. */

export type GameId = 'find' | 'flag' | 'dish';

export interface Progress {
  /** iso2 codes of countries whose card has been opened. */
  visited: string[];
  /** iso2 codes whose "Long ago…" section has been opened. */
  longAgoViews: string[];
  /** Total stars earned per game (stars only ever go up). */
  stars: Record<GameId, number>;
  /** Badge ids already celebrated (so confetti fires once per badge). */
  badges: string[];
  /**
   * Spaced repetition: iso2 → how "due" it is to be reviewed. A miss bumps it
   * up; getting it right first-try brings it back down. Countries with a
   * positive score are resurfaced in future quiz rounds.
   */
  missed: Record<string, number>;
}

export const EMPTY_PROGRESS: Progress = {
  visited: [],
  longAgoViews: [],
  stars: { find: 0, flag: 0, dish: 0 },
  badges: [],
  missed: {},
};

/** How high a single country's review score can climb. */
const MAX_MISS_SCORE = 4;

export type ProgressAction =
  | { type: 'visit'; iso2: string }
  | { type: 'longAgo'; iso2: string }
  | { type: 'earnStars'; game: GameId; stars: number }
  | { type: 'markBadges'; badges: string[] }
  | { type: 'missCountry'; iso2: string }
  | { type: 'reviewCountry'; iso2: string };

function addUnique(list: string[], item: string): string[] {
  return list.includes(item) ? list : [...list, item];
}

export function progressReducer(state: Progress, action: ProgressAction): Progress {
  switch (action.type) {
    case 'visit':
      return { ...state, visited: addUnique(state.visited, action.iso2) };
    case 'longAgo':
      return { ...state, longAgoViews: addUnique(state.longAgoViews, action.iso2) };
    case 'earnStars':
      return {
        ...state,
        stars: { ...state.stars, [action.game]: state.stars[action.game] + action.stars },
      };
    case 'markBadges': {
      const merged = [...state.badges];
      for (const b of action.badges) if (!merged.includes(b)) merged.push(b);
      return { ...state, badges: merged };
    }
    case 'missCountry': {
      const current = state.missed[action.iso2] ?? 0;
      return {
        ...state,
        missed: { ...state.missed, [action.iso2]: Math.min(current + 2, MAX_MISS_SCORE) },
      };
    }
    case 'reviewCountry': {
      const current = state.missed[action.iso2] ?? 0;
      if (current <= 0) return state;
      const next = { ...state.missed };
      if (current - 1 <= 0) delete next[action.iso2];
      else next[action.iso2] = current - 1;
      return { ...state, missed: next };
    }
  }
}

/** Countries due for spaced review, most-overdue first. */
export function dueForReview(p: Progress): string[] {
  return Object.keys(p.missed)
    .filter((iso2) => p.missed[iso2] > 0)
    .sort((a, b) => p.missed[b] - p.missed[a]);
}

export function totalStars(p: Progress): number {
  return p.stars.find + p.stars.flag + p.stars.dish;
}

/** Tier unlock rule: one simple number a kid can understand. */
export const TIER_2_STARS = 9;
export const TIER_3_STARS = 25;

export function unlockedTier(p: Progress): 1 | 2 | 3 {
  const total = totalStars(p);
  if (total >= TIER_3_STARS) return 3;
  if (total >= TIER_2_STARS) return 2;
  return 1;
}

export function parseProgress(json: string | null): Progress {
  if (!json) return EMPTY_PROGRESS;
  try {
    const raw = JSON.parse(json);
    return {
      visited: Array.isArray(raw.visited) ? raw.visited.filter((v: unknown) => typeof v === 'string') : [],
      longAgoViews: Array.isArray(raw.longAgoViews)
        ? raw.longAgoViews.filter((v: unknown) => typeof v === 'string')
        : [],
      stars: {
        find: typeof raw.stars?.find === 'number' ? raw.stars.find : 0,
        flag: typeof raw.stars?.flag === 'number' ? raw.stars.flag : 0,
        dish: typeof raw.stars?.dish === 'number' ? raw.stars.dish : 0,
      },
      badges: Array.isArray(raw.badges) ? raw.badges.filter((v: unknown) => typeof v === 'string') : [],
      missed:
        raw.missed && typeof raw.missed === 'object' && !Array.isArray(raw.missed)
          ? Object.fromEntries(
              Object.entries(raw.missed).filter(([, v]) => typeof v === 'number' && v > 0) as [
                string,
                number,
              ][],
            )
          : {},
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}
