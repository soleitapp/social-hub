// Muestra los últimos posts de la cuenta (para verificar/depurar). Uso: node feed.mjs
import 'dotenv/config';
import { AtpAgent } from '@atproto/api';

const { BLUESKY_IDENTIFIER = 'tu-usuario.bsky.social', BLUESKY_APP_PASSWORD } = process.env;
const a = new AtpAgent({ service: 'https://bsky.social' });
await a.login({ identifier: BLUESKY_IDENTIFIER, password: BLUESKY_APP_PASSWORD });
const f = await a.getAuthorFeed({ actor: BLUESKY_IDENTIFIER, limit: 12 });
for (const x of f.data.feed) {
  const p = x.post;
  const imgs = p.embed?.images?.length ?? 0;
  const reply = p.record.reply ? '(reply) ' : '';
  console.log(`${p.indexedAt} | imgs:${imgs} | ${reply}${(p.record.text || '').slice(0, 60).replace(/\n/g, ' ')}`);
}
