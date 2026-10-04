/* Historia 9:16 de una placa, dibujada en el navegador (canvas).
   La placa es 1080×1080 con fondo plano: se dibuja a ancho completo sobre ese mismo color
   muestreado del PNG, así el cuadrado no se ve pegado — su padding interno (80px) queda
   como margen de la historia y el resto del alto es la misma superficie. Abajo, la firma
   del sitio, que es lo único que la placa no trae y la Historia sí necesita. */

import { BRAND_SIGNATURE } from './brand';
import { loadImage, sampleBackground, luminancia, esTeal } from './coverGen';

const W = 1080;
const H = 1920;
const TEAL = '#009f8b';
// La placa un poco sobre el centro: arriba va el header de Instagram y abajo la barra de respuesta.
const TOP = 380;
const PIE = 190; // distancia del pie al borde inferior

/** Historia 1080×1920 en dataURL PNG a partir de la placa 1080×1080. */
export async function buildPlacaStory(placaUrl) {
  const img = await loadImage(placaUrl);
  const bg = sampleBackground(img);
  if (document.fonts?.ready) await document.fonts.ready; // sin esto el canvas dibuja con la fuente de fallback

  const mono = "'Google Sans Code', ui-monospace, SFMono-Regular, Consolas, monospace";
  const claro = luminancia(bg) > 0.55;

  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg.css;
  ctx.fillRect(0, 0, W, H);

  const alto = Math.round((W * img.naturalHeight) / img.naturalWidth);
  ctx.drawImage(img, 0, TOP, W, alto);

  // Pie: marcador + dominio, en el mismo mono espaciado de los tags de la placa.
  const marca = 16;
  const texto = BRAND_SIGNATURE.toUpperCase();
  ctx.font = `600 28px ${mono}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0.18em';
  const ancho = ctx.measureText(texto).width + marca + 20;
  const x0 = (W - ancho) / 2;
  const y = H - PIE;
  ctx.fillStyle = esTeal(bg) ? '#ffffff' : TEAL;
  ctx.fillRect(x0, y - marca + 2, marca, marca);
  ctx.fillStyle = esTeal(bg) ? '#ffffff' : (claro ? 'rgba(10,11,13,0.65)' : 'rgba(245,245,243,0.7)');
  ctx.fillText(texto, x0 + marca + 20, y);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  return c.toDataURL('image/png');
}

// Placa de la que sale la Historia: la imagen 1080×1080 de la pieza.
export function placaImageOf(piece) {
  return piece.assets.find((a) => a.format === 'image' && a.files?.length)?.files?.[0] || null;
}

// Asset de Historia (9:16) de la pieza, si el modelo lo declara.
export const storyAssetOf = (piece) => piece.assets.find((a) => a.format === 'story') || null;
