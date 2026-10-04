import fs from 'fs';
import path from 'path';
import { archivoPorRuta, abrir } from '@/lib/drive.mjs';

// Sirve los assets reales de Drive (Piezas/) de forma segura (solo dentro de PIEZAS).
// RS env var permite sobreescribir la ruta base en producción o CI.
const DRIVE_BASE = process.env.RS
  ?? 'G:/My Drive/Marketing/Redes sociales';
const PIEZAS = path.join(DRIVE_BASE, 'Piezas');

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4' };

export async function GET(req, { params }) {
  const rel = decodeURIComponent((params.path || []).join('/'));
  const abs = path.resolve(PIEZAS, rel);
  if (!abs.startsWith(path.resolve(PIEZAS))) return new Response('forbidden', { status: 403 });
  const type = MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream';
  // Con Drive montado en el equipo se lee del disco; sin él (producción) se lee por la API de Drive.
  if (fs.existsSync(abs)) {
    return new Response(fs.readFileSync(abs), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' } });
  }
  try {
    const id = await archivoPorRuta(rel);
    if (!id) return new Response('not found', { status: 404 });
    const r = await abrir(id, req.headers.get('range'));
    const headers = { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600', 'Accept-Ranges': 'bytes' };
    for (const h of ['content-length', 'content-range']) if (r.headers[h]) headers[h] = r.headers[h];
    return new Response(r.body, { status: r.status, headers });
  } catch (e) {
    console.error('drive', rel, e.response?.status, e.message);
    return new Response('not found', { status: 404 });
  }
}
