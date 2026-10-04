// Definición de canales del board: orden, etiqueta y texto de ayuda. Edita esta lista para agregar o quitar redes
// (las plataformas válidas y sus superficies están en lib/schema.js → PLATFORMS).
export const CHANNELS = [
  { id: 'instagram', label: 'Instagram', hint: 'Carruseles' },
  { id: 'threads', label: 'Threads', hint: 'Crosspost de Instagram' },
  { id: 'linkedin', label: 'LinkedIn', hint: 'Imágenes y texto' },
  { id: 'blog', label: 'Blog', hint: 'Artículos en tu sitio' },
  { id: 'x', label: 'X', hint: 'Artículos e imágenes' },
  { id: 'bluesky', label: 'Bluesky', hint: 'Tips y artículos' },
];

// Estados posibles de un ítem en un canal.
export const STATUS = {
  published: { label: 'Publicado', tone: 'ok' },
  scheduled: { label: 'Programado', tone: 'warn' },
  pending: { label: 'Pendiente', tone: 'idle' },
};
