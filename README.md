# Social Hub

Hub de marketing para equipos pequeños: **qué se publicó y dónde** (piezas por red), **calendario** de publicaciones y
**detalle de cada pieza** (vista previa por red, caption, estado, portada). Next.js 14 (App Router), Tailwind, Firebase Auth
opcional y Google Drive como almacén de archivos.

Es una plantilla: nace vacía, sin piezas ni marca. Tú le pones tu nombre, tus colores, tus redes y tus credenciales.

## Qué trae

| Módulo | Qué hace |
|---|---|
| `app/` + `components/` | El hub: Inicio, Calendario, Piezas, detalle y panel lateral. |
| `data/` | Tus piezas (`pieces.json`) y lo que se edita en el hub (`overrides.json`). Empieza vacío. |
| `lib/brand.js` | Nombre, wordmark, firma de portadas y dominio de login. |
| `scripts/` | Operación: respaldo de Firestore, conciliar estados con las redes, programar en Facebook, autorizar Drive. |
| `dispatch/` | Publicación por API en Bluesky y X (scripts de línea de comandos, opcionales). |
| `video/` | Generador de shorts verticales con Remotion (opcional). |
| `specs/` + `.claude/commands/` | Método de trabajo spec → plan → tareas → implementar con Claude Code. |

> **¿Usas un agente de IA (Claude Code, Codex, Cursor…)?** Pídele: «Lee AGENTS.md y adapta este hub a mi empresa». Él te preguntará marca y redes, y te guiará para que pegues tú las credenciales.

## Arranque en 5 pasos

Requisitos: Node 20.12 o superior y npm.

```
npm install
cp .env.local.example .env.local     # en Windows: copy .env.local.example .env.local
npm run dev                          # http://localhost:3000
```

1. **Instala** dependencias (`npm install`).
2. **Copia** `.env.local.example` a `.env.local`. Con el archivo vacío el hub ya arranca, sin login y sin Drive.
3. **Pon tu marca** en `.env.local` (`NEXT_PUBLIC_BRAND_*`) y tus colores en `tailwind.config.js`: [docs/adaptacion.md](docs/adaptacion.md).
4. **Carga tus piezas** en `data/pieces.json` siguiendo [SCHEMA.md](SCHEMA.md). Hay un ejemplo copiable en `data/pieces.example.json`.
5. **Conecta tus servicios** de a uno (Firebase, Drive, Meta, Bluesky, X…): [docs/credenciales.md](docs/credenciales.md).

Cuando quieras publicarlo en internet: [docs/despliegue.md](docs/despliegue.md).

## Cosas que conviene saber

- **Sin credenciales no se rompe nada**: cada integración se enciende solo si su variable existe.
- **El hub corre en la máquina que tiene Drive montado** (variable `RS`): las rutas `app/api/*` leen y escriben archivos locales.
  En producción se usa la API de Drive y el hub queda en solo lectura (`HUB_READONLY=1`).
- **No hay formulario para crear piezas todavía** (el botón "Crear" es un marcador). Las piezas se agregan editando `data/pieces.json`.
- **Los secretos nunca van al repo.** `.env.local`, `dispatch/.env` y `backups/` están en `.gitignore`.

## Documentación

- [docs/adaptacion.md](docs/adaptacion.md) — checklist para hacerlo tuyo: marca, redes, dominio, idioma.
- [docs/credenciales.md](docs/credenciales.md) — de dónde sale cada variable de `.env.local.example`.
- [docs/despliegue.md](docs/despliegue.md) — publicar en Firebase App Hosting.
- [docs/design-system.md](docs/design-system.md) — colores, tipografía y reglas visuales.
- [SCHEMA.md](SCHEMA.md) — modelo de datos (pieza → assets → distribuciones).
- [AGENTS.md](AGENTS.md) — instrucciones para un agente de IA que configure o adapte el hub (procedimiento, qué preguntar, reglas de credenciales).
- [CLAUDE.md](CLAUDE.md) y [specs/README.md](specs/README.md) — cómo trabajar con Claude Code en este repo.
