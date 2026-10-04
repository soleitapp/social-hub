'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dialog from '@mui/material/Dialog';
import SearchIcon from '@mui/icons-material/Search';
import styles from './GlobalSearch.module.css';

const PER_GROUP = 5;

const TYPE_LABELS = { carousel: 'Carrusel', post: 'Placa', article: 'Artículo' };

// Minúsculas y sin tildes, para que "camara" encuentre "Cámara".
const normalizeText = (text) => (text || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

// Las piezas se cargan solo mientras el diálogo está abierto (este componente se monta únicamente
// entonces), para no meter el JSON completo en el bundle de cada pantalla.
function SearchDialog({ onClose }) {
  const router = useRouter();
  const [pieces, setPieces] = useState([]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    let vivo = true;
    import('@/data/pieces.json').then((m) => { if (vivo) setPieces((m.default || m).pieces || []); });
    return () => { vivo = false; };
  }, []);

  const results = useMemo(() => {
    const term = normalizeText(query.trim());
    if (!term) return [];
    const has = (...fields) => normalizeText(fields.filter(Boolean).join(' ')).includes(term);
    const groups = Object.keys(TYPE_LABELS).map((type) => pieces
      .filter((p) => p.type === type && has(p.id, p.title, p.subtitle))
      .map((p) => ({ type, id: p.id, title: p.title, subtitle: p.id, href: `/piezas?p=${p.id}` })));
    return groups.flatMap((group) => group.slice(0, PER_GROUP));
  }, [query, pieces]);

  useEffect(() => setActive(0), [query]);

  const go = (result) => {
    onClose();
    router.push(result.href);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { className: styles.paper }, container: { className: styles.container } }}>
      <div className={styles.field}>
        <SearchIcon className={styles.icon} />
        <input
          autoFocus
          className={styles.input}
          placeholder="Buscar carruseles, placas o artículos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <ul className={styles.list}>
        {!query.trim() && <li className={styles.hint}>Escribe para buscar. Usa las flechas y Enter para abrir un resultado.</li>}
        {query.trim() && results.length === 0 && <li className={styles.hint}>Sin resultados para "{query}".</li>}
        {results.map((result, index) => (
          <li key={`${result.type}-${result.id}`}>
            <button
              type="button"
              className={`${styles.result} ${index === active ? styles.active : ''}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => go(result)}
            >
              <span className={styles.title}>{result.title}</span>
              {result.subtitle && <span className={styles.subtitle}>{result.subtitle}</span>}
              <span className={styles.type}>{TYPE_LABELS[result.type]}</span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

// Botón del topbar + atajos de teclado: Ctrl/Cmd+K o "/" fuera de un campo.
export default function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((value) => !value);
      } else if (e.key === '/' && !typing && !document.activeElement?.isContentEditable) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)} aria-label="Buscar">
        <SearchIcon className={styles.triggerIcon} />
        <span>Buscar…</span>
        <kbd>Ctrl K</kbd>
      </button>
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}
