/* Construye un short completo para un dispatch:
   narración (Edge-TTS voz chilena) → mide duración → merge con beats → props-NN.json
   → remotion render → out/short-NN.mp4 → copia a ../public/assets/ig-cN-short.mp4 (social-hub)
   Uso: node build-short.mjs <NN>   (ej. 02)
   Requiere: data/beats.json y data/narration.json (cNN). */
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const HUB = path.resolve(DIR, '..'); // video/ vive dentro de social-hub
const RS = process.env.RS || 'G:/My Drive/Marketing/Redes sociales';
const FPS = 30, VOICE = 'es-CL-LorenzoNeural', TAIL = 0.85, MIN_S = 2.6;

const disp = String(parseInt(process.argv[2], 10)).padStart(2, '0');
if (!process.argv[2]) { console.error('Uso: node build-short.mjs <NN>'); process.exit(1); }
const id = 'c' + disp;

// El video y sus audios viven en Drive (Piezas/<driveDir>/), NO en el repo.
const pieces = JSON.parse(fs.readFileSync(path.join(HUB, 'data', 'pieces.json'), 'utf8')).pieces;
const driveDir = pieces.find((p) => p.id === id)?.driveDir;
if (!driveDir) { console.error(`Sin driveDir para ${id} — corre el ingest del hub primero`); process.exit(1); }

const beatsAll = JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'beats.json'), 'utf8'));
const narrAll = JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'narration.json'), 'utf8'));
const beats = beatsAll[id];
const lines = narrAll[id];
if (!beats) { console.error('Sin beats para', id); process.exit(1); }
if (!lines || lines.length !== beats.length) { console.error(`Narración incompleta para ${id} (beats ${beats.length}, líneas ${lines?.length})`); process.exit(1); }

async function synth(text, file) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
  const { audioStream, metadataStream } = tts.toStream(text);
  const chunks = [];
  audioStream.on('data', (c) => chunks.push(c));
  let endTicks = 0;
  metadataStream.on('data', (c) => {
    try { const j = JSON.parse(c.toString()); for (const m of j.Metadata || []) if (m.Type === 'WordBoundary') endTicks = Math.max(endTicks, (m.Data.Offset || 0) + (m.Data.Duration || 0)); } catch { /* no-JSON */ }
  });
  await new Promise((res, rej) => { audioStream.on('end', res); audioStream.on('error', rej); });
  fs.writeFileSync(file, Buffer.concat(chunks));
  return endTicks / 1e7;
}

const outDir = path.join(DIR, 'public', `vo-${disp}`);
fs.mkdirSync(outDir, { recursive: true });

console.log(`[${id}] voz…`);
const merged = [];
for (let i = 0; i < beats.length; i++) {
  const audio = `vo-${disp}/${i}.mp3`;
  const sec = await synth(lines[i], path.join(DIR, 'public', audio));
  const dur = Math.round(Math.max(sec + TAIL, MIN_S) * FPS);
  merged.push({ ...beats[i], dur, audio });
  console.log(`  escena ${i}: ${sec.toFixed(2)}s → ${dur}f`);
}

const propsFile = path.join(DIR, `props-${disp}.json`);
fs.writeFileSync(propsFile, JSON.stringify({ beats: merged }, null, 2));
const total = merged.reduce((s, b) => s + b.dur, 0);
console.log(`[${id}] ${total}f (${(total / FPS).toFixed(1)}s) → render…`);

const outMp4 = path.join(DIR, 'out', `short-${disp}.mp4`);
execSync(`npx remotion render src/index.jsx Short "${outMp4}" --props="./props-${disp}.json" --color-space=bt709`, { cwd: DIR, stdio: 'inherit' });

// Salida a Drive (no al repo): Piezas/<driveDir>/short.mp4 + audio/*.mp3
const drivePiece = path.join(RS, 'Piezas', driveDir);
fs.mkdirSync(drivePiece, { recursive: true });
fs.copyFileSync(outMp4, path.join(drivePiece, 'short.mp4'));
const audioDir = path.join(drivePiece, 'audio');
fs.mkdirSync(audioDir, { recursive: true });
for (const b of merged) { const a = path.join(DIR, 'public', b.audio); if (fs.existsSync(a)) fs.copyFileSync(a, path.join(audioDir, path.basename(b.audio))); }
console.log(`[${id}] ✓ Drive: Piezas/${driveDir}/short.mp4 (+audio)`);
