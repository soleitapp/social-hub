import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Guarda la Historia 9:16 de una pieza. Va a Drive (Piezas/<driveDir>/historia.png), que es la
// fuente de los assets: así `ingest-drive` la reencuentra sola y no queda solo en el repo.
const FILE = path.join(process.cwd(), 'data', 'pieces.json');
const RS = process.env.RS || 'G:/My Drive/Marketing/Redes sociales';
const PIEZAS = path.join(RS, 'Piezas');

export async function POST(req) {
  const { id, dataUrl } = await req.json();
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const piece = data.pieces.find((p) => p.id === id);
  if (!piece) return NextResponse.json({ error: 'pieza no existe' }, { status: 404 });
  const asset = piece.assets.find((a) => a.format === 'story');
  if (!asset) return NextResponse.json({ error: 'la pieza no declara asset de Historia' }, { status: 400 });
  if (!piece.driveDir) return NextResponse.json({ error: 'la pieza no tiene carpeta en Drive' }, { status: 400 });

  const dir = path.resolve(PIEZAS, piece.driveDir);
  if (!dir.startsWith(path.resolve(PIEZAS))) return NextResponse.json({ error: 'ruta fuera de Piezas' }, { status: 400 });
  const abs = path.join(dir, 'historia.png');

  try {
    if (dataUrl) {
      const b64 = String(dataUrl).replace(/^data:image\/\w+;base64,/, '');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(abs, Buffer.from(b64, 'base64'));
      asset.files = [`/api/drive/${piece.driveDir}/historia.png?v=${Date.now()}`];
      asset.status = 'rendered';
      // La Historia muestra la misma placa: hereda su alt en vez de pedir uno nuevo.
      const placa = piece.assets.find((a) => a.format === 'image' && a.alt);
      if (placa?.alt && !asset.alt) asset.alt = placa.alt;
    } else {
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
      delete asset.files;
      asset.status = 'pending';
    }
  } catch (e) {
    return NextResponse.json({ error: `no pude escribir en Drive: ${e.message}` }, { status: 500 });
  }

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  return NextResponse.json({ ok: true, asset });
}
