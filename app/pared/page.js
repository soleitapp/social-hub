import { BRAND_NAME } from '@/lib/brand';
// TEMPORAL — página personal para simular una pared de cuadros antes de imprimir las fotos.
import WallSimulator from '@/components/WallSimulator';

export const metadata = { title: `Pared (temporal) · ${BRAND_NAME}` };

export default function Page() {
  return <WallSimulator />;
}
