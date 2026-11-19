import { Suspense } from 'react';
import SetPasswordPage from './SetPasswordPage';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { getNavCategories } from '@/lib/getNavCategories';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const navCategories = await getNavCategories();
  return (
    <>
      <Navbar initialCategories={navCategories} />
      <main>
        <Suspense fallback={null}>
          <SetPasswordPage />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
