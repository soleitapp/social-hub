/* Lógica de estado y fechas de una distribución, compartida por el hub (portada, piezas,
   calendario). Vive acá para que las tres vistas no se contradigan. */

const MESES = { ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5, JUL: 6, AGO: 7, SEP: 8, SET: 8, OCT: 9, NOV: 10, DIC: 11 };

// Conviven dos formatos: ISO ('2026-08-01T16:45') y el humano del manifiesto ('23 JUN 2026').
export function parseFecha(v) {
  if (!v) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  m = s.match(/^(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3,})\.?\s+(\d{4})$/);
  if (m) {
    const mo = MESES[m[2].toUpperCase().slice(0, 3)];
    if (mo != null) return new Date(+m[3], mo, +m[1]);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// El manifiesto registra el día ("23 JUN 2026") y el hub registra el momento exacto
// ("2026-08-03T15:37"): saber si hay hora evita inventar un "00:00" que nadie midió.
export const conHora = (v) => /\d{1,2}:\d{2}/.test(String(v || ''));

// Cualquiera de los dos formatos → ISO ('YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm'), que es como
// se guarda en el modelo.
export function aISO(v) {
  const d = parseFecha(v);
  if (!d) return '';
  const p = (n) => String(n).padStart(2, '0');
  const dia = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return conHora(v) ? `${dia}T${p(d.getHours())}:${p(d.getMinutes())}` : dia;
}

// Fecha para mostrar: siempre "03 ago", con hora solo si la hay y con año solo si no es este.
export function fmtFecha(v) {
  const d = parseFecha(v);
  if (!d) return String(v || '');
  const año = d.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' };
  const dia = { day: '2-digit', month: 'short', ...año };
  return conHora(v)
    ? d.toLocaleString('es', { ...dia, hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es', dia);
}

// Cuándo sale/salió: los artículos programados desde el dispatch de X traen la fecha en `date`.
export const cuandoSale = (d) => d.scheduledAt || (d.status === 'scheduled' ? d.date : null) || null;

// Programada cuya hora ya pasó: salió, la haya marcado alguien o no. El permalink puede faltar
// (X no lo devuelve al programar), así que no es la prueba de que se publicó.
export function yaSalio(d) {
  const f = parseFecha(cuandoSale(d));
  return d.status === 'scheduled' && !!f && f.getTime() <= Date.now();
}

export const estadoDe = (d) => (yaSalio(d) ? 'published' : d.status);

// Fecha con la que la distribución entra al calendario. Si ya salió manda `date` (cuándo se
// publicó de verdad); `scheduledAt` es la intención y solo vale mientras esté pendiente.
export const fechaCalendario = (d) => parseFecha(estadoDe(d) === 'published' && d.date ? d.date : (d.scheduledAt || d.date));

export const claveDia = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

// Aplana el modelo a filas planas de distribución, que es lo que consumen las vistas.
export function distribuciones(pieces) {
  return pieces.flatMap((p) => p.distributions.map((d) => ({
    ...d,
    pieceId: p.id,
    pieceTitle: p.title,
    pieceType: p.type,
    estado: estadoDe(d),
    fecha: fechaCalendario(d),
  })));
}
