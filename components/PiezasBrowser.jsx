'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DIST_STATUS, PLATFORMS, SURFACES, CAPTION_LIMIT, TITLE_LIMIT } from '@/lib/schema';
import PiecePreview from '@/components/PiecePreview';
import PlatformIcon from '@/components/PlatformIcon';
import PageHeader from '@/components/PageHeader';
import { BRAND_SIGNATURE } from '@/lib/brand';
import { useConfirm } from '@/components/ConfirmDialog';
import { buildVideoCover, coverSlideOf, coverTextOf } from '@/lib/coverGen';
import { buildPlacaStory, placaImageOf, storyAssetOf } from '@/lib/storyGen';
import { cuandoSale, yaSalio, estadoDe, aISO, fmtFecha } from '@/lib/dist';

const TONE = {
  ok: 'text-glow border-primary/40 bg-primary/10',
  warn: 'text-warning border-warning/40 bg-warning/10',
  info: 'text-teal border-primary/30 bg-primary/[0.06]',
  idle: 'text-sub border-white/10 bg-white/5',
  off: 'text-error/80 border-error/30 bg-error/10',
};
const stripTags = (s) => (typeof s === 'string' ? s.replace(/<[^>]+>/g, '') : s);
const ACT = 'rounded border border-line px-1.5 py-0.5 text-white/80 transition-colors hover:border-primary/40 hover:text-white';

