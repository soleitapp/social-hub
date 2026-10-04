// Genera props.json para un tip desde src/libs/content/tips.js.
// Uso: node tip-props.mjs <dispatch>   (ej. 03)  → escribe props.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tips } from '../src/libs/content/tips.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const arg = process.argv[2] || '1';
const dispatch = String(parseInt(arg, 10)).padStart(2, '0');
const tip = tips.find((t) => t.dispatch === dispatch);
if (!tip) { console.error('No existe el tip', dispatch); process.exit(1); }

// variant del short: teal/mint → paper (claro); resto → ink (oscuro).
const variant = ['paper', 'mint'].includes(tip.variant) ? 'paper' : 'ink';
const props = { dispatch: tip.dispatch, insight: tip.insight, accent: tip.accent || '', text: tip.text || '', variant };
fs.writeFileSync(path.join(DIR, 'props.json'), `${JSON.stringify(props, null, 2)}\n`);
console.log(`props.json ← tip ${tip.dispatch} (${tip.id}), variant ${variant}`);
