import { NextResponse } from "next/server";
import { getOrder } from "@/lib/services/orders";
import { getMyStoreId } from "@/lib/services/storeOwner";
import { requireRole } from "@/lib/session";
import { handleApiError, NotFoundError } from "@/lib/api-errors";

function orderBelongsToStore(order: Awaited<ReturnType<typeof getOrder>>, storeId: string) {
  return order.items.some((i: { product: { storeId: string } }) => i.product.storeId === storeId);
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("STORE_OWNER");
    const storeId = await getMyStoreId(session.userId);
    const order = await getOrder(params.id);
    if (!storeId || !orderBelongsToStore(order, storeId)) throw new NotFoundError("Order not found.");
    return NextResponse.json({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
