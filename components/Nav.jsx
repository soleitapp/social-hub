import Link from 'next/link';
import NavLinks from '@/components/NavLinks';
import GlobalSearch from '@/components/GlobalSearch';
import QuickCreate from '@/components/QuickCreate';
import NotificationsMenu from '@/components/NotificationsMenu';
import UserMenu from '@/components/UserMenu';
import { BRAND_PRIMARY, BRAND_SECONDARY } from '@/lib/brand';

export default function Nav() {
  return (
    <header className="shrink-0 border-b border-line">
      <div className="flex h-14 w-full items-center justify-between px-6">
        <Link href="/" className="font-sans text-lg">
          <span className="font-bold text-teal">{BRAND_PRIMARY}</span>{' '}
          <span className="uppercase text-sub">{BRAND_SECONDARY}</span>
        </Link>
        <div className="flex items-center gap-6">
          <NavLinks />
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <span className="hidden md:block"><QuickCreate /></span>
            <NotificationsMenu />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
