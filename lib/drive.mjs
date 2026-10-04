// Acceso a Google Drive desde el servidor. Una cuenta de servicio no tiene cuota de almacenamiento y no puede crear
// archivos en el Drive del usuario, así que se escribe con la autorización OAuth del usuario:
//   GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN (se genera con scripts/drive-authorize.mjs).
// Sin esas variables cae a la cuenta de servicio (solo lectura y carpetas): GOOGLE_SERVICE_ACCOUNT_JSON es el JSON en
// una línea o la ruta a un archivo fuera del repo; sin ella usa las credenciales por defecto del entorno.
import fs from 'fs';
import { Readable } from 'stream';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const COMUN = { supportsAllDrives: true };

let clientP;
function client() {
  clientP ??= (async () => {
    // Los secretos pegados a mano suelen traer espacios, saltos de línea o comillas: se limpian.
    const limpio = (v) => (v || '').trim().replace(/^["']|["']$/g, '').trim();
    const id = limpio(process.env.GOOGLE_OAUTH_CLIENT_ID);
    const secret = limpio(process.env.GOOGLE_OAUTH_CLIENT_SECRET);
    const refresh_token = limpio(process.env.GOOGLE_OAUTH_REFRESH_TOKEN);
    if (id && secret && refresh_token) {
      const oauth = new OAuth2Client(id, secret);
      oauth.setCredentials({ refresh_token });
      return oauth;
    }
    const raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim();
    const credentials = raw ? JSON.parse(raw.startsWith('{') ? raw : fs.readFileSync(raw, 'utf8')) : undefined;
    return new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive'] }).getClient();
  })();
  return clientP;
}

async function req(opts) {
  return (await client()).request(opts);
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

// ruta de carpetas → id (con caché por proceso). Crea las que falten si `crear` es true.
const carpetas = new Map();
export async function carpeta(segmentos, { crear = false } = {}) {
  let padre = process.env.DRIVE_PIEZAS_FOLDER_ID || (await piezasId());
  for (const nombre of segmentos) {
    const clave = `${padre}/${nombre}`;
    let id = carpetas.get(clave);
    if (!id) {
      const q = `'${padre}' in parents and name='${esc(nombre)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const { data } = await req({ url: `${API}/files`, params: { q, fields: 'files(id)', pageSize: 1, includeItemsFromAllDrives: true, ...COMUN } });
      id = data.files[0]?.id;
      if (!id && crear) {
        const r = await req({ url: `${API}/files`, method: 'POST', params: COMUN, data: { name: nombre, mimeType: 'application/vnd.google-apps.folder', parents: [padre] } });
        id = r.data.id;
      }
      if (!id) return null;
      carpetas.set(clave, id);
    }
    padre = id;
  }
  return padre;
}

let piezas;
async function piezasId() {
  if (piezas) return piezas;
  const root = process.env.DRIVE_ROOT_FOLDER_ID;
  if (!root) throw new Error('Falta DRIVE_ROOT_FOLDER_ID');
  const q = `'${root}' in parents and name='Piezas' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const { data } = await req({ url: `${API}/files`, params: { q, fields: 'files(id)', pageSize: 1, includeItemsFromAllDrives: true, ...COMUN } });
  piezas = data.files[0]?.id;
  if (!piezas) throw new Error('No encuentro la carpeta Piezas en Drive');
  return piezas;
}

// Crea o reemplaza (mismo id, así el enlace no cambia) un archivo en una carpeta.
export async function subir(carpetaId, nombre, buffer, mimeType) {
  const q = `'${carpetaId}' in parents and name='${esc(nombre)}' and trashed=false`;
  const { data } = await req({ url: `${API}/files`, params: { q, fields: 'files(id)', pageSize: 1, includeItemsFromAllDrives: true, ...COMUN } });
  const existente = data.files[0]?.id;
  if (existente) {
    const r = await req({ url: `${UPLOAD}/files/${existente}`, method: 'PATCH', params: { uploadType: 'media', ...COMUN }, headers: { 'Content-Type': mimeType }, data: buffer });
    return r.data.id;
  }
  const frontera = `hub${Date.now().toString(36)}`;
  const meta = JSON.stringify({ name: nombre, parents: [carpetaId] });
  const cuerpo = Buffer.concat([
    Buffer.from(`--${frontera}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${frontera}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${frontera}--`),
  ]);
  const r = await req({ url: `${UPLOAD}/files`, method: 'POST', params: { uploadType: 'multipart', fields: 'id', ...COMUN }, headers: { 'Content-Type': `multipart/related; boundary=${frontera}` }, data: cuerpo });
  return r.data.id;
}

export async function borrar(id) {
  try { await req({ url: `${API}/files/${id}`, method: 'DELETE', params: COMUN }); } catch (e) { if (e.response?.status !== 404) throw e; }
}

export async function meta(id) {
  const { data } = await req({ url: `${API}/files/${id}`, params: { fields: 'id,name,mimeType,parents,md5Checksum', ...COMUN } });
  return data;
}

export async function leer(id) {
  const r = await req({ url: `${API}/files/${id}`, params: { alt: 'media', ...COMUN }, responseType: 'arraybuffer' });
  return Buffer.from(r.data);
}

// Nombre de una carpeta por id (para comprobar que una portada vive en `portadas`).
const nombresCarpeta = new Map();
export async function nombreCarpeta(id) {
  if (!nombresCarpeta.has(id)) nombresCarpeta.set(id, (await meta(id)).name);
  return nombresCarpeta.get(id);
}

// Ruta relativa a Piezas ("Carruseles/c01/lamina.png") → id del archivo (con caché por proceso).
const archivos = new Map();
export async function archivoPorRuta(rel) {
  if (archivos.has(rel)) return archivos.get(rel);
  const segs = rel.split('/').filter(Boolean);
  const nombre = segs.pop();
  const dir = nombre && (await carpeta(segs));
  if (!dir) return null;
  const q = `'${dir}' in parents and name='${esc(nombre)}' and mimeType!='application/vnd.google-apps.folder' and trashed=false`;
  const { data } = await req({ url: `${API}/files`, params: { q, fields: 'files(id)', pageSize: 1, includeItemsFromAllDrives: true, ...COMUN } });
  const id = data.files[0]?.id ?? null;
  if (id) archivos.set(rel, id);
  return id;
}

// Contenido en streaming; admite Range (necesario para <video>).
export async function abrir(id, range) {
  const r = await req({ url: `${API}/files/${id}`, params: { alt: 'media', ...COMUN }, responseType: 'stream', headers: range ? { Range: range } : {}, validateStatus: (s) => s === 200 || s === 206 });
  return { body: Readable.toWeb(r.data), status: r.status, headers: r.headers };
}
