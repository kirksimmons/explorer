import shapesJson from '../data/generated/map-shapes.json';
import flagsJson from '../data/generated/flags.json';
import type { BBox } from './viewbox';

export interface Shape {
  name: string;
  path: string;
  centroid: [number, number];
  area: number;
  panBox: BBox;
}

interface MapShapes {
  width: number;
  height: number;
  regions: Record<string, BBox>;
  countries: Record<string, Shape>;
  territories: Record<string, Shape>;
}

export const MAP = shapesJson as unknown as MapShapes;

/** Raw flag SVG markup by ISO2 code (countries + territories). */
export const FLAGS = flagsJson as Record<string, string>;

/** Countries too small to tap directly get a hit dot at their centroid. */
export const DOT_AREA_THRESHOLD = 12;

export const DOT_COUNTRIES: string[] = Object.entries(MAP.countries)
  .filter(([, s]) => s.area < DOT_AREA_THRESHOLD)
  .map(([iso2]) => iso2);
