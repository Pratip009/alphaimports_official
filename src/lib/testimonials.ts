import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
// Registers the Product schema so populate("product") works in any bundle.
import "@/models/Product";

export interface Testimonial {
  _id: string;
  name: string;
  subject: string;
  comment: string;
  createdAt: string;
  product: { name: string; slug?: string; _id: string } | null;
}

/** Visible product reviews, newest first, shaped as testimonials. */
export async function getTestimonials(page = 1, limit = 20) {
  await connectDB();
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const filter = { isHidden: { $ne: true }, comment: { $exists: true, $ne: "" } };

  const [docs, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate("product", "name slug")
      .select("userName title comment createdAt product")
      .lean(),
    Review.countDocuments(filter),
  ]);

  const data: Testimonial[] = docs.map((d: any) => ({
    _id: String(d._id),
    name: d.userName || "Customer",
    subject: d.title || "",
    comment: d.comment || "",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : "",
    product: d.product
      ? { _id: String(d.product._id), name: d.product.name, slug: d.product.slug }
      : null,
  }));

  return { data, total, page: safePage, limit: safeLimit, totalPages: Math.max(1, Math.ceil(total / safeLimit)) };
}