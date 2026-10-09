// Wordmark del hub (sobre fondos oscuros), armado con BRAND_PRIMARY + BRAND_SECONDARY de lib/brand.js.
// Para usar tu logo real, reemplaza este SVG por tu propio markup o por un <img>.
// SVG inline y no <img>: así usa la Open Sans que carga la página. El tamaño se controla con className.
import { BRAND_NAME, BRAND_PRIMARY, BRAND_SECONDARY } from '@/lib/brand';

export default function Wordmark({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 35 520 93" role="img" aria-label={BRAND_NAME} className={className}>
      <text x="260" y="110" textAnchor="middle" fontFamily="var(--font-sans), 'Open Sans', system-ui, sans-serif">
        <tspan fontSize="100" fontWeight="600" letterSpacing="-2.5" fill="#6B9EFF">{BRAND_PRIMARY}</tspan>
        <tspan fontSize="55" fontWeight="500" letterSpacing="-0.9" fill="#F5F5F3" dx="14">{BRAND_SECONDARY}</tspan>
      </text>
    </svg>
  );
}
