import fs from 'fs';
import path from 'path';
import { zip } from '@/lib/zip.mjs';
import { leer } from '@/lib/drive.mjs';
import { PLATFORMS, SURFACES, CAPTION_LIMIT, TITLE_LIMIT, DIST_STATUS } from '@/lib/schema';

// Arma el paquete exacto que hace falta para publicar en una red: los archivos del asset
// que esa distribución usa (con su recorte si lo tiene), los alts, el caption y la portada.
const FILE = path.join(process.cwd(), 'data', 'pieces.json');
const RS = process.env.RS || 'G:/My Drive/Marketing/Redes sociales';
const PIEZAS = path.join(RS, 'Piezas');
const PUBLIC = path.join(process.cwd(), 'public');

// Las rutas del modelo son URLs del hub: /api/drive/<rel> (Drive) o /covers|/assets/<rel> (public).
function toDisk(url) {
  if (!url) return null;
  const u = decodeURIComponent(url.split('?')[0]);
  if (u.startsWith('/api/drive/')) {
    const abs = path.resolve(PIEZAS, u.slice('/api/drive/'.length));
    return abs.startsWith(path.resolve(PIEZAS)) ? abs : null;
  }
  if (u.startsWith('/')) {
    const abs = path.resolve(PUBLIC, u.slice(1));
    return abs.startsWith(path.resolve(PUBLIC)) ? abs : null;
  }
  return null;
}

const slug = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const id = q.get('id');
  const platform = q.get('platform');
  const surface = q.get('surface');

  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const piece = data.pieces.find((p) => p.id === id);
  const dist = piece?.distributions.find((d) => d.platform === platform && d.surface === surface);
  if (!dist) return new Response('distribución no existe', { status: 404 });
  const asset = piece.assets.find((a) => a.id === dist.assetId);

  const entries = [];
  const faltan = [];
  const info = [
    `${piece.id} · ${piece.title}`,
    `${PLATFORMS[platform]?.label || platform} · ${SURFACES[surface] || surface}`,
    `estado: ${DIST_STATUS[dist.status]?.label || dist.status}${dist.scheduledAt ? ` · programado ${dist.scheduledAt.replace('T', ' ')}` : ''}`,
    '',
  ];

  // Imágenes del asset (ya vienen recortadas si la distribución usa el asset parcial).
  const files = asset?.files || [];
  files.forEach((f, i) => {
    const abs = toDisk(f);
    const ext = path.extname(f) || '.png';
    const name = `${String(i + 1).padStart(2, '0')}${ext}`;
    if (abs && fs.existsSync(abs)) entries.push({ name, data: fs.readFileSync(abs) });
    else faltan.push(`imagen ${name} (${f})`);
  });

  // Video.
  if (asset?.file) {
    const abs = toDisk(asset.file);
    const ext = path.extname(asset.file) || '.mp4';
    if (abs && fs.existsSync(abs)) entries.push({ name: `video${ext}`, data: fs.readFileSync(abs) });
    else faltan.push(`video (${asset.file})`);
  }

  // Portada elegida para esta red.
  if (dist.cover?.driveId) {
    try { entries.push({ name: 'portada.jpg', data: await leer(dist.cover.driveId) }); } catch { faltan.push('portada'); }
  } else if (asset?.format === 'short') {
    faltan.push('portada (elegila desde la card)');
  }

  // Título propio de la red (YouTube).
  const tLim = TITLE_LIMIT[platform];
  if (tLim) {
    if (dist.title) {
      entries.push({ name: 'titulo.txt', data: Buffer.from(dist.title, 'utf8') });
      info.push(`título: ${dist.title.length} caracteres (límite ${tLim}${dist.title.length > tLim ? ' — SE PASA' : ''})`);
    } else {
      faltan.push('título');
    }
  }

  // Caption, con su cuenta de caracteres contra el límite de la red.
  if (dist.caption) {
    entries.push({ name: 'caption.txt', data: Buffer.from(dist.caption, 'utf8') });
    const lim = CAPTION_LIMIT[platform];
    info.push(`caption: ${dist.caption.length} caracteres${lim ? ` (límite ${lim}${dist.caption.length > lim ? ' — SE PASA' : ''})` : ''}`);
  } else {
    faltan.push('caption');
  }

  // Alts, numerados igual que las imágenes. Los carruseles traen `alts` (uno por lámina) y las
  // placas `alt` (una sola imagen): las dos formas terminan en el mismo archivo.
  const alts = asset?.alts?.length ? asset.alts : (asset?.alt ? [asset.alt] : []);
  if (alts.length && files.length) {
    const lines = files.map((_, i) => `${String(i + 1).padStart(2, '0')}: ${alts[i] || '(sin alt)'}`);
    entries.push({ name: 'alts.txt', data: Buffer.from(lines.join('\n'), 'utf8') });
    const sin = files.filter((_, i) => !alts[i]).length;
    if (sin) faltan.push(`${sin} alt`);
  } else if (files.length) {
    faltan.push('alts');
  }

  if (!entries.length) return new Response('esta distribución todavía no tiene archivos', { status: 404 });

  if (faltan.length) info.push('', `FALTA: ${faltan.join(', ')}`);
  entries.push({ name: 'info.txt', data: Buffer.from(info.join('\n') + '\n', 'utf8') });

  const buf = zip(entries);
  const name = `${piece.id}-${slug(piece.title)}-${platform}-${surface}.zip`;
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': String(buf.length),
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  });
}
