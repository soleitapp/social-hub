import { NextResponse } from 'next/server';

// Publicación de solo lectura (HUB_READONLY=1): de /api solo se permiten las rutas que leen Drive; el resto
// (guardar, publicar, abrir carpetas, empaquetar) responde 401 hasta que exista sesión verificada en servidor.
const LECTURA = /^\/api\/(cover|drive)\//;

export function middleware(req) {
  if (process.env.HUB_READONLY !== '1') return NextResponse.next();
  if (req.method === 'GET' && LECTURA.test(req.nextUrl.pathname)) return NextResponse.next();
  return NextResponse.json({ error: 'solo lectura' }, { status: 401 });
}

export const config = { matcher: '/api/:path*' };
