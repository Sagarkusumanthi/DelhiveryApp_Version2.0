import { NextRequest, NextResponse } from "next/server";
import { getOrder, transitionOrderStatus } from "@/lib/services/orders";
import { getMyStoreId } from "@/lib/services/storeOwner";
import { requireRole } from "@/lib/session";
import { statusTransitionSchema } from "@/lib/validation";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/api-errors";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("STORE_OWNER");
    const storeId = await getMyStoreId(session.userId);
    const existing = await getOrder(params.id);
    const belongsToStore = storeId && existing.items.some((i: { product: { storeId: string } }) => i.product.storeId === storeId);
    if (!belongsToStore) throw new NotFoundError("Order not found.");

    const body = await req.json();
    const parsed = statusTransitionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid status transition.", parsed.error.flatten().fieldErrors as any);
    }
    const order = await transitionOrderStatus(params.id, { ...parsed.data, role: "STORE" });
    return NextResponse.json({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
