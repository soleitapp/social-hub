/* Genera la voz en off (Edge-TTS, voz chilena) de un short beat-a-beat.
   Uso: node voiceover.mjs 01
   - Escribe public/vo-<disp>/<i>.mp3 por escena.
   - Mide la duración real de cada línea (word boundaries) y escribe
     src/vo-<disp>.json con { fps, total, beats:[{ dur, audio }] } en frames,
     para que la composición ajuste cada escena al largo de su narración.
   La narración vive acá (números escritos para que la voz los diga bien);
   el texto en pantalla sigue viniendo de los beats visuales. */
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import fs from 'fs';
import path from 'path';

const FPS = 30;
const VOICE = 'es-CL-LorenzoNeural'; // chilena masculina; alt: es-CL-CatalinaNeural
const TAIL = 0.85;                    // respiro (s) tras cada línea antes del corte
const MIN_S = 2.6;                    // piso por escena (s)

// Narración por escena del tip 01 (alineada 1:1 a los beats visuales).
const SCRIPTS = {
  '01': [
    'Un titular que detiene el scroll.',
    'Texto que explica la cifra en una línea.',
    'Otra cifra que sostiene el argumento.',
    'Una frase que reencuadra el problema.',
    'Cierre con una frase corta. Síguenos para más.',
  ],
};

const disp = String(process.argv[2] || '01').padStart(2, '0');
const lines = SCRIPTS[disp];
if (!lines) { console.error('Sin narración para', disp); process.exit(1); }

const outDir = path.join('public', `vo-${disp}`);
fs.mkdirSync(outDir, { recursive: true });

async function synth(text, file) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
  const { audioStream, metadataStream } = tts.toStream(text);
  const chunks = [];
  audioStream.on('data', (c) => chunks.push(c));
  let endTicks = 0;
  metadataStream.on('data', (c) => {
    try {
      const j = JSON.parse(c.toString());
      for (const m of j.Metadata || []) {
        if (m.Type === 'WordBoundary') endTicks = Math.max(endTicks, (m.Data.Offset || 0) + (m.Data.Duration || 0));
      }
    } catch { /* chunk no-JSON, ignorar */ }
  });
  await new Promise((res, rej) => { audioStream.on('end', res); audioStream.on('error', rej); });
  fs.writeFileSync(file, Buffer.concat(chunks));
  return endTicks / 1e7; // ticks (100ns) → segundos
}

const beats = [];
let total = 0;
for (let i = 0; i < lines.length; i++) {
  const audio = `vo-${disp}/${i}.mp3`;
  const sec = await synth(lines[i], path.join('public', audio));
  const durS = Math.max(sec + TAIL, MIN_S);
  const dur = Math.round(durS * FPS);
  beats.push({ dur, audio });
  total += dur;
  console.log(`escena ${i}: voz ${sec.toFixed(2)}s → escena ${durS.toFixed(2)}s (${dur}f)`);
}

fs.writeFileSync(path.join('src', `vo-${disp}.json`), JSON.stringify({ fps: FPS, voice: VOICE, total, beats }, null, 2));
console.log(`\nTotal: ${total} frames (${(total / FPS).toFixed(1)}s) → src/vo-${disp}.json`);
