// Reconcilia el estado de las distribuciones "programadas" vencidas de Firestore contra la realidad de cada red.
//
//   node scripts/reconcile-estados.mjs          → SIMULACIÓN: junta evidencia, imprime el plan y lo guarda en backups/. No escribe en Firestore.
//   node scripts/reconcile-estados.mjs --go     → aplica el plan (exige un respaldo de hoy en backups/) y registra un evento por cambio.
//
// Reglas:
//   con evidencia de que salió  → published (url, publishedAt, postId desde la red)
//   confirmado que NO salió     → ready (la fecha anterior queda en previousScheduledAt y se quita scheduledAt)
//   sin forma de verificar      → no se toca (X, Threads, TikTok, LinkedIn, YouTube sin URL, Facebook sin evidencia clara)
//
// Evidencia: feed público de Bluesky, oEmbed de YouTube, HEAD del blog, Graph API de Meta (META_PAGE_TOKEN) y API de Threads (THREADS_USER_TOKEN).
import fs from 'node:fs';
import path from 'node:path';
import { FieldValue } from 'firebase-admin/firestore';
import { db, toPlain, stamp, ensureBackups, BACKUPS } from './lib/firestore.mjs';

const GO = process.argv.includes('--go');
const NOW = new Date();
const PAGE_ID = process.env.META_PAGE_ID; // ID de la Página de Facebook (ver docs/credenciales.md)
const BSKY_HANDLE = process.env.BLUESKY_IDENTIFIER || 'tu-usuario.bsky.social';
const norm = (u) => (u || '').replace(/^https?:\/\/(www\.|m\.)?/, '').replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
const hours = (a, b) => Math.abs(a - b) / 36e5;
const get = async (url, opts = {}) => { const r = await fetch(url, { signal: AbortSignal.timeout(30000), ...opts }); return r; };
const getJson = async (url) => { const r = await get(url); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`); return j; };

// ---------- 1) Distribuciones programadas y vencidas
const pieces = await db.collection('pieces').get();
const sched = [];
for (const p of pieces.docs) {
  const code = p.data().code;
  const ds = await p.ref.collection('distributions').get();
  for (const d of ds.docs) {
    const x = toPlain(d.data());
    if (x.status === 'scheduled') sched.push({ ref: d.ref, pieceId: p.id, code, id: d.id, ...x });
  }
}
console.log(`Programadas en Firestore: ${sched.length}`);
const overdue = sched.filter((d) => d.scheduledAt && new Date(d.scheduledAt) < NOW);
console.log(`  con fecha ya vencida: ${overdue.length}`);

// ---------- 2) Evidencia por red
const evidence = {};

// Bluesky: feed público completo
{
  const posts = []; let cursor = '';
  do {
    const j = await getJson(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${BSKY_HANDLE}&limit=100&filter=posts_no_replies${cursor ? `&cursor=${cursor}` : ''}`);
    for (const f of j.feed) posts.push({ at: new Date(f.post.record.createdAt), text: f.post.record.text || '', uri: f.post.uri });
    cursor = j.cursor;
  } while (cursor && posts.length < 3000);
  evidence.bluesky = posts;
  console.log(`Bluesky: ${posts.length} posts en la cuenta`);
}

// Meta: Facebook e Instagram con el token de Página
const TOKEN = process.env.META_PAGE_TOKEN;
async function graphAll(first) {
  const out = []; let url = first;
  while (url) { const j = await getJson(url); out.push(...(j.data || [])); url = j.paging?.next || null; }
  return out;
}
if (TOKEN && PAGE_ID) {
  const G = 'https://graph.facebook.com/v21.0';
  const fb = await graphAll(`${G}/${PAGE_ID}/published_posts?fields=id,message,created_time,permalink_url&limit=100&access_token=${TOKEN}`);
  evidence.facebook = fb.map((p) => ({ id: p.id, url: p.permalink_url, nurl: norm(p.permalink_url), at: new Date(p.created_time), text: p.message || '' }));
  const acct = await getJson(`${G}/${PAGE_ID}?fields=instagram_business_account&access_token=${TOKEN}`);
  const ig = acct.instagram_business_account?.id
    ? await graphAll(`${G}/${acct.instagram_business_account.id}/media?fields=id,permalink,timestamp,caption&limit=100&access_token=${TOKEN}`)
    : [];
  evidence.instagram = ig.map((m) => ({ id: m.id, url: m.permalink, short: (m.permalink.match(/\/(p|reel|tv)\/([^/]+)/) || [])[2], at: new Date(m.timestamp), text: m.caption || '' }));
  console.log(`Facebook: ${evidence.facebook.length} posts · Instagram: ${evidence.instagram.length} publicaciones`);
} else console.log('Sin META_PAGE_TOKEN o META_PAGE_ID: Facebook e Instagram no se evalúan.');

