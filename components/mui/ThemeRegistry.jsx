'use client';
import * as React from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Tema MUI idéntico al del diseño base (tema oscuro del Manual de Marca). Se usa solo donde se quiere
// el mismo componente que el CRM (hoy, el login); el resto del hub sigue en Tailwind.
const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    primary: { main: '#009f8b', light: '#1abf9f', dark: '#007a6c' },
    secondary: { main: '#0b57d0' },
    error: { main: '#d32f2f' },
    warning: { main: '#f6b93b' },
    success: { main: '#4caf50' },
    background: { default: '#0a0b0d', paper: '#111316' },
    text: { primary: '#eef1f0', secondary: '#8b9097' },
    divider: '#232733',
  },
  shape: { borderRadius: 6 },
  components: {
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiFormControl: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiSwitch: { defaultProps: { size: 'small' } },
  },
  typography: {
    fontFamily: "var(--font-sans), 'Open Sans', system-ui, sans-serif",
    button: { textTransform: 'none', fontWeight: 600 },
  },
});

// Registro SSR de Emotion para App Router (igual al del CRM): sin esto los estilos de MUI no
// coinciden con lo que mandó el servidor y se rompe la hidratación.
function EmotionCacheProvider({ options, children }) {
  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache(options);
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) inserted.push(serialized.name);
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = '';
    for (const name of names) styles += cache.inserted[name];
    return <style key={cache.key} data-emotion={`${cache.key} ${names.join(' ')}`} dangerouslySetInnerHTML={{ __html: styles }} />;
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

export default function ThemeRegistry({ children }) {
  return (
    <EmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </EmotionCacheProvider>
  );
}
