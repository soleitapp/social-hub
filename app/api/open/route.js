import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Abre la carpeta de la pieza en el explorador del sistema. Solo tiene sentido en local
// (el hub corre en la máquina que tiene Drive montado); por eso vive detrás de una API.
const FILE = path.join(process.cwd(), 'data', 'pieces.json');
const RS = process.env.RS || 'G:/My Drive/Marketing/Redes sociales';
const PIEZAS = path.join(RS, 'Piezas');

export async function POST(req) {
  const { id, sub } = await req.json();
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const piece = data.pieces.find((p) => p.id === id);
  if (!piece) return NextResponse.json({ error: 'pieza no existe' }, { status: 404 });
  if (!piece.driveDir) return NextResponse.json({ error: 'esta pieza no tiene carpeta en Drive' }, { status: 404 });

  const root = path.resolve(PIEZAS);
  const target = path.resolve(path.join(PIEZAS, piece.driveDir, sub || ''));
  // No salir de Piezas/ aunque venga un sub raro.
  if (target !== root && !target.startsWith(root + path.sep)) {
    return NextResponse.json({ error: 'ruta fuera de Piezas' }, { status: 400 });
  }
  if (!fs.existsSync(target)) {
    return NextResponse.json({ error: `no encuentro ${target} — ¿Drive montado?` }, { status: 404 });
  }

  const cmd = process.platform === 'win32' ? 'explorer' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  try {
    // detached + unref: no bloquea la respuesta ni deja el proceso colgado del server.
    spawn(cmd, [target], { detached: true, stdio: 'ignore' }).unref();
  } catch (e) {
    return NextResponse.json({ error: `no pude abrir el explorador: ${e.message}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, path: target });
}
