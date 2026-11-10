'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// Cookie banner isn't needed for first paint; load it after hydration.
const CookieConsent = dynamic(() => import('@/components/ui/Cookieconsent'), { ssr: false });

export default function CookieConsentLazy() {
  const pathname = usePathname();
  // Staff-only admin console: no visitor-facing consent banner there.
  if (pathname?.startsWith('/admin')) return null;
  return <CookieConsent />;
}
