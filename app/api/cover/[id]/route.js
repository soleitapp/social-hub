import { meta, leer, nombreCarpeta } from '@/lib/drive.mjs';

// Sirve una portada de video desde Drive. Solo entrega JPEG que viven en una carpeta `portadas`.
export async function GET(_req, { params }) {
  const { id } = params;
  if (!/^[\w-]{10,}$/.test(id)) return new Response('not found', { status: 404 });
  try {
    const m = await meta(id);
    const padre = m.parents?.[0];
    if (m.mimeType !== 'image/jpeg' || !padre || (await nombreCarpeta(padre)) !== 'portadas') return new Response('not found', { status: 404 });
    const buf = await leer(id);
    // El id no cambia al regrabar la portada; el cliente rompe la caché con ?v=.
    return new Response(buf, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch (e) {
    console.error('cover', id, e.response?.status, e.message);
    return new Response('not found', { status: 404 });
  }
}
