'use client';
import { useState } from 'react';
import { hasFirebaseConfig } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import Wordmark from '@/components/Wordmark';
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/brand';
import Button from '@mui/material/Button';
import GoogleIcon from '@mui/icons-material/Google';

const MENSAJES = {
  'auth/operation-not-allowed': 'El acceso con Google no está habilitado en Firebase todavía.',
  'auth/domain-not-allowed': `Usa tu cuenta @${ALLOWED_EMAIL_DOMAIN}.`,
};

// Único método de acceso: Google (restringido al dominio de NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN si se define).
export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    setError(null);
    if (!hasFirebaseConfig) {
      setError('Falta configurar Firebase en .env.local (ver .env.local.example).');
      return;
    }
    setEnviando(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      // Cerrar el popup no es un error que valga la pena mostrar.
      if (err.code !== 'auth/popup-closed-by-user') setError(MENSAJES[err.code] || 'No se pudo iniciar sesión con Google. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,87,255,0.14), transparent)' }}>
      <section className="flex w-full max-w-[340px] flex-col gap-6 rounded-md border border-line bg-panel p-8">
        <h1 className="flex justify-center">
          <Wordmark className="block h-7 w-auto max-w-full" />
        </h1>
        <hr className="border-0 border-t border-line" />
        <Button variant="contained" size="large" fullWidth startIcon={<GoogleIcon />} onClick={entrar} loading={enviando}>
          Iniciar sesión con Google
        </Button>
        {error && <p className="text-center font-mono text-[11px] text-error">{error}</p>}
      </section>
    </main>
  );
}
