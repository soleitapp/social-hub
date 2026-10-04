import 'dotenv/config';
import { AtpAgent } from '@atproto/api';
const a = new AtpAgent({ service: 'https://bsky.social' });
await a.login({ identifier: process.env.BLUESKY_IDENTIFIER, password: process.env.BLUESKY_APP_PASSWORD });
const r = await a.com.atproto.repo.listRecords({ repo: a.session.did, collection: 'app.bsky.feed.post', limit: 50 });
console.log('total post records:', r.data.records.length);
for (const rec of r.data.records) {
  const v = rec.value;
  const kind = v.reply ? 'REPLY' : 'POST ';
  const emb = v.embed?.$type?.replace('app.bsky.embed.', '') || '-';
  console.log(`${rec.uri.split('/').pop()} | ${kind} | ${emb} | ${(v.text || '').slice(0, 45).replace(/\n/g, ' ')}`);
}
