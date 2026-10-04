import fs from 'fs';
import path from 'path';

// Sirve archivos públicos de sitio-web (ej. /assets/blog/<slug>.webp) para el preview del hub.
const WEB_PUBLIC = process.env.SITE_REPO
  ? path.join(process.env.SITE_REPO, 'public')
  : path.resolve(process.cwd(), '..', 'sitio-web', 'public');

const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.avif': 'image/avif' };

export async function GET(_req, { params }) {
  const rel = decodeURIComponent((params.path || []).join('/'));
  const abs = path.resolve(WEB_PUBLIC, rel);
  if (!abs.startsWith(path.resolve(WEB_PUBLIC))) return new Response('forbidden', { status: 403 });
  try {
    const buf = fs.readFileSync(abs);
    const type = MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream';
    return new Response(buf, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return new Response('not found', { status: 404 });
  }
}
