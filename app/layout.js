import './globals.css';
import { Open_Sans } from 'next/font/google';
import Nav from '@/components/Nav';
import { AuthProvider, AppShell } from '@/components/AuthProvider';
import ThemeRegistry from '@/components/mui/ThemeRegistry';
import { SITE_TITLE, SITE_DESCRIPTION } from '@/lib/brand';

// Manual de marca: Open Sans (display/body). Mono (Google Sans Code) via fallback stack.
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-sans', display: 'swap' });

export const metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={openSans.variable}>
      <body className="min-h-screen font-sans antialiased">
        <ThemeRegistry>
          <AuthProvider>
            <AppShell nav={<Nav />}>{children}</AppShell>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
