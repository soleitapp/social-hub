// Borra posts de Bluesky por su rkey. Uso: node delete-post.mjs <rkey> [rkey...]
import 'dotenv/config';
import { AtpAgent } from '@atproto/api';

const { BLUESKY_IDENTIFIER = 'tu-usuario.bsky.social', BLUESKY_APP_PASSWORD } = process.env;
const agent = new AtpAgent({ service: 'https://bsky.social' });
await agent.login({ identifier: BLUESKY_IDENTIFIER, password: BLUESKY_APP_PASSWORD });

for (const rk of process.argv.slice(2)) {
  await agent.deletePost(`at://${agent.session.did}/app.bsky.feed.post/${rk}`);
  console.log('borrado', rk);
}
