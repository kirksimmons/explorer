import type { Country } from '../types';
import { AFRICA } from './africa';
import { ASIA } from './asia';
import { EUROPE } from './europe';
import { NORTH_AMERICA } from './north-america';
import { SOUTH_AMERICA } from './south-america';
import { OCEANIA } from './oceania';

export const COUNTRIES: Record<string, Country> = {
  ...AFRICA,
  ...ASIA,
  ...EUROPE,
  ...NORTH_AMERICA,
  ...SOUTH_AMERICA,
  ...OCEANIA,
};
