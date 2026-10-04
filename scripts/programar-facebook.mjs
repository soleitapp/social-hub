// Programa en Facebook (programación nativa de la Página) las distribuciones `ready` de facebook/post.
// Facebook las publica solo a la hora fijada; no depende de que este equipo esté encendido.
//   node scripts/programar-facebook.mjs        → SIMULACIÓN: imprime fechas y archivos. No escribe nada.
//   node scripts/programar-facebook.mjs --go   → crea las publicaciones programadas y actualiza Firestore
//                                                (exige un respaldo de hoy en backups/).
// Fechas: conserva el orden y la hora originales (previousScheduledAt) y corre los días hacia adelante,
// empezando mañana (UTC).
import fs from 'node:fs';
import path from 'node:path';
import { db, toPlain, BACKUPS } from './lib/firestore.mjs';

const GO = process.argv.includes('--go');
const PAGE_ID = process.env.META_PAGE_ID;
const TOKEN = process.env.META_PAGE_TOKEN;
const G = 'https://graph.facebook.com/v21.0';
const PIEZAS = path.join(process.env.RS ?? 'G:/My Drive/Marketing/Redes sociales', 'Piezas');
const DAY = 86400000;

if (!TOKEN || !PAGE_ID) { console.error('Faltan META_PAGE_TOKEN y META_PAGE_ID en .env.local'); process.exit(1); }

const filePath = (url) => path.join(PIEZAS, decodeURIComponent(url.replace(/^\/api\/drive\//, '').split('?')[0]));

// 1) reunir las listas
const items = [];
for (const p of (await db.collection('pieces').get()).docs) {
  const ref = p.ref.collection('distributions').doc('facebook_post');
  const d = await ref.get();
  if (!d.exists) continue;
  const x = toPlain(d.data());
  if (x.status !== 'ready' || x.postId) continue;
  const piece = toPlain(p.data());
  const asset = (piece.assets || []).find((a) => a.id === x.assetId);
  items.push({ ref, code: piece.code, pieceId: p.id, caption: x.caption, prev: x.previousScheduledAt, files: (asset?.files || []).map(filePath) });
}
items.sort((a, b) => (a.prev || '').localeCompare(b.prev || ''));

// 2) fechas nuevas: mismo orden y hora, desde mañana
const first = new Date(items[0].prev);
const tomorrow = new Date(); tomorrow.setUTCHours(0, 0, 0, 0); tomorrow.setTime(tomorrow.getTime() + DAY);
const day0 = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate()));
for (const it of items) {
  const o = new Date(it.prev);
  const off = Math.round((Date.UTC(o.getUTCFullYear(), o.getUTCMonth(), o.getUTCDate()) - day0.getTime()) / DAY);
  it.when = new Date(tomorrow.getTime() + off * DAY + (o.getTime() % DAY));
}

for (const it of items) {
  const falta = it.files.filter((f) => !fs.existsSync(f));
  console.log(`${it.code.padEnd(4)} ${it.when.toISOString()}  ${it.files.length} archivo(s)${falta.length ? '  ⚠ FALTAN: ' + falta.join(', ') : ''}`);
}
if (!GO) { console.log('\nSIMULACIÓN: no se escribió nada. Para programar: node scripts/programar-facebook.mjs --go'); process.exit(0); }

const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
if (!fs.readdirSync(BACKUPS).some((f) => f.startsWith(`firestore-${hoy}`))) { console.error('Falta un respaldo de hoy. Corre: node scripts/firestore-backup.mjs'); process.exit(1); }
if (items.some((it) => it.files.some((f) => !fs.existsSync(f)))) { console.error('Faltan archivos en Drive; no programo nada.'); process.exit(1); }

async function fb(endpoint, form) {
  const r = await fetch(`${G}/${endpoint}`, { method: 'POST', body: form });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
}
const photo = (file, extra = {}) => {
  const f = new FormData();
  f.set('access_token', TOKEN);
  f.set('source', new Blob([fs.readFileSync(file)]), path.basename(file));
  for (const [k, v] of Object.entries(extra)) f.set(k, v);
  return f;
};

let ok = 0;
for (const it of items) {
  const ts = String(Math.floor(it.when.getTime() / 1000));
  try {
    let id;
    if (it.files.length === 1) {
      const r = await fb(`${PAGE_ID}/photos`, photo(it.files[0], { caption: it.caption, published: 'false', scheduled_publish_time: ts, unpublished_content_type: 'SCHEDULED' }));
      id = r.post_id || r.id;
    } else {
      const ids = [];
      for (const f of it.files) ids.push((await fb(`${PAGE_ID}/photos`, photo(f, { published: 'false' }))).id);
      const f = new FormData();
      f.set('access_token', TOKEN); f.set('message', it.caption); f.set('published', 'false');
      f.set('scheduled_publish_time', ts); f.set('unpublished_content_type', 'SCHEDULED');
      ids.forEach((m, i) => f.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: m })));
      id = (await fb(`${PAGE_ID}/feed`, f)).id;
    }
    const now = new Date();
    await it.ref.update({ status: 'scheduled', scheduledAt: it.when, postId: id, scheduledOn: 'facebook', updatedBy: 'programar-facebook', updatedAt: now });
    await db.collection('events').add({ actor: 'programar-facebook', pieceId: it.pieceId, code: it.code, platform: 'facebook', surface: 'post', estadoPrevio: 'ready', estado: 'scheduled', cambios: { scheduledAt: it.when.toISOString(), postId: id }, at: now });
    ok++;
    console.log(`  ✓ ${it.code} programada para ${it.when.toISOString()} (${id})`);
  } catch (e) {
    console.error(`  ✗ ${it.code}: ${e.message}`);
  }
}
console.log(`\n${ok}/${items.length} programadas.`);
