// Publica un artículo de blog en Bluesky como TARJETA DE ENLACE (external embed):
// caption teaser (toBluesky, máx 300, sin link) + card con imagen OG + título +
// descripción, cuyo click va al artículo (que trae la agenda). Uso: node post-article.mjs <slug>
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AtpAgent, RichText } from '@atproto/api';
import { articles } from '../../sitio-web/src/libs/content/articles.js';
import { fromArticle, toBluesky, stripHtml } from '../../sitio-web/src/libs/distribution/adapt.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const slug = process.argv[2];
if (!slug) { console.error('Uso: node post-article.mjs <slug>'); process.exit(1); }
const article = articles.find((a) => a.slug === slug);
if (!article) { console.error('No existe el artículo', slug); process.exit(1); }

const { BLUESKY_IDENTIFIER = 'tu-usuario.bsky.social', BLUESKY_APP_PASSWORD } = process.env;
if (!BLUESKY_APP_PASSWORD) { console.error('Falta BLUESKY_APP_PASSWORD en .env'); process.exit(1); }

const item = fromArticle(article);
const { text, link } = toBluesky(item);

const agent = new AtpAgent({ service: 'https://bsky.social' });
await agent.login({ identifier: BLUESKY_IDENTIFIER, password: BLUESKY_APP_PASSWORD });

// Miniatura de la tarjeta = imagen OG del artículo.
const ogPath = path.join(ROOT, 'public/assets/blog', `${slug}-og.jpg`);
let thumb;
if (fs.existsSync(ogPath)) {
  const up = await agent.uploadBlob(fs.readFileSync(ogPath), { encoding: 'image/jpeg' });
  thumb = up.data.blob;
}

const title = stripHtml(article.title);
const description = stripHtml(article.excerpt || '').slice(0, 300);

const rt = new RichText({ text });
await rt.detectFacets(agent);

const res = await agent.post({
  text: rt.text,
  facets: rt.facets,
  langs: ['es'],
  embed: {
    $type: 'app.bsky.embed.external',
    external: { uri: link, title, description, ...(thumb ? { thumb } : {}) },
  },
  createdAt: new Date().toISOString(),
});

console.log(`✓ Bluesky — artículo "${slug}" con tarjeta de enlace${thumb ? ' (con imagen OG)' : ''}`);
console.log(`  ver: https://bsky.app/profile/${BLUESKY_IDENTIFIER}/post/${res.uri.split('/').pop()}`);
