/* Publica una pieza en Bluesky desde el hub.
   - Caption: el de la distribución Bluesky (pieces.json) — ≤300, sin link.
   - Imágenes: las láminas curadas (asset -bluesky) desde Piezas/<driveDir>/laminas/.
   - Write-back: guarda la URL en pieces.json + overrides (marca publicado).
   Dry-run por defecto; postea con --go.
   Uso: node dispatch/publish-bluesky.mjs c01 [--go]
*/
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { AtpAgent, RichText } from '@atproto/api';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const RS = process.env.RS || 'G:/My Drive/Marketing/Redes sociales';
const PIECES = path.join(ROOT, 'data', 'pieces.json');
const OVERRIDES = path.join(ROOT, 'data', 'overrides.json');

const GO = process.argv.includes('--go');
const id = process.argv[2];
if (!id) { console.error('Uso: node dispatch/publish-bluesky.mjs <pieceId> [--go]'); process.exit(1); }

const data = JSON.parse(fs.readFileSync(PIECES, 'utf8'));
const piece = data.pieces.find((p) => p.id === id);
if (!piece) { console.error('No existe la pieza', id); process.exit(1); }

const dist = piece.distributions.find((d) => d.platform === 'bluesky');
if (!dist) { console.error(id, 'no tiene distribución Bluesky'); process.exit(1); }
if (dist.url) { console.error(`${id} ya está publicado en Bluesky: ${dist.url}`); process.exit(1); }

const asset = piece.assets.find((a) => a.id === dist.assetId);
const idxs = asset?.slides || [1, 2, 3, 4];
const files = idxs.map((i) => path.join(RS, 'Piezas', piece.driveDir, 'laminas', `${String(i).padStart(2, '0')}.png`));
const missing = files.filter((f) => !fs.existsSync(f));
if (!piece.driveDir || missing.length) { console.error('Faltan láminas en Drive:', missing.join(', ') || '(sin driveDir)'); process.exit(1); }

let text = (dist.caption || '').trim();
if (!text) { console.error(`✗ ${id} no tiene caption de Bluesky. Escríbelo en el hub primero.`); process.exit(1); }
if (text.length > 300) { console.log(`(!) caption ${text.length} > 300 — se recorta.`); text = text.slice(0, 299) + '…'; }

console.log(`Pieza ${id} · ${piece.title}`);
console.log(`Bluesky · ${files.length} láminas [${idxs.join(',')}] · caption ${text.length}/300`);
console.log('---\n' + text + '\n---');

if (!GO) { console.log('\n(dry-run) Publica con: node dispatch/publish-bluesky.mjs ' + id + ' --go'); process.exit(0); }

const { BLUESKY_IDENTIFIER = 'tu-usuario.bsky.social', BLUESKY_APP_PASSWORD } = process.env;
if (!BLUESKY_APP_PASSWORD) { console.error('Falta BLUESKY_APP_PASSWORD en dispatch/.env'); process.exit(1); }

const agent = new AtpAgent({ service: 'https://bsky.social' });
await agent.login({ identifier: BLUESKY_IDENTIFIER, password: BLUESKY_APP_PASSWORD });

const images = [];
for (let k = 0; k < files.length; k++) {
  const up = await agent.uploadBlob(fs.readFileSync(files[k]), { encoding: 'image/png' });
  images.push({ alt: `${piece.title} (lámina ${idxs[k]})`, image: up.data.blob });
}

const rt = new RichText({ text });
await rt.detectFacets(agent);
const res = await agent.post({
  text: rt.text, facets: rt.facets, langs: ['es'],
  embed: { $type: 'app.bsky.embed.images', images },
  createdAt: new Date().toISOString(),
});
const rkey = res.uri.split('/').pop();
const url = `https://bsky.app/profile/${BLUESKY_IDENTIFIER}/post/${rkey}`;

// write-back: pieces.json + overrides
dist.url = url; dist.status = 'published';
fs.writeFileSync(PIECES, JSON.stringify(data, null, 2));
let ov = {}; try { ov = JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')); } catch {}
ov[`${piece.type}-${piece.n}/bluesky/post`] = { url };
fs.writeFileSync(OVERRIDES, JSON.stringify(ov, null, 2));

console.log(`\n✓ Publicado en Bluesky · ${images.length} imágenes`);
console.log(`  ${url}`);
console.log('  (URL guardada en el hub — refresca la vista)');
