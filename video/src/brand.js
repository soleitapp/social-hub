// Textos de marca del wordmark y de la firma de los shorts (cámbialos por los tuyos).
export const BRAND = { primary: 'Social', secondary: 'Hub', url: 'tu-dominio.com' };

// ADN de marca para los shorts (espejo de src/theme + TipCover).
export const COLORS = {
  bg: '#0a0b0d',
  paper: '#ffffff',
  white: '#ffffff',
  ink: '#1f2422',
  teal: '#1abf9f',     // glow — acento sobre oscuro
  tealBase: '#009f8b', // acento / fondo sólido
  tealDark: '#00866f',
  tealLightest: '#ecf8f4',
  sub: '#8b9691',
  subInk: '#6b716e',
};

// Variantes como TipCover, en el mismo orden que el carrusel de Instagram:
//   ink (oscuro) · mint (teal claro) · paper (blanco) · teal (teal sólido).
export const VARIANTS = {
  ink:   { bg: COLORS.bg,           text: COLORS.white, accent: COLORS.teal,     eyebrow: COLORS.teal,     sub: COLORS.sub,               radar: COLORS.teal,     radarOp: 0.6  },
  mint:  { bg: COLORS.tealLightest, text: COLORS.ink,   accent: COLORS.tealBase, eyebrow: COLORS.tealDark, sub: COLORS.subInk,            radar: COLORS.tealBase, radarOp: 0.30 },
  paper: { bg: COLORS.paper,        text: COLORS.ink,   accent: COLORS.tealBase, eyebrow: COLORS.tealDark, sub: COLORS.subInk,            radar: COLORS.tealBase, radarOp: 0.16 },
  teal:  { bg: COLORS.tealBase,     text: COLORS.white, accent: COLORS.white,    eyebrow: 'rgba(255,255,255,0.9)', sub: 'rgba(255,255,255,0.75)', radar: COLORS.white, radarOp: 0.22 },
};
