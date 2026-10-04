import { NextRequest, NextResponse } from "next/server";
import { overrideOrderStatus } from "@/lib/services/orders";
import { requireRole } from "@/lib/session";
import { adminOverrideSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/api-errors";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = adminOverrideSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("A target status and a reason (min 3 characters) are required.", parsed.error.flatten().fieldErrors as any);
    }
    const order = await overrideOrderStatus(params.id, parsed.data);
    return NextResponse.json({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
