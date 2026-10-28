import { Suspense } from 'react';
import OrdersPage from './OrdersPage';
import { getNavCategories } from '@/lib/getNavCategories';

export default async function Page() {
  // Display-only: category tree for the classic left sidebar.
  const navCategories = await getNavCategories();
  return (
    <Suspense fallback={null}>
      <OrdersPage navCategories={navCategories} />
    </Suspense>
  );
}