// Publica un tip en Bluesky: caption (toBluesky, maximiza 300, sin link) +
// hasta 4 láminas del carrusel de IG (límite de la API de Bluesky) + link en
// el 1er comentario. Cada imagen lleva alt.
// Uso: node post-tip.mjs [dispatch] [slides]
//   node post-tip.mjs 1           → tip 1, primeras 4 láminas del carrusel
//   node post-tip.mjs 1 1,2,3,5   → tip 1, esas 4 láminas
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { AtpAgent, RichText } from '@atproto/api';
import { tips } from '../../sitio-web/src/libs/content/tips.js';
import { fromTip, toBluesky } from '../../sitio-web/src/libs/distribution/adapt.js';

const IG_DIR =
  'G:/My Drive/Marketing/Redes sociales/Instagram/Publicadas';

const arg = process.argv[2] || '1';
const dispatch = String(parseInt(arg, 10)).padStart(2, '0');
const tip = tips.find((t) => t.dispatch === dispatch);
if (!tip) { console.error('No existe el tip', dispatch); process.exit(1); }

const n = parseInt(tip.dispatch, 10);
const folder = fs.existsSync(IG_DIR)
  ? fs.readdirSync(IG_DIR).find((d) => d.startsWith(`IG-C${n}_`))
  : null;
if (!folder) { console.error(`No encuentro la carpeta IG-C${n}_* en ${IG_DIR}`); process.exit(1); }

const slidePath = (s) => path.join(IG_DIR, folder, `${String(s).padStart(2, '0')}_ig-c${n}.png`);

// Láminas: lista explícita (arg 2) o todas las del carrusel.
let slides;
if (process.argv[3]) {
  slides = process.argv[3].split(',').map((s) => parseInt(s, 10)).filter(Boolean);
} else {
  slides = [];
  for (let i = 1; i <= 20 && fs.existsSync(slidePath(i)); i++) slides.push(i);
}
if (!slides.length) { console.error('No encuentro láminas para C' + n); process.exit(1); }
if (slides.length > 4) {
  console.log(`(i) Bluesky topa en 4 imágenes/post: uso [${slides.slice(0, 4).join(',')}], dejo fuera [${slides.slice(4).join(',')}]. Pasa una lista para elegir otras.`);
  slides = slides.slice(0, 4);
}

const { BLUESKY_IDENTIFIER = 'tu-usuario.bsky.social', BLUESKY_APP_PASSWORD } = process.env;
if (!BLUESKY_APP_PASSWORD) { console.error('Falta BLUESKY_APP_PASSWORD en .env'); process.exit(1); }

const item = fromTip(tip);
const { text } = toBluesky(item);

const agent = new AtpAgent({ service: 'https://bsky.social' });
await agent.login({ identifier: BLUESKY_IDENTIFIER, password: BLUESKY_APP_PASSWORD });

const images = [];
for (const s of slides) {
  const f = slidePath(s);
  if (!fs.existsSync(f)) { console.error('Falta la lámina', f); process.exit(1); }
  const up = await agent.uploadBlob(fs.readFileSync(f), { encoding: 'image/png' });
  images.push({ alt: `${item.hook} (lámina ${s})`, image: up.data.blob });
}

// RichText deja el link y los hashtags clickeables (facets). Las imágenes van como embed.
const rt = new RichText({ text });
await rt.detectFacets(agent);

const res = await agent.post({
  text: rt.text,
  facets: rt.facets,
  langs: ['es'],
  embed: { $type: 'app.bsky.embed.images', images },
  createdAt: new Date().toISOString(),
});

// Los tips van sin link: el carrusel ya tiene toda la info.
const rkey = res.uri.split('/').pop();
console.log(`✓ Bluesky — tip ${tip.dispatch} (${tip.id}) · ${images.length} imágenes [${slides.join(',')}]`);
console.log(`  ver: https://bsky.app/profile/${BLUESKY_IDENTIFIER}/post/${rkey}`);
