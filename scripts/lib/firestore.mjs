// Acceso de administrador a Firestore (base NEXT_PUBLIC_FIRESTORE_DATABASE) para los scripts.
// Usa las credenciales de `gcloud auth application-default login`; no hay claves en el repo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BACKUPS = path.join(ROOT, 'backups');

// Carga .env.local del repo en process.env (Node >= 20.12).
try { process.loadEnvFile(path.join(ROOT, '.env.local')); } catch { /* sin .env.local */ }

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!PROJECT) throw new Error('Falta NEXT_PUBLIC_FIREBASE_PROJECT_ID en .env.local');
const DATABASE = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || '(default)';

if (!getApps().length) initializeApp({ projectId: PROJECT, credential: applicationDefault() });
export const db = getFirestore(DATABASE);
export { Timestamp };

// Timestamps → ISO para poder guardarlos como JSON; el resto se copia tal cual.
export function toPlain(v) {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(toPlain);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toPlain(x)]));
  return v;
}

export const stamp = () => new Date().toISOString().replace(/[-:]/g, '').slice(0, 13); // 20261003T1830
export function ensureBackups() { fs.mkdirSync(BACKUPS, { recursive: true }); return BACKUPS; }
