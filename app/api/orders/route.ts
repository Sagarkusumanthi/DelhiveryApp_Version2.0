import { NextRequest, NextResponse } from "next/server";
import { createOrder, listOrdersForCustomer } from "@/lib/services/orders";
import { requireRole } from "@/lib/session";
import { checkoutSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireRole("CUSTOMER");
    const orders = await listOrdersForCustomer(session.userId);
    return NextResponse.json({ orders });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("CUSTOMER");
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Please check the highlighted fields.", parsed.error.flatten().fieldErrors as any);
    }
    const order = await createOrder({ customerId: session.userId, input: parsed.data });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
