'use client';
import { useState } from 'react';
import Popover from '@mui/material/Popover';
import AddIcon from '@mui/icons-material/Add';
import styles from './TopbarMenu.module.css';

// Botón "Crear" del topbar (copia del QuickCreate del diseño base). El hub todavía no tiene flujos de
// creación —las piezas vienen de Drive—, así que el menú queda como placeholder. Cuando existan,
// se agregan en ITEMS como { label, href } y la opción navega a esa ruta.
const ITEMS = [];

export default function QuickCreate() {
  const [anchor, setAnchor] = useState(null);

  return (
    <>
      <button type="button" className={styles.button} title="Crear" aria-label="Crear" onClick={(e) => setAnchor(e.currentTarget)}>
        <AddIcon className={styles.icon} />
      </button>
      <Popover
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { className: styles.paper } }}
      >
        <div className={styles.heading}>Crear</div>
        {ITEMS.length === 0 && <p className={styles.empty}>Próximamente.</p>}
        {ITEMS.map((item) => (
          <a key={item.href} href={item.href} className={styles.item} onClick={() => setAnchor(null)}>
            {item.label}
          </a>
        ))}
      </Popover>
    </>
  );
}
