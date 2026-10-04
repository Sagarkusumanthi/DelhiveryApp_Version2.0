import { NextRequest, NextResponse } from "next/server";
import { confirmDelivery, getOrder } from "@/lib/services/orders";
import { requireRole } from "@/lib/session";
import { deliveryConfirmationSchema } from "@/lib/validation";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/api-errors";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("CUSTOMER");
    const existing = await getOrder(params.id);
    if (existing.customerId !== session.userId) throw new NotFoundError("Order not found.");

    const body = await req.json();
    const parsed = deliveryConfirmationSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid confirmation payload.", parsed.error.flatten().fieldErrors as any);
    }
    const order = await confirmDelivery(params.id, parsed.data);
    return NextResponse.json({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
