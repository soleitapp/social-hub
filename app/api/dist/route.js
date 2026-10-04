import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { aISO } from '@/lib/dist';
import { carpeta, subir, borrar } from '@/lib/drive.mjs';

// Persiste caption + URL de una distribución. El caption hace write-back a Drive (fuente).
const FILE = path.join(process.cwd(), 'data', 'pieces.json');
const OVERRIDES = path.join(process.cwd(), 'data', 'overrides.json');
const ART_CAPS = path.join(process.cwd(), 'data', 'article-captions.json');
const RS = process.env.RS || 'G:/My Drive/Marketing/Redes sociales';

// En las redes conocidas el permalink es solo la ruta: se descarta toda la query salvo lo que
// de verdad identifica el contenido (YouTube usa ?v=). Es al revés que una lista negra, que
// siempre va atrás del próximo parámetro que inventen (rcm, igsh, si…).
const HOSTS_PERMALINK = /(^|.)(linkedin.com|instagram.com|facebook.com|fb.com|x.com|twitter.com|threads.(net|com)|bsky.app|tiktok.com|youtube.com|youtu.be)$/i;
const CONSERVAR = new Set(['v']);

// Para el resto de los dominios (blog propio, prensa) solo se sacan los de tracking conocidos.
const TRACKING = new Set([
  'feature', 'si', 'app', 'ref', 'ref_src', 'ref_url', 'source',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'twclid', 'igsh', 'igshid', 'mibextid', 'sfnsn', 'extid', '__tn__',
  's', 't', 'rdt', 'share_id', 'share_app_id', 'is_from_webapp', 'sender_device', 'web_id',
]);

// 'YYYY-MM-DDTHH:mm' en hora local, que es el formato con el que trabaja el hub.
function ahoraLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Deja el permalink limpio: sin tracking, sin ancla y sin '?' huérfano.
function limpiarUrl(raw) {
  const txt = String(raw || '').trim();
  if (!txt) return '';
  const conProtocolo = /^https?:\/\//i.test(txt) ? txt : (/^[\w.-]+\.\w{2,}/.test(txt) ? `https://${txt}` : txt);
  try {
    const u = new URL(conProtocolo);
    const limpiarTodo = HOSTS_PERMALINK.test(u.hostname);
    for (const k of [...u.searchParams.keys()]) {
      if (limpiarTodo ? !CONSERVAR.has(k.toLowerCase()) : TRACKING.has(k.toLowerCase())) u.searchParams.delete(k);
    }
    u.hash = '';
    return u.toString().replace(/\?$/, '');
  } catch {
    return txt; // no es una URL parseable: se guarda como vino
  }
}

