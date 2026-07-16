export type Continent =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Oceania';

export const CONTINENTS: Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
];

export interface Country {
  iso2: string;
  /** Kid-friendly common name, e.g. "France", "South Korea". */
  name: string;
  capital: string;
  /** Spoken languages, most common first; UI shows at most 3. */
  languages: string[];
  /** Shown as "A favorite food" — sidesteps contested national-dish claims. */
  dish: { name: string; blurb: string };
  /** Exactly 3 one-sentence wow-facts (enforced by the validation suite). */
  funFacts: string[];
  /** The "Long ago…" time-travel teaser card. */
  longAgo: {
    /** 1–2 simple history facts. */
    history: string[];
    /** A real prehistoric creature found in this region. */
    dino: { name: string; note: string };
  };
  /** One-liner used as a quiz hint, e.g. "the Eiffel Tower and yummy cheese". */
  famousFor: string;
}

export interface Territory {
  name: string;
  blurb: string;
  continent: Continent;
}

export type Tier = 1 | 2 | 3;
