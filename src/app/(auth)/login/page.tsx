import { Suspense } from 'react';
import LoginPage from './LoginPage';
import { isGoogleAuthConfigured } from '@/lib/google-oauth';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { getNavCategories } from '@/lib/getNavCategories';

// Read env at request time so enabling Google doesn't require a rebuild.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Display-only: the classic layout shows the site header, footer and the
  // category sidebar around the login form.
  const navCategories = await getNavCategories();

  return (
    <>
      <Navbar initialCategories={navCategories} />
      <main>
        <Suspense fallback={null}>
          <LoginPage googleEnabled={isGoogleAuthConfigured()} navCategories={navCategories} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}