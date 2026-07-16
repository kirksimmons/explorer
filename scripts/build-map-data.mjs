// Build-time map pipeline: world-atlas 50m TopoJSON -> pre-projected SVG path
// strings in src/data/generated/map-shapes.json. Runs before every build so
// the app ships with zero geo dependencies at runtime.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as topojson from 'topojson-client';
import { geoNaturalEarth1, geoPath, geoCircle } from 'd3-geo';

const require = createRequire(import.meta.url);
const atlas = require('world-atlas/countries-50m.json');
const names = JSON.parse(
  readFileSync(new URL('../src/data/atlas-names.json', import.meta.url), 'utf8'),
);

const WIDTH = 1000;
const HEIGHT = 520;

// rotate -11°: keeps Russia's far east attached instead of wrapping to the
// left edge, and clusters Samoa/Tonga next to Fiji in the Pacific.
const projection = geoNaturalEarth1()
  .rotate([-11, 0])
  .fitExtent(
    [
      [0, 0],
      [WIDTH, HEIGHT],
    ],
    { type: 'Sphere' },
  );
const path = geoPath(projection).digits(1);

const collection = topojson.feature(atlas, atlas.objects.countries);
const featuresByName = new Map();
for (const f of collection.features) {
  const name = f.properties?.name;
  if (!name) continue;
  if (featuresByName.has(name)) {
    throw new Error(`Duplicate feature name in atlas: ${name}`);
  }
  featuresByName.set(name, f);
}

// Largest polygon of a feature, so countries with far-flung islands
// (France, USA, Fiji) get a label point and pan box on their mainland.
function largestPolygon(feature) {
  const geom = feature.geometry;
  if (geom.type === 'Polygon') return feature;
  let best = null;
  let bestArea = -1;
  for (const coords of geom.coordinates) {
    const poly = { type: 'Feature', geometry: { type: 'Polygon', coordinates: coords } };
    const a = path.area(poly);
    if (a > bestArea) {
      bestArea = a;
      best = poly;
    }
  }
  return best;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function shapeEntry(feature, name) {
  const d = path(feature);
  if (!d) throw new Error(`No path generated for ${name}`);
  const main = largestPolygon(feature);
  const [cx, cy] = path.centroid(main);
  const [[mx0, my0], [mx1, my1]] = path.bounds(main);
  return {
    name,
    path: d,
    centroid: [round1(cx), round1(cy)],
    area: round1(path.area(feature)),
    // pan/zoom target: the main landmass, not distant islands
    panBox: [round1(mx0), round1(my0), round1(mx1), round1(my1)],
  };
}

// Region zoom presets: geographic lon/lat rects, projected to px by sampling
// the rect boundary (projection edges are curved).
const REGIONS = {
  africa: { lon: [-20, 52], lat: [-36, 38] },
  europe: { lon: [-25, 45], lat: [34, 72] },
  asia: { lon: [25, 150], lat: [-12, 78] },
  northAmerica: { lon: [-170, -50], lat: [5, 84] },
  southAmerica: { lon: [-85, -33], lat: [-57, 13] },
  oceania: { lon: [110, 185], lat: [-50, 2] },
  caribbean: { lon: [-86, -58], lat: [8, 28] },
  pacificIslands: { lon: [128, 192], lat: [-26, 12] },
  tinyEurope: { lon: [-6, 20], lat: [35, 49] },
};

function projectRegion({ lon, lat }) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const STEPS = 40;
  for (let i = 0; i <= STEPS; i++) {
    for (const [a, b] of [
      [lon[0] + ((lon[1] - lon[0]) * i) / STEPS, lat[0]],
      [lon[0] + ((lon[1] - lon[0]) * i) / STEPS, lat[1]],
      [lon[0], lat[0] + ((lat[1] - lat[0]) * i) / STEPS],
      [lon[1], lat[0] + ((lat[1] - lat[0]) * i) / STEPS],
    ]) {
      // clamp into the rotated projection's contiguous domain (-169..191)
      const lonW = Math.max(-168.9, Math.min(190.9, a));
      const p = projection([lonW, b]);
      if (!p) continue;
      x0 = Math.min(x0, p[0]);
      y0 = Math.min(y0, p[1]);
      x1 = Math.max(x1, p[0]);
      y1 = Math.max(y1, p[1]);
    }
  }
  return [round1(x0), round1(y0), round1(x1), round1(y1)];
}

const shapes = { countries: {}, territories: {} };
const matched = new Set();
const missing = [];

for (const [iso2, atlasName] of Object.entries(names.countries)) {
  const injected = names.injected[iso2];
  const feature = featuresByName.get(atlasName);
  if (feature) {
    shapes.countries[iso2] = shapeEntry(feature, atlasName);
    matched.add(atlasName);
  } else if (injected) {
    // Country missing from Natural Earth 50m (e.g. Tuvalu): draw a small
    // circle at its real location so the map never silently loses a country.
    const circle = geoCircle().center([injected.lon, injected.lat]).radius(0.4).precision(30)();
    const feature = { type: 'Feature', geometry: circle, properties: { name: injected.name } };
    shapes.countries[iso2] = shapeEntry(feature, injected.name);
  } else {
    missing.push(`${iso2} (${atlasName})`);
  }
}

for (const [key, atlasName] of Object.entries(names.territories)) {
  const feature = featuresByName.get(atlasName);
  if (feature) {
    shapes.territories[key] = shapeEntry(feature, atlasName);
    matched.add(atlasName);
  } else {
    missing.push(`territory ${key} (${atlasName})`);
  }
}

if (missing.length > 0) {
  console.error('MISSING from atlas:\n  ' + missing.join('\n  '));
  process.exit(1);
}

const unmatched = collection.features
  .map((f) => f.properties?.name)
  .filter((n) => n && !matched.has(n));
if (unmatched.length > 0) {
  console.error(
    'Atlas features not claimed by countries or territories (add them to atlas-names.json):\n  ' +
      unmatched.join('\n  '),
  );
  process.exit(1);
}

const regions = Object.fromEntries(
  Object.entries(REGIONS).map(([key, rect]) => [key, projectRegion(rect)]),
);

const out = { width: WIDTH, height: HEIGHT, regions, ...shapes };
const outUrl = new URL('../src/data/generated/map-shapes.json', import.meta.url);
mkdirSync(new URL('.', outUrl), { recursive: true });
const json = JSON.stringify(out);
writeFileSync(outUrl, json);

const countryCount = Object.keys(shapes.countries).length;
const territoryCount = Object.keys(shapes.territories).length;
console.log(
  `map-shapes.json: ${countryCount} countries + ${territoryCount} territories, ${(json.length / 1024).toFixed(0)} KB`,
);
if (countryCount !== 197) {
  console.error(`Expected 197 countries, got ${countryCount}`);
  process.exit(1);
}