function Badge({ status }) {
  const m = DIST_STATUS[status] || DIST_STATUS.draft;
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-[10px] ${TONE[m.tone]}`}>{m.label}</span>;
}

function CharCount({ value, limit }) {
  const n = (value || '').length;
  const over = limit != null && n > limit;
  return <span className={`font-mono text-[10px] ${over ? 'text-error' : 'text-sub'}`}>{n}{limit != null ? ` / ${limit}` : ''}</span>;
}

// datetime-local trabaja con 'YYYY-MM-DDTHH:mm'. Si viene solo la fecha, asume la mañana.
const toInputWhen = (s) => {
  const iso = aISO(s);
  if (!iso) return '';
  return iso.includes('T') ? iso : `${iso}T09:00`;
};
// Ahora, en formato de datetime-local y en hora local (no UTC).
const nowInput = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const enPasado = (v) => !!v && new Date(v).getTime() < Date.now() - 60000;
const fmtWhen = (s) => fmtFecha(s);

// Superficies de video: son las que en TikTok/YouTube/IG dejan elegir una portada propia.
const VIDEO_SURFACES = new Set(['video', 'short', 'reel']);

// Elige la portada capturando un frame del propio video (mismo origen → el canvas no se contamina).
function CoverPicker({ dist, asset, onClose, onSave }) {
  const vRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [t, setT] = useState(dist.cover?.t ?? 0);

  const step = (delta) => {
    const v = vRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  };

  async function capture() {
    const v = vRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    setSaving(true);
    try {
      await onSave({ dataUrl: c.toDataURL('image/jpeg', 0.92), t: v.currentTime });
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-md flex-col rounded-md border border-line bg-panel p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 font-sans text-sm font-semibold text-white/90">
          Portada · {PLATFORMS[dist.platform]?.label} <span className="font-mono text-[11px] text-sub">({SURFACES[dist.surface]})</span>
        </div>
        <video
          ref={vRef}
          src={asset.file}
          controls
          preload="auto"
          playsInline
          onLoadedMetadata={(e) => { if (dist.cover?.t) e.currentTarget.currentTime = dist.cover.t; }}
          onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
          className="mx-auto min-h-0 rounded-lg border border-line bg-black"
          style={{ maxHeight: '60vh', aspectRatio: '9 / 16' }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-sub">{t.toFixed(2)}s</span>
          <button onClick={() => step(-1 / 30)} title="Un frame atrás" className="rounded-md border border-line px-2 py-1 font-mono text-[11px] text-sub hover:text-white">−1f</button>
          <button onClick={() => step(1 / 30)} title="Un frame adelante" className="rounded-md border border-line px-2 py-1 font-mono text-[11px] text-sub hover:text-white">+1f</button>
          <button disabled={saving} onClick={capture} className="ml-auto rounded-md border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] text-glow transition-colors hover:bg-primary/20 disabled:opacity-50">
            {saving ? 'Guardando…' : 'Usar este frame'}
          </button>
          <button onClick={onClose} className="rounded-md border border-line px-3 py-1 font-mono text-[11px] text-sub transition-colors hover:text-white">Cancelar</button>
        </div>
        <p className="mt-2 font-mono text-[10px] leading-tight text-sub">
          Pausá el video donde quieras la portada. Se guarda como JPEG y es la que subís a mano en {PLATFORMS[dist.platform]?.label}.
        </p>
      </div>
    </div>,
    document.body,
  );
}

// Distribución: display read-only; las acciones (caption, URL, programación, portada) viven en el menú ⋮.
function DistCard({ dist, asset, pieceId, onSave }) {
  const [caption, setCaption] = useState(dist.caption || '');
  const [url, setUrl] = useState(dist.url || '');
  const [title, setTitle] = useState(dist.title || '');
  const [when, setWhen] = useState(toInputWhen(dist.scheduledAt));
  const [pubDate, setPubDate] = useState(toInputWhen(dist.date));
  const [editing, setEditing] = useState(null); // null | 'caption' | 'url' | 'schedule'
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCap, setCopiedCap] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [open, setOpen] = useState(false); // cada distribución es una fila plegable
  const [err, setErr] = useState('');
  const canCover = VIDEO_SURFACES.has(dist.surface) && !!asset?.file;
  // Ya publicado: programar no tiene sentido (la URL manda sobre cualquier fecha).
  const publicado = estadoDe(dist) === 'published' || dist.status === 'deleted';
  const limit = CAPTION_LIMIT[dist.platform];
  const titleLimit = TITLE_LIMIT[dist.platform]; // undefined = esta red no lleva título propio

  async function save(field, value) {
    setSaving(true);
    setErr('');
    try {
      const ok = await onSave(pieceId, dist.platform, dist.surface, { [field]: value });
      if (ok === true) setEditing(null); else setErr(typeof ok === 'string' ? ok : 'no se pudo guardar');
      return ok;
    } finally {
      setSaving(false);
    }
  }
  const openEdit = (field) => {
    setErr('');
    setOpen(true); // el editor vive en el cuerpo: si estaba plegada, se abre
    if (field === 'caption') setCaption(dist.caption || '');
    if (field === 'url') setUrl(dist.url || '');
    if (field === 'title') setTitle(dist.title || '');
    if (field === 'schedule') setWhen(toInputWhen(dist.scheduledAt) || nowInput()); // sin fecha previa: ahora
    if (field === 'date') setPubDate(toInputWhen(dist.date) || nowInput());
    setEditing(field);
  };
  const copyUrl = async () => {
    if (!dist.url) return;
    try { await navigator.clipboard.writeText(dist.url); setCopied(true); setTimeout(() => setCopied(false), 900); } catch { /* portapapeles bloqueado */ }
  };
  const copyCaption = async () => {
    if (!dist.caption) return;
    try { await navigator.clipboard.writeText(dist.caption); setCopiedCap(true); setTimeout(() => setCopiedCap(false), 900); } catch { /* portapapeles bloqueado */ }
  };
  useEffect(() => {
    if (editing !== 'caption') return;
    const onKey = (e) => { if (e.key === 'Escape') setEditing(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  return (
    <>
      <div className="rounded-lg border border-line bg-panel2">
      <div className="flex items-center gap-2 p-2.5">
        <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Plegar' : 'Desplegar'} aria-expanded={open}
          className="shrink-0 font-mono text-[10px] text-sub transition-transform hover:text-white" style={{ transform: open ? 'rotate(90deg)' : 'none' }}>▶</button>
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="shrink-0 font-sans text-[13px] font-semibold text-white/90">{PLATFORMS[dist.platform]?.label || dist.platform}</span>
          <span className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-sub">{SURFACES[dist.surface] || dist.surface}</span>
          <Badge status={estadoDe(dist)} />
          {estadoDe(dist) === 'published' && !dist.url && (
          <span
            title={yaSalio(dist) ? `Salió el ${fmtWhen(cuandoSale(dist))} — falta cargar el permalink` : 'Publicado sin permalink cargado'}
            className="shrink-0 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[9px] text-warning"
          >
            falta url
          </span>
        )}
        {estadoDe(dist) === 'scheduled' && cuandoSale(dist) && (
            <span title={`Programado para ${fmtWhen(cuandoSale(dist))}`} className="flex shrink-0 items-center gap-1 font-mono text-[9px] text-warning">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />
              </svg>
              {fmtWhen(cuandoSale(dist))}
            </span>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-3">
          {dist.url ? (
            <a href={dist.url} target="_blank" rel="noreferrer" title={dist.url} className="text-glow transition-opacity hover:opacity-70">
              <PlatformIcon platform={dist.platform} size={15} />
            </a>
          ) : (
            <span title="Sin URL" className="text-sub/30"><PlatformIcon platform={dist.platform} size={15} /></span>
          )}
          <a
            href={`/api/bundle?id=${encodeURIComponent(pieceId)}&platform=${dist.platform}&surface=${dist.surface}`}
            title="Descargar el paquete para publicar en esta red"
            className="flex h-6 w-6 items-center justify-center rounded border border-line text-sub transition-colors hover:border-primary/40 hover:text-glow"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12" /><polyline points="7 11 12 16 17 11" /><path d="M4 20h16" />
            </svg>
          </a>
        </div>
      </div>

      {open && (
      <div className="border-t border-line p-2.5 pt-2">
      {titleLimit && (
        <div className="mb-2 flex items-baseline gap-2">
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-sub/50">título</span>
          {dist.title
            ? <span className="min-w-0 flex-1 font-sans text-[13px] font-semibold leading-snug text-white/90">{dist.title}</span>
            : <span className="font-mono text-[11px] italic text-warning/70">falta el título</span>}
          {dist.title && <CharCount value={dist.title} limit={titleLimit} />}
        </div>
      )}

      {/* Caption (read-only; se edita en el modal). Alto máximo → scroll para no desnivelar los cards. */}
      <div className="thin-scroll max-h-[300px] overflow-y-auto pr-1">
        {dist.caption
          ? <p className="whitespace-pre-wrap break-words font-sans text-[12px] leading-relaxed text-sub">{stripTags(dist.caption)}</p>
          : dist.platform === 'blog' && dist.og
            ? (
              <a href={dist.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-line transition-colors hover:border-primary/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dist.og.image} alt="" className="w-full" style={{ aspectRatio: '1200 / 630', objectFit: 'cover' }} />
                <div className="p-2.5">
                  <div className="font-sans text-[13px] font-semibold leading-snug text-white/90">{dist.og.title}</div>
                  <p className="mt-1 line-clamp-2 font-sans text-[11px] text-sub">{dist.og.description}</p>
                  <div className="mt-1.5 font-mono text-[10px] text-glow/70">{BRAND_SIGNATURE}</div>
                </div>
              </a>
            )
          : dist.platform === 'blog'
            ? <p className="font-mono text-[11px] italic text-sub/70">el artículo es la pieza — no lleva caption</p>
            : <p className="font-mono text-[11px] italic text-sub/70">caption propio de {PLATFORMS[dist.platform]?.label} — por adaptar</p>}
      </div>

      {canCover && dist.cover && (
        <div className="mt-2.5 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/cover/${dist.cover.driveId}?v=${dist.cover.v || 0}`} alt="" className="h-20 w-auto rounded-md border border-line" style={{ aspectRatio: '9 / 16', objectFit: 'cover' }} />
          <span className="font-mono text-[10px] text-sub">portada</span>
        </div>
      )}

      {/* Acciones agrupadas por objeto: aparecen al desplegar, en vez de un menú de 8 items. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2.5 font-mono text-[10px]">
        {titleLimit && (
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-[0.14em] text-sub/50">título</span>
            <button onClick={() => openEdit('title')} className={ACT}>{dist.title ? 'editar' : 'agregar'}</button>
            {dist.title && <button onClick={() => { navigator.clipboard?.writeText(dist.title); }} className={ACT}>copiar</button>}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="uppercase tracking-[0.14em] text-sub/50">caption</span>
          <button onClick={() => openEdit('caption')} className={ACT}>{dist.caption ? 'editar' : 'agregar'}</button>
          {dist.caption && <button onClick={copyCaption} className={ACT}>{copiedCap ? 'copiado ✓' : 'copiar'}</button>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="uppercase tracking-[0.14em] text-sub/50">url</span>
          <button onClick={() => openEdit('url')} className={ACT}>{dist.url ? 'editar' : 'agregar'}</button>
          {dist.url && <button onClick={copyUrl} className={ACT}>{copied ? 'copiado ✓' : 'copiar'}</button>}
        </div>
        {/* La fecha de publicación cierra la barra, pegada a la derecha. */}
        {publicado && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="uppercase tracking-[0.14em] text-sub/50">publicado</span>
            {dist.date
              ? <span className="text-[11px] text-white/80">{fmtWhen(dist.date)}</span>
              : <span className="text-[11px] italic text-warning/70">sin fecha registrada</span>}
            <button onClick={() => openEdit('date')} className={ACT}>{dist.date ? 'editar' : 'poner fecha'}</button>
          </div>
        )}
        {!publicado && (
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-[0.14em] text-sub/50">programación</span>
            <button onClick={() => openEdit('schedule')} className={ACT}>{dist.scheduledAt ? 'editar' : 'agregar'}</button>
            {dist.scheduledAt && <button onClick={() => save('scheduledAt', '')} className={`${ACT} text-warning hover:border-warning/40`}>quitar</button>}
          </div>
        )}
        {canCover && (
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-[0.14em] text-sub/50">portada</span>
            <button onClick={() => setCoverOpen(true)} className={ACT}>cargar</button>
          </div>
        )}
      </div>

      {editing === 'schedule' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input type="datetime-local" value={when} min={nowInput()} onChange={(e) => setWhen(e.target.value)} autoFocus
            className="min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1 font-mono text-[11px] text-white focus:border-primary/50 focus:outline-none" />
          <button disabled={saving || !when || enPasado(when)} title={enPasado(when) ? 'Esa fecha ya pasó' : undefined} onClick={() => save('scheduledAt', when)} className="shrink-0 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] text-glow transition-colors hover:bg-primary/20 disabled:opacity-50">{saving ? '…' : 'Programar'}</button>
          <button onClick={() => setEditing(null)} className="shrink-0 rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-sub transition-colors hover:text-white">Cancelar</button>
          {(err || enPasado(when)) && <span className="w-full font-mono text-[10px] text-error">{err || 'esa fecha ya pasó'}</span>}
        </div>
      )}

      {editing === 'date' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input type="datetime-local" value={pubDate} onChange={(e) => setPubDate(e.target.value)} autoFocus
            className="min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1 font-mono text-[11px] text-white focus:border-primary/50 focus:outline-none" />
          <button disabled={saving || !pubDate} onClick={() => save('date', pubDate)} className="shrink-0 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] text-glow transition-colors hover:bg-primary/20 disabled:opacity-50">{saving ? '…' : 'Guardar'}</button>
          <button onClick={() => setEditing(null)} className="shrink-0 rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-sub transition-colors hover:text-white">Cancelar</button>
          {err && <span className="w-full font-mono text-[10px] text-error">{err}</span>}
        </div>
      )}

      {editing === 'title' && (
        <div className="mt-3 flex items-center gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del video…" autoFocus maxLength={titleLimit}
            className="min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1 font-sans text-[13px] text-white placeholder:text-sub focus:border-primary/50 focus:outline-none" />
          <CharCount value={title} limit={titleLimit} />
          <button disabled={saving} onClick={() => save('title', title)} className="shrink-0 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] text-glow transition-colors hover:bg-primary/20 disabled:opacity-50">{saving ? '…' : 'Guardar'}</button>
          <button onClick={() => setEditing(null)} className="shrink-0 rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-sub transition-colors hover:text-white">Cancelar</button>
        </div>
      )}

      {editing === 'url' && (
        <div className="mt-3 flex items-center gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL publicada…" autoFocus
            className="min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1 font-mono text-[11px] text-white placeholder:text-sub focus:border-primary/50 focus:outline-none" />
          <button disabled={saving} onClick={() => save('url', url)} className="shrink-0 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] text-glow transition-colors hover:bg-primary/20 disabled:opacity-50">{saving ? '…' : 'Guardar'}</button>
          <button onClick={() => setEditing(null)} className="shrink-0 rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-sub transition-colors hover:text-white">Cancelar</button>
        </div>
      )}
      </div>
      )}
      </div>

      {coverOpen && typeof document !== 'undefined' && (
        <CoverPicker
          dist={dist}
          asset={asset}
          onClose={() => setCoverOpen(false)}
          onSave={async (cover) => { const ok = await save('cover', cover); setCoverOpen(false); return ok; }}
        />
      )}

      {editing === 'caption' && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-2xl rounded-md border border-line bg-panel p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="font-sans text-sm font-semibold text-white/90">{PLATFORMS[dist.platform]?.label} · Caption <span className="font-mono text-[11px] text-sub">({SURFACES[dist.surface]})</span></div>
              <CharCount value={caption} limit={limit} />
            </div>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={12} autoFocus
              placeholder={`Caption para ${PLATFORMS[dist.platform]?.label}…`}
              className="w-full resize-y rounded-md border border-line bg-panel2 px-3 py-2 font-sans text-[13px] leading-relaxed text-white placeholder:text-sub focus:border-primary/50 focus:outline-none" />
            <div className="mt-3 flex items-center gap-2">
              <button disabled={saving} onClick={() => save('caption', caption)} className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-[12px] text-glow transition-colors hover:bg-primary/20 disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar'}</button>
              <button onClick={() => setEditing(null)} className="rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-sub transition-colors hover:text-white">Cancelar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

const FILTERS = [{ k: 'all', label: 'Todas' }, { k: 'carousel', label: 'Carruseles' }, { k: 'post', label: 'Placas' }, { k: 'article', label: 'Artículos' }];
const LS_FILTROS = 'piezas:filtros';
// Selector de filtro de la barra.
const SELECT = 'rounded-md border border-line bg-panel px-2.5 py-1 font-mono text-[11px] text-sub hover:text-white focus:border-primary/50 focus:outline-none';

// Filtros por estado de publicación (se combinan con el de tipo). Cada test recibe las distribuciones
// a evaluar: todas las de la pieza, o solo las de la red elegida. 'Completa' usa el mismo criterio del
// contador n/n de la lista: salió o tiene fecha puesta.
const SALIO = ['published', 'scheduled'];
// Lo borrado no cuenta: ni como pendiente ni en el total n/n.
const vigentes = (ds) => ds.filter((d) => d.status !== 'deleted');
const ESTADOS = [
  { k: 'complete', label: 'Completas', title: 'Todas sus publicaciones están resueltas (n/n)', test: (p, ds) => vigentes(ds).length > 0 && vigentes(ds).every((d) => SALIO.includes(estadoDe(d))) },
  { k: 'scheduled', label: 'Programadas', title: 'Tienen alguna publicación programada', test: (p, ds) => ds.some((d) => estadoDe(d) === 'scheduled') },
  { k: 'pending', label: 'Pendientes', title: 'Todavía tienen publicaciones sin publicar ni programar', test: (p, ds) => vigentes(ds).some((d) => !SALIO.includes(estadoDe(d))) },
  { k: 'missing', label: 'Datos faltantes', title: 'Publicada sin URL, o pieza sin contenido base', test: (p, ds) => !p.base || ds.some((d) => estadoDe(d) === 'published' && !d.url) },
];

export default function PiezasBrowser({ pieces: initialPieces, generatedAt }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pParam = searchParams.get('p');

  const [pieces, setPieces] = useState(initialPieces);
  const [filter, setFilter] = useState('all');
  const [red, setRed] = useState('all'); // 'all' | clave de PLATFORMS
  const [estado, setEstado] = useState(null); // null | k de ESTADOS
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(pParam || initialPieces[0]?.id);
  const [listOpen, setListOpen] = useState(true); // la lista se puede colapsar para trabajar a todo el ancho
  const { confirm, dialog } = useConfirm();

  // Los filtros (tipo, estado, red) se recuerdan entre visitas. Se leen después del primer render
  // para no desalinear el HTML del servidor, y no se guardan hasta haberlos leído.
  const [filtrosListos, setFiltrosListos] = useState(false);
  useEffect(() => {
    try {
      const f = JSON.parse(localStorage.getItem(LS_FILTROS) || '{}');
      if (FILTERS.some((x) => x.k === f.filter)) setFilter(f.filter);
      if (ESTADOS.some((x) => x.k === f.estado)) setEstado(f.estado);
      if (f.red in PLATFORMS) setRed(f.red);
    } catch { /* sin storage o JSON roto */ }
    setFiltrosListos(true);
  }, []);
  useEffect(() => {
    if (!filtrosListos) return;
    try { localStorage.setItem(LS_FILTROS, JSON.stringify({ filter, estado, red })); } catch { /* sin storage */ }
  }, [filtrosListos, filter, estado, red]);

  useEffect(() => { if (pParam && pParam !== sel) setSel(pParam); }, [pParam]); // eslint-disable-line react-hooks/exhaustive-deps
  // Resincroniza si cambia el archivo de datos (fast-refresh / patch externo) — evita estado viejo.
  useEffect(() => { setPieces(initialPieces); }, [initialPieces]);
  function selectPiece(id) {
    setSel(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set('p', id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const estadoTest = ESTADOS.find((e) => e.k === estado)?.test;
  // Cada filtro por separado; los conteos de un selector respetan los otros dos
  // (así el número es lo que vas a ver al elegir esa opción).
  const okTipo = (p, k = filter) => k === 'all' || p.type === k;
  const okEstado = (p, test = estadoTest, k = red) => !test || test(p, k === 'all' ? p.distributions : p.distributions.filter((d) => d.platform === k));
  const okRed = (p, k = red) => k === 'all' || p.distributions.some((d) => d.platform === k);
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return pieces.filter((p) => okTipo(p) && okEstado(p) && okRed(p) && (!query || `${p.id} ${p.title}`.toLowerCase().includes(query)));
  }, [pieces, filter, estadoTest, red, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const cuentaTipo = (k) => pieces.filter((p) => okTipo(p, k) && okEstado(p) && okRed(p)).length;
  const cuentaEstado = (test) => pieces.filter((p) => okTipo(p) && okEstado(p, test) && okRed(p)).length;
  const cuentaRed = (k) => pieces.filter((p) => okTipo(p) && okEstado(p, estadoTest, k) && okRed(p, k)).length;
  const piece = pieces.find((p) => p.id === sel) || list[0];
  // Resuelto = ya salió (publicado) o tiene fecha puesta (programado). Lo borrado queda fuera.
  const live = (p) => p.distributions.filter((d) => ['published', 'scheduled'].includes(estadoDe(d))).length;
  // Punto de aviso: alguna publicada quedó sin permalink.
  const faltaUrl = (p) => p.distributions.some((d) => estadoDe(d) === 'published' && !d.url);

  async function saveDist(pieceId, platform, surface, patch) {
    try {
      const res = await fetch('/api/dist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pieceId, platform, surface, ...patch }) });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) return payload.error || 'no se pudo guardar';
      const { distribution } = payload;
      setPieces((prev) => prev.map((p) => (p.id !== pieceId ? p : { ...p, distributions: p.distributions.map((d) => (d.platform === platform && d.surface === surface ? distribution : d)) })));
      return true;
    } catch { return 'no pude conectar con el hub'; }
  }

  const hasPreview = piece && (piece.base?.slides || piece.assets.some((a) => a.files?.length || a.file));

  // Portadas de video: se generan solas desde la lámina de portada de cada pieza.
  // No hay nada que elegir — la idea es que al publicar ya esté todo hecho.
  const [covers, setCovers] = useState(null); // null | {done, total, msg}
  // Piezas a las que les falta portada (no distribuciones: la imagen es una por pieza).
  const coversPendientes = useMemo(() => pieces.filter((p) => (
    coverSlideOf(p) && p.distributions.some((d) => VIDEO_SURFACES.has(d.surface) && !d.cover)
  )).length, [pieces]);
  const coversTotal = useMemo(() => pieces.filter((p) => (
    coverSlideOf(p) && p.distributions.some((d) => VIDEO_SURFACES.has(d.surface))
  )).length, [pieces]);
  async function generateCovers(force = false) {
    const jobs = [];
    for (const p of pieces) {
      const slide = coverSlideOf(p);
      const dists = p.distributions.filter((d) => VIDEO_SURFACES.has(d.surface) && (force || !d.cover));
      if (dists.length && slide) jobs.push({ p, slide, texto: coverTextOf(p), dists });
    }
    // Una portada por pieza (TikTok y YouTube comparten imagen): el avance cuenta piezas,
    // no guardados, que es lo que se ve.
    const total = jobs.length;
    if (!total) return setCovers({ done: 0, total: 0, msg: 'ya están todas generadas' });

    let done = 0;
    let fail = 0;
    setCovers({ done, total, msg: '' });
    for (const { p, slide, texto, dists } of jobs) {
      let dataUrl;
      try {
        dataUrl = await buildVideoCover(slide, texto);
      } catch {
        fail += 1;
        done += 1;
        setCovers({ done, total, msg: '' });
        continue;
      }
      let alguno = false;
      for (const d of dists) {
        const ok = await saveDist(p.id, d.platform, d.surface, { cover: { dataUrl, t: 0 } });
        if (ok === true) alguno = true;
      }
      if (!alguno) fail += 1;
      done += 1;
      setCovers({ done, total, msg: '' });
    }
    setCovers({ done, total, msg: fail ? `${total - fail} de ${total} (${fail} fallaron)` : `${total} portadas listas` });
    setTimeout(() => setCovers(null), 4000);
  }

  // Historias de Instagram: las placas son 1080×1080 y la Historia es 9:16. Se dibuja sola
  // sobre el color de la propia placa y se guarda en Drive como historia.png.
  const [historias, setHistorias] = useState(null); // null | {done, total, msg}
  const conHistoria = (p) => placaImageOf(p) && storyAssetOf(p);
  const historiasPendientes = useMemo(() => pieces.filter((p) => conHistoria(p) && !storyAssetOf(p).files?.length).length, [pieces]);
  const historiasTotal = useMemo(() => pieces.filter(conHistoria).length, [pieces]);

  async function generateStories(force = false) {
    const jobs = pieces.filter((p) => conHistoria(p) && (force || !storyAssetOf(p).files?.length));
    const total = jobs.length;
    if (!total) return setHistorias({ done: 0, total: 0, msg: 'ya están todas generadas' });

    let done = 0;
    let fail = 0;
    setHistorias({ done, total, msg: '' });
    for (const p of jobs) {
      try {
        const dataUrl = await buildPlacaStory(placaImageOf(p));
        const res = await fetch('/api/story', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, dataUrl }) });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || 'no se pudo guardar');
        setPieces((prev) => prev.map((x) => (x.id !== p.id ? x : { ...x, assets: x.assets.map((a) => (a.id === payload.asset.id ? payload.asset : a)) })));
      } catch {
        fail += 1;
      }
      done += 1;
      setHistorias({ done, total, msg: '' });
    }
    setHistorias({ done, total, msg: fail ? `${total - fail} de ${total} (${fail} fallaron)` : `${total} historias listas` });
    setTimeout(() => setHistorias(null), 4000);
  }

  return (
    <>
      {dialog}
      <PageHeader
        title="Piezas"
        filters={
          <>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} title="Filtrar por tipo" className={SELECT}>
              {FILTERS.map((f) => <option key={f.k} value={f.k}>{f.k === 'all' ? 'Todos los tipos' : f.label} ({cuentaTipo(f.k)})</option>)}
            </select>
            <select value={estado || ''} onChange={(e) => setEstado(e.target.value || null)} title="Filtrar por estado" className={SELECT}>
              <option value="">Todos los estados ({cuentaEstado(null)})</option>
              {ESTADOS.map((e) => <option key={e.k} value={e.k} title={e.title}>{e.label} ({cuentaEstado(e.test)})</option>)}
            </select>
            <select value={red} onChange={(e) => setRed(e.target.value)} title="Filtrar por red social" className={SELECT}>
              <option value="all">Todas las redes ({cuentaRed('all')})</option>
              {Object.entries(PLATFORMS).map(([k, pl]) => <option key={k} value={k}>{pl.label} ({cuentaRed(k)})</option>)}
            </select>
          </>
        }
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pieza…"
          className="w-[300px] rounded-md border border-line bg-panel px-3 py-1 font-mono text-[12px] text-white placeholder:text-sub focus:border-primary/50 focus:outline-none" />
        <button
          onClick={async () => {
            if (coversPendientes > 0 || covers) return generateCovers(false);
            if (await confirm({ title: 'Regenerar portadas', message: `Rehace las ${coversTotal} portadas con el diseño actual, pisando las que ya están.`, confirmLabel: 'Regenerar', danger: true })) generateCovers(true);
          }}
          disabled={!!covers && !covers.msg}
          title={covers ? (covers.msg || `portadas ${covers.done}/${covers.total}…`) : coversPendientes > 0 ? `Generar portadas (${coversPendientes} pendientes): la portada 9:16 de cada video desde la lámina de portada de su pieza` : 'Regenerar portadas: vuelve a dibujarlas todas con el diseño actual'}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors disabled:opacity-60 ${coversPendientes > 0 || covers ? 'border-primary/40 bg-primary/10 text-glow hover:bg-primary/20' : 'border-line text-sub hover:text-white'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2" /><circle cx="12" cy="10" r="2.5" /><path d="m8 18 3-3 2 2 3-3" /></svg>
          {covers ? (covers.msg || `${covers.done}/${covers.total}`) : coversPendientes > 0 ? coversPendientes : null}
        </button>
        <button
          onClick={async () => {
            if (historiasPendientes > 0 || historias) return generateStories(false);
            if (await confirm({ title: 'Regenerar historias', message: `Rehace las ${historiasTotal} historias con el diseño actual, pisando las que ya están.`, confirmLabel: 'Regenerar', danger: true })) generateStories(true);
          }}
          disabled={!!historias && !historias.msg}
          title={historias ? (historias.msg || `historias ${historias.done}/${historias.total}…`) : historiasPendientes > 0 ? `Generar historias (${historiasPendientes} pendientes): la Historia 9:16 de cada placa sobre su propio color de fondo` : 'Regenerar historias: vuelve a dibujarlas todas con el diseño actual'}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors disabled:opacity-60 ${historiasPendientes > 0 || historias ? 'border-primary/40 bg-primary/10 text-glow hover:bg-primary/20' : 'border-line text-sub hover:text-white'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" strokeDasharray="3 2.5" /><circle cx="12" cy="12" r="5" /></svg>
          {historias ? (historias.msg || `${historias.done}/${historias.total}`) : historiasPendientes > 0 ? historiasPendientes : null}
        </button>
        <button
          onClick={() => setListOpen((v) => !v)}
          title={listOpen ? 'Ocultar la lista de piezas' : 'Mostrar la lista de piezas'}
          className={`rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${listOpen ? 'border-line text-sub hover:text-white' : 'border-primary/50 bg-primary/15 text-glow'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" /></svg>
        </button>
      </PageHeader>

      <div className={`grid grid-cols-1 md:grid-rows-[minmax(0,1fr)] md:!overflow-hidden ${listOpen ? 'md:grid-cols-[1fr_290px]' : 'md:grid-cols-1'}`}>
        {/* Lista — sticky y colapsable */}
        <ul className={`border-line md:order-2 md:min-h-0 md:overflow-y-auto md:border-l ${listOpen ? '' : 'hidden'}`}>
          {list.map((p) => (
            <li key={p.id}>
              <button onClick={() => selectPiece(p.id)}
                className={`flex w-full items-center gap-2 border-b border-white/[0.04] px-3 py-2 text-left last:border-0 ${piece?.id === p.id ? 'bg-primary/10' : 'hover:bg-white/[0.03]'}`}>
                <span className="font-mono text-[10px] text-sub">{p.id}</span>
                <span className="flex-1 truncate font-sans text-[13px] text-white/90">{p.title}</span>
                {faltaUrl(p) && <span title="Falta cargar alguna URL" className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />}
                <span className="font-mono text-[10px] text-sub">{live(p)}/{vigentes(p.distributions).length}</span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="px-3 py-4 font-mono text-[12px] text-sub">Sin resultados</li>}
        </ul>

        {/* Detalle */}
        {piece && (
          <section className="min-w-0 p-5 md:min-h-0 md:overflow-y-auto">
            <div className="-mx-5 mb-4 flex items-start justify-between gap-3 border-b border-line px-5 pb-4">
              <h2 className="font-sans text-xl font-normal tracking-tightish">{piece.title}</h2>
              <div className="shrink-0 pt-1.5 font-mono text-[11px] uppercase text-sub">{piece.id} · {piece.type}</div>
            </div>

            <div className="mb-6">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sub">Vista previa</div>
              {hasPreview ? (
                <PiecePreview piece={piece} dense={listOpen} />
              ) : piece.type === 'article' ? (
                <div className="rounded-lg border border-line bg-panel2 p-4">
                  <p className="font-sans text-[14px] leading-relaxed text-white/90">{piece.base?.excerpt}</p>
                  {piece.distributions.find((d) => d.platform === 'blog')?.url && (
                    <a href={piece.distributions.find((d) => d.platform === 'blog').url} target="_blank" rel="noreferrer" className="mt-3 inline-block font-mono text-[12px] text-glow hover:underline">ver en el blog ↗</a>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-line bg-panel2 p-4 text-[13px] text-white/90">
                  {piece.base?.stat && <span className="mr-2 font-sans text-2xl font-bold text-teal">{piece.base?.stat}</span>}
                  {stripTags(piece.base?.headline)}
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sub">Distribuciones</div>
              <div className="flex flex-col gap-2">
                {piece.distributions.map((dd) => (
                  <DistCard key={`${piece.id}-${dd.platform}-${dd.surface}`} dist={dd} asset={piece.assets.find((a) => a.id === dd.assetId)} pieceId={piece.id} onSave={saveDist} />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sub">Assets</div>
              <div className="flex flex-wrap gap-2">
                {piece.assets.map((a) => (
                  <span key={a.id} className={`rounded-md border px-2 py-1 font-mono text-[10px] ${a.status === 'rendered' ? 'border-primary/30 text-white/80' : 'border-line text-sub'}`}>
                    {a.format} · {a.spec} · <span className={a.status === 'rendered' ? 'text-glow' : 'text-sub'}>{a.status}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
