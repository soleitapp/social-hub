'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Inicio' },
  { href: '/calendario', label: 'Calendario' },
  { href: '/piezas', label: 'Piezas' },
];

// Enlaces del topbar. El activo va en el acento del hub (igual que el diseño base): "/" solo en la
// portada, el resto también en sus subrutas.
export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-6 font-mono text-[11px] uppercase tracking-[0.18em]">
      {ITEMS.map((item) => {
        const activo = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`whitespace-nowrap transition-colors ${activo ? 'text-glow' : 'text-sub hover:text-white'}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
