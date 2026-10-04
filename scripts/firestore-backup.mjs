// Respaldo completo de Firestore del hub a backups/firestore-<fecha>.json (fuera de git).
// Solo lee. Uso: node scripts/firestore-backup.mjs
import fs from 'node:fs';
import path from 'node:path';
import { db, toPlain, stamp, ensureBackups } from './lib/firestore.mjs';

const out = { exportedAt: new Date().toISOString(), pieces: [], events: [], meta: [] };

const pieces = await db.collection('pieces').get();
for (const doc of pieces.docs) {
  const dists = await doc.ref.collection('distributions').get();
  out.pieces.push({ _id: doc.id, ...toPlain(doc.data()), distributions: dists.docs.map((d) => ({ _id: d.id, ...toPlain(d.data()) })) });
}
const events = await db.collection('events').get();
out.events = events.docs.map((d) => ({ _id: d.id, ...toPlain(d.data()) }));
const meta = await db.collection('meta').get();
out.meta = meta.docs.map((d) => ({ _id: d.id, ...toPlain(d.data()) }));

const file = path.join(ensureBackups(), `firestore-${stamp()}.json`);
fs.writeFileSync(file, JSON.stringify(out));
const nd = out.pieces.reduce((n, p) => n + p.distributions.length, 0);
console.log(`Respaldo: ${file}`);
console.log(`  piezas ${out.pieces.length} · distribuciones ${nd} · eventos ${out.events.length} · meta ${out.meta.length}`);
console.log(`  tamaño ${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} MB`);
