# Adaptar el hub a tu empresa

Checklist en el orden recomendado. Cada punto dice **qué cambiar** y **dónde**.

## 1. Marca

| Qué | Dónde |
|---|---|
| Nombre del hub (pestañas del navegador, descripción) | `NEXT_PUBLIC_BRAND_NAME` en `.env.local` |
| Wordmark del topbar y del login (dos palabras: la primera lleva el color de acento) | `NEXT_PUBLIC_BRAND_PRIMARY` + `NEXT_PUBLIC_BRAND_SECONDARY` |
| Firma que se dibuja en portadas e historias | `NEXT_PUBLIC_BRAND_SIGNATURE` (tu dominio) |
| Logo propio en vez de texto | `components/Wordmark.jsx` (SVG inline) y `components/Nav.jsx` |
| Favicon / ícono de pestaña | Agrega `app/icon.svg` (o `app/favicon.ico`) y `public/favicon.svg`; Next los toma solo |
| Valores por defecto de la marca (sin `.env.local`) | `lib/brand.js` |

Las variables `NEXT_PUBLIC_*` se leen al compilar: reinicia `npm run dev` (o vuelve a desplegar) después de cambiarlas.

## 2. Colores y tipografía

- Colores: `tailwind.config.js` → `theme.extend.colors`. Los alias de la interfaz oscura son `bg`, `panel`, `panel2`, `line`, `sub`,
  `teal` (acento), `tealdark`, `glow` y `mint`. Cambia el **valor**, no el nombre, y la interfaz completa se actualiza.
- Login y botón principal (MUI): `components/mui/ThemeRegistry.jsx` y el degradado de `app/login/page.js`.
- Láminas de vista previa y portadas generadas usan el acento en `components/SlideCanvas.jsx`, `lib/coverGen.js` y
  `lib/storyGen.js` (constante `TEAL`).
- Shorts de video: `video/src/brand.js` (`COLORS` y `BRAND`).
- Tipografía: Open Sans en `app/layout.js`. Cambia la fuente de `next/font/google` y la variable `--font-sans`.
- Al terminar, actualiza la tabla de colores de `docs/design-system.md` para que siga siendo la fuente de verdad.

## 3. Quién puede entrar

- `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=tuempresa.com` limita el acceso a cuentas de ese dominio (Google Workspace).
  Vacío = cualquier cuenta de Google que pase por Firebase Auth.
- Sin `NEXT_PUBLIC_FIREBASE_API_KEY` no hay login: úsalo solo en tu máquina.
- Importante: el login es del navegador. Los datos de `data/*.json` viajan en el JavaScript de la página, así que una
  URL pública no debe difundirse. Ver "Modo solo lectura" en `docs/despliegue.md`.

## 4. Redes

1. **Cuáles aparecen:** `lib/schema.js` → `PLATFORMS` define las redes válidas y sus superficies (post, historia, reel…),
   y `CAPTION_LIMIT` el largo máximo de caption. Para quitar una red, bórrala de ahí y de `lib/channels.js`.
2. **Una red nueva:** agrégala a `PLATFORMS` y `CAPTION_LIMIT`, y suma su ícono en `components/PlatformIcon.jsx`.
3. **Credenciales de cada red:** `docs/credenciales.md`.
4. **Publicación automática:** `dispatch/` cubre Bluesky y X por API. Instagram, LinkedIn, TikTok y YouTube se publican a mano (o con
   tu propio flujo) y se registran en el hub con su URL y estado.

## 5. Carpetas de Drive

El hub espera esta estructura dentro de la carpeta raíz (variable `RS` en local, `DRIVE_ROOT_FOLDER_ID` en servidor):

```
Redes sociales/
└── Piezas/
    └── <driveDir de la pieza>/     ← el nombre que pongas en piece.driveDir
        ├── captions/<red>.txt
        ├── portadas/               ← portadas de video generadas por el hub
        └── (imágenes, videos…)
```

Si prefieres otra estructura, el cambio está en `lib/drive.mjs` y en las rutas `app/api/{drive,dist,bundle,open,story}`.

## 6. Piezas

Edita `data/pieces.json` (ver `SCHEMA.md` y `data/pieces.example.json`). Reglas que valida `lib/schema.js`: cada pieza tiene `id` y `base`;
cada distribución usa una plataforma y superficie válidas, un estado válido y un `assetId` que exista en la misma pieza.
`data/overrides.json` guarda lo que cambias desde la interfaz (URL, fecha, estado, caption); no hace falta crearlo a mano.

## 7. Textos de ejemplo

Estos archivos traen contenido de ejemplo que debes reemplazar antes de usarlos:

- `dispatch/post-test.mjs` y `dispatch/x-test.mjs` — **publican de verdad**; cambia el texto antes de ejecutarlos.
- `dispatch/post-tip.mjs`, `post-article.mjs`, `run.mjs` — importan `tips.js`, `articles.js` y `adapt.js` de tu repo de sitio web
  (`../../sitio-web/src/...`). Ajusta esas rutas a tu sitio o descarta lo que no uses.
- `video/src/Root.jsx`, `video/src/vo-01.json`, `video/voiceover.mjs`, `video/derive-beats.mjs` — guion y beats de ejemplo.
- `app/pared/page.js` — simulador temporal de pared de cuadros; bórralo (junto con `components/WallSimulator.jsx` y `lib/wallGeometry.mjs`) si no lo necesitas.

## 8. Idioma

La interfaz y los comentarios están en español. No hay capa de traducción: para otro idioma hay que editar los textos de
`components/` y `app/` (y `lib/schema.js` para etiquetas de estados y superficies).

## 9. Antes del primer commit propio

- Cambia `name` y `description` en `package.json` (raíz, `dispatch/` y `video/`).
- Revisa `.firebaserc`, `firebase.json` y `apphosting.yaml`: traen marcadores (`TU-PROYECTO-FIREBASE`, `TU-BACKEND-APPHOSTING`).
- Confirma que `.env.local` no aparece en `git status`.
