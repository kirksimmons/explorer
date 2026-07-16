// Copies only the flag SVGs we actually use out of flag-icons into a single
// JSON module, so the app bundles ~240 flags instead of the full set.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const names = JSON.parse(
  readFileSync(new URL('../src/data/atlas-names.json', import.meta.url), 'utf8'),
);

const codes = [
  ...Object.keys(names.countries),
  // territories with real ISO codes get flags too (slug keys start with _)
  ...Object.keys(names.territories).filter((k) => !k.startsWith('_')),
];

const flags = {};
const missing = [];
for (const code of codes) {
  try {
    const svg = readFileSync(
      new URL(`../node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`, import.meta.url),
      'utf8',
    );
    flags[code] = svg;
  } catch {
    missing.push(code);
  }
}

if (missing.length > 0) {
  console.error('No flag SVG for: ' + missing.join(', '));
  process.exit(1);
}

const outUrl = new URL('../src/data/generated/flags.json', import.meta.url);
mkdirSync(new URL('.', outUrl), { recursive: true });
const json = JSON.stringify(flags);
writeFileSync(outUrl, json);
console.log(`flags.json: ${codes.length} flags, ${(json.length / 1024).toFixed(0)} KB`);
