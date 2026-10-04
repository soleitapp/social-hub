'use client';
import Drawer from '@mui/material/Drawer';
import CloseIcon from '@mui/icons-material/Close';
import styles from './SidePanel.module.css';

// Panel lateral al estilo del hub (copia del SidePanel del diseño base): header con título, subtítulo mono y
// botón de cierre con borde, una línea divisoria de borde a borde y el cuerpo con scroll propio.
export default function SidePanel({ open, onClose, title, subtitle, actions, children }) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { className: styles.paper } }}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        <div className={styles.actions}>
          {actions}
          <button type="button" className={styles.close} aria-label="Cerrar" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </Drawer>
  );
}
