import { NextResponse } from "next/server";
import { listOrdersForStore } from "@/lib/services/orders";
import { getMyStoreId } from "@/lib/services/storeOwner";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireRole("STORE_OWNER");
    const storeId = await getMyStoreId(session.userId);
    if (!storeId) return NextResponse.json({ orders: [] });
    const orders = await listOrdersForStore(storeId);
    return NextResponse.json({ orders });
  } catch (err) {
    return handleApiError(err);
  }
}
