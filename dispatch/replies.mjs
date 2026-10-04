// Lista los replies (comentarios) de uno o más posts. Uso: node replies.mjs <rkey> [rkey...]
import 'dotenv/config';
import { AtpAgent } from '@atproto/api';
const a = new AtpAgent({ service: 'https://bsky.social' });
await a.login({ identifier: process.env.BLUESKY_IDENTIFIER, password: process.env.BLUESKY_APP_PASSWORD });
for (const rk of process.argv.slice(2)) {
  const uri = `at://${a.session.did}/app.bsky.feed.post/${rk}`;
  const t = await a.getPostThread({ uri, depth: 3 });
  const replies = t.data.thread.replies || [];
  console.log(`${rk}: ${replies.length} reply(s)`);
  for (const r of replies) {
    console.log(`  → ${r.post.uri.split('/').pop()} | ${(r.post.record.text || '').slice(0, 55).replace(/\n/g, ' ')}`);
  }
}
