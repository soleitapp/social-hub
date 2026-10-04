import { BRAND_NAME } from '@/lib/brand';
import data from '@/data/pieces.json';
import Calendario from '@/components/Calendario';

export const metadata = { title: `Calendario · ${BRAND_NAME}` };

export default function Page() {
  return <Calendario pieces={data.pieces} />;
}
