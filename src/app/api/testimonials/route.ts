import { NextRequest, NextResponse } from "next/server";
import { getTestimonials } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

// GET /api/testimonials?page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = Number(sp.get("page") ?? 1) || 1;
    const limit = Number(sp.get("limit") ?? 20) || 20;
    const result = await getTestimonials(page, limit);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[GET /api/testimonials]", err);
    return NextResponse.json({ success: false, message: "Failed to load testimonials" }, { status: 500 });
  }
}