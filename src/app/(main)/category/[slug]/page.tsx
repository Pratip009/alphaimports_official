import { connectDB } from "@/lib/db";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { listSubcategoriesWithChildFlag } from "@/services/category.service";
import Category from "@/models/Category";
import { notFound } from "next/navigation";
import CategoryClientPage from "./CategoryClientPage";
import { SPECIALS_VIRTUAL_SUBCATEGORIES } from "@/lib/specialsVirtualSubcategories";
import { getNavCategories } from "@/lib/getNavCategories";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) {
    return { title: "Category Not Found", robots: { index: false, follow: true } };
  }

  const name = (category as any).name as string;
  const description =
    // `||` (not `??`) so an empty description also falls back; the stray unary
    // `+` that used to precede this string turned it into NaN.
    (category as any).description ||
    `Browse our ${name} collection at Alphaimports.com — diamonds, gemstones, and fine jewelry.`;
  const canonical = `${SITE_URL}/category/${slug}`;
  const title = `${name} Collection | Alphaimports.com`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Alphaimports.com",
    },
    twitter: {
      images: [DEFAULT_OG_IMAGE.url],
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  await connectDB();
  const { slug } = await params;

  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) notFound();

  const catId = (category as any)._id?.toString();
  const [subsWithFlag, navCategories] = await Promise.all([
    listSubcategoriesWithChildFlag(catId),
    // Display-only: the category tree for the left sidebar (same source the
    // navbar uses).
    getNavCategories(),
  ]);

  const subcategories = subsWithFlag.map((s) => ({
    _id: String((s as any)._id),
    name: s.name,
    slug: s.slug,
    imageUrl: (s as any).imageUrl ?? null,
    description: (s as any).description ?? null,
    hasChildren: (s as any).hasChildren ?? false,
    category: {
      _id: catId,
      name: (category as any).name,
      slug: (category as any).slug,
    },
  }));

  // "Specials" also carries a few virtual subcategories (Make An Offer,
  // $9.99/$24.99/$99.00 Specials) that aren't real Subcategory documents —
  // see specialsVirtualSubcategories.ts for why. Append them so this grid
  // matches what the nav dropdown shows.
  if ((category as any).slug === "specials") {
    for (const v of SPECIALS_VIRTUAL_SUBCATEGORIES) {
      subcategories.push({
        _id: `virtual-${v.slug}`,
        name: v.name,
        slug: v.slug,
        imageUrl: null,
        description: v.description,
        hasChildren: false,
        category: {
          _id: catId,
          name: (category as any).name,
          slug: (category as any).slug,
        },
      });
    }
  }

  const serializedCategory = {
    _id: catId,
    name: (category as any).name,
    slug: (category as any).slug,
    description: (category as any).description ?? null,
  };

  const canonical = `${SITE_URL}/category/${slug}`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: serializedCategory.name,
        item: canonical,
      },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonical}#collection`,
    name: `${serializedCategory.name} Collection`,
    description:
      serializedCategory.description ??
      `Browse the ${serializedCategory.name} collection at Alphaimports.com.`,
    url: canonical,
    ...(subcategories.length > 0 && {
      hasPart: subcategories.map((s) => ({
        "@type": "CollectionPage",
        name: s.name,
        url: s.hasChildren
          ? `${SITE_URL}/category/${slug}/${s.slug}`
          : `${SITE_URL}/products?category=${slug}&subcategory=${s.slug}`,
      })),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <CategoryClientPage
        category={serializedCategory}
        subcategories={subcategories}
        navCategories={navCategories}
      />
    </>
  );
}