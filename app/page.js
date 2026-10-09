import { BRAND_NAME } from '@/lib/brand';
import Link from 'next/link';
import data from '@/data/pieces.json';
import { PLATFORMS, DIST_STATUS } from '@/lib/schema';
import { distribuciones, cuandoSale, parseFecha } from '@/lib/dist';
import PlatformIcon from '@/components/PlatformIcon';
import PageHeader from '@/components/PageHeader';

export const metadata = { title: `Inicio · ${BRAND_NAME}` };

// Orden de lectura de las redes: primero donde más se publica.
const REDES = ['instagram', 'facebook', 'linkedin', 'x', 'tiktok', 'youtube', 'blog'];

const CELDA = {
  published: { cls: 'bg-success', title: 'Publicado' },
  scheduled: { cls: 'bg-warning', title: 'Programado' },
  ready: { cls: 'bg-glow', title: 'Listo' },
  draft: { cls: 'bg-white/15', title: 'Borrador' },
  deleted: { cls: 'bg-error/60', title: 'Borrado' },
};

const GRUPOS = [
  { type: 'carousel', label: 'Carruseles' },
  { type: 'post', label: 'Placas' },
  { type: 'article', label: 'Artículos' },
];

function Tile({ n, total, label, color }) {
  return (
    <div className="rounded-md border border-line bg-panel p-4">
      <div className="flex items-baseline gap-1.5">
        <span className={`font-mono text-2xl ${color}`}>{n}</span>
        <span className="font-mono text-[11px] text-sub">/ {total}</span>
      </div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-sub">{label}</div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

export default function Page() {
  const todas = distribuciones(data.pieces);
  const dists = todas.filter((d) => d.estado !== 'deleted'); // lo borrado no cuenta en las cifras
  const total = dists.length;
  const cuenta = (e) => dists.filter((d) => d.estado === e).length;
  const publicadas = cuenta('published');

  // Cobertura por red
  const porRed = REDES.map((r) => {
    const items = dists.filter((d) => d.platform === r);
    const pub = items.filter((d) => d.estado === 'published').length;
    const prog = items.filter((d) => d.estado === 'scheduled').length;
    return { red: r, total: items.length, pub, prog };
  }).filter((r) => r.total);

  // Próximas salidas: lo programado que todavía no ocurrió, en orden.
  const proximas = dists
    .filter((d) => d.estado === 'scheduled' && parseFecha(cuandoSale(d)))
    .map((d) => ({ ...d, cuando: parseFecha(cuandoSale(d)) }))
    .sort((a, b) => a.cuando - b.cuando)
    .slice(0, 8);

  // Matriz pieza × red
  const porPieza = new Map();
  for (const d of todas) {
    if (!porPieza.has(d.pieceId)) porPieza.set(d.pieceId, {});
    porPieza.get(d.pieceId)[d.platform] = d.estado;
  }

  return (
    <>
      <PageHeader title="Inicio">
        <span className="font-mono text-[11px] text-sub">
          {data.pieces.length} piezas · {total} distribuciones · {data.generatedAt}
        </span>
      </PageHeader>

      <div className="p-4">
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile n={publicadas} total={total} label="Publicadas" color="text-success" />
        <Tile n={cuenta('scheduled')} total={total} label="Programadas" color="text-warning" />
        <Tile n={cuenta('ready')} total={total} label="Listas" color="text-glow" />
        <Tile n={cuenta('draft')} total={total} label="Borradores" color="text-sub" />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Cobertura por red */}
        <section className="rounded-md border border-line bg-panel p-4">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-sub">Cobertura por red</h2>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {porRed.map((r) => (
              <div key={r.red} className="flex items-center gap-2.5">
                <span className="shrink-0 text-sub"><PlatformIcon platform={r.red} size={15} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 font-mono text-[10px]">
                    <span className="truncate text-white/80">{PLATFORMS[r.red]?.label || r.red}</span>
                    <span className="shrink-0 text-sub"><span className="text-success">{r.pub}</span>/{r.total}{r.prog ? <span className="text-warning"> · {r.prog}</span> : null}</span>
                  </div>
                  <div className="mt-1 flex h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full bg-success" style={{ width: `${(r.pub / r.total) * 100}%` }} />
                    <div className="h-full bg-warning" style={{ width: `${(r.prog / r.total) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Próximas salidas */}
        <section className="rounded-md border border-line bg-panel p-4">
          <h2 className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-sub">
            <span>Próximas salidas</span>
            <Link href="/calendario" className="text-glow hover:underline">calendario →</Link>
          </h2>
          {proximas.length === 0 && <p className="font-mono text-[11px] text-sub">nada programado</p>}
          <ul className="space-y-1.5">
            {proximas.map((d) => (
              <li key={`${d.pieceId}-${d.platform}-${d.surface}`}>
                <Link href={`/piezas?p=${d.pieceId}`} className="flex items-center gap-2 rounded-md border border-line px-2 py-1.5 transition-colors hover:border-primary/40">
                  <span className="shrink-0 text-sub"><PlatformIcon platform={d.platform} size={13} /></span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[12px] text-white/85">{d.pieceTitle}</span>
                  <span className="shrink-0 font-mono text-[10px] text-warning">
                    {d.cuando.toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Matriz pieza × red */}
      <section className="rounded-md border border-line bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-sub">Pieza por red</h2>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-sub">
            {Object.entries(CELDA).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${v.cls}`} /> {DIST_STATUS[k]?.label || v.title}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-white/10" /> no aplica</span>
          </div>
        </div>

        <div>
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-panel">
              <tr>
                <th className="sticky left-0 z-20 bg-panel px-4 py-2 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-sub">Pieza</th>
                {REDES.map((r) => (
                  <th key={r} title={PLATFORMS[r]?.label || r} className="w-9 bg-panel px-0 py-2">
                    <span className="mx-auto flex w-9 justify-center text-sub"><PlatformIcon platform={r} size={14} /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRUPOS.map((g) => {
                const piezas = data.pieces.filter((p) => p.type === g.type);
                if (!piezas.length) return null;
                return [
                  <tr key={`h-${g.type}`}>
                    <td colSpan={REDES.length + 1} className="border-y border-line bg-panel2 px-4 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-sub">
                      {g.label} <span className="text-sub/60">· {piezas.length}</span>
                    </td>
                  </tr>,
                  ...piezas.map((p) => {
                    const fila = porPieza.get(p.id) || {};
                    return (
                      <tr key={p.id} className="group">
                        <td className="sticky left-0 z-10 max-w-[320px] bg-panel px-4 py-1 group-hover:bg-panel2">
                          <Link href={`/piezas?p=${p.id}`} className="flex items-baseline gap-2 truncate">
                            <span className="font-mono text-[10px] text-sub">{p.id}</span>
                            <span className="truncate font-sans text-[12px] text-white/85 group-hover:text-white">{p.title}</span>
                          </Link>
                        </td>
                        {REDES.map((r) => {
                          const e = fila[r];
                          const c = CELDA[e];
                          return (
                            <td key={r} className="px-0 py-1 group-hover:bg-panel2">
                              <span className="mx-auto block h-3 w-3 rounded-sm border border-transparent"
                                title={c ? `${PLATFORMS[r]?.label}: ${DIST_STATUS[e]?.label || e}` : `${PLATFORMS[r]?.label}: no aplica`}
                                style={c ? undefined : { borderColor: 'rgba(255,255,255,0.08)' }}>
                                {c ? <span className={`block h-3 w-3 rounded-sm ${c.cls}`} /> : null}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }),
                ];
              })}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </>
  );
}
