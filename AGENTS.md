# AGENTS.md — instrucciones para agentes de IA

Este repo es una **plantilla** de hub de marketing (piezas por red, calendario, detalle de cada pieza). Una empresa nueva la
adapta a su marca, redes y credenciales. Si eres un agente (Claude Code, Codex, Cursor, etc.) y te piden "configurar",
"adaptar" o "ponerlo en marcha", sigue este documento. Para trabajar en el código día a día, lee además `CLAUDE.md`
(convenciones de UI, forma de trabajo y scripts).

## Reglas que no se negocian

1. **Nunca pidas ni leas credenciales en el chat.** El usuario las pega él mismo en `.env.local` (o `dispatch/.env`). No las
   copies a otros archivos, logs, commits, specs ni mensajes. Si ves un secreto, no lo repitas.
2. **No crees ni modifiques nada en servicios externos** (publicar en redes, escribir en Firestore/Drive/Secret Manager,
   desplegar) sin que el usuario lo pida en ese momento. Los scripts de `scripts/` y `dispatch/` publican o escriben de verdad:
   **ejecútalos solo si el usuario lo pide, y los de `scripts/` primero sin `--go`** (simulan por defecto).
3. **No hagas push, deploy ni commits** salvo petición explícita. `.env.local`, `dispatch/.env` y `backups/` no se commitean.
4. **No inventes datos de la empresa**: nombre, dominio, colores, redes y textos los da el usuario. Pregunta una vez, con
   opciones concretas, lo que falte (ver "Qué preguntar").
5. **No toques lo que no te pidieron.** Si algo adyacente parece mal, dilo y pregunta.
6. **Verifica antes de decir "listo"** y di explícitamente qué no pudiste ver en pantalla (login real, Drive, redes).

## Mapa del repo

| Ruta | Qué es | ¿Lo adaptas? |
|---|---|---|
| `lib/brand.js` | Nombre, wordmark, firma de portadas, dominio de login (lee `NEXT_PUBLIC_*`) | **Sí**, primero |
| `tailwind.config.js` | Tokens de color (alias de UI: `bg`, `panel`, `line`, `teal`, `glow`…) | **Sí** (colores de marca) |
| `components/Wordmark.jsx` | Logo en SVG de texto | Sí, si hay logo propio |
| `lib/schema.js` | Redes válidas (`PLATFORMS`), superficies, límites de caption, estados | Sí (qué redes usa la empresa) |
| `lib/channels.js` | Canales del tablero y sus textos de ayuda | Sí, junto con `schema.js` |
| `components/PlatformIcon.jsx` | Ícono por red | Solo si se agrega una red |
| `data/pieces.json` | Las piezas (empieza vacío). Ejemplo: `data/pieces.example.json` | Lo llena el usuario |
| `data/overrides.json`, `data/article-*.json` | Ediciones hechas desde el hub | No a mano |
| `app/` · `components/` | Páginas y UI (shell a alto de ventana, ver `CLAUDE.md`) | Solo con spec |
| `app/api/*` | Rutas que leen/escriben Drive local o por API | Solo con spec |
| `lib/drive.mjs` | Cliente de Drive del servidor (cuenta de servicio + OAuth) | Estructura de carpetas, si cambia |
| `middleware.js` | Modo solo lectura (`HUB_READONLY=1`) | No lo quites sin verificación de sesión |
| `scripts/` | Operación: respaldo de Firestore, conciliar estados, programar Facebook, autorizar Drive | Solo ejecutar a pedido |
| `dispatch/` | Publicación por API en Bluesky y X (CLI, opcional) | Ajustar rutas al sitio de la empresa |
| `video/` | Shorts con Remotion (opcional) | Marca y guion de ejemplo |
| `.firebaserc`, `firebase.json`, `apphosting.yaml` | Despliegue; traen marcadores `TU-…` | Sí, al desplegar |
| `docs/` | `adaptacion.md`, `credenciales.md`, `despliegue.md`, `design-system.md` | Mantenlos al día |

## Procedimiento de adaptación (en este orden)

### 0. Reconocimiento (solo lectura)
Lee `README.md`, `docs/adaptacion.md`, `docs/credenciales.md`, `SCHEMA.md` y `.env.local.example`. Confirma con `git status` que el
árbol está limpio y que `.env.local` no existe todavía (si existe, no lo abras para mostrarlo: solo comprueba qué variables están definidas).

### 1. Qué preguntar al usuario (una sola ronda)
- Nombre del hub y del wordmark (dos palabras: la primera con color de acento) y dominio para la firma de portadas.
- Dominio de correo que puede entrar (o "cualquiera") y si usarán login (Firebase) o solo local.
- Color de acento y fondo (o "dejar los de la plantilla").
- Qué redes usan: `instagram`, `facebook`, `threads`, `linkedin`, `x`, `bluesky`, `tiktok`, `youtube`, `blog` (u otras).
- Si usarán Drive (carpeta raíz y dónde está montada), `dispatch/` y `video/`, o los quitan.
- Dónde se desplegará (Firebase App Hosting u otro) o si por ahora es solo local.

