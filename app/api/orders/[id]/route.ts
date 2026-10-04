import { NextResponse } from "next/server";
import { getOrder } from "@/lib/services/orders";
import { requireRole } from "@/lib/session";
import { handleApiError, NotFoundError } from "@/lib/api-errors";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("CUSTOMER");
    const order = await getOrder(params.id);
    if (order.customerId !== session.userId) throw new NotFoundError("Order not found.");
    return NextResponse.json({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
