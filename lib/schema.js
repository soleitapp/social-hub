/* Modelo de contenido del hub (fuente única, es-only por ahora).
   3 capas:  Pieza (base)  →  Assets (formatos)  →  Distribuciones (canal + caption + estado)
   - La BASE es agnóstica de red (el contenido canónico).
   - Un ASSET es un formato renderizado desde la base (carrusel, imagen, short…),
     reutilizable en varios canales.
   - Una DISTRIBUCIÓN publica un asset en un canal, con su CAPTION adaptado y su estado.
     → El caption vive en la distribución (no en el asset): mismo carrusel, caption distinto por red. */

/** @typedef {'carousel'|'image'|'story'|'short'|'text'|'article'} Format */
/** @typedef {'instagram'|'linkedin'|'x'|'tiktok'|'youtube'|'blog'} Platform */
/** @typedef {'post'|'story'|'reel'|'video'|'short'|'article'} Surface */
/** @typedef {'draft'|'ready'|'scheduled'|'published'|'deleted'} DistStatus */
/** @typedef {'pending'|'rendered'} AssetStatus */

/** @typedef {Object} Asset
 *  @property {string} id              // `${pieceId}-${format}`
 *  @property {Format} format
 *  @property {string} spec            // ej. "1080×1350 ×5"
 *  @property {string} source          // 'design' | 'remotion' | 'code'
 *  @property {AssetStatus} status
 *  @property {number[]} [slides]      // láminas incluidas (índices 1-based) si es un subset curado
 *  @property {string} [file]          // ruta pública del asset renderizado (video/imagen) */

/** @typedef {Object} Distribution
 *  @property {Platform} platform      // red (Instagram, LinkedIn…)
 *  @property {Surface} surface        // superficie dentro de la red (post, historia, reel…)
 *  @property {string} assetId         // referencia a un Asset de la misma pieza
 *  @property {string} [caption]       // adaptado a la superficie
 *  @property {string} [title]         // título propio de la red (YouTube); ver TITLE_LIMIT
 *  @property {DistStatus} status
 *  @property {string} [url]           // permalink cuando está publicado
 *  @property {string} [scheduledAt]   // 'YYYY-MM-DDTHH:mm' — fecha/hora programada (status 'scheduled')
 *  @property {string} [date] */

/** @typedef {Object} Piece
 *  @property {string} id
 *  @property {'carousel'|'post'} type   // formato, agnóstico de red
 *  @property {number} n
 *  @property {string} title
 *  @property {string} [subtitle]
 *  @property {Object} base            // slides / campos, es-only
 *  @property {Asset[]} assets
 *  @property {Distribution[]} distributions */

export const FORMATS = ['carousel', 'image', 'story', 'short', 'text', 'article'];

// Redes y sus superficies válidas (una pieza se distribuye en plataforma+superficie).
export const PLATFORMS = {
  instagram: { label: 'Instagram', surfaces: ['post', 'story', 'reel'] },
  facebook: { label: 'Facebook', surfaces: ['post', 'story', 'reel'] },
  linkedin: { label: 'LinkedIn', surfaces: ['post'] },
  x: { label: 'X', surfaces: ['post'] },
  tiktok: { label: 'TikTok', surfaces: ['video'] },
  youtube: { label: 'YouTube', surfaces: ['short'] },
  blog: { label: 'Blog', surfaces: ['article'] },
};
export const SURFACES = { post: 'Post', story: 'Historia', reel: 'Reel', video: 'Video', short: 'Short', article: 'Artículo' };

// Redes que además del caption llevan un título propio, con su límite.
export const TITLE_LIMIT = { youtube: 100 };

// Límite de caracteres del caption por plataforma (null = sin límite fijo).
export const CAPTION_LIMIT = { x: 280, instagram: 2200, facebook: 63206, linkedin: 3000, tiktok: 2200, youtube: null, blog: null };

// Estados de una distribución, con tono para la UI (mapea a los colores del Manual).
export const DIST_STATUS = {
  published: { label: 'Publicado', tone: 'ok' },
  scheduled: { label: 'Programado', tone: 'warn' },
  ready: { label: 'Listo', tone: 'info' },
  draft: { label: 'Borrador', tone: 'idle' },
  deleted: { label: 'Borrado', tone: 'off' },
};

// Valida una pieza contra el modelo. Devuelve array de errores (vacío = ok).
export function validatePiece(p) {
  const errs = [];
  if (!p.id) errs.push('sin id');
  if (!p.base) errs.push(`${p.id}: sin base`);
  const assetIds = new Set((p.assets || []).map((a) => a.id));
  for (const a of p.assets || []) {
    if (!FORMATS.includes(a.format)) errs.push(`${p.id}: formato inválido "${a.format}"`);
  }
  for (const d of p.distributions || []) {
    const at = `${p.id}/${d.platform}:${d.surface}`;
    if (!PLATFORMS[d.platform]) errs.push(`${at}: plataforma inválida "${d.platform}"`);
    else if (!PLATFORMS[d.platform].surfaces.includes(d.surface)) errs.push(`${at}: superficie "${d.surface}" no aplica a ${d.platform}`);
    if (!DIST_STATUS[d.status]) errs.push(`${at}: estado inválido "${d.status}"`);
    if (d.assetId && !assetIds.has(d.assetId)) errs.push(`${at}: assetId "${d.assetId}" no existe`);
  }
  return errs;
}
