import { NextResponse } from "next/server";
import { getOrder } from "@/lib/services/orders";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-errors";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN");
    return NextResponse.json({ order: await getOrder(params.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
