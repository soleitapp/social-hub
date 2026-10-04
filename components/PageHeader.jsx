'use client';
import { useState } from 'react';

// Encabezado de página, copia del PageHeader del diseño base: título a la izquierda, filtros opcionales a su
// lado (separados por una línea vertical) y acciones a la derecha. Va debajo del topbar, suelto sobre
// el fondo y separado del contenedor (que es el hijo siguiente; ver .app-main en globals.css).
// En móvil los filtros quedan plegados detrás de un botón "Filtros".
export default function PageHeader({ title, filters, children }) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 px-6 py-3 max-md:flex-wrap max-md:items-start max-md:gap-3">
      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-3 max-md:basis-full max-md:flex-wrap">
        <h1 className="m-0 shrink-0 font-sans text-[18px] font-normal leading-7">{title}</h1>
        {filters && (
          <>
            <span className="h-5 w-px bg-line max-md:hidden" aria-hidden="true" />
            <button
              type="button"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className={`hidden h-8 rounded-md border bg-panel px-3 font-mono text-[11px] max-md:block ${filtersOpen ? 'border-primary/40 text-glow' : 'border-line text-sub'}`}
            >
              Filtros
            </button>
            <div className={`min-w-0 flex-1 flex-nowrap items-center gap-2 max-md:flex-wrap max-md:basis-full ${filtersOpen ? 'flex' : 'flex max-md:hidden'}`}>
              {filters}
            </div>
          </>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2 max-md:flex-wrap">{children}</div>}
    </header>
  );
}
