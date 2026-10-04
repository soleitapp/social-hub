'use client';
import { useState } from 'react';
import { SlidePreview } from '@/components/SlideCanvas';

const NAV = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line font-mono text-lg text-sub transition-colors hover:border-primary/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:border-line disabled:hover:text-sub';

// Visor de carrusel: una lámina a la vez, botones redondos bloqueados en los extremos.
export default function SlideCarousel({ slides, scale = 0.64 }) {
  const [i, setI] = useState(0);
  const n = slides?.length || 0;
  if (!n) return null;
  const cur = Math.min(i, n - 1);
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => setI(Math.max(0, cur - 1))} disabled={cur === 0} aria-label="Anterior" className={NAV}>‹</button>
      <div className="flex flex-col items-center gap-2">
        <SlidePreview slide={slides[cur]} scale={scale} />
        <div className="flex gap-1.5">
          {slides.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Lámina ${k + 1}`}
              className={`h-1.5 rounded-full transition-all ${k === cur ? 'w-5 bg-glow' : 'w-1.5 bg-white/20 hover:bg-white/40'}`} />
          ))}
        </div>
      </div>
      <button onClick={() => setI(Math.min(n - 1, cur + 1))} disabled={cur === n - 1} aria-label="Siguiente" className={NAV}>›</button>
    </div>
  );
}
