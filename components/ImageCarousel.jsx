'use client';
import { useState } from 'react';

const NAV = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line font-mono text-lg text-sub transition-colors hover:border-primary/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:border-line disabled:hover:text-sub';

// Visor de imágenes reales (de Drive): una a la vez.
// alts: texto alternativo por imagen (mismo orden) → atributo alt + línea visible bajo la lámina.
// Puede usarse controlado (index + onIndex) para que la navegación viva fuera, y con nav/alt
// apagados cuando esos elementos se muestran en otro lado.
export default function ImageCarousel({ images, alts, height = 540, index, onIndex, showNav = true, showAlt = true }) {
  const [own, setOwn] = useState(0);
  const controlled = index != null;
  const n = images?.length || 0;
  if (!n) return null;
  const cur = Math.min(controlled ? index : own, n - 1);
  const go = (k) => (controlled ? onIndex?.(k) : setOwn(k));
  const single = n === 1;
  const alt = alts?.[cur];
  return (
    <div className="flex items-center gap-3">
      {!single && showNav && <button onClick={() => go(Math.max(0, cur - 1))} disabled={cur === 0} aria-label="Anterior" className={NAV}>‹</button>}
      <div className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[cur]} alt={alt || ''} style={{ height, width: 'auto', maxWidth: '100%' }} className="rounded-lg border border-line" />
        {!single && (
          <div className="flex gap-1.5">
            {images.map((_, k) => (
              <button key={k} onClick={() => go(k)} aria-label={`Lámina ${k + 1}`}
                className={`h-1.5 rounded-full transition-all ${k === cur ? 'w-5 bg-glow' : 'w-1.5 bg-white/20 hover:bg-white/40'}`} />
            ))}
          </div>
        )}
        {alt && showAlt && (
          <p style={{ maxWidth: 320 }} className="text-center font-mono text-[10px] leading-snug text-sub/70">
            <span className="text-glow/60">alt · </span>{alt}
          </p>
        )}
      </div>
      {!single && showNav && <button onClick={() => go(Math.min(n - 1, cur + 1))} disabled={cur === n - 1} aria-label="Siguiente" className={NAV}>›</button>}
    </div>
  );
}
