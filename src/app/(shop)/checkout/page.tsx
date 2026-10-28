import CheckoutClient from './checkoutClient';
import { getNavCategories } from '@/lib/getNavCategories';

export default async function CheckoutPage() {
  // Display-only: category tree for the classic left sidebar.
  const navCategories = await getNavCategories();
  return <CheckoutClient navCategories={navCategories} />;
}