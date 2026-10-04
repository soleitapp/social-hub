/* Deriva los beats del short desde las láminas del carrusel (social-hub/data/pieces.json).
   Mapea kind → tipo de beat + variante (colores reales del carrusel, vía ALT_BG).
   Salida: video/data/beats.json  { c02: [beats], ... }
   Uso: node derive-beats.mjs [desde] [hasta]   (default 2 18) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const HUB = path.resolve(DIR, '..'); // video/ vive dentro de social-hub
const pieces = JSON.parse(fs.readFileSync(path.join(HUB, 'data', 'pieces.json'), 'utf8')).pieces;

const from = parseInt(process.argv[2] || '2', 10);
const to = parseInt(process.argv[3] || '18', 10);

// kind → tono (espejo de ALT_BG en design-source) → variante del short
const TONE = {
  'cover-dark': 'dark', 'cover-light': 'light', 'cover-tint': 'tint', 'cover-teal': 'teal',
  'stat-dark': 'dark', 'stat-light': 'light', 'stat-tint': 'tint',
  'split': 'light', 'list': 'light', 'cta-dark': 'dark', 'cta-teal': 'teal',
};
const VAR = { dark: 'ink', light: 'paper', tint: 'mint', teal: 'teal' };
const variantOf = (kind) => VAR[TONE[kind] || (/dark/.test(kind) ? 'dark' : /teal/.test(kind) ? 'teal' : /tint/.test(kind) ? 'tint' : 'light')];

const accentOf = (html) => (String(html).match(/<span class=['"]accent['"]>([^<]+)<\/span>/) || [])[1] || undefined;
const clean = (html) => String(html || '').replace(/<[^>]+>/g, '').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
const cleanSource = (s) => String(s || '').replace(/^FUENTE\s*·\s*/i, '').trim();
const isSourceReal = (s) => s && !/DESLIZA|TU-DOMINIO\.COM|→/i.test(s);

function beatFor(slide) {
  const kind = slide.kind || '';
  const variant = variantOf(kind);
  const accent = accentOf(slide.headline);
  if (kind.startsWith('cover')) {
    return { type: 'hook', variant, eyebrow: 'Tips', headline: clean(slide.headline), ...(accent ? { accent } : {}) };
  }
  if (kind.startsWith('stat')) {
    return {
      type: 'stat', variant, label: clean(slide.eyebrow), value: (slide.stat || '').trim(),
      text: clean(slide.headline), ...(isSourceReal(cleanSource(slide.source)) ? { source: cleanSource(slide.source) } : {}),
    };
  }
  if (kind.startsWith('cta')) {
    return { type: 'outro', variant, punch: clean(slide.headline), follow: 'Síguenos' };
  }
  // list / split / otros → beat de texto (reframe)
  return { type: 'reframe', variant, label: clean(slide.eyebrow), text: clean(slide.headline), ...(accent ? { accent } : {}) };
}

const out = {};
for (let n = from; n <= to; n++) {
  const id = 'c' + String(n).padStart(2, '0');
  const c = pieces.find((p) => p.id === id);
  if (!c?.base?.slides) { console.log('  ! sin slides', id); continue; }
  out[id] = c.base.slides.map(beatFor);
}

fs.mkdirSync(path.join(DIR, 'data'), { recursive: true });
fs.writeFileSync(path.join(DIR, 'data', 'beats.json'), JSON.stringify(out, null, 2));
console.log(`beats.json → ${Object.keys(out).length} dispatches (c${String(from).padStart(2, '0')}–c${String(to).padStart(2, '0')})`);
console.log('--- c02 (muestra) ---');
console.log(JSON.stringify(out.c02, null, 1));