// Threads: publicaciones de la cuenta con el token de usuario
const THREADS_TOKEN = process.env.THREADS_USER_TOKEN;
if (THREADS_TOKEN) {
  const posts = []; let url = `https://graph.threads.net/v1.0/me/threads?fields=id,permalink,timestamp,text&limit=100&access_token=${THREADS_TOKEN}`;
  while (url) { const j = await getJson(url); posts.push(...(j.data || [])); url = j.paging?.next || null; }
  evidence.threads = posts.map((m) => ({ id: m.id, url: m.permalink, short: (m.permalink || '').split('/post/')[1]?.split(/[/?]/)[0], at: new Date(m.timestamp), text: m.text || '' }));
  console.log(`Threads: ${evidence.threads.length} publicaciones en la cuenta`);
} else console.log('Sin THREADS_USER_TOKEN: Threads no se evalúa.');

const pre = (s) => (s || '').slice(0, 30);
function matchFb(d) {
  const L = evidence.facebook || [];
  return (d.url && L.find((p) => p.nurl === norm(d.url)))
    || (d.postId && L.find((p) => p.id === d.postId || p.id.endsWith(`_${d.postId}`)))
    || (d.scheduledAt && L.find((p) => hours(p.at, new Date(d.scheduledAt)) <= 1.5))
    || (d.caption && d.caption.length >= 20 && L.find((p) => p.text.startsWith(pre(d.caption))));
}
function matchIg(d) {
  const L = evidence.instagram || [];
  const sh = (d.url || '').match(/\/(p|reel|tv)\/([^/?]+)/)?.[2];
  return (sh && L.find((p) => p.short === sh))
    || (d.scheduledAt && L.find((p) => hours(p.at, new Date(d.scheduledAt)) <= 1.5))
    || (d.caption && d.caption.length >= 20 && L.find((p) => p.text.startsWith(pre(d.caption))));
}
function matchTh(d) {
  const L = evidence.threads || [];
  const sh = (d.url || '').split('/post/')[1]?.split(/[/?]/)[0];
  return (sh && L.find((p) => p.short === sh))
    || (d.scheduledAt && L.find((p) => hours(p.at, new Date(d.scheduledAt)) <= 3))
    || (d.caption && d.caption.length >= 20 && L.find((p) => p.text.startsWith(pre(d.caption))));
}
function matchBsky(d) {
  const L = evidence.bluesky || [];
  return (d.scheduledAt && L.find((p) => hours(p.at, new Date(d.scheduledAt)) <= 6))
    || (d.caption && d.caption.length >= 20 && L.find((p) => p.text.startsWith(pre(d.caption))));
}
async function oembedOk(base, url) { try { const r = await get(base + encodeURIComponent(url)); return r.status; } catch { return 0; } }

// ---------- 3) Plan
const plan = [];
const keep = {};
const add = (d, to, set, evidenceText) => plan.push({ path: d.ref.path, pieceId: d.pieceId, code: d.code, platform: d.platform, surface: d.surface, from: d.status, to, set, evidence: evidenceText });
const hold = (d, why) => { const k = `${d.platform} · ${why}`; keep[k] = (keep[k] || 0) + 1; };

for (const d of overdue) {
  const prev = d.scheduledAt;
  const toReady = (why) => add(d, 'ready', { previousScheduledAt: prev, _unsetScheduledAt: true }, why);
  const toPub = (m, extra, why) => add(d, 'published', { ...extra, publishedAt: (m.at || new Date(d.scheduledAt)).toISOString(), publishedPrecision: 'minute' }, why);

  if (d.platform === 'facebook' && TOKEN) {
    const m = matchFb(d);
    if (m) toPub(m, { url: m.url, postId: m.id }, `post de Facebook ${m.id}`);
    else if (d.surface === 'post') toReady('no existe en la Página (los 82 posts de la Página no lo incluyen)');
    else hold(d, `${d.surface} sin evidencia`);
  } else if (d.platform === 'instagram' && d.surface !== 'story' && TOKEN) {
    const m = matchIg(d);
    if (m) toPub(m, { url: m.url, postId: m.id }, `publicación de Instagram ${m.id}`);
    else toReady('no existe en la cuenta de Instagram');
  } else if (d.platform === 'threads' && THREADS_TOKEN) {
    const m = matchTh(d);
    if (m) toPub(m, { url: m.url, postId: m.id }, `publicación de Threads ${m.id}`);
    else toReady('no existe en la cuenta de Threads');
  } else if (d.platform === 'bluesky') {
    const m = matchBsky(d);
    if (m) toPub(m, { url: `https://bsky.app/profile/${BSKY_HANDLE}/post/${m.uri.split('/').pop()}`, postId: m.uri }, 'post en el feed de Bluesky');
    else toReady('no hay post en el feed de Bluesky');
  } else if (d.platform === 'youtube' && d.url) {
    const st = await oembedOk('https://www.youtube.com/oembed?format=json&url=', d.url);
    if (st === 200) toPub({ at: new Date(d.scheduledAt) }, {}, 'oEmbed de YouTube 200');
    else hold(d, `oEmbed ${st}`);
  } else if (d.platform === 'blog' && d.url) {
    let st = 0; try { st = (await get(d.url, { method: 'HEAD' })).status; } catch { /* sin respuesta */ }
    if (st === 200) toPub({ at: new Date(d.scheduledAt) }, {}, 'la página responde 200');
    else if (st === 404) toReady('la página responde 404');
    else hold(d, `HTTP ${st}`);
  } else hold(d, d.url ? 'con URL, sin verificador' : 'sin URL ni verificador');
}

