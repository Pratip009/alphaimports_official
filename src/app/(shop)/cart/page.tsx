import CartClient from './CartClient';
import { getNavCategories } from '@/lib/getNavCategories';

export default async function CartPage() {
  // Display-only: category tree for the classic left sidebar.
  const navCategories = await getNavCategories();
  return <CartClient navCategories={navCategories} />;
}