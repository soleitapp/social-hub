// VALIDACIÓN MÍNIMA — publica UN post a Bluesky desde local.
// Objetivo: probar que (1) el login por app-password funciona y (2) una caption
// adaptada se ve bien (link clickeable + hashtags). Nada de pipeline todavía.
//
// Uso:
//   1) cd publisher && npm install
//   2) copia .env.example a .env y pon tu app-password (Bluesky > Settings >
//      Privacy & Security > App Passwords)
//   3) npm test
//   Publica un post REAL y público (lo puedes borrar después).
import 'dotenv/config';
import { AtpAgent, RichText } from '@atproto/api';

const IDENTIFIER = process.env.BLUESKY_IDENTIFIER || 'tu-usuario.bsky.social';
const PASSWORD = process.env.BLUESKY_APP_PASSWORD;

// Caption de prueba (≤300 caracteres): cámbialo por algo tuyo antes de ejecutar; publica de verdad.
const TEXT = `Título de prueba del post.

Una o dos frases de ejemplo para verificar que las credenciales de Bluesky funcionan.

https://example.com/post-de-prueba

#TuMarca`;

if (!PASSWORD) {
  console.error('Falta BLUESKY_APP_PASSWORD (crea .env desde .env.example).');
  process.exit(1);
}

const agent = new AtpAgent({ service: 'https://bsky.social' });
await agent.login({ identifier: IDENTIFIER, password: PASSWORD });

// RichText detecta links y hashtags → los deja clickeables (facets).
const rt = new RichText({ text: TEXT });
await rt.detectFacets(agent);

const res = await agent.post({
  text: rt.text,
  facets: rt.facets,
  langs: ['es'],
  createdAt: new Date().toISOString(),
});

const rkey = res.uri.split('/').pop();
console.log('✓ publicado en Bluesky');
console.log(`  ver: https://bsky.app/profile/${IDENTIFIER}/post/${rkey}`);
