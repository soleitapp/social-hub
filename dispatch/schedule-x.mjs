// Marca una caption de X como programada (con fecha) y regenera docs/x-captions.md.
// Uso: node schedule-x.mjs <key> <YYYY-MM-DD>   (key = título del bloque, ej. cloudflare-pay-per-crawl-ia)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SCHED = path.join(DIR, '.x-scheduled.json');

const [key, date] = process.argv.slice(2);
if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
  console.error('Uso: node schedule-x.mjs <key> <YYYY-MM-DD>');
  process.exit(1);
}

const s = fs.existsSync(SCHED) ? JSON.parse(fs.readFileSync(SCHED, 'utf8')) : {};
s[key] = date;
fs.writeFileSync(SCHED, `${JSON.stringify(s, null, 2)}\n`);

execFileSync('node', ['gen-x-captions.mjs'], { cwd: DIR, stdio: 'inherit' });
console.log(`Programado: ${key} → ${date}`);
