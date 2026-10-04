# Modelo de contenido — Social Hub

El hub es la **fuente única** del contenido de marketing. Un contenido ya no
pertenece a una sola red: es una **base con variantes**. Se modela en 3 capas.

```
Pieza (base)  →  Assets (formatos)  →  Distribuciones (canal + caption + estado)
```

- **Pieza** — la unidad que se crea. Contiene la **base** (contenido canónico,
  agnóstico de red) + metadatos (`id`, `type`, `title`).
- **Asset** — un **formato renderizado** desde la base (carrusel, imagen, short…).
  Reutilizable en varios canales. Lo produce el render (Design / TipCover / Remotion).
- **Distribución** — publica **un asset en un canal**, con su **caption adaptado**
  y su **estado**. El caption vive acá (no en el asset): mismo carrusel, caption
  distinto en Instagram vs Bluesky.

## Entidades

Definición y validación: [`lib/schema.js`](lib/schema.js).

| Capa | Campos |
|---|---|
| **Piece** | `id` · `type` (`carousel`|`post`) · `n` · `title` · `subtitle` · `base` · `assets[]` · `distributions[]` · `driveDir` |
| **Asset** | `id` (`${pieceId}-${format}`) · `format` · `spec` · `source` (`design`\|`remotion`\|`code`) · `status` (`pending`\|`rendered`) · `files[]?` |
| **Distribution** | `platform` · `surface` · `assetId` → Asset · `caption?` · `status` · `url?` · `scheduledAt?` · `date?` |

**Formatos:** `carousel` · `image` · `short` · `text` · `article`
**Canales:** instagram · facebook · threads · linkedin · x · bluesky · tiktok · youtube · blog (ver `PLATFORMS` en `lib/schema.js`)
**Estado de distribución:** `draft` → `ready` → `scheduled` → `published` (y `deleted` = Borrado: salió y se eliminó; no cuenta en pendientes ni en el n/n)

## Ejemplo

```
p-001 "Título de la pieza" (carousel)
  base:    { slides: [...] }
  assets:  p-001-carousel (carousel · 1080×1350 ×5 · design · rendered)
           p-001-short    (short · 1080×1920 · remotion · rendered)
  distrib: instagram → p-001-carousel · caption IG           · published
           bluesky   → p-001-carousel · caption (adapt ≤300) · published
           threads   → p-001-carousel · caption IG
           tiktok/youtube → p-001-short                      · draft
```

JSON copiable en `data/pieces.example.json` (pásalo a `data/pieces.json` dentro de `pieces`).

## Flujo

1. **Autoría** — se crea/edita la Pieza (Claude API vía skills, o Claude Design para bespoke). Sólo la **base**.
2. **Render** — de la base salen los **assets** (PNG carrusel, PNG imagen, MP4 short).
3. **Distribución** — cada asset se publica por canal con su caption:
   API donde es gratis y limpia (Bluesky, Threads); **Cowork** donde la API es
   pagada o hay fricción (Instagram, LinkedIn, X).
4. El dashboard "qué está publicado y dónde" es una **proyección** de las distribuciones.

## Datos

- `data/pieces.json` — **la fuente**: `{ "generatedAt": "", "pieces": [...] }`. Empieza vacío; se edita acá.
- `data/overrides.json` — lo que se cambia desde el hub (URL, fecha, estado, caption), con claves `<pieza>/<red>/<superficie>`.
- `data/article-*.json` — captions, números y estados de artículos del blog, por slug.
- Validación: `validatePiece` en `lib/schema.js`.

> Sin bilingüe por ahora: el contenido es solo en español.
