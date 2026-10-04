'use client';
import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import { useAuth } from '@/components/AuthProvider';
import Wordmark from '@/components/Wordmark';
import styles from './UserMenu.module.css';

// Avatar del topbar y menú de usuario: mismo markup y estilos que el diseño base (ConsoleLayout).
// Del CRM se omiten "Configuración" e "Instalar app", que el hub no tiene.
export default function UserMenu() {
  const { user, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState(null);

  if (!user) return null;

  // La foto de Google a veces solo viene en providerData. Sin referrer porque
  // lh3.googleusercontent.com rechaza el pedido con el referrer de otro sitio.
  const photoURL = user.photoURL || user.providerData?.find((info) => info.photoURL)?.photoURL || undefined;
  const inicial = (user.displayName || user.email || '?')[0].toUpperCase();

  return (
    <>
      <button type="button" className={styles.avatarButton} aria-label="Cuenta" onClick={(e) => setMenuAnchor(e.currentTarget)}>
        <Avatar src={photoURL} slotProps={{ img: { referrerPolicy: 'no-referrer' } }} alt={user.displayName || user.email} className={styles.avatar}>
          {inicial}
        </Avatar>
      </button>
      <Popover
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { className: styles.menuPaper } }}
      >
        <div className={styles.menuCard}>
          <div className={styles.account}>
            <Avatar src={photoURL} slotProps={{ img: { referrerPolicy: 'no-referrer' } }} alt={user.displayName || user.email} className={styles.accountAvatar}>
              {inicial}
            </Avatar>
            <span className={styles.accountName}>{user.displayName || 'Mi cuenta'}</span>
            <span className={styles.accountEmail}>{user.email}</span>
          </div>
          <button type="button" className={styles.menuItem} onClick={() => { setMenuAnchor(null); logout(); }}>
            Cerrar sesión
          </button>
        </div>
        <div className={styles.menuFooter}>
          <Wordmark className={styles.logo} />
        </div>
      </Popover>
    </>
  );
}
