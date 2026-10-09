'use client';
// Render fiel de las láminas IG, portado del proyecto de Claude Design (es-only).
// La lámina mide 540×675 (exporta 1080×1350); SlidePreview la escala para la UI.

import { BRAND_PRIMARY, BRAND_SECONDARY } from '@/lib/brand';

const T = (v) => (v && typeof v === 'object' ? v.es || v.en || '' : v || '');

function Logo({ inverted, size = 18 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, fontSize: size, letterSpacing: '-0.01em', lineHeight: 1, fontFamily: 'var(--font-sans)', textTransform: 'none' }}>
      <span style={{ fontWeight: 700, color: inverted ? '#fff' : 'var(--accent)' }}>{BRAND_PRIMARY}</span>
      <span style={{ fontWeight: 400, fontSize: size * 0.55, color: inverted ? 'rgba(255,255,255,.85)' : 'currentColor' }}>{BRAND_SECONDARY}</span>
    </span>
  );
}

function Radar({ size = 340, x = -120, y = -120, opacity = 1, stroke = '#0057FF', dot = '#0057FF' }) {
  const rings = [40, 70, 100, 130, 160];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="-200 -200 400 400">${rings.map((r) => `<circle cx="0" cy="0" r="${r}" fill="none" stroke="${stroke}" stroke-width="1"/>`).join('')}<circle cx="0" cy="0" r="6" fill="${dot}"/></svg>`;
  const uri = `data:image/svg+xml;base64,${btoa(svg)}`;
  return <img src={uri} width={size} height={size} alt="" style={{ position: 'absolute', pointerEvents: 'none', left: x, top: y, opacity }} />;
}

function IGSlide({ slide }) {
  const { kind } = slide;
  const html = (key) => ({ __html: T(slide[key]) });

  if (kind?.startsWith('cover-')) {
    const variant = kind.replace('cover-', '');
    const op = variant === 'light' ? 0.3 : variant === 'tint' ? 0.5 : variant === 'teal' ? 0.35 : 0.45;
    return (
      <div className={`ig-slide ${variant}`}>
        <div className="ig-pad">
          <div className="ig-eyebrow">{T(slide.eyebrow)}</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <h1 className="ig-headline" style={{ fontSize: 58 }} dangerouslySetInnerHTML={html('headline')} />
          </div>
          <div className="ig-source"><Logo inverted={variant === 'teal'} /><span>{T(slide.source)}</span></div>
        </div>
        <Radar size={420} x={280} y={280} opacity={op} stroke={variant === 'teal' ? '#fff' : undefined} dot={variant === 'teal' ? '#fff' : undefined} />
      </div>
    );
  }
  if (kind?.startsWith('stat-')) {
    const op = kind === 'stat-light' ? 0.3 : kind === 'stat-tint' ? 0.55 : 0.45;
    const cls = kind === 'stat-light' ? 'light' : kind === 'stat-tint' ? 'tint' : 'dark';
    const long = String(slide.stat || '').length > 5 && !/\s/.test(slide.stat || '');
    return (
      <div className={`ig-slide ${cls}`}>
        <div className="ig-pad">
          <div className="ig-eyebrow">{T(slide.eyebrow)}</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
            <div className="ig-stat" data-len={long ? 'long' : undefined}>{slide.stat}</div>
            <h2 className="ig-headline" style={{ fontSize: 31, maxWidth: 470 }} dangerouslySetInnerHTML={html('headline')} />
          </div>
          <div className="ig-source"><Logo /><span>{T(slide.source)}</span></div>
        </div>
        <Radar size={300} x={-110} y={300} opacity={op} />
      </div>
    );
  }
  if (kind === 'split') {
    return (
      <div className="ig-slide light">
        <div className="ig-pad">
          <div className="ig-eyebrow">{T(slide.eyebrow)}</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <h2 className="ig-headline" style={{ fontSize: 40 }} dangerouslySetInnerHTML={html('headline')} />
          </div>
          <div className="ig-source"><Logo /><span>{T(slide.source)}</span></div>
        </div>
      </div>
    );
  }
  if (kind === 'list') {
    return (
      <div className="ig-slide light">
        <div className="ig-pad">
          <div className="ig-eyebrow">{T(slide.eyebrow)}</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
            <h2 className="ig-headline" style={{ fontSize: 40, color: 'var(--accent)' }} dangerouslySetInnerHTML={html('headline')} />
            <p style={{ fontSize: 19, lineHeight: 1.5, color: 'var(--ink-2)', margin: 0, maxWidth: 470 }} dangerouslySetInnerHTML={html('body')} />
          </div>
          <div className="ig-source"><Logo /><span>{T(slide.source)}</span></div>
        </div>
      </div>
    );
  }
  if (kind?.startsWith('cta-')) {
    const isDark = kind === 'cta-dark';
    return (
      <div className={isDark ? 'ig-slide dark' : 'ig-slide teal'}>
        <div className="ig-pad">
          <div className="ig-eyebrow">{T(slide.eyebrow)}</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <h2 className="ig-headline" style={{ fontSize: 58, color: '#fff' }} dangerouslySetInnerHTML={html('headline')} />
          </div>
          <div className="ig-source"><Logo inverted /><span>{T(slide.source)}</span></div>
        </div>
        <Radar size={500} x={300} y={-220} opacity={0.4} stroke="#ffffff" dot="#ffffff" />
      </div>
    );
  }
  return <div className="ig-slide light"><div className="ig-pad">{kind}</div></div>;
}

export function SlidePreview({ slide, scale = 0.42 }) {
  return (
    <div className="ig-canvas shrink-0 overflow-hidden rounded-lg border border-line" style={{ width: 540 * scale, height: 675 * scale }}>
      <div style={{ width: 540, height: 675, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <IGSlide slide={slide} />
      </div>
    </div>
  );
}
