import { statSync } from 'node:fs';

const LIMIT_MB = 6;
const path = new URL('../dist/index.html', import.meta.url);
const bytes = statSync(path).size;
const mb = bytes / (1024 * 1024);

console.log(`dist/index.html is ${mb.toFixed(2)} MB (limit ${LIMIT_MB} MB)`);
if (mb > LIMIT_MB) {
  console.error('Bundle exceeds the offline single-file budget. Trim map/flag/data weight.');
  process.exit(1);
}
