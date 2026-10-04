'use client';
import { useEffect, useState } from 'react';
import { PLATFORMS } from '@/lib/schema';
import SlideCarousel from '@/components/SlideCarousel';
import ImageCarousel from '@/components/ImageCarousel';

const NAV = 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-sub transition-colors hover:border-primary/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:border-line disabled:hover:text-sub';

// Glifos como ‹ › no quedan ópticamente centrados en su caja: van en SVG.
function Chevron({ dir = 'right' }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );
}

function Chip({ active, onClick, title, children }) {
  return (
    <button onClick={onClick} title={title}
      className={`rounded-full border px-3 py-1 font-mono text-[10px] transition-colors ${active ? 'border-primary/50 bg-primary/15 text-glow' : 'border-line text-sub hover:text-white'}`}>
      {children}
    </button>
  );
}

// "X y Bluesky" / "Instagram, LinkedIn y Threads" — enumeración natural en es.
const enumerar = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);

// Vista previa: imagen real de Drive (por defecto, ya que la pieza está sincronizada);
// render por código sólo como fallback si aún no hay imagen en Drive.
export default function PiecePreview({ piece, dense = false }) {
  // Con la lista de piezas abierta sobra menos ancho: achicamos para que las tres columnas
  // entren en la misma fila en vez de que la de láminas caiga abajo.
  const mediaH = 500; // misma altura para imagen, Short e Historia, así quedan alineados
  const thumbW = dense ? 36 : 44;

  const slides = piece.base?.slides;
  const carouselAsset = piece.assets.find((a) => a.format === 'carousel' && !a.id.endsWith('-bluesky'));
  const bsky = piece.assets.find((a) => a.id.endsWith('-bluesky') && Array.isArray(a.slides));
  const bskySlides = bsky && slides ? bsky.slides.map((i) => slides[i - 1]).filter(Boolean) : null;
  const imageAsset = piece.assets.find((a) => a.format === 'image'); // placas
  const short = piece.assets.find((a) => a.format === 'short' && a.file);
  const story = piece.assets.find((a) => a.format === 'story' && a.files?.length); // Historia IG (artículos)
  const isArticle = piece.type === 'article';
  const blogUrl = piece.distributions.find((d) => d.platform === 'blog')?.url;

  // Las etiquetas de las variantes salen de las distribuciones reales: si mañana otra red
  // pasa a usar el recorte, el chip lo dice solo.
  const netsOf = (assetId) => enumerar(piece.distributions.filter((d) => d.assetId === assetId).map((d) => PLATFORMS[d.platform]?.label || d.platform));
  const fullNets = carouselAsset ? netsOf(carouselAsset.id) : '';
  const cutNets = bsky ? netsOf(bsky.id) : '';

  const [variant, setVariant] = useState('full');
  const activeSlides = variant === 'bluesky' && bskySlides ? bskySlides : slides;
  const activeFiles = variant === 'bluesky' && bsky?.files ? bsky.files : (carouselAsset?.files || imageAsset?.files);
  const activeAlts = variant === 'bluesky' && bsky?.alts ? bsky.alts
    : (carouselAsset?.alts || (imageAsset?.alt ? [imageAsset.alt] : undefined));

  // Índice del carrusel acá arriba: lo comparten la navegación (en la fila de variantes)
  // y la columna de láminas, que hace de índice clickeable.
  const [i, setI] = useState(0);
  useEffect(() => { setI(0); }, [variant, piece.id]);
  const nFiles = activeFiles?.length || 0;
  const cur = Math.min(i, Math.max(0, nFiles - 1));
  const hasList = nFiles > 1;
  const hasPanel = nFiles > 0; // el panel de alt también sirve a una lámina sola (placas)

  const [copiedAlt, setCopiedAlt] = useState(null);
  async function copyAlt(k) {
    const txt = activeAlts?.[k];
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      setCopiedAlt(k);
      setTimeout(() => setCopiedAlt((c) => (c === k ? null : c)), 1200);
    } catch { /* el navegador bloqueó el portapapeles */ }
  }

  return (
    <div className={`flex flex-wrap items-start ${dense ? 'gap-5' : 'gap-8'}`}>
      {(slides || imageAsset) && (
        <div className="flex flex-col gap-3">
          <div className="flex min-h-7 flex-wrap items-center gap-2">
            {bskySlides ? (
              <>
                <Chip active={variant === 'full'} onClick={() => setVariant('full')} title={`Completo — ${fullNets || 'sin distribuir'}`}>
                  Completo · {slides.length}
                </Chip>
                <Chip active={variant === 'bluesky'} onClick={() => setVariant('bluesky')} title={`Parcial — ${cutNets || 'sin distribuir'}`}>
                  Parcial · {bskySlides.length}
                </Chip>
              </>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-wider text-sub">{imageAsset ? 'Imagen' : 'Carrusel'}</span>
            )}
            {hasList && (
              <div className="ml-auto flex items-center gap-1.5">
                <button onClick={() => setI(Math.max(0, cur - 1))} disabled={cur === 0} aria-label="Anterior" className={NAV}><Chevron dir="left" /></button>
                <span className="w-10 text-center font-mono text-[10px] text-sub">{cur + 1}/{nFiles}</span>
                <button onClick={() => setI(Math.min(nFiles - 1, cur + 1))} disabled={cur === nFiles - 1} aria-label="Siguiente" className={NAV}><Chevron dir="right" /></button>
              </div>
            )}
          </div>
          {activeFiles?.length
            ? <ImageCarousel key={`i-${variant}`} images={activeFiles} alts={activeAlts} index={cur} onIndex={setI} showNav={false} showAlt={!hasPanel} height={mediaH} />
            : slides
              ? <SlideCarousel key={`s-${variant}`} slides={activeSlides} scale={0.8} />
              : null}
        </div>
      )}

      {short && (
        <div className="flex flex-col gap-3">
          <div className="flex min-h-7 items-center">
            <span className="font-mono text-[10px] uppercase tracking-wider text-sub">Short / Reel</span>
          </div>
          <video src={`${short.file}#t=0.5`} controls preload="metadata" playsInline
            poster={short.cover || undefined}
            className="cursor-pointer rounded-xl border border-line" style={{ height: mediaH, aspectRatio: '9 / 16', background: '#000' }} />
        </div>
      )}

      {isArticle && piece.base?.image?.src && (
        <div className="flex flex-col gap-3">
          <div className="flex min-h-7 items-center"><span className="font-mono text-[10px] uppercase tracking-wider text-sub">Imagen del artículo</span></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={piece.base.image.src} alt={piece.base.image.alt || ''} className="rounded-xl border border-line" style={{ maxHeight: 320, width: 'auto', maxWidth: '100%' }} />
        </div>
      )}

      {story && (
        <div className="flex flex-col gap-3">
          <div className="flex min-h-7 items-center"><span className="font-mono text-[10px] uppercase tracking-wider text-sub">Historia · IG</span></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.files[0]} alt="" className="rounded-xl border border-line" style={{ height: mediaH, aspectRatio: '9 / 16', objectFit: 'cover' }} />
        </div>
      )}

      {/* Índice de láminas: miniatura + alt de cada una. Clic salta a esa lámina. */}
      {hasPanel && (
        <div className={`flex flex-1 flex-col gap-3 ${dense ? 'basis-full' : 'w-[300px] min-w-[240px]'}`}>
          <div className="flex min-h-7 items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-sub">Láminas y alt</span>
            {activeAlts?.filter(Boolean).length !== nFiles && (
              <span className="font-mono text-[10px] text-warning">{nFiles - (activeAlts?.filter(Boolean).length || 0)} sin alt</span>
            )}
          </div>
          <ol className="flex flex-col gap-1.5">
            {activeFiles.map((src, k) => (
              <li
                key={`${src}-${k}`}
                className={`group flex items-center gap-1.5 rounded-lg border p-1.5 transition-colors ${k === cur ? 'border-primary/50 bg-primary/10' : 'border-line hover:border-primary/30 hover:bg-white/[0.03]'}`}
              >
                <button onClick={() => setI(k)} title="Ver esta lámina" className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="shrink-0 rounded border border-line" style={{ width: thumbW, aspectRatio: '4 / 5', objectFit: 'cover' }} />
                  <span className="min-w-0 flex-1">
                    {activeAlts?.[k]
                      ? <span className="block font-mono text-[10px] leading-snug text-sub/80">{activeAlts[k]}</span>
                      : <span className="block font-mono text-[10px] italic leading-snug text-warning/70">sin alt</span>}
                  </span>
                </button>
                <button
                  onClick={() => copyAlt(k)}
                  disabled={!activeAlts?.[k]}
                  title={activeAlts?.[k] ? 'Copiar este alt' : 'Esta lámina no tiene alt'}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-all focus-visible:opacity-100 group-hover:opacity-100 ${copiedAlt === k ? 'border-primary/50 text-glow opacity-100' : 'border-line text-sub opacity-0 hover:border-primary/40 hover:text-white'} disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-line disabled:hover:text-sub`}
                >
                  {/* SVG en vez de glifo: el ⧉ no queda ópticamente centrado en la caja */}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {copiedAlt === k
                      ? <polyline points="20 6 9 17 4 12" />
                      : <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>}
                  </svg>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {isArticle && (
        <div className="flex max-w-sm flex-col gap-3">
          <div className="flex min-h-7 items-center"><span className="font-mono text-[10px] uppercase tracking-wider text-sub">Artículo</span></div>
          <p className="font-sans text-[14px] leading-relaxed text-white/90">{piece.base?.excerpt}</p>
          {blogUrl && <a href={blogUrl} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-glow hover:underline">ver en el blog ↗</a>}
        </div>
      )}
    </div>
  );
}
