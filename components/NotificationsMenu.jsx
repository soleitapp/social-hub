'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SidePanel from '@/components/SidePanel';
import { PLATFORMS, SURFACES } from '@/lib/schema';
import { distribuciones, estadoDe, cuandoSale, parseFecha, claveDia } from '@/lib/dist';
import topbarStyles from './TopbarMenu.module.css';
import styles from './NotificationsMenu.module.css';

const PER_SECTION = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

const hora = (f) => f.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
const diaHora = (f) => f.toLocaleString('es', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// Alertas calculadas en el cliente a partir de lo que ya existe (no hay una colección de notificaciones):
// lo que sale hoy, lo programado para los próximos 7 días y las publicadas que quedaron sin permalink.
// El número de la campana es el total. Se muestran en un panel lateral y todas las secciones aparecen
// siempre, con un texto propio cuando no hay nada.
export default function NotificationsMenu() {
  const router = useRouter();
  const [pieces, setPieces] = useState([]);
  const [open, setOpen] = useState(false);

  // Las piezas se cargan aparte para no meter el JSON completo en el bundle de cada pantalla.
  useEffect(() => {
    let vivo = true;
    import('@/data/pieces.json').then((m) => { if (vivo) setPieces((m.default || m).pieces || []); });
    return () => { vivo = false; };
  }, []);

  const sections = useMemo(() => {
    const dists = distribuciones(pieces);
    const hoy = new Date();
    const hoyKey = claveDia(hoy);
    const limite = new Date(hoy.getTime() + 7 * DAY_MS);
    const detalle = (d) => `${PLATFORMS[d.platform]?.label || d.platform} · ${SURFACES[d.surface] || d.surface}`;

    // Programadas que todavía no salieron (las que ya pasaron cuentan como publicadas).
    const programadas = dists
      .filter((d) => d.estado === 'scheduled')
      .map((d) => ({ d, cuando: parseFecha(cuandoSale(d)) }))
      .filter((x) => x.cuando)
      .sort((a, b) => a.cuando - b.cuando);

    const item = (d, meta, alert) => ({ id: `${d.pieceId}-${d.platform}-${d.surface}`, label: d.pieceTitle, detail: detalle(d), meta, alert, href: `/piezas?p=${d.pieceId}` });

    return [
      {
        key: 'today',
        title: 'Salen hoy',
        empty: 'No hay nada programado para hoy.',
        allLabel: 'Ver el calendario',
        allHref: '/calendario',
        items: programadas.filter((x) => claveDia(x.cuando) === hoyKey).map((x) => item(x.d, hora(x.cuando))),
      },
      {
        key: 'week',
        title: 'Próximos 7 días',
        empty: 'No hay salidas programadas esta semana.',
        allLabel: 'Ver el calendario',
        allHref: '/calendario',
        items: programadas.filter((x) => claveDia(x.cuando) > hoyKey && x.cuando <= limite).map((x) => item(x.d, diaHora(x.cuando))),
      },
      {
        key: 'missing',
        title: 'Datos faltantes',
        empty: 'Todas las publicadas tienen su URL.',
        allLabel: 'Ver las piezas',
        allHref: '/piezas',
        items: dists.filter((d) => estadoDe(d) === 'published' && !d.url).map((d) => item(d, 'Sin URL', true)),
      },
    ];
  }, [pieces]);

  const total = sections.reduce((sum, s) => sum + s.items.length, 0);

  const go = (href) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        className={topbarStyles.button}
        title="Notificaciones"
        aria-label={`Notificaciones${total ? `: ${total}` : ''}`}
        onClick={() => setOpen(true)}
      >
        <NotificationsNoneIcon className={topbarStyles.icon} />
        {total > 0 && <span className={topbarStyles.badge}>{total > 99 ? '99+' : total}</span>}
      </button>
      <SidePanel open={open} onClose={() => setOpen(false)} title="Notificaciones" subtitle={total === 0 ? 'Todo al día' : `${total} ${total === 1 ? 'pendiente' : 'pendientes'}`}>
        {sections.map((section) => (
          <section key={section.key} className={styles.section}>
            <h3 className={styles.heading}>
              {section.title}
              {section.items.length > 0 && <span className={styles.count}>{section.items.length}</span>}
            </h3>
            {section.items.length === 0 ? (
              <p className={styles.empty}>{section.empty}</p>
            ) : (
              <>
                {section.items.slice(0, PER_SECTION).map((it) => (
                  <button key={it.id} type="button" className={styles.item} onClick={() => go(it.href)}>
                    <span className={styles.text}>
                      <span className={styles.label}>{it.label}</span>
                      {it.detail && <small className={styles.detail}>{it.detail}</small>}
                    </span>
                    <span className={`${styles.meta} ${it.alert ? styles.alert : ''}`}>{it.meta}</span>
                    <ChevronRightIcon className={styles.chevron} />
                  </button>
                ))}
                {section.items.length > PER_SECTION && (
                  <button type="button" className={styles.more} onClick={() => go(section.allHref)}>
                    {section.allLabel} ({section.items.length})
                    <ChevronRightIcon className={styles.chevron} />
                  </button>
                )}
              </>
            )}
          </section>
        ))}
      </SidePanel>
    </>
  );
}
