import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/services/catalogue";
import { handleApiError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId") ?? undefined;
    const featuredParam = searchParams.get("featured");
    const cityId = searchParams.get("cityId") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const products = await listProducts({
      storeId,
      featured: featuredParam !== null ? featuredParam === "true" : undefined,
      cityId,
      category,
    });
    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}
