# CLAUDE.md — Social Hub

Hub de marketing: qué se publicó y dónde (piezas por red), calendario y detalle de cada pieza.
Es una plantilla: para adaptarla a una empresa nueva, un agente de IA sigue **`AGENTS.md`** (procedimiento, reglas sobre credenciales y verificación); una persona empieza por `README.md` y `docs/adaptacion.md`.

**Antes de trabajar** lee `specs/README.md` (cómo trabajamos) y `docs/design-system.md` (cómo se ve todo).
Para el modelo de datos, `SCHEMA.md`.

## Stack

- **Framework:** Next.js 14 App Router (`'use client'` en lo interactivo). Sin TypeScript.
- **UI:** Tailwind (tokens en `tailwind.config.js`). MUI + CSS Modules **solo** en login, menú de usuario, buscador,
  notificaciones y diálogos del topbar. Ver "UI" abajo.
- **Marca:** `lib/brand.js` (nombre, wordmark, firma de portadas, dominio de login). Colores en `tailwind.config.js`.
- **Datos:** `data/pieces.json` + `data/overrides.json` (lo que se edita en el hub). Las rutas `app/api/*` leen y
  escriben archivos locales: el hub corre en la máquina que tiene Drive montado (variable `RS`).
- **Auth:** Firebase Auth con Google. Si defines `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN`, solo entra ese dominio. Config en `.env.local`
  (ver `.env.local.example`). Sin config de Firebase, el hub corre sin login.
- **Drive desde el servidor:** `lib/drive.mjs`. Las **portadas de video viven en Drive** (`Piezas/<driveDir>/portadas/`);
  `distribution.cover = { driveId, t, v }` y se sirven por `/api/cover/<id>`. Una cuenta de servicio no puede crear
  archivos en Drive (sin cuota): se escribe con OAuth del usuario (`GOOGLE_OAUTH_*`, token con `scripts/drive-authorize.mjs`).
- **Producción:** Firebase App Hosting (`firebase deploy --only apphosting`), en solo lectura (`HUB_READONLY=1`,
  `middleware.js`) hasta que haya sesión en servidor. Ver `docs/despliegue.md`.
- **Alias:** `@/` apunta a la raíz del repo.

## UI — reglas que no se rompen

- Un **shell a alto de ventana**: topbar fijo; la ventana no hace scroll. Cada página renderiza un `<PageHeader/>` y
  **un único contenedor** que scrollea por dentro (regla `.app-main` en `app/globals.css`). Una página que necesite
  su propio layout lleva la clase `libre`.
- Radio de contenedores y controles: `rounded-md`. Los medios (imágenes/video de las vistas previas) pueden ir con `rounded-xl`.
- Títulos de página 18px / peso 400 / interlineado 28px. Etiquetas y metadatos en mono, 10–11px, mayúsculas con tracking.
- Colores y tamaños salen de `docs/design-system.md`; no inventes valores nuevos.

## Cómo trabajamos (acuerdos)

1. **No hagas cambios que no te pidieron.** Si algo adyacente parece mal, dilo y pregunta.
2. **Si el pedido es ambiguo, pregunta una vez** con opciones concretas antes de construir.
3. **Cada cambio mediano o grande tiene spec** en `specs/NNN-nombre/` (ver `specs/README.md`). Los cambios de una línea no.
4. **Verifica antes de decir "listo":** compila (`npx esbuild <archivo> --loader:.jsx=jsx --outfile=/dev/null`) y, si
   hay servidor, que las rutas respondan 200. Di explícitamente qué no pudiste ver en pantalla.
5. **Commits:** solo los archivos de la tarea. `data/` suele tener cambios ajenos; no lo incluyas sin que lo pidan.
   No hagas push ni deploy sin que lo pidan.
6. **Credenciales:** las pega el usuario en `.env.local`. Nunca van al repo ni al chat.

## Windows / shell

- Si usas Git Bash sobre Windows, para escribir archivos largos usa la herramienta de escritura, no `cat <<EOF` con
  comillas, backticks o `${}`: el shell los interpreta y corrompe el archivo.
- Algunos archivos pueden tener finales de línea CRLF; al editar con scripts normaliza `\r\n` antes de buscar texto.
- Los scripts de operación usan Node >= 20.12 (`process.loadEnvFile`).

## Scripts de operación (`scripts/`)

Todos simulan por defecto y escriben solo con `--go` (y exigen un respaldo de hoy en `backups/`).

| Script | Para qué |
|---|---|
| `firestore-backup.mjs` | Respaldo completo de Firestore en `backups/` (fuera de git) |
| `reconcile-estados.mjs` | Contrasta las programadas vencidas con las redes y corrige estados |
| `programar-facebook.mjs` | Programa en la Página (programación nativa) las distribuciones `ready` de Facebook |
| `drive-authorize.mjs` | Autorización única de Drive; deja `GOOGLE_OAUTH_REFRESH_TOKEN` en `.env.local` |

## Comandos

```
npm run dev        # servidor de desarrollo (puerto 3000)
npm run build      # compila para producción
```

## Comandos de spec (`.claude/commands/`)

`/spec` → `/plan` → `/tasks` → `/implement`. Detalle en `specs/README.md`.
