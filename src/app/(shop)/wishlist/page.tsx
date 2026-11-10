import WishlistClient from './WishlistClient';
import { getNavCategories } from '@/lib/getNavCategories';

export default async function WishlistPage() {
  // Display-only: category tree for the classic left sidebar.
  const navCategories = await getNavCategories();
  return <WishlistClient navCategories={navCategories} />;
}