export async function POST(req) {
  const body = await req.json();
  const { id, platform, surface } = body;
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const piece = data.pieces.find((p) => p.id === id);
  const dist = piece?.distributions.find((d) => d.platform === platform && d.surface === surface);
  if (!dist) return NextResponse.json({ error: 'distribución no existe' }, { status: 404 });

  // Overrides: clave estable que sobrevive al re-seed. Se mergea por campo para que
  // guardar una URL no borre la programación (ni al revés).
  const estadoPrevio = dist.status;
  const ovKey = `${piece.type}-${piece.n}/${platform}/${surface}`;
  const patchOverride = (patch) => {
    try {
      let ov = {};
      try { ov = JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')); } catch { /* nuevo */ }
      const next = { ...(ov[ovKey] || {}), ...patch };
      for (const k of Object.keys(next)) if (next[k] == null) delete next[k];
      if (Object.keys(next).length) ov[ovKey] = next; else delete ov[ovKey];
      fs.writeFileSync(OVERRIDES, JSON.stringify(ov, null, 2));
    } catch { /* no crítico */ }
  };

  if ('url' in body) {
    const u = limpiarUrl(body.url);
    if (u) {
      dist.url = u;
      // La URL NO confirma publicado: TikTok (y YouTube) exponen el permalink de una
      // publicación programada antes de que salga. Si hay fecha, sigue programada.
      if (dist.status !== 'deleted' && !dist.scheduledAt) dist.status = 'published';
      // Registro de cuándo salió: si venía de una programación cumplida vale esa hora; si se
      // publicó a mano, el momento en que se carga el permalink.
      if (dist.status === 'published' && !dist.date) {
        const prog = dist.scheduledAt ? new Date(dist.scheduledAt).getTime() : NaN;
        dist.date = !Number.isNaN(prog) && prog <= Date.now() ? dist.scheduledAt : ahoraLocal();
        patchOverride({ date: dist.date });
      }
    } else {
      delete dist.url;
      if (dist.status === 'published') dist.status = dist.scheduledAt ? 'scheduled' : 'draft';
    }
    patchOverride({ url: u || null });
  }

  // Portada de video (TikTok / YouTube / Reel): frame capturado en el navegador y guardado
  // como JPEG en Drive: Piezas/<driveDir>/portadas/<red>-<superficie>.jpg. `v` rompe la caché al recapturar (el id no cambia).
  if ('cover' in body) {
    if (body.cover?.dataUrl) {
      if (!piece.driveDir) return NextResponse.json({ error: 'la pieza no tiene carpeta en Drive' }, { status: 400 });
      const b64 = String(body.cover.dataUrl).replace(/^data:image\/\w+;base64,/, '');
      try {
        const dir = await carpeta([...piece.driveDir.split('/'), 'portadas'], { crear: true });
        const driveId = await subir(dir, `${platform}-${surface}.jpg`, Buffer.from(b64, 'base64'), 'image/jpeg');
        dist.cover = { driveId, t: Number(body.cover.t) || 0, v: Date.now() };
      } catch (e) {
        return NextResponse.json({ error: `no pude guardar la portada en Drive: ${e.message}` }, { status: 502 });
      }
    } else {
      if (dist.cover?.driveId) { try { await borrar(dist.cover.driveId); } catch { /* ya no está */ } }
      delete dist.cover;
    }
    patchOverride({ cover: dist.cover || null });
  }

  if ('scheduledAt' in body) {
    const s = (body.scheduledAt || '').trim();
    if (s) {
      // Programar hacia atrás no significa nada: se rechaza acá, que es la fuente de verdad.
      const t = new Date(s).getTime();
      if (!Number.isNaN(t) && t < Date.now() - 60000) {
        return NextResponse.json({ error: 'la fecha de programación ya pasó' }, { status: 400 });
      }
      dist.scheduledAt = s;
      if (dist.status !== 'deleted') dist.status = 'scheduled'; // programar manda, aunque ya tenga URL
    } else {
      delete dist.scheduledAt;
      if (dist.status === 'scheduled') dist.status = 'ready';
    }
    patchOverride({ scheduledAt: s || null });
  }
  // Fecha de publicación, editable: para las que se publicaron sin pasar por el hub.
  if ('date' in body) {
    const crudo = (body.date || '').trim();
    const f = aISO(crudo) || crudo; // un solo formato guardado, venga como venga
    if (f) { dist.date = f; if (dist.status !== 'deleted') dist.status = 'published'; }
    else delete dist.date;
    patchOverride({ date: f || null });
  }

  // Título propio de la red (YouTube). Se guarda acá, no en Drive: lo redacta el hub.
  if ('title' in body) {
    const t = (body.title || '').trim();
    if (t) dist.title = t; else delete dist.title;
    patchOverride({ title: t || null });
  }

  if ('caption' in body) {
    const c = (body.caption || '').trim();
    if (c) dist.caption = c; else delete dist.caption;
    // write-back a Drive: captions/<red>.txt (Drive es la fuente para carruseles/placas)
    if (piece.driveDir) {
      try {
        const capPath = path.join(RS, 'Piezas', piece.driveDir, 'captions', `${platform}.txt`);
        if (c) { fs.mkdirSync(path.dirname(capPath), { recursive: true }); fs.writeFileSync(capPath, c, 'utf8'); }
        else if (fs.existsSync(capPath)) fs.unlinkSync(capPath);
      } catch { /* Drive no montado: queda solo en pieces.json */ }
    }
    // "Listo" = el asset está renderizado y el caption escrito. Escribirlo (o borrarlo) mueve
    // el borrador en esa dirección; lo publicado o programado no se toca.
    const asset = piece.assets.find((a) => a.id === dist.assetId);
    const renderizado = asset?.status === 'rendered' && (asset.files?.length || asset.file);
    if (c && dist.status === 'draft' && renderizado) dist.status = 'ready';
    else if (!c && dist.status === 'ready') dist.status = 'draft';

    // artículos: sin carpeta en Drive → persistir en data/article-captions.json (por slug)
    if (piece.type === 'article') {
      try {
        let store = {};
        try { store = JSON.parse(fs.readFileSync(ART_CAPS, 'utf8')); } catch { /* nuevo */ }
        const key = piece.slug || piece.base?.slug || id;
        store[key] = store[key] || {};
        if (c) store[key][platform] = c; else delete store[key][platform];
        fs.writeFileSync(ART_CAPS, JSON.stringify(store, null, 2));
      } catch { /* no crítico */ }
    }
  }
  // Publicada de verdad: la fecha de programación ya no aporta y confunde (queda `date`
  // como registro de cuándo salió).
  if (dist.status === 'published' && dist.scheduledAt) {
    delete dist.scheduledAt;
    patchOverride({ scheduledAt: null });
  }
  // El estado se blinda solo cuando esta llamada lo movió: así sobrevive al re-seed sin
  // congelar lo que el seed deduce bien por su cuenta.
  if (dist.status !== estadoPrevio) patchOverride({ status: dist.status });

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  return NextResponse.json({ ok: true, distribution: dist });
}
