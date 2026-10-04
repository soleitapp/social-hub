import { BRAND_NAME } from '@/lib/brand';
import { Suspense } from 'react';
import data from '@/data/pieces.json';
import PiezasBrowser from '@/components/PiezasBrowser';

export const metadata = { title: `Piezas · ${BRAND_NAME}` };

export default function Page() {
  return (
    <Suspense>
      <PiezasBrowser pieces={data.pieces} generatedAt={data.generatedAt} />
    </Suspense>
  );
}
