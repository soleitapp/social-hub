/* Portada 9:16 para TikTok / YouTube, dibujada de cero en el navegador (canvas).
   No es la lámina del carrusel recortada: se compone con el mismo lenguaje visual
   (eyebrow arriba, titular grande, firma abajo) sobre el color de fondo de la lámina
   de portada, que se muestrea del PNG real para no depender de tablas de color. */

import { BRAND_PRIMARY, BRAND_SECONDARY } from './brand';

const W = 1080;
const H = 1920;
const PAD = 96;
const TEAL = '#009f8b';
const INK = '#0a0b0d';
const PAPER = '#f5f5f3';

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`no pude cargar ${src}`));
    img.src = src;
  });
}

// Color de fondo de la lámina: la esquina que más se repite (evita texto o logo).
export function sampleBackground(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const m = Math.max(4, Math.round(c.width * 0.01));
  const pts = [[m, m], [c.width - m, m], [m, c.height - m], [c.width - m, c.height - m]];
  const counts = new Map();
  for (const [x, y] of pts) {
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const k = `${r},${g},${b}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const [r, g, b] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
  return { css: `rgb(${r},${g},${b})`, r, g, b };
}

export const luminancia = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
export const esTeal = ({ r, g, b }) => Math.abs(r - 0) < 60 && Math.abs(g - 159) < 60 && Math.abs(b - 139) < 60;

// "Nadie te <span class='accent'>avisó</span>." → [{t:'Nadie te ',a:false},{t:'avisó',a:true},…]
function segmentar(linea) {
  const out = [];
  const re = /<span[^>]*class=['"]accent['"][^>]*>(.*?)<\/span>/gi;
  let i = 0;
  let m;
  while ((m = re.exec(linea))) {
    if (m.index > i) out.push({ t: linea.slice(i, m.index), a: false });
    out.push({ t: m[1], a: true });
    i = m.index + m[0].length;
  }
  if (i < linea.length) out.push({ t: linea.slice(i), a: false });
  return out.map((s) => ({ ...s, t: s.t.replace(/<[^>]+>/g, '') })).filter((s) => s.t !== '');
}

function anchoLinea(ctx, segs) {
  return segs.reduce((w, s) => w + ctx.measureText(s.t).width, 0);
}

/** Portada 1080×1920 en dataURL JPEG. `slide` = { eyebrow, headline } de la lámina de portada. */
export async function buildVideoCover(slideUrl, slide = {}) {
  const img = await loadImage(slideUrl);
  const bg = sampleBackground(img);
  if (document.fonts?.ready) await document.fonts.ready; // sin esto el canvas dibuja con la fuente de fallback

  const sans = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  const mono = "'Google Sans Code', ui-monospace, SFMono-Regular, Consolas, monospace";
  const claro = luminancia(bg) > 0.55;
  const tinta = claro ? INK : PAPER;
  const acento = esTeal(bg) ? '#ffffff' : TEAL; // sobre teal, el acento se destaca en blanco

  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg.css;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  // Eyebrow arriba
  if (slide.eyebrow) {
    ctx.font = `600 30px ${mono}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.18em';
    ctx.fillStyle = esTeal(bg) ? 'rgba(255,255,255,0.85)' : TEAL;
    ctx.fillText(String(slide.eyebrow).toUpperCase(), PAD, PAD + 30);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  // Titular: respeta los saltos de línea de la lámina y baja el cuerpo hasta que entre.
  const lineas = String(slide.headline || '').split('\n').map(segmentar).filter((l) => l.length);
  if (lineas.length) {
    const max = W - PAD * 2;
    let size = 104;
    const setFont = (s) => {
      ctx.font = `400 ${s}px ${sans}`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '-0.025em';
    };
    setFont(size);
    while (size > 44 && lineas.some((l) => anchoLinea(ctx, l) > max)) {
      size -= 2;
      setFont(size);
    }
    const lh = size * 1.08;
    const alto = lh * lineas.length;
    let y = (H - alto) / 2 + size * 0.82; // bloque centrado en vertical
    for (const segs of lineas) {
      let x = PAD;
      for (const s of segs) {
        ctx.fillStyle = s.a ? acento : tinta;
        ctx.fillText(s.t, x, y);
        x += ctx.measureText(s.t).width;
      }
      y += lh;
    }
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  // Firma abajo a la izquierda
  ctx.font = `700 38px ${sans}`;
  ctx.fillStyle = esTeal(bg) ? '#ffffff' : TEAL;
  ctx.fillText(BRAND_PRIMARY, PAD, H - PAD);
  const wPrimary = ctx.measureText(`${BRAND_PRIMARY} `).width;
  ctx.font = `400 30px ${sans}`;
  ctx.fillStyle = claro ? 'rgba(10,11,13,0.55)' : 'rgba(245,245,243,0.55)';
  ctx.fillText(BRAND_SECONDARY, PAD + wPrimary, H - PAD);

  return c.toDataURL('image/jpeg', 0.92);
}

// Lámina de portada de una pieza: la primera del carrusel completo (o del asset que tenga).
export function coverSlideOf(piece) {
  const full = piece.assets.find((a) => a.format === 'carousel' && !a.id.endsWith('-bluesky'));
  return full?.files?.[0] || piece.assets.find((a) => a.files?.length)?.files?.[0] || null;
}

// Datos de texto de esa misma lámina (eyebrow + titular con sus acentos).
export function coverTextOf(piece) {
  const s = piece.base?.slides?.[0] || {};
  return { eyebrow: s.eyebrow, headline: s.headline };
}
