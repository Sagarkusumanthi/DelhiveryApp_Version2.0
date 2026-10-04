import { NextResponse } from "next/server";
import { listAllOrders } from "@/lib/services/orders";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const orders = await listAllOrders();
    return NextResponse.json({ orders });
  } catch (err) {
    return handleApiError(err);
  }
}