### 2. Instalar y arrancar
```
npm install
cp .env.local.example .env.local      # Windows: copy .env.local.example .env.local
npm run dev                           # http://localhost:3000
```
Debe abrir sin login y con el tablero vacío. Requiere Node >= 20.12.

### 3. Marca (sin credenciales)
- Escribe en `.env.local` solo las variables `NEXT_PUBLIC_BRAND_*`, `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` con lo que dijo el usuario.
- Colores: edita los **valores** (no los nombres) en `tailwind.config.js`; actualiza la tabla de `docs/design-system.md`.
  Hay un `TEAL` fijo en `lib/coverGen.js`, `lib/storyGen.js` y `components/SlideCanvas.jsx`, y colores en `components/mui/ThemeRegistry.jsx`,
  `app/login/page.js` y `video/src/brand.js`: cámbialos juntos para que no queden dos acentos.
- Logo propio: `components/Wordmark.jsx` y `app/icon.svg`.
- Reinicia `npm run dev` (las `NEXT_PUBLIC_*` se leen al compilar).

### 4. Redes
Quita de `lib/schema.js` (`PLATFORMS`, `CAPTION_LIMIT`) y de `lib/channels.js` las redes que no usan. Para una red nueva, agrégala en
`PLATFORMS`, `CAPTION_LIMIT` y `components/PlatformIcon.jsx`. Valida con `validatePiece` (ver `lib/schema.js`).

### 5. Datos
Si el usuario quiere ver el hub con contenido, copia `data/pieces.example.json` a `data/pieces.json` **solo si lo pide**, y avisa que
es de ejemplo. Las piezas reales las agrega el usuario siguiendo `SCHEMA.md`. No generes piezas inventadas "para llenar".

### 6. Credenciales (las pone el usuario)
Guíalo con `docs/credenciales.md`, un servicio a la vez, y pídele que pegue los valores en `.env.local`. Tú solo:
- le indicas qué variable corresponde a qué paso de la consola del proveedor,
- compruebas **que la variable existe** (sin imprimir su valor) y que la integración se activa,
- nunca ejecutas `drive-authorize.mjs`, scripts con `--go` ni `dispatch/post-*.mjs` / `*-test.mjs` sin que lo pida.

### 7. Limpieza opcional
Si el usuario no usa algo, propón (y confirma antes de borrar): `app/pared/` + `components/WallSimulator.jsx` + `lib/wallGeometry.mjs`,
`dispatch/`, `video/`. `/pared` no tiene enlaces desde el menú (se entra por URL), así que borrarla no deja referencias; igual corre `npm run build`.
Cambia `name`/`description` en los tres `package.json`.

### 8. Despliegue (solo si lo pide)
Completa los marcadores `TU-…` de `.firebaserc`, `firebase.json` y `apphosting.yaml` con los datos del usuario y sigue `docs/despliegue.md`.
Deja `HUB_READONLY=1` activo. Los secretos los crea el usuario con `firebase apphosting:secrets:set`.

## Verificación mínima antes de entregar

```
npm run build                                     # debe compilar sin errores
npx esbuild <archivo> --loader:.jsx=jsx --outfile=/dev/null    # chequeo rápido de un archivo (Windows: NUL)
node --check <script>.mjs                         # scripts de scripts/, dispatch/, video/
```
Con `npm run dev` (o `npm start`), `/`, `/piezas`, `/calendario` y `/login` deben responder 200, con `data/pieces.json` vacío y con la pieza de ejemplo.
Reporta: qué quedó configurado, qué variables siguen vacías, y qué no pudiste comprobar (login real, Drive, redes, shorts).

## Trampas conocidas

- **Windows / Git Bash:** escribe archivos largos con la herramienta de escritura, no con `cat <<EOF`; algunos archivos tienen finales CRLF
  (normaliza `\r\n` antes de buscar/reemplazar texto en scripts); `python` puede no estar instalado, usa `node`.
- **Variables `NEXT_PUBLIC_*`** se incrustan al compilar: cambiarlas exige reiniciar o volver a desplegar.
- **Drive:** una cuenta de servicio solo lee; para escribir se necesita OAuth del usuario (`scripts/drive-authorize.mjs`).
- **Los datos viajan al navegador:** `data/*.json` se importan en el cliente; una URL pública no debe difundirse y no se guarda nada sensible ahí.
- **Rotar secretos en App Hosting:** crear versión nueva → cambiar `@N` → desplegar → recién entonces deshabilitar las viejas (ver `docs/despliegue.md`).
- **No hay rutas `/api/oauth/*`** ni formulario para crear piezas: no los prometas; los tokens de Meta/Threads se obtienen a mano.

## Cómo trabajar en cambios nuevos

Cambios medianos o grandes siguen spec → plan → tareas → implementación (`specs/README.md`; comandos `/spec`, `/plan`, `/tasks`,
`/implement` en `.claude/commands/`). Los cambios de una línea no necesitan spec. Commits solo con los archivos de la tarea.
