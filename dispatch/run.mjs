// Runner diario de Bluesky: publica el SIGUIENTE tip pendiente (en orden) y lleva
// el registro en .posted.json. Pensado para el Programador de tareas (1 vez/día).
// Los artículos se publican aparte, el día que salen (post-article.mjs).
//   node run.mjs         → publica el próximo tip pendiente
//   node run.mjs --dry   → muestra cuál sería, sin publicar
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tips } from '../../sitio-web/src/libs/content/tips.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(DIR, '.posted.json');
const DRY = process.argv.includes('--dry');

// Curación 4-de-5 por tip (Bluesky topa en 4 imágenes). Elegidas a mano:
// se deja fuera la lámina más redundante y se conserva el remate.
const SLIDES = {
  '01': '1,2,3,5', '02': '1,2,4,5', '03': '1,2,4,5', '04': '2,3,4,5',
  '05': '1,2,3,5', '06': '1,2,3,5', '07': '2,3,4,5', '08': '1,3,4,5',
  '09': '2,3,4,5', '10': '1,2,3,5', '11': '1,2,4,5', '12': '1,2,4,5',
  '13': '1,2,4,5', '14': '1,2,3,5', '15': '1,3,4,5', '16': '2,3,4,5',
  '17': '2,3,4,5', '18': '2,3,4,5',
};

// Cola = tips en orden de dispatch.
const queue = tips
  .slice()
  .sort((a, b) => a.dispatch.localeCompare(b.dispatch))
  .map((t) => ({ key: `tip-${t.dispatch}`, id: t.dispatch, slides: SLIDES[t.dispatch] }));

const posted = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : [];
const next = queue.find((q) => !posted.includes(q.key));

if (!next) { console.log('Cola de tips agotada: nada pendiente.'); process.exit(0); }

console.log(`${DRY ? '[dry] ' : ''}Próximo: ${next.key}${next.slides ? ` (láminas ${next.slides})` : ''}`);
if (DRY) process.exit(0);

execFileSync('node', ['post-tip.mjs', next.id, ...(next.slides ? [next.slides] : [])], {
  cwd: DIR,
  stdio: 'inherit',
});

posted.push(next.key);
fs.writeFileSync(STATE, JSON.stringify(posted, null, 2));
console.log('OK — registrado:', next.key);