// Posts de la Página que Firestore no tiene (solo informativo)
const fbConocidos = new Set();
for (const p of pieces.docs) { const ds = await p.ref.collection('distributions').get(); for (const x of ds.docs) { const v = x.data(); if (v.platform === 'facebook') { if (v.url) fbConocidos.add(norm(v.url)); if (v.postId) fbConocidos.add(String(v.postId)); } } }
const fbHuerfanos = (evidence.facebook || []).filter((p) => !fbConocidos.has(p.nurl) && !fbConocidos.has(p.id) && !fbConocidos.has(p.id.split('_').pop()));

// ---------- 4) Informe
const resumen = {};
for (const x of plan) { const k = `${x.platform.padEnd(10)} ${x.from} → ${x.to}`; resumen[k] = (resumen[k] || 0) + 1; }
console.log('\n=== PLAN ===');
for (const [k, n] of Object.entries(resumen).sort()) console.log(`  ${k}: ${n}`);
console.log(`  TOTAL de cambios: ${plan.length}`);
console.log('\n=== SIN TOCAR ===');
for (const [k, n] of Object.entries(keep).sort()) console.log(`  ${k}: ${n}`);
console.log(`\nPosts de la Página de Facebook que Firestore no tiene: ${fbHuerfanos.length}`);
for (const p of fbHuerfanos.slice(0, 12)) console.log(`   ${p.at.toISOString().slice(0, 10)} ${p.url}  ${(p.text || '').replace(/\s+/g, ' ').slice(0, 60)}`);

const planFile = path.join(ensureBackups(), `reconcile-plan-${stamp()}.json`);
fs.writeFileSync(planFile, JSON.stringify({ generatedAt: NOW.toISOString(), plan, sinTocar: keep, fbHuerfanos }, null, 2));
console.log(`\nPlan guardado en ${planFile}`);

if (!GO) { console.log('\nSIMULACIÓN: no se escribió nada en Firestore. Para aplicar: node scripts/reconcile-estados.mjs --go'); process.exit(0); }

// ---------- 5) Aplicar
const hoy = new Date().toISOString().slice(0, 8);
const hayRespaldo = fs.readdirSync(BACKUPS).some((f) => f.startsWith(`firestore-${hoy.replace(/-/g, '')}`));
if (!hayRespaldo) { console.error('Falta un respaldo de hoy en backups/. Corre primero: node scripts/firestore-backup.mjs'); process.exit(1); }
let batch = db.batch(), n = 0, total = 0;
const commit = async () => { if (n) { await batch.commit(); total += n; batch = db.batch(); n = 0; } };
for (const x of plan) {
  const { _unsetScheduledAt, ...set } = x.set;
  const update = { ...set, status: x.to, updatedBy: 'reconciliar', updatedAt: FieldValue.serverTimestamp() };
  if (set.publishedAt) update.publishedAt = new Date(set.publishedAt);
  if (set.previousScheduledAt) update.previousScheduledAt = new Date(set.previousScheduledAt);
  if (_unsetScheduledAt) update.scheduledAt = FieldValue.delete();
  batch.update(db.doc(x.path), update); n++;
  batch.set(db.collection('events').doc(), { actor: 'reconciliar', pieceId: x.pieceId, code: x.code, platform: x.platform, surface: x.surface, cambios: Object.keys(update).filter((k) => !['updatedBy', 'updatedAt'].includes(k)), estadoPrevio: x.from, estado: x.to, at: FieldValue.serverTimestamp() }); n++;
  if (n >= 400) await commit();
}
await commit();
console.log(`\nAplicado: ${plan.length} distribuciones actualizadas y ${plan.length} eventos registrados (${total} escrituras).`);
