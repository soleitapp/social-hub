// Autorización única de Google Drive con tu cuenta (OAuth). Abre el navegador, pides permiso y el token de
// actualización queda en .env.local como GOOGLE_OAUTH_REFRESH_TOKEN (no se imprime). Lo corres tú, una vez.
//   Requiere GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET en .env.local (cliente tipo "Aplicación de escritorio").
//   node scripts/drive-authorize.mjs
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { OAuth2Client } from 'google-auth-library';

const ENV = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), '.env.local');
try { process.loadEnvFile(ENV); } catch { /* sin .env.local */ }
const { GOOGLE_OAUTH_CLIENT_ID: id, GOOGLE_OAUTH_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) { console.error('Faltan GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET en .env.local'); process.exit(1); }

const server = http.createServer();
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const redirect = `http://127.0.0.1:${server.address().port}`;
const oauth = new OAuth2Client(id, secret, redirect);
const url = oauth.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: ['https://www.googleapis.com/auth/drive'] });

console.log('Abriendo el navegador para autorizar Drive…\nSi no se abre, copia esta dirección:\n' + url + '\n');
exec(`start "" "${url}"`);

server.on('request', async (req, res) => {
  const code = new URL(req.url, redirect).searchParams.get('code');
  if (!code) { res.end('Falta el código.'); return; }
  try {
    const { tokens } = await oauth.getToken(code);
    if (!tokens.refresh_token) throw new Error('Google no devolvió un token de actualización (revoca el acceso previo y reintenta)');
    const raw = fs.existsSync(ENV) ? fs.readFileSync(ENV, 'utf8') : '';
    const nl = raw.includes('\r\n') ? '\r\n' : '\n';
    const lineas = raw.split(/\r?\n/).filter((l) => !/^\s*GOOGLE_OAUTH_REFRESH_TOKEN\s*=/.test(l));
    while (lineas.length && lineas[lineas.length - 1] === '') lineas.pop();
    lineas.push(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`, '');
    fs.writeFileSync(ENV, lineas.join(nl));
    res.end('Listo. Puedes cerrar esta pestaña.');
    console.log('Listo: GOOGLE_OAUTH_REFRESH_TOKEN guardado en .env.local.');
  } catch (e) {
    res.end('Error: ' + e.message);
    console.error('Error:', e.message);
  }
  server.close();
});
