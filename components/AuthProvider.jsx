'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, hasFirebaseConfig, ALLOWED_EMAIL_DOMAIN } from '@/lib/firebase';

// Sin dominio configurado entra cualquier cuenta de Google.
const isAllowedEmail = (email) => Boolean(email) && (!ALLOWED_EMAIL_DOMAIN || email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`));

const AuthContext = createContext({ user: null, loading: true, loginWithGoogle: async () => {}, logout: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasFirebaseConfig);

  useEffect(() => {
    if (!hasFirebaseConfig) return undefined;
    return onAuthStateChanged(auth, (u) => {
      // Una sesión con otro dominio se cierra.
      if (u && !isAllowedEmail(u.email)) {
        signOut(auth);
        setUser(null);
      } else {
        setUser(u);
      }
      setLoading(false);
    });
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // "hd" solo filtra el selector de cuentas; la validación real es la de abajo.
    if (ALLOWED_EMAIL_DOMAIN) provider.setCustomParameters({ hd: ALLOWED_EMAIL_DOMAIN });
    const { user: signedIn } = await signInWithPopup(auth, provider);
    if (!isAllowedEmail(signedIn.email)) {
      await signOut(auth);
      const error = new Error('Dominio no permitido');
      error.code = 'auth/domain-not-allowed';
      throw error;
    }
  };
  const logout = () => signOut(auth);

  return <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/**
 * Envuelve la app: sin sesión manda a /login; en /login no muestra el topbar.
 * `nav` llega ya renderizado desde el layout (que es de servidor).
 * Sin config de Firebase no bloquea nada.
 */
export function AppShell({ nav, children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const enLogin = pathname === '/login';
  const bloqueado = hasFirebaseConfig && !user && !enLogin;

  useEffect(() => {
    if (!hasFirebaseConfig || loading) return;
    if (!user && !enLogin) router.replace('/login');
    if (user && enLogin) router.replace('/');
  }, [user, loading, enLogin, router]);

  if (hasFirebaseConfig && (loading || bloqueado)) return null;
  // Login: pantalla propia. Resto: shell a alto de ventana (como el diseño base); el scroll vive dentro del
  // contenedor de cada página y no en la ventana.
  if (enLogin) return children;
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {nav}
      <main className="app-main">{children}</main>
    </div>
  );
}
