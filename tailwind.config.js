/** @type {import('tailwindcss').Config} */
// Tokens de color del hub. Cámbialos por los de tu marca (ver docs/adaptacion.md).
// El azul de Soleit es el ÚNICO color de marca (#0057FF; #6B9EFF sobre oscuro, Petroleum700 edición Soleit); cobalt/orange = datos/énfasis; status para feedback.
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { lightest: '#F2F5FF', light: '#E8EEFF', DEFAULT: '#6B9EFF', base: '#6B9EFF', dark: '#0057FF', darkest: '#0057FF' },
        secondary: { lightest: '#a8c5f1', light: '#85abe7', DEFAULT: '#0b57d0', base: '#0b57d0', dark: '#0842a1', darkest: '#062e73' },
        tertiary: { lightest: '#ffcc66', light: '#ff9900', DEFAULT: '#ff7700', base: '#ff7700', dark: '#ff5500', darkest: '#ff3300' },
        success: { lightest: '#edf7ed', DEFAULT: '#81C784', dark: '#146c2e' },
        error: { lightest: '#fdeded', DEFAULT: '#d32f2f' },
        warning: { lightest: '#fff4e5', DEFAULT: '#f6b93b', dark: '#c9952d' },
        info: { lightest: '#e5f6fd', DEFAULT: '#0ea5e9' },
        gray: { 50: '#fafafa', 100: '#f8f9fa', 200: '#e9ecef', 300: '#dee2e6', 400: '#ced4da', 500: '#adb5bd', 600: '#6c757d', 700: '#495057', 800: '#1e1f20', 900: '#131314', 950: '#0a0a0a' },
        web: { 1: '#f8f4f0', 2: '#efebe8', 3: '#817f7d', 4: '#241f23', 5: '#1f1a1e', 6: '#2b2b2c', 7: '#131314', 8: '#E8EEFF', 9: '#0057FF' },
        ink: { DEFAULT: '#0a0b0d', 2: '#2a2d31', 3: '#5b6066', 4: '#8b9097' },
        rule: '#e8e8e6',
        // --- alias de UI del hub (superficies oscuras del shell) ---
        bg: '#0E1519',
        panel: '#172127',
        panel2: '#202D35',
        line: '#2C3B45',
        sub: '#8A99A3',
        teal: '#6B9EFF',
        tealdark: '#5790FF',
        mint: '#E8EEFF',
        // teal on-dark: acento teal brillante para fondos oscuros. Formalizado (opción B) —
        // sumar como --primary-onDark al SCSS del Manual v1.2 por gobernanza.
        glow: '#6B9EFF',
      },
      backgroundImage: {
        premium: 'linear-gradient(135deg, #f7e1b2 0%, #e1b76f 100%)',
        special: 'linear-gradient(to right, #6B9EFF 11.87%, #0057FF 89.96%)',
      },
      fontFamily: {
        // Manual: Open Sans (display/body) + Google Sans Code (mono/datos).
        sans: ['var(--font-sans)', 'Open Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Google Sans Code', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      letterSpacing: { tightish: '-0.025em' }, // títulos: weight 400 + tracking negativo (no bold)
    },
  },
  plugins: [],
};
