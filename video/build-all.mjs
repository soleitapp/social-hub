/* Renderiza en lote los shorts de un rango de dispatches (continúa ante errores).
   Uso: node build-all.mjs [desde] [hasta]   (default 2 18) */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const from = parseInt(process.argv[2] || '2', 10);
const to = parseInt(process.argv[3] || '18', 10);
const ok = [], fail = [];
for (let n = from; n <= to; n++) {
  const NN = String(n).padStart(2, '0');
  try {
    console.log(`\n======== build c${NN} (${n - from + 1}/${to - from + 1}) ========`);
    execSync(`node build-short.mjs ${NN}`, { cwd: DIR, stdio: 'inherit' });
    ok.push(NN);
  } catch (e) {
    fail.push(NN);
    console.error(`FALLO c${NN}:`, e.message);
  }
}
console.log(`\n==== LOTE LISTO ====`);
console.log('OK   :', ok.map((x) => 'c' + x).join(' ') || '—');
console.log('FALLO:', fail.map((x) => 'c' + x).join(' ') || '—');
