import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/services/catalogue";
import { setAllProductsAvailability, getMyStoreId } from "@/lib/services/storeOwner";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-errors";
import { ForbiddenError } from "@/lib/session";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requireRole("STORE_OWNER");
    const storeId = await getMyStoreId(session.userId);
    if (!storeId) return NextResponse.json({ products: [] });
    const products = await listProducts({ storeId });
    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}

const bulkAvailabilitySchema = z.object({ isAvailable: z.boolean() });

// PATCH /api/store/products  body: { isAvailable } — sets every one of this
// store's products to the same availability at once (the "category master
// toggle" in the store dashboard).
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole("STORE_OWNER");
    const storeId = await getMyStoreId(session.userId);
    if (!storeId) throw new ForbiddenError("No store is linked to this account.");
    const body = await req.json();
    const parsed = bulkAvailabilitySchema.safeParse(body);
    if (!parsed.success) throw new ForbiddenError("isAvailable (boolean) is required.");
    const products = await setAllProductsAvailability(storeId, parsed.data.isAvailable);
    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}
