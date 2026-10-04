// Marca del hub en un solo lugar. Cámbiala aquí (o con variables NEXT_PUBLIC_* en .env.local) y se actualiza
// en el topbar, el login, los títulos de pestaña, las portadas generadas y las láminas de vista previa.
// Colores: tailwind.config.js (tokens) y app/globals.css. Ver docs/adaptacion.md.

export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'Social Hub';

// El wordmark se parte en dos para poder darle acento a la primera parte: "Social" + "Hub".
export const BRAND_PRIMARY = process.env.NEXT_PUBLIC_BRAND_PRIMARY || 'Social';
export const BRAND_SECONDARY = process.env.NEXT_PUBLIC_BRAND_SECONDARY || 'Hub';

// Texto de la firma en portadas e historias (normalmente tu dominio).
export const BRAND_SIGNATURE = process.env.NEXT_PUBLIC_BRAND_SIGNATURE || 'tu-dominio.com';

// Dominio de correo que puede entrar (Google Workspace). Vacío = cualquier cuenta de Google.
export const ALLOWED_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || '';

export const SITE_TITLE = `${BRAND_NAME} · Hub de marketing`;
export const SITE_DESCRIPTION = `Qué está publicado y dónde — contenido de ${BRAND_NAME} por canal.`;
