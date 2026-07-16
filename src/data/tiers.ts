import type { Tier } from './types';

/**
 * Quiz difficulty tiers. Tier 1 = famous countries a 7-year-old has likely
 * heard of; tier 2 = medium; tier 3 = everything else (assigned by default).
 */
export const TIER_1: string[] = [
  'US', 'CA', 'MX', 'BR', 'AR', 'GB', 'FR', 'ES', 'PT', 'IT', 'DE', 'NL', 'CH', 'GR',
  'RU', 'CN', 'JP', 'KR', 'IN', 'AU', 'NZ', 'EG', 'ZA', 'KE', 'NG',
];

export const TIER_2: string[] = [
  // Americas
  'CU', 'JM', 'PA', 'CR', 'GT', 'DO', 'HT', 'BS', 'CO', 'PE', 'CL', 'VE', 'EC', 'BO',
  'UY', 'PY',
  // Europe
  'IE', 'IS', 'NO', 'SE', 'FI', 'DK', 'BE', 'AT', 'PL', 'CZ', 'HU', 'RO', 'UA', 'HR',
  'TR', 'MC', 'VA',
  // Africa
  'MA', 'DZ', 'TN', 'ET', 'GH', 'TZ', 'MG', 'CD', 'SN',
  // Asia
  'SA', 'AE', 'IL', 'IQ', 'IR', 'PK', 'BD', 'TH', 'VN', 'PH', 'ID', 'MY', 'SG', 'NP',
  'MN', 'KZ', 'LK', 'AF', 'KP', 'TW',
  // Oceania
  'FJ', 'PG',
];

import { ALL_ISO2 } from './continents';

const tier1 = new Set(TIER_1);
const tier2 = new Set(TIER_2);

export function tierOf(iso2: string): Tier {
  if (tier1.has(iso2)) return 1;
  if (tier2.has(iso2)) return 2;
  return 3;
}

export const TIER_3: string[] = ALL_ISO2.filter((c) => tierOf(c) === 3);
