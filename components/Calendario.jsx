'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PLATFORMS, SURFACES, DIST_STATUS } from '@/lib/schema';
import { distribuciones, claveDia } from '@/lib/dist';
import PlatformIcon from '@/components/PlatformIcon';
import PageHeader from '@/components/PageHeader';

const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const TONO = {
  published: 'border-primary/40 bg-primary/10 text-glow',
  deleted: 'border-error/30 bg-error/10 text-error/80',
  scheduled: 'border-warning/40 bg-warning/10 text-warning',
  ready: 'border-secondary/40 bg-secondary/10 text-secondary',
  draft: 'border-line bg-white/5 text-sub',
};

const MESES = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString('es', { month: 'short' }).replace('.', ''));

// El calendario solo navega dentro de este rango de años.
const AÑO_MIN = 2026;
const AÑO_MAX = 2027;
// Publicaciones visibles por día; el resto se resume en "+N más".
const MAX_POR_DIA = 5;

const mismoDia = (a, b) => a && b && claveDia(a) === claveDia(b);

export default function Calendario({ pieces }) {
  const hoy = new Date();
  const [mes, setMes] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [red, setRed] = useState('all');

  // Selector de mes: un desplegable con el año y los 12 meses.
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [añoPicker, setAñoPicker] = useState(mes.getFullYear());
  const pickerRef = useRef(null);
  useEffect(() => {
    if (!pickerAbierto) return undefined;
    const fuera = (e) => { if (!pickerRef.current?.contains(e.target)) setPickerAbierto(false); };
    const esc = (e) => { if (e.key === 'Escape') setPickerAbierto(false); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc); };
  }, [pickerAbierto]);

  const items = useMemo(() => {
    const all = distribuciones(pieces).filter((d) => d.fecha);
    return red === 'all' ? all : all.filter((d) => d.platform === red);
  }, [pieces, red]);

  // Índice por día, ordenado por hora dentro de cada uno.
  const porDia = useMemo(() => {
    const m = new Map();
    for (const d of items) {
      const k = claveDia(d.fecha);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(d);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.fecha - b.fecha);
    return m;
  }, [items]);

  // Rejilla de lunes a domingo que cubre el mes entero.
  const celdas = useMemo(() => {
    const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const desplazamiento = (primero.getDay() + 6) % 7; // 0 = lunes
    const inicio = new Date(primero);
    inicio.setDate(1 - desplazamiento);
    const out = [];
    for (let i = 0; i < 42; i++) {
      const f = new Date(inicio);
      f.setDate(inicio.getDate() + i);
      out.push(f);
    }
    // La sexta fila solo si el mes la necesita.
    return out.slice(0, out[35].getMonth() === mes.getMonth() ? 42 : 35);
  }, [mes]);

  const redes = useMemo(() => {
    const s = new Set(distribuciones(pieces).filter((d) => d.fecha).map((d) => d.platform));
    return [...s];
  }, [pieces]);

  const delMes = items.filter((d) => d.fecha.getMonth() === mes.getMonth() && d.fecha.getFullYear() === mes.getFullYear());
  const mover = (n) => {
    const f = new Date(mes.getFullYear(), mes.getMonth() + n, 1);
    if (f.getFullYear() >= AÑO_MIN && f.getFullYear() <= AÑO_MAX) setMes(f);
  };
  const enMin = mes.getFullYear() <= AÑO_MIN && mes.getMonth() === 0;
  const enMax = mes.getFullYear() >= AÑO_MAX && mes.getMonth() === 11;

  return (
    <>
      <PageHeader
        title="Calendario"
        filters={
          <>
        <button onClick={() => setMes(new Date(hoy.getFullYear(), hoy.getMonth(), 1))} className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-sub transition-colors hover:text-white">Hoy</button>
        <button onClick={() => mover(-1)} disabled={enMin} aria-label="Mes anterior" className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-sub transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-sub">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button onClick={() => mover(1)} disabled={enMax} aria-label="Mes siguiente" className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-sub transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-sub">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        <div ref={pickerRef} className="relative">
          <button
            onClick={() => { setAñoPicker(mes.getFullYear()); setPickerAbierto((v) => !v); }}
            aria-haspopup="true" aria-expanded={pickerAbierto} title="Elegir mes"
            className="flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 font-mono text-[12px] uppercase tracking-[0.14em] text-white/90 transition-colors hover:border-line"
          >
            {mes.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={`text-sub transition-transform ${pickerAbierto ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {pickerAbierto && (
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-line bg-panel p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <button onClick={() => setAñoPicker((y) => y - 1)} disabled={añoPicker <= AÑO_MIN} aria-label="Año anterior" className="flex h-6 w-6 items-center justify-center rounded border border-line text-sub hover:text-white disabled:opacity-30 disabled:hover:text-sub">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <span className="font-mono text-[12px] text-white/90">{añoPicker}</span>
                <button onClick={() => setAñoPicker((y) => y + 1)} disabled={añoPicker >= AÑO_MAX} aria-label="Año siguiente" className="flex h-6 w-6 items-center justify-center rounded border border-line text-sub hover:text-white disabled:opacity-30 disabled:hover:text-sub">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {MESES.map((m, i) => {
                  const activo = i === mes.getMonth() && añoPicker === mes.getFullYear();
                  const esHoyMes = i === hoy.getMonth() && añoPicker === hoy.getFullYear();
                  return (
                    <button key={m} onClick={() => { setMes(new Date(añoPicker, i, 1)); setPickerAbierto(false); }}
                      className={`rounded-md border px-2 py-1.5 font-mono text-[11px] uppercase transition-colors ${activo ? 'border-primary/50 bg-primary/15 text-glow' : esHoyMes ? 'border-line text-glow hover:bg-white/[0.04]' : 'border-transparent text-sub hover:bg-white/[0.04] hover:text-white'}`}>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <span className="font-mono text-[11px] text-sub">{delMes.length} en el mes</span>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-1">
          <button onClick={() => setRed('all')} className={`rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors ${red === 'all' ? 'border-primary/50 bg-primary/15 text-glow' : 'border-line text-sub hover:text-white'}`}>Todas</button>
          {redes.map((r) => (
            <button key={r} onClick={() => setRed(r)} title={PLATFORMS[r]?.label || r}
              className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${red === r ? 'border-primary/50 bg-primary/15 text-glow' : 'border-line text-sub hover:text-white'}`}>
              <PlatformIcon platform={r} size={13} />
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="flex flex-col">
        <div className="sticky top-0 z-10 grid h-8 shrink-0 grid-cols-7 items-center border-b border-line bg-panel">
          {DIAS.map((d) => (
            <div key={d} className="px-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-sub">{d}</div>
          ))}
        </div>
        <div className="grid shrink-0 grid-cols-7">
          {celdas.map((f, i) => {
            const delMesActual = f.getMonth() === mes.getMonth();
            const esHoy = mismoDia(f, hoy);
            const dia = porDia.get(claveDia(f)) || [];
            return (
              <div key={i} className={`aspect-square overflow-hidden border-b border-r border-line p-1.5 last:border-r-0 ${delMesActual ? '' : 'bg-black/20'}`}>
                <div className={`mb-1 text-right font-mono text-[10px] ${esHoy ? 'text-glow' : delMesActual ? 'text-sub' : 'text-sub/40'}`}>
                  {esHoy ? <span className="rounded-full bg-primary/20 px-1.5 py-0.5">{f.getDate()}</span> : f.getDate()}
                </div>
                <div className="space-y-1">
                  {dia.slice(0, MAX_POR_DIA).map((d) => (
                    <Link
                      key={`${d.pieceId}-${d.platform}-${d.surface}`}
                      href={`/piezas?p=${d.pieceId}`}
                      title={`${d.pieceTitle} · ${PLATFORMS[d.platform]?.label} ${SURFACES[d.surface] || ''} · ${DIST_STATUS[d.estado]?.label || d.estado}`}
                      className={`flex items-center gap-1 truncate rounded border px-1 py-0.5 font-mono text-[9px] transition-opacity hover:opacity-80 ${TONO[d.estado] || TONO.draft}`}
                    >
                      <span className="shrink-0"><PlatformIcon platform={d.platform} size={9} /></span>
                      <span className="truncate">{d.pieceId} {d.pieceTitle}</span>
                    </Link>
                  ))}
                  {dia.length > MAX_POR_DIA && <div className="px-1 font-mono text-[9px] text-sub">+{dia.length - MAX_POR_DIA} más</div>}
                </div>
              </div>
            );
          })}
        </div>

      <div className="sticky bottom-0 z-10 mt-auto flex h-8 shrink-0 items-center gap-4 overflow-hidden whitespace-nowrap border-t border-line bg-panel px-4 font-mono text-[10px] text-sub">
        <span>Leyenda:</span>
        {['published', 'scheduled', 'deleted'].map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm border ${TONO[k]}`} /> {DIST_STATUS[k]?.label}
          </span>
        ))}
        <span className="ml-auto">Solo entran las distribuciones con fecha: programadas y publicadas.</span>
      </div>
      </div>
    </>
  );
}
