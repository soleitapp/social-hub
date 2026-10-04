// Marca captions de X como publicadas y regenera docs/x-captions.md.
// Uso: node mark-x.mjs <key> [key...]   (key = título del bloque: LI-08, mcp-para-tu-negocio…)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(DIR, '.x-posted.json');

const keys = process.argv.slice(2);
if (!keys.length) { console.error('Uso: node mark-x.mjs <key> [key...]'); process.exit(1); }

const posted = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : [];
for (const k of keys) if (!posted.includes(k)) posted.push(k);
fs.writeFileSync(STATE, `${JSON.stringify(posted, null, 2)}\n`);

execFileSync('node', ['gen-x-captions.mjs'], { cwd: DIR, stdio: 'inherit' });
console.log('Marcado(s) como publicado en X:', keys.join(', '));
