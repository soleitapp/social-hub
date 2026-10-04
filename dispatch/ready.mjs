/* Cola de publicación: por plataforma, qué piezas tienen caption pero aún no URL
   (listas para publicar). Bluesky se publica con publish-bluesky.mjs; el resto,
   por Cowork/manual con el caption ya escrito.
   Uso: node dispatch/ready.mjs [plataforma] */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pieces.json'), 'utf8'));
const only = process.argv[2];

const ready = {};   // platform -> [pieceId]
const noCaption = {}; // platform -> count (falta caption)
for (const p of data.pieces) {
  for (const d of p.distributions) {
    if (only && d.platform !== only) continue;
    if (d.url || d.status === 'published' || d.status === 'deleted') continue;
    if (d.caption) (ready[d.platform] ||= []).push(p.id);
    else noCaption[d.platform] = (noCaption[d.platform] || 0) + 1;
  }
}

console.log('LISTO PARA PUBLICAR (caption escrito, sin URL):\n');
const plats = Object.keys(ready).sort();
if (!plats.length) console.log('  (nada con caption listo)');
for (const pl of plats) {
  console.log(`  ${pl.padEnd(10)} ${ready[pl].length}  → ${ready[pl].join(' ')}`);
}
console.log('\nFALTA CAPTION (por adaptar):');
for (const [pl, n] of Object.entries(noCaption).sort()) console.log(`  ${pl.padEnd(10)} ${n}`);
console.log('\nBluesky:  node dispatch/publish-bluesky.mjs <id> --go');
console.log('Resto:    Cowork/manual con el caption del hub');
