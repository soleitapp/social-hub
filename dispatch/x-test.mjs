// VALIDACIÓN MÍNIMA — publica UN post a X (Twitter) desde local.
// Auth: OAuth 1.0a (contexto de usuario) → 4 tokens que generas en el portal de
// desarrollador para tu propia cuenta. No hay flujo de navegador ni app-review
// para postear a tu cuenta. El free tier permite publicar (~1.500/mes).
//
// Uso:
//   1) cd publisher && npm install
//   2) en .env pon X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
//      (developer.x.com → tu app → Keys and tokens; el Access Token debe tener
//       permiso Read and Write)
//   3) npm run test:x
//   Publica un post REAL y público (lo puedes borrar).
import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';

const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;

// ≤280 (la URL cuenta como 23 vía t.co). Salida de estilo del adaptador toX.
const TEXT = `Post de prueba para verificar las credenciales de X: https://example.com/post-de-prueba

#TuMarca`;

if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
  console.error('Faltan credenciales de X en .env (X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET).');
  process.exit(1);
}

const client = new TwitterApi({
  appKey: X_API_KEY,
  appSecret: X_API_SECRET,
  accessToken: X_ACCESS_TOKEN,
  accessSecret: X_ACCESS_SECRET,
});

const res = await client.v2.tweet(TEXT);
console.log('✓ publicado en X');
console.log(`  ver: https://x.com/tu_usuario/status/${res.data.id}`);
