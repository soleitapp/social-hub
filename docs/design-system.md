# Sistema de diseño — Social Hub

Una sola referencia visual. El tema es **oscuro**. Los valores de abajo son los de la plantilla; para tu marca cámbialos
(ver `docs/adaptacion.md`) y actualiza esta tabla para que siga siendo la fuente de verdad. Se implementan en Tailwind
(`tailwind.config.js`) y, donde hay MUI, en `components/mui/ThemeRegistry.jsx`.

## Colores

| Token | Valor | Uso |
|---|---|---|
| Fondo de página (`bg`) | `#0E1519` | Fondo general, texto sobre el botón principal |
| Panel / tarjeta (`panel`) | `#172127` | Contenedor principal, tarjetas, menús |
| Panel 2 (`panel2`) | `#202D35` | Filas, marcos exteriores de menús |
| Línea (`line`) | `#2C3B45` | Todos los bordes y divisores |
| Texto | `#EEF3F5` | Texto principal |
| Texto secundario (`sub`) | `#8A99A3` | Metadatos, etiquetas, iconos |
| Azul Soleit sobre oscuro (`teal`, `primary`) | `#6B9EFF` | Botón principal, contadores, bordes de acento |
| Hover del principal (`tealdark`) | `#5790FF` | Hover del botón principal |
| Glow | `#6B9EFF` | Acento sobre fondo oscuro (enlace activo, valores destacados; también el estado Listo) |
| Error (texto) | `#ef9a9a` | Alertas y vencidos |
| Advertencia | `#f6b93b` | Programado, faltantes |
| Éxito (`success`) | `#81C784` | Publicado: chips, contadores, cobertura y calendario. Nunca el azul de marca |

| Azul Soleit (piezas, fondos claros) | `#0057FF` | Acento de láminas, portadas e historias; sobre lámina oscura se usa `#6B9EFF` |

Neutros y acento salen de Petroleum700, edición Soleit (tema oscuro). Reglas: el azul es el **único** color de marca. Color nuevo → primero al sistema, no a un componente.

## Tipografía

- **Sans:** Open Sans (400 / 600 / 700 / 800). **Mono:** Google Sans Code → `ui-monospace, SFMono-Regular, Consolas, monospace`.
- Títulos de página: **18px · peso 400 · interlineado 28px · tracking −0.025em**. h1–h3 siempre peso 400.
- Etiquetas y metadatos: mono 10–11px, mayúsculas con tracking 0.14–0.2em, color `sub`.
- Cuerpo en componentes: 13px. Botones: 600, sin mayúsculas (salvo mono).
- `antialiased` en todo el documento.

## Forma

- **Radio de contenedores y controles: 6px (`rounded-md`)**. Excepciones: menú de usuario (24px exterior / 18px interior) y
  medios de vista previa (imágenes/video).
- Bordes siempre de 1px en `line`. Sombra solo en popups (`shadow-2xl`).
- Espaciado en múltiplos de 4px. Gutter de página: **24px**.
- Controles compactos: alto **28px** (40px en móvil por objetivo táctil).

## Layout de página (shell + contenedor único)

```
┌ topbar · 56px · borde inferior · padding 0 24px ───────────────┐
│ Soleit HUB       INICIO CALENDARIO PIEZAS   [buscar][+][🔔][👤] │
├────────────────────────────────────────────────────────────────┤
│ PageHeader · padding 12px 24px   Título │ filtros     acciones  │
│ ┌ contenedor · margen 0 24px 16px · borde · radio 6 ─────────┐ │
│ │  (scroll interno)                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
└ alto = 100dvh; la ventana nunca scrollea ──────────────────────┘
```

- El shell mide `100dvh` y no hace scroll. Cada página = **un `PageHeader` + un único contenedor** que scrollea por dentro.
- Móvil (≤768px): el contenedor ocupa todo el ancho, sin radio ni bordes laterales; los filtros del header se pliegan tras un botón «Filtros».
- Una página con layout propio (p. ej. `/pared`) se excluye con la clase `libre`.

## Componentes compartidos

| Componente | Descripción | Archivo |
|---|---|---|
| Topbar | Marca a la izquierda, enlaces mono 11px, acciones a la derecha. Enlace activo en `glow`. | `Nav.jsx`, `NavLinks.jsx` |
| PageHeader | Título + línea vertical + filtros + acciones | `PageHeader.jsx` |
| Buscador general | Botón con lupa + `Ctrl K`; diálogo anclado arriba; ↑↓ Enter | `GlobalSearch.jsx` |
| Crear | Botón + con menú | `QuickCreate.jsx` (placeholder) |
| Notificaciones | Campana con contador + `SidePanel` con secciones | `NotificationsMenu.jsx` |
| Avatar y menú de usuario | Avatar 36px; menú de dos capas con wordmark | `UserMenu.jsx` |
| SidePanel | Drawer derecho 440px | `SidePanel.jsx` |
| Login | Tarjeta con wordmark y botón de Google | `app/login/page.js` |
| Confirmación | Diálogo propio en lugar de `confirm()` | `ConfirmDialog.jsx` |

## Otros detalles

- **Scrollbar:** 12px, carril transparente, sin flechas, pulgar píldora `rgba(255,255,255,.22)` (`.34` en hover) con borde transparente de 3px.
- **Botón principal (MUI contained):** fondo `#6B9EFF`, texto `#0E1519`, 15px/600, ícono de Google a la izquierda en el login.
- **Estados de distribución:** Borrador, Listo, Programado, Publicado, Borrado (`auto` ya no existe).
